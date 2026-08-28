import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { createSiteRegistry, includeRegisteredSites, changeSiteRegistry, relationKey } from '../lib/secondarySiteRegistry.js'
import { handleSiteManagement, readSiteRegistry, writeSiteRegistry, SITE_REGISTRY_KEY } from '../lib/secondarySiteManagement.js'
import { SECONDARY_SITES } from '../lib/secondarySites.js'
import { DOMAIN_REGISTRY } from '../lib/domainRegistry.js'
import { ACCOUNT_SUBSITE_ORIGINS } from '../lib/subsiteOrigins.js'
import { ADMIN_NAV_GROUPS } from '../lib/adminRoutes.js'

const origin = 'https://admin.2aran.com'
function request(body, source = origin, extra = {}) {
  return new Request(`${origin}/api/admin/subsites`, body === undefined ? {} : {
    method: 'POST', headers: { Origin: source, 'Content-Type': 'application/json', ...extra },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}
const newSite = () => ({ ...createSiteRegistry().sites[1], id: 'test', domain: 'test.2aran.com', label: '测试站点' })
const edgeAction = (source, target, type = 'dependency', status = 'active') => ({ type: 'save-relation', relation: { source, target, type, status, note: '' } })

async function fixture(t) {
  const sqlite = new DatabaseSync(':memory:')
  t.after(() => sqlite.close())
  sqlite.exec(await readFile(new URL('../migrations/0040_site_settings.sql', import.meta.url), 'utf8'))
  const db = { prepare(sql) {
    const statement = sqlite.prepare(sql)
    return { bind(...args) { return {
      async first() { return statement.get(...args) || null },
      async run() { return { meta: { changes: Number(statement.run(...args).changes) } } },
    } } }
  } }
  const services = { getD1: () => db, getOwnerOrReject: async () => ({ ok: true, user: { login: 'test-owner' } }) }
  return { sqlite, db, services, invoke: (req) => handleSiteManagement(req, services) }
}

test('registry seeds the existing sites and separates planned integration from active relationships', () => {
  const registry = createSiteRegistry()
  const expectedIds = new Set(['main', ...SECONDARY_SITES.map((site) => site.id), ...DOMAIN_REGISTRY.map((site) => site.id)])
  assert.deepEqual(new Set(registry.sites.map((site) => site.id)), expectedIds)
  assert.equal(registry.relations.find((edge) => edge.source === 'weekly' && edge.type === 'account').status, 'planned')
  assert.equal(registry.relations.find((edge) => edge.source === 'workbuddy' && edge.type === 'points').status, 'active')
  assert.equal(registry.relations.find((edge) => edge.source === 'rank' && edge.type === 'deployment').target, 'main')
})

test('internal services and legacy domains are managed without entering the public directory', () => {
  const publicBefore = JSON.stringify(SECONDARY_SITES)
  const registry = createSiteRegistry()
  for (const id of ['ollama', 'admin', 'ops']) {
    const site = registry.sites.find((item) => item.id === id)
    assert.equal(site.domain, `${id}.2aran.com`)
    assert.equal(site.audience, 'private')
    assert.equal(site.category, '内部服务')
    assert.ok(registry.relations.some((edge) => edge.source === id && edge.target === 'main' && edge.type === 'parent'))
  }
  assert.equal(registry.sites.find((site) => site.id === 'ollama').platform, 'Cloudflare Tunnel')
  assert.equal(registry.sites.find((site) => site.id === 'ops').status, 'legacy')
  const ollama = registry.sites.find((site) => site.id === 'ollama')
  const edited = changeSiteRegistry(registry, { type: 'save-site', site: { ...ollama, notes: '仅限本人访问' } })
  assert.equal(edited.sites.find((site) => site.id === 'ollama').notes, '仅限本人访问')
  assert.equal(JSON.stringify(SECONDARY_SITES), publicBefore)
  assert.ok(!SECONDARY_SITES.some((site) => ['ollama', 'admin', 'ops'].includes(site.id)))
})

test('saved older registries gain missing services without overwriting edits or removed relationships', async (t) => {
  const { db, sqlite } = await fixture(t)
  const old = createSiteRegistry()
  old.revision = 8
  old.sites = old.sites.filter((site) => site.audience !== 'private').map(({ audience: _audience, ...site }) => site)
  old.sites.find((site) => site.id === 'rank').notes = '保留人工备注'
  const existingIds = new Set(old.sites.map((site) => site.id))
  old.relations = old.relations.filter((edge) => existingIds.has(edge.source) && edge.source !== 'rank')
  const raw = JSON.stringify(old)
  sqlite.prepare('INSERT INTO site_settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)').run(SITE_REGISTRY_KEY, raw, 123, 'prior-owner')
  const current = await readSiteRegistry(db)
  assert.equal(current.raw, raw)
  assert.equal(current.registry.revision, 8)
  assert.equal(current.registry.sites.find((site) => site.id === 'rank').notes, '保留人工备注')
  assert.equal(current.registry.sites.find((site) => site.id === 'rank').audience, 'public')
  assert.equal(current.registry.sites.find((site) => site.id === 'ollama').audience, 'private')
  assert.ok(!current.registry.relations.some((edge) => edge.source === 'rank'))
  assert.deepEqual(includeRegisteredSites(current.registry), current.registry)
  assert.equal(sqlite.prepare('SELECT value FROM site_settings WHERE key = ?').get(SITE_REGISTRY_KEY).value, raw)
  const next = changeSiteRegistry(current.registry, edgeAction('admin', 'ollama'))
  await writeSiteRegistry(db, current, next, { id: 'owner' })
  assert.equal((await readSiteRegistry(db)).registry.revision, 9)
  const saved = JSON.parse(sqlite.prepare('SELECT value FROM site_settings WHERE key = ?').get(SITE_REGISTRY_KEY).value)
  assert.equal(saved.sites.find((site) => site.id === 'ollama').audience, 'private')
})

test('inventory enrichment preserves conflicting custom records and uses private as the unknown default', () => {
  const old = createSiteRegistry()
  old.sites = old.sites.filter((site) => site.id !== 'ollama')
  old.relations = old.relations.filter((edge) => edge.source !== 'ollama')
  old.sites.push({ ...newSite(), id: 'custom-ollama', domain: 'ollama.2aran.com', audience: undefined })
  const next = includeRegisteredSites(old)
  assert.equal(next.sites.filter((site) => site.domain === 'ollama.2aran.com').length, 1)
  assert.equal(next.sites.find((site) => site.id === 'custom-ollama').audience, 'private')
  assert.ok(!next.relations.some((edge) => edge.source === 'ollama'))
})

test('site edits validate domains, unique identifiers, enums and repository URLs without mutating public data', () => {
  const current = createSiteRegistry()
  const before = JSON.stringify(SECONDARY_SITES)
  const origins = [...ACCOUNT_SUBSITE_ORIGINS]
  const next = changeSiteRegistry(current, { type: 'save-site', create: true, site: newSite() })
  assert.equal(next.revision, 1)
  assert.equal(current.revision, 0)
  assert.equal(next.sites.length, current.sites.length + 1)
  for (const patch of [
    { domain: 'https://test.2aran.com' }, { domain: 'evil.test' }, { domain: 'test.2aran.com.evil.test' },
    { domain: 'test.2aran.com:443' }, { domain: 'admin.2aran.com' }, { domain: 'workbuddy.2aran.com' },
    { domain: '-test.2aran.com' }, { id: 'Bad ID' }, { label: '' }, { label: 7 },
    { status: 'unknown' }, { audience: 'invalid' }, { repository: 'javascript:alert(1)' }, { repository: 'https://user:pass@example.com/repo' },
  ]) assert.throws(() => changeSiteRegistry(current, { type: 'save-site', create: true, site: { ...newSite(), ...patch } }))
  assert.throws(() => changeSiteRegistry(next, { type: 'save-site', create: true, site: newSite() }), /标识已存在/)
  assert.throws(() => changeSiteRegistry(current, { type: 'save-site', site: newSite() }), /站点不存在/)
  const edited = changeSiteRegistry(next, { type: 'save-site', site: { ...newSite(), label: '新名称' } })
  assert.equal(edited.sites.at(-1).label, '新名称')
  assert.equal(JSON.stringify(SECONDARY_SITES), before)
  assert.deepEqual(ACCOUNT_SUBSITE_ORIGINS, origins)
})

test('relationship operations reject self links, missing endpoints, cycles, duplicate parents and duplicate creation', () => {
  const registry = createSiteRegistry()
  for (const action of [edgeAction('weekly', 'weekly'), edgeAction('weekly', 'missing'), edgeAction('weekly', 'main', 'bad')]) {
    assert.throws(() => changeSiteRegistry(registry, action))
  }
  assert.throws(() => changeSiteRegistry(registry, { ...edgeAction('weekly', 'main', 'parent'), create: true }), /关系已存在/)
  assert.throws(() => changeSiteRegistry(registry, edgeAction('weekly', 'rank', 'parent')), /一个.*归属关系/)
  assert.throws(() => changeSiteRegistry(registry, edgeAction('main', 'weekly', 'parent')), /主站不能/)
  for (const type of ['dependency', 'deployment']) {
    const first = changeSiteRegistry(registry, edgeAction('weekly', 'syncblog', type))
    const second = changeSiteRegistry(first, edgeAction('syncblog', 'rank', type))
    assert.throws(() => changeSiteRegistry(second, edgeAction('rank', 'weekly', type)), /循环/)
  }
  let next = changeSiteRegistry(registry, edgeAction('weekly', 'syncblog'))
  next = changeSiteRegistry(next, edgeAction('weekly', 'syncblog', 'dependency', 'disabled'))
  assert.equal(next.relations.filter((edge) => edge.source === 'weekly' && edge.target === 'syncblog').length, 1)
  next = changeSiteRegistry(next, { type: 'delete-relation', key: 'weekly:dependency:syncblog' })
  assert.ok(!next.relations.some((edge) => relationKey(edge) === 'weekly:dependency:syncblog'))
})

test('archiving preserves the site and requires active relationships to be disabled first', () => {
  const current = createSiteRegistry()
  const site = current.sites.find((item) => item.id === 'poemcn')
  const action = { type: 'save-site', site: { ...site, status: 'archived' } }
  assert.throws(() => changeSiteRegistry(current, action), /归档前请停用/)
  const disabled = changeSiteRegistry(current, edgeAction('poemcn', 'main', 'parent', 'disabled'))
  const archived = changeSiteRegistry(disabled, action)
  assert.equal(archived.sites.length, current.sites.length)
  assert.equal(archived.sites.find((item) => item.id === 'poemcn').status, 'archived')
  assert.throws(() => changeSiteRegistry(archived, edgeAction('rank', 'poemcn')), /归档前请停用/)
  const restored = changeSiteRegistry(archived, { type: 'save-site', site })
  assert.equal(restored.sites.find((item) => item.id === 'poemcn').status, 'active')
})

test('all reads and writes require owner auth before accessing the database', async () => {
  for (const status of [401, 403]) for (const req of [request(), request({})]) {
    const response = await handleSiteManagement(req, {
      getOwnerOrReject: async () => ({ ok: false, response: Response.json({ error: 'DENIED' }, { status }) }),
      getD1: () => { throw new Error('Must not access database') },
    })
    assert.equal(response.status, status)
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store')
  }
})

test('API persists sites and relationships with revisions and leaves other settings untouched', async (t) => {
  const { invoke, sqlite } = await fixture(t)
  const initial = await invoke(request())
  assert.equal(initial.headers.get('Cache-Control'), 'private, no-store')
  assert.equal((await initial.json()).registry.revision, 0)
  let response = await invoke(request({ revision: 0, action: { type: 'save-site', create: true, site: newSite() } }))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).updatedBy, 'test-owner')
  response = await invoke(request({ revision: 1, action: edgeAction('test', 'main', 'account', 'planned') }))
  assert.equal(response.status, 200)
  const persisted = (await (await invoke(request())).json()).registry
  assert.equal(persisted.revision, 2)
  assert.ok(persisted.sites.some((site) => site.id === 'test'))
  assert.ok(persisted.relations.some((edge) => edge.source === 'test'))
  assert.equal(sqlite.prepare("SELECT value FROM site_settings WHERE key = 'ads.enabled'").get().value, 'true')
  response = await invoke(request({ revision: 0, action: edgeAction('weekly', 'rank') }))
  assert.equal(response.status, 409)
  assert.equal((await (await invoke(request())).json()).registry.revision, 2)
})

test('compare-and-swap detects both first-save races and later concurrent edits', async (t) => {
  const { db } = await fixture(t)
  for (let i = 0; i < 2; i++) {
    const a = await readSiteRegistry(db)
    const b = await readSiteRegistry(db)
    const next = changeSiteRegistry(a.registry, edgeAction('weekly', 'rank'))
    await writeSiteRegistry(db, a, next, { id: 'a' })
    await assert.rejects(writeSiteRegistry(db, b, next, { id: 'b' }), (error) => error.status === 409)
  }
})

test('same-origin JSON is required and invalid payloads never change the registry', async (t) => {
  const { invoke, db } = await fixture(t)
  for (const source of ['https://weekly.2aran.com', 'https://evil.test', 'null', '']) {
    assert.equal((await invoke(request({}, source))).status, 403)
  }
  assert.equal((await invoke(request({}, origin, { 'Content-Type': 'text/plain' }))).status, 415)
  assert.equal((await invoke(request('{broken'))).status, 400)
  assert.equal((await invoke(request(' '.repeat(16001)))).status, 413)
  assert.equal((await invoke(request({ revision: 0, action: { type: 'bad' } }))).status, 400)
  assert.equal((await readSiteRegistry(db)).raw, null)
})

test('missing bindings produce read-only defaults; DB failures and corrupted data cannot become successful saves', async (t) => {
  const { services, invoke, sqlite } = await fixture(t)
  const unbound = { ...services, getD1: () => { throw new Error('Missing binding') } }
  assert.equal((await (await handleSiteManagement(request(), unbound)).json()).readOnly, true)
  assert.equal((await handleSiteManagement(request({}), unbound)).status, 503)
  sqlite.prepare('INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)').run(SITE_REGISTRY_KEY, '{broken', 0)
  assert.equal((await invoke(request())).status, 503)
  assert.equal((await invoke(request({ revision: 0, action: edgeAction('weekly', 'rank') }))).status, 503)
  sqlite.exec('DROP TABLE site_settings')
  assert.equal((await invoke(request())).status, 503)
})

test('management page is discoverable in the project workspace and independently guarded by the API', async () => {
  const project = ADMIN_NAV_GROUPS.flatMap((group) => group.items).find((item) => item.href === '/admin/projects')
  assert.ok(project.activePaths.includes('/admin/subsites'))
  assert.ok(project.sections.flatMap((section) => section.items).some((item) => item.href === '/admin/subsites'))
  const page = await readFile(new URL('../app/(admin)/admin/subsites/page.jsx', import.meta.url), 'utf8')
  const route = await readFile(new URL('../app/api/admin/subsites/route.js', import.meta.url), 'utf8')
  assert.match(page, /<AdminPageGate/)
  assert.match(page, /index: false/)
  assert.match(route, /runtime = 'edge'/)
  assert.equal((route.match(/handleSiteManagement\(request, \{ getOwnerOrReject, getD1 \}\)/g) || []).length, 2)
})

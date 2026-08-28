import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import worker from '../src/index.js'
import { mainSessionRoute } from './main-session-helper.mjs'
import { ensureGuestBalance, getBalance, unlockResource } from '../src/points.js'

// Run the actual production SQL against SQLite, including transactional rollback.
function database() {
  const sql = new DatabaseSync(':memory:')
  sql.exec(readFileSync(new URL('../migrations/0001_workbuddy_resources.sql', import.meta.url), 'utf8'))
  sql.exec(`
    CREATE TABLE site_settings (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE site_users (id TEXT PRIMARY KEY, platform_id TEXT, role TEXT);
    CREATE TABLE account_identities (provider TEXT, provider_account_id TEXT, provider_login TEXT, user_id TEXT);
  `)
  const db = {
    prepare(query) {
      let params = []
      const statement = {
        bind(...values) { params = values; return statement },
        execute(kind) {
          const compiled = sql.prepare(query)
          const args = params.length ? [Object.fromEntries(params.map((value, index) => [String(index + 1), value]))] : []
          if (kind === 'first') return compiled.get(...args) || null
          if (kind === 'all') return { results: compiled.all(...args) }
          const result = compiled.run(...args)
          return { meta: { changes: Number(result.changes) } }
        },
        async first() { return statement.execute('first') },
        async all() { return statement.execute('all') },
        async run() { return statement.execute('run') },
      }
      return statement
    },
    async batch(statements) {
      sql.exec('BEGIN')
      try {
        const result = statements.map((statement) => statement.execute('run'))
        sql.exec('COMMIT')
        return result
      } catch (error) { sql.exec('ROLLBACK'); throw error }
    },
  }
  return { sql, db }
}

function setup(t) {
  const { sql, db } = database()
  const objects = new Map()
  const env = {
    DB: db,
    MEDIA: {
      async head(key) { return objects.has(key) ? { size: objects.get(key).length } : null },
      async get(key, options) {
        if (!objects.has(key)) return null
        const body = objects.get(key)
        const range = options?.range
        return { body: range ? body.slice(range.offset, range.offset + range.length) : body, size: body.length, httpEtag: '"test"', writeHttpMetadata() {} }
      },
    },
    ASSETS: { async fetch() { return new Response('shell') } },
  }
  const ctx = { waitUntil(promise) { return promise } }
  const guests = new Map()
  const main = mainSessionRoute({
    getD1: () => db,
    getSecrets: () => ({ sessionSecret: 'main-site-only-test-secret' }),
    getUserFromRequest: async (req) => req.headers.get('cookie')?.includes('tuaran_session=verified-session')
      ? { id: 'acct_demo', name: '测试账号' } : null,
    getOrIssueGuest: async (req) => {
      const token = /(?:^|;\s*)tuaran_guest=([^;]+)/.exec(req.headers.get('cookie') || '')?.[1]
      if (guests.has(token)) return { gid: guests.get(token), setCookie: null }
      const gid = crypto.randomUUID()
      const issued = crypto.randomUUID()
      guests.set(issued, gid)
      return { gid, setCookie: `tuaran_guest=${issued}; Path=/; Secure; HttpOnly; Domain=.2aran.com` }
    },
  })
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://2aran.com/api/workbuddy/session')
    return main(new Request(url, options))
  })
  const call = (path, options = {}) => worker.fetch(new Request(`https://workbuddy.2aran.com${path}`, options), env, ctx)
  function addFile() {
    sql.exec(`INSERT INTO workbuddy_files (id, resource_id, label, object_key, file_name, content_type, delivery, created_at)
      VALUES ('guide', 'wb-beginner', 'PDF', 'private/guide.pdf', 'guide.pdf', 'application/pdf', 'both', 1)`)
    objects.set('private/guide.pdf', 'test-pdf')
  }
  return { sql, db, env, call, objects, addFile }
}

test('guest reward is atomic, honors shared rules, and is only awarded once', async () => {
  const { db, sql } = database()
  sql.exec("INSERT INTO site_settings VALUES ('ranbi.guestSeed', '25')")
  const actor = { userId: 'guest:demo', isGuest: true }
  await Promise.all([ensureGuestBalance(db, actor), ensureGuestBalance(db, actor)])
  assert.equal(await getBalance(db, actor.userId), 25)
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM point_ledger').get().n, 1)
  sql.close()
})

test('concurrent duplicate unlocks debit once and keep ledger and balance consistent', async () => {
  const { db, sql } = database()
  const actor = { userId: 'guest:demo', isGuest: true }
  await ensureGuestBalance(db, actor)
  const resource = { resourceKey: 'workbuddy:test', costPoints: 5 }
  const results = await Promise.all(Array.from({ length: 10 }, () => unlockResource(db, actor, resource)))
  assert.ok(results.every((result) => result.ok))
  assert.equal(await getBalance(db, actor.userId), 45)
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM point_ledger WHERE reason='unlock'").get().n, 1)
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM resource_unlocks').get().n, 1)
  assert.equal(sql.prepare('SELECT SUM(delta) AS n FROM point_ledger').get().n, 45)
  sql.close()
})

test('parallel purchases cannot overdraw a shared balance', async () => {
  const { db, sql } = database()
  const actor = { userId: 'guest:demo', isGuest: true }
  await ensureGuestBalance(db, actor)
  const results = await Promise.all(Array.from({ length: 12 }, (_, index) => unlockResource(db, actor, { resourceKey: `workbuddy:${index}`, costPoints: 10 })))
  assert.equal(results.filter((result) => result.ok).length, 5)
  assert.equal(await getBalance(db, actor.userId), 0)
  assert.equal(sql.prepare('SELECT SUM(delta) AS n FROM point_ledger').get().n, 0)
  sql.close()
})

test('an entitlement write failure rolls back the debit and ledger', async () => {
  const { db, sql } = database()
  const actor = { userId: 'guest:demo', isGuest: true }
  await ensureGuestBalance(db, actor)
  sql.exec("CREATE TRIGGER simulate_failure BEFORE INSERT ON resource_unlocks BEGIN SELECT RAISE(ABORT, 'failed'); END")
  await assert.rejects(unlockResource(db, actor, { resourceKey: 'workbuddy:test', costPoints: 5 }))
  assert.equal(await getBalance(db, actor.userId), 50)
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM point_ledger WHERE reason='unlock'").get().n, 0)
  sql.close()
})

test('API rejects empty resources and missing objects without creating a debit', async (t) => {
  const { call, sql, addFile, objects } = setup(t)
  const options = { method: 'POST', headers: { origin: 'https://workbuddy.2aran.com' } }
  assert.equal((await call('/api/resources/workbuddy-beginner-guide/unlock', options)).status, 409)
  addFile()
  objects.clear()
  assert.equal((await call('/api/resources/workbuddy-beginner-guide/unlock', options)).status, 409)
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM point_ledger').get().n, 0)
  sql.close()
})

test('API reads shared prices and only streams files after an explicit unlock', async (t) => {
  const { call, sql, addFile } = setup(t)
  addFile()
  sql.exec("UPDATE gated_resources SET cost_points=9 WHERE resource_key='workbuddy:workbuddy-beginner-guide'")
  const me = await call('/api/me')
  const cookie = me.headers.get('set-cookie').split(';')[0]
  const headers = { cookie, origin: 'https://workbuddy.2aran.com' }
  const path = '/api/resources/workbuddy-beginner-guide'
  const detail = await (await call(path, { headers })).json()
  assert.equal(detail.resource.costPoints, 9)
  assert.equal((await call(`${path}/files/guide`, { headers })).status, 403)
  const result = await (await call(`${path}/unlock`, { method: 'POST', headers })).json()
  assert.equal(result.balance, 41)
  assert.equal((await (await call(`${path}/unlock`, { method: 'POST', headers })).json()).balance, 41)
  const file = await call(`${path}/files/guide?mode=read`, { headers })
  assert.equal(file.status, 200)
  assert.match(file.headers.get('content-disposition'), /^inline;/)
  assert.equal(file.headers.get('cache-control'), 'private, no-store')
  assert.equal(await file.text(), 'test-pdf')
  const partial = await call(`${path}/files/guide?mode=read`, { headers: { ...headers, range: 'bytes=0-3' } })
  assert.equal(partial.status, 206)
  assert.equal(partial.headers.get('content-range'), 'bytes 0-3/8')
  assert.equal(await partial.text(), 'test')
  assert.equal((await call(`${path}/files/guide`, { headers: { ...headers, range: 'bytes=999-' } })).status, 416)
  sql.close()
})

test('video playback requires unlock and supports seeking without a second charge', async (t) => {
  const { call, sql, objects } = setup(t)
  sql.exec(`INSERT INTO workbuddy_files (id,resource_id,label,object_key,file_name,content_type,delivery,created_at)
    VALUES ('lesson-01','wb-video','第一节','private/lesson.mp4','第一节.mp4','video/mp4','both',1)`)
  objects.set('private/lesson.mp4', 'test-video-content')
  const me = await call('/api/me')
  const headers = { cookie: me.headers.get('set-cookie').split(';')[0], origin: 'https://workbuddy.2aran.com' }
  const path = '/api/resources/workbuddy-workplace-video-course'
  assert.equal((await call(`${path}/files/lesson-01?mode=read`, { headers })).status, 403)
  const unlocked = await (await call(`${path}/unlock`, { method: 'POST', headers })).json()
  assert.equal(unlocked.balance, 40)
  const partial = await call(`${path}/files/lesson-01?mode=read`, { headers: { ...headers, range: 'bytes=5-9' } })
  assert.equal(partial.status, 206)
  assert.equal(partial.headers.get('content-type'), 'video/mp4')
  assert.equal(partial.headers.get('content-range'), 'bytes 5-9/18')
  assert.match(partial.headers.get('content-disposition'), /^inline;/)
  assert.equal(await partial.text(), 'video')
  const download = await call(`${path}/files/lesson-01?mode=download`, { headers })
  assert.match(download.headers.get('content-disposition'), /^attachment;/)
  assert.equal((await (await call('/api/me', { headers })).json()).balance, 40)
  sql.close()
})

test('server-side search and pagination include resources beyond the first page', async (t) => {
  const { call, sql } = setup(t)
  const insert = sql.prepare("INSERT INTO workbuddy_resources (id, slug, resource_key, title, status, updated_at) VALUES (?,?,?,?, 'published', 1)")
  for (let index = 0; index < 30; index++) insert.run(`page-${index}`, `page-${index}`, `workbuddy:page-${index}`, `测试资料 ${index}`)
  const first = await (await call('/api/resources')).json()
  const second = await (await call('/api/resources?page=2')).json()
  assert.equal(first.resources.length, 24)
  assert.equal(second.resources.length, 12)
  assert.equal(first.total, 36)
  assert.equal(first.hasMore, true)
  assert.equal(new Set([...first.resources, ...second.resources].map((item) => item.id)).size, 36)
  const search = await (await call('/api/resources?q=测试资料%2029')).json()
  assert.equal(search.total, 1)
  assert.equal(search.resources[0].slug, 'page-29')
  assert.equal((await (await call('/api/resources?q=%25')).json()).total, 0)
  sql.close()
})

test('main-site canonical account identity is used without a Worker secret; blocked accounts are rejected', async (t) => {
  const { call, sql, env, addFile } = setup(t)
  addFile()
  sql.exec("INSERT INTO site_users VALUES ('github:42','acct_demo','blocked'); INSERT INTO account_identities VALUES ('github','42','demo','acct_demo')")
  assert.equal(env.NEXTAUTH_SECRET, undefined)
  const token = 'verified-session'
  assert.equal((await call('/api/me', { headers: { cookie: `tuaran_session=${token}` } })).status, 403)
  sql.exec("UPDATE site_users SET role='member'; INSERT INTO user_points VALUES ('acct_demo',99,1)")
  assert.equal((await (await call('/api/me', { headers: { cookie: `tuaran_session=${token}` } })).json()).balance, 99)
  sql.close()
})

test('upstream failure prevents guest awards, debits and file access', async (t) => {
  const { call, sql, addFile } = setup(t)
  addFile()
  t.mock.method(globalThis, 'fetch', async () => new Response('unavailable', { status: 503 }))
  const path = '/api/resources/workbuddy-beginner-guide'
  assert.equal((await call('/api/me')).status, 503)
  assert.equal((await call(`${path}/unlock`, { method: 'POST', headers: { origin: 'https://workbuddy.2aran.com' } })).status, 503)
  assert.equal((await call(`${path}/files/guide`)).status, 503)
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM point_ledger').get().n, 0)
  sql.close()
})

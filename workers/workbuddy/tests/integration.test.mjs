import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import worker from '../src/index.js'
import { signToken } from '../src/auth.js'
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

function setup() {
  const { sql, db } = database()
  const objects = new Map()
  const env = {
    DB: db, NEXTAUTH_SECRET: 'workbuddy-test-key', COOKIE_DOMAIN: '.2aran.com',
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

test('API rejects empty resources and missing objects without creating a debit', async () => {
  const { call, sql, addFile, objects } = setup()
  const options = { method: 'POST', headers: { origin: 'https://workbuddy.2aran.com' } }
  assert.equal((await call('/api/resources/workbuddy-beginner-guide/unlock', options)).status, 409)
  addFile()
  objects.clear()
  assert.equal((await call('/api/resources/workbuddy-beginner-guide/unlock', options)).status, 409)
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM point_ledger').get().n, 0)
  sql.close()
})

test('API reads shared prices and only streams files after an explicit unlock', async () => {
  const { call, sql, addFile } = setup()
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

test('server-side search and pagination include resources beyond the first page', async () => {
  const { call, sql } = setup()
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

test('shared legacy sessions use canonical account IDs and blocked users cannot spend', async () => {
  const { call, sql, env, addFile } = setup()
  addFile()
  sql.exec("INSERT INTO site_users VALUES ('github:42','acct_demo','blocked'); INSERT INTO account_identities VALUES ('github','42','demo','acct_demo')")
  const token = await signToken({ user: { id: 'github:42', provider: 'github' } }, env.NEXTAUTH_SECRET)
  assert.equal((await call('/api/me', { headers: { cookie: `tuaran_session=${token}` } })).status, 403)
  sql.exec("UPDATE site_users SET role='member'; INSERT INTO user_points VALUES ('acct_demo',99,1)")
  assert.equal((await (await call('/api/me', { headers: { cookie: `tuaran_session=${token}` } })).json()).balance, 99)
  sql.close()
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { DatabaseSync } from 'node:sqlite'

import {
  getGuestDirectoryEntry,
  getGuestDirectoryStats,
  listGuestDirectory,
} from '../lib/guestDirectory.js'

function fakeD1({ allRows = [], firstRows = [] } = {}) {
  const calls = []
  return {
    calls,
    prepare(sql) {
      const call = { sql, binds: [] }
      calls.push(call)
      const statement = {
        bind(...binds) {
          call.binds = binds
          return statement
        },
        async all() {
          return { results: allRows }
        },
        async first() {
          return firstRows.shift() || null
        },
      }
      return statement
    },
  }
}

test('游客列表只查询物化目录并限制为当前页', async () => {
  const rows = Array.from({ length: 31 }, (_, index) => ({
    user_id: `guest:${String(index).padStart(2, '0')}`,
    last_seen_at: 1000 - index,
  }))
  const db = fakeD1({ allRows: rows })
  const result = await listGuestDirectory(db, { limit: 30, status: 'active' })

  assert.equal(result.guests.length, 30)
  assert.equal(result.page.hasMore, true)
  assert.match(result.page.nextCursor, /^971:guest%3A29$/)
  assert.equal(db.calls.length, 1)
  assert.match(db.calls[0].sql, /FROM guest_directory/)
  assert.match(db.calls[0].sql, /is_bound = \?1/)
  assert.doesNotMatch(db.calls[0].sql, /point_ledger|resource_unlocks|article_comments|guest_bindings/)
  assert.deepEqual(db.calls[0].binds, [0, 31])
})

test('游客深分页使用复合游标范围，不使用 OFFSET 或 OR 回扫', async () => {
  const db = fakeD1({ allRows: [] })
  await listGuestDirectory(db, { limit: 30, status: 'bound', cursor: '971:guest%3A29' })

  assert.match(db.calls[0].sql, /\(last_seen_at, user_id\) < \(\?2, \?3\)/)
  assert.match(db.calls[0].sql, /ORDER BY last_seen_at DESC, user_id DESC/)
  assert.doesNotMatch(db.calls[0].sql, /\bOFFSET\b|last_seen_at\s*</i)
  assert.deepEqual(db.calls[0].binds, [1, 971, 'guest:29', 31])
})

test('游客详情按主键 user_id 查询，全局统计只读单行汇总', async () => {
  const db = fakeD1({
    firstRows: [
      { user_id: 'guest:abc', balance: 9, last_seen_at: 123 },
      { id: 1, total: 10, active: 8, bound: 2 },
    ],
  })
  const guest = await getGuestDirectoryEntry(db, 'guest:abc')
  const stats = await getGuestDirectoryStats(db)

  assert.equal(guest.userId, 'guest:abc')
  assert.equal(stats.total, 10)
  assert.match(db.calls[0].sql, /WHERE user_id = \?1/)
  assert.deepEqual(db.calls[0].binds, ['guest:abc'])
  assert.equal(db.calls[1].sql, 'SELECT * FROM guest_stats WHERE id = 1')
})

test('0088 迁移回填目录，并通过触发器增量维护目录和全局统计', () => {
  const db = new DatabaseSync(':memory:')
  db.exec(`
    CREATE TABLE user_points (user_id TEXT PRIMARY KEY, balance INTEGER NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE point_ledger (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, delta INTEGER NOT NULL, reason TEXT NOT NULL, ref TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL);
    CREATE TABLE resource_unlocks (user_id TEXT NOT NULL, resource_key TEXT NOT NULL, unlocked_at INTEGER NOT NULL, cost_points INTEGER, PRIMARY KEY (user_id, resource_key));
    CREATE TABLE article_comments (id INTEGER PRIMARY KEY AUTOINCREMENT, article_key TEXT NOT NULL, user_id TEXT NOT NULL, user_provider TEXT NOT NULL, user_name TEXT NOT NULL, user_image TEXT, message TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE guest_bindings (gid TEXT PRIMARY KEY, user_id TEXT NOT NULL, bound_at INTEGER NOT NULL);
    CREATE INDEX idx_point_ledger_user_created ON point_ledger(user_id, created_at DESC);
    CREATE INDEX idx_article_comments_user_created ON article_comments(user_id, created_at DESC);
    INSERT INTO user_points VALUES ('guest:old', 7, 100);
    INSERT INTO point_ledger (user_id, delta, reason, ref, created_at) VALUES ('guest:old', 10, 'comment', 'c:1', 90), ('guest:old', -3, 'unlock', 'r:1', 100);
    INSERT INTO resource_unlocks VALUES ('guest:old', 'r:1', 100, 3);
  `)
  db.exec(readFileSync(new URL('../migrations/0088_guest_directory_stats.sql', import.meta.url), 'utf8'))

  let guest = db.prepare("SELECT * FROM guest_directory WHERE user_id = 'guest:old'").get()
  let stats = db.prepare('SELECT * FROM guest_stats WHERE id = 1').get()
  assert.deepEqual([guest.balance, guest.earned, guest.spent, guest.unlock_count], [7, 10, 3, 1])
  assert.deepEqual([stats.total, stats.active, stats.total_balance, stats.total_spent], [1, 1, 7, 3])

  db.exec(`
    INSERT INTO article_comments (article_key, user_id, user_provider, user_name, message, created_at)
    VALUES ('article:a', 'guest:new', 'guest', '游客', '好', 200);
    INSERT INTO point_ledger (user_id, delta, reason, ref, created_at)
    VALUES ('guest:new', 5, 'comment', 'c:2', 201);
    INSERT INTO user_points VALUES ('guest:new', 5, 201);
    INSERT INTO guest_bindings VALUES ('new', 'github:1', 202);
  `)
  guest = db.prepare("SELECT * FROM guest_directory WHERE user_id = 'guest:new'").get()
  stats = db.prepare('SELECT * FROM guest_stats WHERE id = 1').get()
  assert.deepEqual([guest.balance, guest.earned, guest.comment_count, guest.is_bound], [5, 5, 1, 1])
  assert.deepEqual([stats.total, stats.active, stats.bound, stats.comments], [2, 1, 1, 1])

  const listPlan = db
    .prepare("EXPLAIN QUERY PLAN SELECT * FROM guest_directory WHERE is_bound = 0 AND (last_seen_at, user_id) < (202, 'guest:zzz') ORDER BY last_seen_at DESC, user_id DESC LIMIT 31")
    .all()
    .map((row) => row.detail)
    .join(' ')
  const detailPlan = db
    .prepare("EXPLAIN QUERY PLAN SELECT * FROM guest_directory WHERE user_id = 'guest:new' LIMIT 1")
    .all()
    .map((row) => row.detail)
    .join(' ')
  const statsPlan = db
    .prepare('EXPLAIN QUERY PLAN SELECT * FROM guest_stats WHERE id = 1')
    .all()
    .map((row) => row.detail)
    .join(' ')
  assert.match(
    listPlan,
    /SEARCH guest_directory USING INDEX idx_guest_directory_bound_recent \(is_bound=\? AND \(last_seen_at,user_id\)<\(\?,\?\)\)/
  )
  assert.match(detailPlan, /SEARCH guest_directory USING INDEX sqlite_autoindex_guest_directory_1/)
  assert.match(statsPlan, /SEARCH guest_stats USING INTEGER PRIMARY KEY/)

  db.close()
})

// Cache tests measure database calls, including concurrent refreshes and retries.
const { createGuestDirectoryCache } = await import('../lib/guestDirectoryCache.js')

test('同页并发请求和一分钟内重复访问只读一次，过期后重新查询', async () => {
  let time = 1000
  const read = createGuestDirectoryCache({ now: () => time })
  const db = fakeD1()
  const [a, b] = await Promise.all([read(db), read(db)])
  assert.equal(a, b)
  assert.equal(db.calls.length, 2)
  time += 59_999
  assert.equal(await read(db), a)
  assert.equal(db.calls.length, 2)
  time += 1
  assert.notEqual(await read(db), a)
  assert.equal(db.calls.length, 4)
})

test('筛选、游标、数据库隔离；手动刷新使旧分页失效', async () => {
  const read = createGuestDirectoryCache()
  const db = fakeD1()
  const active = { status: 'active' }
  const next = { status: 'active', cursor: '971:guest%3A29' }
  await read(db, active)
  await read(db, next)
  await read(db, { status: 'bound' })
  await read(db, active)
  assert.equal(db.calls.length, 6)
  const other = fakeD1()
  await read(other, active)
  assert.equal(other.calls.length, 2)
  await read(db, active, true)
  await read(db, next)
  assert.equal(db.calls.length, 10)
})

test('缓存数量有上限，被淘汰的页重新查询', async () => {
  const read = createGuestDirectoryCache({ maxEntries: 2 })
  const db = fakeD1()
  for (const status of ['active', 'bound', 'all', 'active']) await read(db, { status })
  assert.equal(db.calls.length, 8)
})

test('查询失败不缓存，下一次请求可以恢复', async () => {
  const read = createGuestDirectoryCache()
  const db = fakeD1()
  const prepare = db.prepare
  db.prepare = () => { throw new Error('D1 unavailable') }
  await assert.rejects(read(db), /D1 unavailable/)
  db.prepare = prepare
  assert.equal((await read(db)).guests.length, 0)
  assert.equal(db.calls.length, 2)
})

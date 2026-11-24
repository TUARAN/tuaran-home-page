import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'

import { readUserPointsTotals, reconcileUserPointsSummary, scanUserPointsTotals } from '../../lib/ledger/pointsSummary.mjs'

const migration = (name) => readFileSync(new URL(`../../migrations/${name}`, import.meta.url), 'utf8')
const DAY = 24 * 60 * 60 * 1000

function d1Adapter(sqlite) {
  return {
    prepare(sql) {
      const statement = sqlite.prepare(sql)
      const execute = (values) => ({
        async run() {
          return { meta: { changes: statement.run(...values).changes } }
        },
        async all() {
          return { results: statement.all(...values) }
        },
        async first() {
          return statement.get(...values) || null
        },
      })
      return {
        ...execute([]),
        bind(...values) {
          return execute(values)
        },
      }
    },
  }
}

function setup({ withSummary = true } = {}) {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(`
    CREATE TABLE point_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      delta INTEGER NOT NULL,
      reason TEXT NOT NULL,
      ref TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX idx_point_ledger_idem ON point_ledger(user_id, reason, ref);
    CREATE TABLE user_points (
      user_id TEXT PRIMARY KEY,
      balance INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );
    INSERT INTO point_ledger (user_id, delta, reason, ref, created_at) VALUES
      ('guest:a', 50, 'guest_seed', 'guest_seed', 1),
      ('guest:a', -5, 'unlock', 'unlock:resource:a', 2),
      ('email:b', 100, 'register', 'register', 3);
    INSERT INTO user_points (user_id, balance, updated_at) VALUES ('guest:a', 999, 1);
  `)
  sqlite.exec(migration('0100_fixed_ranbi_supply.sql'))
  if (withSummary) sqlite.exec(migration('0136_user_points_summary.sql'))
  return sqlite
}

function summary(db) {
  return db.prepare('SELECT identities, circulating, max_updated_at, synced_at FROM user_points_summary WHERE id = 1').get()
}

test('迁移回填后计数器等于全表聚合', async () => {
  const sqlite = setup()
  const db = d1Adapter(sqlite)
  const totals = await scanUserPointsTotals(db)
  const counters = summary(sqlite)
  assert.equal(counters.identities, totals.identities)
  assert.equal(counters.circulating, totals.circulating)
  assert.equal(counters.max_updated_at, totals.updatedAt)
  assert.ok(totals.identities >= 2, '两个历史身份都应计入')
})

test('转账后计数器跟随：新身份 +1，余额变动按差额累加', async () => {
  const sqlite = setup()
  const db = d1Adapter(sqlite)
  const before = summary(sqlite)

  // 池 → 新用户：人数 +1，流通量 +30
  sqlite.prepare('INSERT INTO ranbi_transfers (from_account, to_account, amount, reason, ref, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run('pool:community', 'email:new', 30, 'register', 'register:new', 10)
  const afterJoin = summary(sqlite)
  assert.equal(afterJoin.identities, before.identities + 1)
  assert.equal(afterJoin.circulating, before.circulating + 30)

  // 老用户 → 黑洞：人数不变，流通量 -20
  sqlite.prepare('INSERT INTO ranbi_transfers (from_account, to_account, amount, reason, ref, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run('email:new', 'system:burn', 20, 'unlock', 'unlock:x', 11)
  const afterSpend = summary(sqlite)
  assert.equal(afterSpend.identities, afterJoin.identities)
  assert.equal(afterSpend.circulating, afterJoin.circulating - 20)

  assert.deepEqual(await scanUserPointsTotals(db), {
    identities: afterSpend.identities,
    circulating: afterSpend.circulating,
    updatedAt: afterSpend.max_updated_at,
  })
})

test('删除身份时人数与流通量一起回退', async () => {
  const sqlite = setup()
  const before = summary(sqlite)
  const removed = sqlite.prepare('SELECT balance FROM user_points WHERE user_id = ?').get('email:b').balance
  sqlite.prepare('DELETE FROM user_points WHERE user_id = ?').run('email:b')
  const after = summary(sqlite)
  assert.equal(after.identities, before.identities - 1)
  assert.equal(after.circulating, before.circulating - removed)
})

test('汇总表缺失时退回全表聚合', async () => {
  const sqlite = setup({ withSummary: false })
  const db = d1Adapter(sqlite)
  const totals = await readUserPointsTotals(db)
  assert.equal(totals.source, 'scan')
  assert.deepEqual(await scanUserPointsTotals(db), {
    identities: totals.identities,
    circulating: totals.circulating,
    updatedAt: totals.updatedAt,
  })
})

test('计数器在同步窗口内直接返回，不做全表扫', async () => {
  const sqlite = setup()
  const db = d1Adapter(sqlite)
  sqlite.prepare('UPDATE user_points_summary SET synced_at = ? WHERE id = 1').run(Date.now() - 1000)
  const totals = await readUserPointsTotals(db)
  assert.equal(totals.source, 'counter')
  assert.equal(totals.identities, summary(sqlite).identities)
})

test('超过一天未核对时重算，并修掉漂移', async () => {
  const sqlite = setup()
  const db = d1Adapter(sqlite)
  sqlite.prepare('UPDATE user_points_summary SET circulating = circulating + 9999, synced_at = 0 WHERE id = 1').run()

  const reconciled = await reconcileUserPointsSummary(db, Date.now())
  assert.equal(reconciled.ok, true)
  assert.equal(reconciled.materialized, true)
  assert.equal(reconciled.drift.circulating, 9999)
  assert.equal(reconciled.drift.identities, 0)

  const repaired = summary(sqlite)
  const authoritative = await scanUserPointsTotals(db)
  assert.equal(repaired.circulating, authoritative.circulating)
  assert.equal(repaired.identities, authoritative.identities)

  sqlite.prepare('UPDATE user_points_summary SET synced_at = 0 WHERE id = 1').run()
  const totals = await readUserPointsTotals(db, Date.now())
  assert.equal(totals.source, 'recount')
  assert.equal(totals.circulating, authoritative.circulating)
  assert.ok(summary(sqlite).synced_at > Date.now() - 1000, '重算后应记录核对时间')
})

test('计数器字段缺失（迁移未执行）时不写坏数据', async () => {
  const sqlite = setup({ withSummary: false })
  const db = d1Adapter(sqlite)
  const result = await reconcileUserPointsSummary(db)
  assert.equal(result.ok, true)
  assert.equal(result.materialized, false)
  assert.equal(result.identities, (await scanUserPointsTotals(db)).identities)
  assert.equal(
    sqlite.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'user_points_summary'").get().n,
    0,
    '不应在代码里补建表'
  )
})

import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { DatabaseSync } from 'node:sqlite'

const migration = fs.readFileSync(new URL('../migrations/0100_fixed_ranbi_supply.sql', import.meta.url), 'utf8')

function setup() {
  const db = new DatabaseSync(':memory:')
  db.exec(`
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
  db.exec(migration)
  return db
}

function totals(db) {
  const system = db.prepare(`
    SELECT
      SUM(CASE WHEN account_type = 'pool' THEN balance ELSE 0 END) AS reserves,
      SUM(CASE WHEN account_type = 'burn' THEN balance ELSE 0 END) AS burned
    FROM ranbi_system_accounts
  `).get()
  const users = db.prepare('SELECT COALESCE(SUM(balance), 0) AS circulating FROM user_points').get()
  return {
    reserves: Number(system.reserves),
    burned: Number(system.burned),
    circulating: Number(users.circulating),
  }
}

test('migration repairs balances and accounts for exactly 21 million Ranbi', () => {
  const db = setup()
  const value = totals(db)
  assert.deepEqual(value, { reserves: 20_999_850, burned: 5, circulating: 145 })
  assert.equal(value.reserves + value.burned + value.circulating, 21_000_000)
  assert.equal(db.prepare("SELECT balance FROM ranbi_system_accounts WHERE account_id = 'pool:community'").get().balance, 6_299_850)
  assert.equal(db.prepare("SELECT value FROM site_settings WHERE key = 'ranbi.guestSeed'").get().value, '5')
})

test('transfers conserve supply and duplicate refs stay idempotent', () => {
  const db = setup()
  const statement = db.prepare(`
    INSERT OR IGNORE INTO ranbi_transfers
      (from_account, to_account, amount, reason, ref, created_at)
    VALUES ('pool:community', 'email:new', 5, 'checkin', 'checkin:2026-09-30', 10)
  `)
  assert.equal(statement.run().changes, 1)
  assert.equal(statement.run().changes, 0)
  assert.equal(db.prepare("SELECT balance FROM user_points WHERE user_id = 'email:new'").get().balance, 5)
  assert.equal(totals(db).reserves + totals(db).burned + totals(db).circulating, 21_000_000)

  db.prepare(`
    INSERT INTO ranbi_transfers
      (from_account, to_account, amount, reason, ref, created_at)
    VALUES ('email:new', 'system:burn', 5, 'unlock', 'unlock:resource:new', 11)
  `).run()
  const value = totals(db)
  assert.equal(value.burned, 10)
  assert.equal(value.reserves + value.burned + value.circulating, 21_000_000)
})

function accounted(db) {
  const value = totals(db)
  return value.reserves + value.burned + value.circulating
}

test('direct guest seeds after transfers are charged back to the community pool once', () => {
  const db = setup()
  const reconcile = fs.readFileSync(new URL('../migrations/0108_reconcile_direct_guest_seed.sql', import.meta.url), 'utf8')
  db.prepare(`
    INSERT INTO ranbi_transfers
      (from_account, to_account, amount, reason, ref, created_at)
    VALUES ('pool:community', 'email:seed', 5, 'checkin', 'checkin:2026-10-01', 1790800000000)
  `).run()
  db.prepare(`
    INSERT INTO point_ledger (user_id, delta, reason, ref, created_at)
    VALUES ('guest:orphan', 5, 'guest_seed', 'guest_seed', 1790900000000)
  `).run()
  db.prepare(`
    INSERT INTO user_points (user_id, balance, updated_at)
    VALUES ('guest:orphan', 5, 1790900000000)
    ON CONFLICT(user_id) DO UPDATE SET balance = user_points.balance + excluded.balance
  `).run()
  assert.equal(accounted(db), 21_000_005)
  assert.equal(db.prepare("SELECT balance FROM user_points WHERE user_id = 'guest:orphan'").get().balance, 5)

  db.exec(reconcile)
  assert.equal(accounted(db), 21_000_000)
  assert.equal(db.prepare("SELECT balance FROM user_points WHERE user_id = 'guest:orphan'").get().balance, 5)
  assert.equal(db.prepare(`
    SELECT COUNT(*) AS n FROM ranbi_transfers
    WHERE to_account = 'guest:orphan' AND reason = 'guest_seed'
  `).get().n, 0)

  const poolAfter = db.prepare("SELECT balance FROM ranbi_system_accounts WHERE account_id = 'pool:community'").get().balance
  db.exec(reconcile)
  assert.equal(accounted(db), 21_000_000)
  assert.equal(db.prepare("SELECT balance FROM ranbi_system_accounts WHERE account_id = 'pool:community'").get().balance, poolAfter)
  assert.equal(db.prepare("SELECT balance FROM user_points WHERE user_id = 'guest:orphan'").get().balance, 5)
})

test('database rejects burn withdrawals and overdrafts', () => {
  const db = setup()
  assert.throws(() => db.prepare(`
    INSERT INTO ranbi_transfers
      (from_account, to_account, amount, reason, ref, created_at)
    VALUES ('system:burn', 'email:b', 1, 'admin', 'illegal-burn-withdrawal', 20)
  `).run(), /RANBI_BURN_LOCKED/)
  assert.throws(() => db.prepare(`
    INSERT INTO ranbi_transfers
      (from_account, to_account, amount, reason, ref, created_at)
    VALUES ('pool:community', 'email:b', 7000000, 'admin', 'pool-overdraft', 21)
  `).run(), /RANBI_POOL_EXHAUSTED/)
  assert.throws(() => db.prepare(`
    INSERT INTO ranbi_transfers
      (from_account, to_account, amount, reason, ref, created_at)
    VALUES ('email:b', 'system:burn', 101, 'unlock', 'user-overdraft', 22)
  `).run(), /RANBI_INSUFFICIENT_BALANCE/)
})

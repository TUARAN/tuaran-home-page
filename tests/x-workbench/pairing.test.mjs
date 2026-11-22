import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createPairing, exchangePairing, authenticatePlugin, revokePlugins } from '../../lib/x/workbench/pairingStore.js'
function makeDb() {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(readFileSync(new URL('../../migrations/0133_x_workbench_pairing.sql', import.meta.url), 'utf8'))
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async () => sqlite.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...args) }),
    run: async () => ({ meta: { changes: sqlite.prepare(sql).run(...args).changes } }),
  })
  return { prepare: (sql) => stmt(sql), batch: async (list) => { for (const s of list) await s.run() } }
}


const NOW = 1800000000000
const request = token => new Request('https://x.2aran.com/api/x-workbench/bridge', { headers: { Authorization: `Bearer ${token}` } })
test('配对码一次性消费、令牌限期、租户隔离与撤销', async () => {
  const db = makeDb()
  const pair = await createPairing(db, 'u1', NOW)
  const results = await Promise.all([exchangePairing(db, pair.code, NOW), exchangePairing(db, pair.code, NOW)])
  assert.equal(results.filter(r => r.ok).length, 1)
  const token = results.find(r => r.ok).token
  assert.equal((await authenticatePlugin(db, request(token), NOW)).user_id, 'u1')
  assert.equal(await authenticatePlugin(db, request(pair.code), NOW), null)
  assert.equal(await authenticatePlugin(db, request(token), NOW + 30 * 86400000), null)
  await revokePlugins(db, 'u2')
  assert.ok(await authenticatePlugin(db, request(token), NOW))
  await revokePlugins(db, 'u1')
  assert.equal(await authenticatePlugin(db, request(token), NOW), null)
})
test('过期、被替换、非法配对码均不可兑换', async () => {
  const db = makeDb()
  const a = await createPairing(db, 'u1', NOW)
  const b = await createPairing(db, 'u1', NOW)
  assert.equal((await exchangePairing(db, a.code, NOW)).ok, false)
  assert.equal((await exchangePairing(db, b.code, b.expiresAt)).ok, false)
  assert.equal((await exchangePairing(db, 'abc', NOW)).ok, false)
})

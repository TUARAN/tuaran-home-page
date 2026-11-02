import test from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { enqueueXRemoteCommand } from '../../lib/community/communityActions.js'

test('update clicks reuse an outstanding command and expire stale work before retry', async () => {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(`CREATE TABLE x_extension_commands (id TEXT PRIMARY KEY, device_id TEXT, command TEXT, mode TEXT, status TEXT, result TEXT, created_at INTEGER, finished_at INTEGER)`)
  const db = { prepare(sql) { return { bind(...args) { return { async run() { return sqlite.prepare(sql).run(...args) }, async first() { return sqlite.prepare(sql).get(...args) } } } } } }
  const input = { deviceId: 'device-test-123456', command: 'ext-update' }
  try {
    const first = await enqueueXRemoteCommand(db, input, 1000000)
    assert.equal(first.ok, true)
    const repeat = await enqueueXRemoteCommand(db, input, 1000001)
    assert.equal(repeat.id, first.id)
    sqlite.prepare("UPDATE x_extension_commands SET status = 'claimed' WHERE id = ?").run(first.id)
    assert.equal((await enqueueXRemoteCommand(db, input, 1000002)).id, first.id)
    const retry = await enqueueXRemoteCommand(db, input, 1120000)
    assert.notEqual(retry.id, first.id)
    assert.equal(sqlite.prepare('SELECT status FROM x_extension_commands WHERE id = ?').get(first.id).status, 'expired')
    assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM x_extension_commands WHERE status = 'pending'").get().count, 1)
  } finally { sqlite.close() }
})

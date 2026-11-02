import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { DISTRIBUTOR_ID, normalizePluginReport, recordPluginReport, enqueuePluginCommand, readPluginMonitor } from '../../lib/community/pluginMonitor.mjs'
const NOW = Date.parse('2026-11-02T08:00:00+08:00')
const schema = await readFile(new URL('../../migrations/0129_plugin_monitor.sql', import.meta.url), 'utf8')
function database() {
  const sqlite = new DatabaseSync(':memory:'); sqlite.exec(schema)
  return { sqlite, prepare(sql) { return { bind(...args) { const stmt = sqlite.prepare(sql); return { first: async () => stmt.get(...args), all: async () => ({ results: stmt.all(...args) }), run: async () => ({ meta: { changes: Number(stmt.run(...args).changes) } }) } } } } }
}
const raw = () => ({ pluginId: DISTRIBUTOR_ID, deviceId: 'device-distributor', version: '2.2.0', secret: 'never-store', snapshot: { phase: 'running', batches: [{ id: 'batch-12345678', title: 'private title', content: 'private body', createdAt: NOW, type: 'article', targets: [{ id: 'target-12345678', platformId: 'juejin', status: 'running', url: 'https://private.test' }] }], tools: { autoCheckin: true }, localUpdate: { installed: '2.2.0', version: '2.2.1', phase: 'available', apiKey: 'private-key' } }, events: [{ id: 'event-12345678', kind: 'distribution', platformId: 'juejin', outcome: 'prepared', at: NOW, text: 'private body' }] })
test('whitelist strips text, URLs, secrets and rejects other plugin identities', () => {
  const serialized = JSON.stringify(normalizePluginReport(raw(), NOW))
  for (const value of ['private body', 'private title', 'private.test', 'private-key', 'never-store']) assert.ok(!serialized.includes(value))
  assert.throws(() => normalizePluginReport({ ...raw(), pluginId: 'x' }, NOW), /INVALID_REPORT/)
  assert.throws(() => normalizePluginReport({ ...raw(), deviceId: '../bad' }, NOW), /INVALID_REPORT/)
})
test('migration applies twice; events deduplicate and snapshots support target/date filtering', async () => {
  const db = database(); db.sqlite.exec(schema)
  await recordPluginReport(db, raw(), NOW); await recordPluginReport(db, raw(), NOW + 100)
  const view = await readPluginMonitor(db, { date: '2026-11-02', platform: 'juejin', now: NOW + 200 })
  assert.equal(view.devices.length, 1); assert.equal(view.events.length, 1); assert.equal(view.counts[0].count, 1)
  assert.equal((await readPluginMonitor(db, { date: '2026-11-02', platform: 'twitter', now: NOW })).events.length, 0)
  await assert.rejects(readPluginMonitor(db, { date: '2026-02-30', now: NOW }), /INVALID_FILTER/)
})
test('commands bind to plugin and device, claim once, and ack only confirmed matching results', async () => {
  const db = database(); await recordPluginReport(db, raw(), NOW)
  const command = await enqueuePluginCommand(db, { pluginId: DISTRIBUTOR_ID, deviceId: raw().deviceId, command: 'stop-batch', argument: 'batch-12345678' }, NOW)
  const again = await enqueuePluginCommand(db, { pluginId: DISTRIBUTOR_ID, deviceId: raw().deviceId, command: 'stop-batch', argument: 'batch-12345678' }, NOW)
  assert.equal(again.id, command.id)
  assert.equal((await recordPluginReport(db, { ...raw(), deviceId: 'other-device' }, NOW)).commands.length, 0)
  const claimed = await recordPluginReport(db, raw(), NOW + 1)
  assert.equal(claimed.commands[0].id, command.id)
  assert.equal((await recordPluginReport(db, raw(), NOW + 2)).commands.length, 0)
  const wrong = await recordPluginReport(db, { ...raw(), deviceId: 'other-device', results: [{ id: command.id, status: 'success', result: 'stopped' }] }, NOW + 3)
  assert.equal(wrong.acknowledged.length, 0)
  const done = await recordPluginReport(db, { ...raw(), results: [{ id: command.id, status: 'success', result: 'stopped' }] }, NOW + 4)
  assert.deepEqual(done.acknowledged, [command.id])
  assert.equal(db.sqlite.prepare('SELECT status FROM plugin_commands WHERE id=?').get(command.id).status, 'success')
})
test('offline or unsafe operations cannot queue; claimed commands expire without executing later', async () => {
  const db = database(); await recordPluginReport(db, raw(), NOW)
  for (const command of ['publish', 'task-start', 'delete-notes']) await assert.rejects(enqueuePluginCommand(db, { pluginId: DISTRIBUTOR_ID, deviceId: raw().deviceId, command }, NOW), /INVALID_COMMAND/)
  await assert.rejects(enqueuePluginCommand(db, { pluginId: 'x', deviceId: raw().deviceId, command: 'stop-all' }, NOW), /INVALID_COMMAND/)
  await assert.rejects(enqueuePluginCommand(db, { pluginId: DISTRIBUTOR_ID, deviceId: raw().deviceId, command: 'stop-all' }, NOW + 300001), /DEVICE_OFFLINE/)
  const queued = await enqueuePluginCommand(db, { pluginId: DISTRIBUTOR_ID, deviceId: raw().deviceId, command: 'stop-all' }, NOW)
  await recordPluginReport(db, raw(), NOW + 1)
  const expired = await recordPluginReport(db, { ...raw(), results: [{ id: queued.id, status: 'success', result: 'stopped' }] }, NOW + 120001)
  assert.deepEqual(expired.commands, [])
  assert.equal(db.sqlite.prepare('SELECT status FROM plugin_commands WHERE id=?').get(queued.id).status, 'expired')
})
test('remote update can only reference the version observed in the device local directory', async () => {
  const db = database(); await recordPluginReport(db, raw(), NOW)
  await enqueuePluginCommand(db, { pluginId: DISTRIBUTOR_ID, deviceId: raw().deviceId, command: 'ext-update', argument: 'https://evil.test' }, NOW)
  const [row] = (await recordPluginReport(db, raw(), NOW)).commands
  assert.equal(row.argument, '2.2.1')
  const same = raw(); same.snapshot.localUpdate.phase = 'latest'
  await recordPluginReport(db, same, NOW)
  await assert.rejects(enqueuePluginCommand(db, { pluginId: DISTRIBUTOR_ID, deviceId: same.deviceId, command: 'ext-update' }, NOW), /NO_LOCAL_UPDATE/)
})

test('update success requires the target version in a subsequent device heartbeat', async () => {
  const db = database(); await recordPluginReport(db, raw(), NOW)
  const queued = await enqueuePluginCommand(db, { pluginId: DISTRIBUTOR_ID, deviceId: raw().deviceId, command: 'ext-update' }, NOW)
  await recordPluginReport(db, raw(), NOW + 1)
  const premature = await recordPluginReport(db, { ...raw(), results: [{ id: queued.id, status: 'success', result: 'loaded' }] }, NOW + 2)
  assert.deepEqual(premature.acknowledged, [])
  assert.equal(db.sqlite.prepare('SELECT status FROM plugin_commands WHERE id=?').get(queued.id).status, 'claimed')
  const updated = await recordPluginReport(db, { ...raw(), version: '2.2.1', results: [{ id: queued.id, status: 'success', result: 'loaded' }] }, NOW + 3)
  assert.deepEqual(updated.acknowledged, [queued.id])
})

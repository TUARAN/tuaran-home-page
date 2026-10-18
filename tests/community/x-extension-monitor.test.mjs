import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { normalizeCommunityActionReport, normalizeXRuntime, presentXExtensionMonitor, recordCommunityActionReport } from '../../lib/community/communityActions.js'

const require = createRequire(import.meta.url)
const receipt = require('../../tools/x-reply-clipboard-extension/receipt.js')

const NOW = Date.parse('2026-10-18T08:00:00Z')

test('X task snapshot validates phases and does not accept arbitrary task names', () => {
  assert.equal(normalizeXRuntime({ phase: 'broken', tasks: [] }), null)
  const runtime = normalizeXRuntime({ phase: 'running', tasks: [{ mode: 'timeline', phase: 'running', startedAt: NOW }, { mode: 'invalid', phase: 'running' }] })
  assert.deepEqual(runtime.tasks.map((task) => task.mode), ['timeline'])
  const report = normalizeCommunityActionReport({ deviceId: 'device-x-monitor', platform: 'x', runtime: { phase: 'paused', tasks: [] } }, NOW)
  assert.equal(report.runtime.phase, 'paused')
})

test('monitor separates a fresh heartbeat from actual task state', () => {
  const devices = [
    { id: 'fresh-old', last_seen_at: NOW - 1000 },
    { id: 'fresh-idle', last_seen_at: NOW - 1000 },
    { id: 'fresh-run', last_seen_at: NOW - 1000 },
    { id: 'fresh-paused', last_seen_at: NOW - 1000 },
    { id: 'fresh-stale-snapshot', last_seen_at: NOW - 1000 },
    { id: 'stale', last_seen_at: NOW - 10 * 60 * 1000 },
  ]
  const runtimes = [
    { device_id: 'fresh-idle', flow_phase: 'idle', tasks_json: '[]', reported_at: NOW - 1000 },
    { device_id: 'fresh-run', flow_phase: 'running', tasks_json: '[{"mode":"timeline","phase":"running"}]', reported_at: NOW - 1000 },
    { device_id: 'fresh-paused', flow_phase: 'paused', tasks_json: '[]', reported_at: NOW - 1000 },
    { device_id: 'fresh-stale-snapshot', flow_phase: 'running', tasks_json: '[{"mode":"timeline","phase":"running"}]', reported_at: NOW - 10 * 60 * 1000 },
    { device_id: 'stale', flow_phase: 'running', tasks_json: '[{"mode":"timeline","phase":"running"}]', reported_at: NOW - 10 * 60 * 1000 },
  ]
  const result = presentXExtensionMonitor({ devices, runtimes, now: NOW, todayCounts: [{ device_id: 'fresh-run', result: 'success', count: 431 }] })
  assert.deepEqual(result.devices.map((device) => device.phase), ['unknown', 'idle', 'running', 'paused', 'unknown', 'offline'])
  assert.equal(result.devices[2].today.success, 431)
})

test('runtime heartbeat stores snapshot separately from action counts', async () => {
  const calls = []
  const db = { prepare(sql) { return { bind(...values) { return { async run() { calls.push({ sql, values }); return { meta: { changes: 1 } } } } } } } }
  const result = await recordCommunityActionReport(db, {
    deviceId: 'device-x-monitor', platform: 'x', accountHandle: '@Tuaran',
    runtime: { phase: 'running', tasks: [{ mode: 'timeline', phase: 'running', startedAt: NOW }] },
  }, NOW)
  assert.equal(result.accepted, 0)
  assert.equal(calls.length, 2)
  assert.match(calls[1].sql, /x_extension_runtime/)
  assert.equal(calls[1].values[2], 'running')
})

test('extension heartbeat includes a task snapshot in the authenticated request', async () => {
  const previousChrome = globalThis.chrome
  const previousFetch = globalThis.fetch
  const store = {}
  let body
  globalThis.chrome = { storage: { local: {
    async get(key) { return { [key]: store[key] } },
    async set(value) { Object.assign(store, value) },
  } }, runtime: { getManifest: () => ({ version: '3.27.20' }) } }
  globalThis.fetch = async (_, options) => { body = JSON.parse(options.body); return { ok: true } }
  try {
    receipt.setRuntimeProvider(async () => ({ phase: 'running', tasks: [{ mode: 'timeline', phase: 'running' }] }))
    await receipt.saveSecret('test-secret')
    assert.equal(body.runtime.phase, 'running')
    assert.equal(body.runtime.tasks[0].mode, 'timeline')
  } finally {
    receipt.setRuntimeProvider(null)
    globalThis.chrome = previousChrome
    globalThis.fetch = previousFetch
  }
})

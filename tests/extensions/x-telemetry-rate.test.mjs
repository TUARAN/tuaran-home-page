import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

test('background runtime updates cannot trigger more than one monitor heartbeat a minute', async () => {
  const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/background.js', import.meta.url), 'utf8')
  const helper = source.match(/const RUNTIME_TELEMETRY_MIN_INTERVAL_MS[\s\S]*?let lastRuntimeTelemetryAt = 0;[\s\S]*?\n\}/)?.[0]
    || source.match(/let lastRuntimeTelemetryAt = 0;[\s\S]*?\n\}/)?.[0]
  assert.ok(helper)
  let now = 1_000_000
  let sent = 0
  const context = vm.createContext({
    chrome: { runtime: { id: 'extension' } },
    Date: { now: () => now },
    XrcCommunityReceipt: { heartbeatFromBackground() { sent++; return Promise.resolve() } },
  })
  vm.runInContext(`${helper}\nglobalThis.send = sendRuntimeTelemetry`, context)
  for (let index = 0; index < 60; index++) { context.send(); now += 1000 }
  assert.equal(sent, 1)
  context.send()
  assert.equal(sent, 2)
})

test('receipt splits minute monitor heartbeats from hourly stats sync', async () => {
  const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/receipt.js', import.meta.url), 'utf8')
  const stored = { xrcCommunityReport: { secret: 'test', deviceId: 'device-12345678', accountHandle: '', queue: [{ id: 'evt-1' }] }, xrcDailyReports: [] }
  const requests = []
  const context = vm.createContext({
    chrome: { runtime: { getManifest: () => ({ version: 'test' }) }, storage: { local: {
      async get(key) { return { [key]: stored[key] } },
      async set(value) { Object.assign(stored, value) },
    } } },
    fetch: async (_url, options) => { requests.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ commands: [] }) } },
    Intl, Date, Math, Promise,
  })
  vm.runInContext(source, context)
  const receipt = context.XrcCommunityReceipt
  assert.equal(receipt.HEARTBEAT_ALARM_MINUTES, 1)
  assert.equal(receipt.STATS_ALARM_MINUTES, 60)
  await receipt.heartbeatFromBackground()
  await receipt.heartbeatFromBackground()
  assert.equal(requests.length, 1)
  assert.deepEqual(requests[0].events, [])
  assert.equal(stored.xrcCommunityReport.queue.length, 1)
  await receipt.heartbeatFromBackground('named-account')
  assert.equal(requests.length, 2)
  assert.equal(requests[1].accountHandle, 'named-account')
  await receipt.syncStatsFromBackground('named-account', { force: true })
  assert.equal(requests.length, 3)
  assert.equal(stored.xrcCommunityReport.queue.length, 0)
})

test('action receipts queue locally instead of posting on every success', async () => {
  const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/receipt.js', import.meta.url), 'utf8')
  const stored = { xrcCommunityReport: { secret: 'test', deviceId: 'device-12345678', accountHandle: 'acct', queue: [] }, xrcDailyReports: [] }
  let posts = 0
  const context = vm.createContext({
    chrome: { runtime: { getManifest: () => ({ version: 'test' }) }, storage: { local: {
      async get(key) { return { [key]: stored[key] } },
      async set(value) { Object.assign(stored, value) },
    } } },
    fetch: async () => { posts += 1; return { ok: true, json: async () => ({ commands: [] }) } },
    Intl, Date, Math, Promise, crypto: globalThis.crypto,
  })
  vm.runInContext(source, context)
  const receipt = context.XrcCommunityReceipt
  const result = await receipt.accept({
    id: 'event-queued-001',
    task: 'timeline-reply',
    result: 'success',
    accountHandle: 'acct',
    occurredAt: Date.now(),
  })
  assert.equal(result.queued, true)
  assert.equal(posts, 0)
  assert.equal(stored.xrcCommunityReport.queue.length, 1)
})

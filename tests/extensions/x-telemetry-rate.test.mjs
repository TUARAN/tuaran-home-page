import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

test('waiting task telemetry stays stable while local countdown changes', async () => {
  const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/content.js', import.meta.url), 'utf8')
  const helper = source.match(/  function currentTaskDetail\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(helper)
  let now = 1000
  const state = { assistantMode: 'timeline', running: true, waitUntil: 100_000, status: '下一条 01:39 后继续' }
  const context = vm.createContext({ state, Date: { now: () => now } })
  vm.runInContext(`${helper}\nglobalThis.detail = currentTaskDetail`, context)
  assert.equal(context.detail(), '等待下一条')
  now += 1000
  state.status = '下一条 01:38 后继续'
  assert.equal(context.detail(), '等待下一条')
})

test('background runtime updates cannot trigger more than one telemetry request a minute', async () => {
  const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/background.js', import.meta.url), 'utf8')
  const helper = source.match(/let lastRuntimeTelemetryAt = 0;[\s\S]*?\n\}/)?.[0]
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

test('receipt de-duplicates overlapping heartbeat sources but accepts a new account handle', async () => {
  const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/receipt.js', import.meta.url), 'utf8')
  const stored = { xrcCommunityReport: { secret: 'test', deviceId: 'device-12345678', accountHandle: '', queue: [] }, xrcDailyReports: [] }
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
  await receipt.heartbeatFromBackground()
  await receipt.heartbeatFromBackground()
  assert.equal(requests.length, 1)
  await receipt.heartbeatFromBackground('named-account')
  assert.equal(requests.length, 2)
  assert.equal(requests[1].accountHandle, 'named-account')
})

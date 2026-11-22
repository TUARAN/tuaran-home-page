import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
const source = readFileSync(new URL('../../tools/x-reply-clipboard-extension/background.js', import.meta.url), 'utf8')
const fn = source.slice(source.indexOf('async function runWorkbenchSchedule()'), source.indexOf('function tickWorkbenchSchedule()'))
function setup(over = {}) {
  const requests = [], messages = []
  const storage = { xrcWorkbenchCredential: { token: 'token', expiresAt: Date.now() + 100000 } }
  const plan = { enabled: true, accountHandle: 'foo', current: '', items: {} }
  const context = {
    Date, fetch() {}, SLICE_YIELD_COOLDOWN_MS: 60000, POST_TASKS: ['poster'],
    readTaskSchedule: async () => plan, savedAccountHandle: async () => 'foo',
    readPluginRuntime: async () => ({ tasks: {} }),
    dueTaskModes: () => ['poster'], scheduleEngine: () => ({ coolingHoldReason: () => '' }),
    saveTaskSchedule: async () => {},
    XrcCommunityReceipt: { postDailyBudget: async () => ({ reached: false, uncertain: false }) },
    XrcWorkbenchBridge: { pluginRequest: async (_, action, payload) => { requests.push({ action, payload }); return action === 'claim' ? { ok: true, schedule: { id: 's1', text: 'hello' } } : { ok: true } } },
    chrome: { storage: { local: { get: async () => storage, set: async v => Object.assign(storage, v), remove: async k => delete storage[k] } }, tabs: { query: async () => [{ id: 1 }], sendMessage: async (_, m) => { messages.push(m); return { ok: true, result: 'ok' } } } },
    ...over
  }
  vm.createContext(context); vm.runInContext(fn, context)
  return { context, storage, plan, requests, messages, run: () => context.runWorkbenchSchedule() }
}
test('排期：共享任务锁内通过本地门禁才领取并回报', async () => {
  const s = setup(); await s.run()
  assert.deepEqual(s.requests.map(r => r.action), ['claim', 'report'])
  assert.deepEqual(s.messages.map(m => m.type), ['xrc-workbench-ready', 'xrc-workbench-publish'])
  assert.equal(s.requests[1].payload.ok, true)
  assert.equal(s.storage.xrcWorkbenchPendingReport, undefined)
})
test('暂停、冷却、上限未知和占用时均不领取', async () => {
  for (const change of [s => { s.plan.enabled = false }, s => { s.plan.items.poster = { resumeAt: Date.now() + 60000 } }, s => { s.context.XrcCommunityReceipt.postDailyBudget = async () => ({ uncertain: true }) }, s => { s.plan.current = 'timeline' }, s => { s.context.dueTaskModes = () => [] }]) {
    const s = setup(); change(s); await s.run(); assert.equal(s.requests.length, 0)
  }
})
test('Worker 重启后只补报未知结果，不重复执行', async () => {
  const s = setup(); s.storage.xrcWorkbenchPendingReport = { id: 's1', ok: false, result: 'unknown' }
  await s.run()
  assert.deepEqual(s.requests.map(r => r.action), ['report'])
  assert.equal(s.messages.length, 0)
})

test('云端租约回收同一排期后，本机不会重复发送', async () => {
  const s = setup(); s.storage.xrcWorkbenchAttemptedSchedules = { s1: Date.now() }
  await s.run()
  assert.equal(s.messages.some(m => m.type === 'xrc-workbench-publish'), false)
  assert.equal(s.requests.at(-1).payload.ok, false)
})

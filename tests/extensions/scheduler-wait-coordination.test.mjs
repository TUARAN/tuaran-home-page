import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/content.js', import.meta.url), 'utf8')
function context(plan, tasks = {}) {
  const sandbox = vm.createContext({ taskSchedule: plan, pluginRuntime: { tasks }, FLOW_STALE_MS: 90000, FLOW_TASKS: [['timeline', '评论首页']], state: {}, likeState: {} })
  for (const name of ['scheduledWaitInfo', 'soonestWaitMs']) {
    const match = source.match(new RegExp(`  function ${name}\\([\\s\\S]*?\\n  \\}`))
    assert.ok(match, name)
    vm.runInContext(match[0], sandbox)
  }
  return sandbox
}
test('queued ready tasks ignore stale page countdowns and expired cooldown copy', () => {
  const c = context({ enabled: true, current: '', items: { poster: { reason: 'X 限制冷却', resumeAt: 900 } }, timeline: { future: [{ mode: 'poster', status: 'ready', readyAt: 1000 }] } }, { poster: { phase: 'paused', waitUntil: 99000, updatedAt: 1 } })
  const wait = c.scheduledWaitInfo('poster', 1000)
  assert.equal(wait.remaining, 0)
  assert.equal(wait.label, '已到期')
})
test('confirmed current task is running rather than confirming startup', () => {
  const c = context({ enabled: true, current: 'timeline', items: {}, startedAt: 950 }, { timeline: { phase: 'running', updatedAt: 1000 } })
  assert.equal(c.scheduledWaitInfo('timeline', 1000).kind, 'running')
})
test('overview countdown uses eligible scheduler tasks, ignoring stopped and local timers', () => {
  const c = context({ enabled: true, items: {}, timeline: { future: [{ mode: 'poster', status: 'scheduled', readyAt: 6000 }, { mode: 'timeline', status: 'stopped', readyAt: 2000 }] } }, { timeline: { waitUntil: 1500 } })
  c.state.waitUntil = 1200
  assert.equal(c.soonestWaitMs(1000), 5000)
  c.taskSchedule.timeline.future.push({ mode: 'likes-posts', status: 'ready', readyAt: 1000 })
  assert.equal(c.soonestWaitMs(1000), 0)
})
test('active current cooldown still shows its actual remaining time', () => {
  const c = context({ enabled: true, current: 'timeline', items: { timeline: { reason: 'X 限制冷却', resumeAt: 6000 } } }, { timeline: { phase: 'paused', waitUntil: 6000, updatedAt: 1000 } })
  assert.equal(c.scheduledWaitInfo('timeline', 1000).remaining, 5000)
  assert.equal(c.scheduledWaitInfo('timeline', 1000).kind, 'cooldown')
})
test('all-day follow-back shows ordinary wait and shared cooldown instead of night', () => {
  const c = context({ enabled: true, current: '', rules: { 'mutual-followBack': { window: 'all' } }, items: { 'mutual-followBack': { reason: '等待下次运行', resumeAt: 6000 } } })
  assert.equal(c.scheduledWaitInfo('mutual-followBack', 1000).label, '等待下次运行')
  c.taskSchedule.items['mutual-followBack'].reason = '共享频率限制：本批已完成 15 个，暂停 30 分钟'
  assert.equal(c.scheduledWaitInfo('mutual-followBack', 1000).label, '关注批次冷却')
})

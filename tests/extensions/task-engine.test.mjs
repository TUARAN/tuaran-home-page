import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { createTaskEngine, createEngineTrace, MAX_PASSES, ENGINE_VERSION } = require('../../tools/x-reply-clipboard-extension/taskEngine.js')

const now = Date.parse('2026-11-20T10:00:00+08:00')
const SEC = 1000
const MIN = 60 * SEC
const engine = createTaskEngine({
  startingGraceMs: 90 * SEC,
  unknownGraceMs: 90 * SEC,
  stallReloadMs: 3 * MIN,
  sliceYieldMs: MIN,
  followTurnGapMs: 5 * MIN,
  replyModes: ['timeline', 'notifications', 'kol'],
  postModes: ['poster', 'poster-premium', 'poster-x', 'poster-xhs', 'article', 'site-forward'],
  communityModes: ['community-share', 'community-copy'],
  labels: { 'prune-posts': '清理帖子' }
})

function flagsFor(overrides = {}) {
  return engine.occupancyFlags({
    mode: 'timeline',
    now,
    item: {},
    task: { phase: 'running', progressAt: now },
    startedAt: now - 10 * SEC,
    sliceMs: 10 * MIN,
    unlimited: false,
    firstDue: 'timeline',
    ruleEnabled: true,
    manualFocusMode: '',
    stopIsWait: false,
    settledOnPath: false,
    ...overrides
  })
}

function verdictFor(flagOverrides = {}, context = {}) {
  const flags = flagsFor(flagOverrides)
  const task = 'task' in flagOverrides ? flagOverrides.task : { phase: 'running', progressAt: now }
  return engine.occupancyVerdict(flags, { mode: 'timeline', item: flagOverrides.item || {}, task, workTabId: 7, ...context })
}

test('engine exposes a bounded pass count and a version', () => {
  assert.equal(ENGINE_VERSION, 6)
  assert.ok(MAX_PASSES >= 8 && MAX_PASSES <= 64)
})

test('a running task inside its slice holds the shared tab', () => {
  assert.equal(verdictFor(), 'hold')
})

test('a missing page row is only unresponsive after the 90-second start grace', () => {
  assert.equal(verdictFor({ task: undefined, startedAt: now - 60 * SEC }), 'hold')
  assert.equal(verdictFor({ task: undefined, startedAt: now - 91 * SEC }), 'recover')
})

test('unknown needs 90 seconds of sustained silence before recovery', () => {
  assert.equal(verdictFor({ task: { phase: 'unknown', unknownSince: now - 30 * SEC } }), 'hold')
  assert.equal(verdictFor({ task: { phase: 'unknown', unknownSince: now - 95 * SEC } }), 'recover')
})

test('starting on the task path or reporting idle can take the start before grace ends', () => {
  assert.equal(verdictFor({ task: { phase: 'starting' } }), 'hold')
  assert.equal(verdictFor({ task: { phase: 'starting' }, settledOnPath: true }), 'recover')
  assert.equal(verdictFor({ task: { phase: 'starting', pageIdle: true } }), 'recover')
})

test('three minutes without progress is a stall; a live X wait is not', () => {
  assert.equal(verdictFor({ task: { phase: 'running', progressAt: now - 4 * MIN } }), 'recover')
  assert.equal(verdictFor({ task: { phase: 'running', progressAt: now - 4 * MIN, waitUntil: now + MIN } }), 'hold')
})

test('blocked or manually stopped tasks are never auto-recovered', () => {
  const task = { phase: 'running', progressAt: now - 4 * MIN }
  assert.equal(verdictFor({ task, item: { blocked: true } }), 'yield')
  assert.equal(verdictFor({ task, item: { manualStopped: true }, stopIsWait: true }), 'hold')
})

test('a manual start request on another task makes the current one yield', () => {
  const flags = flagsFor({ firstDue: 'kol', firstDueManualAt: now - SEC })
  assert.equal(flags.manualDue, true)
  assert.equal(engine.occupancyVerdict(flags, { mode: 'timeline', item: {}, task: { phase: 'running' }, workTabId: 7 }), 'yield')
})

test('a starting task with a manual request tries the page once, then settles', () => {
  const task = { phase: 'starting' }
  const item = { manualRequestedAt: now - SEC }
  const flags = flagsFor({ task, item })
  assert.equal(engine.occupancyVerdict(flags, { mode: 'timeline', item, task, workTabId: 7 }), 'manual-start')
  assert.equal(engine.occupancyVerdict(flags, { mode: 'timeline', item, task, workTabId: 7, manualTried: true }), 'hold')
})

test('a recovered page clears the recovery marker without yielding', () => {
  const item = { recoveryAttempts: 1, reason: '执行未确认' }
  assert.equal(verdictFor({ item }), 'recovered')
})

test('timeouts respect unlimited occupancy', () => {
  assert.equal(verdictFor({ startedAt: now - 11 * MIN }), 'yield')
  assert.equal(verdictFor({ startedAt: now - 11 * MIN, unlimited: true }), 'hold')
})

test('a single confirmed post action ends the post occupancy, a like run does not', () => {
  assert.equal(engine.occupancyVerdict(flagsFor({ mode: 'poster', item: { sliceActions: 1 } }), { mode: 'poster', item: { sliceActions: 1 }, task: { phase: 'running' } }), 'yield')
  assert.equal(engine.occupancyVerdict(flagsFor({ mode: 'likes-posts', item: { sliceActions: 1 } }), { mode: 'likes-posts', item: { sliceActions: 1 }, task: { phase: 'running' } }), 'hold')
})

test('recovery gate keeps a counted reload booting instead of yielding', () => {
  assert.deepEqual(engine.recoveryGate({ item: { resumeAt: now + 30 * SEC, reloadAttempts: 1 }, now, workTabId: 7 }), { bootHold: true, probeTab: true })
  assert.deepEqual(engine.recoveryGate({ item: { resumeAt: now + 30 * SEC }, now, workTabId: 7 }), { bootHold: false, probeTab: false })
  assert.deepEqual(engine.recoveryGate({ item: {}, now, workTabId: 0 }), { bootHold: false, probeTab: false })
})

test('recovery on the task path asks the page first and confirms a start', () => {
  const facts = { mode: 'timeline', item: {}, stalled: false, unknownTask: false, occupancyAge: 2 * MIN, bootHold: false, onPath: true, followListOpen: false }
  assert.deepEqual(engine.recoveryAfterTab(facts), { action: 'try-start' })
  assert.deepEqual(engine.recoveryAfterTab({ ...facts, start: { started: { phase: 'paused' } } }), { action: 'confirm-start', phase: 'paused' })
})

test('a refused reply start keeps its reason; other tasks fall back to reload', () => {
  const facts = { mode: 'timeline', item: {}, stalled: false, unknownTask: false, occupancyAge: 2 * MIN, bootHold: false, onPath: true, followListOpen: false, start: { started: null, error: '登录失效' } }
  assert.deepEqual(engine.recoveryAfterTab(facts), { action: 'page-start-failed', error: '登录失效' })
  assert.equal(engine.recoveryAfterTab({ ...facts, mode: 'likes-posts' }).action, 'reload')
})

test('an open follow list stays put until three real reloads', () => {
  const facts = { mode: 'mutual-targetFollow', item: { reloadAttempts: 2 }, stalled: false, unknownTask: false, occupancyAge: 2 * MIN, bootHold: false, onPath: false, followListOpen: true, start: { started: null, error: '' } }
  assert.equal(engine.recoveryAfterTab(facts).action, 'keep-follow-list')
  assert.equal(engine.recoveryAfterTab({ ...facts, item: { reloadAttempts: 3 } }).action, 'exhausted')
  assert.equal(engine.recoveryAfterTab({ ...facts, unknownTask: true }).action, 'reload')
})

test('a stalled page reloads in place, then the task is skipped after three reloads', () => {
  const base = { mode: 'timeline', stalled: true, unknownTask: false, occupancyAge: 5 * MIN, bootHold: false, onPath: true, followListOpen: false }
  assert.deepEqual(engine.recoveryAfterTab({ ...base, item: { reloadAttempts: 0 } }), { action: 'reload', restarts: 0, nextRestart: 1 })
  assert.deepEqual(engine.recoveryAfterTab({ ...base, item: { reloadAttempts: 3 } }), { action: 'exhausted', restarts: 3 })
  const reloaded = engine.reloadItem({ lastStartError: '' }, { stalled: true, nextRestart: 2, now })
  assert.equal(reloaded.reason, '长时间没有动作或报错，已刷新（2/3）')
  assert.equal(reloaded.resumeAt, now + MIN)
})

test('inside the start grace an unconfirmed page is never reloaded', () => {
  const facts = { mode: 'timeline', item: {}, stalled: false, unknownTask: false, occupancyAge: 30 * SEC, bootHold: false, onPath: false, followListOpen: false }
  assert.deepEqual(engine.recoveryAfterTab(facts), { action: 'hold' })
})

test('an observed X automation wait becomes a shared comment cooldown once', () => {
  const task = { detail: 'X 提示疑似自动化，冷却中', waitUntil: now + 2 * 60 * MIN }
  const risk = engine.observedReplyRisk({ mode: 'notifications', task, item: { limitedStreak: 2 }, now })
  assert.equal(risk.resumeAt, now + 2 * 60 * MIN)
  assert.equal(risk.streak, 2)
  assert.match(risk.reason, /第 2 次冷却后自动重试（评论三项共用）/)
  assert.equal(engine.observedReplyRisk({ mode: 'notifications', task, item: { resumeAt: now + 3 * 60 * MIN }, now }), null)
  assert.equal(engine.observedReplyRisk({ mode: 'likes-posts', task, item: {}, now }), null)
  const daily = engine.observedReplyRisk({ mode: 'kol', task: { detail: '日发帖上限', waitUntil: now + MIN }, item: {}, now })
  assert.match(daily.reason, /日发帖上限，明天再试/)
})

test('cooling hold only applies to comment and post tasks with a live deadline', () => {
  const item = { resumeAt: now + MIN, reason: 'X 提示疑似自动化，第 1 次冷却后自动重试' }
  assert.equal(engine.coolingHoldReason({ mode: 'timeline', item, now }), item.reason)
  assert.equal(engine.coolingHoldReason({ mode: 'poster', item, now }), item.reason)
  assert.equal(engine.coolingHoldReason({ mode: 'likes-posts', item, now }), '')
  assert.equal(engine.coolingHoldReason({ mode: 'timeline', item: { ...item, resumeAt: now - 1 }, now }), '')
})

test('comment restriction hands timeline or KOL over to notifications', () => {
  const base = { item: {}, restricted: true, manualFocusMode: '', firstDue: 'notifications' }
  assert.equal(engine.commentHandoff({ ...base, mode: 'timeline' }), true)
  assert.equal(engine.commentHandoff({ ...base, mode: 'kol' }), true)
  assert.equal(engine.commentHandoff({ ...base, mode: 'notifications' }), false)
  assert.equal(engine.commentHandoff({ ...base, mode: 'timeline', manualFocusMode: 'timeline' }), false)
  assert.equal(engine.commentHandoff({ ...base, mode: 'timeline', firstDue: 'kol' }), false)
})

test('yield applies the minimum gap and leaves the queue a fresh item', () => {
  const flags = flagsFor({ startedAt: now - 11 * MIN })
  const { item } = engine.yieldItem(flags, { mode: 'timeline', item: { manualStopped: true }, task: { phase: 'running' }, now, minGapMs: 0 })
  assert.equal(item.resumeAt, now + MIN)
  assert.equal(item.reason, '占用超时，轮换到下一项任务')
  assert.equal(item.manualStopped, false)
  assert.equal(item.lastRunAt, now)
})

test('yield keeps a daily cap deadline and its reason', () => {
  const tomorrow = now + 14 * 60 * MIN
  const flags = flagsFor({ task: { phase: 'stopped' } })
  const { item } = engine.yieldItem(flags, { mode: 'timeline', item: { resumeAt: tomorrow, reason: '今日评论已到 1000 条' }, task: { phase: 'stopped' }, now, minGapMs: 0 })
  assert.equal(item.resumeAt, tomorrow)
  assert.equal(item.reason, '今日评论已到 1000 条')
})

test('follow turns are capped at five minutes unless the daily quota ran out', () => {
  const flags = flagsFor({ mode: 'mutual-targetFollow', task: { phase: 'stopped' } })
  const capped = engine.yieldItem(flags, { mode: 'mutual-targetFollow', item: {}, task: { phase: 'stopped' }, now, minGapMs: 30 * MIN })
  assert.equal(capped.item.resumeAt, now + 5 * MIN)
  const quota = engine.yieldItem(flags, { mode: 'mutual-targetFollow', item: {}, task: { phase: 'stopped', detail: '今日关注额度已用完' }, now, minGapMs: 30 * MIN })
  assert.equal(quota.item.resumeAt, now + 30 * MIN)
})

test('a paused X wait passes its deadline through and ends the manual bypass', () => {
  const task = { phase: 'paused', waitUntil: now + 40 * MIN, detail: '关注冷却 40 分钟' }
  const flags = flagsFor({ mode: 'mutual-followBack', task })
  const result = engine.yieldItem(flags, { mode: 'mutual-followBack', item: { manualRequestedAt: now - SEC }, task, now, minGapMs: 0 })
  assert.equal(result.item.manualRequestedAt, 0)
  assert.equal(result.item.reason, '关注冷却 40 分钟')
  assert.equal(result.shareFollowWait, true)
})

test('weekly cleanup tasks say they wait for the next weekly run', () => {
  const flags = flagsFor({ mode: 'mutual-unfollow', task: { phase: 'idle' } })
  assert.equal(engine.yieldItem(flags, { mode: 'mutual-unfollow', item: {}, task: { phase: 'idle' }, now, minGapMs: 0 }).item.reason, '等待每周清理')
  const prune = flagsFor({ mode: 'prune-posts', task: { phase: 'idle' } })
  assert.equal(engine.yieldItem(prune, { mode: 'prune-posts', item: {}, task: { phase: 'idle' }, now, minGapMs: 0 }).item.reason, '清理帖子按速度档等待下次排班')
})

test('dispatch clears per-slice markers but keeps recovery evidence', () => {
  const item = engine.dispatchItem({ reason: 'x', retryKind: 'prune-search-load', manualRequestedAt: 1, sliceActions: 3, recoveryAttempts: 2, lastStartError: 'boom' })
  assert.deepEqual(item, { reason: '', retryKind: '', manualRequestedAt: 0, sliceActions: 0, recoveryAttempts: 2, lastStartError: 'boom' })
})

test('engine trace is a capped ring buffer', () => {
  const trace = createEngineTrace(3)
  for (let i = 0; i < 5; i += 1) trace.note({ mode: 'timeline', verdict: `v${i}` })
  assert.deepEqual(trace.list().map((entry) => entry.verdict), ['v2', 'v3', 'v4'])
  assert.deepEqual(trace.list(1).map((entry) => entry.verdict), ['v4'])
})

test('the scheduler executor is a bounded loop with no self-recursion', async () => {
  const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/background.js', import.meta.url), 'utf8')
  assert.equal(/return runTaskSchedule\(\)/.test(source), false)
  assert.match(source, /for \(let pass = 0; pass < limit; pass \+= 1\)/)
  const manifest = JSON.parse(await readFile(new URL('../../tools/x-reply-clipboard-extension/manifest.json', import.meta.url), 'utf8'))
  assert.ok(manifest.background)
})

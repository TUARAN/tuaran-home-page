import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const background = require('../../tools/x-reply-clipboard-extension/background.js')
const extensionDir = new URL('../../tools/x-reply-clipboard-extension/', import.meta.url)

const FOLLOW = 'mutual-targetFollow'
const SILENT_STOP = {
  blocked: true,
  reason: '已重启 3 次，已跳过这项任务。原因：执行页里的插件脚本没有响应（插件更新或重载后页签没刷新，或页面还没加载完）',
  lastStartError: '执行页里的插件脚本没有响应（插件更新或重载后页签没刷新，或页面还没加载完）',
  reloadAttempts: 3, recoveryAttempts: 3, autoStartRecoveredAt: 1,
}

function shanghaiDay(now = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

async function withChrome(item, run, planExtra = {}) {
  const previousChrome = globalThis.chrome
  const removed = []
  const local = {
    xrcTaskSchedule: {
      enabled: true, strategyVersion: 4, restartAccountVersion: 1, current: '', workTabId: 11, accountHandle: 'me',
      rules: { [FOLLOW]: { enabled: true } },
      items: { [FOLLOW]: { blockedAccount: 'me', ...item } },
      ...planExtra,
    },
    xrcPluginRuntime: { tasks: {}, flow: {} },
  }
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get() { return {} }, async set() {} },
    },
    tabs: {
      async get(id) { return { id, windowId: 1, url: 'https://x.com/home' } },
      async remove(id) { removed.push(id) },
    },
  }
  try {
    const plan = structuredClone(local.xrcTaskSchedule)
    const healed = await background.selfHealStartFailure(plan, Date.now())
    await new Promise((resolve) => setTimeout(resolve, 0))
    return await run({ healed, local, removed, item: local.xrcTaskSchedule.items[FOLLOW], alerts: local.xrcExecutionAlertsV1 || [] })
  } finally {
    globalThis.chrome = previousChrome
  }
}

test('a task stopped by an unconfirmed start is repaired in a new tab without asking', async () => {
  await withChrome(SILENT_STOP, ({ healed, local, removed, item, alerts }) => {
    assert.equal(healed, true)
    assert.deepEqual(removed, [11], 'the old execution tab is closed')
    assert.equal(local.xrcTaskSchedule.workTabId, 0, 'the next start opens a new tab')
    assert.equal(item.blocked, false)
    assert.equal(item.reloadAttempts, 0)
    assert.equal(item.autoStartRecoveredAt, 0)
    assert.equal(item.lastStartError, '', 'the new tab is not counted as a restart')
    assert.equal(item.manualRequestedAt, 0, 'the restart waits its turn: gaps, windows and cooldowns still apply')
    assert.deepEqual([item.selfHeal.count, item.selfHeal.date], [1, shanghaiDay()])
    assert.match(item.reason, /^自动修复：已关掉旧执行页签，轮到时在新页签重新启动（今天第 1\/2 次）。上次原因：执行页里的插件脚本没有响应/)
    assert.equal(alerts[0]?.kind, 'self-healed')
    assert.equal(alerts[0]?.task, FOLLOW)
  })
})

test('after two repairs in one day the task stays stopped and says so once', async () => {
  const spent = { ...SILENT_STOP, selfHeal: { date: shanghaiDay(), count: 2 } }
  await withChrome(spent, async ({ healed, local, removed, item, alerts }) => {
    assert.equal(healed, false)
    assert.deepEqual(removed, [])
    assert.equal(item.blocked, true)
    assert.match(item.reason, /^今天已自动换页签修复 2 次仍未启动，明天会再自动试；也可以手动启动。已重启 3 次/)
    assert.equal(alerts.length, 1)
    assert.equal(alerts[0].kind, 'retry-exhausted')
    const again = await background.selfHealStartFailure(structuredClone(local.xrcTaskSchedule), Date.now())
    assert.equal(again, false)
    assert.equal((local.xrcTaskSchedule.items[FOLLOW].reason.match(/今天已自动换页签修复/gu) || []).length, 1)
  })
})

test('yesterday\'s repairs do not count against today', async () => {
  const yesterday = { ...SILENT_STOP, selfHeal: { date: '2000-01-01', count: 2 } }
  await withChrome(yesterday, ({ healed, item }) => {
    assert.equal(healed, true)
    assert.equal(item.selfHeal.count, 1)
  })
})

test('X limits, page refusals, login pages and manual stops are never repaired', async () => {
  const cases = [
    { blocked: true, reason: '系统超限。X 提示疑似自动化或账号受限', lastStartError: 'X 提示疑似自动化或账号受限' },
    { blocked: true, reason: '已重启 3 次，已跳过这项任务。原因：rate-limited', lastStartError: 'rate-limited' },
    { blocked: true, reason: '已重启 3 次，已跳过这项任务。原因：执行页拒绝启动：暂时没有可用关注源头', lastStartError: '执行页拒绝启动：暂时没有可用关注源头' },
    { blocked: true, reason: '已重启 3 次，已跳过这项任务', lastStartError: '执行页停在 /i/flow/login，不在关注候选的任务页面' },
    { ...SILENT_STOP, manualStopped: true },
    { ...SILENT_STOP, blockedAccount: 'other_acct' },
  ]
  for (const item of cases) {
    await withChrome(item, ({ healed, removed, item: after }) => {
      assert.equal(healed, false, JSON.stringify(item))
      assert.deepEqual(removed, [])
      assert.equal(after.blocked, true)
    })
  }
  await withChrome(SILENT_STOP, ({ healed }) => assert.equal(healed, false), { rules: { [FOLLOW]: { enabled: false } } })
})

test('a repair never closes the tab of a task that is running', async () => {
  await withChrome(SILENT_STOP, ({ healed, removed }) => {
    assert.equal(healed, false)
    assert.deepEqual(removed, [])
  }, { current: 'timeline' })
})

test('the scheduler repairs before dispatching and waits while the panel is being typed in', async () => {
  const source = await readFile(new URL('background.js', extensionDir), 'utf8')
  assert.match(source, /if \(await selfHealStartFailure\(plan, now\)\) return ENGINE_AGAIN;\n  return dispatchNextTask\(plan, now\);/)
  assert.match(source, /if \(!mode \|\| \(oldTabId > 0 && panelTypingRecently\(oldTabId, now\)\)\) \{/)
  // The same-tab rebuild runs once; a second exhaustion stops the task for the repair.
  assert.match(source, /if \(item\.manualStopped \|\| !plan\.enabled \|\| Number\(item\.autoStartRecoveredAt\) > 0\) return false;/)
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.match(content, /"self-healed": \{\n\s+label: "自动修复",/)
})

test('tasks.detail tells the agent the plugin is handling it, then when it gave up for today', async () => {
  const previousChrome = globalThis.chrome
  const local = {
    xrcTaskSchedule: {
      enabled: true, strategyVersion: 4, restartAccountVersion: 1, rules: { [FOLLOW]: { enabled: true } },
      items: { [FOLLOW]: { ...SILENT_STOP, selfHeal: { date: shanghaiDay(), count: 2 } } },
    },
    xrcPluginRuntime: { tasks: {}, flow: {} },
  }
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get() { return {} }, async set() {} },
    },
  }
  try {
    const detail = await background.readTaskDetails(FOLLOW)
    const follow = detail.tasks[0]
    assert.equal(follow.selfHealToday, '2/2')
    assert.match(follow.whatToDo, /^今天 2 次自动修复都没成功，明天会再自动试。刷新执行页签/)
  } finally {
    globalThis.chrome = previousChrome
  }
})

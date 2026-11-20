import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const background = require('../../tools/x-reply-clipboard-extension/background.js')
const engine = require('../../tools/x-reply-clipboard-extension/taskEngine.js')
const extensionDir = new URL('../../tools/x-reply-clipboard-extension/', import.meta.url)

const OTHERS_BLOCKED = {
  timeline: { blocked: true }, kol: { blocked: true },
  'likes-posts': { blocked: true }, 'likes-replies': { blocked: true },
  'mutual-followBack': { blocked: true }, 'mutual-targetFollow': { blocked: true },
}

// The notification task has waited past the 90-second confirmation window on tab 11.
async function unconfirmedStart({ url, onStart }) {
  const previousChrome = globalThis.chrome
  const now = Date.now()
  const local = {
    xrcTaskSchedule: {
      enabled: true, strategyVersion: 4, replyRiskVersion: 2, current: 'notifications', workTabId: 11, startedAt: now - 95_000,
      items: { ...OTHERS_BLOCKED, notifications: { reloadAttempts: 0 } },
    },
    xrcPluginRuntime: {
      tasks: { notifications: { tabId: 11, phase: 'starting', updatedAt: now - 95_000 } },
      flow: { phase: 'running' },
    },
  }
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get() { return {} }, async set() {} },
    },
    tabs: {
      async get(id) { return { id, windowId: 1, url } },
      async sendMessage(_id, message) {
        if (message.type === 'xrc-task-state-probe') return { ok: true, mode: 'notifications', phase: 'starting' }
        if (message.type === 'xrc-task-start') return onStart()
        return null
      },
      async update() {},
    },
    windows: { async update() {} },
  }
  try {
    await background.runTaskSchedule()
    return local.xrcTaskSchedule.items.notifications
  } finally {
    globalThis.chrome = previousChrome
  }
}

test('a start the page script never answers records that the script did not respond', async () => {
  const item = await unconfirmedStart({
    url: 'https://x.com/notifications',
    onStart: () => { throw new Error('Could not establish connection. Receiving end does not exist.') },
  })
  assert.equal(item.reloadAttempts, 1)
  assert.match(item.lastStartError, /插件脚本没有响应/)
  assert.match(engine.startFailureHelp(item.lastStartError), /刷新执行页签/)
})

test('an execution tab sitting on another page records where it is', async () => {
  const item = await unconfirmedStart({ url: 'https://x.com/i/flow/login', onStart: () => null })
  assert.match(item.lastStartError, /执行页停在 \/i\/flow\/login，不在.*任务页面/)
  assert.match(engine.startFailureHelp(item.lastStartError), /登录、验证/)
})

test('a page that answers nothing says it got no result, not the old generic text', async () => {
  const item = await unconfirmedStart({ url: 'https://x.com/notifications', onStart: () => undefined })
  assert.match(item.lastStartError, /收到启动请求，但没有回复结果/)
})

test('a skip after three restarts says the cause and what to do', () => {
  const copy = background.restartSkipCopy({ lastStartError: '执行页里的插件脚本没有响应（插件更新或重载后页签没刷新，或页面还没加载完）' }, 3)
  assert.match(copy, /^已重启 3 次，已跳过这项任务。原因：执行页里的插件脚本没有响应/)
  assert.match(copy, /。处理：刷新执行页签/)
  const legacy = background.restartSkipCopy({}, 3)
  assert.match(legacy, /原因：执行页没有回报启动结果。处理：页面打开了，但插件没等到开始信号/)
  assert.equal(engine.startFailureHelp(''), '')
})

test('rotating away from a stopped task keeps why it stopped', async () => {
  const source = await readFile(new URL('background.js', extensionDir), 'utf8')
  assert.match(source, /plan\.items\[owner\] = prior\.blocked \? prior : \{ \.\.\.prior,/)
})

test('tasks.detail tells the agent what to do about a start error', async () => {
  const previousChrome = globalThis.chrome
  const local = {
    xrcTaskSchedule: {
      enabled: true, strategyVersion: 4, restartAccountVersion: 1,
      rules: { 'mutual-targetFollow': { enabled: true } },
      items: { 'mutual-targetFollow': { blocked: true, reason: '已重启 3 次，已跳过这项任务', lastStartError: '执行页没有回报启动结果' } },
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
    const detail = await background.readTaskDetails('mutual-targetFollow')
    const follow = detail.tasks.find((entry) => /关注/.test(entry.task))
    assert.ok(follow, JSON.stringify(detail))
    assert.match(follow.whatToDo, /插件会自己处理：关掉旧执行页签，在新页签重新启动这项任务（今天还能自动修 2 次）/)
  } finally {
    globalThis.chrome = previousChrome
  }
})

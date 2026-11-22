import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const require = createRequire(import.meta.url)
const background = require('../../tools/x-reply-clipboard-extension/background.js')

function browser({ tabs, local = {}, plan = {}, runtime = { tasks: {}, flow: {} } }) {
  const removed = []
  const updates = []
  const created = []
  Object.assign(local, {
    xrcTaskSchedule: { enabled: true, strategyVersion: 4, accountHandle: 'me', items: {}, ...plan },
    xrcPluginRuntime: runtime,
  })
  const chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get() { return {} }, async set() {} },
    },
    tabs: {
      async get(id) {
        const tab = tabs.find((entry) => entry.id === id && !removed.includes(id))
        if (!tab) throw new Error(`No tab with id: ${id}`)
        return tab
      },
      async query() { return tabs.filter((tab) => !removed.includes(tab.id)) },
      async remove(id) { removed.push(id) },
      async update(id, update) { updates.push({ id, ...update }) },
      async create(options) { const id = 900 + created.length; created.push(options); tabs.push({ id, url: 'about:blank' }); return { id, windowId: 1 } },
    },
  }
  return { chrome, local, removed, updates, created, tabs }
}

async function using(setup, run) {
  const previousChrome = globalThis.chrome
  globalThis.chrome = setup.chrome
  try { return await run(setup) } finally { globalThis.chrome = previousChrome }
}

test('old execution tabs and stale task rows are closed; the live one and the one in front stay', async () => {
  const setup = browser({
    tabs: [
      { id: 11, url: 'https://x.com/notifications', active: false },
      { id: 12, url: 'https://x.com/home', active: false },
      { id: 13, url: 'https://x.com/me/followers', active: false },
      { id: 14, url: 'https://x.com/home', active: true },
      { id: 15, url: 'https://x.com/home', active: false },
      { id: 16, url: 'https://example.com/', active: false },
      { id: 17, url: 'https://x.com/a/status/1', active: false },
    ],
    local: { xrcCreatedExecTabs: [11, 12, 13, 14, 15, 16, 17, 99] },
    plan: { workTabId: 11, detachedReplyTabIds: [15] },
    runtime: { tasks: { 'likes-posts': { tabId: 17, phase: 'starting' } }, flow: {} },
  })
  await using(setup, async ({ local, removed }) => {
    const closed = await background.closeStrayExecTabs(local.xrcTaskSchedule)
    // 17 has a runtime row, but the schedule is not on that task: a second tab is not allowed.
    assert.equal(closed, 3)
    assert.deepEqual(removed.sort((a, b) => a - b), [12, 13, 17])
    // Gone, navigated off X, and closed tabs leave the list; kept ones stay for a later pass.
    assert.deepEqual([...local.xrcCreatedExecTabs].sort((a, b) => a - b), [11, 14, 15])
  })
})

test('the task running in the execution tab keeps its tab', async () => {
  const setup = browser({
    tabs: [{ id: 11, url: 'https://x.com/home', active: false }, { id: 17, url: 'https://x.com/home', active: false }],
    local: { xrcCreatedExecTabs: [11, 17] },
    plan: { workTabId: 17, current: 'likes-posts' },
    runtime: { tasks: { 'likes-posts': { tabId: 17, phase: 'running' } }, flow: {} },
  })
  await using(setup, async ({ local, removed }) => {
    assert.equal(await background.closeStrayExecTabs(local.xrcTaskSchedule), 1)
    assert.deepEqual(removed, [11])
  })
})

test('tabs the list never knew are found by their task title on every pass', async () => {
  const setup = browser({
    tabs: [
      { id: 11, url: 'https://x.com/notifications', title: '@me · 评论回复 · Notifications', active: false },
      { id: 21, url: 'https://x.com/home', title: '@me · 点赞帖子 · Home / X', active: false },
      { id: 22, url: 'https://x.com/x/followers', title: '@ME · 关注候选 · People', active: false },
      { id: 23, url: 'https://x.com/home', title: '@other · 评论首页 · Home', active: false },
      { id: 24, url: 'https://x.com/someone', title: 'Someone (@someone) / X', active: false },
      { id: 25, url: 'https://x.com/home', title: '@me · 评论首页 · Home', active: true },
    ],
    plan: { workTabId: 11 },
  })
  await using(setup, async ({ local, removed }) => {
    assert.equal(await background.closeStrayExecTabs(local.xrcTaskSchedule), 2)
    assert.deepEqual(removed.sort(), [21, 22], 'another account and ordinary X pages are left alone')
    setup.tabs.push({ id: 26, url: 'https://x.com/home', title: '@me · 回关 · Home', active: false })
    assert.equal(await background.closeStrayExecTabs(local.xrcTaskSchedule), 1, 'a tab titled later is closed on the next pass')
    assert.ok(removed.includes(26))
  })
})

test('a tab that would not close is retried on a later pass', async () => {
  const setup = browser({
    tabs: [{ id: 11, url: 'https://x.com/home' }, { id: 12, url: 'https://x.com/home', active: false }],
    local: { xrcCreatedExecTabs: [12] },
    plan: { workTabId: 11 },
  })
  setup.chrome.tabs.remove = async () => { throw new Error('beforeunload') }
  await using(setup, async ({ local }) => {
    assert.equal(await background.closeStrayExecTabs(local.xrcTaskSchedule), 0)
    assert.deepEqual(local.xrcCreatedExecTabs, [12])
  })
})

test('background comment replies reuse the execution tab instead of opening another', async () => {
  const setup = browser({
    tabs: [{ id: 5, url: 'https://x.com/home', active: true, windowId: 1 }, { id: 11, url: 'https://x.com/home', active: false, windowId: 1 }],
    plan: { workTabId: 11 },
  })
  await using(setup, async ({ local, created, updates }) => {
    const opened = await background.openNotificationsInBackground({ tab: { id: 5, windowId: 1, url: 'https://x.com/home' } })
    assert.equal(opened.tabId, 11)
    assert.equal(opened.reused, true)
    assert.equal(created.length, 0)
    assert.match(updates.find((entry) => entry.id === 11)?.url || '', /\/notifications/)
    assert.equal(updates.some((entry) => entry.active === true), false, 'the person\'s tab stays in front')
    assert.equal(local.xrcTaskSchedule.workTabId, 11)
  })
})

test('with no execution tab, the new comment-reply tab goes on the created list', async () => {
  const setup = browser({ tabs: [{ id: 5, url: 'https://x.com/home', active: true, windowId: 1 }], plan: { workTabId: 0 } })
  await using(setup, async ({ local, created }) => {
    const opened = await background.openNotificationsInBackground({ tab: { id: 5, windowId: 1, url: 'https://x.com/home' } })
    assert.equal(created.length, 1)
    assert.equal(opened.reused, false)
    assert.deepEqual(local.xrcCreatedExecTabs, [opened.tabId])
  })
})

test('only the newest reply tab left with a draft is kept; older ones are closed', async () => {
  const setup = browser({
    tabs: [
      { id: 11, url: 'https://x.com/home', active: false },
      { id: 31, url: 'https://x.com/home', active: false },
      { id: 32, url: 'https://x.com/home', active: false },
      { id: 33, url: 'https://x.com/home', active: false },
    ],
    plan: { workTabId: 11, detachedReplyTabIds: [31, 32, 33] },
  })
  await using(setup, async ({ local, removed }) => {
    assert.equal(await background.closeStrayExecTabs(local.xrcTaskSchedule), 2)
    assert.deepEqual(removed.sort(), [31, 32], 'one execution tab plus one extra')
    assert.deepEqual(local.xrcTaskSchedule.detachedReplyTabIds, [33])
  })
})

test('the active tab of a window behind is not the tab in front and is closed', async () => {
  const setup = browser({
    tabs: [
      { id: 11, url: 'https://x.com/home', active: false, windowId: 1 },
      { id: 41, url: 'https://x.com/home', active: true, windowId: 2 },
      { id: 42, url: 'https://x.com/home', active: true, windowId: 1 },
    ],
    local: { xrcCreatedExecTabs: [41, 42] },
    plan: { workTabId: 11 },
  })
  setup.chrome.windows = { async getLastFocused() { return { id: 1 } } }
  await using(setup, async ({ local, removed }) => {
    assert.equal(await background.closeStrayExecTabs(local.xrcTaskSchedule), 1)
    assert.deepEqual(removed, [41])
  })
})

test('the sweep runs on every pass, also while a task is running', async () => {
  const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/background.js', import.meta.url), 'utf8')
  assert.match(source, /await closeStrayExecTabs\(plan, now\);\n  if \(plan\.current\) \{\n    const settled = await settleCurrentTask/)
  assert.match(source, /await saveTaskSchedule\(plan\);\n  \/\/ Only the newest such tab is kept; closeStrayExecTabs closes the older ones\.\n  await noteCreatedExecTab\(tabId\);/)
})

test('tabs registered for a task the schedule moved off are closed too', async () => {
  const setup = browser({
    tabs: [{ id: 11, url: 'https://x.com/home', active: false }, { id: 51, url: 'https://x.com/notifications', active: false }],
    plan: { workTabId: 11 },
  })
  setup.chrome.storage.session.get = async () => ({ xrcTaskTabs: { notifications: 51, timeline: 11 } })
  await using(setup, async ({ local, removed }) => {
    assert.equal(await background.closeStrayExecTabs(local.xrcTaskSchedule), 1)
    assert.deepEqual(removed, [51])
  })
})

test('a newer local build loads between two tasks instead of waiting for an idle moment', async () => {
  const previous = globalThis.XrcLocalDevUpdate
  const now = Date.now()
  try {
    globalThis.XrcLocalDevUpdate = { async status() { return { phase: 'waiting', version: '9.9.9' } } }
    assert.equal(await background.localUpdateDue(now), true)
    globalThis.XrcLocalDevUpdate = { async status() { return { phase: 'available', firstSeenAt: now - 10_000 } } }
    assert.equal(await background.localUpdateDue(now), false, 'a build seen seconds ago may still be mid-save')
    globalThis.XrcLocalDevUpdate = { async status() { return { phase: 'available', firstSeenAt: now - 61_000 } } }
    assert.equal(await background.localUpdateDue(now), true)
    globalThis.XrcLocalDevUpdate = { async status() { return { phase: 'latest' } } }
    assert.equal(await background.localUpdateDue(now), false)
  } finally {
    globalThis.XrcLocalDevUpdate = previous
  }
  const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/background.js', import.meta.url), 'utf8')
  assert.match(source, /if \(!plan\.current && await localUpdateDue\(now\)\) \{[\s\S]{0,400}setTimeout\(\(\) => \{ applyLocalDevUpdate\(\)\.catch\(\(\) => \{\}\); \}, 0\);\n    return plan;\n  \}\n  return dispatchNextTask\(plan, now\);/)
})

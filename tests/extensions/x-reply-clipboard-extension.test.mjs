import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const loop = require('../../tools/x-reply-clipboard-extension/loop.js')
const mutual = require('../../tools/x-reply-clipboard-extension/mutual.js')
const poster = require('../../tools/x-reply-clipboard-extension/poster.js')
const context = require('../../tools/x-reply-clipboard-extension/context.js')
const background = require('../../tools/x-reply-clipboard-extension/background.js')
const autoLike = require('../../tools/x-reply-clipboard-extension/autoLike.js')
const receipt = require('../../tools/x-reply-clipboard-extension/receipt.js')
const devUpdate = require('../../tools/x-reply-clipboard-extension/devUpdate.js')
const extensionDir = new URL('../../tools/x-reply-clipboard-extension/', import.meta.url)

test('automation retries wait 10, 20, 30 minutes and keep increasing', () => {
  assert.deepEqual([1, 2, 3, 4].map(loop.automationCooldownMs), [600000, 1200000, 1800000, 2400000])
})

test('follow and post tasks stay active while their automation cooldown grows', async () => {
  for (const filename of ['mutual.js', 'poster.js']) {
    const source = await readFile(new URL(filename, extensionDir), 'utf8')
    const helper = source.match(/  function coolDownForRisk\(\) \{[\s\S]*?\n  \}/)?.[0]
    assert.ok(helper)
    const state = { running: true, stopping: false, mode: 'unfollow', riskCooldownUntil: 0, riskRetries: 0, cooldownUntil: 0, nextPostAt: 0 }
    const sandbox = vm.createContext({
      state, root: { XReplyClipboardLoop: loop }, Date: { now: () => 1000 },
      sessionStorage: { setItem() {} }, emit() {}, formatClock: () => '10:00', savePublishList() {},
    })
    vm.runInContext(`${helper}\nglobalThis.cool = coolDownForRisk`, sandbox)
    assert.equal(sandbox.cool(), true)
    assert.equal(state.running, true)
    assert.equal(state.riskCooldownUntil, 601000)
    assert.equal(sandbox.cool(), false)
    state.riskCooldownUntil = 0
    assert.equal(sandbox.cool(), true)
    assert.equal(state.riskCooldownUntil, 1201000)
  }
})

test('reply and post pace controls use one compact row with accessible choices', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  assert.match(source, /xrc-speed-section xrc-pace-row/)
  assert.match(source, /xrc-round-pace xrc-pace-row/)
  assert.match(source, /<button type="button" data-xrc-post-pace-label="\$\{item\.id\}" aria-pressed="false">/)
  assert.match(source, /<button type="button" data-xrc-pace-label="\$\{item\.id\}" aria-pressed="false">/)
  assert.match(source, /label\.setAttribute\("aria-pressed", String\(active\)\)/)
  assert.match(source, /label\.disabled = replyPaceLocked/)
  assert.match(source, /label\.disabled = Boolean\(poster\.running\)/)
  assert.doesNotMatch(source, /data-xrc-pace aria-label="频率挡位"/)
  assert.match(css, /\.xrc-pace-row \{\s*display: flex;/)
  assert.match(css, /\.xrc-pace-options \{\s*display: grid;/)
  assert.match(css, /\.xrc-pace-options::before \{[\s\S]*?right: 12\.5%;[\s\S]*?left: 12\.5%;[\s\S]*?height: 2px;/)
  assert.match(css, /\.xrc-pace-options button \{[\s\S]*?position: relative;[\s\S]*?background: #fff;/)
})

test('task window hints distinguish opening, jumping, and current window', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const groupDefinition = source.match(/  function taskGroupTarget\(group,[\s\S]*?\n  \}/)?.[0]
  const titleDefinition = source.match(/  function taskWindowTitle\(mode,[\s\S]*?\n  \}/)?.[0]
  assert.ok(groupDefinition)
  assert.ok(titleDefinition)
  const context = vm.createContext({
    TASK_GROUP_MODES: { reply: ['timeline', 'notifications'], likes: ['likes-posts', 'likes-replies'] },
    TASK_MODE_LABELS: { timeline: '评论帖子', notifications: '评论通知', 'likes-posts': '点赞帖子' },
    openTaskTabs: {},
    pluginRuntime: { tasks: {} },
    currentTaskKey: () => 'timeline',
  })
  vm.runInContext(`${groupDefinition}\n${titleDefinition}\nglobalThis.target = taskGroupTarget; globalThis.title = taskWindowTitle`, context)
  assert.equal(context.title('notifications', {}, 'timeline'), '打开评论通知窗口')
  assert.equal(context.title('notifications', { notifications: 42 }, 'timeline'), '跳转到已打开的评论通知窗口')
  assert.equal(context.title('timeline', { timeline: 12 }, 'timeline'), '当前评论帖子窗口')
  const target = context.target('reply', { timeline: 12, notifications: 42 }, 'timeline', { notifications: { phase: 'running' } })
  assert.equal(target.mode, 'notifications')
  assert.equal(target.openedElsewhere, true)
  assert.equal(context.target('reply', { timeline: 12 }, 'timeline', {}).openedElsewhere, false)
  assert.match(source, /button\.title = taskTabHint\(button\.dataset\.xrcReplyTab\)/)
  assert.match(source, /button\.title = taskTabHint\(`likes-\$\{button\.dataset\.xrcLikeTab\}`\)/)
})

test('task window state drops closed tabs before showing jump hints', async () => {
  const previousChrome = globalThis.chrome
  let saved = { timeline: 12, notifications: 42 }
  globalThis.chrome = {
    storage: { session: {
      async get() { return { xrcTaskTabs: saved } },
      async set(value) { saved = value.xrcTaskTabs },
    } },
    tabs: { async get(tabId) {
      if (tabId === 42) throw new Error('No tab')
      return { id: tabId }
    } },
  }
  try {
    const result = await background.getOpenTaskTabs()
    assert.deepEqual(result.tabs, { timeline: 12 })
    assert.deepEqual(saved, { timeline: 12 })
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('local extension update waits for idle tasks, then reloads registered X tabs once', async () => {
  const backgroundSource = await readFile(new URL('background.js', extensionDir), 'utf8')
  const contentSource = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.match(backgroundSource, /importScripts\("receipt\.js", "devUpdate\.js"\)/)
  assert.match(backgroundSource, /XrcLocalDevUpdate\?\.install\?\.\(\{ readRuntime: readPluginRuntime, taskTabs: getOpenTaskTabs \}\)/)
  assert.match(contentSource, /data-xrc-dev-update/)
  assert.match(contentSource, /data-xrc-dev-update-now/)
  assert.match(contentSource, /xrc-dev-update-apply/)
  assert.match(backgroundSource, /xrc-dev-update-apply/)
  const values = {}
  const reloadedTabs = []
  const badges = []
  let installed = '3.29.3'
  let extensionReloads = 0
  let busy = true
  const chromeApi = {
    runtime: {
      getManifest: () => ({ version: installed }),
      getURL: (path) => `chrome-extension://test/${path}`,
      reload: () => { extensionReloads += 1 },
    },
    storage: { local: {
      async get(key) { return { [key]: values[key] } },
      async set(value) { Object.assign(values, value) },
      async remove(key) { delete values[key] },
    } },
    action: { async setBadgeText(value) { badges.push(value.text) }, async setBadgeBackgroundColor() {} },
    tabs: {
      async get(id) { return { id, url: id === 7 ? 'https://x.com/home' : 'https://example.com/' } },
      async reload(id) { reloadedTabs.push(id) },
    },
  }
  const args = {
    chromeApi,
    fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.30.0' }) }),
    readRuntime: async () => ({ tasks: busy ? { timeline: { tabId: 7 } } : {}, flow: { phase: busy ? 'running' : 'idle' } }),
    taskTabs: async () => ({ tabs: { timeline: 7, poster: 8 } }),
    reload: () => { extensionReloads += 1 },
  }
  assert.equal(devUpdate.compareVersions('3.30.0', '3.29.3'), 1)
  assert.equal((await devUpdate.check({ ...args, now: 1000 })).phase, 'available')
  assert.equal((await devUpdate.check({ ...args, now: 62000 })).phase, 'waiting')
  assert.equal(extensionReloads, 0)
  busy = false
  assert.equal((await devUpdate.check({ ...args, now: 63000 })).phase, 'applying')
  assert.equal(extensionReloads, 1)
  installed = '3.30.0'
  assert.equal(await devUpdate.finishReload(chromeApi, 64000), true)
  assert.deepEqual(reloadedTabs, [7])
  assert.equal(values[devUpdate.RELOAD_KEY], undefined)
  assert.equal(values[devUpdate.STATUS_KEY].phase, 'updated')
  assert.ok(badges.includes('NEW'))
  assert.equal(badges.at(-1), '')
})

test('failed local extension reload does not repeatedly restart Chrome tasks', async () => {
  const values = { [devUpdate.RELOAD_KEY]: { version: '3.30.0', at: 1000, tabs: [7] } }
  let reloads = 0
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '3.29.3' }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: { local: {
      async get(key) { return { [key]: values[key] } },
      async set(value) { Object.assign(values, value) },
      async remove(key) { delete values[key] },
    } },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
  }
  assert.equal(await devUpdate.finishReload(chromeApi, 2000), false)
  assert.equal(values[devUpdate.STATUS_KEY].phase, 'failed')
  const result = await devUpdate.check({
    chromeApi, now: 3000,
    fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.30.0' }) }),
    readRuntime: async () => ({ tasks: {} }), taskTabs: async () => ({ tabs: {} }),
    reload: () => { reloads += 1 },
  })
  assert.equal(result.phase, 'failed')
  assert.equal(reloads, 0)
})

test('a failed version switch still attempts to restore tasks that were stopped for the update', async () => {
  const values = { [devUpdate.RELOAD_KEY]: { version: '3.32.6', at: 1000, tabs: [7], resumeModes: { 7: 'timeline' } } }
  const resumes = {}
  const reloaded = []
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '3.32.5' }) },
    storage: {
      local: { async get(key) { return { [key]: values[key] } }, async set(value) { Object.assign(values, value) }, async remove(key) { delete values[key] } },
      session: { async set(value) { Object.assign(resumes, value) } },
    },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
    tabs: { async get(id) { return { id, url: 'https://x.com/home' } }, async reload(id) { reloaded.push(id) } },
  }
  assert.equal(await devUpdate.finishReload(chromeApi, 2000), false)
  assert.deepEqual(reloaded, [7])
  assert.equal(resumes['xrcPendingTab:7'].start, true)
  assert.match(values[devUpdate.STATUS_KEY].error, /已尝试恢复原任务/)
})

test('manual local update waits for active tasks instead of interrupting them', async () => {
  const values = {}
  let reloads = 0
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '3.31.0' }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: { local: {
      async get(key) { return { [key]: values[key] } },
      async set(value) { Object.assign(values, value) },
      async remove(key) { delete values[key] },
    } },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
  }
  const result = await devUpdate.applyNow({
    chromeApi,
    fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.32.0' }) }),
    readRuntime: async () => ({ tasks: { timeline: { tabId: 7, phase: 'running' }, 'likes-posts': { tabId: 8, phase: 'paused' } }, flow: { phase: 'running' } }),
    taskTabs: async () => ({ tabs: { timeline: 7, notifications: 8 } }),
    now: () => 1000,
    reload: () => { reloads += 1 },
  })
  assert.equal(result.ok, true)
  assert.equal(result.phase, 'waiting')
  assert.equal(reloads, 0)
  assert.equal(values[devUpdate.RELOAD_KEY], undefined)
  assert.equal(values[devUpdate.STATUS_KEY].phase, 'waiting')
  assert.equal((await devUpdate.check({
    chromeApi, now: 62000,
    fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.32.0' }) }),
    readRuntime: async () => ({ tasks: {}, flow: { phase: 'idle' } }),
    taskTabs: async () => ({ tabs: { timeline: 7, notifications: 8 } }),
    reload: () => { reloads += 1 },
  })).phase, 'applying')
  assert.equal(reloads, 1)
})

test('manual update stops active tasks, reloads the extension, and restores only previously active modes', async () => {
  const values = {}
  const resumes = {}
  const reloaded = []
  const navigated = []
  let active = true
  let stops = 0
  let reloads = 0
  let installed = '3.32.5'
  const chromeApi = {
    runtime: { getManifest: () => ({ version: installed }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: {
      local: {
        async get(key) { return { [key]: values[key] } },
        async set(value) { Object.assign(values, value) },
        async remove(key) { delete values[key] },
      },
      session: { async set(value) { Object.assign(resumes, value) } },
    },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
    tabs: {
      async get(id) { return { id, url: id === 8 ? 'https://x.com/notifications' : 'https://x.com/home' } },
      async reload(id) { reloaded.push(id) },
      async update(id, options) { navigated.push([id, options.url]) },
    },
  }
  const result = await devUpdate.applyNow({
    chromeApi, force: true,
    fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.32.6' }) }),
    readRuntime: async () => ({ tasks: active ? { timeline: { tabId: 7, phase: 'running' }, 'likes-posts': { tabId: 8, phase: 'paused' } } : {}, flow: { phase: active ? 'running' : 'paused' } }),
    taskTabs: async () => ({ tabs: { timeline: 7, 'likes-posts': 8, poster: 9 } }),
    stopTasks: async () => { stops += 1; active = false; values.xrcPluginRuntime = { startedAt: null, tasks: {}, flow: { phase: 'paused' } }; return { ok: true } },
    now: () => 1000,
    reload: () => { reloads += 1 },
  })
  assert.equal(result.phase, 'applying')
  assert.equal(stops, 1)
  assert.equal(reloads, 1)
  assert.deepEqual(values[devUpdate.RELOAD_KEY].resumeModes, { 7: 'timeline', 8: 'likes-posts' })
  assert.deepEqual(values[devUpdate.RELOAD_KEY].tabs, [7, 8, 9])
  installed = '3.32.6'
  assert.equal(await devUpdate.finishReload(chromeApi, 2000), true)
  assert.equal(values.xrcPluginRuntime.flow.phase, 'idle')
  assert.deepEqual(reloaded, [7, 9])
  assert.deepEqual(navigated, [[8, 'https://x.com/home']])
  assert.equal(resumes['xrcPendingTab:7'].start, true)
  assert.equal(resumes['xrcPendingTab:8'].start, true)
  assert.equal(resumes['xrcPendingTab:9'], undefined)
})

test('manual update restores stopped tasks if it cannot prepare the new version', async () => {
  const values = {}
  const resumes = {}
  const reloaded = []
  let active = true
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '3.32.5' }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: {
      local: { async get(key) { return { [key]: values[key] } }, async set(value) { Object.assign(values, value) }, async remove(key) { delete values[key] } },
      session: { async set(value) { Object.assign(resumes, value) } },
    },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
    tabs: { async get(id) { return { id, url: 'https://x.com/home' } }, async reload(id) { reloaded.push(id) } },
  }
  const result = await devUpdate.applyNow({
    chromeApi, force: true,
    fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.32.6' }) }),
    readRuntime: async () => ({ tasks: active ? { timeline: { tabId: 7, phase: 'running' } } : {}, flow: { phase: active ? 'running' : 'paused' } }),
    stopTasks: async () => { active = false; return { ok: true } },
    taskTabs: async () => { throw new Error('任务窗口读取失败') },
    now: () => 1000,
  })
  assert.equal(result.ok, false)
  assert.deepEqual(reloaded, [7])
  assert.equal(resumes['xrcPendingTab:7'].start, true)
  assert.match(result.error, /已尝试恢复原任务/)
})

test('version check marks the installed local version as latest', async () => {
  const values = {}
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '3.32.6' }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: { local: { async get(key) { return { [key]: values[key] } }, async set(value) { Object.assign(values, value) } } },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
  }
  const result = await devUpdate.check({
    chromeApi, now: 1000,
    fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.32.6' }) }),
  })
  assert.equal(result, null)
  assert.deepEqual(values[devUpdate.STATUS_KEY], { version: '3.32.6', phase: 'latest', at: 1000 })
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.match(source, /data-xrc-version-badge data-state="checking"/)
  assert.match(source, /badge\.textContent = newer \? "有新版本"[^\n]*"最新版"/)
  assert.match(source, /button\.hidden = phase === "updated" \|\| phase === "latest"/)
  const backgroundSource = await readFile(new URL('background.js', extensionDir), 'utf8')
  assert.match(backgroundSource, /stopTasks: pauseAllTasks,[\s\S]*?force: true/)
})

test('manual local update leaves tasks running when no newer version exists', async () => {
  let stops = 0
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '3.32.0' }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: { local: { async get() { return {} }, async set() {} } },
  }
  const result = await devUpdate.applyNow({
    chromeApi, fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.32.0' }) }),
    readRuntime: async () => ({}), taskTabs: async () => ({}), stopTasks: async () => { stops += 1 },
  })
  assert.equal(result.ok, false)
  assert.equal(stops, 0)
  assert.match(result.error, /没有比当前扩展更新的版本/)
})

test('manual local update reloads immediately when all tasks are idle', async () => {
  const values = {}
  let reloads = 0
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '3.32.0' }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: { local: {
      async get(key) { return { [key]: values[key] } },
      async set(value) { Object.assign(values, value) },
      async remove(key) { delete values[key] },
    } },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
  }
  const result = await devUpdate.applyNow({
    chromeApi, fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.32.1' }) }),
    readRuntime: async () => ({ tasks: {}, flow: { phase: 'idle' } }),
    taskTabs: async () => ({ tabs: { timeline: 7 } }),
    now: () => 1000, reload: () => { reloads += 1 },
  })
  assert.equal(result.phase, 'applying')
  assert.equal(reloads, 1)
  assert.deepEqual(values[devUpdate.RELOAD_KEY], { version: '3.32.1', at: 1000, tabs: [7], resumeModes: {} })
})

test('local update refreshes task tabs with resume intents without pausing them', async () => {
  const values = { [devUpdate.RELOAD_KEY]: { version: '3.32.1', at: 1000, tabs: [7, 8], resumeModes: { 7: 'timeline', 8: 'likes-posts' } } }
  const resumes = {}
  const reloaded = []
  const navigated = []
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '3.32.1' }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: { local: {
      async get(key) { return { [key]: values[key] } },
      async set(value) { Object.assign(values, value) },
      async remove(key) { delete values[key] },
    }, session: { async set(value) { Object.assign(resumes, value) } } },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
    tabs: {
      async get(id) { return { id, url: id === 7 ? 'https://x.com/home' : 'https://x.com/notifications' } },
      async reload(id) { reloaded.push(id) },
      async update(id, options) { navigated.push([id, options.url]) },
    },
  }
  assert.equal(await devUpdate.finishReload(chromeApi, 2000), true)
  assert.deepEqual(reloaded, [7])
  assert.deepEqual(navigated, [[8, 'https://x.com/home']])
  assert.deepEqual(resumes['xrcPendingTab:7'], { mode: 'timeline', path: '/home', start: true, at: 2000 })
  assert.deepEqual(resumes['xrcPendingTab:8'], { mode: 'likes-posts', path: '/home', start: true, at: 2000 })
  assert.equal(values[devUpdate.RELOAD_KEY], undefined)
  assert.equal(values[devUpdate.STATUS_KEY].phase, 'updated')
})

test('task close only removes the registered window shown by the arrow', async () => {
  const previousChrome = globalThis.chrome
  let tabs = { timeline: 11, notifications: 22, 'likes-posts': 33 }
  let runtime = { startedAt: 1, tasks: { timeline: { tabId: 11 }, notifications: { tabId: 22 } }, flow: { phase: 'running' } }
  const removed = []
  globalThis.chrome = {
    storage: {
      session: {
        async get() { return { xrcTaskTabs: tabs } },
        async set(value) { tabs = value.xrcTaskTabs },
      },
      local: {
        async get() { return { xrcPluginRuntime: runtime } },
        async set(value) { runtime = value.xrcPluginRuntime },
      },
    },
    tabs: {
      async remove(tabId) { removed.push(tabId) },
    },
  }
  try {
    await assert.rejects(background.closeTaskTab('notifications', 99, { tab: { id: 11 } }), /任务窗口已变化/)
    await assert.rejects(background.closeTaskTab('timeline', 11, { tab: { id: 11 } }), /不能从当前任务窗口关闭自己/)
    assert.deepEqual(removed, [])
    const result = await background.closeTaskTab('notifications', 22, { tab: { id: 11 } })
    assert.equal(result.closed, true)
    assert.deepEqual(removed, [22])
    assert.deepEqual(tabs, { timeline: 11, 'likes-posts': 33 })
    assert.equal(runtime.tasks.notifications, undefined)
    assert.deepEqual(runtime.tasks.timeline, { tabId: 11 })
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('each concrete task tab owns its own jump and close control', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  for (const [attribute, mode] of [
    ['reply', 'timeline'], ['reply', 'notifications'],
    ['like', 'posts'], ['like', 'replies'],
    ['mutual', 'unfollow'], ['mutual', 'followBack'],
  ]) {
    assert.match(source, new RegExp(`<div class="xrc-subtask-slot"><button[^>]*data-xrc-${attribute}-tab="${mode}"[^>]*>[\\s\\S]*?<\\/button><button class="xrc-task-tab-close"[^>]*data-xrc-task-close`))
  }
  assert.doesNotMatch(source, /data-xrc-task-close="(reply|likes|mutual|poster)"/)
  assert.match(source, /close\.dataset\.xrcTargetMode = openedElsewhere \? mode : ""/)
  assert.match(source, /close\.dataset\.xrcTargetTabId = openedElsewhere \? String\(tabId\) : ""/)
  assert.match(css, /\.xrc-subtask-slot\.is-open button\[role="tab"\]::after \{[\s\S]*?content: "↗"/)
  assert.match(css, /\.xrc-subtask-slot\.is-open:hover \.xrc-task-tab-close/)
  assert.doesNotMatch(source, /xrc-open-mark|xrc-close-mark/)
})

test('header menu updates keep the collapse and expand SVG icons', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  const definition = source.match(/  function syncHeaderMenu\(panel\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const iconButton = () => ({ children: ['svg'], set textContent(value) { this.children = [value] } })
  const collapse = iconButton()
  const expand = iconButton()
  const menu = { hidden: true }
  const toggle = { attributes: {}, setAttribute(name, value) { this.attributes[name] = value } }
  const panel = { querySelector(selector) { return {
    '[data-xrc-header-menu]': menu,
    '[data-xrc-actions-toggle]': toggle,
    '[data-xrc-collapse]': collapse,
    '[data-xrc-expand]': expand,
  }[selector] } }
  const context = vm.createContext({ headerMenuOpen: true, state: { panelView: 'collapsed' } })
  vm.runInContext(`${definition}\nglobalThis.sync = syncHeaderMenu`, context)
  context.sync(panel)
  assert.equal(menu.hidden, false)
  assert.equal(toggle.attributes['aria-expanded'], 'true')
  assert.equal(toggle.title, '收起操作菜单')
  context.headerMenuOpen = false
  context.sync(panel)
  assert.equal(menu.hidden, true)
  assert.equal(toggle.attributes['aria-expanded'], 'false')
  assert.equal(toggle.title, '展开操作菜单')
  assert.match(source, /data-xrc-actions-toggle[^>]*><svg viewBox="0 0 16 16"/)
  assert.match(css, /\.xrc-actions-toggle\[aria-expanded="true"\] svg \{ transform: rotate\(180deg\); \}/)
  assert.deepEqual(collapse.children, ['svg'])
  assert.deepEqual(expand.children, ['svg'])
})

test('flow overview distinguishes executing, waiting, missing, and stale tasks', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const definition = source.match(/  function flowTaskOverview\(runtime, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const context = vm.createContext({
    FLOW_TASKS: [['timeline', '评论帖子'], ['notifications', '评论通知'], ['mutual-unfollow', '清理未回关'], ['mutual-followBack', '回关粉丝'], ['poster', '定时发帖'], ['likes-posts', '点赞帖子'], ['likes-replies', '点赞评论']],
    FLOW_STALE_MS: 90000,
  })
  vm.runInContext(`${definition}\nglobalThis.overview = flowTaskOverview`, context)
  const now = Date.now()
  const result = context.overview({ tasks: {
    timeline: { phase: 'running', updatedAt: now - 1000 },
    notifications: { phase: 'paused', updatedAt: now - 1000 },
    'mutual-unfollow': { phase: 'running', updatedAt: now - 91000 },
    poster: { phase: 'running', updatedAt: now - 1000 },
  } }, now)
  assert.deepEqual(JSON.parse(JSON.stringify(result.counts)), { running: 2, waiting: 1, missing: 3, stopping: 0, unknown: 1 })
  assert.equal(result.text, '2 项执行 · 1 项等待 · 3 项未启动 · 1 项待确认')
  assert.match(source, /data-xrc-flow-overview hidden/)
  assert.match(source, /model\.status === "paused"[\s\S]*model\.status === "stopped"/)
  assert.match(source, /Date\.now\(\) - Number\(task\.updatedAt \|\| 0\) < 30000/)
})

test('flow detail dialog lists all seven tasks using the overview statuses', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  const overview = source.match(/  function flowTaskOverview\(runtime, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  const details = source.match(/  function paintFlowDetails\(panel = document\.getElementById\(PANEL_ID\)\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(overview && details)
  const list = { replaceChildren(...children) { this.children = children } }
  const total = { textContent: '' }
  const dialog = { hidden: false, querySelector(selector) { return selector === '[data-xrc-flow-details-list]' ? list : total } }
  const panel = { querySelector() { return dialog } }
  const now = Date.now()
  const context = vm.createContext({
    FLOW_TASKS: [['timeline', '评论帖子'], ['notifications', '评论通知'], ['mutual-unfollow', '清理未回关'], ['mutual-followBack', '回关粉丝'], ['poster', '定时发帖'], ['likes-posts', '点赞帖子'], ['likes-replies', '点赞评论']],
    FLOW_STALE_MS: 90000,
    pluginRuntime: { flow: { phase: 'running' }, tasks: {
      timeline: { phase: 'running', updatedAt: now },
      notifications: { phase: 'paused', updatedAt: now },
      poster: { phase: 'running', updatedAt: now - 91000 },
    } },
    document: { createElement() { return { dataset: {}, append(...children) { this.children = children } } } },
  })
  vm.runInContext(`${overview}\n${details}\nglobalThis.paint = paintFlowDetails`, context)
  context.paint(panel)
  assert.equal(list.children.length, 7)
  assert.equal(list.children[0].children[0].textContent, '评论帖子')
  assert.equal(list.children[0].children[1].textContent, '执行中')
  assert.equal(list.children[1].children[1].textContent, '等待中')
  assert.equal(list.children[2].children[1].textContent, '未启动')
  assert.equal(list.children[4].children[1].textContent, '待确认')
  assert.match(total.textContent, /1 项执行 · 1 项等待 · 4 项未启动 · 1 项待确认/)
  assert.match(source, /data-xrc-flow-details-open aria-haspopup="dialog"/)
  assert.match(source, /data-xrc-flow-details role="dialog" aria-modal="true"/)
  assert.match(css, /\.xrc-flow-details\[hidden\] \{ display: none; \}/)
})

test('paused flow wins over stale stopping task records', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const definition = source.match(/  function flowButtonModel\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const context = vm.createContext({
    flowStarting: false,
    flowStopping: false,
    pluginRuntime: { flow: { phase: 'paused', updatedAt: Date.now() }, tasks: { timeline: { phase: 'stopping' } } },
  })
  vm.runInContext(`${definition}\nglobalThis.model = flowButtonModel`, context)
  assert.equal(context.model().label, '已暂停')
  context.pluginRuntime.flow = { phase: 'stopping', updatedAt: Date.now() - 20000 }
  context.pluginRuntime.tasks.timeline.updatedAt = Date.now() - 20000
  assert.equal(context.model().label, '重试停止')
  assert.equal(context.model().action, 'pause')
})

test('a running task remains visible when an old paused flow marker survives reload', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const definition = source.match(/  function flowButtonModel\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const context = vm.createContext({
    flowStarting: false,
    flowStopping: false,
    pluginRuntime: { flow: { phase: 'paused', updatedAt: Date.now() }, tasks: { timeline: { phase: 'running', updatedAt: Date.now() } } },
  })
  vm.runInContext(`${definition}\nglobalThis.model = flowButtonModel`, context)
  assert.equal(context.model().label, '暂停全部任务')
  assert.equal(context.model().action, 'pause')
  const backgroundSource = await readFile(new URL('background.js', extensionDir), 'utf8')
  assert.match(backgroundSource, /if \(phase !== "stopping"\)/)
})

test('limit observations retain per-account windows and deduplicate receipts', async () => {
  const stored = {}
  globalThis.chrome = { storage: { local: {
    async get(key) { return { [key]: stored[key] } },
    async set(value) { Object.assign(stored, value) },
  } } }
  try {
    const base = Date.now() - 20000
    const samples = [
      { id: 'success-001', task: 'timeline-reply', result: 'success', occurredAt: base - 1800000 },
      { id: 'success-002', task: 'notification-reply', result: 'success', occurredAt: base - 240000 },
      { id: 'success-003', task: 'post-like', result: 'success', occurredAt: base - 120000 },
      { id: 'limited-001', task: 'timeline-reply', result: 'limited', occurredAt: base, errorCode: 'risk-blocked' },
    ]
    for (const event of samples) await receipt.recordLimitObservation(event, 'alpha')
    await receipt.recordLimitObservation(samples[0], 'alpha')
    await receipt.recordLimitObservation({ id: 'success-004', task: 'timeline-reply', result: 'success', occurredAt: base - 60000 }, 'beta')
    const analysis = receipt.analyzeLimitObservations(await receipt.limitObservations(), 'alpha')
    assert.equal(analysis.events, 4)
    assert.equal(analysis.replySamples.length, 1)
    assert.deepEqual([analysis.replySamples[0].in10m, analysis.replySamples[0].in30m, analysis.replySamples[0].in1h, analysis.replySamples[0].in24h], [1, 2, 2, 2])
    assert.equal(analysis.replySamples[0].lastGapMs, 240000)
    assert.equal(analysis.replySamples[0].recentMedianGapMs, 1560000)
  } finally { delete globalThis.chrome }
})

test('merge account data consolidates legacy default logs into the active handle', async () => {
  const stored = {
    xrcDailyReports: [
      { date: '2026-10-16', accountHandle: 'default', counts: { comments: 2, likes: 1 }, eventIds: ['old-1'], updatedAt: 10 },
      { date: '2026-10-16', accountHandle: 'tarsixseveneig1', counts: { comments: 3, likes: 4 }, eventIds: ['new-1'], updatedAt: 20 },
    ],
    xrcLimitObservations: [{ id: 'old-limit', accountHandle: 'default', task: 'timeline-reply', result: 'limited', at: 10 }],
    xrcCommunityReport: { accountHandle: 'default', queue: [{ id: 'old-event', accountHandle: 'default' }] },
  }
  const previousChrome = globalThis.chrome
  globalThis.chrome = { storage: { local: {
    async get(keys) {
      const list = Array.isArray(keys) ? keys : [keys]
      return Object.fromEntries(list.map((key) => [key, stored[key]]))
    },
    async set(value) { Object.assign(stored, value) },
  } } }
  try {
    const result = await receipt.mergeAccountData('default', 'tarsixseveneig1')
    assert.equal(result.changed, true)
    assert.deepEqual(stored.xrcDailyReports[0].counts, { comments: 5, likes: 5, follows: 0, unfollows: 0, followBacks: 0, posts: 0 })
    assert.equal(stored.xrcDailyReports[0].accountHandle, 'tarsixseveneig1')
    assert.equal(stored.xrcLimitObservations[0].accountHandle, 'tarsixseveneig1')
    assert.equal(stored.xrcCommunityReport.accountHandle, 'tarsixseveneig1')
    assert.equal(stored.xrcCommunityReport.queue[0].accountHandle, 'tarsixseveneig1')
  } finally { globalThis.chrome = previousChrome }
})

test('daily report totals combine local days and accounts without changing the selected day', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const definition = source.match(/  function sumDailyCounts\(reports\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const context = vm.createContext({ REPORT_METRICS: ['comments', 'likes', 'follows', 'unfollows', 'followBacks'] })
  vm.runInContext(`${definition}\nglobalThis.sum = sumDailyCounts`, context)
  const reports = [
    { date: '2026-10-13', accountHandle: 'a', counts: { comments: 2, likes: 3, follows: 1 } },
    { date: '2026-10-14', accountHandle: 'a', counts: { comments: 4, likes: 5, unfollows: 2 } },
    { date: '2026-10-14', accountHandle: 'b', counts: { comments: 7, followBacks: 3 } },
  ]
  const plain = (value) => JSON.parse(JSON.stringify(value))
  assert.deepEqual(plain(context.sum(reports)), { comments: 13, likes: 8, follows: 1, unfollows: 2, followBacks: 3 })
  assert.deepEqual(plain(context.sum(reports.filter((row) => row.date === '2026-10-14'))), { comments: 11, likes: 5, follows: 0, unfollows: 2, followBacks: 3 })
  assert.deepEqual(plain(context.sum(reports.filter((row) => row.date === '2026-10-14' && row.accountHandle === 'a'))), { comments: 4, likes: 5, follows: 0, unfollows: 2, followBacks: 0 })
})

test('daily backfill uploads only older reports that changed since the last upload', async () => {
  const previousChrome = globalThis.chrome
  const previousFetch = globalThis.fetch
  const nowDate = receipt.shanghaiDate()
  const stored = {
    xrcCommunityReport: { secret: 'test-secret', deviceId: 'device-12345678', accountHandle: 'account', queue: [] },
    xrcDailyReports: [
      { date: '2026-10-20', accountHandle: 'account', counts: { comments: 3 }, updatedAt: 50, uploadedAt: 100 },
      { date: '2026-10-21', accountHandle: 'account', counts: { comments: 5 }, updatedAt: 200, uploadedAt: 100 },
      { date: '2026-10-22', accountHandle: 'account', counts: { comments: 7 }, updatedAt: 300, uploadedAt: 0 },
      { date: nowDate, accountHandle: 'account', counts: { comments: 9 }, updatedAt: 400, uploadedAt: 0 },
    ],
  }
  const sent = []
  globalThis.chrome = { runtime: { getManifest: () => ({ version: '3.29.0' }) }, storage: { local: {
    async get(key) { return { [key]: stored[key] } },
    async set(value) { Object.assign(stored, value) },
  } } }
  globalThis.fetch = async (_url, options) => {
    sent.push(JSON.parse(options.body).dailyReport.date)
    return { ok: true, async json() { return { dailyReportSaved: true } } }
  }
  try {
    const result = await receipt.uploadPendingDailyReports(nowDate)
    assert.equal(result.ok, true)
    assert.equal(result.uploaded, 2)
    assert.deepEqual(sent, ['2026-10-21', '2026-10-22'])
    assert.ok(stored.xrcDailyReports[1].uploadedAt > 0)
    assert.equal(stored.xrcDailyReports[3].uploadedAt, 0)
    assert.equal((await receipt.uploadPendingDailyReports(nowDate)).uploaded, 0)
  } finally {
    globalThis.chrome = previousChrome
    globalThis.fetch = previousFetch
  }
})

test('receipt cleanHandle rejects default placeholder accounts', async () => {
  const previousChrome = globalThis.chrome
  const previousFetch = globalThis.fetch
  const stored = {
    xrcCommunityReport: { secret: 'test-secret', deviceId: 'device-12345678', accountHandle: 'tarsixseveneig1', queue: [] },
    xrcDailyReports: [{ date: '2026-10-21', accountHandle: 'default', counts: { comments: 2 }, updatedAt: 200, uploadedAt: 0 }],
  }
  const bodies = []
  globalThis.chrome = { runtime: { getManifest: () => ({ version: '3.32.16' }) }, storage: { local: {
    async get(keys) {
      const list = Array.isArray(keys) ? keys : [keys]
      return Object.fromEntries(list.map((key) => [key, stored[key]]))
    },
    async set(value) { Object.assign(stored, value) },
  } } }
  globalThis.fetch = async (_url, options) => {
    bodies.push(JSON.parse(options.body))
    return { ok: true, async json() { return { dailyReportSaved: true, commands: [] } } }
  }
  try {
    const skipped = await receipt.uploadDaily('2026-10-21', 'default')
    assert.equal(skipped.ok, false)
    assert.match(skipped.error, /账号未识别/)
    const accepted = await receipt.accept({ task: 'post-like', result: 'success', targetId: 'tweet-1', accountHandle: 'default' })
    assert.equal(accepted.ok, true)
    assert.equal(stored.xrcCommunityReport.accountHandle, 'tarsixseveneig1')
    assert.equal(bodies.at(-1).accountHandle, 'tarsixseveneig1')
    assert.equal(bodies.every((body) => body.accountHandle !== 'default'), true)
  } finally {
    globalThis.chrome = previousChrome
    globalThis.fetch = previousFetch
  }
})

test('heartbeat auto-syncs dirty daily reports including today', async () => {
  const previousChrome = globalThis.chrome
  const previousFetch = globalThis.fetch
  const nowDate = receipt.shanghaiDate()
  const stored = {
    xrcCommunityReport: { secret: 'test-secret', deviceId: 'device-12345678', accountHandle: 'account', queue: [] },
    xrcDailyReports: [
      { date: '2026-10-21', accountHandle: 'account', counts: { comments: 2 }, updatedAt: 200, uploadedAt: 0 },
      { date: nowDate, accountHandle: 'account', counts: { comments: 4 }, updatedAt: 400, uploadedAt: 0 },
    ],
  }
  const bodies = []
  globalThis.chrome = { runtime: { getManifest: () => ({ version: '3.32.14' }) }, storage: { local: {
    async get(keys) {
      const list = Array.isArray(keys) ? keys : [keys]
      return Object.fromEntries(list.map((key) => [key, stored[key]]))
    },
    async set(value) { Object.assign(stored, value) },
  } } }
  globalThis.fetch = async (_url, options) => {
    bodies.push(JSON.parse(options.body))
    return { ok: true, async json() { return { dailyReportSaved: true, commands: [] } } }
  }
  try {
    const result = await receipt.heartbeatFromBackground('account')
    assert.equal(result.ok, true)
    assert.equal(result.daily.uploaded, 2)
    assert.deepEqual(bodies.filter((body) => body.dailyReport).map((body) => body.dailyReport.date), ['2026-10-21', nowDate])
    assert.ok(stored.xrcDailyReports.every((row) => row.uploadedAt > 0))
  } finally {
    globalThis.chrome = previousChrome
    globalThis.fetch = previousFetch
  }
})

test('daily report panel relies on automatic sync instead of manual upload or pull', async () => {
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  const monitor = await readFile(new URL('../../app/(admin)/admin/community-actions/monitor/PluginMonitorClient.jsx', extensionDir), 'utf8')
  assert.match(content, /心跳自动同步当日统计/)
  assert.match(content, /data-xrc-daily-schedule/)
  assert.doesNotMatch(content, /data-xrc-daily-upload(?!-|[a-z])/)
  assert.doesNotMatch(content, /data-xrc-daily-pull/)
  assert.doesNotMatch(content, /data-xrc-daily-upload-pending/)
  assert.doesNotMatch(content, /同步云端/)
  assert.doesNotMatch(content, /上传当日报告/)
  assert.match(monitor, /自动同步日报/)
  assert.match(monitor, /Daily Sync/)
  assert.match(monitor, /DEFAULT_X_ACCOUNT = 'tarsixseveneig1'/)
  assert.match(monitor, /ariaLabel="筛选动作趋势账号"/)
  assert.match(monitor, /ariaLabel="筛选单日明细账号"/)
  assert.doesNotMatch(monitor, /本地上传报告/)
})

test('daily upload alarm starts at tomorrow 09:00 Shanghai time and retries failed uploads', async () => {
  const previousChrome = globalThis.chrome
  const previousFetch = globalThis.fetch
  const stored = {
    xrcCommunityReport: { secret: 'test-secret', deviceId: 'device-12345678', accountHandle: 'account', queue: [] },
    xrcDailyReports: [{ date: '2026-10-21', accountHandle: 'account', counts: { comments: 1 }, updatedAt: 1, uploadedAt: 0 }],
  }
  const alarms = []
  globalThis.chrome = { alarms: { async create(name, options) { alarms.push({ name, when: options.when }) } }, storage: { local: {
    async get(keys) { return Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map((key) => [key, stored[key]])) },
    async set(value) { Object.assign(stored, value) },
  } } }
  globalThis.fetch = async () => ({ ok: false, status: 503 })
  try {
    assert.equal(new Date(receipt.tomorrowShanghaiNine(Date.parse('2026-10-23T00:00:00Z'))).toISOString(), '2026-10-24T01:00:00.000Z')
    const result = await receipt.installDailyUploadSchedule()
    assert.equal(result.ok, false)
    assert.equal(result.failedDate, '2026-10-21')
    assert.ok(alarms.some((alarm) => alarm.name === 'xrc-daily-upload' && alarm.when > Date.now()))
    assert.equal(stored.xrcDailyReports[0].uploadedAt, 0)
    assert.equal(stored.xrcDailyUploadSchedule.lastResult.ok, false)
  } finally {
    globalThis.chrome = previousChrome
    globalThis.fetch = previousFetch
  }
})

test('cumulative report counts use one decimal only when needed and keep exact daily counts', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const definition = source.match(/  function formatCompactCount\(value\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const context = vm.createContext({})
  vm.runInContext(`${definition}\nglobalThis.compact = formatCompactCount`, context)
  for (const [value, expected] of [[0, '0'], [999, '999'], [1000, '1k'], [1099, '1k'], [1100, '1.1k'], [1204, '1.2k'], [9999, '9.9k'], [10000, '10k'], [10100, '10.1k'], [999999, '999.9k'], [1000000, '1m'], [1200000, '1.2m']]) {
    assert.equal(context.compact(value), expected)
  }
  assert.match(source, /data-xrc-report-total-\$\{metric\}\]\`\);[\s\S]*?formatCompactCount\(total\[metric\]\)/)
  assert.match(source, /data-xrc-daily-\$\{metric\}\]\`\);[\s\S]*?String\(dayCounts\[metric\]\)/)
})

test('one-click reset clears task state while retaining API credentials and logs', async () => {
  const saved = {
    xrcAiSettings: { apiKey: 'sk-12345678', baiApiKey: 'sk-bai-test-key', replyPrompt: 'old custom prompt' },
    xrcCommunityReport: { secret: 'receipt-secret', deviceId: 'device-123', queue: [{ id: 'old-event' }] },
    xrcDailyReports: [{ date: '2026-10-15', counts: { comments: 3 } }],
    xrcLimitObservations: [{ id: 'limit-event', result: 'limited' }],
    xrcPluginRuntime: { tasks: { timeline: { tabId: 11 } } },
    xrcPosterPublishList: [{ text: 'old draft' }],
    xrcPosterHistoryV2: { published: ['old-post'] },
    'xrcAutoLikeSeen:test:posts': ['123'],
  }
  const prepared = []
  const reloaded = []
  globalThis.chrome = {
    storage: { local: {
      async get(keys) { return keys === null ? { ...saved } : Object.fromEntries(keys.map((key) => [key, saved[key]])) },
      async remove(keys) { for (const key of keys) delete saved[key] },
      async set(value) { Object.assign(saved, value) },
    } },
    tabs: {
      async query() { return [{ id: 11 }, { id: 22 }] },
      async sendMessage(tabId, message) { prepared.push([tabId, message.type]); return { ok: true } },
      async reload(tabId) { reloaded.push(tabId) },
    },
  }
  try {
    const result = await background.resetExtensionState({ tab: { id: 11 } })
    assert.equal(result.ok, true)
    assert.deepEqual(prepared, [[11, 'xrc-reset-prepare'], [22, 'xrc-reset-prepare']])
    assert.deepEqual(reloaded, [22])
    assert.deepEqual(saved.xrcAiSettings, { apiKey: 'sk-12345678', baiApiKey: 'sk-bai-test-key' })
    assert.deepEqual(saved.xrcCommunityReport, { secret: 'receipt-secret', deviceId: 'device-123', queue: [{ id: 'old-event' }] })
    assert.deepEqual(saved.xrcDailyReports, [{ date: '2026-10-15', counts: { comments: 3 } }])
    assert.deepEqual(saved.xrcLimitObservations, [{ id: 'limit-event', result: 'limited' }])
    assert.match(saved.xrcResetEpoch, /^\d+-/)
    assert.equal(saved.xrcPluginRuntime, undefined)
    assert.equal(saved.xrcPosterPublishList, undefined)
    assert.equal(saved.xrcPosterHistoryV2, undefined)
    assert.equal(saved['xrcAutoLikeSeen:test:posts'], undefined)
  } finally {
    delete globalThis.chrome
  }
})

test('reset requires an explicit confirmation that names cleared and retained data', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.match(source, /data-xrc-reset-state aria-haspopup="dialog"/)
  assert.match(source, /data-xrc-reset-confirm role="dialog" aria-modal="true"/)
  assert.match(source, /data-xrc-reset-state[\s\S]*?aria-label="一键清空任务状态"/)
  assert.match(source, /data-xrc-reset-state[\s\S]*?<svg viewBox="0 0 16 16"/)
  assert.match(source, /任务进度与倒计时、待发草稿与素材去重/)
  assert.match(source, /本地每日报告、限制观察记录及尚未上传的回执日志/)
  assert.match(source, /data-xrc-reset-confirm-action>确认清空/)
  assert.match(source, /resetTrigger\?\.addEventListener\("click", \(\) => \{[\s\S]*?resetDialog\.hidden = false/)
  assert.match(source, /data-xrc-reset-confirm-action\]"\)\?\.addEventListener\("click", async \(\) => \{[\s\S]*?sendExtensionMessage\(\{ type: "xrc-reset-state" \}\)/)
})

test('memory refresh reloads only idle registered task tabs and preserves state', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.match(source, /data-xrc-refresh-idle-tabs>优化闲置页/)
  assert.match(source, /sendExtensionMessage\(\{ type: "xrc-refresh-idle-tabs" \}\)/)
  const local = { xrcPluginRuntime: { tasks: { timeline: { tabId: 11, phase: 'running' } } }, xrcAutoLikeSeen: ['123'] }
  const session = { xrcTaskTabs: { timeline: 11, 'likes-posts': 22, poster: 33 } }
  const reloaded = []
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
    },
    tabs: {
      async get(id) { return { id } },
      async reload(id) { reloaded.push(id) },
    },
  }
  try {
    const result = await background.refreshIdleTaskTabs({ tab: { id: 33 } })
    assert.deepEqual(result, { ok: true, refreshed: 1, skipped: 1, reloadCurrent: true })
    assert.deepEqual(reloaded, [22])
    assert.deepEqual(local.xrcAutoLikeSeen, ['123'])
  } finally {
    delete globalThis.chrome
  }
})

test('notification context cache drops oldest entries after 100 conversations', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  function cacheNotificationContext\(id, conversation\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(helper)
  const context = vm.createContext({ Map, NOTIFICATION_CONTEXT_CACHE_LIMIT: 100, notificationContextCache: new Map() })
  vm.runInContext(`${helper}\nglobalThis.add = cacheNotificationContext`, context)
  for (let id = 0; id < 101; id += 1) context.add(String(id), { id })
  assert.equal(context.notificationContextCache.size, 100)
  assert.equal(context.notificationContextCache.has('0'), false)
  assert.equal(context.notificationContextCache.has('100'), true)
})

test('clickbait preset switches the active post prompt and schedules an immediate save', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.match(source, /input\.value = CLICKBAIT_POST_PROMPT;[\s\S]*?state\.postPrompt = CLICKBAIT_POST_PROMPT;[\s\S]*?scheduleConfigSave\(panel\)/)
})

test('reply-like task visits threads without liking their root posts', async () => {
  const location = { pathname: '/home' }
  const clicks = { root: 0, reply: 0 }
  const makeTweet = (id, kind) => {
    let liked = false
    const link = {
      href: `https://x.com/a/status/${id}`,
      getAttribute: () => `/a/status/${id}`,
      click: () => { location.pathname = `/a/status/${id}` },
    }
    return {
      querySelector(selector) {
        if (selector === 'time') return { closest: () => link }
        if (selector === '[data-testid="unlike"]') return liked ? {} : null
        if (selector === '[data-testid="like"]') return liked ? null : { click: () => { liked = true; clicks[kind] += 1 } }
        return null
      },
    }
  }
  const root = makeTweet('123', 'root')
  const reply = makeTweet('456', 'reply')
  const homeLink = { click: () => { location.pathname = '/home' } }
  const doc = {
    querySelector(selector) {
      if (selector === '[data-testid="primaryColumn"]') return { querySelectorAll: () => location.pathname === '/home' ? [root] : [root, reply] }
      if (selector.includes('AppTabBar_Home_Link')) return homeLink
      return null
    },
    querySelectorAll: () => [],
  }
  const saved = {}
  let controller
  controller = autoLike.createController({
    document: doc,
    window: { location, setTimeout: (callback) => { queueMicrotask(callback) }, scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    accountKey: 'test',
    target: 'replies',
    onUpdate(snapshot) { if (snapshot.posts === 1) controller.stop() },
  })
  await controller.start()
  assert.deepEqual(clicks, { root: 0, reply: 1 })
  assert.deepEqual(saved['xrcAutoLikeSeen:test:replies'], ['123'])
  assert.equal(controller.snapshot().running, false)
})

test('post-like task stays on Home and has its own processed history', async () => {
  const location = { pathname: '/home' }
  let clicks = 0
  const link = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123', click: () => { throw new Error('must not enter thread') } }
  let liked = false
  const article = {
    querySelector(selector) {
      if (selector === 'time') return { closest: () => link }
      if (selector === '[data-testid="unlike"]') return liked ? {} : null
      if (selector === '[data-testid="like"]') return liked ? null : { click: () => { liked = true; clicks += 1 } }
      return null
    },
  }
  const saved = {}
  let controller
  controller = autoLike.createController({
    document: {
      querySelector: () => ({ querySelectorAll: () => [article] }),
      querySelectorAll: () => [],
    },
    window: { location, setTimeout: (callback) => queueMicrotask(callback), scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    accountKey: 'test',
    target: 'posts',
    onUpdate(snapshot) { if (snapshot.posts === 1) controller.stop() },
  })
  await controller.start()
  assert.equal(clicks, 1)
  assert.deepEqual(saved['xrcAutoLikeSeen:test:posts'], ['123'])
  assert.equal(location.pathname, '/home')
})

test('using the panel pauses auto-like clicks while Stop remains responsive', async () => {
  const link = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123' }
  let clicks = 0
  const article = { querySelector(selector) {
    if (selector === 'time') return { closest: () => link }
    if (selector === '[data-testid="like"]') return { click() { clicks += 1 } }
    return null
  } }
  const controller = autoLike.createController({
    document: { querySelector: () => ({ querySelectorAll: () => [article] }), querySelectorAll: () => [] },
    window: { location: { pathname: '/home' }, setTimeout, scrollBy() {}, innerHeight: 700 },
    storage: { async get() { return {} }, async set() {} },
    target: 'posts',
  })
  controller.pauseForInteraction(500)
  const work = controller.start()
  controller.pauseForInteraction(500)
  await new Promise((resolve) => setTimeout(resolve, 30))
  assert.equal(clicks, 0)
  controller.stop()
  await work
  assert.equal(clicks, 0)
})

test('an unconfirmed like continues to the next post and only confirmed likes enter the daily count', async () => {
  const saved = {}
  const clicked = []
  const reported = []
  const makeTweet = (id, confirms) => {
    let liked = false
    const link = { href: `https://x.com/a/status/${id}`, getAttribute: () => `/a/status/${id}` }
    return { querySelector(selector) {
      if (selector === 'time') return { closest: () => link }
      if (selector === '[data-testid="unlike"]') return liked ? {} : null
      if (selector === '[data-testid="like"]') return { click() { clicked.push(id); liked = confirms } }
      return null
    } }
  }
  const articles = [makeTweet('123', false), makeTweet('456', true)]
  let controller
  controller = autoLike.createController({
    document: {
      querySelector: () => ({ querySelectorAll: () => articles }),
      querySelectorAll: () => [],
    },
    window: { location: { pathname: '/home' }, setTimeout: (callback) => queueMicrotask(callback), scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    target: 'posts',
    onLike(id) { reported.push(id) },
    onUpdate(snapshot) { if (snapshot.posts === 2) controller.stop() },
  })
  await controller.start()
  assert.deepEqual(clicked, ['123', '456'])
  assert.deepEqual(reported, ['456'])
  assert.equal(controller.snapshot().count, 1)
  assert.deepEqual(saved['xrcAutoLikeSeen:default:posts'], ['123', '456'])
})

test('a like confirmed on X replacement node is counted', async () => {
  const link = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123' }
  let replacement = false
  let restricted = false
  const original = { querySelector(selector) {
    if (selector === 'time') return { closest: () => link }
    if (selector === '[data-testid="like"]') return { click() { replacement = true } }
    return null
  } }
  const updated = { querySelector(selector) {
    if (selector === 'time') return { closest: () => link }
    if (selector === '[data-testid="unlike"]') return {}
    return null
  } }
  const doc = {
    querySelector: () => ({ querySelectorAll: () => [replacement ? updated : original] }),
    querySelectorAll: () => restricted ? [{ textContent: 'rate limit' }] : [],
  }
  const saved = {}
  const reported = []
  let controller
  controller = autoLike.createController({
    document: doc,
    window: { location: { pathname: '/home' }, setTimeout: (callback) => queueMicrotask(callback), scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    target: 'posts', onLike(id) { reported.push(id) },
    onUpdate(snapshot) { if (snapshot.posts === 1) controller.stop() },
  })
  await controller.start()
  assert.deepEqual(reported, ['123'])
  assert.equal(controller.snapshot().count, 1)
})

test('like count limit cools down, preserves history, then resumes without a rapid retry', async () => {
  let clock = 1000
  let limitUntil = 0
  let likes = 0
  let liked = false
  const saved = {}
  const updates = []
  const limits = []
  const link = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123' }
  const article = { querySelector(selector) {
    if (selector === 'time') return { closest: () => link }
    if (selector === '[data-testid="unlike"]') return liked ? {} : null
    if (selector === '[data-testid="like"]') return liked ? null : { click() {
      likes += 1
      if (likes === 1) limitUntil = clock + 600
      else liked = true
    } }
    return null
  } }
  const doc = {
    querySelector: () => ({ querySelectorAll: () => [article] }),
    querySelectorAll: () => clock < limitUntil ? [{ textContent: 'Rate limit exceeded' }] : [],
  }
  let controller
  controller = autoLike.createController({
    document: doc,
    window: { location: { pathname: '/home' }, setTimeout(callback, ms) { clock += ms; queueMicrotask(callback) }, scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    accountKey: 'a', target: 'posts', now: () => clock, rateLimitCooldowns: [200],
    onLimit(account, target, kind) { limits.push([account, target, kind]) },
    onUpdate(snapshot) { updates.push(snapshot.status); if (snapshot.posts === 1) controller.stop() },
  })
  await controller.start()
  assert.equal(likes, 2)
  assert.equal(controller.snapshot().count, 1)
  assert.equal(saved['xrcAutoLikeCooldown:a'].retries, 1)
  assert.deepEqual(saved['xrcAutoLikeSeen:a:posts'], ['123'])
  assert.ok(updates.some((status) => /分钟后自动重试/.test(status)))
  assert.deepEqual(limits, [['a', 'posts', 'rate-limited']])
})

test('repeated like rate limits extend the cooldown without rapidly retrying', async () => {
  let clock = 1000
  const saved = {}
  let controller
  controller = autoLike.createController({
    document: { querySelector: () => ({ querySelectorAll: () => [] }), querySelectorAll: () => [{ textContent: 'You have exceeded your limit' }] },
    window: { location: { pathname: '/home' }, setTimeout(callback, ms) { clock += ms; queueMicrotask(callback) }, scrollBy: () => {} },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    accountKey: 'a', target: 'posts', now: () => clock, rateLimitCooldowns: [10, 20, 30],
    onUpdate(snapshot) { if (snapshot.rateLimitRetries === 4 && snapshot.cooldownUntil > clock) controller.stop() },
  })
  await controller.start()
  assert.match(controller.snapshot().status, /已停止自动点赞/)
  assert.equal(controller.snapshot().rateLimitRetries, 4)
  assert.equal(saved['xrcAutoLikeCooldown:a'].until - saved['xrcAutoLikeCooldown:a'].lastLimitedAt, 24 * 60 * 60 * 1000)
})

test('a restarted like task respects the saved account cooldown before clicking', async () => {
  let clock = 1000
  let clickedAt = 0
  let liked = false
  const saved = { 'xrcAutoLikeCooldown:a': { until: 2000, retries: 1, lastLimitedAt: 900 } }
  const link = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123' }
  const article = { querySelector(selector) {
    if (selector === 'time') return { closest: () => link }
    if (selector === '[data-testid="unlike"]') return liked ? {} : null
    if (selector === '[data-testid="like"]') return liked ? null : { click() { clickedAt = clock; liked = true } }
    return null
  } }
  let controller
  controller = autoLike.createController({
    document: { querySelector: () => ({ querySelectorAll: () => [article] }), querySelectorAll: () => [] },
    window: { location: { pathname: '/home' }, setTimeout(callback, ms) { clock += ms; queueMicrotask(callback) }, scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    accountKey: 'a', target: 'posts', now: () => clock,
    onUpdate(snapshot) { if (snapshot.posts === 1) controller.stop() },
  })
  await controller.start()
  assert.ok(clickedAt >= 2000)
  assert.equal(controller.snapshot().count, 1)
})

test('a paused like task stops promptly without clicking another post', async () => {
  let clock = 1000
  let clicks = 0
  const saved = { 'xrcAutoLikeCooldown:a': { until: 3601000, retries: 1, lastLimitedAt: 900 } }
  let controller
  controller = autoLike.createController({
    document: { querySelector: () => ({ querySelectorAll: () => [{ querySelector: () => ({ click() { clicks += 1 } }) }] }), querySelectorAll: () => [] },
    window: { location: { pathname: '/home' }, setTimeout(callback, ms) { clock += ms; controller.stop(); queueMicrotask(callback) }, scrollBy: () => {} },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async () => {} },
    accountKey: 'a', target: 'posts', now: () => clock,
  })
  await controller.start()
  assert.equal(clicks, 0)
  assert.equal(controller.snapshot().running, false)
  assert.ok(clock < 3601000)
})

test('reply-like task retries a temporary thread navigation failure without stopping', async () => {
  const location = { pathname: '/home' }
  let opens = 0
  let liked = false
  const rootLink = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123', click() {
    opens += 1
    if (opens === 1) throw new Error('X page still loading')
    location.pathname = '/a/status/123'
  } }
  const replyLink = { href: 'https://x.com/b/status/456', getAttribute: () => '/b/status/456' }
  const root = { querySelector(selector) { return selector === 'time' ? { closest: () => rootLink } : null } }
  const reply = { querySelector(selector) {
    if (selector === 'time') return { closest: () => replyLink }
    if (selector === '[data-testid="unlike"]') return liked ? {} : null
    if (selector === '[data-testid="like"]') return { click() { liked = true } }
    return null
  } }
  const doc = {
    querySelector(selector) {
      if (selector === '[data-testid="primaryColumn"]') return { querySelectorAll: () => location.pathname === '/home' ? [root] : [root, reply] }
      if (selector.includes('AppTabBar_Home_Link')) return { click() { location.pathname = '/home' } }
      return null
    },
    querySelectorAll: () => [],
  }
  let controller
  controller = autoLike.createController({
    document: doc,
    window: { location, setTimeout: (callback) => queueMicrotask(callback), scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async () => ({}), set: async () => {} },
    target: 'replies',
    onUpdate(snapshot) { if (snapshot.posts === 1) controller.stop() },
  })
  await controller.start()
  assert.equal(opens, 2)
  assert.equal(controller.snapshot().count, 1)
  assert.equal(controller.snapshot().posts, 1)
})

test('auto-like cools down after an automation warning and retries when it clears', async () => {
  let clock = 1000
  let clicks = 0
  let liked = false
  let warningUntil = 1200
  const updates = []
  const saved = {}
  let controller
  const article = {
    querySelector(selector) {
      if (selector === 'time') return { closest: () => ({ href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123', click: () => {} }) }
      if (selector === '[data-testid="unlike"]') return liked ? {} : null
      if (selector === '[data-testid="like"]') return liked ? null : { click: () => { clicks += 1; liked = true } }
      return null
    },
  }
  const doc = {
    querySelector: () => ({ querySelectorAll: () => [article] }),
    querySelectorAll: () => clock < warningUntil ? [{ textContent: 'This request looks like it might be automated' }] : [],
  }
  controller = autoLike.createController({
    document: doc,
    window: { location: { pathname: '/home' }, setTimeout(callback, ms) { clock += ms; queueMicrotask(callback) }, scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    target: 'posts', now: () => clock, rateLimitCooldowns: [200],
    onUpdate(snapshot) { updates.push(snapshot.status); if (snapshot.posts === 1) controller.stop() },
  })
  await controller.start()
  assert.equal(clicks, 1)
  assert.ok(updates.some((status) => /疑似自动化.*分钟后自动重试/.test(status)))
  assert.equal(saved['xrcAutoLikeCooldown:default'].reason, 'automation')
  assert.equal(saved['xrcAutoLikeCooldown:default'].until, 601000)
  assert.deepEqual(saved['xrcAutoLikeSeen:default:posts'], ['123'])
  assert.equal(controller.snapshot().running, false)
  assert.equal(controller.snapshot().count, 1)
})

test('an automation cooldown can be stopped without clicking a like', async () => {
  let clock = 1000
  let clicks = 0
  const saved = {}
  let controller
  controller = autoLike.createController({
    document: {
      querySelector: () => ({ querySelectorAll: () => [{ querySelector: (selector) => selector === '[data-testid="like"]' ? { click() { clicks += 1 } } : null }] }),
      querySelectorAll: () => [{ textContent: 'This request looks like it might be automated' }],
    },
    window: { location: { pathname: '/home' }, setTimeout(callback, ms) { clock += ms; queueMicrotask(callback) }, scrollBy: () => {} },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    target: 'posts', now: () => clock, rateLimitCooldowns: [5000],
    onUpdate(snapshot) { if (snapshot.cooldownUntil > clock) controller.stop() },
  })
  await controller.start()
  assert.equal(clicks, 0)
  assert.equal(controller.snapshot().running, false)
  assert.equal(saved['xrcAutoLikeCooldown:default'].reason, 'automation')
  assert.ok(saved['xrcAutoLikeCooldown:default'].until > clock)
})

test('settings auto-save batches edits and flushes before a task starts', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helpers = source.match(/  function scheduleConfigSave\([\s\S]*?(?=\n  async function loadPosterPace\()/)?.[0]
  assert.ok(helpers)
  const timers = new Map()
  let nextTimer = 0
  let saves = 0
  const panel = { querySelector: () => ({ textContent: '' }) }
  const context = vm.createContext({
    Promise,
    panel,
    document: { getElementById: () => panel },
    PANEL_ID: 'x-reply-clipboard-panel',
    saveConfigForm: async () => { saves += 1; return true },
    window: {
      setTimeout(callback) { const id = ++nextTimer; timers.set(id, callback); return id },
      clearTimeout(id) { timers.delete(id) },
    },
  })
  vm.runInContext(`let configSaveTimer = 0; let configSavePromise = Promise.resolve(); ${helpers}`, context)
  vm.runInContext('scheduleConfigSave(panel); scheduleConfigSave(panel)', context)
  assert.equal(timers.size, 1)
  assert.equal(saves, 0)
  const [timerId, callback] = [...timers.entries()][0]
  timers.delete(timerId)
  callback()
  await vm.runInContext('configSavePromise', context)
  assert.equal(saves, 1)
  vm.runInContext('scheduleConfigSave(panel)', context)
  await vm.runInContext('flushConfigSave()', context)
  assert.equal(saves, 2)
  assert.equal(timers.size, 0)
})

test('PDF toolbox exports only the tweet matching the current status URL', async () => {
  const source = await readFile(new URL('tweetPdf.js', extensionDir), 'utf8')
  const makeArticle = (id, body) => ({
    querySelectorAll(selector) {
      if (selector === 'a[href*="/status/"]') return [{ href: `https://x.com/author/status/${id}`, getAttribute: () => `/author/status/${id}` }]
      return []
    },
    querySelector(selector) {
      if (selector === '[data-testid="tweetText"]') return { innerText: body }
      return null
    },
  })
  const stored = {}
  const messages = []
  const context = vm.createContext({
    URL,
    URLSearchParams,
    window: { location: { pathname: '/author/status/123', origin: 'https://x.com', href: 'https://x.com/author/status/123' } },
    document: { querySelectorAll: () => [makeArticle('456', 'other tweet'), makeArticle('123', 'correct tweet')] },
    chrome: {
      storage: { local: {
        async get(key) { return { [key]: stored[key] } },
        async set(values) { Object.assign(stored, values) },
        async remove(keys) { keys.forEach((key) => delete stored[key]) },
      } },
      runtime: { async sendMessage(message) { messages.push(message); return { ok: true } } },
    },
  })
  vm.runInContext(source, context)
  const tweet = await context.XrcTweetPdf.exportCurrent()
  assert.equal(tweet.text, 'correct tweet')
  assert.equal(tweet.sourceUrl, 'https://x.com/author/status/123')
  assert.equal(stored[messages[0].exportId].tweet.text, 'correct tweet')

  context.document.querySelectorAll = () => [makeArticle('456', 'other tweet')]
  assert.throws(() => context.XrcTweetPdf.extractTweet(), /还没找到当前这条推文/)
})

test('manual reply start is available for waits and stopped tasks, but not while stopping', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  function canStartReplyNow\([\s\S]*?\n  \}/)?.[0]
  assert.ok(helper)
  const state = { running: true, stopping: false, riskPaused: false, reconnectAt: 0, nextCycleAt: 0, nextRoundAt: 2000, waitUntil: 0, loopPromise: null, status: '' }
  const eligible = () => vm.runInNewContext(`${helper}\ncanStartReplyNow(1000)`, { state, riskRoundAdvancing: true })
  assert.equal(eligible(), true)
  state.nextRoundAt = 0
  state.reconnectAt = 1500
  assert.equal(eligible(), true)
  state.reconnectAt = 0
  state.waitUntil = 1500
  assert.equal(eligible(), true)
  state.waitUntil = 0
  state.running = false
  state.status = '已停止'
  assert.equal(eligible(), true)
  state.status = ''
  state.riskPaused = true
  assert.equal(eligible(), true)
  state.loopPromise = {}
  assert.equal(eligible(), false)
})

test('manual reply start clears a reconnect countdown and wakes its waiting loop', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  function canStartReplyNow\([\s\S]*?\n  \}/)?.[0]
  const action = source.match(/  function startReplyNow\([\s\S]*?\n  \}/)?.[0]
  assert.ok(helper && action)
  const state = { running: true, stopping: false, riskPaused: false, reconnectAt: Date.now() + 60000, reconnectReason: '页面异常', nextCycleAt: 0, nextRoundAt: 0, waitUntil: 0, total: 3, status: '' }
  const calls = { wake: 0, saved: 0, restarted: 0 }
  const context = vm.createContext({
    state,
    Date,
    skipScheduledWait: false,
    writeSaved() { calls.saved += 1 },
    renderPanel() {},
    wakeScheduledWait() { calls.wake += 1 },
    onToggle() { calls.restarted += 1 },
  })
  vm.runInContext(`${helper}\n${action}\nstartReplyNow()`, context)
  assert.equal(state.reconnectAt, 0)
  assert.equal(state.reconnectReason, '')
  assert.equal(context.skipScheduledWait, true)
  assert.equal(calls.wake, 1)
  assert.equal(calls.saved, 1)
  state.running = false
  state.status = '已停止'
  vm.runInContext('startReplyNow()', context)
  assert.equal(calls.restarted, 1)
})

test('reply reconnect backs off quickly and caps its retry interval', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  function reconnectDelay\(attempt\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(helper)
  const context = vm.createContext({ RECONNECT_INITIAL_MS: 2000, RECONNECT_MAX_MS: 30000 })
  vm.runInContext(helper, context)
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((attempt) => vm.runInContext(`reconnectDelay(${attempt})`, context)), [2000, 4000, 8000, 16000, 30000, 30000])
})

test('explicit in-place reconnect keeps the draft on the same X page', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  async function reconnectAndResume\([\s\S]*?(?=\n  async function waitRateLimit\()/)?.[0]
  assert.ok(helper)
  const state = { running: true, stopping: false, total: 0, pendingReply: '待重试的回复', pendingTweetId: '123', reconnectAt: 0, reconnectReason: '', status: '' }
  let reloads = 0
  let closes = 0
  const context = vm.createContext({
    state, Date, reconnectOnline: true, skipScheduledWait: false,
    reconnectDelay: () => 0, sleep: async () => {}, xIsReachable: async () => true,
    closeReplyComposer: async () => { closes += 1; return true },
    waitUntil: async () => true, transientErrorVisible: () => false,
    reloadAndResume: async () => { reloads += 1; return true },
    writeSaved() {}, renderPanel() {}, formatCountdown: () => '', reportCommunityAction() {},
  })
  vm.runInContext(helper, context)
  const result = await vm.runInContext('reconnectAndResume("X 暂时出错", { inPlace: true })', context)
  assert.equal(result, 'resume')
  assert.equal(closes, 1)
  assert.equal(reloads, 0)
  assert.equal(state.pendingReply, '待重试的回复')
  assert.equal(state.pendingTweetId, '123')
})

test('a failed X reply is recorded as skipped without increasing the success count', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  async function skipTransientReply\(tweet\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(helper)
  const state = { assistantMode: 'timeline', total: 34, errors: 0, pendingReply: '未发出的草稿', pendingTweetId: '456', status: '' }
  const skippedIds = new Set()
  const processedIds = new Set()
  const reports = []
  let saved
  let closes = 0
  const sandbox = vm.createContext({
    state, skippedIds, processedIds,
    reportCommunityAction: (event) => reports.push(event),
    writeSaved: (value) => { saved = value },
    closeReplyComposer: async () => { closes += 1; return true },
    renderPanel() {},
  })
  vm.runInContext(helper, sandbox)
  assert.equal(await vm.runInContext('skipTransientReply({ id: "456" })', sandbox), true)
  assert.equal(skippedIds.has('456'), true)
  assert.equal(processedIds.has('456'), true)
  assert.equal(state.total, 34)
  assert.equal(state.pendingReply, '')
  assert.equal(state.pendingTweetId, '')
  assert.equal(state.errors, 1)
  assert.equal(closes, 1)
  assert.equal(saved.total, 34)
  assert.equal(reports[0].errorCode, 'x-transient-error')
})

test('reply submission detects an X error inside the existing composer dialog', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  async function publishReply\(composer, replyText\) \{[\s\S]*?(?=\n  async function replyOnce\()/)?.[0]
  assert.ok(helper)
  const alert = { text: '' }
  const composer = { dialog: { isConnected: true }, textbox: { isConnected: true }, submit: {} }
  let clicks = 0
  const sandbox = vm.createContext({
    state: { stopping: false },
    SUBMIT_TIMEOUT_MS: 5000, SEND_START_TIMEOUT_MS: 2500, SEND_CONFIRM_TIMEOUT_MS: 5000,
    loopApi: { composerText: () => '待发送回复', normalizePhraseText: (text) => text, isSubmitEnabled: () => true },
    findReplyRestrictionDialog: () => false, unavailablePostInDialog: () => false,
    transientErrorVisible: () => Boolean(alert.text),
    transientErrorNodes: () => alert.text ? [alert] : [],
    textOf: (node) => node.text,
    findDialogComposer: () => composer, waitUntil: async (predicate) => predicate(),
    successNoticeNodes: () => [], unavailablePostToasts: () => [], unavailablePostVisible: () => false,
    automationWarningNodes: () => [], duplicateReplyWarningVisible: () => false,
    realClick: () => { clicks += 1; alert.text = 'Something went wrong, but don’t fret — let’s give it another shot.' },
  })
  vm.runInContext(`${helper}\nglobalThis.publish = publishReply`, sandbox)
  assert.equal(await sandbox.publish(composer, '待发送回复'), 'transient-error')
  assert.equal(clicks, 1)
  assert.equal(await sandbox.publish(composer, '待发送回复'), 'transient-error')
  assert.equal(clicks, 1)
})

test('persistent X send errors end the reply task with a visible reason', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  function endReplyTaskAfterTransientError\(message\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(helper)
  const state = { running: true, stopping: false, pendingReply: '未发草稿', pendingTweetId: '123', status: '' }
  let cleared = 0
  let rendered = 0
  const sandbox = vm.createContext({ state, clearSaved: () => { cleared += 1 }, renderPanel: () => { rendered += 1 } })
  vm.runInContext(`${helper}\nglobalThis.end = endReplyTaskAfterTransientError`, sandbox)
  assert.equal(sandbox.end('X 仍显示发送错误；评论任务已结束'), 'stopped')
  assert.equal(state.running, false)
  assert.equal(state.pendingReply, '')
  assert.equal(state.status, 'X 仍显示发送错误；评论任务已结束')
  assert.equal(cleared, 1)
  assert.equal(rendered, 1)
})

test('a restricted reply enters a timed retry without stopping other tasks', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  function applyRiskStop\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(helper)
  const state = { assistantMode: 'timeline', loopPromise: {}, running: true, stopping: false, riskPaused: false, riskCooldownUntil: 0, riskRetries: 0, status: '', total: 0 }
  const calls = { like: 0, mutual: 0, poster: 0, canceled: 0, saved: 0 }
  const acknowledgedAutomationNotices = new WeakMap()
  const sandbox = vm.createContext({
    state, Date: { now: () => 1000 }, loopApi: { automationCooldownMs: (retries) => retries * 600000 },
    automationWarningNodes: () => [], acknowledgedAutomationNotices,
    mutualApi: { coolDownForRisk() { calls.mutual += 1 } }, postApi: { coolDownForRisk() { calls.poster += 1 } },
    cancelActiveAiRequest() { calls.canceled += 1 }, writeSaved() { calls.saved += 1 },
    formatCountdown: () => '10:00', renderPanel() {},
  })
  vm.runInContext(`let riskRoundRequested = false;\n${helper}\nglobalThis.cool = applyRiskStop; globalThis.requested = () => riskRoundRequested`, sandbox)
  sandbox.cool()
  assert.equal(state.running, true)
  assert.equal(state.riskPaused, true)
  assert.equal(state.riskCooldownUntil, 601000)
  assert.equal(sandbox.requested(), true)
  assert.match(state.status, /后自动重试/)
  assert.deepEqual(calls, { like: 0, mutual: 0, poster: 0, canceled: 1, saved: 1 })
  sandbox.cool()
  assert.equal(calls.canceled, 1)
  state.riskCooldownUntil = 0
  sandbox.cool()
  assert.equal(state.riskCooldownUntil, 1201000)
  state.assistantMode = 'mutual'
  sandbox.cool()
  assert.equal(calls.mutual, 1)
  state.assistantMode = 'poster'
  sandbox.cool()
  assert.equal(calls.poster, 1)
  const likeLimitHandler = source.match(/        onLimit\(_accountKey, target, errorCode\) \{[\s\S]*?\n        \},/)?.[0]
  assert.ok(likeLimitHandler)
  assert.match(likeLimitHandler, /currentAccountHandle\(\) \|\| lastKnownAccountHandle/)
  assert.doesNotMatch(likeLimitHandler, /xrc-flow-pause/)
})

test('a restricted reply waits for its deadline then resumes the same task', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  async function advanceRoundAfterRisk\([\s\S]*?\n  \}/)?.[0]
  assert.ok(helper)
  const state = { assistantMode: 'timeline', running: true, stopping: false, riskCooldownUntil: 601000, riskRetries: 1, riskPaused: true, total: 3 }
  let waitedUntil = 0
  let reloaded = 0
  const sandbox = vm.createContext({
    state, loopApi: loop, Date: { now: () => 1000 }, writeSaved() {}, formatCountdown: () => '10:00',
    async waitForDeadline(deadline, status) { waitedUntil = deadline; assert.match(status(600000), /自动重试/); return true },
    async reloadAndResume() { reloaded += 1; return true },
  })
  vm.runInContext(`let riskRoundRequested = true; let riskRoundAdvancing = false;\n${helper}\nglobalThis.resume = advanceRoundAfterRisk; globalThis.pending = () => riskRoundRequested`, sandbox)
  assert.equal(await sandbox.resume(), 'reload')
  assert.equal(waitedUntil, 601000)
  assert.equal(reloaded, 1)
  assert.equal(state.riskCooldownUntil, 0)
  assert.equal(state.riskPaused, false)
  assert.equal(sandbox.pending(), false)
})

test('offscreen timer message wakes a wait without relying on the page timer', async () => {
  const source = await readFile(new URL('timer.js', extensionDir), 'utf8')
  const listeners = []
  const context = vm.createContext({
    window: { setTimeout, clearTimeout },
    chrome: {
      runtime: {
        id: "test-extension",
        lastError: null,
        onMessage: { addListener(listener) { listeners.push(listener) } },
        sendMessage(message, callback) {
          callback({ ok: true })
          setTimeout(() => {
            for (const listener of listeners) {
              listener({ type: 'xrc-timer-fired', requestId: message.requestId })
            }
          }, 5)
        },
      },
    },
  })
  vm.runInContext(source, context)

  const startedAt = Date.now()
  await context.XInteractionTimer.wait(1000)
  assert.ok(Date.now() - startedAt < 250)
})

test('background timer keeps its originating tab and routes the wake-up back to that content script', async () => {
  const runtimeMessages = []
  const tabMessages = []
  globalThis.chrome = {
    offscreen: { async createDocument() {} },
    runtime: {
      getURL(pathname) { return `chrome-extension://test/${pathname}` },
      async getContexts() { return [{ contextType: 'OFFSCREEN_DOCUMENT' }] },
      async sendMessage(message) { runtimeMessages.push(message) },
    },
    tabs: {
      async sendMessage(tabId, message, options) { tabMessages.push({ tabId, message, options }) },
    },
  }

  try {
    await background.scheduleBackgroundTimer(
      { requestId: 'timer-1', delayMs: 2000 },
      { tab: { id: 42 }, frameId: 0 },
    )
    assert.deepEqual(runtimeMessages, [{
      type: 'xrc-offscreen-schedule',
      requestId: 'timer-1',
      delayMs: 2000,
      tabId: 42,
      frameId: 0,
    }])

    await background.deliverBackgroundTimer({ requestId: 'timer-1', tabId: 42, frameId: 0 })
    assert.deepEqual(tabMessages, [{
      tabId: 42,
      message: { type: 'xrc-timer-fired', requestId: 'timer-1' },
      options: { frameId: 0 },
    }])
  } finally {
    delete globalThis.chrome
  }
})

test('plugin stable runtime spans multiple task tabs and stops only after the final task stops', async () => {
  let savedRuntime = null
  const existingTabs = new Set([11, 22])
  globalThis.chrome = {
    storage: {
      local: {
        async get(key) { return { [key]: savedRuntime } },
        async set(value) { savedRuntime = value.xrcPluginRuntime },
      },
    },
    tabs: {
      async get(tabId) {
        if (!existingTabs.has(tabId)) throw new Error('tab closed')
        return { id: tabId }
      },
    },
  }

  try {
    const first = await background.updatePluginRuntime(
      { mode: 'timeline', active: true },
      { tab: { id: 11 } },
    )
    const stableStartedAt = first.runtime.startedAt
    assert.ok(stableStartedAt > 0)

    const second = await background.updatePluginRuntime(
      { mode: 'notifications', active: true },
      { tab: { id: 22 } },
    )
    assert.equal(second.runtime.startedAt, stableStartedAt)
    assert.deepEqual(Object.keys(second.runtime.tasks).sort(), ['notifications', 'timeline'])

    await background.updatePluginRuntime({ mode: 'timeline', active: false }, { tab: { id: 22 } })
    assert.ok(savedRuntime.tasks.timeline, 'an idle tab must not clear another tab\'s running task')

    await background.updatePluginRuntime({ mode: 'timeline', active: false }, { tab: { id: 11 } })
    assert.equal(savedRuntime.startedAt, stableStartedAt)
    assert.deepEqual(Object.keys(savedRuntime.tasks), ['notifications'])

    await background.updatePluginRuntime({ mode: 'notifications', active: false }, { tab: { id: 22 } })
    assert.equal(savedRuntime.startedAt, null)
    assert.deepEqual(savedRuntime.tasks, {})
  } finally {
    delete globalThis.chrome
  }
})

test('task detail probes show the owning tab state instead of a live but idle tab record', async () => {
  globalThis.chrome = {
    tabs: {
      async sendMessage(tabId, message) {
        assert.equal(message.type, 'xrc-task-state-probe')
        if (tabId === 11) return { ok: true, mode: 'timeline', phase: '' }
        if (tabId === 22) return { ok: true, mode: 'notifications', phase: 'paused', detail: '下一轮 5 分钟后', waitUntil: 5000 }
        if (tabId === 44) return { ok: true, mode: 'timeline', phase: 'running' }
        throw new Error('task tab has no content script')
      },
    },
  }
  try {
    const runtime = await background.verifyTaskRuntime({
      startedAt: 100,
      flow: { phase: 'running' },
      tasks: {
        timeline: { tabId: 11, phase: 'running', updatedAt: 100 },
        notifications: { tabId: 22, phase: 'running', updatedAt: 100 },
        poster: { tabId: 33, phase: 'running', updatedAt: 100 },
        'likes-posts': { tabId: 44, phase: 'running', updatedAt: 100 },
      },
    }, 20000)
    assert.equal(runtime.tasks.timeline, undefined)
    assert.equal(runtime.tasks.notifications.phase, 'paused')
    assert.equal(runtime.tasks.notifications.detail, '下一轮 5 分钟后')
    assert.equal(runtime.tasks.poster.phase, 'unknown')
    assert.equal(runtime.tasks['likes-posts'], undefined)
  } finally {
    delete globalThis.chrome
  }
})

test('an invalidated extension timer falls back to the page timer', async () => {
  const source = await readFile(new URL('timer.js', extensionDir), 'utf8')
  const context = vm.createContext({
    window: { setTimeout, clearTimeout },
    chrome: {
      runtime: {
        id: "test-extension",
        lastError: null,
        onMessage: { addListener() {} },
        sendMessage(_message, callback) {
          const error = new Error("Extension context invalidated.")
          this.lastError = error
          callback()
          this.lastError = null
          return Promise.reject(error)
        },
      },
    },
  })
  vm.runInContext(source, context)
  const startedAt = Date.now()
  await context.XInteractionTimer.wait(1000)
  assert.ok(Date.now() - startedAt >= 900)
  assert.ok(Date.now() - startedAt < 1800)
})

test('short DOM polling stays local instead of flooding the offscreen timer channel', async () => {
  const source = await readFile(new URL('timer.js', extensionDir), 'utf8')
  let sent = 0
  const context = vm.createContext({
    window: { setTimeout, clearTimeout },
    chrome: {
      runtime: {
        onMessage: { addListener() {} },
        sendMessage() { sent += 1 },
      },
    },
  })
  vm.runInContext(source, context)
  await context.XInteractionTimer.wait(5)
  assert.equal(context.XInteractionTimer.BACKGROUND_TIMER_MIN_MS, 1000)
  assert.equal(sent, 0)
})

test('AI poster formats blank lines and keeps the random interval between 25 and 35 minutes', () => {
  assert.equal(poster.randomIntervalMs(() => 0), 25 * 60 * 1000)
  assert.ok(poster.randomIntervalMs(() => 0.999999) <= 35 * 60 * 1000)
  assert.equal(poster.randomIntervalMs(() => 0, 'slow'), 50 * 60 * 1000)
  assert.equal(poster.randomIntervalMs(() => 1, 'turbo'), 10 * 60 * 1000)
  assert.equal(poster.randomIntervalMs(() => 0, 'fast'), 12 * 60 * 1000)
  assert.equal(poster.postScheduleProfile('missing').id, 'medium')
  assert.equal(poster.formatPostSchedule('fast').interval, '12～18 分钟')
  assert.equal(poster.snapshot().nextPostAt, 0)
  poster.setSchedulePace('turbo')
  assert.equal(poster.snapshot().schedulePace, 'turbo')
  assert.equal(poster.snapshot().nextPostAt, 0)
  poster.setSchedulePace('medium')
  assert.equal(poster.formatPost('推文：第一行\n第二行\n\n第三行'), '第一行\n\n第二行\n\n第三行')
  assert.equal(poster.editorText({ innerText: '第一行\n\n\n第二行' }), '第一行\n\n第二行')
  assert.equal(poster.editorText({ innerText: '有什么新鲜事？' }), '')
  assert.ok(Array.from(poster.formatPost('内容'.repeat(300))).length <= 180)
})

test('scheduled post separates long drafts into paragraphs with blank lines', () => {
  assert.equal(poster.formatShortPost('说句难听点的\n会不会搜东西，本质是能否把模糊需求拆成关键词。'), '说句难听点的\n\n会不会搜东西，本质是能否把模糊需求拆成关键词。')
  const singleParagraph = '贵州小伙零彩礼娶了俄罗斯姑娘。零彩礼这条，比身高差更值得琢磨。是真不在乎，还是本来就没这套规矩？'
  assert.equal(poster.formatShortPost(singleParagraph), '贵州小伙零彩礼娶了俄罗斯姑娘。\n\n零彩礼这条，比身高差更值得琢磨。\n\n是真不在乎，还是本来就没这套规矩？')
  assert.equal(poster.formatShortPost('我真的很好奇\n\n为什么要限制炒美股？'), '我真的很好奇\n\n为什么要限制炒美股？')
  assert.equal(poster.formatModelPost('这项新规今天公布了。执行细节还没说清，我觉得先别急着夸。'), '这项新规今天公布了。\n\n执行细节还没说清，我觉得先别急着夸。')
  assert.equal(poster.formatModelPost('这项新规今天公布了。\n\n执行细节还没说清，我觉得先别急着夸。'), '这项新规今天公布了。\n\n执行细节还没说清，我觉得先别急着夸。')
  assert.equal(poster.simplifyPostRhetoric('这更像客户在用脚投票，而非简单改版。'), '客户在用脚投票。')
  assert.equal(poster.simplifyPostRhetoric('说个暴论，这更像客户在用脚投票，而非简单改版。\n\n新界面让老用户多走了两步。'), '说个暴论，客户在用脚投票。\n\n新界面让老用户多走了两步。')
  assert.equal(poster.simplifyPostRhetoric('这不是简单改版，而是客户在用脚投票。'), '客户在用脚投票。')
  assert.equal(poster.simplifyPostRhetoric('新界面让老用户多走了两步。\n\n这更像客户在用脚投票，而非简单改版。'), '新界面让老用户多走了两步。\n\n客户在用脚投票。')
  assert.equal(poster.simplifyPostRhetoric('游戏公司缩减了外部咨询预算。\n\n游戏公司砍掉这类外部咨询预算时，先跑的就是最挨骂的那一环。'), '游戏公司缩减了外部咨询预算。')
  assert.equal(poster.simplifyPostRhetoric('游戏公司缩减了外部咨询预算。具体项目的处理方式还要看公开公告。'), '游戏公司缩减了外部咨询预算。具体项目的处理方式还要看公开公告。')
  assert.equal(poster.simplifyPostRhetoric('我真心觉得宋兴宇14岁辍学还能自学机械、飞控，花两个月做出载人飞行滑板飞越长江，最硬的地方是他把电影里的“绿魔”滑板真飞起来了。\n\n负债240万没挡住他继续试，这比飞越本身更能说明自学的分量。'), '我真心觉得宋兴宇14岁辍学还能自学机械、飞控，花两个月做出载人飞行滑板飞越长江，真硬啊。\n\n负债240万没挡住他继续试，太有分量了。')
})

test('used source IDs survive a fresh scheduled-post tab', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = {}
  const makeTab = () => {
    const context = vm.createContext({
      chrome: { storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } } },
      sessionStorage: { getItem: () => null },
    })
    vm.runInContext(source, context)
    return context.XInteractionPoster
  }
  const first = makeTab()
  await first.loadHistory()
  await first.rememberUsedSourceId('source-123')
  await first.rememberPublishedPost('source-123', '保留钩子\n这条内容已经发出', '表达方式影响讨论', {
    source: 'opinion', sourceLabel: '2aran 舆情分析', sourceText: '某个公开事件引发讨论',
    sourceUrl: 'https://example.com/source', sourcePageUrl: 'https://2aran.com/public-opinion',
  })
  const second = makeTab()
  await second.loadHistory()
  assert.equal(second.readUsedSourceIds().has('source-123'), true)
  assert.equal(storage.xrcPosterHistoryV2.published[0].topic, '表达方式影响讨论')
  assert.equal(storage.xrcPosterHistoryV2.published[0].sourceLabel, '2aran 舆情分析')
  assert.equal(storage.xrcPosterHistoryV2.published[0].sourceUrl, 'https://example.com/source')
  assert.equal(storage.xrcPosterHistoryV2.published[0].sourcePageUrl, 'https://2aran.com/public-opinion')
})

test('news IDs consumed by failed old rewrites become available again while published IDs stay deduplicated', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const stored = { xrcPosterHistoryV2: {
    sourceIds: ['toutiao:failed', 'toutiao:published'],
    published: [{ sourceId: 'toutiao:published', text: '这条已经发出', topic: '公开新闻' }],
  } }
  const context = vm.createContext({
    chrome: { storage: { local: {
      async get(key) { return { [key]: stored[key] } },
      async set(value) { Object.assign(stored, value) },
    } } },
    sessionStorage: { getItem: () => null },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  assert.equal(api.readUsedSourceIds().has('toutiao:failed'), false)
  assert.equal(api.readUsedSourceIds().has('toutiao:published'), true)
})

test('failed rewrites never fall back to the source post in the publish queue', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = {}
  const sourceText = '一个关于新工具使用方式的公开讨论'
  const context = vm.createContext({
    chrome: {
      runtime: {
        sendMessage(message, respond) {
          if (message.title === sourceText) respond({ ok: true, topic: '新工具上线跟风', post: '新工具刚上线\n\n不少人还没打开看一眼，\n\n名字已经先被吹上天了。' })
          else respond({ ok: false, error: '改写失败' })
        },
      },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  api.snapshot().sourceQueue.push(
    { id: 'toutiao:good', sourceType: 'news', source: 'toutiao', text: sourceText },
    { id: 'toutiao:failed', sourceType: 'news', source: 'toutiao', text: '另一个钩子\n这是一段原始内容，不能直接放入待发列表' },
  )
  await api.buildPublishList()
  assert.deepEqual(Array.from(api.snapshot().publishQueue, (item) => item.id), ['toutiao:good'])
  assert.equal(api.readUsedSourceIds().has('toutiao:failed'), false)
  assert.equal(api.snapshot().publishQueue[0].source, 'toutiao')
})

test('scheduled poster fills an empty queue from fresh hot topics and remembers their source IDs', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = {}
  const seen = []
  const rewrites = []
  const context = vm.createContext({
    chrome: {
      runtime: {
        lastError: null,
        sendMessage(message, respond) {
          seen.push(`${message.type}:${message.tier || ''}`)
          if (message.type === 'xrc-ai-news-sources') respond({ ok: true, items: [
            { id: 'toutiao:123', sourceType: 'news', source: 'toutiao', text: '一个关于新工具使用方式的公开讨论', summary: '', url: 'https://www.toutiao.com/a123' },
          ] })
          else {
            rewrites.push(message)
            respond({ ok: true, topic: '新工具上线跟风', post: '新工具刚上线\n\n不少人还没打开看一眼，\n\n名字已经先被吹上天了。' })
          }
        },
      },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  await api.collectNewsFallback()
  assert.deepEqual(seen, ['xrc-ai-news-sources:external', 'xrc-ai-news-rewrite:'])
  assert.equal(api.snapshot().publishQueue.length, 1)
  assert.equal(api.snapshot().publishQueue[0].sourceType, 'news')
  assert.equal(api.snapshot().publishQueue[0].sourceLabel, '今日头条')
  assert.equal(api.snapshot().publishQueue[0].sourceUrl, 'https://www.toutiao.com/a123')
  assert.equal(api.readUsedSourceIds().has('toutiao:123'), true)
  api.snapshot().publishQueue.length = 0
  await api.collectNewsFallback()
  assert.equal(api.snapshot().publishQueue[0].source, 'toutiao')
  assert.equal(api.snapshot().publishQueue[0].sourceLabel, '今日头条')
  assert.equal(rewrites.at(-1).source, 'toutiao')
})

test('a rewrite service failure falls back locally without exhausting news sources or marking them used', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = {}
  const calls = []
  const context = vm.createContext({
    chrome: {
      runtime: { lastError: null, sendMessage(message, respond) {
        calls.push(`${message.type}:${message.tier || ''}`)
        if (message.type === 'xrc-ai-news-sources') respond({ ok: true, items: [
          { id: 'toutiao:123', sourceType: 'news', source: 'toutiao', text: '一个关于新工具使用方式的公开讨论' },
        ], errors: ['知乎：HTTP 401'] })
        else respond({ ok: false, error: 'DeepSeek 请求失败（503）' })
      } },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  await api.collectNewsFallback()
  assert.deepEqual(calls, ['xrc-ai-news-sources:external', 'xrc-ai-news-rewrite:'])
  assert.equal(api.readUsedSourceIds().has('toutiao:123'), false)
  assert.equal(api.snapshot().publishQueue.length, 1)
  assert.equal(api.snapshot().publishQueue[0].source, 'evergreen')
  assert.ok(api.snapshot().publishQueue[0].text)
})

test('available feeds with rejected rewrites still produce distinct local social observations', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = { xrcPosterHistoryV2: {
    sourceIds: [],
    published: [
      { sourceId: 'evergreen:old-1', topic: '旧的泛化话题一', text: '老话题\n\n很多人讨论到最后，还是要回到自己的时间、现金流和承受范围。' },
      { sourceId: 'evergreen:old-2', topic: '旧的泛化话题二', text: '老话题\n\n先把现实条件摆出来，再决定怎么做，通常比追着一句口号走更稳。' },
    ],
  } }
  const feed = (sourceName, count) => Array.from({ length: count }, (_, index) => ({
    id: `${sourceName}:${index}`, source: sourceName, sourceType: 'news',
    text: `关于普通人生活选择的讨论第${index}条`,
  }))
  const context = vm.createContext({
    chrome: {
      runtime: { lastError: null, sendMessage(message, respond) {
        if (message.type === 'xrc-ai-news-sources') respond({ ok: true, items: message.tier === 'external'
          ? [...feed('zhihu', 25), ...feed('toutiao', 25)] : feed('aihot', 30) })
        else respond({ ok: true, skip: true })
      } },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  const publishedTexts = new Set()
  for (let index = 0; index < 15; index += 1) {
    await api.collectNewsFallback()
    const [draft] = api.snapshot().publishQueue
    assert.equal(draft.source, 'evergreen')
    assert.ok(draft.text)
    assert.equal(publishedTexts.has(draft.text), false)
    publishedTexts.add(draft.text)
    api.snapshot().publishQueue.shift()
    await api.rememberPublishedPost(draft.id, draft.text, draft.topic, draft)
  }
  assert.equal(publishedTexts.size, 15)
  await assert.rejects(api.collectNewsFallback(), /未通过：.*正文与已发内容完全相同/)
})

test('scheduled poster falls back to common social observations after hot feeds lack usable items', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = {}
  const calls = []
  const context = vm.createContext({
    chrome: {
      runtime: { lastError: null, sendMessage(message, respond) {
        calls.push(`${message.type}:${message.tier || ''}`)
        if (message.type === 'xrc-ai-news-sources') {
          respond({ ok: true, items: message.tier === 'opinion' ? [{
            id: 'opinion:site-1', sourceType: 'news', source: 'opinion', sourceLabel: '2aran 舆情分析',
            text: '一个关于新工具使用方式的公开讨论', url: 'https://example.com/original',
            sourcePageUrl: 'https://2aran.com/public-opinion',
          }] : [] })
        } else respond({ ok: true, topic: '新工具上线跟风', post: '新工具刚上线\n\n不少人还没打开看一眼，\n\n名字已经先被吹上天了。' })
      } },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  await api.collectNewsFallback()
  assert.equal(calls[0], 'xrc-ai-news-sources:external')
  assert.equal(calls[1], 'xrc-ai-news-sources:aihot')
  assert.ok(calls.slice(2).every((call) => call === 'xrc-ai-news-rewrite:'))
  assert.equal(api.snapshot().publishQueue[0].sourceLabel, '常用社会观察')
  assert.equal(api.snapshot().publishQueue[0].source, 'evergreen')
})

test('scheduled poster drafts Zhihu topics before Toutiao topics', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = {}
  const rewritten = []
  const rewriteRequests = []
  const context = vm.createContext({
    chrome: {
      runtime: { lastError: null, sendMessage(message, respond) {
        if (message.type === 'xrc-ai-news-sources') {
          respond({ ok: true, items: message.tier === 'external' ? [
            { id: 'toutiao:blood', sourceType: 'news', source: 'toutiao', text: '体检抽血为什么要抽多管' },
            { id: 'zhihu:tool', sourceType: 'news', source: 'zhihu', text: '一个关于新工具使用方式的公开讨论' },
          ] : [] })
        } else {
          rewritten.push(message.source)
          rewriteRequests.push(message)
          respond(message.source === 'zhihu'
            ? { ok: true, topic: '新工具上线跟风', post: '新工具刚上线\n\n不少人还没打开看一眼，\n\n名字已经先被吹上天了。' }
            : { ok: true, topic: '抽血管子排一排', post: '体检抽血，一排管子摆出来。\n\n结果还没等到，\n\n人先被这阵仗吓一跳。' })
        }
      } },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  await api.collectNewsFallback()
  assert.deepEqual(rewritten, ['zhihu'])
  assert.deepEqual(Array.from(api.snapshot().publishQueue, (item) => item.source), ['zhihu'])
  assert.equal(rewriteRequests.length, 1)
})

test('scheduled poster keeps trying fetched topics and reports the actual source and position', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = {}
  const statuses = []
  let rewrites = 0
  const context = vm.createContext({
    chrome: {
      runtime: { lastError: null, sendMessage(message, respond) {
        if (message.type === 'xrc-ai-news-sources') {
          respond({ ok: true, items: Array.from({ length: 4 }, (_, index) => ({
            id: `zhihu:${index}`, sourceType: 'news', source: 'zhihu',
            text: `关于普通人生活选择的讨论第${index}条`,
          })) })
        } else {
          rewrites += 1
          respond(rewrites <= 3 ? { ok: true, skip: true } : {
            ok: true, topic: '普通人生活选择',
            post: '普通人做选择，先看自己能承担什么。\n\n把时间和现金流算清楚，再决定要不要跟上。',
          })
        }
      } },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: {
      getItem: () => null,
      setItem(_key, value) { statuses.push(JSON.parse(value).status) },
    },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  await api.collectNewsFallback()
  assert.equal(rewrites, 4)
  assert.equal(api.snapshot().publishQueue[0].source, 'zhihu')
  assert.ok(statuses.some((status) => /已取得知乎素材，正在改写第 4\/4 条/.test(status)))
  assert.ok(statuses.some((status) => /知乎第 3\/4 条未通过/.test(status)))
})

test('hot-topic parsers require current site data and keep stable source IDs', () => {
  const aihot = background.parseAihotFeed('<rss><channel><item><guid>ai-42</guid><title>AI 行业正在发生的新变化</title><link>https://aihot.news/p/42</link><description><![CDATA[一段行业摘要]]></description></item></channel></rss>')
  assert.equal(aihot[0].id, 'aihot:ai-42')
  assert.equal(aihot[0].sourceLabel, 'AI HOT')
  assert.equal(aihot[0].url, 'https://aihot.news/p/42')
  assert.equal(background.parseToutiaoHot({ data: [{ ClusterId: '123', Title: '一个关于新工具使用方式的公开讨论', Url: 'https://www.toutiao.com/a123' }] })[0].id, 'toutiao:123')
  assert.equal(background.parseToutiaoHot({ data: [{ ClusterId: 7698667807361319433, ClusterIdStr: '7698667807361319433', Title: '工信部：禁止车辆行驶时用零重力座椅', Url: 'https://www.toutiao.com/trending/7698667807361319433/' }] })[0].id, 'toutiao:7698667807361319433')
  assert.equal(background.parseZhihuHot({ data: [{ target: { id: 42, title: '为什么很多人会误解新工具的使用方式？', url: 'https://www.zhihu.com/question/42' } }] })[0].id, 'zhihu:42')
  const event = { id: 'po_123', title: '新工具使用方式引发讨论', latestAt: new Date().toISOString() }
  assert.equal(background.parseOpinionHot({ source: 'fallback', meta: { hasData: false }, events: [event] }).length, 0)
  assert.equal(background.parseOpinionHot({ source: 'd1', meta: { hasData: true, isStale: true }, events: [event] }).length, 0)
  assert.equal(background.parseOpinionHot({ source: 'd1', meta: { hasData: true, isStale: false }, events: [event] })[0].id, 'opinion:po_123')
  assert.equal(background.parseOpinionHot({ source: 'd1', meta: { hasData: true, isStale: false }, events: [event] })[0].sourcePageUrl, 'https://2aran.com/public-opinion')
  assert.equal(background.parseOpinionHot({ source: 'd1', meta: { hasData: true, isStale: false }, events: [{ ...event, latestAt: '2020-01-01T00:00:00Z' }] }).length, 0)
  assert.match(background.POST_SYSTEM_PROMPT, /先从读者视角用一句话交代具体对象和发生的事/)
  assert.match(background.POST_SYSTEM_PROMPT, /35～90 个中文字符/)
  assert.match(background.POST_SYSTEM_PROMPT, /写成 2～3 个短段，段与段之间留 1 个空行/)
  assert.match(background.POST_SYSTEM_PROMPT, /直接说感受，不把赞叹写成意义分析/)
  assert.match(background.POST_SYSTEM_PROMPT, /不要为了凑段落补理由或总结/)
  assert.doesNotMatch(background.POST_SYSTEM_PROMPT, /最多 1 句理由/)
  assert.match(background.POST_SYSTEM_PROMPT, /0 句‘不是……而是……’/)
  assert.match(background.POST_SYSTEM_PROMPT, /‘这比……更能说明……’/)
  assert.match(background.POST_SYSTEM_PROMPT, /‘更像……而非……’/)
  assert.match(background.POST_SYSTEM_PROMPT, /0 句‘本文认为’/)
  assert.match(background.CLICKBAIT_POST_PROMPT, /观点型标题党/)
  assert.match(background.CLICKBAIT_POST_PROMPT, /0 句‘不是……而是……’/)
  assert.match(background.CLICKBAIT_POST_PROMPT, /45～100 个中文字符/)
  assert.match(background.CLICKBAIT_POST_PROMPT, /不要为了凑段落补后果、理由或总结/)
  assert.match(background.CLICKBAIT_POST_PROMPT, /0 次三段式说理/)
  assert.match(background.NEWS_REWRITE_SYSTEM_PROMPT, /发推提示词同样适用于本次热点改写/)
  assert.match(background.NEWS_REWRITE_SYSTEM_PROMPT, /来源材料里的类似句式也要改成直接陈述/)
  assert.match(background.NEWS_REWRITE_SYSTEM_PROMPT, /不要凭行业印象虚构砍预算后的人员反应/)
})

test('scheduled hot-topic rewrite uses the visible post prompt and migrates the old default', async () => {
  const contentSource = await readFile(new URL('content.js', extensionDir), 'utf8')
  const declaration = contentSource.match(/  const DEFAULT_POST_PROMPT = \[[\s\S]*?\n  \]\.join\("\\n"\);/)?.[0]
  assert.ok(declaration)
  const promptContext = vm.createContext({})
  vm.runInContext(`${declaration.replace('const DEFAULT_POST_PROMPT', 'var DEFAULT_POST_PROMPT')}\nglobalThis.value = DEFAULT_POST_PROMPT`, promptContext)
  assert.equal(promptContext.value, background.POST_SYSTEM_PROMPT)
  const clickbaitDeclaration = contentSource.match(/  const CLICKBAIT_POST_PROMPT = \[[\s\S]*?\n  \]\.join\("\\n"\);/)?.[0]
  assert.ok(clickbaitDeclaration)
  vm.runInContext(`${clickbaitDeclaration.replace('const CLICKBAIT_POST_PROMPT', 'var CLICKBAIT_POST_PROMPT')}\nglobalThis.clickbait = CLICKBAIT_POST_PROMPT`, promptContext)
  assert.equal(promptContext.clickbait, background.CLICKBAIT_POST_PROMPT)

  const originalChrome = globalThis.chrome
  const originalFetch = globalThis.fetch
  let storedPostPrompt = '自定义发推提示词：说清楚事实，像平时聊天。'
  let requestBody
  globalThis.chrome = { storage: { local: { async get() { return { xrcAiSettings: { apiKey: 'sk-12345678', postPrompt: storedPostPrompt } } } } } }
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body)
    return { ok: true, async json() { return { choices: [{ message: { content: '{"skip":false,"topic":"新工具上线","post":"新工具刚上线，大家都在讨论名字。"}' } }] } } }
  }
  try {
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /自定义发推提示词：说清楚事实/)
    assert.match(requestBody.messages[0].content, /本接口仅用 JSON 包装结果/)
    storedPostPrompt = '从素材里抓一件具体的事，用口语短句写。3 到 5 行，总共 35 到 75 个字'
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /先从读者视角用一句话交代具体对象和发生的事/)
    assert.doesNotMatch(requestBody.messages[0].content, /3 到 5 行，总共 35 到 75 个字/)
    storedPostPrompt = '根据给定热点写一条原创 X 短帖。参考王长富那种直接说人话、有一点个人判断的口气；不要模仿他的原句。不要写成三行微型故事。这话像在说 X，又像不止 X。'
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /标题和摘要是唯一事实依据/)
    assert.doesNotMatch(requestBody.messages[0].content, /参考王长富那种直接说人话/)
    storedPostPrompt = '结构：总共 18～70 字。短的一行即可，长的 2～4 行；换行时行间留一个空行。'
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /35～90 个中文字符/)
    assert.doesNotMatch(requestBody.messages[0].content, /短的一行即可/)
    storedPostPrompt = '任务：依据给定热点的标题和摘要，写一条有明确立场的 X 中文短帖。只选 1 个判断，开头就表态。篇幅：目标 35～90 个中文字符。'
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /先从读者视角用一句话交代具体对象和发生的事/)
    assert.doesNotMatch(requestBody.messages[0].content, /开头就表态/)
    storedPostPrompt = '风格：标题党引子。第一句至少带出对象。素材适合时可写“真正值得注意的是”。写 3～5 个短段。'
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /观点型标题党/)
    assert.doesNotMatch(requestBody.messages[0].content, /真正值得注意的是/)
    storedPostPrompt = '风格：观点型标题党。依据热点标题和摘要，第一句直接给 1 个有冲突感的判断。篇幅：目标 45～100 个中文字符。'
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /先用一句话说清具体对象和发生的事/)
  } finally {
    globalThis.chrome = originalChrome
    globalThis.fetch = originalFetch
  }
})

test('post opening draw uses each fixed phrase ten percent of the time', async () => {
  assert.equal(background.choosePostOpening(0), '说个暴论，')
  assert.equal(background.choosePostOpening(0.099), '说个暴论，')
  assert.equal(background.choosePostOpening(0.1), '讲个事实，')
  assert.equal(background.choosePostOpening(0.199), '讲个事实，')
  assert.equal(background.choosePostOpening(0.2), '我真心觉得')
  assert.equal(background.choosePostOpening(0.299), '我真心觉得')
  assert.equal(background.choosePostOpening(0.3), '')
  assert.equal(background.choosePostOpening(0.999), '')
  assert.equal(background.applyPostOpening('讲个事实，别把配置表当成安全说明。', '说个暴论，'), '说个暴论，别把配置表当成安全说明。')
  assert.equal(background.applyPostOpening('我真心觉得别把配置表当成安全说明。', ''), '别把配置表当成安全说明。')

  const originalChrome = globalThis.chrome
  const originalFetch = globalThis.fetch
  let requestBody
  globalThis.chrome = { storage: { local: { async get() { return { xrcAiSettings: { apiKey: 'sk-12345678' } } } } } }
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body)
    return { ok: true, async json() { return { choices: [{ message: { content: '{"skip":false,"topic":"配置说明","post":"别把配置表当成安全说明。"}' } }] } } }
  }
  try {
    const selected = await background.rewriteNewsPost({ title: '车辆座椅配置说明引发讨论', openingDraw: 0.05 })
    assert.match(requestBody.messages[0].content, /正文必须以“说个暴论，”开头/)
    assert.equal(selected.post, '说个暴论，别把配置表当成安全说明。')
    const ordinary = await background.rewriteNewsPost({ title: '车辆座椅配置说明引发讨论', openingDraw: 0.8 })
    assert.match(requestBody.messages[0].content, /先用一句话交代具体对象和事件，再说观点/)
    assert.equal(ordinary.post, '别把配置表当成安全说明。')
  } finally {
    globalThis.chrome = originalChrome
    globalThis.fetch = originalFetch
  }
})

test('a completed hot-topic rewrite is queued without a style retry', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = {}
  const requests = []
  const context = vm.createContext({
    chrome: {
      runtime: { lastError: null, sendMessage(message, respond) {
        requests.push(message)
        respond(requests.length === 1
          ? { ok: true, topic: '抽血检测流程', post: '说个暴论\n\n抽几管血常按检测项目分装。\n\n患者等结果时，先被这阵仗吓了一跳。' }
          : { ok: true, topic: '抽血管子排一排', post: '体检抽血，一排管子摆出来。\n\n结果还没等到，\n\n人先被这阵仗吓一跳。' })
      } },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  api.snapshot().sourceQueue.push({ id: 'toutiao:blood', sourceType: 'news', source: 'toutiao', text: '体检抽血为什么要抽多管' })
  await api.buildPublishList()
  assert.equal(requests.length, 1)
  assert.equal(api.snapshot().publishQueue.length, 1)
  assert.match(api.snapshot().publishQueue[0].text, /说个暴论/)
})

test('a longer successful hot-topic rewrite stays in the queue for publishing', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = { xrcPosterHistoryV2: {
    sourceIds: [],
    published: [{ sourceId: 'toutiao:older-seat', topic: '零重力座椅使用边界', text: '零重力座椅使用条件要讲清楚。', at: Date.now() }],
  } }
  const headline = '工信部提醒车辆行驶时不要使用零重力座椅'
  const draft = '工信部提醒行车时别用零重力座椅，这事值得重视。\n\n座椅舒服是一回事，行驶状态下能不能保持足够安全是另一回事。\n\n车企宣传功能时，最好把使用条件同时讲清楚。\n\n消费者看配置表也别只看名字，真正要紧的是功能在什么场景下可以使用。\n\n比起一个好听的卖点，清楚的使用边界更有用。'
  const context = vm.createContext({
    chrome: {
      runtime: { lastError: null, sendMessage(_message, respond) {
        respond({ ok: true, topic: '零重力座椅使用边界', post: draft })
      } },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  api.snapshot().sourceQueue.push({ id: 'toutiao:seat', sourceType: 'news', source: 'toutiao', text: headline })
  await api.buildPublishList(1)
  const [queued] = api.snapshot().publishQueue
  assert.equal(queued.source, 'toutiao')
  assert.equal(queued.text, draft)
  assert.equal(queued.topic, '零重力座椅使用边界')
  assert.doesNotMatch(source, /qualityReason\(|duplicateReason\(/)
})

test('DeepSeek post rewrite accepts a nonempty draft without extra formatting gates', () => {
  assert.deepEqual(background.parseSourceRewrite('{"skip":false,"topic":"表达方式影响讨论","post":"首句\\n正文"}'), {
    skip: false, topic: '表达方式影响讨论', post: '首句\n正文',
  })
  assert.deepEqual(background.parseSourceRewrite('{"skip":true,"topic":"","post":""}'), {
    skip: true, topic: '', post: '',
  })
  assert.deepEqual(background.parseSourceRewrite('模型写好的一段正文。', '某个具体新闻标题'), {
    skip: false, topic: '某个具体新闻标题', post: '模型写好的一段正文。',
  })
  assert.deepEqual(background.parseSourceRewrite('{"skip":false,"post":"另一段正文。"}', '某个具体新闻标题'), {
    skip: false, topic: '某个具体新闻标题', post: '另一段正文。',
  })
  assert.throws(() => background.parseSourceRewrite('直接照抄原文'), /可用草稿/)
  assert.throws(() => background.parseSourceRewrite('{broken', '某个具体新闻标题'), /可解析的草稿/)
})

test('scheduled poster recognizes X duplicate warning without treating unrelated alerts as duplicates', () => {
  const previousDocument = global.document
  const duplicate = { innerText: 'Whoops! You already said that.' }
  const unrelated = { innerText: 'Something went wrong.' }
  global.document = { querySelectorAll: () => [duplicate, unrelated] }
  try {
    assert.deepEqual(poster.duplicatePostNoticeNodes(), [duplicate])
    global.document = { querySelectorAll: () => [{ innerText: '你已经说过了' }] }
    assert.equal(poster.duplicatePostNoticeNodes().length, 1)
  } finally {
    global.document = previousDocument
  }
})

test('post draft clear removes a rejected duplicate from the inline composer', async () => {
  const draft = require('../../tools/x-reply-clipboard-extension/draftFill.js')
  const previousDocument = global.document
  const previousWindow = global.window
  const editor = {
    innerText: '已经发过的内容',
    parentElement: null,
    closest: () => null,
    getBoundingClientRect: () => ({ width: 200, height: 60 }),
    focus() {},
  }
  global.document = {
    querySelectorAll: () => [editor],
    execCommand(command) {
      if (command === 'delete') editor.innerText = ''
      return true
    },
  }
  global.window = {}
  try {
    assert.equal((await draft.clearReplyComposer('post')).ok, true)
    assert.equal(editor.innerText, '')
  } finally {
    global.document = previousDocument
    global.window = previousWindow
  }
})

test('a saved duplicate post is removed from the queue before the next send', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const listeners = new Set()
  const editor = {
    innerText: '重复的第一条',
    isConnected: true,
    closest: () => null,
    getBoundingClientRect: () => ({ width: 200, height: 60 }),
  }
  const submit = {
    disabled: false,
    getAttribute: () => null,
    closest: () => null,
    getBoundingClientRect: () => ({ width: 40, height: 20 }),
  }
  const body = {}
  editor.parentElement = { parentElement: body, querySelector: () => submit }
  const alert = { innerText: 'Whoops! You already said that.' }
  const window = {
    location: { pathname: '/home' },
    setTimeout,
    addEventListener: (_name, fn) => listeners.add(fn),
    removeEventListener: (_name, fn) => listeners.delete(fn),
    postMessage(message) {
      if (message.direction !== 'request') return
      if (message.clear) editor.innerText = ''
      for (const listener of listeners) listener({ source: window, data: {
        channel: message.channel, direction: 'response', requestId: message.requestId, result: { ok: true },
      } })
    },
  }
  const saved = {
    running: true,
    count: 0,
    currentPost: '重复的第一条',
    currentSourceId: 'opinion:first',
    lastError: '没有确认推文发送成功',
    nextPostAt: Date.now() + 60000,
    publishQueue: [{ id: 'opinion:first', sourceType: 'news', draftPolicyVersion: poster.DRAFT_POLICY_VERSION, text: '重复的第一条' }, { id: 'opinion:second', sourceType: 'news', draftPolicyVersion: poster.DRAFT_POLICY_VERSION, text: '另一条' }],
  }
  const sessionStorage = {
    getItem: () => JSON.stringify(saved),
    setItem() {},
    removeItem() {},
  }
  const document = {
    body,
    querySelectorAll(selector) {
      if (selector.includes('tweetTextarea_0')) return [editor]
      if (selector.includes('tweetButtonInline')) return [submit]
      if (selector.includes('[role="alert"]')) return [alert]
      return []
    },
  }
  const chrome = { storage: { local: { async get() { return {} }, async set() {} } } }
  const context = vm.createContext({ window, document, sessionStorage, chrome, setTimeout, clearTimeout, URL, console })
  vm.runInContext(source, context)
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('duplicate post was not skipped')), 3000)
    context.XInteractionPoster.restore((snapshot) => {
      if (!snapshot.status.startsWith('X 提示这条内容已说过')) return
      clearTimeout(timeout)
      assert.deepEqual(Array.from(snapshot.publishQueue, (item) => item.id), ['opinion:second'])
      assert.equal(editor.innerText, '')
      assert.equal(snapshot.count, 0)
      context.XInteractionPoster.stop()
      resolve()
    })
  })
})

test('legacy queued drafts are cleared instead of being sent after the quality update', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const listeners = new Set()
  const editor = {
    innerText: '旧钩子\n\n旧正文，这一版没有经过新规则筛选',
    closest: () => null,
    getBoundingClientRect: () => ({ width: 200, height: 60 }),
  }
  const submit = { disabled: false, closest: () => null, getAttribute: () => null, getBoundingClientRect: () => ({ width: 40, height: 20 }) }
  const body = {}
  editor.parentElement = { parentElement: body, querySelector: () => submit }
  const window = {
    location: { pathname: '/home' }, setTimeout,
    addEventListener: (_name, fn) => listeners.add(fn),
    removeEventListener: (_name, fn) => listeners.delete(fn),
    postMessage(message) {
      if (message.direction !== 'request') return
      if (message.clear) editor.innerText = ''
      for (const listener of listeners) listener({ source: window, data: {
        channel: message.channel, direction: 'response', requestId: message.requestId, result: { ok: true },
      } })
    },
  }
  const text = '旧钩子\n旧正文，这一版没有经过新规则筛选'
  const saved = { running: true, currentPost: text, currentSourceId: 'legacy', publishQueue: [{ id: 'legacy', text }] }
  const sessionStorage = { getItem: () => JSON.stringify(saved), setItem() {}, removeItem() {} }
  const document = { body, querySelectorAll(selector) {
    if (selector.includes('tweetTextarea_0')) return [editor]
    if (selector.includes('tweetButtonInline')) return [submit]
    return []
  } }
  const chrome = { storage: { local: { async get() { return {} }, async set() {} } } }
  const context = vm.createContext({ window, document, sessionStorage, chrome, setTimeout, clearTimeout, URL, console })
  vm.runInContext(source, context)
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('legacy draft was not skipped')), 3000)
    context.XInteractionPoster.restore((snapshot) => {
      if (!snapshot.status.startsWith('已清理旧版素材草稿')) return
      clearTimeout(timeout)
      assert.equal(editor.innerText, '')
      assert.equal(snapshot.publishQueue.length, 0)
      assert.equal(snapshot.count, 0)
      context.XInteractionPoster.stop()
      resolve()
    })
  })
})

test('picks the topmost unseen post that still has a reply button', () => {
  const processed = new Set(['2'])
  const next = loop.nextTweet(
    [
      { id: '2', top: 10, replyButton: {} },
      { id: '3', top: 400, replyButton: {} },
      { id: '1', top: 0, replyButton: null },
      { id: '4', top: 80, replyButton: {} },
    ],
    processed,
  )

  assert.equal(next.id, '4')
})

test('recognizes the X reply-permission modal without mistaking other dialogs for it', () => {
  assert.equal(loop.isReplyRestrictedText('Who can reply?\nOnly some accounts can reply.\nSee conversation\nGot It'), true)
  assert.equal(loop.isReplyRestrictedText('谁可以回复？\n只有部分账号可以回复\n知道了'), true)
  assert.equal(loop.isReplyRestrictedText('Who can reply?\nEveryone can reply.'), false)
  assert.equal(loop.isReplyRestrictedText('Something went wrong. Please try again.'), false)
})

test('reloads after 35 successful replies and after the timeline stalls', () => {
  assert.deepEqual(loop.shouldReload({ pageCount: 35, succeeded: 35, stalled: false }), {
    reload: true,
    reason: 'batch',
  })
  assert.deepEqual(loop.shouldReload({ pageCount: 8, succeeded: 8, stalled: true }), {
    reload: true,
    reason: 'stalled',
  })
  assert.deepEqual(loop.shouldReload({ pageCount: 0, succeeded: 0, stalled: true }), {
    reload: false,
    reason: '',
  })
  assert.equal(loop.BATCH_SIZE, 35)
  assert.equal(loop.ROUNDS_PER_RUN, 5)
  assert.equal(loop.RUN_SIZE, 175)
  assert.deepEqual(loop.batchTransition({ pageCount: 34, completedRounds: 0 }), {
    action: 'continue',
    completedRounds: 0,
    pageCount: 34,
  })
  assert.deepEqual(loop.batchTransition({ pageCount: 35, completedRounds: 0 }), {
    action: 'reload',
    completedRounds: 1,
    pageCount: 0,
  })
  assert.deepEqual(loop.batchTransition({ pageCount: 35, completedRounds: 4 }), {
    action: 'complete',
    completedRounds: 5,
    pageCount: 0,
  })
})

test('creates one persisted-size random execution plan within the configured ranges', () => {
  const minimumPlan = loop.createRunPlan(() => 0)
  assert.deepEqual(minimumPlan, { pace: 'boundary', rounds: 2, roundTargets: [20, 20], total: 40 })

  const maximumPlan = loop.createRunPlan(() => 1)
  assert.deepEqual(maximumPlan, { pace: 'boundary', rounds: 3, roundTargets: [30, 30, 30], total: 90 })
  assert.equal(loop.randomReplyDelaySeconds(() => 0), 6)
  assert.equal(loop.randomReplyDelaySeconds(() => 1), 10)
  assert.equal(loop.randomCycleDelayMs(() => 0), 10 * 60 * 1000)
  assert.equal(loop.randomCycleDelayMs(() => 1), 15 * 60 * 1000)

  assert.deepEqual(loop.SCHEDULE_PROFILES.map((item) => item.label), ['慢', '中', '边界测试', '快', '超快'])
  assert.equal(loop.DEFAULT_SCHEDULE_PACE, 'boundary')
  assert.equal(loop.schedulePaceIndex('slow'), 0)
  assert.equal(loop.schedulePaceIndex('turbo'), 4)
  assert.equal(loop.scheduleProfile('missing').id, 'boundary')
  assert.equal(loop.createRunPlan(() => 0, 'slow').rounds, 2)
  assert.equal(loop.createRunPlan(() => 0, 'slow').roundTargets[0], 12)
  assert.equal(loop.createRunPlan(() => 1, 'turbo').rounds, 8)
  assert.equal(loop.createRunPlan(() => 1, 'turbo').roundTargets[0], 55)
  assert.equal(loop.randomReplyDelaySeconds(() => 0, 'turbo'), 1)
  assert.equal(loop.randomReplyDelaySeconds(() => 1, 'fast'), 6)
  assert.equal(loop.randomCycleDelayMs(() => 0, 'turbo'), 20 * 60 * 1000)
  assert.equal(loop.randomCycleDelayMs(() => 1, 'slow'), 6 * 60 * 60 * 1000)
  assert.equal(loop.formatSchedule('medium').cycleDelay, '2～3 小时')
  assert.equal(loop.formatSchedule('fast').cycleDelay, '60～90 分钟')
  assert.equal(loop.formatSchedule('turbo').replyDelay, '1～3 秒')
  assert.deepEqual(loop.scheduleBounds(), { minReplies: 12, maxReplies: 55, minRounds: 2, maxRounds: 8 })
})

test('boundary testing keeps automation running through personal work hours', () => {
  const mondayLunch = new Date(2026, 9, 19, 12, 30).getTime()
  const mondayEvening = new Date(2026, 9, 19, 18, 0).getTime()
  const mondayMorning = new Date(2026, 9, 19, 10, 0).getTime()
  const saturday = new Date(2026, 9, 17, 12, 30).getTime()
  assert.equal(loop.nextAvailableAt(mondayMorning), mondayMorning)
  assert.equal(loop.nextAvailableAt(mondayLunch), mondayLunch)
  assert.equal(loop.nextAvailableAt(mondayEvening), mondayEvening)
  assert.equal(loop.nextAvailableAt(saturday), saturday)
})

test('first pace migration selects boundary testing instead of leaving turbo highlighted', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.match(source, /const needsBoundaryMigration = Number\(stored\?\.\[SCHEDULE_DEFAULT_VERSION_KEY\] \|\| 0\) < 2/)
  assert.match(source, /const pace = needsBoundaryMigration\s*\n\s*\? loopApi\.DEFAULT_SCHEDULE_PACE/)
  assert.match(source, /\[SCHEDULE_DEFAULT_VERSION_KEY\]: 2/)
})

test('treats a disabled Reply button and empty composer placeholders as not ready', () => {
  assert.equal(loop.isSubmitEnabled(null), false)
  assert.equal(loop.isSubmitEnabled({ disabled: true, getAttribute() { return null } }), false)
  assert.equal(
    loop.isSubmitEnabled({ disabled: false, getAttribute(name) { return name === 'aria-disabled' ? 'true' : null } }),
    false,
  )
  assert.equal(loop.isSubmitEnabled({ disabled: false, getAttribute() { return null } }), true)
  assert.equal(loop.composerText({ innerText: 'Post your reply' }), '')
  assert.equal(loop.composerText({ textContent: '  学习了 \u200b' }), '学习了')
})

test('reads a post id from a status permalink', () => {
  assert.equal(loop.statusIdFromHref('/Ocean_Yu1/status/1840000000000000000'), '1840000000000000000')
  assert.equal(loop.statusIdFromHref('https://x.com/Ocean_Yu1/status/99/photo/1'), '99')
  assert.equal(loop.statusIdFromHref('/home'), '')
})

test('reads and normalizes the post author handle from a status permalink', () => {
  assert.equal(loop.handleFromStatusHref('/Ocean_Yu1/status/1840000000000000000'), 'ocean_yu1')
  assert.equal(loop.handleFromStatusHref('https://x.com/TUARAN/status/99/photo/1'), 'tuaran')
  assert.equal(loop.handleFromStatusHref('/i/web/status/99'), '')
  assert.equal(loop.normalizeHandle('@TUARAN'), 'tuaran')
})

test('recognizes only notification tweets that reply to the signed-in account', () => {
  assert.equal(loop.isNotificationReplyText('Replying to @TUARAN', '@tuaran'), true)
  assert.equal(loop.isNotificationReplyText('正在回复 @tuaran', 'TUARAN'), true)
  assert.equal(loop.isNotificationReplyText('liked your reply', 'tuaran'), false)
  assert.equal(loop.isNotificationReplyText('Replying to @someone_else', 'tuaran'), false)
})

test('notification conversation uses the nearest earlier post by the signed-in account', () => {
  const article = (href, text) => ({
    parentElement: { closest() { return null } },
    querySelector(selector) {
      if (selector === 'a[href*="/status/"] time') return { closest() { return { getAttribute() { return href } } } }
      if (selector === '[data-testid="tweetText"]') return { innerText: text }
      return null
    },
  })
  const articles = [
    article('/me/status/100', '我的原帖'),
    article('/other/status/101', '别人的中间回复'),
    article('/me/status/102', '我补充的上下文'),
    article('/friend/status/103', '对方最新回复'),
  ]
  const result = context.findConversation(articles, '103', 'me', 'friend')
  assert.equal(result.ownPost.text, '我补充的上下文')
  assert.equal(result.reply.text, '对方最新回复')
  assert.equal(context.findConversation(articles, '103', 'me', 'stranger'), null)
  assert.equal(context.findConversation([articles.at(-1)], '103', 'me', 'friend'), null)
})

test('notification context opens a background conversation tab and closes it after reading', async () => {
  let created = null
  let removed = null
  globalThis.chrome = {
    tabs: {
      async create(options) { created = options; return { id: 91 } },
      async sendMessage(id, message) {
        assert.equal(id, 91)
        assert.equal(message.replyId, '103')
        return { context: { ownPost: { text: '我的帖子' }, reply: { text: '对方回复' } } }
      },
      async remove(id) { removed = id },
    },
  }
  try {
    const result = await background.readNotificationContext({
      replyUrl: 'https://x.com/friend/status/103', replyId: '103', ownHandle: 'me', replyAuthor: 'friend',
    }, { tab: { windowId: 7 } })
    assert.equal(result.context.ownPost.text, '我的帖子')
    assert.equal(new URL(created.url).searchParams.get('xrcContext'), '1')
    assert.equal(created.active, false)
    assert.equal(removed, 91)
  } finally {
    delete globalThis.chrome
  }
})

test('DeepSeek receives both sides of a notification conversation', async () => {
  let request = null
  const originalFetch = globalThis.fetch
  globalThis.chrome = { storage: { local: { async get() { return { xrcAiSettings: { apiKey: 'sk-12345678' } } } } } }
  globalThis.fetch = async (_url, options) => {
    request = JSON.parse(options.body)
    return { ok: true, async json() { return { choices: [{ message: { content: '谢谢补充，我的意思是这个范围。' } }] } } }
  }
  try {
    await background.callDeepSeek({
      postText: '对方回复',
      conversation: { ownPost: { text: '我的帖子' }, reply: { text: '对方回复' } },
    })
    const userPrompt = request.messages[1].content
    assert.match(userPrompt, /我的帖子：\n我的帖子/)
    assert.match(userPrompt, /对方针对这条帖子写的回复：\n对方回复/)
    assert.match(userPrompt, /直接回应对方这条回复/)
    await background.callDeepSeek({
      postText: '生日快乐',
      conversation: { ownPost: null, reply: { text: '生日快乐' } },
    })
    const fallbackPrompt = request.messages[1].content
    assert.match(fallbackPrompt, /对方回复给我的内容：\n生日快乐/)
    assert.match(fallbackPrompt, /以收到回复的人的身份随手接一句/)
    assert.match(request.messages[0].content, /应表示感谢，而不是再次祝对方生日快乐/)
    await background.callDeepSeek({
      postText: '说了半天一句重点没有',
      conversation: { ownPost: null, reply: { text: '说了半天一句重点没有' } },
    })
    assert.match(request.messages[1].content, /批评表达散乱时可自然承认写散了/)
    assert.match(request.messages[1].content, /不要装作知道原帖结论，不要反问对方/)
    assert.match(request.messages[0].content, /避免客服式套话、空泛道歉/)
  } finally {
    delete globalThis.chrome
    globalThis.fetch = originalFetch
  }
})

test('temporary DeepSeek overload falls back to NAS with the same reply context', async () => {
  const originalFetch = globalThis.fetch
  const originalReceipt = globalThis.XrcCommunityReceipt
  const requests = []
  globalThis.chrome = { storage: { local: { async get() { return { xrcAiSettings: { apiKey: 'sk-12345678' }, xrcAccountHandle: 'Tuaran' } } } } }
  globalThis.XrcCommunityReceipt = { async readSecret() { return 'test-secret' } }
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options })
    if (url.includes('api.deepseek.com')) return {
      ok: false, status: 503,
      async json() { return { error: { message: 'Service is too busy' } } },
    }
    return { ok: true, async json() { return { content: '谢谢提醒，我再说清楚点。' } } }
  }
  try {
    const reply = await background.callDeepSeek({
      postText: '对方回复',
      conversation: { ownPost: { text: '我的帖子' }, reply: { text: '对方回复' } },
    })
    assert.equal(reply, '谢谢提醒，我再说清楚点。')
    assert.equal(requests.length, 2)
    assert.equal(requests[1].url, 'https://2aran.com/api/community-actions/model-fallback')
    assert.equal(requests[1].options.headers['x-community-action-secret'], 'test-secret')
    assert.match(JSON.parse(requests[1].options.body).messages[1].content, /我的帖子：\n我的帖子/)

    requests.length = 0
    globalThis.fetch = async (url) => {
      requests.push({ url })
      return { ok: false, status: 401, async json() { return { error: { message: 'Invalid API key' } } } }
    }
    await assert.rejects(background.callDeepSeek({ postText: '你好' }), /Invalid API key/)
    assert.equal(requests.length, 1)
  } finally {
    globalThis.fetch = originalFetch
    globalThis.XrcCommunityReceipt = originalReceipt
    delete globalThis.chrome
  }
})

test('NAS failure falls back to configured B.AI without losing reply context', async () => {
  const originalFetch = globalThis.fetch
  const originalReceipt = globalThis.XrcCommunityReceipt
  const requests = []
  const progress = []
  globalThis.chrome = { storage: { local: { async get() { return { xrcAiSettings: { apiKey: 'sk-12345678', baiApiKey: 'sk-bai-test-key' }, xrcAccountHandle: 'Tuaran' } } } } }
  globalThis.XrcCommunityReceipt = { async readSecret() { return 'test-secret' } }
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options })
    if (url.includes('api.deepseek.com')) return { ok: false, status: 503, async json() { return { error: { message: 'Service is too busy' } } } }
    if (url.includes('2aran.com')) return { ok: false, status: 502, async json() { return { error: 'OLLAMA_API_TIMEOUT' } } }
    return { ok: true, async json() { return { output: [{ type: 'message', content: [{ type: 'output_text', text: '谢谢提醒，我再核对一下。' }] }] } } }
  }
  try {
    const reply = await background.callDeepSeek({
      postText: '生日快乐',
      conversation: { ownPost: { text: '我今天过生日' }, reply: { text: '生日快乐' } },
      onProgress: (status) => progress.push(status),
    })
    assert.equal(reply, '谢谢提醒，我再核对一下。')
    assert.deepEqual(progress, [
      '正在读取模型设置…',
      '正在请求 DeepSeek 生成回复…',
      'DeepSeek 暂不可用，正在尝试 NAS 模型…',
      'NAS 暂不可用，正在尝试 B.AI 模型…',
    ])
    assert.equal(requests.length, 3)
    assert.equal(requests[2].url, 'https://api.b.ai/v1/responses')
    assert.equal(requests[2].options.headers.authorization, 'Bearer sk-bai-test-key')
    const baiBody = JSON.parse(requests[2].options.body)
    assert.equal(baiBody.model, 'gpt-6-luna')
    assert.equal(baiBody.reasoning.effort, 'none')
    assert.match(baiBody.input[0].content, /我的帖子：\n我今天过生日/)
    assert.match(baiBody.input[0].content, /生日快乐/)
  } finally {
    globalThis.fetch = originalFetch
    globalThis.XrcCommunityReceipt = originalReceipt
    delete globalThis.chrome
  }
})

test('selected reply providers skip disabled models and do not require a DeepSeek key', async () => {
  const originalFetch = globalThis.fetch
  const originalReceipt = globalThis.XrcCommunityReceipt
  const requests = []
  const settings = { replyProviders: ['nas'], baiApiKey: 'sk-bai-test-key' }
  globalThis.chrome = { storage: { local: { async get() { return { xrcAiSettings: settings, xrcAccountHandle: 'Tuaran' } } } } }
  globalThis.XrcCommunityReceipt = { async readSecret() { return 'test-secret' } }
  globalThis.fetch = async (url) => {
    requests.push(url)
    if (url.includes('2aran.com')) return { ok: true, async json() { return { content: 'NAS 回复' } } }
    return { ok: true, async json() { return { output: [{ type: 'message', content: [{ type: 'output_text', text: 'B.AI 回复' }] }] } } }
  }
  try {
    assert.equal(await background.callDeepSeek({ postText: '你好' }), 'NAS 回复')
    assert.deepEqual(requests, ['https://2aran.com/api/community-actions/model-fallback'])
    requests.length = 0
    settings.replyProviders = ['bai']
    assert.equal(await background.callDeepSeek({ postText: '你好' }), 'B.AI 回复')
    assert.deepEqual(requests, ['https://api.b.ai/v1/responses'])
  } finally {
    globalThis.fetch = originalFetch
    globalThis.XrcCommunityReceipt = originalReceipt
    delete globalThis.chrome
  }
})

test('cancelling a NAS reply aborts its request without trying the next model', async () => {
  const originalFetch = globalThis.fetch
  const originalReceipt = globalThis.XrcCommunityReceipt
  let markStarted
  const started = new Promise((resolve) => { markStarted = resolve })
  const requests = []
  globalThis.chrome = { storage: { local: { async get() { return { xrcAiSettings: { replyProviders: ['nas', 'bai'], baiApiKey: 'sk-bai-test-key' }, xrcAccountHandle: 'Tuaran' } } } } }
  globalThis.XrcCommunityReceipt = { async readSecret() { return 'test-secret' } }
  globalThis.fetch = (url, { signal }) => {
    requests.push(url)
    markStarted()
    return new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true })
    })
  }
  try {
    const controller = new AbortController()
    const pending = background.callDeepSeek({ postText: '你好', signal: controller.signal })
    await started
    controller.abort()
    await assert.rejects(pending, /回复任务已取消/)
    assert.deepEqual(requests, ['https://2aran.com/api/community-actions/model-fallback'])
  } finally {
    globalThis.fetch = originalFetch
    globalThis.XrcCommunityReceipt = originalReceipt
    delete globalThis.chrome
  }
})

test('B.AI billing restriction pauses repeated third-provider requests', async () => {
  const originalFetch = globalThis.fetch
  const originalReceipt = globalThis.XrcCommunityReceipt
  const storage = { xrcAiSettings: { apiKey: 'sk-12345678', baiApiKey: 'sk-bai-test-key' } }
  const requests = []
  globalThis.chrome = { storage: { local: {
    async get(key) { return typeof key === 'string' ? { [key]: storage[key] } : storage },
    async set(value) { Object.assign(storage, value) },
  } } }
  globalThis.XrcCommunityReceipt = { async readSecret() { return 'test-secret' } }
  globalThis.fetch = async (url) => {
    requests.push(url)
    if (url.includes('api.deepseek.com')) return { ok: false, status: 503, async json() { return { error: { message: 'Service is too busy' } } } }
    if (url.includes('2aran.com')) return { ok: false, status: 404, async json() { return {} } }
    return { ok: false, status: 403, async json() { return { error: { message: 'Deposit required' } } } }
  }
  try {
    await assert.rejects(background.callDeepSeek({ postText: '你好' }), /B.AI 余额或模型权限不足（403）/)
    await assert.rejects(background.callDeepSeek({ postText: '你好' }), /暂缓重复请求/)
    assert.equal(requests.filter((url) => url.includes('api.b.ai')).length, 1)
    assert.equal(requests.filter((url) => url.includes('2aran.com')).length, 2)
    assert.ok(storage.xrcBaiAccessCooldown.until > Date.now())
  } finally {
    globalThis.fetch = originalFetch
    globalThis.XrcCommunityReceipt = originalReceipt
    delete globalThis.chrome
  }
})

test('limits notification interaction to the most recent two hours', () => {
  const now = Date.parse('2026-10-09T12:00:00.000Z')
  assert.equal(loop.NOTIFICATION_WINDOW_MS, 2 * 60 * 60 * 1000)
  assert.equal(loop.timestampFromDatetime('2026-10-09T10:30:00.000Z'), Date.parse('2026-10-09T10:30:00.000Z'))
  assert.equal(loop.isWithinNotificationWindow(Date.parse('2026-10-09T10:00:00.000Z'), now), true)
  assert.equal(loop.isWithinNotificationWindow(Date.parse('2026-10-09T09:59:59.000Z'), now), false)
  assert.equal(loop.isOlderThanNotificationWindow(Date.parse('2026-10-09T09:59:59.000Z'), now), true)
  assert.equal(loop.timestampFromDatetime('not-a-date'), 0)
})

test('recognizes the list routes used by the integrated mutual helper', () => {
  assert.ok(['/crazypig9y/followers', '/jianlvup/followers', '/jianlvya/followers', '/kyotom08/followers', '/Chill_Alpha/followers'].includes(mutual.targetPath('targetFollow')))
  assert.deepEqual(mutual.constants.TARGET_FOLLOW_HANDLES, ['crazypig9y', 'jianlvup', 'jianlvya', 'kyotom08', 'Chill_Alpha'])
  assert.equal(mutual.isFollowingPath('/tuaran/following'), true)
  assert.equal(mutual.isFollowingPath('/tuaran/followers'), false)
  assert.equal(mutual.isFollowersPath('/tuaran/followers'), true)
  assert.equal(mutual.isFollowersPath('/tuaran/verified_followers'), true)
  assert.equal(mutual.isFollowersPath('/home'), false)
  assert.equal(mutual.constants.FOLLOW_ACTION_DELAY_MS, 2000)
  assert.equal(mutual.constants.FOLLOW_BATCH_SIZE, 15)
  assert.equal(mutual.constants.FOLLOW_BATCH_COOLDOWN_MS, 1800000)
  assert.equal(mutual.constants.FOLLOW_MAX_PER_RUN, 400)
  assert.equal(mutual.constants.FOLLOW_DAILY_LIMIT, 400)
  assert.equal(mutual.constants.RATE_LIMIT_COOLDOWN_MS, 15 * 60 * 1000)
})

test('a followed-back account is kept when any name or bio fragment contains Chinese', async () => {
  const source = await readFile(new URL('mutual.js', extensionDir), 'utf8')
  const isNonChineseText = source.match(/  function isNonChineseText\(value\) \{[\s\S]*?\n  \}/)?.[0]
  const profileNonChinese = source.match(/  function profileNonChinese\(row, handle\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(isNonChineseText && profileNonChinese)
  const context = vm.createContext({
    textOf: (node) => node.textContent.trim(),
    FOLLOWS_YOU_RE: /(Follows you|关注了你)/i,
  })
  vm.runInContext(`${isNonChineseText}\n${profileNonChinese}\nglobalThis.check = profileNonChinese`, context)
  const row = (fragments) => ({ querySelectorAll: () => fragments.map((textContent) => ({ textContent })) })
  assert.equal(context.check(row(['wang wei', '@wangweiaigg', 'Follows you', 'gpt官方代充', 'https://example.com/very/long/english/link']), '@wangweiaigg'), false)
  assert.equal(context.check(row(['中文名', '@account', 'Follows you', 'English biography']), '@account'), false)
  assert.equal(context.check(row(['wang wei', '@wangweiaigg', 'Follows you gpt官方代充', 'English biography']), '@wangweiaigg'), false)
  assert.equal(context.check(row(['wang wei', '@wangweiaigg', 'Follows you', 'English biography']), '@wangweiaigg'), true)
})

test('follow-back checks a Chinese name or bio before other visible fans', async () => {
  const source = await readFile(new URL('mutual.js', extensionDir), 'utf8')
  const profileHasChinese = source.match(/  function profileHasChinese\(row\) \{[\s\S]*?\n  \}/)?.[0]
  const runWithStorage = source.match(/  async function runWithStorage\(mode, onUpdate\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(profileHasChinese && runWithStorage)
  const profileContext = vm.createContext({ textOf: (node) => node.textContent, FOLLOWS_YOU_RE: /(Follows you|关注了你)/i })
  vm.runInContext(`${profileHasChinese}\nglobalThis.hasChinese = profileHasChinese`, profileContext)
  const row = (...parts) => ({ querySelectorAll: () => parts.map((textContent) => ({ textContent })) })
  assert.equal(profileContext.hasChinese(row('Alice', '中文简介')), true)
  assert.equal(profileContext.hasChinese(row('中文姓名', 'English bio')), true)
  assert.equal(profileContext.hasChinese(row('Alice', 'English bio')), false)

  const picked = []
  const state = { running: false, stopping: false, mode: '', sharedDailyFollowed: 0, seenHandles: new Set(), skippedHandles: new Set(), errors: 0 }
  const candidates = [
    { handle: '@english', candidate: true, hasChineseProfile: false },
    { handle: '@chinese', candidate: true, hasChineseProfile: true },
  ]
  const context = vm.createContext({
    state, isFollowingPage: () => false, isFollowersPage: () => true, targetFollowHandleFromPath: () => '', listReady: () => true,
    loadSharedFollowRate: async () => {}, reset: (mode) => { state.running = true; state.mode = mode },
    emit: () => {}, waitForSharedCooldown: async () => true, rateLimitVisible: () => false, automationWarningVisible: () => false,
    visibleRows: () => candidates, actFollowBack: async (item) => { picked.push(item.handle); state.stopping = true; return true },
    actUnfollow: async () => true, actTargetFollow: async () => true, reportMutualAction: () => {},
    waitForPlatformRateLimit: async () => true, persistSharedFollowRate: async () => {}, sleepActive: async () => {},
    FOLLOW_DAILY_LIMIT: 400, FOLLOW_BATCH_SIZE: 15, FOLLOW_BATCH_COOLDOWN_MS: 1800000,
    FOLLOW_ACTION_DELAY_MS: 2000, MAX_STALLED_SCROLLS: 4,
  })
  vm.runInContext(`${runWithStorage}\nglobalThis.runTest = runWithStorage`, context)
  assert.equal(await context.runTest('followBack', () => {}), true)
  assert.deepEqual(picked, ['@chinese'])
})

test('unfollow waits two seconds and rescans after reaching the bottom without applying the shared follow quota', async () => {
  const source = await readFile(new URL('mutual.js', extensionDir), 'utf8')
  const runWithStorage = source.match(/  async function runWithStorage\(mode, onUpdate\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(runWithStorage)
  const waits = []
  let clock = 1000
  let scrollsToTop = 0
  let storageReads = 0
  const candidates = [
    { handle: '@person1', candidate: true, followsYou: false },
    { handle: '@person2', candidate: true, followsYou: false },
  ]
  const state = {
    running: false, stopping: false, mode: '', unfollowed: 0,
    sharedDailyFollowed: 400, sharedBatchProgress: 15,
    skipped: 0, errors: 0, cooldownUntil: 1,
    seenHandles: new Set(), skippedHandles: new Set(),
  }
  const context = vm.createContext({
    state, isFollowingPage: () => true, isFollowersPage: () => false, listReady: () => true,
    targetFollowHandleFromPath: () => '', targetPath: () => '',
    loadSharedFollowRate: async () => { storageReads += 1 },
    reset: (mode) => { state.running = true; state.mode = mode },
    emit: () => {}, waitForSharedCooldown: async () => true,
    rateLimitVisible: () => false, automationWarningVisible: () => false, visibleRows: () => candidates,
    actUnfollow: async () => { state.unfollowed += 1; if (state.unfollowed === 3) state.stopping = true; return true },
    actFollowBack: async () => true, actTargetFollow: async () => true,
    reportMutualAction: () => {}, waitForPlatformRateLimit: async () => true,
    persistSharedFollowRate: async () => {},
    sleepActive: async (ms) => { waits.push(ms); if (ms === 1000) clock += 30 * 60 * 1000 },
    scrollForward: async () => ({ progressed: false, atBottom: true }),
    window: { scrollTo: () => { scrollsToTop += 1 } },
    Date: { now: () => clock },
    formatClock: () => '30:00',
    FOLLOW_DAILY_LIMIT: 400, FOLLOW_MAX_PER_RUN: 400,
    FOLLOW_BATCH_SIZE: 15, FOLLOW_BATCH_COOLDOWN_MS: 1800000,
    FOLLOW_ACTION_DELAY_MS: 2000, MAX_STALLED_SCROLLS: 4, RESCAN_INTERVAL_MS: 30 * 60 * 1000,
    SCROLL_DELAY_MS: 450,
  })
  vm.runInContext(`${runWithStorage}\nglobalThis.runTest = runWithStorage`, context)
  assert.equal(await context.runTest('unfollow', () => {}), true)
  assert.deepEqual(waits, [2000, 2000, 1000, 450])
  assert.equal(storageReads, 1)
  assert.equal(state.unfollowed, 3)
  assert.equal(scrollsToTop, 1)
  assert.equal(state.cooldownUntil, 0)
})

test('mutual platform limit shows a countdown and can be stopped during cooldown', async () => {
  const source = await readFile(new URL('mutual.js', extensionDir), 'utf8')
  const waitForPlatformRateLimit = source.match(/  async function waitForPlatformRateLimit\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(waitForPlatformRateLimit)
  const state = { stopping: false, cooldownUntil: 0, acknowledgedRateLimits: new Set() }
  const statuses = []
  const context = vm.createContext({
    state, Date: { now: () => 1000 }, RATE_LIMIT_COOLDOWN_MS: 15 * 60 * 1000,
    rateLimitNodes: () => [], formatClock: () => '15:00',
    emit: (status) => { if (status) statuses.push(status) },
    sleepActive: async (ms) => { assert.equal(ms, 1000); state.stopping = true },
  })
  vm.runInContext(`${waitForPlatformRateLimit}\nglobalThis.waitTest = waitForPlatformRateLimit`, context)
  assert.equal(await context.waitTest(), false)
  assert.equal(state.cooldownUntil, 1000 + 15 * 60 * 1000)
  assert.match(statuses[0], /15:00 后继续/)
})

test('loads one shared follow quota for unfollow, follow-back, and target-follow modes', async () => {
  const now = new Date()
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
  globalThis.chrome = {
    storage: {
      local: {
        get: async () => ({
          xrcTargetFollowDaily: { date: today, count: 23, batchProgress: 8, cooldownUntil: 0 },
        }),
        set: async () => {},
      },
    },
  }
  try {
    const snapshot = await mutual.refreshSharedFollowRate()
    assert.equal(snapshot.sharedDailyFollowed, 23)
    assert.equal(snapshot.sharedBatchProgress, 8)
  } finally {
    delete globalThis.chrome
  }
})

test('invalidated follow storage keeps the last quota and stops the task without an unhandled rejection', async () => {
  const now = new Date()
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
  globalThis.window = { location: { pathname: '/tuaran/following' } }
  globalThis.chrome = {
    runtime: { id: 'test-extension' },
    storage: { local: {
      async get() { return { xrcTargetFollowDaily: { date: today, count: 23, batchProgress: 8, cooldownUntil: 0 } } },
      async set() {},
    } },
  }
  try {
    assert.equal((await mutual.refreshSharedFollowRate()).sharedDailyFollowed, 23)
    globalThis.chrome.runtime.id = undefined
    const stale = await mutual.refreshSharedFollowRate()
    assert.equal(stale.sharedDailyFollowed, 23)
    assert.match(stale.status, /刷新此 X 页面/)
    const result = await mutual.run('unfollow', () => {})
    assert.match(result.error, /刷新此 X 页面/)
    assert.equal(mutual.snapshot().running, false)
  } finally {
    delete globalThis.chrome
    delete globalThis.window
  }
})

test('follow task stops if its shared quota cannot be saved', async () => {
  const now = new Date()
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
  let writes = 0
  globalThis.window = { location: { pathname: '/tuaran/following' } }
  globalThis.chrome = {
    runtime: { id: 'test-extension' },
    storage: { local: {
      async get() { return { xrcTargetFollowDaily: { date: today, count: 23, batchProgress: 15, cooldownUntil: 0 } } },
      async set() { writes += 1; throw new Error('storage failed') },
    } },
  }
  try {
    const result = await mutual.run('unfollow', () => {})
    assert.equal(writes, 1)
    assert.match(result.error, /关注记录无法保存/)
    assert.equal(mutual.snapshot().running, false)
    assert.equal(mutual.snapshot().sharedDailyFollowed, 23)
  } finally {
    delete globalThis.chrome
    delete globalThis.window
  }
})

test('matches a saved phrase after X collapses spaces or inserts invisible characters', () => {
  const phrases = require('../../tools/x-reply-clipboard-extension/phrases.js')
  assert.equal(loop.normalizePhraseText(' 🧇.  .🧇\u200b '), '🧇..🧇')
  assert.equal(loop.phraseIndexFromText(phrases, '手写内容'), -1)
  assert.equal(loop.repeatedPhraseIndexFromText(phrases, '稳稳'), phrases.indexOf('稳'))
  assert.equal(loop.repeatedPhraseIndexFromText(phrases, '手写内容'), -1)
  assert.equal(loop.placeholderMixedPhraseIndexFromText(phrases, '稳st your reply'), phrases.indexOf('稳'))
  assert.equal(loop.placeholderMixedPhraseIndexFromText(phrases, '手写内容'), -1)
})

test('picks a different phrase index and never repeats the current one', () => {
  assert.equal(loop.nextPhraseIndex(1, 0, () => 0), 0)
  assert.equal(loop.nextPhraseIndex(55, 0, () => 0), 1)
  assert.equal(loop.nextPhraseIndex(55, 10, () => 10), 11)
  assert.equal(loop.nextPhraseIndex(55, 54, () => 53), 53)
  assert.equal(loop.nextPhraseIndex(55, 54, () => 0), 0)
  const phrases = require('../../tools/x-reply-clipboard-extension/phrases.js')
  assert.equal(phrases.length, 100)
  assert.equal(phrases[0], '原来是这样，这下前因后果就说得通了。')
  assert.equal(new Set(phrases).size, 100)
  assert.ok(phrases.every((phrase) => phrase.trim()))
  assert.ok(phrases.every((phrase) => phrase.length >= 10))
  assert.ok(phrases.includes('正解，我感觉这个没毛病。'))
  assert.ok(phrases.includes('不错😌谢谢老铁的分享～'))
  const emojiPhrases = phrases.filter((phrase) => /\p{Extended_Pictographic}/u.test(phrase))
  assert.ok(emojiPhrases.length >= 30 && emojiPhrases.length <= 45)
  assert.ok(emojiPhrases.every((phrase) => /[\p{Script=Han}A-Za-z]/u.test(phrase)))
})

test('content script keeps the randomized reply loop wired to the reply popup', async () => {
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  const mutualSource = await readFile(new URL('mutual.js', extensionDir), 'utf8')
  const posterSource = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const backgroundSource = await readFile(new URL('background.js', extensionDir), 'utf8')
  const posterFixture = await readFile(new URL('fixtures/poster.html', extensionDir), 'utf8')
  const timerSource = await readFile(new URL('timer.js', extensionDir), 'utf8')
  const offscreenSource = await readFile(new URL('offscreen.js', extensionDir), 'utf8')
  const timerWorkerSource = await readFile(new URL('timer-worker.js', extensionDir), 'utf8')
  const manifest = JSON.parse(await readFile(new URL('manifest.json', extensionDir), 'utf8'))
  const catalog = await readFile(new URL('../../lib/content/resourceCatalog.js', import.meta.url), 'utf8')
  const registry = await readFile(new URL('../../lib/content/contentRegistry.js', import.meta.url), 'utf8')
  const toolItems = await readFile(new URL('../../lib/site/toolItems.js', import.meta.url), 'utf8')
  const nextConfig = await readFile(new URL('../../next.config.js', import.meta.url), 'utf8')
  const resourcePage = await readFile(
    new URL('../../app/(site)/resources/x-reply-clipboard-extension/page.jsx', import.meta.url),
    'utf8',
  )
  const downloadButton = await readFile(
    new URL('../../app/(site)/resources/x-reply-clipboard-extension/ExtensionDownloadButton.jsx', import.meta.url),
    'utf8',
  )

  assert.equal(manifest.manifest_version, 3)
  assert.equal(manifest.name, 'X Interaction Assistant')
  assert.equal(manifest.version, '3.32.20')
  assert.ok(manifest.host_permissions.includes('https://x.com/*'))
  assert.ok(manifest.host_permissions.includes('https://twitter.com/*'))
  assert.ok(manifest.host_permissions.includes('https://api.deepseek.com/*'))
  assert.ok(manifest.host_permissions.includes('https://api.b.ai/*'))
  assert.equal(manifest.content_scripts[0].world, 'MAIN')
  assert.deepEqual(manifest.content_scripts[0].js, ['draftFill.js'])
  assert.deepEqual(manifest.content_scripts[1].js, ['context.js'])
  assert.deepEqual(manifest.content_scripts[2].js, ['receipt.js', 'phrases.js', 'loop.js', 'timer.js', 'poster.js', 'mutual.js', 'tweetPdf.js', 'autoLike.js', 'content.js'])
  assert.deepEqual(manifest.permissions, ['storage', 'offscreen', 'alarms'])
  assert.ok(manifest.host_permissions.includes('https://2aran.com/*'))
  assert.ok(manifest.host_permissions.includes('https://aihot.news/*'))
  assert.ok(manifest.host_permissions.includes('https://www.toutiao.com/*'))
  assert.ok(manifest.host_permissions.includes('https://www.zhihu.com/*'))
  assert.equal(manifest.background.service_worker, 'background.js')
  assert.match(nextConfig, /source: '\/resources\/x-mutual-cleaner-extension',[\s\S]*?destination: '\/resources\/x-reply-clipboard-extension'/)
  assert.doesNotMatch(toolItems, /sourcePath: 'tools\/x-(?:mutual-cleaner|tweet-to-pdf)-extension'/)
  assert.match(catalog, /resourceKey: 'resource:x-tweet-to-pdf-extension',[\s\S]*?legacy: true/)
  assert.match(catalog, /resourceKey: 'resource:x-mutual-cleaner-extension',[\s\S]*?legacy: true/)
  assert.match(backgroundSource, /xrc-tweet-pdf-open/)
  assert.match(backgroundSource, /RUNTIME_REPORT_MODES = Object\.freeze\(\[[\s\S]*?"timeline"[\s\S]*?"poster"\s*\]\)/)
  assert.match(backgroundSource, /phase: "idle"/)
  assert.match(backgroundSource, /phase = "unknown"/)
  const printHtml = await readFile(new URL('pdf/print.html', extensionDir), 'utf8')
  await Promise.all(['pdf/print.js', 'pdf/print.css'].map((path) => readFile(new URL(path, extensionDir), 'utf8')))
  assert.match(printHtml, /print\.js/)
  assert.match(backgroundSource, /xrc-task-open/)
  assert.match(backgroundSource, /xrc-task-register/)
  assert.match(backgroundSource, /chrome\.windows\.create/)
  assert.match(backgroundSource, /chrome\.tabs\.update/)
  assert.match(backgroundSource, /chrome\.storage\.session/)
  assert.match(backgroundSource, /chrome\.tabs\.sendMessage\(tabId, payload/)
  assert.match(backgroundSource, /scheduleBackgroundTimer\(message, sender\)/)
  assert.match(backgroundSource, /xrc-runtime-task-state/)
  assert.match(backgroundSource, /xrcPluginRuntime/)
  assert.match(timerSource, /xrc-timer-schedule/)
  assert.match(timerSource, /xrc-timer-fired/)
  assert.match(offscreenSource, /new Worker\(chrome\.runtime\.getURL\("timer-worker\.js"\)\)/)
  assert.match(offscreenSource, /tabId/)
  assert.match(timerWorkerSource, /setTimeout/)
  assert.match(timerWorkerSource, /tabId/)
  assert.match(posterSource, /tweetButtonInline/)
  assert.match(posterSource, /tweetTextarea_0/)
  assert.doesNotMatch(posterSource, /xrc-ai-post-generate/)
  assert.match(posterSource, /xrc-ai-news-rewrite/)
  assert.doesNotMatch(posterSource, /collectSourcePosts|sourceProfilePath/)
  assert.match(posterSource, /已取得\$\{sourceLabel\(item\.source\)\}素材，正在改写第/)
  assert.match(posterSource, /xrcPosterPublishList/)
  assert.match(posterSource, /列表发完前不会重新抓取/)
  assert.doesNotMatch(posterSource, /if \(!arrived\) state\.stopping = true/)
  assert.match(posterSource, /if \(!saved\?\.running\) return false/)
  assert.equal(poster.shouldCollect(0), true)
  assert.equal(poster.shouldCollect(3), false)
  assert.match(posterSource, /MIN_INTERVAL_MS = 25 \* 60 \* 1000/)
  assert.match(posterSource, /MAX_INTERVAL_MS = 35 \* 60 \* 1000/)
  assert.match(posterSource, /RETRY_INTERVAL_MS = 60 \* 1000/)
  assert.match(posterSource, /depth < 30/)
  assert.match(posterSource, /visibleSubmits/)
  assert.match(posterSource, /上次异常：\$\{state\.lastError\}/)
  assert.match(posterSource, /正在重试待发列表中的这一条/)
  assert.match(posterSource, /发帖框有未发送内容，请手动处理/)
  assert.ok(posterSource.indexOf('const queued = editorText') < posterSource.indexOf('state.nextPostAt > Date.now()'))
  assert.ok(posterSource.indexOf('首页已打开，等待发帖框和 Post 按钮加载') < posterSource.indexOf('const queued = editorText'))
  assert.match(posterSource, /await waitForHomeComposer\(30000\)/)
  assert.doesNotMatch(posterSource, /为避免覆盖已暂停/)
  assert.match(posterSource, /state\.elapsedMs = state\.startedAt/)
  assert.match(posterFixture, /tweetButtonInline/)
  assert.match(posterFixture, /PASS poster sent=1/)
  assert.match(content, /data-testid="reply"/)
  assert.match(content, /tweetTextarea_/)
  assert.match(content, /contenteditable=\"true\"/)
  assert.match(content, /tweetButton/)
  assert.match(content, /location\.reload/)
  assert.match(content, /x-reply-clipboard-draft-v2/)
  assert.match(content, /nextPhraseIndex/)
  assert.match(content, /XReplyClipboardPhrases/)
  assert.doesNotMatch(content, /剪贴板是空的/)
  assert.doesNotMatch(content, /clipboard\.readText/)
  assert.doesNotMatch(content, /execCommand\("insertText"/)
  assert.match(content, /BATCH_SIZE/)
  assert.match(content, /seen === phrase/)
  assert.match(content, /SUBMIT_TIMEOUT_MS = 5000/)
  assert.match(content, /SEND_CONFIRM_TIMEOUT_MS = 5000/)
  assert.match(content, /ROUNDS_PER_RUN/)
  assert.match(content, /completedRounds/)
  assert.match(content, /processedIds: Array\.from\(processedIds\)/)
  assert.match(content, /result === "sent-composer-open" && !await closeReplyComposer\(\{ confirmedSent: true \}\)/)
  assert.match(content, /send-unconfirmed/)
  assert.match(content, /稍后重试同一条/)
  assert.match(content, /Your \(\?:post\|reply\) was sent/)
  assert.match(content, /currentAccountHandle/)
  assert.match(content, /tweet\.authorHandle !== ownHandle/)
  assert.doesNotMatch(content, /processedIds\.add\(next\.id\);\s*advancePhrase\(\);\s*writeSaved/)
  assert.doesNotMatch(content, /clickMatchingButton/)
  assert.doesNotMatch(content, /saveAndDismissComposer/)
  assert.doesNotMatch(content, /closeConfirmedComposer/)
  assert.match(content, /confirmedSent[\s\S]*?app-bar-close/)
  assert.doesNotMatch(content, /\bDiscard\b/)
  assert.match(content, /sent-composer-open/)
  assert.match(content, /phraseIndexFromText\(phrases, existingText\)/)
  assert.match(content, /repeatedPhraseIndexFromText\(phrases, existingText\)/)
  assert.match(content, /placeholderMixedPhraseIndexFromText\(phrases, existingText\)/)
  assert.match(content, /if \(!existingText\) return publishReply\(existingComposer, replyText\)/)
  assert.match(content, /getManifest/)
  assert.match(content, /X高频互动助手/)
  assert.match(content, /全流程启动/)
  assert.match(content, /xrc-flow-start/)
  assert.match(content, /taskWindowLabel/)
  assert.match(content, /stripManagedTaskTitle/)
  assert.match(content, /@\$\{handle\} · \$\{label\}/)
  assert.match(content, /X高频互动助手 · @\$\{handle\}/)
  assert.match(content, /当前已在\$\{label\}页面，任务尚未启动；点击下方启动单项任务/)
  assert.match(content, /document\.title/)
  assert.match(backgroundSource, /replace\(\/\^@\[A-Za-z0-9_\]\{1,40\} · \/u, ""\)/)
  assert.match(content, /data-xrc-global-bar/)
  assert.match(content, /data-xrc-global-key/)
  assert.ok(content.indexOf('class="xrc-global-bar"') < content.indexOf('class="xrc-flow-launch"'))
  assert.doesNotMatch(content, /xrc-global-paces/)
  assert.match(content, /xrc-round-pace/)
  assert.match(content, /xrc-speed-section/)
  assert.match(content, /data-xrc-flow-help/)
  assert.match(content, /启动单项任务/)
  assert.match(content, /data-xrc-assistant="mutual"/)
  assert.match(content, /data-xrc-assistant="reply"/)
  assert.match(content, /data-xrc-assistant="likes"/)
  assert.match(content, /data-xrc-reply-tab="timeline"/)
  assert.match(content, /data-xrc-reply-tab="notifications"/)
  assert.match(content, /data-xrc-like-tab="posts"/)
  assert.match(content, /data-xrc-like-tab="replies"/)
  assert.match(content, /data-xrc-actions-toggle aria-label="展开操作菜单"/)
  const todaySummary = content.match(/<div class="xrc-today-strip"[^>]*>([\s\S]*?)<\/div>\s*<section class="xrc-monitor"/)?.[1] || ''
  for (const metric of ['comments', 'likes', 'follows', 'unfollows', 'posts']) {
    assert.ok(todaySummary.includes(`data-xrc-today-${metric}`), `today summary should show ${metric}`)
  }
  assert.match(todaySummary, /xrc-metric-follows">关注<\/span><span class="xrc-metric-unfollows">取关<\/span>/)
  const todayCss = await readFile(new URL('content.css', extensionDir), 'utf8')
  assert.match(todayCss, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/)
  assert.match(todayCss, /calc\(20% - \.5px\).*calc\(40% - \.5px\).*calc\(60% - \.5px\).*calc\(80% - \.5px\)/s)
  assert.doesNotMatch(todayCss, /xrc-today-strip::after[\s\S]*calc\(25%/)
  assert.ok(content.indexOf('class="xrc-header-menu"') < content.indexOf('class="xrc-today-strip"'))
  assert.match(content, /if \(panel\) \{\s*renderTodaySummary\(panel\)/)
  const quickActions = content.match(/<div class="xrc-quick-actions"[^>]*>([\s\S]*?)<\/div>/)?.[1] || ''
  const header = content.match(/<div class="xrc-header">([\s\S]*?)<div class="xrc-header-menu"/)?.[1] || ''
  assert.ok(header.includes('class="xrc-quick-actions"'))
  assert.ok(header.indexOf('class="xrc-quick-actions"') < header.indexOf('data-xrc-actions-toggle'))
  for (const action of ['data-xrc-docs-open', 'data-xrc-collapse', 'data-xrc-expand', 'class="xrc-close"']) {
    assert.ok(quickActions.includes(action), `${action} should remain visible outside the menu`)
  }
  assert.match(content, /data-xrc-monitor-open aria-expanded="false">异常监控/)
  assert.match(content, /data-xrc-report-page hidden aria-label="每日报告"/)
  assert.match(content, /data-xrc-monitor-current/)
  assert.match(content, /function syncMonitorMenu\(panel\)/)
  assert.match(content, /任务状态、风控倒计时及各项恢复规则，以站点文档中心为准/)
  assert.match(content, /功能导航/)
  assert.doesNotMatch(content, /当前助手/)
  assert.match(content, /通知回复/)
  assert.match(content, /关注管理/)
  assert.match(content, /定时发帖/)
  assert.match(content, /data-xrc-post-pace/)
  assert.match(content, /selectPosterPace/)
  assert.match(posterSource, /randomIntervalMs\(Math\.random, state\.schedulePace\)/)
  assert.match(content, /loopApi\.randomCycleDelayMs\(Math\.random, state\.schedulePace(?:, state\.boundaryLevel)?\)/)
  assert.match(content, /边界测试本轮稳定，升到第/)
  assert.match(content, /边界测试在 .* 条后发现限制，降到第/)
  assert.match(content, /data-xrc-boundary-info aria-label="查看边界测试说明和限制监测"/)
  assert.match(content, /querySelector\("\[data-xrc-boundary-info\]"\)\?\.addEventListener\("click"/)
  assert.match(content, /data-xrc-boundary-info[\s\S]*?data-xrc-monitor-open/) 
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  assert.match(css, /xrc-round-pace \.xrc-pace-options button[\s\S]*?border-radius: 50%/)
  assert.match(content, /NOTIFICATION_CYCLE_DELAY_MS = 10 \* 60 \* 1000/)
  assert.match(content, /RECONNECT_INITIAL_MS = 2000/)
  assert.match(content, /RECONNECT_MAX_MS = 30000/)
  assert.match(content, /window\.addEventListener\("online"/)
  assert.match(content, /fetch\(`\$\{window\.location\.origin\}\/robots\.txt/)
  assert.match(content, /if \(result === "transient-error"\) \{[\s\S]*?skipTransientReply\(next\)/)
  assert.match(content, /if \(draft && !isManagedDraft\(draft\)\) return false/)
  assert.match(content, /finishCycleAndScheduleNext/)
  assert.match(content, /reconnectAndResume/)
  assert.match(content, /data-xrc-stable-runtime/)
  assert.match(content, /xrc-runtime-task-state/)
  assert.match(content, /cycleCount/)
  assert.match(content, /nextCycleAt/)
  assert.match(content, /xrc-task-open/)
  assert.match(content, /xrc-task-register/)
  assert.match(content, /conversation = await conversationOrFallback\(next, postText\)/)
  assert.match(content, /ownPost: null,\s*reply: \{ id: tweet\.id, authorHandle: tweet\.authorHandle, text: replyText \}/)
  assert.match(content, /requestedLaunch/)
  assert.match(content, /每项使用独立窗口/)
  assert.doesNotMatch(content, /class="xrc-phrase-row"/)
  assert.match(content, /class="xrc-status xrc-reply-status"/)
  assert.doesNotMatch(content, /data-xrc-reply-start-now/)
  assert.doesNotMatch(content, /data-xrc-post-start-now/)
  assert.match(content, /function canStartReplyNow\(now = Date\.now\(\)\)/)
  assert.match(content, /if \(state\.running && canStartReplyNow\(\)\) startReplyNow\(\)/)
  assert.doesNotMatch(content.match(/function canStartReplyNow\([\s\S]*?\n  \}/)?.[0] || '', /riskRoundAdvancing/)
  assert.match(content, /wakeScheduledWait\?\.\(\)/)
  assert.doesNotMatch(content, /当前 AI 回复/)
  assert.doesNotMatch(content, /读取原帖后自动生成/)
  assert.ok(content.indexOf('data-xrc-assistant="reply"') < content.indexOf('data-xrc-assistant="likes"'))
  assert.ok(content.indexOf('data-xrc-assistant="likes"') < content.indexOf('data-xrc-assistant="mutual"'))
  assert.match(content, /NOTIFICATION_HISTORY_KEY = "xrcNotificationProcessedIds"/)
  assert.match(content, /最近 2 小时/)
  assert.match(content, /state\.assistantMode !== "notifications"/)
  assert.match(content, /persistNotificationProcessed\(next\.id\)/)
  assert.doesNotMatch(content, /document\.hidden|visibilitychange|waitForForeground/)
  assert.doesNotMatch(mutualSource, /document\.hidden|visibilitychange|waitForForeground/)
  assert.match(content, /isNotificationReplyText/)
  assert.doesNotMatch(content, /likeNotificationReply|notificationLikeOnly|likedOnlyIds|先把剩下的赞点完/)
  assert.match(content, /data-xrc-mutual-action="unfollow"/)
  assert.match(content, /data-xrc-mutual-action="followBack"/)
  assert.doesNotMatch(content, /data-xrc-mutual-action="targetFollow"/)
  assert.match(content, /data-xrc-mutual-tab="unfollow"/)
  assert.match(content, /data-xrc-mutual-tab="followBack"/)
  assert.doesNotMatch(content, /data-xrc-mutual-tab="targetFollow"/)
  assert.match(content, /关注候选暂时停用|该功能暂时停用/)
  assert.match(content, /xrc-task-pending-remember/)
  assert.match(content, /state\.assistantMode === "poster" && await postApi\?\.resumeIfPending/)
  assert.match(content, /function selectMutualMode/)
  assert.match(content, /function selectMutualMode\(mode\)\s*\{\s*return openTaskTab\(mutualTaskKey\(mode\)\)/)
  assert.match(content, /button\.title = taskTabHint\(mutualTaskKey\(button\.dataset\.xrcMutualTab\)\)/)
  assert.doesNotMatch(content, /button\.disabled = anyTaskRunning\(\)/)
  assert.match(content, /mutualMode/)
  assert.match(content, /button\.disabled = false;\s*button\.title = taskTabHint/)
  assert.match(content, /mutualApi\.run/)
  assert.match(content, /result !== "sent-composer-open"/)
  assert.match(content, /data-xrc-round-track/)
  assert.match(content, /data-xrc-round-segment/)
  assert.match(content, /data-xrc-page-meta/)
  assert.match(content, /class="xrc-round-pace xrc-pace-row"/)
  assert.doesNotMatch(content, /class="xrc-phrase-pool"/)
  assert.doesNotMatch(content, /data-xrc-mode="template"/)
  assert.match(content, /aria-selected/)
  assert.match(content, /data-xrc-runtime/)
  assert.match(content, /randomReplyDelaySeconds\(Math\.random, state\.schedulePace(?:, state\.boundaryLevel)?\)/)
  assert.match(content, /DEFAULT_ROUND_INTERVAL_SECONDS = 5/)
  assert.match(content, /每条间隔/)
  assert.match(content, /data-xrc-wait/)
  assert.doesNotMatch(content, /data-xrc-post-wait/)
  assert.match(content, /data-xrc-reply-prompt/)
  assert.match(content, /data-xrc-post-prompt/)
  assert.doesNotMatch(content, /data-xrc-config-save/)
  assert.match(content, /scheduleConfigSave\(panel/)
  assert.doesNotMatch(content, /<strong>当前内容<\/strong>/)
  assert.doesNotMatch(content, /data-xrc-post-preview/)
  assert.doesNotMatch(content, /REPLY_DAILY_LIMIT|xrcReplyDailyQuota|xrc-reply-quota|额度已用完/)
  assert.doesNotMatch(backgroundSource, /REPLY_DAILY_LIMIT|xrcReplyDailyQuota|xrc-reply-quota/)
  assert.match(content, /class="xrc-round-pace xrc-pace-row"/)
  assert.match(content, /data-xrc-collapse/)
  assert.match(content, /data-xrc-expand/)
  assert.match(content, /data-xrc-mini-progress/)
  assert.match(content, /data-xrc-start/)
  assert.match(content, /data-xrc-config-key/)
  assert.match(content, /panelView/)
  assert.match(content, /本轮已完成/)
  assert.match(content, /replyMode: "ai"/)
  assert.match(content, /function validReplyMode\(\) \{\s*return "ai";/)
  assert.doesNotMatch(content, /data-xrc-mode="ai"/)
  assert.match(content, /data-xrc-ai-key/)
  assert.doesNotMatch(content, /type="password"/)
  assert.match(content, /data-xrc-secret-input/)
  assert.match(content, /data-1p-ignore="true"/)
  assert.match(content, /不要填写 X 登录密码/)
  assert.match(content, /xrc-ai-generate/)
  assert.doesNotMatch(content, /connectionVerified|测试连接|xrc-ai-test|data-xrc-ai-test/)
  assert.match(content, /data-xrc-ai-key/)
  assert.doesNotMatch(content, /state\.replyMode === "ai" && !state\.aiKeySaved/)
  assert.doesNotMatch(content, /AI 模式需要先通过连接测试/)
  assert.match(content, /不会发送 X 登录 Cookie/)
  assert.match(content, /tweetText/)
  assert.match(content, /pendingReply/)
  assert.match(content, /function waitRateLimit/)
  assert.match(content, /nextReplyDelaySeconds/)
  assert.match(content, /roundIntervalSeconds/)
  assert.match(content, /第 \$\{shownRound\} 轮/)
  assert.doesNotMatch(content, /本次执行/)
  assert.match(content, /function formatRuntime/)
  assert.match(content, /startedAt/)
  assert.match(content, /function centerPhraseItem/)
  assert.match(content, /list\.scrollTo\(\{ top: 0, behavior \}\)/)
  assert.doesNotMatch(content, /等待发送确认/)
  assert.match(content, /PHRASE_STORE = 7/)
  assert.match(content, /data-xrc-pace/)
  assert.match(content, /重启任务/)
  assert.match(content, /运行中不能改频率/)
  assert.match(content, /慢、中、快、超快/)
  assert.match(catalog, /x-reply-clipboard-extension-v3\.32\.0\.zip/)
  assert.match(resourcePage, /const VERSION = '3\.32\.0'/)
  assert.match(resourcePage, /X高频互动助手/)
  assert.match(resourcePage, /互关浇友/)
  assert.match(resourcePage, /通知回复/)
  assert.match(resourcePage, /const VERSION_HISTORY = \[/)
  assert.match(resourcePage, /version: '3\.5\.0'/)
  assert.match(resourcePage, /version: '3\.6\.0'/)
  assert.match(resourcePage, /version: '3\.6\.1'/)
  assert.match(resourcePage, /version: '3\.6\.2'/)
  assert.match(resourcePage, /version: '3\.6\.3'/)
  assert.match(resourcePage, /version: '3\.6\.4'/)
  assert.match(resourcePage, /version: '3\.6\.5'/)
  assert.match(resourcePage, /version: '3\.6\.6'/)
  assert.match(resourcePage, /version: '3\.6\.7'/)
  assert.match(resourcePage, /version: '3\.6\.8'/)
  assert.match(resourcePage, /version: '3\.6\.9'/)
  assert.match(resourcePage, /version: '3\.6\.10'/)
  assert.match(resourcePage, /version: '3\.6\.11'/)
  const riskMatcher = content.match(/const AUTOMATION_WARNING_RE = ([^\n]+)/)?.[1] || ''
  const transientMatcher = content.match(/const TRANSIENT_ERROR_RE = ([^\n]+)/)?.[1] || ''
  assert.doesNotMatch(riskMatcher, /Something went wrong/)
  assert.match(transientMatcher, /Something went wrong/)
  assert.match(content, /本轮已结束，下一轮/)
  assert.doesNotMatch(content, /评论过于频繁，时间线和通知回复已停止/)
  assert.doesNotMatch(backgroundSource, /xrc-risk-stop-all/)
  assert.match(content, /暂停全部任务/)
  assert.match(content, /data-xrc-config-open/)
  assert.match(content, /data-xrc-embed/)
  assert.match(content, /xrcPanelPlacement/)
  assert.match(content, /panelPlacement: "float"/)
  assert.match(content, /xrc-assistant-tabs/)
  assert.doesNotMatch(content, /xrc-tab-index/)
  assert.match(resourcePage, /右侧搜索框下方/)
  assert.match(content, /data-xrc-docs-open/)
  assert.match(content, /DOCS_BASE_URL = "https:\/\/2aran\.com\/resources\/x-reply-clipboard-extension\/docs"/)
  assert.match(content, /AUTOMATION_WARNING_RE/)
  assert.match(content, /DUPLICATE_REPLY_RE/)
  assert.match(content, /result === "duplicate-reply"/)
  assert.match(content, /forceDraft: true/)
  assert.match(content, /本轮提前结束/)
  assert.match(content, /applyRiskStop\(\)/)
  assert.match(content, /post-unavailable/)
  assert.match(content, /原帖已删除或当前账号看不到，已跳过/)
  assert.match(content, /trying to reply to has been deleted or is not visible/)
  assert.match(content, /openMutualWindows/)
  assert.match(content, /mutual-unfollow/)
  assert.match(content, /mutual-followBack/)
  assert.match(content, /mutual-targetFollow/)
  assert.match(mutualSource, /you are rate limited/)
  assert.match(mutualSource, /X 提示操作过密/)
  assert.match(content, /reconnectReason/)
  assert.match(content, /空评论框对不上当前帖子/)
  assert.doesNotMatch(content, /检测到其他评论弹窗/)
  assert.match(content, /nextRoundAt/)
  assert.doesNotMatch(backgroundSource, /xrc-risk-stop-all/)
  assert.match(resourcePage, /version: '3\.1\.2'/)
  assert.match(resourcePage, /version: '3\.1\.1'/)
  assert.match(resourcePage, /version: '3\.1\.0'/)
  assert.match(resourcePage, /version: '3\.0\.0'/)
  assert.match(resourcePage, /version: '2\.0\.0'/)
  assert.match(resourcePage, /version: '0\.2\.1'/)
  assert.match(resourcePage, /当前版本 v\{VERSION\}/)
  assert.match(resourcePage, /<ExtensionDownloadButton href=\{DOWNLOAD_URL\} version=\{VERSION\}/)
  assert.match(downloadButton, /获取密码并下载 v\$\{version\}/)
  assert.match(downloadButton, /INVALID_PASSWORD/)
  assert.match(downloadButton, /method: 'POST'/)
  assert.match(downloadButton, /qrcode-wechat\.jpg/)
  assert.match(downloadButton, /response\.blob\(\)/)
  assert.doesNotMatch(resourcePage, /\/resources\/x-clipboard-phrase/)
  assert.match(registry, /slug: 'x-reply-clipboard-extension', title: 'X高频互动助手'/)
  assert.match(registry, /'通知回复'/)
  assert.match(toolItems, /id: 'x-reply-clipboard',[\s\S]*title: 'X高频互动助手'/)
  assert.doesNotMatch(toolItems, /id: 'x-mutual-cleaner'/)
  assert.doesNotMatch(toolItems, /id: 'x-clipboard-phrase'/)
  assert.doesNotMatch(catalog, /x-clipboard-phrase/)
  assert.match(toolItems, /role: 'Chrome 扩展 · 回复、互关与 AI 定时发推'/)
})

test('documentation center opens the 2aran.com docs route with section hashes', async () => {
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  const backgroundSource = await readFile(new URL('background.js', extensionDir), 'utf8')
  const docsPage = await readFile(new URL('../../app/(site)/resources/x-reply-clipboard-extension/docs/page.jsx', extensionDir), 'utf8')
  const resourcePage = await readFile(new URL('../../app/(site)/resources/x-reply-clipboard-extension/page.jsx', extensionDir), 'utf8')
  assert.match(content, /data-xrc-flow-docs[^>]*>打开站点文档 · 全流程说明/)
  assert.match(content, /DOCS_BASE_URL = "https:\/\/2aran\.com\/resources\/x-reply-clipboard-extension\/docs"/)
  assert.match(content, /window\.open\(`\$\{DOCS_BASE_URL\}\$\{hash\}`, "_blank", "noopener,noreferrer"\)/)
  assert.match(content, /"xrc-docs-flow": "flow"/)
  assert.match(content, /"xrc-docs-risk": "risk"/)
  assert.match(content, /"xrc-docs-mutual-rules": "mutual-rules"/)
  assert.match(content, /data-xrc-docs-target="xrc-docs-risk"/)
  assert.match(content, /data-xrc-docs-target="xrc-docs-mutual-rules"/)
  assert.doesNotMatch(content, /data-xrc-docs hidden/)
  assert.doesNotMatch(content, /data-xrc-docs-close/)
  assert.match(resourcePage, /href=\{`\/resources\/\$\{RESOURCE_SLUG\}\/docs`\}/)
  assert.match(docsPage, /id="flow"/)
  assert.match(docsPage, /id="states"/)
  assert.match(docsPage, /id="risk"/)
  assert.match(docsPage, /id="tasks"/)
  assert.match(docsPage, /id="comments"/)
  assert.match(docsPage, /id="likes"/)
  assert.match(docsPage, /id="mutual-rules"/)
  assert.match(docsPage, /id="poster"/)
  assert.match(docsPage, /id="frequency"/)
  assert.match(docsPage, /id="rules"/)
  assert.match(docsPage, /id="maintenance"/)
  assert.match(docsPage, /id="releases"/)
  assert.match(docsPage, /全流程启动会打开对应窗口/)
  assert.match(docsPage, /顶部页签会打开尚未创建的任务窗口/)
  assert.match(docsPage, /执行中[\s\S]*等待中[\s\S]*停止中[\s\S]*已暂停[\s\S]*未启动[\s\S]*待确认/)
  assert.match(docsPage, /第一次等待 10 分钟，再次受限等待 20 分钟，第三次 30 分钟/)
  assert.match(docsPage, /关注名单提示普通限速：先等 15 分钟/)
  assert.match(docsPage, /扫到列表底部后等 30 分钟再扫描/)
  assert.match(docsPage, /回关粉丝优先处理姓名或简介含汉字的账号/)
  assert.match(docsPage, /回复默认“边界测试”/)
  assert.match(docsPage, /插件不设每日回复总量/)
  assert.match(docsPage, /每日报告随心跳自动同步当日统计/)
  assert.doesNotMatch(docsPage, /同步历史/)
  assert.match(docsPage, /频率与设置/)
  assert.match(docsPage, /平台边界与官方来源/)
  assert.match(docsPage, /不代表 X 认可的安全阈值/)
  assert.match(docsPage, /https:\/\/help\.x\.com\/en\/rules-and-policies\/x-automation/)
  assert.match(docsPage, /version: 'v3\.32\.13'/)
  assert.match(content, /currentTaskDetail|currentTaskWaitUntil/)
  assert.match(backgroundSource, /setCommandHandler|executeRemoteCommand|flow-start/)
  assert.match(backgroundSource, /ext-update/)
  assert.match(backgroundSource, /applyLocalDevUpdate/)
})

test('today totals expose a compact calendar entry and poster stats identify the current run', async () => {
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.match(content, /class="xrc-today-report"[^>]*data-xrc-report-open[^>]*aria-label="打开日历统计"/)
  assert.match(content, /class="xrc-today-head"[\s\S]*class="xrc-today-labels"[\s\S]*class="xrc-today-values"/)
  assert.match(content, /定时发帖 · 本次运行[\s\S]*本次已发送 0 条/)
  assert.match(content, /querySelectorAll\("\[data-xrc-report-open\]"\)/)
})

test('DeepSeek background worker keeps AI replies short and non-thinking', async () => {
  const backgroundText = await readFile(new URL('background.js', extensionDir), 'utf8')
  const background = require('../../tools/x-reply-clipboard-extension/background.js')

  assert.equal(background.DEEPSEEK_MODEL, 'deepseek-flash')
  assert.equal(background.REQUEST_TIMEOUT_MS, 10000)
  assert.equal(background.validTaskMode('poster'), 'poster')
  assert.equal(background.validTaskMode('likes'), 'likes-posts')
  assert.equal(background.validTaskMode('likes-replies'), 'likes-replies')
  assert.equal(background.validTaskMode('mutual'), 'mutual-unfollow')
  assert.equal(background.validTaskMode('mutual-followBack'), 'mutual-followBack')
  assert.equal(background.validTaskMode('unknown'), 'timeline')
  assert.equal(background.taskTabUrl('notifications', 'https://x.com/home'), 'https://x.com/notifications?xrcAssistant=notifications')
  assert.equal(background.taskTabUrl('likes-posts', 'https://x.com/notifications'), 'https://x.com/home?xrcAssistant=likes-posts')
  assert.equal(background.taskTabUrl('likes-replies', 'https://x.com/notifications'), 'https://x.com/home?xrcAssistant=likes-replies')
  assert.match(backgroundText, /const FLOW_TASKS = \[[^\]]+\];/)
  assert.match(backgroundText.match(/const FLOW_TASKS = \[[^\]]+\];/)?.[0] || '', /"likes-posts", "likes-replies"/)
  assert.equal(background.taskTabUrl('mutual-unfollow', 'https://x.com/home'), 'https://x.com/home?xrcAssistant=mutual-unfollow')
  assert.equal(background.taskTabUrl('poster', 'https://twitter.com/home'), 'https://twitter.com/home?xrcAssistant=poster')
  assert.equal(background.taskTabUrl('poster', 'https://x.com/home', { start: true }), 'https://x.com/home?xrcAssistant=poster&xrcStart=1')
  assert.equal(background.taskPageUrl('poster', 'https://x.com/wangchangfu88', { start: true }), 'https://x.com/home')
  assert.equal(background.taskPageUrl('notifications', 'https://x.com/home'), 'https://x.com/notifications')
  assert.equal(background.taskPageUrl('mutual-unfollow', 'https://x.com/home', { start: true, accountHandle: 'Tuaran' }), 'https://x.com/Tuaran/following')
  assert.match(background.taskTabUrl('mutual-targetFollow', 'https://twitter.com/home'), /^https:\/\/twitter.com\/(?:crazypig9y|jianlvup|jianlvya|kyotom08|Chill_Alpha)\/followers\?xrcAssistant=mutual-targetFollow$/)
  assert.equal(background.taskTabUrl('timeline', 'https://x.com/home', { start: true }), 'https://x.com/home?xrcAssistant=timeline&xrcStart=1')
  assert.equal(background.taskTabUrl('mutual-unfollow', 'https://x.com/home', { start: true, accountHandle: '@Tuaran' }), 'https://x.com/Tuaran/following?xrcAssistant=mutual-unfollow&xrcStart=1')
  assert.equal(background.taskTabUrl('mutual-followBack', 'https://x.com/home', { start: true, accountHandle: 'Tuaran' }), 'https://x.com/Tuaran/followers?xrcAssistant=mutual-followBack&xrcStart=1')
  assert.equal(background.taskTabUrl('mutual-unfollow', 'https://x.com/home', { accountHandle: 'Tuaran' }), 'https://x.com/Tuaran/following?xrcAssistant=mutual-unfollow')
  assert.doesNotMatch(background.taskTabUrl('poster', 'https://x.com/home'), /xrcStart=1/)
  assert.match(background.taskTabUrl('mutual-targetFollow', 'https://x.com/home', { start: true }), /^https:\/\/x\.com\/(?:crazypig9y|jianlvup|jianlvya|kyotom08|Chill_Alpha)\/followers\?xrcAssistant=mutual-targetFollow&xrcStart=1$/)
  assert.match(backgroundText, /xrc-flow-start/)
  assert.match(backgroundText, /xrc-flow-pause/)
  assert.match(backgroundText, /phase: "starting"/)
  assert.match(backgroundText, /phase: "stopped"/)
  assert.match(background.REPLY_SYSTEM_PROMPT, /长短按语境决定，短到几个字也可以/)
  assert.equal(background.cleanReply('回复：“这个角度很有意思\n值得继续观察👀”'), '这个角度很有意思 值得继续观察👀')
  assert.match(background.POST_SYSTEM_PROMPT, /35～90 个中文字符/)
  assert.match(background.POST_SYSTEM_PROMPT, /或 \$ 符号/)
  assert.doesNotMatch(background.POST_SYSTEM_PROMPT, /\$代币/)
  assert.equal(background.cleanPost('推文：第一行\n第二行\n\n第三行'), '第一行\n\n第二行\n\n第三行')
  assert.equal(background.cleanPost('听说东北以前一家子睡一个炕。\n$KAITO'), '听说东北以前一家子睡一个炕。')
  assert.match(background.POST_SYSTEM_PROMPT, /2～3 个短段/)
  assert.match(backgroundText, /https:\/\/api\.deepseek\.com\/chat\/completions/)
  assert.match(backgroundText, /thinking: \{ type: "disabled" \}/)
  assert.match(backgroundText, /max_tokens: 96/)
  assert.match(backgroundText, /已被 X 判定为重复/)
  assert.match(backgroundText, /xrc-ai-post-generate/)
  assert.match(backgroundText, /xrc-ai-news-rewrite/)
  assert.doesNotMatch(backgroundText, /xrc-ai-source-rewrite/)
  assert.match(backgroundText, /max_tokens: 160/)
  assert.match(backgroundText, /这次用一两句白话带到 AI 或 Web3/)
  assert.doesNotMatch(backgroundText, /xrc-ai-test|连通测试|test = false/)
  assert.match(backgroundText, /chrome\.storage\.local/)
  assert.match(backgroundText, /settings\.replyPrompt/)
  assert.match(backgroundText, /settings\.postPrompt/)
})

test('task windows are created once and reused without backgrounding another task', async () => {
  const background = require('../../tools/x-reply-clipboard-extension/background.js')
  let savedTabs = {}
  const sessionData = {}
  let created = 0
  const createdUrls = []
  const focusedTabs = []
  const tabUpdates = []
  const focusedWindows = []
  const movedTabs = []
  let notificationsUrl = 'https://x.com/notifications'
  let runtimeTasks = {}
  global.chrome = {
    storage: {
      session: {
        async get(key) {
          if (key === 'xrcTaskTabs') return { [key]: savedTabs }
          return { [key]: sessionData[key] }
        },
        async set(value) {
          if (Object.prototype.hasOwnProperty.call(value, 'xrcTaskTabs')) savedTabs = value.xrcTaskTabs
          Object.assign(sessionData, value)
        },
      },
      local: {
        async get(key) { return key === 'xrcPluginRuntime' ? { [key]: { tasks: runtimeTasks } } : {} },
        async set() {},
      },
    },
    tabs: {
      async get(tabId) {
        if (tabId === 77) return { id: 77, windowId: 9, url: notificationsUrl }
        if (tabId === 11) return { id: 11, windowId: 5, url: 'https://x.com/home' }
        if (tabId === 22) return { id: 22, windowId: 5, url: 'https://x.com/notifications' }
        throw new Error('missing tab')
      },
      async query() { return [{ id: 11, windowId: 5, url: 'https://x.com/home', title: '评论帖子 · Home / X' }] },
      async update(tabId, options) { focusedTabs.push(tabId); tabUpdates.push(options) },
    },
    windows: {
      async create(options) {
        created += 1
        if (options.tabId) {
          movedTabs.push(options.tabId)
          return { id: 30, tabs: [{ id: options.tabId }] }
        }
        createdUrls.push(options.url)
        return { id: 10, tabs: [{ id: 77, windowId: 10, url: options.url }] }
      },
      async update(windowId) { focusedWindows.push(windowId) },
    },
  }
  try {
    const first = await background.focusTaskTab('notifications', { tab: { url: 'https://x.com/home' } })
    const second = await background.focusTaskTab('notifications', { tab: { url: 'https://x.com/home' } })
    assert.equal(first.reused, false)
    assert.equal(first.tabId, 77)
    assert.equal(second.reused, true)
    assert.equal(created, 1)
    assert.deepEqual(createdUrls, ['https://x.com/notifications?xrcAssistant=notifications'])
    assert.deepEqual(focusedTabs, [77])
    assert.deepEqual(focusedWindows, [9])
    assert.equal(savedTabs.notifications, 77)
    assert.deepEqual(tabUpdates[0], { active: true })

    const restarted = await background.focusTaskTab('notifications', { tab: { url: 'https://x.com/home' } }, { start: true })
    assert.equal(restarted.reused, true)
    assert.equal(tabUpdates.at(-1).url, 'https://x.com/notifications?xrcAssistant=notifications&xrcStart=1')
    assert.equal(sessionData['xrcPendingTab:77'].start, true)

    runtimeTasks = { notifications: { tabId: 77, phase: 'running', startedAt: Date.now() } }
    notificationsUrl = 'https://x.com/someone/status/123'
    await background.focusTaskTab('notifications', { tab: { url: 'https://x.com/home' } })
    assert.deepEqual(tabUpdates.at(-1), { active: true })
    runtimeTasks = {}

    savedTabs = {}
    const recovered = await background.focusTaskTab('timeline', { tab: { url: 'https://x.com/home' } }, { start: true })
    assert.equal(recovered.reused, true)
    assert.equal(recovered.tabId, 11)
    assert.equal(savedTabs.timeline, 11)
    assert.equal(created, 1)

    savedTabs = { timeline: 11, notifications: 22 }
    const moved = await background.focusTaskTab('notifications', { tab: { url: 'https://x.com/home' } })
    assert.equal(moved.reused, true)
    assert.deepEqual(movedTabs, [22])
    assert.equal(focusedWindows.at(-1), 30)

    await background.registerTaskTab('timeline', 22)
    assert.equal(savedTabs.timeline, 22)
    assert.equal(savedTabs.notifications, undefined)
  } finally {
    delete global.chrome
  }
})

test('full flow opens both like tasks and pauses them with the other tasks', async () => {
  const session = {}
  const local = {}
  const opened = []
  const stopped = []
  const liveTabs = new Map()
  let nextTabId = 100
  globalThis.chrome = {
    storage: {
      session: {
        async get(key) { return { [key]: session[key] } },
        async set(value) { Object.assign(session, value) },
      },
      local: {
        async get(key) { return { [key]: local[key] } },
        async set(value) { Object.assign(local, value) },
      },
    },
    tabs: {
      async query() { return [] },
      async get(id) {
        if (!liveTabs.has(id)) throw new Error('tab closed')
        return liveTabs.get(id)
      },
      async sendMessage(id, message) { stopped.push({ id, message }) },
    },
    windows: {
      async create({ url }) {
        const id = ++nextTabId
        const tab = { id, windowId: id, url }
        liveTabs.set(id, tab)
        opened.push(url)
        return { id, tabs: [tab] }
      },
    },
  }
  try {
    await background.openAllTasks({ tab: { url: 'https://x.com/home' } }, 'Tuaran')
  assert.equal(opened.length, 7)
    for (const mode of ['likes-posts', 'likes-replies']) {
      assert.ok(opened.includes(`https://x.com/home?xrcAssistant=${mode}&xrcStart=1`))
    }
    const tabs = session.xrcTaskTabs
    local.xrcPluginRuntime = {
      tasks: Object.fromEntries(Object.entries(tabs).map(([mode, tabId]) => [mode, { tabId, phase: 'running' }])),
      flow: { phase: 'running' },
    }
    await background.pauseAllTasks()
    assert.equal(stopped.length, 7)
    assert.equal(local.xrcPluginRuntime.flow.phase, 'paused')
    assert.deepEqual(local.xrcPluginRuntime.tasks, {})
    await background.updatePluginRuntime({ mode: 'poster', active: true, phase: 'running' }, { tab: { id: tabs.poster } })
    assert.equal(local.xrcPluginRuntime.flow.phase, 'paused')
    assert.deepEqual(local.xrcPluginRuntime.tasks, {})
    local.xrcPluginRuntime.flow = { phase: 'paused', updatedAt: Date.now() - 30000 }
    await background.updatePluginRuntime({ mode: 'poster', active: true, phase: 'running' }, { tab: { id: tabs.poster } })
    assert.equal(local.xrcPluginRuntime.flow.phase, 'running')
    assert.equal(local.xrcPluginRuntime.tasks.poster.phase, 'running')
    for (const mode of ['likes-posts', 'likes-replies']) {
      assert.ok(stopped.some(({ id, message }) => id === tabs[mode] && message.type === 'xrc-flow-stop'))
    }
  } finally {
    delete globalThis.chrome
  }
})

test('stopping one task leaves other task tabs and the flow running', async () => {
  const previousChrome = globalThis.chrome
  const session = { xrcTaskTabs: { timeline: 11, poster: 22 } }
  const local = { xrcPluginRuntime: {
    tasks: { timeline: { tabId: 11, phase: 'running' }, poster: { tabId: 22, phase: 'running' } },
    flow: { phase: 'running' },
  } }
  const messages = []
  globalThis.chrome = {
    storage: {
      session: { async get(key) { return { [key]: session[key] } } },
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
    },
    tabs: {
      async get(id) { return { id } },
      async sendMessage(id, message) { messages.push({ id, message }) },
    },
  }
  try {
    const result = await background.stopAllTaskTabs('当前任务受限', { modes: ['timeline'], phase: 'stopped' })
    assert.deepEqual(messages.map(({ id }) => id), [11])
    assert.equal(result.runtime.flow.phase, 'running')
    assert.equal(result.runtime.tasks.timeline, undefined)
    assert.equal(result.runtime.tasks.poster.phase, 'running')
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('pending task launch is consumed only by its assigned tab and destination', async () => {
  const sessionData = {}
  globalThis.chrome = {
    storage: {
      session: {
        async get(key) { return { [key]: sessionData[key] } },
        async set(value) { Object.assign(sessionData, value) },
        async remove(key) { delete sessionData[key] },
      },
    },
  }
  try {
    await background.rememberPendingLaunch('notifications', 'https://x.com/notifications', true, 22)
    await background.rememberPendingLaunch('timeline', 'https://x.com/home', true, 11)
    await background.rememberPendingLaunch('mutual-followBack', '/account/followers', true, 33)
    assert.equal(sessionData['xrcPendingTab:33'].path, '/account/followers')
    assert.equal((await background.consumePendingLaunch({ tab: { id: 11, url: 'https://x.com/notifications' } })).launch, null)
    assert.equal(sessionData['xrcPendingTab:11'].mode, 'timeline')
    assert.equal((await background.consumePendingLaunch({ tab: { id: 22, url: 'https://x.com/notifications' } })).launch.mode, 'notifications')
    assert.equal(sessionData['xrcPendingTab:22'], undefined)
    assert.equal((await background.consumePendingLaunch({ tab: { id: 11, url: 'https://x.com/home' } })).launch.mode, 'timeline')
  } finally {
    delete globalThis.chrome
  }
})

test('remote start resumes an idle comment task in its existing window and reports a blocked start', async () => {
  const previousChrome = globalThis.chrome
  let runtime = { tasks: {}, flow: { phase: 'running' } }
  let reply = { ok: true, phase: 'running' }
  const updates = []
  globalThis.chrome = {
    storage: {
      session: { async get() { return { xrcTaskTabs: { timeline: 11 } } }, async set() {} },
      local: { async get() { return { xrcPluginRuntime: runtime } }, async set(value) { runtime = value.xrcPluginRuntime } },
    },
    tabs: {
      async get() { return { id: 11, windowId: 5, url: 'https://x.com/home' } },
      async sendMessage(id, message) { assert.equal(id, 11); assert.equal(message.type, 'xrc-task-start'); return reply },
      async update(id, options) { updates.push(options) },
    },
    windows: { async update() {} },
  }
  try {
    const started = await background.focusTaskTab('timeline', null, { start: true })
    assert.equal(started.started, true)
    assert.deepEqual(updates, [{ active: true }])
    reply = { ok: false, error: '缺少回复模型密钥' }
    await assert.rejects(background.focusTaskTab('timeline', null, { start: true }), /缺少回复模型密钥/)
    assert.deepEqual(updates, [{ active: true }], 'blocked starts must not navigate or open another window')
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('writes the phrase into Draft state and keeps Reply disabled until that write', () => {
  const draft = require('../../tools/x-reply-clipboard-extension/draftFill.js')
  assert.equal(draft.visibleDraftText({ textContent: '  学习了\u200b  ' }), '学习了')
  assert.equal(draft.visibleDraftText({ textContent: 'Post your reply' }), '')
  assert.equal(draft.comparableDraftText({ innerText: '第一行\n\n\n第二行' }, 'post'), '第一行\n\n第二行')
  assert.equal(draft.isRecoverableDuplicateOrPlaceholderMix('稳稳', '稳'), true)
  assert.equal(draft.isRecoverableDuplicateOrPlaceholderMix('稳st your reply', '稳'), true)

  function Style() {}
  Style.prototype.clear = function clear() { return new Style() }

  function Character(style, entity) {
    this.style = style || new Style()
    this.entity = entity === undefined ? null : entity
  }
  Character.prototype.getStyle = function getStyle() { return this.style }
  Character.prototype.set = function set(key, value) {
    const next = new Character(this.style, this.entity)
    if (key === 'style') next.style = value
    if (key === 'entity') next.entity = value
    return next
  }

  function CharacterList(items) {
    if (!(this instanceof CharacterList)) return new CharacterList(items)
    this.items = items || []
    this.size = this.items.length
  }
  CharacterList.prototype.get = function get(index) { return this.items[index] }
  CharacterList.prototype.first = function first() { return this.items[0] }
  CharacterList.prototype.push = function push(item) { return new CharacterList([...this.items, item]) }

  function Block(props) {
    Object.assign(this, props)
  }
  Block.prototype.getText = function getText() { return this.text || '' }
  Block.prototype.getCharacterList = function getCharacterList() { return this.characterList }
  Block.prototype.merge = function merge(props) { return Object.assign(new Block(this), props) }

  function BlockMap(entries) {
    if (!(this instanceof BlockMap)) return new BlockMap(entries)
    this.entries = entries || []
  }
  BlockMap.prototype.set = function set(key, value) {
    return new BlockMap([...this.entries.filter((entry) => entry[0] !== key), [key, value]])
  }
  BlockMap.prototype.forEach = function forEach(fn) {
    this.entries.forEach((entry) => fn(entry[1], entry[0]))
  }

  function Content(blockMap) {
    this.blockMap = blockMap
  }
  Content.prototype.getBlockMap = function getBlockMap() { return this.blockMap }
  Content.prototype.set = function set(key, value) {
    const next = new Content(key === 'blockMap' ? value : this.blockMap)
    next[key] = value
    return next
  }

  function SelectionState() {}
  SelectionState.createEmpty = function createEmpty() { return new SelectionState() }

  function EditorState(content) {
    this.content = content
  }
  EditorState.prototype.getCurrentContent = function getCurrentContent() { return this.content }
  EditorState.prototype.getSelection = function getSelection() { return { constructor: SelectionState } }
  EditorState.push = function push(_editorState, content) { return new EditorState(content) }
  EditorState.moveSelectionToEnd = function moveSelectionToEnd(state) { return state }

  const phrase = '学习了'
  let editorState = new EditorState(new Content(new BlockMap([
    ['empty', new Block({ text: '', characterList: new CharacterList([new Character()]) })],
  ])))
  let replyEnabled = false
  const node = {
    props: {
      get editorState() { return editorState },
      onChange(next) {
        editorState = next
        replyEnabled = draft.readDraftText(node) === phrase
      },
    },
  }

  assert.equal(replyEnabled, false)
  draft.writeReplyDraft(node, phrase)
  assert.equal(draft.readDraftText(node), phrase)
  assert.equal(replyEnabled, true)

  const multiline = '第一行\n\n第二行'
  draft.writeReplyDraft(node, multiline)
  assert.equal(draft.readDraftText(node), multiline)
  assert.deepEqual(editorState.content.blockMap.entries.map((entry) => entry[1].text), ['第一行', '', '第二行'])

  const seen = []
  let index = 0
  for (let step = 0; step < 8; step += 1) {
    seen.push(require('../../tools/x-reply-clipboard-extension/phrases.js')[index])
    index = loop.nextPhraseIndex(55, index, () => 0)
  }
  assert.equal(seen[0], require('../../tools/x-reply-clipboard-extension/phrases.js')[0])
  assert.notEqual(seen[1], seen[0])
  for (let step = 1; step < seen.length; step += 1) assert.notEqual(seen[step], seen[step - 1])
})

function matchSelector(node, selector) {
  return selector.split(',').some((part) => {
    const text = part.trim()
    if (!text) return false
    if (text.startsWith('#')) return node.id === text.slice(1)
    const tagMatch = text.match(/^([a-zA-Z][\w-]*)/)
    let rest = text
    if (tagMatch && !text.startsWith('[')) {
      if (node.tag !== tagMatch[1]) return false
      rest = text.slice(tagMatch[1].length)
    }
    const attrs = [...rest.matchAll(/\[([^\]=]+)(?:=(['"])(.*?)\2)?\]/g)]
    if (rest.trim() && attrs.length === 0) return false
    return attrs.every((match) => (match[3] == null ? node.getAttribute(match[1]) != null : node.getAttribute(match[1]) === match[3]))
  })
}

function mountTree(spec, parent = null) {
  const node = {
    tag: spec.tag,
    attrs: spec.attrs || {},
    parentElement: parent,
    nodeType: 1,
    id: spec.attrs?.id || '',
    children: [],
  }
  node.getAttribute = (name) => node.attrs[name] ?? null
  node.matches = (selector) => matchSelector(node, selector)
  node.querySelector = (selector) => {
    for (const child of node.children) {
      if (child.matches(selector)) return child
      const found = child.querySelector(selector)
      if (found) return found
    }
    return null
  }
  node.querySelectorAll = (selector) => node.children.flatMap((child) => [
    ...(child.matches(selector) ? [child] : []),
    ...child.querySelectorAll(selector),
  ])
  node.closest = (selector) => {
    let current = node
    while (current) {
      if (current.matches?.(selector)) return current
      current = current.parentElement
    }
    return null
  }
  node.children = (spec.children || []).map((child) => mountTree(child, node))
  return node
}

function loadSidebarMountPoint(source) {
  const start = source.indexOf('const SIDEBAR_MODULE_SELECTOR')
  const end = source.indexOf('function dockPanel(')
  return new Function(`${source.slice(start, end)}\nreturn sidebarMountPoint;`)()
}

test('panel mounts under the search box inside the right sidebar', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  const sidebarMountPoint = loadSidebarMountPoint(source)
  assert.match(source, /function sidebarMountPoint/)
  assert.match(source, /function dockPanel/)
  assert.match(source, /SearchBox_Search_Input/)
  assert.match(source, /xrcDock/)
  assert.match(css, /#x-reply-clipboard-panel\[data-xrc-dock="pending"\]/)
  assert.match(css, /#x-reply-clipboard-panel\[data-xrc-dock="float"\]/)
  assert.match(css, /position:\s*fixed/)
  assert.match(css, /right:\s*18px/)
  assert.match(css, /bottom:\s*18px/)
  assert.match(source, /function floatPanel/)
  assert.match(source, /state\.panelPlacement === "embed"/)

  const sidebar = mountTree({
    tag: 'div',
    attrs: { 'data-testid': 'sidebarColumn' },
    children: [{
      tag: 'div',
      attrs: { id: 'column' },
      children: [
        {
          tag: 'div',
          attrs: { id: 'search-block' },
          children: [{
            tag: 'form',
            attrs: { role: 'search', 'aria-label': 'Search' },
            children: [{ tag: 'input', attrs: { 'data-testid': 'SearchBox_Search_Input' } }],
          }],
        },
        { tag: 'div', attrs: { id: 'hidden' } },
        {
          tag: 'div',
          attrs: { id: 'modules' },
          children: [
            { tag: 'aside', attrs: { role: 'complementary', 'aria-label': 'Upgrade to Premium+' } },
            { tag: 'div', attrs: { 'data-testid': 'trend' } },
            { tag: 'nav', attrs: { role: 'navigation', 'aria-label': 'Footer' } },
          ],
        },
      ],
    }],
  })
  const mounted = sidebarMountPoint(sidebar)
  assert.equal(mounted.type, 'prepend')
  assert.equal(mounted.parent.id, 'modules')

  const flat = mountTree({
    tag: 'div',
    attrs: { 'data-testid': 'sidebarColumn' },
    children: [
      {
        tag: 'div',
        attrs: { id: 'search-block' },
        children: [{
          tag: 'form',
          attrs: { role: 'search' },
          children: [{ tag: 'input', attrs: { 'data-testid': 'SearchBox_Search_Input' } }],
        }],
      },
      { tag: 'aside', attrs: { role: 'complementary', 'aria-label': 'Who to follow' } },
    ],
  })
  const flatMount = sidebarMountPoint(flat)
  assert.equal(flatMount.type, 'after')
  assert.equal(flatMount.anchor.id, 'search-block')

  const page = mountTree({
    tag: 'div',
    children: [
      { tag: 'nav', attrs: { role: 'navigation', 'aria-label': 'Primary' } },
      {
        tag: 'div',
        attrs: { 'data-testid': 'primaryColumn' },
        children: [{
          tag: 'form',
          attrs: { role: 'search' },
          children: [{ tag: 'input', attrs: { 'data-testid': 'SearchBox_Search_Input' } }],
        }],
      },
      sidebar,
    ],
  })
  assert.equal(sidebarMountPoint(page).parent.id, 'modules')
  assert.equal(sidebarMountPoint(mountTree({
    tag: 'div',
    children: [{
      tag: 'form',
      attrs: { role: 'search' },
      children: [{ tag: 'input', attrs: { 'data-testid': 'SearchBox_Search_Input' } }],
    }],
  })), null)
})

test('main-world writer replaces the whole editor and supersedes an earlier listener', async () => {
  const source = await readFile(new URL('draftFill.js', extensionDir), 'utf8')
  assert.match(source, /x-reply-clipboard-draft-v2/)
  assert.match(source, /HANDLER_KEY/)
  assert.match(source, /removeEventListener\("message", previousHandler\)/)
  assert.match(source, /range\.selectNodeContents\(editor\)/)
  assert.match(source, /command-replace/)
  assert.doesNotMatch(source, /execCommand\("selectAll"/)
})

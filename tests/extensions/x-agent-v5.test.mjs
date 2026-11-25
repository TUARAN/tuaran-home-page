import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const extensionDir = new URL('../../tools/x-reply-clipboard-extension/', import.meta.url)

class MiniNode {
  constructor(tag) {
    this.tagName = tag
    this.className = ''
    this.children = []
    this.parentNode = null
    this.attrs = {}
    this.dataset = {}
    this.listeners = {}
    this.textContent = ''
    this.value = ''
    this.type = ''
    this.placeholder = ''
    this.rows = 0
    this.scrollTop = 0
    this.scrollHeight = 0
  }

  setAttribute(name, value) { this.attrs[name] = String(value) }
  append(...nodes) {
    for (const node of nodes) {
      node.parentNode = this
      this.children.push(node)
    }
  }

  get firstChild() { return this.children[0] || null }
  removeChild(node) {
    const index = this.children.indexOf(node)
    if (index >= 0) this.children.splice(index, 1)
    node.parentNode = null
  }

  addEventListener(type, fn) {
    this.listeners[type] = this.listeners[type] || []
    this.listeners[type].push(fn)
  }

  querySelector(selector) { return find(this, selector) }
  closest(selector) {
    let node = this
    while (node) {
      if (matches(node, selector)) return node
      node = node.parentNode
    }
    return null
  }
}

function matches(node, selector) {
  if (selector.startsWith('.')) return node.className.split(/\s+/u).includes(selector.slice(1))
  const attr = /^\[([^\]=]+)(?:=["']?([^"'\]]+)["']?)?\]$/u.exec(selector)
  if (!attr) return false
  const expected = attr[2]
  if (Object.prototype.hasOwnProperty.call(node.attrs, attr[1])) {
    return expected == null || node.attrs[attr[1]] === expected
  }
  const key = attr[1].replace(/^data-/u, '').replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase())
  if (!Object.prototype.hasOwnProperty.call(node.dataset, key)) return false
  return expected == null || String(node.dataset[key]) === expected
}

function find(node, selector) {
  if (matches(node, selector)) return node
  for (const child of node.children || []) {
    const found = find(child, selector)
    if (found) return found
  }
  return null
}

function installDocument() {
  globalThis.document = { createElement: (tag) => new MiniNode(tag) }
}

function memoryStorage(seed = {}) {
  const data = { ...seed }
  const writes = []
  return {
    data,
    writes,
    async get(key) { return { [key]: data[key] } },
    async set(values) {
      writes.push(values)
      Object.assign(data, values)
    },
  }
}

function runtimeHost(overrides = {}) {
  const calls = []
  const host = {
    calls,
    storage: memoryStorage(),
    accountHandle: () => 'tuaran',
    labels: () => ({ timeline: '评论首页', notifications: '评论回复' }),
    snapshot: () => ({ ok: false, error: '正在读取运行状态' }),
    async readRuntime() {
      calls.push('xrc-runtime-get')
      return {
        ok: true,
        runtime: { tasks: { timeline: { phase: 'running', detail: '第 2 轮 · 5/35' } } },
        schedule: { enabled: true, current: 'timeline', queue: ['timeline', 'notifications'], accountHandle: 'tuaran' },
      }
    },
    async pauseAll() { calls.push('xrc-flow-pause'); return { ok: true, via: 'xrc-flow-pause' } },
    async startAll() { calls.push('xrc-flow-start'); return { ok: true, via: 'xrc-flow-start' } },
    openSettings(page) { calls.push(`settings:${page}`) },
    openAdvanced() { calls.push('advanced') },
    openRuntime() { calls.push('runtime') },
    ...overrides,
  }
  return host
}

test('planner prompt stays separate and falls back DeepSeek, B.AI, NAS, MobileOffice', async () => {
  const planner = require('../../tools/x-reply-clipboard-extension/agentPlanner.js')
  const background = await readFile(new URL('background.js', extensionDir), 'utf8')
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.deepEqual([...planner.PROVIDER_ORDER], ['deepseek', 'bai', 'nas', 'mobileoffice'])
  assert.match(background, /const REPLY_PROVIDER_ORDER = \["deepseek", "bai", "nas", "mobileoffice"\]/)
  assert.match(content, /const REPLY_PROVIDER_ORDER = \["deepseek", "bai", "nas", "mobileoffice"\]/)
  assert.equal(planner.readPlannerPrompt({
    replyTimelinePrompt: '写得幽默一点',
    postNormalPrompt: '发帖风格',
  }), planner.DEFAULT_PROMPT)
  assert.equal(planner.readPlannerPrompt({
    plannerSystemPrompt: '只查状态',
    replyTimelinePrompt: '写得幽默一点',
  }), '只查状态')
  assert.match(planner.DEFAULT_PROMPT, /不要使用评论风格/)
  assert.doesNotMatch(planner.DEFAULT_PROMPT, /写得幽默/)

  const calls = []
  const failed = await planner.callPlannerProviders({
    apiKey: 'sk-deepseekkey',
    baiApiKey: 'sk-baibaibai',
    mobileOfficeToken: 'token',
    mobileOfficeVerified: true,
    nasSecretAvailable: true,
  }, async (provider, prompt) => {
    calls.push(provider)
    assert.equal(prompt, planner.DEFAULT_PROMPT)
    return { ok: false, error: `${provider} down` }
  })
  assert.deepEqual(calls, ['deepseek', 'bai', 'nas', 'mobileoffice'])
  assert.equal(failed.ok, false)
  assert.equal(failed.fallback, 'status-buttons')

  const stopped = []
  const recovered = await planner.callPlannerProviders({
    apiKey: 'sk-deepseekkey',
    baiApiKey: 'sk-baibaibai',
  }, async (provider) => {
    stopped.push(provider)
    return provider === 'bai' ? { ok: true } : { ok: false }
  })
  assert.deepEqual(stopped, ['deepseek', 'bai'])
  assert.equal(recovered.provider, 'bai')
})

test('this slice does not call the planner while routing status, pause and start', async () => {
  installDocument()
  const chat = require('../../tools/x-reply-clipboard-extension/agentChat.js')
  const planner = require('../../tools/x-reply-clipboard-extension/agentPlanner.js')
  const host = runtimeHost()
  let planned = 0
  const original = planner.planTurn
  planner.planTurn = async () => { planned += 1; return { used: false, ok: false, fallback: 'command-route' } }
  try {
    const status = await chat.handleTurn('现在在干什么', host)
    assert.equal(status.tool.name, 'xrc-runtime-get')
    assert.match(status.text, /评论首页/)
    assert.match(status.text, /第 2 轮 · 5\/35/)
    assert.match(status.view.sentence, /队列 2 项/)
    assert.equal(status.view.taskName, '评论首页')
    assert.doesNotMatch(status.text, /点赞|关注候选/)
    assert.equal(planned, 0)

    const paused = await chat.handleTurn('暂停全部', host)
    assert.equal(paused.tool.name, 'xrc-flow-pause')
    assert.match(paused.text, /已暂停全部/)
    assert.match(paused.text, /评论首页/)

    const started = await chat.handleTurn('开始全部', host)
    assert.equal(started.tool.name, 'xrc-flow-start')
    assert.match(started.text, /已开始全部/)
    assert.deepEqual(host.calls.filter((item) => item.startsWith('xrc-')), ['xrc-runtime-get', 'xrc-flow-pause', 'xrc-runtime-get', 'xrc-flow-start', 'xrc-runtime-get'])
  } finally {
    planner.planTurn = original
  }
})

test('a failed read or failed planner leaves status and buttons instead of a guessed task', async () => {
  const chat = require('../../tools/x-reply-clipboard-extension/agentChat.js')
  const planner = require('../../tools/x-reply-clipboard-extension/agentPlanner.js')
  const host = runtimeHost({
    async readRuntime() { throw new Error('后台没有响应') },
  })
  const missed = await chat.handleTurn('现在在干什么', host)
  assert.match(missed.text, /没有读到运行状态/)
  assert.match(missed.text, /后台没有响应/)
  assert.equal(missed.view.taskName, '')
  assert.equal(missed.showActions, true)
  assert.doesNotMatch(missed.text, /评论首页|点赞帖子/)

  const original = planner.planTurn
  planner.planTurn = async () => { throw new Error('规划超时') }
  try {
    const unknown = await chat.handleTurn('帮我换一批人', host)
    assert.equal(unknown.planner.fallback, 'status-buttons')
    assert.equal(unknown.showActions, true)
    assert.match(unknown.text, /没有读到运行状态/)
    assert.equal(unknown.view.taskName, '')
  } finally {
    planner.planTurn = original
  }
})

test('the dialog stores one local session and does not rewrite model or queue keys', async () => {
  installDocument()
  const chat = require('../../tools/x-reply-clipboard-extension/agentChat.js')
  const storage = memoryStorage({
    xrcAiSettings: { apiKey: 'sk-keep-this-key', replyTimelinePrompt: '原提示' },
    xrcTaskSchedule: { enabled: true, queue: ['timeline'] },
  })
  const host = runtimeHost({ storage })
  const panel = new MiniNode('section')
  const home = new MiniNode('div')
  home.attrs['data-xrc-agent-home'] = ''
  panel.append(home)
  chat.mount(panel, host)
  const field = home.querySelector('[data-xrc-agent-input]')
  field.value = '现在在干什么'
  await home.listeners.submit[0]({ preventDefault() {} })
  const saved = storage.data[chat.SESSION_KEY]
  assert.equal(saved.threads.length, 1)
  assert.equal(saved.activeId, saved.threads[0].id)
  assert.equal(saved.threads[0].turns[0].role, 'user')
  assert.equal(saved.threads[0].turns[1].role, 'assistant')
  assert.match(saved.threads[0].turns[1].text, /评论首页/)
  assert.deepEqual(storage.data.xrcAiSettings, { apiKey: 'sk-keep-this-key', replyTimelinePrompt: '原提示' })
  assert.deepEqual(storage.data.xrcTaskSchedule, { enabled: true, queue: ['timeline'] })
  assert.equal(storage.writes.every((entry) => Object.keys(entry).every((key) => key === chat.SESSION_KEY)), true)
  const log = home.querySelector('[data-xrc-agent-log]')
  const texts = (node) => `${node.textContent || ''}${(node.children || []).map(texts).join('')}`
  const text = (log.children || []).map(texts).join('\n')
  assert.match(text, /现在在干什么/)
  assert.match(text, /评论首页/)
  assert.doesNotMatch(text, /今日大互动|排班卡片/)
  const schedule = home.querySelector('[data-xrc-agent-action="schedule"]')
  assert.equal(schedule?.querySelector('.xrc-agent-label')?.textContent, '排班')
  assert.ok(schedule?.querySelector('.xrc-agent-icon'))
  assert.equal(home.querySelector('[data-xrc-agent-action="model"]')?.querySelector('.xrc-agent-label')?.textContent, '模型')
  assert.ok(home.querySelector('[data-xrc-agent-resize], [data-xrc-agent-rail]') || panel.querySelector('[data-xrc-agent-resize]'))
  assert.equal(home.querySelector('.xrc-agent-chips'), null)
})

test('the frame stays within the viewport and no multi-thread entry is offered', async () => {
  installDocument()
  const chat = require('../../tools/x-reply-clipboard-extension/agentChat.js')
  const opened = []
  const storage = memoryStorage({
    [chat.SESSION_KEY]: { id: 'current', turns: [{ role: 'user', text: '现在在干什么' }] },
    xrcAiSettings: { apiKey: 'sk-keep' },
  })
  const host = runtimeHost({ storage, showChat() { opened.push('chat') } })
  assert.deepEqual(chat.clampFrame({ width: 100, height: 100 }, { width: 1000, height: 800 }), { width: 320, height: 400 })
  assert.deepEqual(chat.clampFrame({ width: 2000, height: 2000 }, { width: 1000, height: 800 }), { width: 976, height: 776 })
  const panel = new MiniNode('section')
  panel.id = 'x-reply-clipboard-panel'
  const home = new MiniNode('div')
  home.attrs['data-xrc-agent-home'] = ''
  panel.append(home)
  chat.mount(panel, host)
  await new Promise((resolve) => setTimeout(resolve, 0))
  assert.equal(panel.dataset.xrcAgentFrame, 'rail')
  await home.listeners.click[0]({ target: home.querySelector('[data-xrc-agent-action="schedule"]') })
  assert.equal(host.calls.includes('advanced'), true)
  assert.equal(panel.dataset.xrcAgentRail, 'full')
  assert.equal(home.querySelector('[data-xrc-agent-action="threads"]'), null)
  assert.equal(home.querySelector('[data-xrc-agent-action="new"]'), null)
  assert.deepEqual(storage.data.xrcAiSettings, { apiKey: 'sk-keep' })
  assert.deepEqual(opened, [])
})

test('v5 home is wired without publishing or changing the writing provider order', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', extensionDir), 'utf8'))
  const readme = await readFile(new URL('README.md', extensionDir), 'utf8')
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  const css = await readFile(new URL('agentChat.css', extensionDir), 'utf8')
  const chat = await readFile(new URL('agentChat.js', extensionDir), 'utf8')
  const catalog = await readFile(new URL('../../lib/content/resourceCatalog.js', import.meta.url), 'utf8')
  const siteVersion = await readFile(new URL('../../lib/community/xExtensionVersion.js', import.meta.url), 'utf8')
  const scripts = manifest.content_scripts[3].js
  assert.equal(manifest.version, '5.9.28')
  assert.equal(manifest.name, 'X 大互动智能体')
  assert.ok(scripts.indexOf('agentPlanner.js') < scripts.indexOf('agentChat.js'))
  assert.ok(scripts.indexOf('agentChat.js') < scripts.indexOf('content.js'))
  assert.ok(scripts.indexOf('experiments.js') > scripts.indexOf('content.js'))
  assert.ok(manifest.content_scripts[3].css.includes('agentChat.css'))
  assert.match(readme, /当前本地源码为 v5\.9\.28/)
  assert.match(readme, /v5\.8\.1（2026-11-24，本地测试）/)
  assert.match(chat, /大互动智能体/)
  assert.match(chat, /xrc-agent-typing/)
  assert.match(chat, /大互动智能体/)
  assert.match(chat, /xrc-agent-avatar/)
  assert.match(readme, /未打包、未发布/)
  assert.match(content, /data-xrc-agent-home/)
  assert.match(content, /XrcAgentChat\?\.mount\?\.\(panel, globalThis\.XrcAgentHost\)/)
  assert.match(content, /type: "xrc-flow-start"/)
  assert.match(content, /xrc-flow-pause/)
  assert.match(content, /xrc-schedule-config-get/)
  assert.doesNotMatch(content, /data-xrc-config-open="prompts"/)
  assert.doesNotMatch(content, /data-xrc-config-open="pace"/)
  assert.doesNotMatch(content, /data-xrc-config-section="prompts"/)
  assert.doesNotMatch(content, /data-xrc-planner-prompt/)
  assert.match(content, /data-xrc-schedule-open>排班</)
  assert.doesNotMatch(content, /高级 · 排班台/)
  assert.match(content, /class="xrc-home-action" data-xrc-schedule-open>打开排班台</)
  assert.match(content, /今日大互动/)
  assert.match(css, /data-xrc-home="agent"\]\[data-desk="home"\]\[data-xrc-page="main"\] > \.xrc-today-strip/)
  assert.match(css, /xrc-agent-rail/)
  assert.match(css, /xrc-agent-resize/)
  assert.match(css, /data-xrc-agent-rail="full"/)
  assert.match(css, /overflow: hidden/)
  assert.match(css, /xrc-agent-icon/)
  assert.match(css, /data-xrc-home="agent"\]:not\(\[data-view="collapsed"\]\) > \.xrc-workspace-nav/)
  assert.match(content, /showChat\(\)/)
  assert.match(catalog, /x-reply-clipboard-extension-v4\.15\.50\.zip/)
  assert.match(siteVersion, /X_EXTENSION_LATEST_VERSION = '4\.18\.0'/)
  assert.doesNotMatch(catalog, /x-reply-clipboard-extension-v5\.0\.0/)
  assert.doesNotMatch(siteVersion, /X_EXTENSION_LATEST_VERSION = '5\.0\.0'/)
})

function textOf(node) {
  return `${node.textContent || ''}${(node.children || []).map(textOf).join('')}`
}

function findAll(node, className, out = []) {
  if (String(node.className || '').split(/\s+/u).includes(className)) out.push(node)
  for (const child of node.children || []) findAll(child, className, out)
  return out
}

async function mountedHome(host) {
  installDocument()
  const chat = require('../../tools/x-reply-clipboard-extension/agentChat.js')
  const panel = new MiniNode('section')
  const home = new MiniNode('div')
  home.attrs['data-xrc-agent-home'] = ''
  panel.append(home)
  chat.mount(panel, host)
  await new Promise((resolve) => setTimeout(resolve, 0))
  return { chat, panel, home }
}

test('an empty thread offers read-only starters and the header carries live run state', async () => {
  const host = runtimeHost({ snapshot: () => ({ ok: true, accountHandle: 'tuaran', runtime: { tasks: {} }, schedule: { enabled: false, current: '' } }) })
  const { home } = await mountedHome(host)
  const log = home.querySelector('[data-xrc-agent-log]')
  const starters = findAll(log, 'xrc-agent-starter').map((node) => node.dataset.xrcAgentCommand)
  assert.deepEqual(starters, ['现在在干什么', '今天做了多少', '最近有报警吗', '下一项是什么'])
  assert.equal(starters.some((text) => /暂停|开始/u.test(text)), false)
  assert.equal(home.querySelector('[data-xrc-agent-flow]').dataset.state, 'paused')
  assert.equal(home.querySelector('[data-xrc-agent-flow]').textContent, '已暂停')
  assert.equal(home.querySelector('[data-xrc-agent-account]').textContent, '@tuaran')
  await home.listeners.click[0]({ target: log.querySelector('[data-xrc-agent-command="现在在干什么"]') })
  assert.equal(log.querySelector('.xrc-agent-welcome'), null)
  assert.match(textOf(log.querySelector('.xrc-agent-trace')), /调用 1 个工具/)
  assert.match(textOf(log.querySelector('.xrc-agent-trace')), /读取运行状态/)
  assert.ok(log.querySelector('[data-xrc-agent-action="retry"]'))
  assert.equal(home.querySelector('.xrc-agent-chips'), null)
})

test('a proposed write becomes a confirm card that can be declined without running anything', async () => {
  const host = runtimeHost({
    async harness() {
      return { ok: true, provider: 'deepseek', stopReason: 'confirm', answer: '最近报警 6 次，建议先暂停。', steps: [{ call: { tool: 'alerts.recent' }, result: { ok: true } }, { call: { tool: 'facts.today' }, result: { ok: false } }], pending: [{ tool: 'schedule.pauseAll', label: '暂停全部', why: '报警连续出现' }] }
    },
  })
  const { chat, home } = await mountedHome(host)
  const field = home.querySelector('[data-xrc-agent-input]')
  field.value = '报警这么多要不要停'
  await home.listeners.submit[0]({ preventDefault() {} })
  const log = home.querySelector('[data-xrc-agent-log]')
  const card = log.querySelector('.xrc-agent-confirm')
  assert.match(textOf(card), /需要你确认/)
  assert.match(textOf(card), /报警连续出现/)
  assert.equal(card.querySelector('[data-xrc-agent-command="暂停全部"]').textContent, '确认暂停全部')
  assert.match(textOf(log.querySelector('.xrc-agent-trace')), /调用 2 个工具 · 1 个失败/)
  assert.match(textOf(log.querySelector('.xrc-agent-meta')), /DeepSeek/)
  await home.listeners.click[0]({ target: card.querySelector('[data-xrc-agent-action="dismiss-confirm"]') })
  assert.equal(host.calls.includes('xrc-flow-pause'), false)
  const saved = host.storage.data[chat.SESSION_KEY]
  const reply = saved.threads[0].turns.find((turn) => turn.confirm?.length)
  assert.equal(reply.resolved, 'dismissed')
  assert.equal(reply.why, '报警连续出现')
  assert.match(textOf(home.querySelector('[data-xrc-agent-log]').querySelector('.xrc-agent-confirm')), /已取消，没有执行/)
})

test('pressing a confirm button runs the command once and closes the card', async () => {
  const host = runtimeHost({
    async harness() {
      return { ok: true, stopReason: 'confirm', answer: '建议先暂停。', steps: [], pending: [{ tool: 'schedule.pauseAll', label: '暂停全部' }] }
    },
  })
  const { chat, home } = await mountedHome(host)
  home.querySelector('[data-xrc-agent-input]').value = '要不要停'
  await home.listeners.submit[0]({ preventDefault() {} })
  const button = home.querySelector('[data-xrc-agent-log]').querySelector('[data-xrc-agent-command="暂停全部"]')
  await home.listeners.click[0]({ target: button })
  assert.deepEqual(host.calls.filter((call) => call === 'xrc-flow-pause'), ['xrc-flow-pause'])
  const turns = host.storage.data[chat.SESSION_KEY].threads[0].turns
  assert.equal(turns.find((turn) => turn.confirm?.length).resolved, '暂停全部')
})

test('Enter sends, Shift+Enter and an IME still composing do not', async () => {
  const host = runtimeHost()
  const { chat, home } = await mountedHome(host)
  const field = home.querySelector('[data-xrc-agent-input]')
  const press = (extra) => home.listeners.keydown[0]({ key: 'Enter', target: field, preventDefault() {}, ...extra })
  field.value = '现在在干什么'
  assert.equal(await press({ shiftKey: true }), null)
  assert.equal(await press({ isComposing: true }), null)
  assert.equal(await press({ keyCode: 229 }), null)
  assert.equal(field.value, '现在在干什么')
  const reply = await press({})
  assert.equal(reply.tool.name, 'xrc-runtime-get')
  assert.equal(field.value, '')
  assert.equal(host.storage.data[chat.SESSION_KEY].threads[0].turns.length, 2)
})

test('run notices go to the activity feed, fold progress ticks and never push dialog out', async () => {
  let snap = { ok: true, accountHandle: 'tuaran', runtime: { tasks: { timeline: { phase: 'running', detail: '第 1 轮 · 1/35' } } }, schedule: { enabled: true, current: 'timeline' } }
  const host = runtimeHost({ snapshot: () => snap })
  const { chat, home } = await mountedHome(host)
  home.querySelector('[data-xrc-agent-input]').value = '现在在干什么'
  await home.listeners.submit[0]({ preventDefault() {} })
  for (let tick = 2; tick <= 60; tick += 1) {
    snap = { ...snap, runtime: { tasks: { timeline: { phase: 'running', detail: `第 1 轮 · ${tick}/35` } } } }
    chat.sync(home, host)
  }
  snap = { ...snap, schedule: { enabled: false, current: 'timeline' } }
  chat.sync(home, host)
  const saved = host.storage.data[chat.SESSION_KEY]
  const main = saved.threads.find((thread) => thread.kind === 'main')
  assert.deepEqual(main.turns.map((turn) => turn.role), ['user', 'assistant'])
  assert.equal(main.turns.some((turn) => turn.kind === 'status'), false)
  assert.equal(saved.activity.length, 2)
  assert.ok(saved.activity[0].updates > 50)
  assert.match(saved.activity[0].text, /60\/35/)
  assert.equal(saved.activity[1].state, 'paused')
  assert.equal(chat.unreadCount(saved), 2)
  assert.equal(home.querySelector('[data-xrc-agent-unread]').textContent, '2')
  assert.equal(home.querySelector('[data-xrc-agent-log]').querySelector('.xrc-agent-activity-item'), null)
  assert.equal(host.storage.writes.every((entry) => Object.keys(entry).every((key) => key === chat.SESSION_KEY)), true)

  await home.listeners.click[0]({ target: home.querySelector('[data-xrc-agent-action="activity"]') })
  assert.equal(home.querySelector('[data-xrc-agent-activity]').hidden, false)
  assert.equal(chat.unreadCount(host.storage.data[chat.SESSION_KEY]), 0)
  assert.equal(home.querySelector('[data-xrc-agent-unread]').hidden, true)
  const list = home.querySelector('[data-xrc-agent-activity-list]')
  assert.match(textOf(list.children[0]), /排班已暂停/)
  assert.match(textOf(list.children[1]), /更新 \d+ 次/)
  await home.listeners.keydown[0]({ key: 'Escape', target: home })
  assert.equal(home.querySelector('[data-xrc-agent-activity]').hidden, true)
})

test('older sessions move status turns out of threads into the activity feed once', () => {
  installDocument()
  const chat = require('../../tools/x-reply-clipboard-extension/agentChat.js')
  const turns = [{ role: 'user', text: '现在在干什么', at: 1 }, { role: 'assistant', text: '评论首页', at: 2 }]
  for (let index = 0; index < 45; index += 1) turns.push({ role: 'assistant', kind: 'status', text: `进度 ${index}`, at: 10 + index, view: { taskName: '评论首页', paused: false } })
  const store = chat.normalizeStore({ activeId: 'm', threads: [{ id: 'm', kind: 'main', turns }] })
  assert.deepEqual(store.threads[0].turns.map((turn) => turn.text), ['现在在干什么', '评论首页'])
  assert.equal(store.activity.length, 45)
  assert.equal(store.activity[0].state, 'running')
  const again = chat.normalizeStore(store)
  assert.equal(again.activity.length, 45)
  assert.equal(again.threads[0].turns.length, 2)
})

// The agent head reuses `.xrc-docs-head`, whose generic span/button/div rules once
// greyed the unread badge, boxed the head tools, clipped them, and hid the run pill.
test('agent head styles outrank the legacy docs-head span/button/div rules', async () => {
  const css = (await Promise.all(['content.css', 'agentChat.css'].map((name) => readFile(new URL(name, extensionDir), 'utf8'))))
    .join('\n').replace(/\/\*[\s\S]*?\*\//g, '')
  const selectors = []
  for (const match of css.matchAll(/([^{}]+)\{/g)) {
    for (const part of match[1].split(',')) selectors.push(part.trim())
  }
  const specificity = (selector) => {
    const bare = selector.replace(/::[\w-]+/g, ' ')
    const ids = (bare.match(/#[\w-]+/g) || []).length
    const classes = (bare.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) || []).length
    const tags = (bare.replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|:[\w-]+/g, ' ').match(/(^|[\s>+~])[a-z][\w-]*/g) || []).length
    return ids * 10000 + classes * 100 + tags
  }
  const legacy = (tail) => selectors.filter((selector) => !selector.includes('(') && tail.test(selector))
  const pick = (needle) => {
    const found = selectors.filter((selector) => selector.endsWith(needle))
    assert.ok(found.length, `missing rule for ${needle}`)
    return Math.max(...found.map(specificity))
  }
  const cases = [
    [/\.xrc-docs-head span$/, '.xrc-agent-bell > .xrc-agent-badge'],
    [/\.xrc-docs-head > div > span$/, '.xrc-agent-page-head .xrc-agent-strip'],
    [/\.xrc-docs-head span$/, '.xrc-agent-flow[data-state="running"]'],
    [/\.xrc-docs-head span$/, '.xrc-agent-flow[data-state="paused"]'],
    [/\.xrc-docs-head button$/, '.xrc-agent-head-tools > .xrc-agent-tool'],
    [/\.xrc-docs-head > div$/, '> .xrc-agent-head-tools'],
  ]
  for (const [tail, needle] of cases) {
    const rivals = legacy(tail)
    assert.ok(rivals.length, `no legacy rule for ${tail}`)
    for (const rival of rivals) assert.ok(pick(needle) > specificity(rival), `${needle} loses to ${rival}`)
  }
})

// Harness v3: per-account persona and memory, local memory routes, compaction.
require('../../tools/x-reply-clipboard-extension/agentPlanner.js')

async function say(home, text) {
  home.querySelector('[data-xrc-agent-input]').value = text
  await home.listeners.submit[0]({ preventDefault() {} })
}

test('memory routes run before pause or start, and 记住：暂停全部… does not pause', async () => {
  installDocument()
  const chat = require('../../tools/x-reply-clipboard-extension/agentChat.js')
  assert.deepEqual(chat.routeCommand('记住：暂停全部前先问我'), { protocol: chat.PROTOCOL, intent: 'remember', type: 'preference', text: '暂停全部前先问我' })
  assert.equal(chat.routeCommand('记住（约定）：报警超过 5 次先问我').type, 'rule')
  assert.equal(chat.routeCommand('请记住(账号) 主做中文 AI 工具圈').type, 'account')
  assert.deepEqual(chat.routeCommand('忘掉 2'), { protocol: chat.PROTOCOL, intent: 'forget', text: '2' })
  assert.equal(chat.routeCommand('/memory').intent, 'memory-list')
  assert.equal(chat.routeCommand('你记得什么？').intent, 'memory-list')
  assert.equal(chat.routeCommand('/compact').intent, 'compact')
  assert.equal(chat.routeCommand('压缩上下文').intent, 'compact')
  assert.equal(chat.routeCommand('/persona').intent, 'open-profile')
  assert.equal(chat.routeCommand('暂停全部').intent, 'pause-all')

  const host = runtimeHost({ async harness() { throw new Error('planner must not run for memory') } })
  const { home } = await mountedHome(host)
  await say(home, '记住：暂停全部前先问我')
  assert.equal(host.calls.includes('xrc-flow-pause'), false)
  const saved = host.storage.data[chat.PROFILE_KEY].accounts.tuaran
  assert.deepEqual(saved.memory.map(({ type, text, source }) => ({ type, text, source })), [{ type: 'preference', text: '暂停全部前先问我', source: 'user' }])
  assert.match(textOf(home.querySelector('[data-xrc-agent-log]')), /已记住（站长偏好），只用于 @tuaran/)
})

test('memory belongs to one account and is never written without a handle', async () => {
  installDocument()
  const chat = require('../../tools/x-reply-clipboard-extension/agentChat.js')
  const profiles = chat.normalizeProfiles({ accounts: { '@TuaRan': { memory: [{ text: '偏好短句' }] }, default: { memory: [{ text: 'x' }] } } })
  assert.deepEqual(Object.keys(profiles.accounts), ['tuaran'])
  assert.equal(chat.addMemory(profiles, 'other', { text: '只看评论回复' }).ok, true)
  assert.deepEqual(chat.profileOf(profiles, 'tuaran').memory.map((item) => item.text), ['偏好短句'])
  assert.deepEqual(chat.profileOf(profiles, '@Other').memory.map((item) => item.text), ['只看评论回复'])
  assert.equal(chat.addMemory(profiles, '', { text: '偏好短句' }).ok, false)
  assert.equal(chat.addMemory(profiles, 'default', { text: '偏好短句' }).ok, false)
  assert.match(chat.addMemory(profiles, 'tuaran', { text: '把冷却缩短到 10 秒' }).error, /和原则冲突/)
  assert.match(chat.savePersona(profiles, 'tuaran', { goal: '每日上限调高到 3000' }).error, /当前目标和原则冲突/)
  assert.equal(chat.savePersona(profiles, 'tuaran', { role: '中文 AI 工具圈', tone: '先给结论' }).ok, true)
  for (let index = 0; index < 29; index += 1) chat.addMemory(profiles, 'tuaran', { text: `事实 ${index}` })
  assert.match(chat.addMemory(profiles, 'tuaran', { text: '再多一条' }).error, /已满 30 条/)
  assert.equal(chat.forgetMemory(profiles, 'tuaran', '1').entry.text, '偏好短句')
  assert.equal(chat.forgetMemory(profiles, 'tuaran', '事实 3').entry.text, '事实 3')

  const host = runtimeHost({ accountHandle: () => '', snapshot: () => ({ ok: false }) })
  const { home } = await mountedHome(host)
  await say(home, '记住：偏好短句')
  assert.equal(host.storage.data[chat.PROFILE_KEY], undefined)
  assert.match(textOf(home.querySelector('[data-xrc-agent-log]')), /读不到当前账号，记忆没有写入/)
})

test('the harness sees this account persona and memory, and a memory proposal needs a confirm', async () => {
  const contexts = []
  const host = runtimeHost({
    async harness(context) {
      contexts.push(context)
      return contexts.length === 1
        ? { ok: true, stopReason: 'confirm', answer: '要我记住这条约定吗？', steps: [], pending: [{ tool: 'memory.remember', label: '记住', why: '要我记住这条约定吗？', memory: { type: 'rule', text: '报警超过 5 次先问我' } }] }
        : { ok: true, stopReason: 'answer', answer: '好。', steps: [] }
    },
  })
  installDocument()
  const chat = require('../../tools/x-reply-clipboard-extension/agentChat.js')
  const seed = chat.normalizeProfiles({ accounts: { tuaran: { persona: { role: '中文 AI 工具圈' }, memory: [{ type: 'preference', text: '偏好短句' }] }, other: { memory: [{ text: '别的号' }] } } })
  await host.storage.set({ [chat.PROFILE_KEY]: seed })
  const fresh = await mountedHome(host)
  await say(fresh.home, '以后报警超过五次先问我')
  assert.equal(contexts[0].account, 'tuaran')
  assert.equal(contexts[0].persona.role, '中文 AI 工具圈')
  assert.deepEqual(contexts[0].memory, [{ type: 'preference', text: '偏好短句' }])
  assert.equal(JSON.stringify(contexts[0]).includes('别的号'), false)
  assert.deepEqual(contexts[0].recent, [])
  const card = fresh.home.querySelector('[data-xrc-agent-log]').querySelector('.xrc-agent-confirm')
  const button = card.querySelector('[data-xrc-agent-command="记住（约定）：报警超过 5 次先问我"]')
  assert.equal(button.textContent, '确认记住')
  assert.equal(host.storage.data[chat.PROFILE_KEY].accounts.tuaran.memory.length, 1)
  await fresh.home.listeners.click[0]({ target: button })
  const memory = host.storage.data[chat.PROFILE_KEY].accounts.tuaran.memory
  assert.deepEqual(memory.map(({ type, text, source }) => ({ type, text, source })).pop(), { type: 'rule', text: '报警超过 5 次先问我', source: 'agent' })
  await say(fresh.home, '接着说')
  assert.equal(contexts[1].memory.length, 2)
  assert.equal(contexts[1].recent[0].text, '以后报警超过五次先问我')
  assert.equal(contexts[1].recent.some((turn) => turn.text === '接着说'), false)
})

test('long threads compact into a rolling summary that reaches the harness', async () => {
  installDocument()
  const chat = require('../../tools/x-reply-clipboard-extension/agentChat.js')
  const thread = { turns: [] }
  for (let index = 0; index < 20; index += 1) {
    thread.turns.push({ role: 'user', text: `问题 ${index}` }, { role: 'assistant', text: `回答 ${index}`, ...(index === 3 ? { confirm: ['暂停全部'], resolved: 'dismissed' } : {}) })
  }
  assert.equal(chat.compactThread(thread, chat.KEEP_RECENT), 28)
  assert.equal(thread.turns.length, chat.KEEP_RECENT)
  assert.equal(thread.compacted, 28)
  assert.match(thread.summary, /^问：问题 0→答：回答 0\n/)
  assert.match(thread.summary, /问：问题 3→答：回答 3（未执行）/)
  for (let round = 0; round < 40; round += 1) {
    thread.turns.push({ role: 'user', text: `后来 ${round} ${'长'.repeat(50)}` }, { role: 'assistant', text: '好'.repeat(80) })
    chat.compactThread(thread, chat.KEEP_RECENT)
  }
  assert.ok(thread.summary.length <= chat.SUMMARY_MAX)
  assert.ok(thread.summary.startsWith('…\n'))
  assert.equal(chat.normalizeStore({ activeId: 'a', threads: [{ id: 'a', ...thread }] }).threads.find((item) => item.id === 'a').summary, thread.summary)

  const contexts = []
  const host = runtimeHost({ async harness(context) { contexts.push(context); return { ok: true, answer: '好。', steps: [] } } })
  const { home } = await mountedHome(host)
  for (let index = 0; index < 16; index += 1) await say(home, `随便聊 ${index}`)
  const saved = host.storage.data[chat.SESSION_KEY].threads[0]
  assert.ok(saved.turns.length <= chat.COMPACT_AT)
  assert.ok(saved.compacted > 0)
  assert.match(contexts[contexts.length - 1].summary, /问：随便聊 0→答：好。/)
  assert.match(textOf(home.querySelector('[data-xrc-agent-compacted]')), /已压缩 \d+ 条早前对话/)

  await say(home, '/compact')
  const after = host.storage.data[chat.SESSION_KEY].threads[0]
  assert.equal(after.turns.length, 2)
  assert.match(after.turns[1].text, /已把前面 \d+ 条压缩成摘要/)
})

test('the profile drawer edits persona per account, refuses conflicts and shares the slot with activity', async () => {
  const host = runtimeHost()
  const { chat, home } = await mountedHome(host)
  const drawer = home.querySelector('[data-xrc-agent-profile]')
  assert.equal(drawer.hidden, true)
  await home.listeners.click[0]({ target: home.querySelector('[data-xrc-agent-action="activity"]') })
  await home.listeners.click[0]({ target: home.querySelector('[data-xrc-agent-action="profile"]') })
  assert.equal(drawer.hidden, false)
  assert.equal(home.querySelector('[data-xrc-agent-activity]').hidden, true)
  assert.equal(home.querySelector('[data-xrc-agent-profile-account]').textContent, '@tuaran')
  home.querySelector('[data-xrc-agent-persona="goal"]').value = '冷却能不能缩短点'
  await home.listeners.click[0]({ target: home.querySelector('[data-xrc-agent-action="save-persona"]') })
  assert.match(home.querySelector('[data-xrc-agent-profile-note]').textContent, /当前目标和原则冲突/)
  assert.equal(host.storage.data[chat.PROFILE_KEY], undefined)
  home.querySelector('[data-xrc-agent-persona="goal"]').value = '这周先把评论回复做稳'
  await home.listeners.click[0]({ target: home.querySelector('[data-xrc-agent-action="save-persona"]') })
  assert.equal(host.storage.data[chat.PROFILE_KEY].accounts.tuaran.persona.goal, '这周先把评论回复做稳')
  await say(home, '记住：偏好短句')
  const list = home.querySelector('[data-xrc-agent-memory-list]')
  assert.match(textOf(list), /偏好短句/)
  assert.match(textOf(list), /你写入/)
  await home.listeners.click[0]({ target: list.querySelector('[data-xrc-agent-action="forget-memory"]') })
  assert.deepEqual(host.storage.data[chat.PROFILE_KEY].accounts.tuaran.memory, [])
  await home.listeners.keydown[0]({ key: 'Escape', target: home })
  assert.equal(drawer.hidden, true)
})

test('the side rail offers the profile drawer and the memory card is gone', async () => {
  const host = runtimeHost()
  const { chat, home } = await mountedHome(host)
  assert.equal(home.querySelector('[data-xrc-agent-memory-card]'), null)
  const button = home.querySelector('[data-xrc-agent-action="profile"]')
  assert.ok(button, 'rail memory button is missing')
  await new Promise((resolve) => setTimeout(resolve, 0))
  await say(home, '记住（约定）：报警超过 5 次先问我')
  assert.equal(host.storage.data[chat.PROFILE_KEY].accounts.tuaran.memory.length, 1)
  await home.listeners.click[0]({ target: button })
  assert.equal(home.querySelector('[data-xrc-agent-profile]').hidden, false)
  await say(home, '忘掉 1')
  assert.equal(host.storage.data[chat.PROFILE_KEY].accounts.tuaran.memory.length, 0)
})

test('排班失败写进对话：需要人选择时给选项，自己会恢复的不打扰', async () => {
  const chat = require('../../tools/x-reply-clipboard-extension/agentChat.js')
  const labels = { timeline: '评论首页' }
  assert.equal(chat.alertTurn({ id: 'a1', task: 'timeline', kind: 'self-healed', message: 'x' }, labels), null)
  const failed = chat.alertTurn({ id: 'a2', task: 'timeline', kind: 'retry-exhausted', message: '页内启动失败：MobileOffice 未测试' }, labels)
  assert.equal(failed.alertId, 'a2')
  assert.ok(failed.text.includes('评论首页没有跑成'))
  assert.deepEqual(failed.confirm, ['重新启动评论首页', '模型设置'])
  const limited = chat.alertTurn({ id: 'a3', task: 'timeline', kind: 'rate-limit', message: '受限' }, labels)
  assert.deepEqual(limited.confirm, [])
  assert.equal(chat.routeCommand('重新启动评论首页').intent, 'retry-task')
  assert.equal(chat.routeCommand('模型设置').page, 'model')
})

test('互关发帖：固定三个标签、去掉模型自带标签、拒绝承诺话术，任务模式已注册', async () => {
  const { createRequire } = await import('node:module')
  const require = createRequire(import.meta.url)
  const poster = require('../../tools/x-reply-clipboard-extension/poster.js')
  const marks = require('../../tools/x-reply-clipboard-extension/postPageMarks.js')
  assert.equal(poster.POST_KIND_MUTUAL, 'mutual')
  const text = poster.formatMutualPost('今晚谁还没睡，报个到 👀\n\n评论区聊两句 #互关')
  assert.ok(text.endsWith('\n\n#浇朋友 #互关 #蓝朋友'))
  assert.equal((text.match(/#互关/gu) || []).length, 1)
  assert.equal(poster.formatMutualPost('留一句，我都看'), '')
  assert.equal(poster.formatMutualPost('关注我，必回'), '')
  assert.equal(poster.formatMutualPost(''), '')
  assert.equal(marks.promptKeyForPublished({ postKind: 'mutual' }), 'postMutualPrompt')
  const bg = await readFile(new URL('../../tools/x-reply-clipboard-extension/background.js', import.meta.url), 'utf8')
  assert.match(bg, /const POST_MUTUAL_PROMPT = \[/)
  assert.match(bg, /"poster-mutual": "互关发帖"/)
  assert.match(bg, /const POST_TASKS = \[[^\]]*"poster-mutual"/)
})

test('启动未确认被挂起后倒计时自动重开，系统限制与次数上限除外', async () => {
  const background = await readFile(new URL('../../tools/x-reply-clipboard-extension/background.js', import.meta.url), 'utf8')
  const content = await readFile(new URL('../../tools/x-reply-clipboard-extension/content.js', import.meta.url), 'utf8')
  assert.match(background, /AUTO_REVIVE_DELAY_MS = 3 \* 60 \* 1000/)
  assert.match(background, /AUTO_REVIVE_MAX = 3/)
  assert.match(background, /if \(systemLimitText\(item\.lastStartError, item\.reason\) \|\| Number\(item\.limitedStreak\) > 0\) continue/)
  assert.match(background, /if \(await autoReviveDue\(plan, now\)\) return ENGINE_AGAIN/)
  assert.match(content, /autoReviveAt\) > now \? `\$\{formatCountdown\(Number\(queued\.autoReviveAt\) - now\)\}后自动重新开启/)
})

test('需要选择的失败卡片带倒计时，到点自动按第一个重新启动处理', async () => {
  const chat = await readFile(new URL('../../tools/x-reply-clipboard-extension/agentChat.js', import.meta.url), 'utf8')
  assert.match(chat, /ALERT_AUTO_MS = 3 \* 60 \* 1000/)
  assert.match(chat, /\/\^重新启动\/u\.test\(confirm\[0\] \|\| ""\) \? Date\.now\(\) \+ ALERT_AUTO_MS/)
  assert.match(chat, /first\.click\(\)/)
})

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

test('planner prompt stays separate and falls back DeepSeek, B.AI, MobileOffice, NAS', async () => {
  const planner = require('../../tools/x-reply-clipboard-extension/agentPlanner.js')
  const background = await readFile(new URL('background.js', extensionDir), 'utf8')
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.deepEqual([...planner.PROVIDER_ORDER], ['deepseek', 'bai', 'mobileoffice', 'nas'])
  assert.match(background, /const REPLY_PROVIDER_ORDER = \["mobileoffice", "deepseek", "nas", "bai"\]/)
  assert.match(content, /const REPLY_PROVIDER_ORDER = \["mobileoffice", "deepseek", "nas", "bai"\]/)
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
  assert.deepEqual(calls, ['deepseek', 'bai', 'mobileoffice', 'nas'])
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

test('the frame stays within the viewport and a new thread keeps the old one', async () => {
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
  await home.listeners.click[0]({ target: home.querySelector('[data-xrc-agent-action="threads"]') })
  assert.equal(panel.dataset.xrcAgentFrame, 'dock')
  await home.listeners.click[0]({ target: home.querySelector('[data-xrc-agent-action="new"]') })
  const saved = storage.data[chat.SESSION_KEY]
  assert.equal(saved.threads[0].kind, 'main')
  const created = saved.threads.find((thread) => thread.title === '新会话')
  assert.equal(created.turns.length, 0)
  assert.ok(created.createdAt)
  assert.ok(saved.threads.some((thread) => thread.turns[0]?.text === '现在在干什么'))
  assert.deepEqual(storage.data.xrcAiSettings, { apiKey: 'sk-keep' })
  assert.deepEqual(opened, ['chat', 'chat'])
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
  assert.equal(manifest.version, '5.2.0')
  assert.equal(manifest.name, 'X 大互动智能体')
  assert.ok(scripts.indexOf('agentPlanner.js') < scripts.indexOf('agentChat.js'))
  assert.ok(scripts.indexOf('agentChat.js') < scripts.indexOf('content.js'))
  assert.ok(scripts.indexOf('experiments.js') > scripts.indexOf('content.js'))
  assert.ok(manifest.content_scripts[3].css.includes('agentChat.css'))
  assert.match(readme, /当前本地源码为 v5\.2\.0/)
  assert.match(readme, /v5\.2\.0（2026-11-20，本地测试）/)
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
  assert.match(content, /data-xrc-config-open="prompts"/)
  assert.match(content, /data-xrc-config-open="pace"/)
  assert.match(content, /data-xrc-config-section="prompts"/)
  assert.match(content, /data-xrc-planner-prompt/)
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

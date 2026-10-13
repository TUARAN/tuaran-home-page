import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const core = require('../../tools/juejin-interaction-extension/core.js')
const receipt = require('../../tools/juejin-interaction-extension/receipt.js')
const root = new URL('../../tools/juejin-interaction-extension/', import.meta.url)
const extensionManifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'))

test('daily checkin uses Shanghai date and respects completed day', () => {
  const now = Date.parse('2026-10-12T02:00:00Z')
  const settings = { enabled: { checkin: true } }
  assert.equal(core.dayKey(now), '2026-10-12')
  assert.equal(core.shouldRun('checkin', settings, {}, now), true)
  assert.equal(core.shouldRun('checkin', settings, { checkinDay: '2026-10-12' }, now), false)
  assert.equal(core.shouldRun('checkin', settings, { checkinRetryAt: now + 1000 }, now), false)
})

test('posting pace, pending state and Beijing daily caps prevent extra work', () => {
  const now = 1000000000
  const settings = { enabled: { pin: true, article: true } }
  assert.equal(core.hasApiKey(settings), false)
  assert.equal(core.shouldRun('pin', settings, {}, now), false)
  assert.equal(core.shouldRun('article', settings, {}, now), false)
  settings.apiKey = 'sk-test-123456'
  assert.equal(core.hasApiKey(settings), true)
  assert.equal(core.shouldRun('pin', settings, {}, now), true)
  assert.equal(core.intervalMs('medium', () => 0), 25 * 60000)
  assert.equal(core.intervalMs('turbo', () => 0.9999), 10 * 60000)
  assert.equal(core.shouldRun('pin', settings, { pinPending: 'source-1' }, now), false)
  const state = core.completedState('pin', { pinPending: 'source-1' }, 'medium', now, () => 0)
  assert.equal(state.pinPending, '')
  assert.equal(state.pinNextAt, now + 25 * 60000)
  assert.deepEqual(state.pinDaily, { day: core.dayKey(now), count: 1 })
  assert.equal(core.shouldRun('pin', settings, state, now), false)
  let capped = state
  capped = core.completedState('pin', capped, 'medium', now, () => 0)
  capped = core.completedState('pin', capped, 'medium', now, () => 0)
  assert.equal(core.dailyCount('pin', capped, now), 3)
  assert.equal(core.shouldRun('pin', settings, { ...capped, pinNextAt: 0 }, now), false)
  assert.equal(core.mode(settings), 'daily')
  settings.mode = 'classic'
  assert.equal(core.shouldRun('pin', settings, { ...capped, pinNextAt: 0 }, now), true)
  settings.mode = 'daily'
  assert.equal(core.shouldRun('pin', settings, { ...capped, pinNextAt: 0 }, now + 24 * 60 * 60000), true)
  const article = core.completedState('article', {}, 'slow', now, () => 0)
  assert.equal(core.dailyCount('article', article, now), 1)
  assert.equal(core.dailyCount('article', article, now + 24 * 60 * 60000), 0)
  assert.equal(core.shouldRun('pin', settings, { pinPending: { phase: 'claim', createdAt: now - 16 * 60000 } }, now), true)
})

test('draft validation rejects incomplete or unverifiable content', () => {
  assert.equal(core.draftSavedStatus('文章将自动保存至草稿箱'), false)
  assert.equal(core.draftSavedStatus('保存中…'), false)
  assert.equal(core.draftSavedStatus('已保存至草稿箱'), true)
  assert.throws(() => core.cleanGenerated('{}', 'article'), /来源链接/)
  assert.throws(() => core.cleanGenerated(JSON.stringify({ title: 't', body: '短', sourceUrl: 'https://example.com' }), 'article'), /不完整/)
  const pinBody = '这是一段超过四十字的沸点内容。'.repeat(5)
  const draft = core.cleanGenerated(JSON.stringify({ title: '标题', body: pinBody, sourceUrl: 'https://example.com' }), 'pin')
  assert.equal(draft.body, pinBody)
  assert.equal(draft.sourceUrl, 'https://example.com')
  assert.throws(() => core.cleanGenerated(JSON.stringify({ title: '标题', body: `${pinBody} https://example.com`, sourceUrl: 'https://example.com' }), 'pin'), /不能包含链接/)
  const article = core.cleanGenerated(JSON.stringify({ title: '标题', body: '文章正文。'.repeat(100), sourceUrl: 'https://example.com' }), 'article')
  assert.match(article.body, /来源：https:\/\/example.com/)
})

test('manifest, page selectors and receipt task names cover all three actions', async () => {
  const content = await readFile(new URL('content.js', root), 'utf8')
  assert.equal(extensionManifest.name, '掘金高频互动助手')
  assert.match(extensionManifest.version, /^\d+\.\d+\.\d+$/)
  assert.deepEqual(extensionManifest.content_scripts[0].js, ['receipt.js', 'core.js', 'content.js'])
  assert.match(content, /button\.signin\.btn/)
  assert.match(content, /\.rich-editor\[contenteditable='true'\]/)
  assert.match(content, /input\.title-input/)
  for (const task of ['daily-checkin', 'pin-post', 'article-post']) {
    assert.equal(receipt.normalizeEvent({ task, result: 'success' }).task, task)
  }
})

test('homepage tabs switch panels while starting a task opens its page', async () => {
  const content = await readFile(new URL('content.js', root), 'utf8')
  const mounted = []
  const messages = []
  const store = {}
  const createElement = (tagName) => ({
    tagName, children: [], style: {}, dataset: {}, textContent: '', value: '',
    append(...items) { this.children.push(...items) },
    setAttribute(name, value) { this[name] = value },
  })
  const descendants = (node) => [node, ...(node.children || []).flatMap(descendants)]
  const context = {
    JuejinInteractionCore: core,
    JuejinCommunityReceipt: { heartbeat() {} },
    chrome: {
      storage: { local: {
        async get() { return store },
        async set(value) { Object.assign(store, value) },
      } },
      runtime: { getManifest() { return extensionManifest }, async sendMessage(message) { messages.push(message); return { ok: true } } },
    },
    document: {
      readyState: 'complete',
      body: { append(node) { mounted.push(node) } },
      createElement,
      querySelector() { return null },
    },
    location: { pathname: '/', origin: 'https://juejin.cn' },
    setInterval() {},
  }
  vm.runInNewContext(content, context)
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(mounted.length, 1)
  assert.equal(mounted[0].id, 'jjia-panel')
  assert.equal(descendants(mounted[0]).find((child) => child.className === 'jjia-version')?.textContent, `v${extensionManifest.version} · 本地插件`)
  assert.equal(mounted[0].dataset.needsApi, 'true')
  assert.equal(descendants(mounted[0]).find((child) => child.className === 'jjia-state')?.children[1]?.textContent, '待配置 API')
  const keyInputs = descendants(mounted[0]).filter((child) => child.tagName === 'input' && child.dataset.setting)
  assert.equal(keyInputs.length, 2)
  assert.ok(keyInputs.every((input) => input.type === 'text' && input.autocomplete === 'off'))
  const tabs = descendants(mounted[0]).filter((child) => child.className?.split(' ')[0] === 'jjia-tab')
  assert.equal(tabs.length, 3)
  const taskTitle = descendants(mounted[0]).find((child) => child.className === 'jjia-task-title')
  await tabs.find((tab) => tab.dataset.task === 'article').onclick()
  assert.equal(taskTitle.textContent, '定时写草稿')
  assert.equal(tabs.find((tab) => tab.dataset.task === 'article').className, 'jjia-tab is-active')
  assert.equal(messages.length, 0)
  await tabs.find((tab) => tab.dataset.task === 'checkin').onclick()
  assert.equal(taskTitle.textContent, '每日签到')
  assert.equal(messages.length, 0)
  const taskButton = descendants(mounted[0]).find((child) => child.className === 'jjia-task-button')
  await taskButton.onclick()
  assert.equal(messages[0].type, 'jjia-open-task')
  assert.equal(messages[0].task, 'checkin')
  assert.equal(store.jjiaSettings.enabled.checkin, true)
  assert.equal(mounted[0].dataset.needsApi, 'true')
  const gear = descendants(mounted[0]).find((child) => child.title === '设置')
  gear.onclick()
  const settings = descendants(mounted[0]).find((child) => child.className === 'jjia-settings')
  assert.equal(settings.hidden, false)
  const globalButton = descendants(mounted[0]).find((child) => child.className === 'jjia-global-button')
  await globalButton.onclick()
  assert.equal(store.jjiaSettings.enabled.pin, false)
  assert.equal(store.jjiaSettings.enabled.article, false)
  const apiInput = keyInputs.find((input) => input.dataset.setting === 'apiKey')
  apiInput.value = 'sk-test-123456'
  const save = descendants(mounted[0]).find((child) => child.className === 'jjia-save')
  await save.onclick()
  assert.equal(Object.values(store.jjiaSettings.enabled).filter(Boolean).length, 3)
  assert.deepEqual(messages.slice(1).map((message) => message.task), ['checkin', 'pin', 'article'])
  assert.equal(settings.hidden, true)
  await tabs.find((tab) => tab.dataset.task === 'pin').onclick()
  assert.equal(taskTitle.textContent, '定时发沸点')
  assert.equal(messages.length, 4)
  const pace = descendants(mounted[0]).find((child) => child.className === 'jjia-pace')
  assert.equal(pace.disabled, true)
  await globalButton.onclick()
  assert.equal(Object.values(store.jjiaSettings.enabled).filter(Boolean).length, 0)
  assert.equal(pace.disabled, false)
  gear.onclick()
  const modeButtons = descendants(mounted[0]).filter((child) => child.className === 'jjia-mode-choice')
  await modeButtons.find((button) => button.dataset.mode === 'classic').onclick()
  assert.equal(store.jjiaSettings.mode, 'classic')
  gear.onclick()
  await tabs.find((tab) => tab.dataset.task === 'article').onclick()
  assert.equal(taskTitle.textContent, '定时发文章')
  gear.onclick()
  await modeButtons.find((button) => button.dataset.mode === 'daily').onclick()
  assert.equal(store.jjiaSettings.mode, 'daily')
  assert.equal(taskTitle.textContent, '定时写草稿')
})

async function exerciseArticle(mode) {
  const content = await readFile(new URL('content.js', root), 'utf8')
  const draft = { title: '测试草稿', body: '正文内容'.repeat(120), sourceId: 'source-1' }
  const store = { jjiaSettings: { apiKey: 'sk-test-123456', mode, enabled: { article: true }, pace: { article: 'slow' } }, jjiaState: {} }
  const title = { value: '', dispatchEvent() {} }
  const saveStatus = { textContent: '已保存至草稿箱' }
  const publish = { textContent: '发布', clicks: 0, click() { this.clicks += 1 } }
  const category = { textContent: '人工智能', clicks: 0, click() { this.clicks += 1 } }
  const tag = { textContent: '人工智能', clicks: 0, click() { this.clicks += 1 }, getClientRects() { return [1] } }
  const confirm = { textContent: '确定并发布', clicks: 0, click() { this.clicks += 1 } }
  const redirects = []
  const listeners = []
  const fakeWindow = {
    addEventListener(type, listener) { if (type === 'message') listeners.push(listener) },
    removeEventListener(type, listener) { if (type === 'message') listeners.splice(listeners.indexOf(listener), 1) },
    postMessage(message) {
      if (message.type === 'jjia-set-markdown') {
        const response = { source: fakeWindow, data: { type: 'jjia-markdown-result', nonce: message.nonce, ok: true } }
        for (const listener of [...listeners]) listener(response)
      }
    },
  }
  class FakeInput {}
  Object.defineProperty(FakeInput.prototype, 'value', { set(value) { this._value = value } })
  Object.setPrototypeOf(title, FakeInput.prototype)
  Object.defineProperty(title, 'value', { get() { return this._value || '' }, set(value) { this._value = value } })
  const tagInput = { dispatchEvent() {} }
  const createElement = (tagName) => ({ tagName, children: [], style: {}, dataset: {}, textContent: '', value: '', append(...items) { this.children.push(...items) }, setAttribute() {} })
  const context = {
    JuejinInteractionCore: core,
    JuejinCommunityReceipt: { heartbeat() {}, report() {} },
    chrome: {
      storage: { local: { async get() { return store }, async set(value) { Object.assign(store, value) } } },
      runtime: {
        getManifest() { return extensionManifest },
        async sendMessage(message) {
          if (message.type === 'jjia-claim-task') {
            store.jjiaState.articlePending = { phase: 'claim', claimId: 'claim-1', createdAt: Date.now() }
            return { ok: true, claimId: 'claim-1' }
          }
          if (message.type === 'jjia-generate') return { ok: true, draft }
          if (message.type === 'jjia-mark-pending') {
            store.jjiaState.articlePending = { claimId: message.claimId, sourceId: message.sourceId, marker: message.marker, mode: message.mode }
            return { ok: true }
          }
          if (message.type === 'jjia-complete-task') {
            store.jjiaState = core.completedState('article', store.jjiaState, 'slow')
            return { ok: true }
          }
          return { ok: false }
        },
      },
    },
    document: {
      readyState: 'complete', body: { append() {} }, createElement,
      querySelector(selector) {
        if (selector.startsWith('input.title-input')) return title
        if (selector === '.CodeMirror') return { CodeMirror: { getValue() { return '' } } }
        if (selector === '.editor-header .status-text') return saveStatus
        if (selector === '.publish-popup .category-list') return category
        if (selector === '.tag-input input.byte-select__input') return tagInput
        return null
      },
      querySelectorAll(selector) {
        if (selector === '.editor-header button') return [publish]
        if (selector === '.category-list .item') return [category]
        if (selector === '.publish-popup button') return [confirm]
        if (selector.includes('.byte-select__option')) return [tag]
        return []
      },
    },
    HTMLInputElement: FakeInput,
    Event: class {},
    window: fakeWindow,
    crypto: { randomUUID() { return 'nonce-1' } },
    location: { pathname: '/editor/drafts/new', origin: 'https://juejin.cn', assign(url) { redirects.push(url) } },
    setInterval() {},
    setTimeout(callback, ms) { if (ms < 5000) queueMicrotask(callback); return 1 },
    clearTimeout() {},
  }
  vm.runInNewContext(content, context)
  for (let index = 0; index < 8; index += 1) await new Promise((resolve) => setImmediate(resolve))
  return { store, publish, category, tag, confirm, redirects }
}

test('daily mode saves an article draft and never clicks publish', async () => {
  const { store, publish, redirects } = await exerciseArticle('daily')
  assert.equal(publish.clicks, 0)
  assert.equal(core.dailyCount('article', store.jjiaState), 1)
  assert.equal(store.jjiaState.articlePending, '')
  assert.deepEqual(redirects, ['https://juejin.cn/editor/drafts?v=2'])
})

test('classic mode opens article publishing flow and waits for confirmation', async () => {
  const { store, publish, category, tag, confirm, redirects } = await exerciseArticle('classic')
  assert.equal(publish.clicks, 1)
  assert.equal(category.clicks, 1)
  assert.equal(tag.clicks, 1)
  assert.equal(confirm.clicks, 1)
  assert.equal(core.dailyCount('article', store.jjiaState), 0)
  assert.equal(store.jjiaState.articlePending.mode, 'classic')
  assert.deepEqual(redirects, [])
})

test('background serializes claims and stops after three completed pins', async () => {
  const source = await readFile(new URL('background.js', root), 'utf8')
  const store = { jjiaSettings: { apiKey: 'sk-test-123456', enabled: { pin: true } }, jjiaState: {} }
  let listener
  let serial = 0
  vm.runInNewContext(source, {
    importScripts() {}, JuejinInteractionCore: core, JuejinCommunityReceipt: { install() {} },
    crypto: { randomUUID() { serial += 1; return `claim-${serial}` } },
    chrome: {
      storage: { local: { async get() { return store }, async set(value) { Object.assign(store, value) } } },
      runtime: { onMessage: { addListener(value) { listener = value } } },
      alarms: { create() {}, onAlarm: { addListener() {} } },
    },
  })
  const send = (message) => new Promise((resolve) => listener(message, {}, resolve))
  const firstPair = await Promise.all([send({ type: 'jjia-claim-task', task: 'pin' }), send({ type: 'jjia-claim-task', task: 'pin' })])
  assert.equal(firstPair.filter((item) => item.ok).length, 1)
  for (let count = 1; count <= 3; count += 1) {
    const claim = count === 1 ? firstPair.find((item) => item.ok) : await send({ type: 'jjia-claim-task', task: 'pin' })
    assert.equal(claim.ok, true)
    assert.equal((await send({ type: 'jjia-mark-pending', task: 'pin', claimId: claim.claimId, sourceId: `source-${count}`, marker: `pin-${count}` })).ok, true)
    assert.equal((await send({ type: 'jjia-complete-task', task: 'pin', claimId: claim.claimId })).ok, true)
    store.jjiaState.pinNextAt = 0
  }
  assert.equal(core.dailyCount('pin', store.jjiaState), 3)
  assert.equal((await send({ type: 'jjia-claim-task', task: 'pin' })).ok, false)
  store.jjiaSettings.mode = 'classic'
  store.jjiaState.pinNextAt = 0
  assert.equal((await send({ type: 'jjia-claim-task', task: 'pin' })).ok, true)
})

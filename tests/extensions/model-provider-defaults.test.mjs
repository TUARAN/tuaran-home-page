import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const contentPromise = readFile(new URL('../../tools/x-reply-clipboard-extension/content.js', import.meta.url), 'utf8')
const backgroundPromise = readFile(new URL('../../tools/x-reply-clipboard-extension/background.js', import.meta.url), 'utf8')

function modelFunctions(source, values = {}) {
  const start = source.indexOf('  function resolveReplyProviders(settings) {')
  const end = source.indexOf('  function showModelSaveNotice(', start)
  const saveStart = source.indexOf('  async function saveSingleApiKey(panel, which) {')
  const saveEnd = source.indexOf('  async function saveConfigForm(', saveStart)
  assert.ok(start >= 0 && end > start && saveStart >= 0 && saveEnd > saveStart)
  const context = {
    REPLY_PROVIDER_ORDER: ['mobileoffice', 'deepseek', 'nas', 'bai'],
    DEFAULT_REPLY_PROVIDERS: [],
    validDeepSeekApiKey: (value) => /^sk-\S{8,}$/u.test(value),
    ...values,
  }
  vm.createContext(context)
  vm.runInContext(`${source.slice(start, end)}\n${source.slice(saveStart, saveEnd)}`, context)
  return context
}

function modelLoader(source, values = {}) {
  const resolveStart = source.indexOf('  function resolveReplyProviders(settings) {')
  const resolveEnd = source.indexOf('  function showModelSaveNotice(', resolveStart)
  const loadStart = source.indexOf('  async function loadAiSettings() {')
  const loadEnd = source.indexOf('  async function loadSchedulePace(', loadStart)
  assert.ok(resolveStart >= 0 && resolveEnd > resolveStart && loadStart >= 0 && loadEnd > loadStart)
  const context = {
    REPLY_PROVIDER_ORDER: ['mobileoffice', 'deepseek', 'nas', 'bai'],
    DEFAULT_REPLY_PROVIDERS: [],
    REPLY_PROVIDERS_DEFAULT_VERSION: 2,
    validDeepSeekApiKey: (value) => /^sk-\S{8,}$/u.test(value),
    validReplyMode: (value) => value,
    setTimeout,
    clearTimeout,
    ...values,
  }
  vm.createContext(context)
  vm.runInContext(`let aiSettingsReadId = 0;\n${source.slice(resolveStart, resolveEnd)}\n${source.slice(loadStart, loadEnd)}`, context)
  return context
}

test('a new install starts with no reply provider selected and uses a general setup prompt', async () => {
  const content = await contentPromise
  assert.match(content, /const DEFAULT_REPLY_PROVIDERS = \[\]/)
  assert.match(content, /replyProviders: \[\]/)
  for (const provider of ['mobileoffice', 'deepseek', 'nas', 'bai']) {
    const input = content.match(new RegExp(`<input[^>]*data-xrc-reply-provider="${provider}"[^>]*>`))?.[0]
    assert.ok(input, `missing ${provider} checkbox`)
    assert.doesNotMatch(input, /\bchecked\b/)
  }
  assert.match(content, /尚未启用回复模型 · 点击前往模型设置/)
  assert.doesNotMatch(content, /尚未配置 DeepSeek API Key · 点击前往模型设置/)
  const model = content.slice(content.indexOf('data-xrc-config-section="model"'))
  const deepseekBox = model.indexOf('data-xrc-reply-provider="deepseek"')
  const deepseekKey = model.indexOf('data-xrc-config-key')
  const nasBox = model.indexOf('data-xrc-reply-provider="nas"')
  const nasKey = model.indexOf('data-xrc-nas-secret')
  const baiBox = model.indexOf('data-xrc-reply-provider="bai"')
  const baiKey = model.indexOf('data-xrc-config-bai-key')
  assert.ok(deepseekBox < deepseekKey && deepseekKey < nasBox)
  assert.ok(nasBox < nasKey && nasKey < baiBox && baiBox < baiKey)
})

test('a saved check and key are used, while a key or receipt alone does not turn a model on', async () => {
  const { resolveReplyProviders } = modelFunctions(await contentPromise)
  assert.deepEqual(Array.from(resolveReplyProviders({}).providers), [])
  assert.deepEqual(Array.from(resolveReplyProviders({ apiKey: 'sk-12345678', replyProviders: [] }).providers), [])
  assert.deepEqual(Array.from(resolveReplyProviders({ apiKey: 'sk-12345678', replyProviders: ['deepseek'], replyProvidersManual: true }).providers), ['deepseek'])
  assert.equal(resolveReplyProviders({ apiKey: 'sk-12345678', replyProviders: ['deepseek'], replyProvidersManual: true }).persist, false)
  assert.deepEqual(Array.from(resolveReplyProviders({ apiKey: 'sk-12345678', replyProviders: ['deepseek'], replyProvidersManual: true, replyProvidersDisabled: ['deepseek'] }).providers), [])
  assert.deepEqual(Array.from(resolveReplyProviders({ baiApiKey: 'sk-abcdefgh', replyProviders: ['bai'], replyProvidersManual: true }).providers), ['bai'])
  assert.deepEqual(Array.from(resolveReplyProviders({ nasSecretAvailable: true, replyProviders: ['nas'] }).providers), [])
  assert.deepEqual(Array.from(resolveReplyProviders({ nasSecretAvailable: true, replyProviders: ['nas'], replyProvidersManual: true }).providers), ['nas'])
  assert.deepEqual(Array.from(resolveReplyProviders({ nasSecretAvailable: true, replyProviders: ['nas'], replyProvidersManual: true, replyProvidersDisabled: ['nas'] }).providers), [])
})

test('background model selection agrees with the panel for saved keys and opt-outs', async () => {
  const source = await backgroundPromise
  const start = source.indexOf('function resolveReplyProviders(settings) {')
  const end = source.indexOf('async function readAiSettings()', start)
  assert.ok(start >= 0 && end > start)
  const context = { REPLY_PROVIDER_ORDER: ['mobileoffice', 'deepseek', 'nas', 'bai'], DEFAULT_REPLY_PROVIDERS: [] }
  vm.createContext(context)
  vm.runInContext(source.slice(start, end), context)
  const saved = { apiKey: 'sk-12345678', replyProviders: ['deepseek'], replyProvidersManual: true }
  assert.deepEqual(Array.from(context.resolveReplyProviders(saved).providers), ['deepseek'])
  assert.deepEqual(Array.from(context.resolveReplyProviders({ ...saved, replyProvidersDisabled: ['deepseek'] }).providers), [])
  assert.deepEqual(Array.from(context.resolveReplyProviders({ nasSecretAvailable: true, replyProviders: ['nas'] }).providers), [])
  assert.deepEqual(Array.from(context.resolveReplyProviders({ nasSecretAvailable: true, replyProviders: ['nas'], replyProvidersManual: true }).providers), ['nas'])
  assert.deepEqual(Array.from(context.resolveReplyProviders({ nasSecretAvailable: true, replyProviders: ['nas'], replyProvidersManual: true, replyProvidersDisabled: ['nas'] }).providers), [])
})

for (const [provider, keySelector] of [['deepseek', '[data-xrc-config-key]'], ['bai', '[data-xrc-config-bai-key]']]) {
  test(`saving a valid ${provider} key also selects its model in storage and the open panel`, async () => {
    let settings = { replyProviders: [], replyProvidersDisabled: [provider] }
    let renders = 0
    const chrome = { storage: { local: {
      get: async () => ({ xrcAiSettings: settings }),
      set: async ({ xrcAiSettings }) => { settings = xrcAiSettings },
    } } }
    const state = { replyProviders: [], aiSettingsStatus: 'loading' }
    const loadAiSettings = async () => {
      state.replyProviders = settings.replyProviders
      state.aiSettingsStatus = 'ready'
    }
    const { saveSingleApiKey } = modelFunctions(await contentPromise, {
      chrome, globalThis: { chrome }, state, loadAiSettings, renderPanel: () => { renders += 1 },
    })
    const checkbox = { checked: false }
    const panel = { querySelector: (selector) => {
      if (selector === keySelector) return { value: 'sk-12345678' }
      if (selector === `[data-xrc-reply-provider="${provider}"]`) return checkbox
      return { textContent: '' }
    } }

    assert.equal(await saveSingleApiKey(panel, provider), true)
    assert.deepEqual(Array.from(settings.replyProviders), [])
    checkbox.checked = true
    assert.equal(await saveSingleApiKey(panel, provider), true)
    assert.deepEqual(Array.from(settings.replyProviders), [provider])
    assert.deepEqual(Array.from(state.replyProviders), [provider])
    assert.equal(settings.replyProvidersManual, true)
    assert.deepEqual(Array.from(settings.replyProvidersDisabled), [])
    assert.equal(checkbox.checked, true)
    assert.equal(renders, 2)
  })
}

test('the home prompt waits until saved keys and receipt settings finish loading', async () => {
  let finishStorage
  let finishReceipt
  const storageRead = new Promise((resolve) => { finishStorage = resolve })
  const receiptRead = new Promise((resolve) => { finishReceipt = resolve })
  const chrome = { storage: { local: {
    get: async () => storageRead,
    set: async () => {},
  } } }
  const state = { replyMode: 'ai', aiSettingsStatus: 'loading' }
  const { loadAiSettings } = modelLoader(await contentPromise, {
    chrome,
    globalThis: { chrome, XrcCommunityReceipt: { readSecret: () => receiptRead } },
    state,
  })

  const loading = loadAiSettings()
  assert.equal(state.aiSettingsStatus, 'loading')
  finishStorage({ xrcAiSettings: { apiKey: 'sk-12345678', replyProviders: [] } })
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(state.aiSettingsStatus, 'loading')
  finishReceipt('saved-receipt-secret')
  await loading
  assert.equal(state.aiSettingsStatus, 'ready')
  assert.deepEqual(Array.from(state.replyProviders), [])
  assert.equal(state.aiKeySaved, true)
  assert.equal(state.nasSecretAvailable, true)
})

test('model settings stop waiting when storage does not answer', async () => {
  const chrome = { storage: { local: {
    get: () => new Promise(() => {}),
    set: async () => {},
  } } }
  const state = {
    replyMode: 'ai',
    aiSettingsStatus: 'loading',
    replyProviders: [],
    aiKeySaved: false,
    mobileOfficeVerified: false,
    nasSecretAvailable: false,
    baiKey: '',
  }
  const { loadAiSettings } = modelLoader(await contentPromise, {
    chrome,
    globalThis: { chrome },
    state,
  })
  const started = Date.now()
  await loadAiSettings()
  assert.ok(Date.now() - started < 4000)
  assert.equal(state.aiSettingsStatus, 'deferred')
})

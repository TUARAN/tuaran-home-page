import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const contentPromise = readFile(new URL('../../tools/x-reply-clipboard-extension/content.js', import.meta.url), 'utf8')
const backgroundPromise = readFile(new URL('../../tools/x-reply-clipboard-extension/background.js', import.meta.url), 'utf8')

const PROVIDER_ORDER = ['deepseek', 'bai', 'nas', 'mobileoffice']

function modelFunctions(source, values = {}) {
  const start = source.indexOf('  function resolveReplyProviders(settings) {')
  const end = source.indexOf('  function showModelSaveNotice(', start)
  const saveStart = source.indexOf('  function providerLabel(which) {')
  const saveEnd = source.indexOf('  async function saveConfigForm(', saveStart)
  assert.ok(start >= 0 && end > start && saveStart >= 0 && saveEnd > saveStart)
  const context = {
    REPLY_PROVIDER_ORDER: PROVIDER_ORDER,
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
    REPLY_PROVIDER_ORDER: PROVIDER_ORDER,
    DEFAULT_REPLY_PROVIDERS: [],
    REPLY_PROVIDERS_DEFAULT_VERSION: 3,
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

test('a new install starts with no reply provider and keeps the fixed fallback order', async () => {
  const content = await contentPromise
  const background = await backgroundPromise
  assert.match(content, /const DEFAULT_REPLY_PROVIDERS = \[\]/)
  assert.match(content, /const REPLY_PROVIDER_ORDER = \["deepseek", "bai", "nas", "mobileoffice"\]/)
  assert.match(background, /const REPLY_PROVIDER_ORDER = \["deepseek", "bai", "nas", "mobileoffice"\]/)
  assert.match(content, /replyProviders: \[\]/)
  assert.match(content, /尚未启用回复模型 · 点击前往模型设置/)
  assert.doesNotMatch(content, /尚未配置 DeepSeek API Key · 点击前往模型设置/)
})

test('model settings drop the checkbox and enable on save', async () => {
  const content = await contentPromise
  assert.doesNotMatch(content, /data-xrc-reply-provider/)
  for (const provider of PROVIDER_ORDER) {
    assert.match(content, new RegExp(`data-xrc-provider-state="${provider}"`), `missing ${provider} state chip`)
    assert.match(content, new RegExp(`data-xrc-provider-off="${provider}"`), `missing ${provider} stop button`)
    assert.match(content, new RegExp(`data-xrc-key-save="${provider}"[^>]*>保存并启用<`), `missing ${provider} save button`)
  }
  const model = content.slice(content.indexOf('data-xrc-config-section="model"'))
  const deepseekKey = model.indexOf('data-xrc-config-key')
  const baiKey = model.indexOf('data-xrc-config-bai-key')
  const nasKey = model.indexOf('data-xrc-nas-secret')
  const mobileOffice = model.indexOf('data-xrc-mobileoffice-token')
  assert.ok(deepseekKey < baiKey && baiKey < nasKey && nasKey < mobileOffice, 'provider rows must follow the fallback order')
  assert.match(content, /保存即启用，不需要另外勾选/)
})

test('a saved key turns the provider on, while a stop keeps the key but drops it from the chain', async () => {
  const { resolveReplyProviders } = modelFunctions(await contentPromise)
  assert.deepEqual(Array.from(resolveReplyProviders({}).providers), [])
  assert.deepEqual(Array.from(resolveReplyProviders({ apiKey: 'sk-12345678', replyProviders: [] }).providers), ['deepseek'])
  const derived = resolveReplyProviders({ apiKey: 'sk-12345678' })
  assert.deepEqual(Array.from(derived.providers), ['deepseek'])
  assert.equal(derived.persist, true)
  assert.deepEqual(Array.from(resolveReplyProviders({ apiKey: 'sk-12345678', replyProviders: ['deepseek'], replyProvidersDisabled: ['deepseek'] }).providers), [])
  assert.deepEqual(Array.from(resolveReplyProviders({ apiKey: 'sk-12345678', baiApiKey: 'sk-abcdefgh', replyProviders: ['deepseek', 'bai'] }).providers), ['deepseek', 'bai'])
  assert.deepEqual(Array.from(resolveReplyProviders({ baiApiKey: 'sk-abcdefgh' }).providers), ['bai'])
  assert.deepEqual(Array.from(resolveReplyProviders({ mobileOfficeToken: 'token-value', replyProviders: ['mobileoffice'] }).providers), ['mobileoffice'])
  assert.deepEqual(Array.from(resolveReplyProviders({ nasSecretAvailable: true }).providers), [])
  assert.deepEqual(Array.from(resolveReplyProviders({ nasSecretAvailable: true, replyProviders: ['nas'] }).providers), ['nas'])
  assert.deepEqual(Array.from(resolveReplyProviders({ nasSecretAvailable: true, replyProviders: ['nas'], replyProvidersDisabled: ['nas'] }).providers), [])
})

test('background model selection agrees with the panel for saved keys and opt-outs', async () => {
  const source = await backgroundPromise
  const start = source.indexOf('function resolveReplyProviders(settings) {')
  const end = source.indexOf('async function readAiSettings()', start)
  assert.ok(start >= 0 && end > start)
  const context = { REPLY_PROVIDER_ORDER: PROVIDER_ORDER, DEFAULT_REPLY_PROVIDERS: [] }
  vm.createContext(context)
  vm.runInContext(source.slice(start, end), context)
  assert.deepEqual(Array.from(context.resolveReplyProviders({ apiKey: 'sk-12345678', replyProviders: [] }).providers), ['deepseek'])
  assert.deepEqual(Array.from(context.resolveReplyProviders({ apiKey: 'sk-12345678', replyProviders: ['deepseek'], replyProvidersDisabled: ['deepseek'] }).providers), [])
  assert.deepEqual(Array.from(context.resolveReplyProviders({ apiKey: 'sk-12345678', baiApiKey: 'sk-abcdefgh', replyProviders: ['deepseek', 'bai'] }).providers), ['deepseek', 'bai'])
  assert.deepEqual(Array.from(context.resolveReplyProviders({ mobileOfficeToken: 'token-value', replyProviders: ['mobileoffice'] }).providers), ['mobileoffice'])
  assert.deepEqual(Array.from(context.resolveReplyProviders({ nasSecretAvailable: true }).providers), [])
  assert.deepEqual(Array.from(context.resolveReplyProviders({ nasSecretAvailable: true, replyProviders: ['nas'] }).providers), ['nas'])
  assert.deepEqual(Array.from(context.resolveReplyProviders({ nasSecretAvailable: true, replyProviders: ['nas'], replyProvidersDisabled: ['nas'] }).providers), [])
})

for (const [provider, keySelector, value] of [['deepseek', '[data-xrc-config-key]', 'sk-12345678'], ['bai', '[data-xrc-config-bai-key]', 'sk-abcdefgh']]) {
  test(`saving a valid ${provider} key turns it on without a checkbox, and stopping turns it off`, async () => {
    let settings = { replyProviders: [], replyProvidersDisabled: [provider] }
    let renders = 0
    const chrome = { storage: { local: {
      get: async () => ({ xrcAiSettings: settings }),
      set: async ({ xrcAiSettings }) => { settings = xrcAiSettings },
    } } }
    const state = { replyProviders: [], aiSettingsStatus: 'ready' }
    const loadAiSettings = async () => {
      state.replyProviders = settings.replyProviders
      state.aiSettingsStatus = 'ready'
    }
    const { saveSingleApiKey, stopReplyProvider } = modelFunctions(await contentPromise, {
      chrome, globalThis: { chrome }, state, loadAiSettings, renderPanel: () => { renders += 1 },
    })
    const panel = { querySelector: (selector) => {
      if (selector === keySelector) return { value }
      return { textContent: '' }
    } }

    assert.equal(await saveSingleApiKey(panel, provider), true)
    assert.deepEqual(Array.from(settings.replyProviders), [provider])
    assert.deepEqual(Array.from(state.replyProviders), [provider])
    assert.deepEqual(Array.from(settings.replyProvidersDisabled), [])
    assert.equal(settings.replyProvidersManual, undefined)

    assert.equal(await stopReplyProvider(panel, provider), true)
    assert.deepEqual(Array.from(settings.replyProviders), [])
    assert.deepEqual(Array.from(state.replyProviders), [])
    assert.deepEqual(Array.from(settings.replyProvidersDisabled), [provider])
    assert.equal(renders, 2)
  })
}

test('saving an invalid key is refused instead of turning the provider on', async () => {
  let settings = {}
  const chrome = { storage: { local: {
    get: async () => ({ xrcAiSettings: settings }),
    set: async ({ xrcAiSettings }) => { settings = xrcAiSettings },
  } } }
  const { saveSingleApiKey } = modelFunctions(await contentPromise, {
    chrome,
    globalThis: { chrome },
    state: { replyProviders: [] },
    loadAiSettings: async () => {},
    renderPanel: () => {},
  })
  const panel = { querySelector: (selector) => (selector === '[data-xrc-config-key]' ? { value: 'not-a-key' } : { textContent: '' }) }
  assert.equal(await saveSingleApiKey(panel, 'deepseek'), false)
  assert.deepEqual(settings, {})
})

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
  assert.deepEqual(Array.from(state.replyProviders), ['deepseek'])
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

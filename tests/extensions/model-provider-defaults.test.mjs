import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const contentPromise = readFile(new URL('../../tools/x-reply-clipboard-extension/content.js', import.meta.url), 'utf8')

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
})

test('saved credentials enable their provider once, but an explicit all-off choice remains off', async () => {
  const { resolveReplyProviders } = modelFunctions(await contentPromise)
  assert.deepEqual(Array.from(resolveReplyProviders({}).providers), [])
  const oldSettings = { apiKey: 'sk-12345678', replyProviders: [] }
  assert.deepEqual(Array.from(resolveReplyProviders(oldSettings).providers), ['deepseek'])
  assert.equal(resolveReplyProviders(oldSettings).persist, true)
  assert.deepEqual(Array.from(resolveReplyProviders({ ...oldSettings, replyProvidersManual: true }).providers), [])
  assert.deepEqual(Array.from(resolveReplyProviders({ baiApiKey: 'sk-abcdefgh', replyProviders: [] }).providers), ['bai'])
})

test('saving a valid DeepSeek key also selects DeepSeek in storage and panel state', async () => {
  let settings = { replyProviders: [] }
  const chrome = { storage: { local: {
    get: async () => ({ xrcAiSettings: settings }),
    set: async ({ xrcAiSettings }) => { settings = xrcAiSettings },
  } } }
  const state = { replyProviders: [], aiSettingsStatus: 'loading' }
  const loadAiSettings = async () => {
    state.replyProviders = settings.replyProviders
    state.aiSettingsStatus = 'ready'
  }
  const { saveSingleApiKey } = modelFunctions(await contentPromise, { chrome, globalThis: { chrome }, state, loadAiSettings })
  const panel = { querySelector: (selector) => selector === '[data-xrc-config-key]' ? { value: 'sk-12345678' } : { textContent: '' } }

  assert.equal(await saveSingleApiKey(panel, 'deepseek'), true)
  assert.deepEqual(Array.from(settings.replyProviders), ['deepseek'])
  assert.deepEqual(Array.from(state.replyProviders), ['deepseek'])
  assert.equal(settings.replyProvidersManual, true)
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

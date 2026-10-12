import test from 'node:test'
import assert from 'node:assert/strict'

import {
  decryptApiKey,
  encryptApiKey,
  isDeepSeekSiteSource,
  maskApiKey,
  parseBindings,
  pickBestKeyRow,
  pickResolvedKeyRow,
  resolveDeepSeekModel,
} from '../lib/ai/deepseekKeysCore.js'

test('maskApiKey 只保留首尾各 4 位', () => {
  assert.equal(maskApiKey('sk-abcdefgh12345678'), 'sk-a****5678')
  assert.equal(maskApiKey('short'), '***')
  assert.equal(maskApiKey(''), '***')
})

test('encrypt/decrypt API Key 往返一致', async () => {
  const secret = 'unit-test-master-secret-0123456789abcdef'
  const key = 'sk-proj-abcdef1234567890' // gitleaks:allow — fixed non-production test fixture
  const cipher = await encryptApiKey(key, secret)
  assert.ok(cipher.includes('"v":1'))
  assert.ok(!cipher.includes(key))
  const plain = await decryptApiKey(cipher, secret)
  assert.equal(plain, key)
})

test('加密主密钥不一致时解密失败', async () => {
  const cipher = await encryptApiKey('sk-abcdefgh12345678', 'secret-a')
  await assert.rejects(() => decryptApiKey(cipher, 'secret-b'))
})

test('parseBindings 清理非法输入', () => {
  assert.deepEqual(parseBindings('[{"source":"a-share-research","taskType":"daily-draft"}]'), [
    { source: 'a-share-research', taskType: 'daily-draft' },
  ])
  assert.deepEqual(parseBindings('[{"source":"","taskType":"x"},{"source": null}]'), [])
  assert.deepEqual(parseBindings('not-json'), [])
  assert.deepEqual(parseBindings('{}'), [])
})

function row(id, bindings) {
  return { id, bound_tasks: JSON.stringify(bindings), name: id }
}

test('pickBestKeyRow 精确绑定 > source 绑定 > 全局兜底', () => {
  const rows = [
    row('global', []),
    row('source-only', [{ source: 'a-share-research' }]),
    row('exact', [{ source: 'a-share-research', taskType: 'daily-draft' }]),
  ]
  assert.equal(pickBestKeyRow(rows, 'a-share-research', 'daily-draft').id, 'exact')
  assert.equal(pickBestKeyRow(rows, 'a-share-research', 'other-type').id, 'source-only')
  assert.equal(pickBestKeyRow(rows, 'stock-analysis', 'horizontal-analysis').id, 'global')
})

test('站内互动绑定只供站内机器人使用', () => {
  const rows = [row('site-bot-key', [{ source: 'engagement-bot' }])]
  assert.equal(isDeepSeekSiteSource('engagement-bot'), true)
  assert.equal(isDeepSeekSiteSource('juejin-interaction-extension'), false)
  assert.equal(pickBestKeyRow(rows, 'engagement-bot', 'comment').id, 'site-bot-key')
  assert.equal(pickBestKeyRow(rows, 'stock-analysis', 'horizontal-analysis'), null)
  assert.equal(pickBestKeyRow(rows, 'admin-model-dispatch', 'planning'), null)
})

test('站外互动插件密钥不会被站内机器人或其他插件选中', () => {
  const rows = [row('juejin-key', [{ source: 'juejin-interaction-extension' }])]
  assert.equal(pickResolvedKeyRow(rows, 'juejin-interaction-extension', ''), rows[0])
  assert.equal(pickResolvedKeyRow(rows, 'engagement-bot', 'comment'), null)
  assert.equal(pickResolvedKeyRow(rows, 'x-reply-clipboard-extension', ''), null)
})

test('pickBestKeyRow 非公用 source 无匹配时返回 null', () => {
  const rows = [row('source-only', [{ source: 'a-share-research' }])]
  assert.equal(pickBestKeyRow(rows, 'custom-private-job', 'run'), null)
  assert.equal(pickBestKeyRow([], 'a-share-research', 'daily-draft'), null)
})

test('无绑定匹配时不使用最近更新的专用密钥', () => {
  const rows = [row('juejin-key', [{ source: 'engagement-bot' }])]
  assert.equal(pickResolvedKeyRow(rows, 'custom-private-job', 'run'), null)
  assert.equal(pickResolvedKeyRow(rows, 'a-share-research', 'daily-draft'), null)
  assert.equal(pickResolvedKeyRow([], 'engagement-bot', 'comment'), null)
})

test('全站默认 flash，密钥 default_model 不会改成 pro', () => {
  assert.equal(
    resolveDeepSeekModel({
      taskDefaultModel: 'deepseek-v4-flash',
    }),
    'deepseek-v4-flash',
  )
  assert.equal(resolveDeepSeekModel({}), 'deepseek-v4-flash')
  assert.equal(
    resolveDeepSeekModel({
      model: 'deepseek-v4-pro',
      taskDefaultModel: 'deepseek-v4-flash',
    }),
    'deepseek-v4-pro',
  )
})

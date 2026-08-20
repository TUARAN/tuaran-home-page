import test from 'node:test'
import assert from 'node:assert/strict'

import {
  decryptApiKey,
  encryptApiKey,
  isDeepSeekSharedSource,
  maskApiKey,
  parseBindings,
  pickBestKeyRow,
  pickResolvedKeyRow,
  resolveDeepSeekModel,
} from '../lib/deepseekKeysCore.js'

test('maskApiKey 只保留首尾各 4 位', () => {
  assert.equal(maskApiKey('sk-abcdefgh12345678'), 'sk-a****5678')
  assert.equal(maskApiKey('short'), '***')
  assert.equal(maskApiKey(''), '***')
})

test('encrypt/decrypt API Key 往返一致', async () => {
  const secret = 'unit-test-master-secret-0123456789abcdef'
  const key = 'sk-proj-abcdef1234567890'
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

test('公用任务共用已绑定到任一公用 source 的密钥', () => {
  const rows = [row('site-key', [{ source: 'a-share-research' }, { source: 'x-daily-greeting' }])]
  assert.equal(isDeepSeekSharedSource('engagement-bot'), true)
  assert.equal(pickBestKeyRow(rows, 'engagement-bot', 'comment').id, 'site-key')
  assert.equal(pickBestKeyRow(rows, 'stock-analysis', 'horizontal-analysis').id, 'site-key')
  assert.equal(pickBestKeyRow(rows, 'admin-model-dispatch', 'planning').id, 'site-key')
})

test('pickBestKeyRow 非公用 source 无匹配时返回 null', () => {
  const rows = [row('source-only', [{ source: 'a-share-research' }])]
  assert.equal(pickBestKeyRow(rows, 'custom-private-job', 'run'), null)
  assert.equal(pickBestKeyRow([], 'a-share-research', 'daily-draft'), null)
})

test('无绑定匹配时可用最近更新的启用密钥作全站兜底', () => {
  const rows = [row('site-key', [{ source: 'a-share-research' }])]
  assert.equal(pickResolvedKeyRow(rows, 'custom-private-job', 'run'), null)
  assert.equal(pickResolvedKeyRow(rows, 'custom-private-job', 'run', { allowLastResort: true }).id, 'site-key')
  assert.equal(pickResolvedKeyRow([], 'engagement-bot', 'comment', { allowLastResort: true }), null)
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

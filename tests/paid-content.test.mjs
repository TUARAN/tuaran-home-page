import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import { md5 } from '../lib/pay/md5.mjs'
import { buildSign, verifySign, fenToYuan } from '../lib/pay/gateways/xunhupay.js'
import { newOrderNo, isAmountMatch, normalizeResourceKey, canReuseOrder } from '../lib/pay/rules.mjs'

test('md5 与 node:crypto 对齐（含 UTF-8）', () => {
  const samples = [
    '',
    'abc',
    'The quick brown fox jumps over the lazy dog',
    'a=1&b=2&key=secret',
    '中文标题 10 元',
    'notify_url=https://2aran.com/api/pay/notify',
  ]
  for (const sample of samples) {
    const expected = createHash('md5').update(sample, 'utf8').digest('hex')
    assert.equal(md5(sample), expected, `md5 不一致：${sample}`)
  }
})

test('md5 长度与多块边界', () => {
  for (const length of [55, 56, 63, 64, 65, 119, 120, 128]) {
    const input = 'x'.repeat(length)
    const expected = createHash('md5').update(input, 'utf8').digest('hex')
    assert.equal(md5(input), expected, `长度 ${length} 不一致`)
  }
})

test('签名忽略空值与 hash，按字典序拼接', () => {
  const params = { b: '2', a: '1', empty: '', hash: 'should-be-ignored', nil: null }
  const sign = buildSign(params, 'secret')
  const expected = createHash('md5').update('a=1&b=2&key=secret', 'utf8').digest('hex')
  assert.equal(sign, expected)
})

test('签名顺序变化不影响结果', () => {
  const left = buildSign({ a: '1', b: '2' }, 'k')
  const right = buildSign({ b: '2', a: '1' }, 'k')
  assert.equal(left, right)
})

test('验签拒绝被篡改的参数', () => {
  const params = { a: '1', b: '2' }
  const sign = buildSign(params, 'secret')
  assert.equal(verifySign({ ...params, hash: sign }, 'secret'), true)
  assert.equal(verifySign({ ...params, b: '3', hash: sign }, 'secret'), false)
  assert.equal(verifySign({ ...params, hash: sign }, 'wrong'), false)
})

test('订单号格式稳定且不重复', () => {
  const seen = new Set()
  for (let i = 0; i < 500; i += 1) {
    const no = newOrderNo()
    assert.match(no, /^T\d{14}[a-z0-9]{6}$/, no)
    assert.ok(no.length <= 32)
    seen.add(no)
  }
  assert.ok(seen.size > 480, '订单号重复率过高')
})

test('金额比对能识别分与元的换算', () => {
  assert.equal(isAmountMatch(1000, '10.00'), true)
  assert.equal(isAmountMatch(1000, '10'), true)
  assert.equal(isAmountMatch(1000, 10), true)
  assert.equal(isAmountMatch(1000, '0.01'), false)
  assert.equal(isAmountMatch(1000, '1000'), false)
  assert.equal(isAmountMatch(0, '10.00'), false)
  assert.equal(isAmountMatch(1000, ''), false)
  assert.equal(isAmountMatch(1000, 'abc'), false)
})

test('资源 key 规范化拒绝空值与超长值', () => {
  assert.equal(normalizeResourceKey(' research:companies:x '), 'research:companies:x')
  assert.equal(normalizeResourceKey(''), '')
  assert.equal(normalizeResourceKey(null), '')
  assert.equal(normalizeResourceKey('x'.repeat(181)), '')
})

test('未支付订单只在 30 分钟内复用', () => {
  const now = 1_800_000_000_000
  assert.equal(canReuseOrder({ createdAt: now - 60_000, now, hasQrCode: 'https://q' }), true)
  assert.equal(canReuseOrder({ createdAt: now - 31 * 60_000, now, hasQrCode: 'https://q' }), false)
  assert.equal(canReuseOrder({ createdAt: now - 60_000, now, hasQrCode: '' }), false)
  assert.equal(canReuseOrder({ createdAt: now - 60_000, now, status: 'paid', hasQrCode: 'https://q' }), false)
})

test('分转元不丢精度', () => {
  assert.equal(fenToYuan(1000), '10.00')
  assert.equal(fenToYuan(1999), '19.99')
  assert.equal(fenToYuan(0), '0.00')
})

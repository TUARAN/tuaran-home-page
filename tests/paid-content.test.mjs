import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import { md5 } from '../lib/pay/md5.mjs'
import { buildSign, verifySign, fenToYuan } from '../lib/pay/gateways/xunhupay.js'
import { newOrderNo, isAmountMatch, normalizeResourceKey, canReuseOrder } from '../lib/pay/rules.mjs'
import { summarizePaidOrders } from '../lib/pay/summary.mjs'

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

test('签名匹配虎皮椒官方 SDK 固定向量，忽略空值与 hash', () => {
  // 固定值由官方 Python SDK 的 sign()（& 拼接后直接 +AppSecret）生成，不用实现自身反推，避免自证式断言。
  // 官方：Python hupijiao-v3-python.py / Go morebuff/xunhupay 的 Sign() 一致。
  assert.equal(buildSign({ b: '2', a: '1' }, 'secret'), '8d9f51949e440aa629fd1a035708473a')
  // 空字符串参与签名；hash 与 null/undefined 不参与
  assert.equal(
    buildSign({ b: '2', a: '1', empty: '', hash: 'should-be-ignored', nil: null }, 'secret'),
    '3726ed6713ebad8f6777cff4927fee6b'
  )
  assert.equal(
    buildSign({ b: '2', a: '1', appid: '202601010001', total_fee: '10.00', empty: '' }, 'testkey'),
    'e2e431cb80fa93c04671ef354b26f44b'
  )
})

test('签名不是 &key=secret 旧算法', () => {
  // 回归保护：旧实现用 `a=1&b=2&key=secret`，与本向量不同，防止复辟。
  const oldWay = createHash('md5').update('a=1&b=2&key=secret', 'utf8').digest('hex')
  assert.notEqual(buildSign({ a: '1', b: '2' }, 'secret'), oldWay)
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

test('订单汇总只把已支付计入营收，并分别统计待支付与异常', async () => {
  let seenSql = ''
  const fakeDb = {
    prepare(sql) {
      seenSql = sql
      return {
        bind() { return this },
        async first() {
          return { total: 5, paid: 2, pending: 2, abnormal: 1, revenue_fen: 3500 }
        },
      }
    },
  }
  const out = await summarizePaidOrders(fakeDb)
  assert.deepEqual(out, { total: 5, paid: 2, pending: 2, abnormal: 1, revenueFen: 3500 })
  assert.match(seenSql, /FROM paid_orders/)
  assert.match(seenSql, /status = 'paid'/)
})

test('订单汇总在无 D1 或空结果时返回全零', async () => {
  assert.deepEqual(
    await summarizePaidOrders(null),
    { total: 0, paid: 0, pending: 0, abnormal: 0, revenueFen: 0 }
  )
  const emptyDb = {
    prepare() {
      return { bind() { return this }, async first() { return null } }
    },
  }
  assert.deepEqual(
    await summarizePaidOrders(emptyDb),
    { total: 0, paid: 0, pending: 0, abnormal: 0, revenueFen: 0 }
  )
})

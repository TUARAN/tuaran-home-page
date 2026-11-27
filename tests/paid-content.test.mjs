import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import { md5 } from '../lib/pay/md5.mjs'
import { buildSign, verifySign, fenToYuan } from '../lib/pay/gateways/xunhupay.js'
import { newOrderNo, isAmountMatch, normalizeResourceKey, canReuseOrder } from '../lib/pay/rules.mjs'
import {
  PAY_CLIENT_H5,
  PAY_CLIENT_WEB,
  detectPayClientModeFromUa,
  shapePaymentForClient,
} from '../lib/pay/clientMode.mjs'
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
  assert.equal(
    canReuseOrder({
      createdAt: now - 60_000,
      now,
      clientMode: PAY_CLIENT_H5,
      hasPayUrl: 'https://pay',
      hasQrCode: '',
    }),
    true
  )
  assert.equal(
    canReuseOrder({
      createdAt: now - 60_000,
      now,
      clientMode: PAY_CLIENT_H5,
      hasPayUrl: '',
      hasQrCode: 'https://q',
    }),
    false
  )
})

test('虎皮椒终端：PC 只暴露 url_qrcode，H5 只暴露 url', () => {
  const raw = { qrCode: 'https://qr.example', payUrl: 'https://jump.example' }
  assert.deepEqual(shapePaymentForClient(PAY_CLIENT_WEB, raw), {
    clientMode: PAY_CLIENT_WEB,
    clientModeLabel: 'Web',
    qrCode: 'https://qr.example',
    payUrl: '',
  })
  assert.deepEqual(shapePaymentForClient(PAY_CLIENT_H5, raw), {
    clientMode: PAY_CLIENT_H5,
    clientModeLabel: 'H5',
    qrCode: '',
    payUrl: 'https://jump.example',
  })
  assert.equal(detectPayClientModeFromUa('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'), PAY_CLIENT_H5)
  assert.equal(detectPayClientModeFromUa('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), PAY_CLIENT_WEB)
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

test('付费墙现金与燃币互斥：配了现金价不再并列展示燃币解锁', () => {
  const source = readFileSync(
    new URL('../app/(site)/components/RanbiPaywall.jsx', import.meta.url),
    'utf8',
  )
  // 现金面板与燃币卡片必须是三元表达式的两个分支，而不是各自独立渲染
  assert.match(source, /priceFen > 0 \? \([\s\S]*?<PayUnlockPanel[\s\S]*?\) : \([\s\S]*?燃币不足/)
  assert.doesNotMatch(source, /也可以使用燃币解锁/)
  assert.doesNotMatch(source, /燃币作为次选/)
  // 燃币卡片不再带 mt-4 上边距（现金面板已移除，它现在是唯一面板）
  assert.doesNotMatch(source, /mx-auto mt-4 rounded-xl/)
})

test('付费解锁角标由价格自动派生：直读 D1 且 D1 不可用时不报错', async () => {
  const { readPaidResourceKeys } = await import('../lib/pay/publicPrices.mjs')
  const fakeDb = {
    prepare(sql) {
      assert.match(sql, /SELECT resource_key FROM gated_resources WHERE price_fen > 0/)
      return { async all() { return { results: [
        { resource_key: 'research:people:elon-musk' },
        { resource_key: '  ' },
        { resource_key: 'community:topic-circle' },
      ] } } }
    },
  }
  assert.deepEqual(await readPaidResourceKeys(fakeDb), [
    'research:people:elon-musk',
    'community:topic-circle',
  ])
  const brokenDb = { prepare() { throw new Error('D1 binding DB is missing') } }
  assert.deepEqual(await readPaidResourceKeys(brokenDb), [])
})

test('角标复用同一组件，列表与详情都按 paid 派生而非硬编码标签', () => {
  const badge = readFileSync(new URL('../app/(site)/components/PaidUnlockBadge.jsx', import.meta.url), 'utf8')
  const item = readFileSync(new URL('../app/(site)/articles/ArticleListItem.jsx', import.meta.url), 'utf8')
  const header = readFileSync(new URL('../app/(site)/components/ArticleDetailHeader.jsx', import.meta.url), 'utf8')
  const listClient = readFileSync(new URL('../app/(site)/articles/ArticlesIndexClient.jsx', import.meta.url), 'utf8')
  assert.match(badge, /付费解锁/)
  assert.match(item, /paid \? <PaidUnlockBadge/)
  assert.match(header, /paid \? <PaidUnlockBadge/)
  assert.match(listClient, /paidKeySet\.has\(item\.id\)/)
  // 角标只做展示，不读文章元数据、不写 SEO keywords
  const badgeCode = badge.replace(/\/\*[\s\S]*?\*\//g, '')
  assert.doesNotMatch(badgeCode, /frontmatter|tags|keywords|metadata/)
})

/** 模拟 D1：记录执行的 SQL，UPDATE paid 时同步内存里的订单状态 */
function fakeOrderDb(initialOrder) {
  const calls = []
  let order = initialOrder ? { ...initialOrder } : null
  return {
    calls,
    get order() {
      return order
    },
    prepare(sql) {
      return {
        bind(...args) {
          calls.push({ sql, args })
          return this
        },
        async first() {
          if (/FROM paid_orders/.test(sql)) return order ? { ...order } : null
          return null
        },
        async run() {
          calls.push({ sql, ran: true })
          if (/SET status = 'paid'/.test(sql) && order) order = { ...order, status: 'paid' }
          return { meta: { changes: 1 } }
        },
      }
    },
  }
}

test('回调丢失时主动查单兜底：网关确认已支付且金额一致则落库写权益', async () => {
  const { settleFromGateway } = await import('../lib/pay/settle.mjs')
  const db = fakeOrderDb({
    out_trade_no: 'T20261124104225b75tsy',
    user_id: 'acct_test',
    resource_key: 'community:topic-circle',
    amount_fen: 6900,
    status: 'pending',
  })
  const queryArgs = []
  const result = await settleFromGateway(db, 'T20261124104225b75tsy', {
    now: 1_800_000_000_000,
    query: async (args) => {
      queryArgs.push(args)
      return { ok: true, data: { status: 'OD', total_fee: '69.00', transaction_id: 'TX123' } }
    },
  })
  assert.deepEqual(result, { checked: true, paid: true })
  assert.equal(db.order.status, 'paid')
  assert.equal(queryArgs[0].orderNo, 'T20261124104225b75tsy')
  const executed = db.calls.filter((call) => call.ran).map((call) => call.sql)
  assert.ok(executed.some((sql) => /SET status = 'paid'/.test(sql)), '应把订单落成 paid')
  assert.ok(executed.some((sql) => /INTO resource_unlocks/.test(sql)), '应写权益')
})

test('查单返回未支付时不落库，等回调或下次查询', async () => {
  const { settleFromGateway } = await import('../lib/pay/settle.mjs')
  const db = fakeOrderDb({
    out_trade_no: 'T1', user_id: 'u', resource_key: 'r', amount_fen: 6900, status: 'pending',
  })
  const result = await settleFromGateway(db, 'T1', {
    query: async () => ({ ok: true, data: { status: 'WP', total_fee: '69.00' } }),
  })
  assert.deepEqual(result, { checked: true, paid: false })
  assert.equal(db.order.status, 'pending')
  assert.ok(!db.calls.some((call) => call.ran), '未支付不应有任何写库')
})

test('查单金额与下单不一致时拒绝落库（防改价）', async () => {
  const { settleFromGateway } = await import('../lib/pay/settle.mjs')
  const db = fakeOrderDb({
    out_trade_no: 'T1', user_id: 'u', resource_key: 'r', amount_fen: 6900, status: 'pending',
  })
  const result = await settleFromGateway(db, 'T1', {
    query: async () => ({ ok: true, data: { status: 'OD', total_fee: '10.00' } }),
  })
  assert.equal(result.paid, false)
  assert.equal(result.error, 'AMOUNT_MISMATCH')
  assert.equal(db.order.status, 'pending')
})

test('已支付订单不再查网关；查单失败时静默返回不写库', async () => {
  const { settleFromGateway } = await import('../lib/pay/settle.mjs')
  const paidDb = fakeOrderDb({
    out_trade_no: 'T1', user_id: 'u', resource_key: 'r', amount_fen: 6900, status: 'paid',
  })
  let queried = 0
  assert.deepEqual(
    await settleFromGateway(paidDb, 'T1', { query: async () => { queried += 1; return { ok: true, data: { status: 'OD' } } } }),
    { checked: false }
  )
  assert.equal(queried, 0)

  const pendingDb = fakeOrderDb({
    out_trade_no: 'T2', user_id: 'u', resource_key: 'r', amount_fen: 6900, status: 'pending',
  })
  assert.deepEqual(
    await settleFromGateway(pendingDb, 'T2', { query: async () => ({ ok: false }) }),
    { checked: false }
  )
  assert.equal(pendingDb.order.status, 'pending')
})

test('支付面板上报 clientMode 并用 PayGatewayCheckout 区分扫码与跳转', () => {
  for (const [name, file] of [
    ['PayUnlockPanel', '../app/(site)/components/PayUnlockPanel.jsx'],
    ['CommunityPayPanel', '../app/(site)/components/CommunityPayPanel.jsx'],
    ['SignatureEditionCard', '../app/(site)/books/SignatureEditionCard.jsx'],
  ]) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8')
    assert.match(source, /clientMode:\s*detectPayClientModeInBrowser\(\)/, `${name} 应上报终端`)
    assert.match(source, /PayGatewayCheckout/, `${name} 应使用统一收银组件`)
    assert.doesNotMatch(source, /order\.qrCode \? \([\s\S]*<img/, `${name} 不得先判断 qrCode 再展示二维码`)
  }
})

test('支付刷新按钮有可见反馈：查询中置灰，未查到时给出提示', () => {
  const checkout = readFileSync(new URL('../app/(site)/components/PayGatewayCheckout.jsx', import.meta.url), 'utf8')
  const community = readFileSync(new URL('../app/(site)/components/CommunityPayPanel.jsx', import.meta.url), 'utf8')
  const unlock = readFileSync(new URL('../app/(site)/components/PayUnlockPanel.jsx', import.meta.url), 'utf8')
  assert.match(checkout, /正在查询/, 'PayGatewayCheckout 刷新中应显示「正在查询」')
  assert.match(checkout, /disabled=\{checking\}/, 'PayGatewayCheckout 查询中按钮应置灰')
  for (const [name, source] of [
    ['CommunityPayPanel', community],
    ['PayUnlockPanel', unlock],
  ]) {
    assert.match(source, /还未查到支付结果/, `${name} 未查到时应给出提示`)
    assert.match(source, /PayGatewayCheckout[\s\S]*checking=\{checking\}/, `${name} 应把 checking 传给收银组件`)
    assert.match(source, /res\.status === 404/, `${name} 应处理订单失效分支`)
    assert.match(source, /res\.status === 401/, `${name} 应处理登录/身份过期分支`)
    assert.match(source, /silent: true/, `${name} 自动轮询应静默`)
  }
})

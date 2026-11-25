import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  SIGNATURE_BOOKS,
  SIGNATURE_DISCOUNT_PERMILLE,
  BOOK_ORDER_STATUS,
  isKnownSignatureSlug,
  signatureResourceKey,
  slugFromResourceKey,
  isSignatureResourceKey,
  salePriceFor,
  normalizeRecipient,
} from '../lib/pay/bookOrders.mjs'

const migration = await readFile(new URL('../migrations/0137_book_signature.sql', import.meta.url), 'utf8')
const createRoute = await readFile(new URL('../app/api/pay/create/route.js', import.meta.url), 'utf8')
const ordersLib = await readFile(new URL('../lib/pay/orders.js', import.meta.url), 'utf8')
const settleLib = await readFile(new URL('../lib/pay/settle.mjs', import.meta.url), 'utf8')
const pricesRoute = await readFile(new URL('../app/api/books/signature/prices/route.js', import.meta.url), 'utf8')
const shippingRoute = await readFile(new URL('../app/api/books/signature/shipping/route.js', import.meta.url), 'utf8')
const adminRoute = await readFile(new URL('../app/api/admin/book-signature/route.js', import.meta.url), 'utf8')
const card = await readFile(new URL('../app/(site)/books/SignatureEditionCard.jsx', import.meta.url), 'utf8')
const payConsole = await readFile(new URL('../app/(admin)/admin/pay/PayConsole.jsx', import.meta.url), 'utf8')
const publishedWorks = await readFile(new URL('../lib/site/publishedWorks.js', import.meta.url), 'utf8')

const llmPage = await readFile(new URL('../app/(site)/books/llm-underlying-logic/page.jsx', import.meta.url), 'utf8')
const seedancePage = await readFile(new URL('../app/(site)/books/seedance-guide/page.jsx', import.meta.url), 'utf8')
const programmerPage = await readFile(new URL('../app/(site)/books/programmer-growth-notes/page.jsx', import.meta.url), 'utf8')
const botsPage = await readFile(new URL('../app/(site)/books/ai-bots-guide/page.jsx', import.meta.url), 'utf8')

test('签名版资源键：slug 校验与前缀互转', () => {
  assert.equal(isKnownSignatureSlug('seedance-guide'), true)
  assert.equal(isKnownSignatureSlug('ai-bots-guide'), false)
  assert.equal(isKnownSignatureSlug(''), false)

  assert.equal(signatureResourceKey('llm-underlying-logic'), 'signature:llm-underlying-logic')
  assert.equal(signatureResourceKey('Has Slash/nope'), '')
  assert.equal(signatureResourceKey(''), '')

  assert.equal(slugFromResourceKey('signature:programmer-growth-notes'), 'programmer-growth-notes')
  assert.equal(slugFromResourceKey('signature:../admin'), '')
  assert.equal(slugFromResourceKey('research:people:x'), '')

  assert.equal(isSignatureResourceKey('signature:seedance-guide'), true)
  assert.equal(isSignatureResourceKey('signature:not a slug'), false)
  assert.equal(isSignatureResourceKey('resource:reading'), false)
})

test('早鸟价 8.8 折：四舍五入到分，非法原价返回 0', () => {
  assert.equal(SIGNATURE_DISCOUNT_PERMILLE, 880)
  assert.equal(salePriceFor(7900), 6952) // 79 元 × 0.88 = 69.52
  assert.equal(salePriceFor(5980), 5262) // 59.8 × 0.88 = 52.624 → 52.62
  assert.equal(salePriceFor(10000), 8800)
  assert.equal(salePriceFor(0), 0)
  assert.equal(salePriceFor(-100), 0)
})

test('收货信息规范化：姓名 / 电话 / 地址', () => {
  assert.deepEqual(normalizeRecipient({ name: '王小明', phone: '13800138000', address: '广东省深圳市南山区科技园某路 1 号 2 栋 301' }), {
    ok: true,
    name: '王小明',
    phone: '13800138000',
    address: '广东省深圳市南山区科技园某路 1 号 2 栋 301',
  })
  assert.equal(normalizeRecipient({ name: '王小明', phone: '020-88888888', address: '广东省广州市越秀区某某街道 12 号' }).ok, true)
  assert.equal(normalizeRecipient({ name: '王', phone: '13800138000', address: '广东省深圳市南山区科技园某路 1 号' }).error, 'INVALID_NAME')
  assert.equal(normalizeRecipient({ name: '王小明', phone: '12345', address: '广东省深圳市南山区科技园某路 1 号' }).error, 'INVALID_PHONE')
  assert.equal(normalizeRecipient({ name: '王小明', phone: '13800138000', address: '太短' }).error, 'INVALID_ADDRESS')
  assert.equal(normalizeRecipient({}).error, 'INVALID_NAME')
})

test('迁移建表：book_orders 与 book_signature_editions、状态索引', () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS book_orders/)
  assert.match(migration, /out_trade_no TEXT PRIMARY KEY/)
  assert.match(migration, /status TEXT NOT NULL DEFAULT 'pending'/)
  assert.match(migration, /recipient_name TEXT NOT NULL DEFAULT ''/)
  assert.match(migration, /tracking_no TEXT NOT NULL DEFAULT ''/)
  assert.match(migration, /idx_book_orders_status/)
  assert.match(migration, /CREATE TABLE IF NOT EXISTS book_signature_editions/)
  assert.match(migration, /base_price_fen INTEGER NOT NULL DEFAULT 0/)
  // 订单状态全谱：支付主链路只推进 pending → awaiting_address
  for (const status of Object.values(BOOK_ORDER_STATUS)) {
    assert.match(migration, new RegExp(status.replace('_', '_')))
  }
})

test('支付主链路：signature: 前缀跳过数字权益，改为 book_orders 流转', () => {
  // 回调落地与站长补单都要分流
  const branches = ordersLib.match(/isSignatureResourceKey\(order\.resource_key\)/g) || []
  assert.ok(branches.length >= 2, 'applyNotify 与 grantPaidOrder 都要分流')
  assert.match(ordersLib, /markBookOrderPaid/)
  assert.match(settleLib, /isSignatureResourceKey/)
  assert.match(settleLib, /markBookOrderPaid/)
  // 下单成功登记 book_orders 行
  assert.match(createRoute, /ensureBookOrderRow/)
  assert.match(createRoute, /isSignatureResourceKey/)
})

test('公开接口：游客可下单、归属校验、不上架不返回', () => {
  // 价格接口只返回上架且有价的配置
  assert.match(pricesRoute, /listSignatureEditions/)
  assert.match(pricesRoute, /salePriceFor/)
  assert.match(pricesRoute, /salePriceFen !== salePriceFor\(basePriceFen\)/)
  // 收货信息：订单归属校验 + 仅签名版订单可填
  assert.match(shippingRoute, /getPaidOrderForUser\(db, orderNo, userId\)/)
  assert.match(shippingRoute, /startsWith\('signature:'\)/)
  assert.match(shippingRoute, /setBookOrderAddress/)
  assert.match(shippingRoute, /enforceRateLimits/)
  // 后台：管理员鉴权 + 发货 / 定价动作
  assert.match(adminRoute, /getOwnerOrReject/)
  assert.match(adminRoute, /shipBookOrder/)
  assert.match(adminRoute, /upsertResource/)
})

test('书页集成：三本实体书有签名版卡片，电子小册没有', () => {
  for (const [page, slug] of [
    [seedancePage, 'seedance-guide'],
    [llmPage, 'llm-underlying-logic'],
    [programmerPage, 'programmer-growth-notes'],
  ]) {
    assert.match(page, /SignatureEditionCard/, `${slug} 页应引入签名版卡片`)
    assert.match(page, new RegExp(`slug="${slug}"`), `${slug} 页应传自己的 slug`)
  }
  assert.doesNotMatch(botsPage, /SignatureEditionCard/, '电子小册不开签名版入口')

  const flagged = publishedWorks.match(/signatureEdition: true/g) || []
  assert.equal(flagged.length, 3, 'publishedWorks 恰好标记 3 本实体书')
  assert.match(SIGNATURE_BOOKS.map((b) => b.slug).join(','), /^seedance-guide,llm-underlying-logic,programmer-growth-notes$/)
})

test('支付文案防回潮：公开侧不得出现支付宝/虎皮椒，渠道只写微信', () => {
  // PayConsole 是后台页（owner-only），原有「虎皮椒接入说明」不在断言范围
  for (const [name, source] of [
    ['SignatureEditionCard', card],
    ['书页 ×3', seedancePage + llmPage + programmerPage],
    ['价格接口', pricesRoute],
    ['收货接口', shippingRoute],
  ]) {
    assert.ok(!/支付宝/.test(source), `${name} 不得出现支付宝`)
    assert.ok(!/虎皮椒/.test(source), `${name} 不得出现虎皮椒`)
  }
  assert.match(card, /微信扫码支付/)
})

test('签名版卡片交互闭环：下单 → 轮询 → 填地址 → 完成', () => {
  assert.match(card, /\/api\/pay\/create/)
  assert.match(card, /signature:\$\{slug\}/)
  assert.match(card, /\/api\/pay\/status/)
  assert.match(card, /\/api\/books\/signature\/shipping/)
  assert.match(card, /亲签/)
  assert.match(card, /手写寄语卡/)
  assert.match(card, /早鸟价 8\.8 折/)
  assert.match(card, /收货信息已保存/)
  // 后台发货闭环
  assert.match(payConsole, /\/api\/admin\/book-signature/)
  assert.match(payConsole, /发货/)
  assert.match(payConsole, /待填收货/)
})

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { isGuestPayResource, normalizeEmail, normalizeReturnPath } from '../lib/pay/contact.mjs'

const createRoute = await readFile(new URL('../app/api/pay/create/route.js', import.meta.url), 'utf8')
const statusRoute = await readFile(new URL('../app/api/pay/status/route.js', import.meta.url), 'utf8')
const contactRoute = await readFile(new URL('../app/api/pay/contact/route.js', import.meta.url), 'utf8')
const orders = await readFile(new URL('../lib/pay/orders.js', import.meta.url), 'utf8')
const migration = await readFile(new URL('../migrations/0136_paid_order_contact.sql', import.meta.url), 'utf8')
const payConsole = await readFile(new URL('../app/(admin)/admin/pay/PayConsole.jsx', import.meta.url), 'utf8')

test('只有圈子方案允许游客下单，付费文章仍必须登录', () => {
  assert.equal(isGuestPayResource('community:topic-circle'), true)
  assert.equal(isGuestPayResource('community:all-circles'), true)
  assert.equal(isGuestPayResource('community:personal-service'), true)
  assert.equal(isGuestPayResource('research:people:elon-musk'), false)
  assert.equal(isGuestPayResource('resource:wallpaper'), false)
  assert.equal(isGuestPayResource('community:'), false)
  assert.equal(isGuestPayResource('community:topic-circle/../../admin'), false)
  assert.equal(isGuestPayResource(''), false)
})

test('联系邮箱规范化：去空白、转小写、拒绝非法格式与超长值', () => {
  assert.equal(normalizeEmail('  Reader@Example.COM '), 'reader@example.com')
  assert.equal(normalizeEmail('a.b+tag@sub.example.cn'), 'a.b+tag@sub.example.cn')
  assert.equal(normalizeEmail(''), '')
  assert.equal(normalizeEmail('no-at-sign.example.com'), '')
  assert.equal(normalizeEmail('a@b'), '')
  assert.equal(normalizeEmail('a@@b.com'), '')
  assert.equal(normalizeEmail('a b@c.com'), '')
  assert.equal(normalizeEmail(`${'x'.repeat(250)}@b.com`), '')
})

test('网关 return_url 只接受站内相对路径', () => {
  assert.equal(normalizeReturnPath('/circles?plan=all-circles'), '/circles?plan=all-circles')
  assert.equal(normalizeReturnPath('https://evil.example/pay'), '')
  assert.equal(normalizeReturnPath('//evil.example/pay'), '')
  assert.equal(normalizeReturnPath('/circles\nSet-Cookie: a=b'), '')
  assert.equal(normalizeReturnPath(''), '')
})

test('下单接口复用游客签名 Cookie，且只对圈子方案放行', () => {
  assert.match(createRoute, /getOrIssueGuest/)
  assert.match(createRoute, /GUEST_USER_PREFIX/)
  assert.match(createRoute, /isGuestPayResource\(resourceKey\)/)
  assert.match(createRoute, /UNAUTHORIZED/)
  assert.match(createRoute, /Set-Cookie/)
  assert.match(createRoute, /normalizeReturnPath/)
  // 游客清 cookie 即可换 gid，按 IP 收紧限流
  assert.match(createRoute, /pay:create:guestip:15m/)
})

test('状态轮询与留邮箱接口都识别游客身份，且不开放订单枚举', () => {
  for (const source of [statusRoute, contactRoute]) {
    assert.match(source, /getGuestId/)
    assert.match(source, /GUEST_USER_PREFIX/)
    assert.match(source, /UNAUTHORIZED/)
    assert.match(source, /getPaidOrderForUser\(db, orderNo, userId\)/)
  }
  assert.match(contactRoute, /ORDER_NOT_PAID/)
  assert.match(contactRoute, /normalizeEmail/)
  assert.match(contactRoute, /setOrderContactEmail/)
  assert.match(contactRoute, /CONTACT_UNAVAILABLE/)
})

test('游客订单不写权益表，联系邮箱落在 paid_orders', () => {
  assert.match(orders, /grantIfAccount/)
  assert.match(orders, /startsWith\('guest:'\)/)
  assert.match(orders, /returnTo/)
  assert.match(orders, /UPDATE paid_orders SET contact_email/)
  assert.match(migration, /ALTER TABLE paid_orders ADD COLUMN contact_email TEXT/)
  assert.match(migration, /ALTER TABLE paid_orders ADD COLUMN contact_email_at INTEGER/)
})

test('后台订单列表、详情与搜索能看到联系邮箱', () => {
  assert.match(payConsole, /联系邮箱/)
  assert.match(payConsole, /row\.contact_email/)
  assert.match(payConsole, /detailOrder\.contact_email/)
  assert.match(payConsole, /o\.contact_email/)
})

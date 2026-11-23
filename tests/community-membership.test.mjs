import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { COMMUNITY_MEMBERSHIP, getCommunityCountdown, getCommunityPlanPrice, getCommunityPlanResourceKey } from '../lib/auth/communityMembership.js'

const membershipCard = await readFile(new URL('../app/(site)/components/CommunityMembershipCard.jsx', import.meta.url), 'utf8')
const payPanel = await readFile(new URL('../app/(site)/components/CommunityPayPanel.jsx', import.meta.url), 'utf8')

test('community membership exposes distinct circle and personal service tiers', () => {
  assert.deepEqual(
    COMMUNITY_MEMBERSHIP.plans.map(({ id, price }) => [id, price]),
    [
      ['topic-circle', 69],
      ['all-circles', 199],
      ['personal-service', 699],
    ],
  )
  assert.match(COMMUNITY_MEMBERSHIP.invoice, /发票/)
})

test('topic circle annual price is always 69', () => {
  const plan = COMMUNITY_MEMBERSHIP.plans[0]

  assert.equal(getCommunityPlanPrice(plan), 69)
  assert.equal(getCommunityPlanPrice(COMMUNITY_MEMBERSHIP.plans[1]), 199)
})

test('each plan maps to its own xunhupay resource key', () => {
  assert.deepEqual(
    COMMUNITY_MEMBERSHIP.plans.map((plan) => [plan.price, getCommunityPlanResourceKey(plan)]),
    [
      [69, 'community:topic-circle'],
      [199, 'community:all-circles'],
      [699, 'community:personal-service'],
    ],
  )
  assert.equal(getCommunityPlanResourceKey({}), '')
  for (const plan of COMMUNITY_MEMBERSHIP.plans) {
    assert.match(getCommunityPlanResourceKey(plan), /^community:[a-z-]+$/)
  }
})

test('membership card uses xunhupay panel instead of static QR codes', () => {
  assert.match(membershipCard, /CommunityPayPanel/)
  assert.match(membershipCard, /虎皮椒支付/)
  assert.doesNotMatch(membershipCard, /getCommunityPaymentQr/)
  assert.doesNotMatch(membershipCard, /paymentQrAlipay/)
  assert.doesNotMatch(membershipCard, /扫码支付固定金额/)
  assert.doesNotMatch(membershipCard, /发送付款截图/)
})

test('xunhupay panel creates order by resource key and polls own order status', () => {
  assert.match(payPanel, /\/api\/pay\/create/)
  assert.match(payPanel, /\/api\/pay\/status/)
  assert.match(payPanel, /\/api\/points\/unlock/)
  assert.match(payPanel, /resourceKey/)
  assert.match(payPanel, /支付成功/)
  assert.doesNotMatch(payPanel, /付款截图/)
  // 付款权益必须挂登录账号，401 时先登录
  assert.match(payPanel, /res\.status === 401/)
  assert.match(payPanel, /\/login\?returnTo=/)
})

test('seven-day countdown starts a new cycle at each boundary', () => {
  const start = new Date(COMMUNITY_MEMBERSHIP.activity.cycleStartsAt).getTime()
  const cycle = COMMUNITY_MEMBERSHIP.activity.cycleDays * 86400000

  assert.deepEqual(getCommunityCountdown(start), { days: 7, hours: 0, minutes: 0, seconds: 0 })
  assert.deepEqual(getCommunityCountdown(start + cycle - 1000), { days: 0, hours: 0, minutes: 0, seconds: 1 })
  assert.deepEqual(getCommunityCountdown(start + cycle), { days: 7, hours: 0, minutes: 0, seconds: 0 })
})

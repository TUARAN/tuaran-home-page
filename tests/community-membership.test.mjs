import assert from 'node:assert/strict'
import test from 'node:test'

import { COMMUNITY_MEMBERSHIP, getCommunityCountdown, getCommunityPlanPrice } from '../lib/auth/communityMembership.js'

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

test('seven-day countdown starts a new cycle at each boundary', () => {
  const start = new Date(COMMUNITY_MEMBERSHIP.activity.cycleStartsAt).getTime()
  const cycle = COMMUNITY_MEMBERSHIP.activity.cycleDays * 86400000

  assert.deepEqual(getCommunityCountdown(start), { days: 7, hours: 0, minutes: 0, seconds: 0 })
  assert.deepEqual(getCommunityCountdown(start + cycle - 1000), { days: 0, hours: 0, minutes: 0, seconds: 1 })
  assert.deepEqual(getCommunityCountdown(start + cycle), { days: 7, hours: 0, minutes: 0, seconds: 0 })
})

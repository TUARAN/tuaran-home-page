import assert from 'node:assert/strict'
import test from 'node:test'

import { COMMUNITY_MEMBERSHIP, getCommunityPlanPrice } from '../lib/communityMembership.js'

test('community membership exposes distinct circle and personal service tiers', () => {
  assert.deepEqual(
    COMMUNITY_MEMBERSHIP.plans.map(({ id, price }) => [id, price]),
    [
      ['topic-circle', 99],
      ['all-circles', 199],
      ['personal-service', 699],
    ],
  )
  assert.equal(COMMUNITY_MEMBERSHIP.plans[0].earlyBirdPrice, 69)
  assert.match(COMMUNITY_MEMBERSHIP.invoice, /发票/)
})

test('early-bird price ends at the configured deadline', () => {
  const plan = COMMUNITY_MEMBERSHIP.plans[0]
  const deadline = new Date(COMMUNITY_MEMBERSHIP.earlyBird.endsAt).getTime()

  assert.equal(getCommunityPlanPrice(plan, deadline - 1), 69)
  assert.equal(getCommunityPlanPrice(plan, deadline), 99)
  assert.equal(getCommunityPlanPrice(COMMUNITY_MEMBERSHIP.plans[1], deadline - 1), 199)
})

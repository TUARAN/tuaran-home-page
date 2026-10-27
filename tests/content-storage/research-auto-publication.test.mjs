import assert from 'node:assert/strict'
import test from 'node:test'

import { autoPublishCandidates, researchReviewDue, RESEARCH_AUTO_PUBLISH_DELAY_MS } from '../../lib/research/researchAutoPublicationCore.mjs'

test('only unreviewed new and updated revisions enter automatic publication', () => {
  const pending = [
    { reason: 'new', gitSha: 'a' },
    { reason: 'updated', gitSha: 'b' },
    { reason: 'draft', gitSha: 'c' },
    { reason: 'retired', gitSha: 'd' },
    { reason: 'new', gitSha: '' },
  ]
  assert.deepEqual(autoPublishCandidates(pending), pending.slice(0, 2))
})

test('review window is exactly 72 hours from latest GitHub commit', () => {
  const commitAt = 1_000_000
  assert.equal(researchReviewDue(commitAt, commitAt + RESEARCH_AUTO_PUBLISH_DELAY_MS - 1), false)
  assert.equal(researchReviewDue(commitAt, commitAt + RESEARCH_AUTO_PUBLISH_DELAY_MS), true)
  assert.equal(researchReviewDue(null, commitAt + RESEARCH_AUTO_PUBLISH_DELAY_MS), false)
})

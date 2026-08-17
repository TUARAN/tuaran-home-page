import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getAllFeedItems,
  getFeedItemsWithPinned,
} from '../../app/(site)/feed/data.js'

test('homepage feed selection puts configured inspirations first without duplicates', () => {
  const pinnedId = 'gemma-4-agent-vllm-challenge'
  const items = getFeedItemsWithPinned([pinnedId, pinnedId, 'missing-item'], 10)

  assert.equal(items.length, 10)
  assert.equal(items[0].id, pinnedId)
  assert.equal(items.filter((item) => item.id === pinnedId).length, 1)
})

test('pinning does not change the chronological all-feed order', () => {
  assert.notEqual(getAllFeedItems()[0].id, 'gemma-4-agent-vllm-challenge')
})

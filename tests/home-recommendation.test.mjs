import assert from 'node:assert/strict'
import test from 'node:test'

import { chooseHomeRecommendationBatch } from '../lib/homeRecommendationEngine.js'

const catalog = Array.from({ length: 40 }, (_, index) => ({
  id: `item-${index}`,
  section: ['feed', 'column', 'research', 'resources'][index % 4],
  sortKey: String(100 - index).padStart(3, '0'),
  title: `内容 ${index}`,
}))

const settings = {
  batchSize: 14,
  pinnedIds: ['item-5', 'item-9'],
}

test('home recommendation highlights appear only in the initial batch', () => {
  const initial = chooseHomeRecommendationBatch(
    catalog,
    settings,
    100,
    [],
    { includeHighlights: true },
  )

  assert.deepEqual(initial.slice(0, 2).map((item) => item.id), settings.pinnedIds)
  assert.equal(initial[2].id, 'item-0')
  assert.equal(initial[2].isLatest, true)

  const refreshed = chooseHomeRecommendationBatch(
    catalog,
    settings,
    101,
    initial.map((item) => item.id),
    { includeHighlights: false },
  )

  assert.equal(refreshed.length, settings.batchSize)
  assert.equal(refreshed.some((item) => item.isLatest), false)
  assert.deepEqual(
    refreshed.filter((item) => initial.some((previous) => previous.id === item.id)),
    [],
  )
})

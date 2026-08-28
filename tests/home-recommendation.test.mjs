import assert from 'node:assert/strict'
import test from 'node:test'

import { chooseHomeRecommendationBatch, mergeHomeRecommendationSettings } from '../lib/homeRecommendationEngine.js'
import { RESEARCH_ENTRY_META } from '../lib/research/catalog.js'

const catalog = Array.from({ length: 40 }, (_, index) => ({
  id: `item-${index}`,
  section: ['column', 'research', 'resources'][index % 3],
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

test('home recommendation excludes inspiration items even when legacy input contains them', () => {
  const legacyCatalog = [
    {
      id: 'feed:legacy-inspiration',
      section: 'feed',
      sortKey: '999',
      title: '旧灵感',
    },
    ...catalog,
  ]
  const batch = chooseHomeRecommendationBatch(
    legacyCatalog,
    {
      batchSize: 14,
      sources: {
        feed: { enabled: true, weight: 10 },
      },
      pinnedIds: ['feed:legacy-inspiration'],
    },
    100,
  )

  assert.equal(batch.length, 14)
  assert.equal(batch.some((item) => item.section === 'feed'), false)
  assert.equal(batch.some((item) => item.id === 'feed:legacy-inspiration'), false)
})

test('WorkBuddy is the default pin, while an explicit empty pin list remains respected', () => {
  const entry = RESEARCH_ENTRY_META['topics/workbuddy-tutorial-resources']
  assert.ok(entry, 'the pinned article must exist in the generated catalog')
  const workbuddy = {
    id: `research:${entry.category}:${entry.slug}`,
    section: 'research',
    sortKey: `${entry.date}T${entry.time}`,
  }
  assert.deepEqual(mergeHomeRecommendationSettings({}).pinnedIds, [workbuddy.id])
  assert.deepEqual(mergeHomeRecommendationSettings({ pinnedIds: [] }).pinnedIds, [])
  const initial = chooseHomeRecommendationBatch([...catalog, workbuddy], {}, 100)
  assert.equal(initial[0].id, workbuddy.id)
  assert.equal(initial.filter((item) => item.id === workbuddy.id).length, 1)
})

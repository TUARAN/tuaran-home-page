import assert from 'node:assert/strict'
import test from 'node:test'

import {
  chooseHomeRecommendationBatch,
  getHomeRecommendationRotateDelayMs,
  mergeHomeRecommendationCatalog,
  mergeHomeRecommendationSettings,
  selectHomeRecommendationItems,
} from '../lib/homeRecommendationEngine.js'
import { buildHomeRecommendationCatalog } from '../lib/homeRecommendationCatalogCore.js'
import { researchPublicSummary } from '../lib/researchPublicSummary.js'
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

test('home recommendation keeps pinned items across batches and only drops latest after refresh', () => {
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
  assert.deepEqual(refreshed.slice(0, 2).map((item) => item.id), settings.pinnedIds)
  assert.equal(refreshed.some((item) => item.isLatest), false)
  assert.deepEqual(
    refreshed.filter((item) => initial.some((previous) => previous.id === item.id)).map((item) => item.id),
    settings.pinnedIds,
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

test('home recommendations and article lists use the same public summary', () => {
  const entry = {
    category: 'topics',
    slug: 'workbuddy-tutorial-resources',
    title: 'WorkBuddy',
    summary: '腾讯 WorkBuddy 免费学习资源整理：10 份 PDF 共 308 页。',
    tldr: '10 份 PDF、50 节视频，免费领取燃币即可解锁学习。',
    date: '2026-08-28',
    time: '11:18',
  }
  assert.equal(researchPublicSummary(entry), entry.tldr)
  const catalog = buildHomeRecommendationCatalog([], [entry])
  assert.equal(catalog[0].id, 'research:topics:workbuddy-tutorial-resources')
  assert.equal(catalog[0].summary, entry.tldr)
})

test('runtime catalog replaces stale fields instead of keeping a second summary for the same article', () => {
  const current = [
    { id: 'research:topics:workbuddy-tutorial-resources', title: 'WorkBuddy', summary: '短摘要', href: '/a' },
  ]
  const incoming = [
    { id: 'research:topics:workbuddy-tutorial-resources', title: 'WorkBuddy', summary: '短摘要', href: '/a' },
    { id: 'research:topics:ming-dynasty-1566', title: '大明王朝', summary: '新文章', href: '/b' },
  ]
  const merged = mergeHomeRecommendationCatalog(current, incoming)
  assert.equal(merged[0].summary, '短摘要')
  assert.equal(merged[1].id, 'research:topics:ming-dynasty-1566')
  assert.equal(
    mergeHomeRecommendationCatalog(current, [{ id: 'research:topics:workbuddy-tutorial-resources', title: 'WorkBuddy', summary: '短摘要', href: '/a' }]),
    current,
  )
})

test('first painted recommendation batch stays on screen until the reader asks for another', () => {
  const painted = [{ id: 'pinned' }, { id: 'latest' }]
  const computed = [{ id: 'pinned' }, { id: 'newer' }]
  assert.deepEqual(selectHomeRecommendationItems(computed, painted, true), painted)
  assert.deepEqual(selectHomeRecommendationItems(computed, painted, false), computed)
  assert.equal(getHomeRecommendationRotateDelayMs(12, 12 * 60 * 60 * 1000 * 10 + 1000) > 1000, true)
})

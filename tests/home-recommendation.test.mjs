import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  chooseHomeRecommendationBatch,
  getHomeRecommendationNavigationType,
  getHomeRecommendationRotateDelayMs,
  HOME_ARTICLE_SCOPE_KEYS,
  HOME_ARTICLE_SCOPE_META,
  HOME_ARTICLE_SCOPE_PAGE_SIZE,
  HOME_RECOMMENDATION_BATCH_OFFSET_STORAGE_KEY,
  homeArticleScopeSurface,
  isHomeArticleScope,
  listHomeArticleScopeCatalog,
  mergeHomeRecommendationCatalog,
  mergeHomeRecommendationSettings,
  nextHomeRecommendationBatchOffset,
  parseHomeRecommendationBatchOffset,
  readHomeRecommendationBatchOffset,
  reconcilePaintedHomeRecommendationLatest,
  reconcilePaintedHomeRecommendationPins,
  selectHomeRecommendationItems,
  sliceHomeArticleScopeItems,
  writeHomeRecommendationBatchOffset,
} from '../lib/homeRecommendationEngine.js'
import { SUBJECT_META } from '../lib/contentTaxonomy.js'
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

test('recommendation pins come only from an explicit admin list', () => {
  const entry = RESEARCH_ENTRY_META['topics/workbuddy-tutorial-resources']
  assert.ok(entry, 'the article must exist in the generated catalog')
  const workbuddy = {
    id: `research:${entry.category}:${entry.slug}`,
    section: 'research',
    sortKey: `${entry.date}T${entry.time}`,
  }
  assert.deepEqual(mergeHomeRecommendationSettings({}).pinnedIds, [])
  assert.deepEqual(mergeHomeRecommendationSettings({ pinnedIds: [] }).pinnedIds, [])
  const unpinned = chooseHomeRecommendationBatch([...catalog, workbuddy], {}, 100)
  const explicitlyEmpty = chooseHomeRecommendationBatch([...catalog, workbuddy], { pinnedIds: [] }, 100)
  assert.deepEqual(unpinned.map((item) => item.id), explicitlyEmpty.map((item) => item.id))
  const pinned = chooseHomeRecommendationBatch([...catalog, workbuddy], { pinnedIds: [workbuddy.id] }, 100)
  assert.equal(pinned[0].id, workbuddy.id)
  assert.equal(pinned.filter((item) => item.id === workbuddy.id).length, 1)
})

test('painted batch adopts admin pins without reshuffling the rest', () => {
  const painted = [
    { id: 'first', section: 'column' },
    { id: 'second', section: 'research' },
    { id: 'third', section: 'resources' },
  ]
  const catalog = [
    ...painted,
    { id: 'research:topics:workbuddy-tutorial-resources', section: 'research' },
  ]
  assert.equal(
    reconcilePaintedHomeRecommendationPins(painted, catalog, { pinnedIds: [] }),
    painted,
  )
  const pinned = reconcilePaintedHomeRecommendationPins(painted, catalog, {
    pinnedIds: ['research:topics:workbuddy-tutorial-resources'],
  })
  assert.deepEqual(pinned.map((item) => item.id), [
    'research:topics:workbuddy-tutorial-resources',
    'first',
    'second',
  ])
  assert.equal(
    reconcilePaintedHomeRecommendationPins(pinned, catalog, {
      pinnedIds: ['research:topics:workbuddy-tutorial-resources'],
    }),
    pinned,
  )
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
    subjects: ['workbuddy'],
    contentType: 'guide',
  }
  assert.equal(researchPublicSummary(entry), entry.tldr)
  const catalog = buildHomeRecommendationCatalog([], [entry])
  assert.equal(catalog[0].id, 'research:topics:workbuddy-tutorial-resources')
  assert.equal(catalog[0].summary, entry.tldr)
  assert.deepEqual(catalog[0].subjects, ['workbuddy'])
})

test('homepage cards use public type and subject, not research folder names', () => {
  const catalog = buildHomeRecommendationCatalog(
    [{ slug: 'diary-self-reflection', title: '日记', date: '2026-01-01', summary: 'x', homeCategory: '随笔' }],
    [
      RESEARCH_ENTRY_META['topics/workbuddy-tutorial-resources'],
      RESEARCH_ENTRY_META['topics/crypto-bitcoin'],
    ],
  )
  const diary = catalog.find((item) => item.id === 'column:diary-self-reflection')
  const workbuddy = catalog.find((item) => item.id === 'research:topics:workbuddy-tutorial-resources')
  const bitcoin = catalog.find((item) => item.id === 'research:topics:crypto-bitcoin')
  const movie = catalog.find((item) => item.href === '/resources/niu-lai-movie')

  assert.equal(diary.sectionLabel, '精选')
  assert.equal(diary.tagLabel, '生活与家庭')
  assert.equal(workbuddy.sectionLabel, '实践')
  assert.equal(workbuddy.tagLabel, 'WorkBuddy')
  assert.equal(bitcoin.sectionLabel, '分析')
  assert.equal(bitcoin.tagLabel, 'Web3')
  assert.equal(movie.sectionLabel, '资源')
  assert.equal(movie.tagLabel, '人文与历史')
  assert.equal(catalog.some((item) => item.tagLabel === '主题'), false)
  assert.equal(catalog.some((item) => item.sectionLabel === '创作'), false)
  assert.equal(catalog.some((item) => item.tagLabel === '公司观察' || item.tagLabel === '人物'), false)
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

test('runtime catalog replaces only the stale latest slot in the painted batch', () => {
  const pinned = { id: 'research:topics:workbuddy-tutorial-resources', section: 'research', sortKey: '2026-08-28T11:18:00' }
  const staleLatest = {
    id: 'research:topics:nobody-argued-for-your-stack',
    section: 'research',
    sortKey: '2026-09-10T00:00:00',
    isLatest: true,
  }
  const filler = { id: 'column:old-post', section: 'column', sortKey: '2026-07-17T00:00:00' }
  const painted = [pinned, staleLatest, filler]
  const runtimeCatalog = [
    pinned,
    {
      id: 'research:topics:cryptocurrency-exchanges',
      section: 'research',
      sortKey: '2026-09-13T14:40:00',
    },
    staleLatest,
    filler,
  ]

  const beforeApi = reconcilePaintedHomeRecommendationLatest(painted, painted, { pinnedIds: [pinned.id] }, false)
  assert.deepEqual(beforeApi.map((item) => item.id), painted.map((item) => item.id))
  assert.equal(beforeApi[1].isLatest, true)

  const afterApi = reconcilePaintedHomeRecommendationLatest(painted, runtimeCatalog, { pinnedIds: [pinned.id] }, true)
  assert.deepEqual(afterApi.map((item) => item.id), [
    pinned.id,
    'research:topics:cryptocurrency-exchanges',
    filler.id,
  ])
  assert.equal(afterApi[1].isLatest, true)
})

test('runtime catalog keeps the painted batch order when the actual latest item is already visible', () => {
  const staleLatest = { id: 'old-latest', section: 'research', sortKey: '2026-09-10T00:00:00', isLatest: true }
  const actualLatest = { id: 'new-latest', section: 'research', sortKey: '2026-09-13T14:40:00' }
  const painted = [{ id: 'pin', section: 'research', sortKey: '2026-08-01T00:00:00' }, staleLatest, actualLatest]
  const reconciled = reconcilePaintedHomeRecommendationLatest(painted, painted, { pinnedIds: ['pin'] }, true)

  assert.deepEqual(reconciled.map((item) => item.id), painted.map((item) => item.id))
  assert.equal(reconciled[1].isLatest, false)
  assert.equal(reconciled[2].isLatest, true)
})

test('page reload advances the stored batch offset the same way as 换一批', () => {
  assert.equal(parseHomeRecommendationBatchOffset(undefined), 0)
  assert.equal(parseHomeRecommendationBatchOffset('-2'), 0)
  assert.equal(nextHomeRecommendationBatchOffset(0, 'navigate'), 0)
  assert.equal(nextHomeRecommendationBatchOffset(0, 'reload'), 1)
  assert.equal(nextHomeRecommendationBatchOffset(3, 'reload'), 4)
  assert.equal(nextHomeRecommendationBatchOffset(3, 'back_forward'), 3)
  assert.equal(getHomeRecommendationNavigationType({ getEntriesByType: () => [{ type: 'reload' }] }), 'reload')
  assert.equal(getHomeRecommendationNavigationType({ navigation: { type: 1 } }), 'reload')
  assert.equal(getHomeRecommendationNavigationType({ getEntriesByType: () => [{ type: 'navigate' }] }), 'navigate')

  const memory = new Map()
  const storage = {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => { memory.set(key, String(value)) },
  }
  assert.equal(readHomeRecommendationBatchOffset(storage), 0)
  writeHomeRecommendationBatchOffset(storage, 2)
  assert.equal(memory.get(HOME_RECOMMENDATION_BATCH_OFFSET_STORAGE_KEY), '2')
  assert.equal(readHomeRecommendationBatchOffset(storage), 2)

  const first = chooseHomeRecommendationBatch(catalog, settings, 0, [], { includeHighlights: true })
  const afterReload = chooseHomeRecommendationBatch(
    catalog,
    settings,
    nextHomeRecommendationBatchOffset(0, 'reload'),
    first.map((item) => item.id),
    { includeHighlights: false },
  )
  const afterClick = chooseHomeRecommendationBatch(
    catalog,
    settings,
    1,
    first.map((item) => item.id),
    { includeHighlights: false },
  )
  assert.deepEqual(afterReload.map((item) => item.id), afterClick.map((item) => item.id))
  assert.notDeepEqual(afterReload.map((item) => item.id), first.map((item) => item.id))
})

test('home article latest scope lists enabled items by recency, resources stay in their own tab', () => {
  const mixed = [
    { id: 'column-old', section: 'column', sortKey: '2026-08-01T00:00:00' },
    { id: 'resource-new', section: 'resources', sortKey: '2026-09-15T00:00:00' },
    { id: 'research-mid', section: 'research', sortKey: '2026-09-10T12:00:00' },
    { id: 'feed-skip', section: 'feed', sortKey: '2026-09-16T00:00:00' },
  ]
  const latest = listHomeArticleScopeCatalog(mixed, {}, 'latest')
  const resources = listHomeArticleScopeCatalog(mixed, {}, 'resources')
  const recommended = listHomeArticleScopeCatalog(mixed, {}, 'recommended')

  assert.deepEqual(latest.map((item) => item.id), ['resource-new', 'research-mid', 'column-old'])
  assert.deepEqual(resources.map((item) => item.id), ['resource-new'])
  assert.deepEqual(recommended.map((item) => item.id).sort(), ['column-old', 'research-mid', 'resource-new'])
  assert.deepEqual(sliceHomeArticleScopeItems(latest, 2).map((item) => item.id), ['resource-new', 'research-mid'])
  assert.equal(sliceHomeArticleScopeItems(latest).length, Math.min(latest.length, HOME_ARTICLE_SCOPE_PAGE_SIZE))
  assert.equal(isHomeArticleScope('latest'), true)
  assert.equal(isHomeArticleScope('hot'), false)
  assert.equal(homeArticleScopeSurface('latest'), 'home_latest')
  assert.equal(homeArticleScopeSurface('resources'), 'home_resources')
  assert.equal(homeArticleScopeSurface('recommended'), 'home_recommendation')
})

test('home article scopes include WorkBuddy, AI and Web3 tabs filtered by subject', () => {
  const mixed = [
    { id: 'wb-old', section: 'research', sortKey: '2026-08-01T00:00:00', subjects: ['workbuddy'] },
    { id: 'wb-new', section: 'research', sortKey: '2026-09-18T00:00:00', subjects: ['workbuddy'] },
    { id: 'web3-mid', section: 'research', sortKey: '2026-09-10T12:00:00', subjects: ['web3'] },
    { id: 'web3-resource', section: 'resources', sortKey: '2026-09-16T00:00:00', subjects: ['web3'] },
    { id: 'ai-new', section: 'column', sortKey: '2026-09-17T00:00:00', subjects: ['ai_dev'] },
    { id: 'ai-old', section: 'research', sortKey: '2026-08-20T00:00:00', subjects: ['ai_dev'] },
  ]
  const workbuddy = listHomeArticleScopeCatalog(mixed, {}, 'workbuddy')
  const ai = listHomeArticleScopeCatalog(mixed, {}, 'ai_dev')
  const web3 = listHomeArticleScopeCatalog(mixed, {}, 'web3')

  assert.deepEqual(HOME_ARTICLE_SCOPE_KEYS, ['recommended', 'latest', 'resources', 'ai_dev', 'web3', 'workbuddy'])
  assert.equal(HOME_ARTICLE_SCOPE_META.workbuddy.label, SUBJECT_META.workbuddy.label)
  assert.equal(HOME_ARTICLE_SCOPE_META.ai_dev.label, 'AI')
  assert.equal(HOME_ARTICLE_SCOPE_META.web3.label, SUBJECT_META.web3.label)
  assert.deepEqual(workbuddy.map((item) => item.id), ['wb-new', 'wb-old'])
  assert.deepEqual(ai.map((item) => item.id), ['ai-new', 'ai-old'])
  assert.deepEqual(web3.map((item) => item.id), ['web3-resource', 'web3-mid'])
  assert.equal(isHomeArticleScope('workbuddy'), true)
  assert.equal(isHomeArticleScope('ai_dev'), true)
  assert.equal(isHomeArticleScope('web3'), true)
  assert.equal(homeArticleScopeSurface('workbuddy'), 'home_workbuddy')
  assert.equal(homeArticleScopeSurface('ai_dev'), 'home_ai_dev')
  assert.equal(homeArticleScopeSurface('web3'), 'home_web3')
})

test('home recommendation catalog exposes WorkBuddy, AI and Web3 articles for homepage tabs', () => {
  const catalog = buildHomeRecommendationCatalog([], Object.values(RESEARCH_ENTRY_META))
  const workbuddy = listHomeArticleScopeCatalog(catalog, {}, 'workbuddy')
  const ai = listHomeArticleScopeCatalog(catalog, {}, 'ai_dev')
  const web3 = listHomeArticleScopeCatalog(catalog, {}, 'web3')

  assert.ok(workbuddy.length >= 8)
  assert.ok(ai.length >= 8)
  assert.ok(web3.length >= 10)
  assert.ok(workbuddy.every((item) => item.subjects.includes('workbuddy')))
  assert.ok(ai.every((item) => item.subjects.includes('ai_dev')))
  assert.ok(web3.every((item) => item.subjects.includes('web3')))
  assert.ok(workbuddy.some((item) => item.id === 'research:topics:workbuddy-beginner-guide'))
  assert.ok(ai.some((item) => item.id === 'research:topics:vibe-coding-judgment-structure'))
  assert.ok(web3.some((item) => item.id === 'research:topics:crypto-bitcoin'))
  assert.ok(!workbuddy.some((item) => item.id === 'research:topics:china-mobile-mobilework'))
})

test('homepage reload uses the same batch change path as 换一批', async () => {
  const [readingSource, pageSource, cssSource] = await Promise.all([
    readFile(new URL('../app/(site)/components/HomeFeaturedReadingClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(site)/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
  ])
  assert.match(readingSource, /nextHomeRecommendationBatchOffset/)
  assert.match(readingSource, /navigationType === 'reload'/)
  assert.match(readingSource, /writeHomeRecommendationBatchOffset\(window\.sessionStorage, next\)/)
  assert.match(pageSource, /data-home-batch-reload/)
  assert.match(cssSource, /html\[data-home-batch-reload\] \.home-reading-list/)
})

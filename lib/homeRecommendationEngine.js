import { SUBJECT_META } from './contentTaxonomy.js'

export const HOME_RECOMMENDATION_MIN_BATCH_SIZE = 14
export const HOME_RECOMMENDATION_MAX_BATCH_SIZE = 18
export const HOME_RECOMMENDATION_BATCH_OFFSET_STORAGE_KEY = 'home-recommendation-batch-offset'
export const HOME_RECOMMENDATION_RELOAD_GUARD = '__homeRecommendationReloadApplied'

export const DEFAULT_HOME_RECOMMENDATION_CLIENT_SETTINGS = {
  enabled: true,
  batchSize: HOME_RECOMMENDATION_MIN_BATCH_SIZE,
  autoRotateHours: 12,
  rotationMode: 'random',
  avoidImmediateRepeats: true,
  sources: {
    column: { enabled: true, weight: 3 },
    research: { enabled: true, weight: 3 },
    resources: { enabled: true, weight: 2 },
  },
  pinnedIds: ['research:topics:workbuddy-tutorial-resources'],
}

export const HOME_ARTICLE_SCOPE_META = {
  recommended: { label: '推荐', labelEn: 'Picks' },
  latest: { label: '最新', labelEn: 'Latest' },
  resources: { label: '资源', labelEn: 'Resources' },
  workbuddy: { label: SUBJECT_META.workbuddy.label, labelEn: 'WorkBuddy' },
  web3: { label: SUBJECT_META.web3.label, labelEn: 'Web3' },
}
export const HOME_SUBJECT_SCOPE_KEYS = ['workbuddy', 'web3']
export const HOME_ARTICLE_SCOPE_KEYS = Object.keys(HOME_ARTICLE_SCOPE_META)
export const HOME_ARTICLE_SCOPE_PAGE_SIZE = HOME_RECOMMENDATION_MAX_BATCH_SIZE

export function isHomeArticleScope(value) {
  return HOME_ARTICLE_SCOPE_KEYS.includes(value)
}

function hashSeed(input) {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function randomFor(seed, id) {
  let state = hashSeed(`${seed}:${id}`)
  state ^= state << 13
  state ^= state >>> 17
  state ^= state << 5
  return ((state >>> 0) + 1) / 4294967297
}

export function mergeHomeRecommendationSettings(input) {
  const defaults = DEFAULT_HOME_RECOMMENDATION_CLIENT_SETTINGS
  const parsedHours = Number.parseInt(input?.autoRotateHours, 10)
  const parsedBatchSize = Number.parseInt(input?.batchSize, 10)
  return {
    ...defaults,
    ...(input || {}),
    batchSize: Number.isFinite(parsedBatchSize)
      ? Math.min(HOME_RECOMMENDATION_MAX_BATCH_SIZE, Math.max(HOME_RECOMMENDATION_MIN_BATCH_SIZE, parsedBatchSize))
      : defaults.batchSize,
    autoRotateHours: Number.isFinite(parsedHours) ? Math.min(168, Math.max(1, parsedHours)) : defaults.autoRotateHours,
    sources: Object.fromEntries(Object.keys(defaults.sources).map((source) => [
      source,
      { ...defaults.sources[source], ...(input?.sources?.[source] || {}) },
    ])),
    pinnedIds: Array.isArray(input?.pinnedIds) ? input.pinnedIds : defaults.pinnedIds,
  }
}

export function getHomeRecommendationBatchNumber(autoRotateHours, now = Date.now()) {
  const parsedHours = Number.parseInt(autoRotateHours, 10)
  const hours = Number.isFinite(parsedHours) ? Math.min(168, Math.max(1, parsedHours)) : 12
  return Math.floor(now / (hours * 60 * 60 * 1000))
}

/** 距离下一次自动换批的毫秒数；页面加载时只预约，不立刻改第一屏。 */
export function getHomeRecommendationRotateDelayMs(autoRotateHours, now = Date.now()) {
  const parsedHours = Number.parseInt(autoRotateHours, 10)
  const hours = Number.isFinite(parsedHours) ? Math.min(168, Math.max(1, parsedHours)) : 12
  const intervalMs = hours * 60 * 60 * 1000
  return intervalMs - (now % intervalMs) + 100
}

export function parseHomeRecommendationBatchOffset(value) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return Math.floor(parsed)
}

export function getHomeRecommendationNavigationType(performanceLike) {
  const timing = performanceLike || (typeof performance === 'undefined' ? null : performance)
  const entry = timing?.getEntriesByType?.('navigation')?.[0]
  if (entry?.type) return entry.type
  if (timing?.navigation?.type === 1) return 'reload'
  return 'navigate'
}

/** 整页刷新与点「换一批」走同一套偏移；同会话内再次进入首页则恢复上次批次。 */
export function nextHomeRecommendationBatchOffset(storedOffset, navigationType) {
  const current = parseHomeRecommendationBatchOffset(storedOffset)
  return navigationType === 'reload' ? current + 1 : current
}

export function readHomeRecommendationBatchOffset(storage) {
  try {
    return parseHomeRecommendationBatchOffset(storage?.getItem?.(HOME_RECOMMENDATION_BATCH_OFFSET_STORAGE_KEY))
  } catch {
    return 0
  }
}

export function writeHomeRecommendationBatchOffset(storage, offset) {
  try {
    storage?.setItem?.(HOME_RECOMMENDATION_BATCH_OFFSET_STORAGE_KEY, String(parseHomeRecommendationBatchOffset(offset)))
  } catch {
    // Safari 隐私模式等场景可能禁用 sessionStorage，忽略即可。
  }
}

function recommendationItemSignature(item) {
  return [
    item?.id,
    item?.href,
    item?.title,
    item?.summary,
    item?.date,
    item?.sortKey,
    item?.section,
    item?.sectionLabel,
    item?.tagLabel,
    Array.isArray(item?.subjects) ? item.subjects.join(',') : '',
  ].join('\u0000')
}

export function sameHomeRecommendationSettings(left, right) {
  return JSON.stringify(mergeHomeRecommendationSettings(left)) === JSON.stringify(mergeHomeRecommendationSettings(right))
}

function enabledCatalogItems(catalog, settings) {
  return (Array.isArray(catalog) ? catalog : []).filter((item) => settings.sources[item.section]?.enabled === true)
}

function compareRecommendationRecency(a, b) {
  return String(b.sortKey || '').localeCompare(String(a.sortKey || '')) || String(a.id || '').localeCompare(String(b.id || ''))
}

function itemHasSubject(item, subject) {
  return Array.isArray(item?.subjects) && item.subjects.includes(subject)
}

/** 首页文章栏的一级范围：推荐沿用批次，最新按时间，资源只列资源条目，主题标签按 subjects 过滤。 */
export function listHomeArticleScopeCatalog(catalog, rawSettings, scope) {
  const settings = mergeHomeRecommendationSettings(rawSettings)
  const eligible = enabledCatalogItems(catalog, settings)
  if (scope === 'resources') {
    return eligible.filter((item) => item.section === 'resources').sort(compareRecommendationRecency)
  }
  if (HOME_SUBJECT_SCOPE_KEYS.includes(scope)) {
    return eligible.filter((item) => itemHasSubject(item, scope)).sort(compareRecommendationRecency)
  }
  if (scope === 'latest') {
    return [...eligible].sort(compareRecommendationRecency)
  }
  return eligible
}

export function sliceHomeArticleScopeItems(items, visibleCount = HOME_ARTICLE_SCOPE_PAGE_SIZE) {
  const parsed = Number.parseInt(visibleCount, 10)
  const count = Number.isFinite(parsed) ? Math.max(0, parsed) : HOME_ARTICLE_SCOPE_PAGE_SIZE
  return (Array.isArray(items) ? items : []).slice(0, count)
}

export function homeArticleScopeSurface(scope) {
  if (scope === 'latest') return 'home_latest'
  if (scope === 'resources') return 'home_resources'
  if (HOME_SUBJECT_SCOPE_KEYS.includes(scope)) return `home_${scope}`
  return 'home_recommendation'
}

/** 人工置顶之外、按 sortKey 最新的一条；置顶本身不占用「最新」标记。 */
export function pickLatestHomeRecommendationItem(catalog, rawSettings) {
  const settings = mergeHomeRecommendationSettings(rawSettings)
  const pinned = new Set(settings.pinnedIds)
  return enabledCatalogItems(catalog, settings)
    .filter((item) => !pinned.has(item.id))
    .sort(compareRecommendationRecency)[0] || null
}

/**
 * 运行时目录与首屏目录用同一套条目字段；字段相同则保持原数组，避免无意义重绘。
 */
export function mergeHomeRecommendationCatalog(current, incoming) {
  if (!Array.isArray(incoming)) return Array.isArray(current) ? current : []
  const currentList = Array.isArray(current) ? current : []
  if (incoming.length === currentList.length && incoming.every((item, index) => (
    recommendationItemSignature(item) === recommendationItemSignature(currentList[index])
  ))) {
    return currentList
  }
  return incoming
}

/**
 * 运行时目录可能比构建期首屏更新。只替换原来的最新内容位，避免整批内容重排。
 */
export function reconcilePaintedHomeRecommendationLatest(items, catalog, rawSettings, runtimeReady) {
  if (!runtimeReady || !Array.isArray(items) || !items.length) return items || []
  const latestItem = pickLatestHomeRecommendationItem(catalog, rawSettings)
  if (!latestItem) return items

  const visibleLatestIndex = items.findIndex((item) => item.id === latestItem.id)
  const paintedLatestIndex = items.findIndex((item) => item.isLatest)
  if (visibleLatestIndex < 0 && paintedLatestIndex < 0) return items

  return items.map((item, index) => {
    if (index === visibleLatestIndex) return { ...latestItem, isLatest: true }
    if (visibleLatestIndex < 0 && index === paintedLatestIndex) return { ...latestItem, isLatest: true }
    return item.isLatest ? { ...item, isLatest: false } : item
  })
}

/** 首屏已经画出来的批次，在读者换一批或自动轮换前保持原样。 */
export function selectHomeRecommendationItems(computedItems, paintedItems, lockFirstBatch) {
  if (lockFirstBatch && Array.isArray(paintedItems) && paintedItems.length) return paintedItems
  return computedItems
}

function normalizeSearchValue(value) {
  return String(value || '').trim().toLocaleLowerCase('zh-CN')
}

/** 在完整首页候选池中搜索，覆盖标题、摘要、标签、栏目类型和日期。 */
export function searchHomeRecommendationCatalog(catalog, query, limit = 10) {
  const needle = normalizeSearchValue(query)
  if (!needle) return []
  return catalog
    .map((item, index) => {
      const title = normalizeSearchValue(item.title)
      const fields = [
        item.title,
        item.summary,
        item.section,
        item.sectionLabel,
        item.tagLabel,
        item.date,
        ...(Array.isArray(item.tags) ? item.tags : []),
      ]
      const matches = normalizeSearchValue(fields.join(' ')).includes(needle)
      const score = title === needle ? 3 : title.startsWith(needle) ? 2 : title.includes(needle) ? 1 : 0
      return { item, index, matches, score }
    })
    .filter((entry) => entry.matches)
    .sort((a, b) => b.score - a.score
      || String(b.item.sortKey || '').localeCompare(String(a.item.sortKey || ''))
      || a.index - b.index)
    .slice(0, Math.max(0, limit))
    .map((entry) => entry.item)
}

/**
 * 从完整候选池选出一批推荐。人工置顶始终优先占用每批名额；首屏额外固定最新内容。
 * 换一批只轮换其余条目，不会撤下置顶。
 */
export function chooseHomeRecommendationBatch(
  catalog,
  rawSettings,
  batchNumber,
  previousIds = [],
  { includeHighlights = true } = {},
) {
  const settings = mergeHomeRecommendationSettings(rawSettings)
  const eligible = enabledCatalogItems(catalog, settings)
  const byId = new Map(eligible.map((item) => [item.id, item]))
  const selected = settings.pinnedIds.map((id) => byId.get(id)).filter(Boolean)
  const selectedIds = new Set(selected.map((item) => item.id))
  const oldIds = new Set(previousIds)
  const latestItem = includeHighlights ? pickLatestHomeRecommendationItem(eligible, settings) : null

  // 人工置顶之后固定展示最新内容；若最新内容已经置顶，则展示下一条最新内容。
  if (latestItem && selected.length < settings.batchSize) {
    selected.push(latestItem)
    selectedIds.add(latestItem.id)
  }

  const count = Math.max(0, settings.batchSize - selected.length)
  const completePool = eligible.filter((item) => !selectedIds.has(item.id))
  const freshPool = completePool.filter((item) => !oldIds.has(item.id))
  const pool = settings.avoidImmediateRepeats && freshPool.length >= count ? freshPool : completePool

  if (settings.rotationMode === 'ordered') {
    const sorted = [...pool].sort((a, b) => String(b.sortKey || '').localeCompare(String(a.sortKey || '')))
    const start = sorted.length ? (batchNumber * count) % sorted.length : 0
    let ranked = [...sorted.slice(start), ...sorted.slice(0, start)]
    if (settings.avoidImmediateRepeats) {
      ranked = [
        ...ranked.filter((item) => !oldIds.has(item.id)),
        ...ranked.filter((item) => oldIds.has(item.id)),
      ]
    }
    selected.push(...ranked.slice(0, count))
  } else {
    const seed = `home-recommendations:${settings.autoRotateHours}:${batchNumber}`
    const sourcePools = pool.reduce((groups, item, index) => {
      const repeatPenalty = settings.avoidImmediateRepeats && oldIds.has(item.id) ? -2 : 0
      const entry = { item, score: randomFor(seed, item.id) + repeatPenalty, index }
      if (!groups[item.section]) groups[item.section] = []
      groups[item.section].push(entry)
      return groups
    }, {})
    for (const entries of Object.values(sourcePools)) {
      entries.sort((a, b) => b.score - a.score || a.index - b.index)
    }

    for (let slot = 0; slot < count; slot += 1) {
      const sources = Object.keys(sourcePools).filter((source) => sourcePools[source]?.length)
      if (!sources.length) break
      const totalWeight = sources.reduce(
        (total, source) => total + Math.max(1, Number(settings.sources[source]?.weight) || 1),
        0,
      )
      let cursor = randomFor(seed, `source:${slot}`) * totalWeight
      let chosenSource = sources[sources.length - 1]
      for (const source of sources) {
        cursor -= Math.max(1, Number(settings.sources[source]?.weight) || 1)
        if (cursor <= 0) {
          chosenSource = source
          break
        }
      }
      selected.push(sourcePools[chosenSource].shift().item)
    }
  }

  return selected.slice(0, settings.batchSize).map((item) => ({
    ...item,
    isLatest: item.id === latestItem?.id,
  }))
}

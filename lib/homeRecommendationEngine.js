export const HOME_RECOMMENDATION_MIN_BATCH_SIZE = 14
export const HOME_RECOMMENDATION_MAX_BATCH_SIZE = 18

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
  ].join('\u0000')
}

export function sameHomeRecommendationSettings(left, right) {
  return JSON.stringify(mergeHomeRecommendationSettings(left)) === JSON.stringify(mergeHomeRecommendationSettings(right))
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
  const eligible = catalog.filter((item) => settings.sources[item.section]?.enabled === true)
  const byId = new Map(eligible.map((item) => [item.id, item]))
  const selected = settings.pinnedIds.map((id) => byId.get(id)).filter(Boolean)
  const selectedIds = new Set(selected.map((item) => item.id))
  const oldIds = new Set(previousIds)
  const latestItem = includeHighlights
    ? eligible
      .filter((item) => !selectedIds.has(item.id))
      .sort((a, b) => String(b.sortKey || '').localeCompare(String(a.sortKey || '')) || a.id.localeCompare(b.id))[0]
    : null

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

export const DEFAULT_HOME_RECOMMENDATION_CLIENT_SETTINGS = {
  enabled: true,
  batchSize: 10,
  autoRotateHours: 12,
  rotationMode: 'random',
  avoidImmediateRepeats: true,
  sources: {
    feed: { enabled: true, weight: 2 },
    column: { enabled: true, weight: 3 },
    research: { enabled: true, weight: 3 },
    resources: { enabled: true, weight: 2 },
  },
  pinnedIds: [],
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
  return {
    ...defaults,
    ...(input || {}),
    autoRotateHours: Number.isFinite(parsedHours) ? Math.min(168, Math.max(1, parsedHours)) : defaults.autoRotateHours,
    sources: Object.fromEntries(Object.keys(defaults.sources).map((source) => [
      source,
      { ...defaults.sources[source], ...(input?.sources?.[source] || {}) },
    ])),
    pinnedIds: Array.isArray(input?.pinnedIds) ? input.pinnedIds : [],
  }
}

export function getHomeRecommendationBatchNumber(autoRotateHours, now = Date.now()) {
  const parsedHours = Number.parseInt(autoRotateHours, 10)
  const hours = Number.isFinite(parsedHours) ? Math.min(168, Math.max(1, parsedHours)) : 12
  return Math.floor(now / (hours * 60 * 60 * 1000))
}

/**
 * 从完整候选池选出一批推荐。人工置顶项优先；其余按权重随机或时间轮换。
 * 在候选数量足够时，换一批会替换全部非置顶内容。
 */
export function chooseHomeRecommendationBatch(catalog, rawSettings, batchNumber, previousIds = []) {
  const settings = mergeHomeRecommendationSettings(rawSettings)
  const eligible = catalog.filter((item) => settings.sources[item.section]?.enabled !== false)
  const byId = new Map(eligible.map((item) => [item.id, item]))
  const selected = settings.pinnedIds.map((id) => byId.get(id)).filter(Boolean)
  const selectedIds = new Set(selected.map((item) => item.id))
  const oldIds = new Set(previousIds)
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

  return selected.slice(0, settings.batchSize)
}

function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function seededShuffle(items, seed) {
  const arr = [...items]
  let state = hashString(seed)
  for (let i = arr.length - 1; i > 0; i -= 1) {
    state = (state * 1103515245 + 12345) >>> 0
    const j = state % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * 固定最新若干条，其余从候选池按 seed 随机抽取。
 * items 需已按 date 降序排列；latestCount 从头部取「最新」。
 */
export function pickWithLatest({ items, count, latestCount = 1, seed }) {
  if (!items.length || count <= 0) return []

  const pinnedCount = Math.min(latestCount, count, items.length)
  const pinned = items.slice(0, pinnedCount).map((item) => ({ ...item, isLatest: true }))
  const pinnedIds = new Set(pinned.map((item) => item.id))
  const pool = items.filter((item) => !pinnedIds.has(item.id))
  const shuffled = seededShuffle(pool, seed)
  const randomCount = Math.max(0, count - pinned.length)

  return [...pinned, ...shuffled.slice(0, randomCount)]
}

export function getDailyPickSeed(scope) {
  const day = new Date().toISOString().slice(0, 10)
  return `${day}:${scope}`
}

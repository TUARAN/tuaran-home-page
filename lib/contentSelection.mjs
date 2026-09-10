export function selectRelatedContent(entries, contentKey, { limit = 4 } = {}) {
  const current = entries.find((entry) => entry.contentKey === contentKey)
  const pool = entries.filter((e) => e.contentKey !== contentKey && e.type !== 'feed')
  if (!current) return pool.slice(0, limit)

  const currentTags = new Set(current.tags || [])
  const scored = pool.map((entry) => {
    let score = 0
    for (const tag of entry.tags || []) {
      if (currentTags.has(tag)) score += 3
    }
    if (entry.category === current.category) score += 1
    return { entry, score }
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return String(b.entry.date).localeCompare(String(a.entry.date))
  })

  return scored.slice(0, limit).map((s) => s.entry)
}


/** 类型 → 中文标注（相关阅读角标用）。 */
export const CONTENT_PIPELINE_TYPE_LABELS = {
  research: '分析',
  article: '文章',
  resource: '资源',
  feed: '灵感',
  'rich-page': '互动专题',
}

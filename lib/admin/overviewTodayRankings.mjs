import { readContentCatalog } from '../content/contentCatalogRuntime'
import { loadContentKeyMeta } from '../content/contentKeyLite'
import { resolveContentKey } from '../article/articleLinks'
import { readingVisitorName } from '../auth/readingVisitorIdentity.mjs'

export const OVERVIEW_TODAY_RANK_LIMIT = 8

function visitorKeySql() {
  return `CASE WHEN user_id <> '' THEN user_id ELSE visitor_hash END`
}

function resolveReadRows(rows, metadata) {
  return rows.map((row) => {
    const resolved = resolveContentKey(row.category, row.slug, metadata)
    const pv = Number(row.pv) || 0
    return {
      key: `${row.category}/${row.slug}`,
      title: resolved.title,
      href: resolved.href,
      type: resolved.type,
      pv,
      uv: Number(row.uv) || 0,
    }
  })
}

function mapVisitor(row) {
  const key = row.visitor_key || ''
  const type = row.visitor_type || 'anonymous'
  return {
    key,
    type,
    provider: row.user_provider || '',
    name: readingVisitorName({ visitorType: type, visitorKey: key, userName: row.user_name || '' }),
    pv: Number(row.pv) || 0,
    contentCount: Number(row.content_count) || 0,
    lastSeen: Number(row.last_seen) || 0,
  }
}

/**
 * 后台总览用：北京时间「今日」的文章 PV 排行与读者 PV 排行（qualified 口径，与内容周报 today 块一致）。
 */
export async function loadOverviewTodayRankings(db, todayStartMs, now = Date.now()) {
  const visitorKey = visitorKeySql()
  const limit = OVERVIEW_TODAY_RANK_LIMIT

  const [contentResult, visitorResult] = await Promise.all([
    db
      .prepare(
        `SELECT category, slug, COUNT(*) AS pv, COUNT(DISTINCT ${visitorKey}) AS uv
         FROM research_pv_hits
         WHERE quality = 'qualified' AND created_at >= ?1 AND created_at <= ?2
         GROUP BY category, slug
         ORDER BY pv DESC, uv DESC
         LIMIT ?3`,
      )
      .bind(todayStartMs, now, limit)
      .all()
      .catch(() => ({ results: [] })),
    db
      .prepare(
        `SELECT ${visitorKey} AS visitor_key,
           MAX(visitor_type) AS visitor_type,
           MAX(user_provider) AS user_provider,
           MAX(user_name) AS user_name,
           COUNT(*) AS pv,
           COUNT(DISTINCT category || '/' || slug) AS content_count,
           MAX(created_at) AS last_seen
         FROM research_pv_hits
         WHERE quality = 'qualified' AND created_at >= ?1 AND created_at <= ?2
         GROUP BY visitor_key
         ORDER BY pv DESC, last_seen DESC
         LIMIT ?3`,
      )
      .bind(todayStartMs, now, limit)
      .all()
      .catch(() => ({ results: [] })),
  ])

  const contentRows = contentResult?.results || []
  const visitorRows = visitorResult?.results || []

  if (!contentRows.length && !visitorRows.length) {
    return { topContent: [], topReaders: [] }
  }

  const archived = await readContentCatalog()
  const metadata = new Map(archived.entries.map((entry) => [entry.contentKey, { title: entry.title, href: entry.href }]))
  const keys = contentRows.map((row) =>
    ['companies', 'topics', 'people'].includes(row.category)
      ? `research:${row.category}:${row.slug}`
      : `${row.category}:${row.slug}`,
  )
  if (keys.length) {
    for (const [key, value] of await loadContentKeyMeta(db, keys)) metadata.set(key, value)
  }

  return {
    topContent: resolveReadRows(contentRows, metadata),
    topReaders: visitorRows.map(mapVisitor),
  }
}
import { readContentCatalog } from '../content/contentCatalogRuntime'
import { loadContentKeyMeta } from '../content/contentKeyLite'
import { resolveContentKey } from '../article/articleLinks'
import { readingVisitorName } from '../auth/readingVisitorIdentity.mjs'
import { readerAccountUserId } from './readerAccountAdmin.mjs'
import { getTodayUnlockCountsForUsers } from '../ledger/points.js'
import { shanghaiDayStartMs } from '../site/analyticsSources.mjs'

export const OVERVIEW_TODAY_RANK_LIMIT = 8
const DEFAULT_SOURCE_LIMIT = 8

/** 与内容周报、读者明细一致的读者归一键 */
export function visitorKeySql() {
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
      previousPv: Number(row.previous_pv) || 0,
      delta: pv - (Number(row.previous_pv) || 0),
    }
  })
}

export function mapReadingVisitor(row, extra = {}) {
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
    ...extra,
  }
}

function mapSourceRow(row) {
  return {
    source: row.source || 'direct',
    medium: row.medium || 'none',
    campaign: row.campaign || '',
    referrerHost: row.referrer_host || '',
    pv: Number(row.pv) || 0,
    uv: Number(row.uv) || 0,
  }
}

async function attachTodayUnlockCounts(db, visitors, todayStartMs, now) {
  const accountIds = []
  const indexByAccount = new Map()
  for (let i = 0; i < visitors.length; i += 1) {
    const visitor = visitors[i]
    const accountUserId = readerAccountUserId({ key: visitor.key, type: visitor.type })
    if (!accountUserId) {
      visitors[i] = { ...visitor, todayUnlockCount: null }
      continue
    }
    accountIds.push(accountUserId)
    if (!indexByAccount.has(accountUserId)) indexByAccount.set(accountUserId, [])
    indexByAccount.get(accountUserId).push(i)
  }
  if (!accountIds.length) return visitors

  const counts = await getTodayUnlockCountsForUsers(db, accountIds, todayStartMs, now).catch(() => ({}))
  for (const [accountUserId, indexes] of indexByAccount) {
    const unlockCount = Number(counts[accountUserId]) || 0
    for (const index of indexes) {
      visitors[index] = { ...visitors[index], todayUnlockCount: unlockCount }
    }
  }
  return visitors
}

/**
 * 后台「今日」有效阅读快照：总览与内容周报 today 块共用同一套查询与组装。
 */
export async function loadTodayQualifiedReadingSnapshot(db, options = {}) {
  const now = options.now ?? Date.now()
  const todayStartMs = options.todayStartMs ?? shanghaiDayStartMs(now)
  const contentLimit = Math.max(1, Number(options.contentLimit) || OVERVIEW_TODAY_RANK_LIMIT)
  const visitorLimit = Math.max(1, Number(options.visitorLimit) || OVERVIEW_TODAY_RANK_LIMIT)
  const sourceLimit = Math.max(0, Number(options.sourceLimit) || DEFAULT_SOURCE_LIMIT)
  const visitorKey = visitorKeySql()

  const queries = [
    db
      .prepare(
        `SELECT COUNT(*) AS pv, COUNT(DISTINCT ${visitorKey}) AS uv
         FROM research_pv_hits
         WHERE quality = 'qualified' AND created_at >= ?1 AND created_at <= ?2`,
      )
      .bind(todayStartMs, now)
      .first()
      .catch(() => null),
    db
      .prepare(
        `SELECT category, slug, COUNT(*) AS pv, COUNT(DISTINCT ${visitorKey}) AS uv, 0 AS previous_pv
         FROM research_pv_hits
         WHERE quality = 'qualified' AND created_at >= ?1 AND created_at <= ?2
         GROUP BY category, slug
         ORDER BY pv DESC, uv DESC
         LIMIT ?3`,
      )
      .bind(todayStartMs, now, contentLimit)
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
      .bind(todayStartMs, now, visitorLimit)
      .all()
      .catch(() => ({ results: [] })),
  ]

  if (sourceLimit > 0) {
    queries.push(
      db
        .prepare(
          `SELECT source, medium, campaign, referrer_host, COUNT(*) AS pv,
             COUNT(DISTINCT ${visitorKey}) AS uv
           FROM research_pv_hits
           WHERE quality = 'qualified' AND created_at >= ?1 AND created_at <= ?2
           GROUP BY source, medium, campaign, referrer_host
           ORDER BY pv DESC, uv DESC
           LIMIT ?3`,
        )
        .bind(todayStartMs, now, sourceLimit)
        .all()
        .catch(() => ({ results: [] })),
    )
  }

  const [overviewRow, contentResult, visitorResult, sourceResult] = await Promise.all(queries)

  const contentRows = contentResult?.results || []
  const visitorRows = visitorResult?.results || []
  const sourceRows = sourceResult?.results || []

  let topContent = []
  let visitors = visitorRows.map((row) => mapReadingVisitor(row))

  if (contentRows.length) {
    const archived = await readContentCatalog()
    const metadata = new Map(
      archived.entries.map((entry) => [entry.contentKey, { title: entry.title, href: entry.href }]),
    )
    const keys = contentRows.map((row) =>
      ['companies', 'topics', 'people'].includes(row.category)
        ? `research:${row.category}:${row.slug}`
        : `${row.category}:${row.slug}`,
    )
    if (keys.length) {
      for (const [key, value] of await loadContentKeyMeta(db, keys)) metadata.set(key, value)
    }
    topContent = resolveReadRows(contentRows, metadata)
  }

  if (visitors.length) {
    visitors = await attachTodayUnlockCounts(db, visitors, todayStartMs, now)
  }

  return {
    todayStartMs,
    pv: Number(overviewRow?.pv) || 0,
    uv: Number(overviewRow?.uv) || 0,
    topContent,
    sources: sourceRows.map(mapSourceRow),
    visitors,
  }
}

/** @deprecated 名称保留：总览 API 仍从此入口取今日排行 */
export async function loadOverviewTodayRankings(db, todayStartMs, now = Date.now()) {
  const snapshot = await loadTodayQualifiedReadingSnapshot(db, {
    todayStartMs,
    now,
    contentLimit: OVERVIEW_TODAY_RANK_LIMIT,
    visitorLimit: OVERVIEW_TODAY_RANK_LIMIT,
    sourceLimit: 0,
  })
  if (!snapshot.topContent.length && !snapshot.visitors.length) {
    return { topContent: [], topReaders: [] }
  }
  return {
    topContent: snapshot.topContent,
    topReaders: snapshot.visitors,
  }
}
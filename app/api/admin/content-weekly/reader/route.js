import { readContentCatalog } from '../../../../../lib/content/contentCatalogRuntime'
import { loadContentKeyMeta } from '../../../../../lib/content/contentKeyLite'
import { getOwnerOrReject } from '../../../../../lib/admin/adminAuth'
import { resolveContentKey } from '../../../../../lib/article/articleLinks'
import { getD1 } from '../../../../../lib/db/d1'
import { readThroughEdgeCache } from '../../../../../lib/db/edgeCache.mjs'
import { readingVisitorName } from '../../../../../lib/auth/readingVisitorIdentity.mjs'
import { readerAccountUserId, readerUnlockAdminHref } from '../../../../../lib/admin/readerAccountAdmin.mjs'
import { getUnlockCountsForUsers } from '../../../../../lib/ledger/points.js'
import { cumulativeAnalyticsWindow, equalComparisonWindow } from '../../../../../lib/site/analyticsSources.mjs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const ALLOWED_DAYS = new Set([1, 7, 30, 90])
const CONTENT_LIMIT = 50

// 与 content-weekly 主接口保持同一读者归一口径：登录用户按 user_id 聚合，游客按 visitor_hash 聚合。
function visitorKeySql() {
  return `CASE WHEN user_id <> '' THEN user_id ELSE visitor_hash END`
}

// 读者明细是后台按需展开的二级视图。同一位读者在 60 秒内重复展开时，
// 不必再把它在统计窗口内的全部阅读事件扫一遍。
async function buildReaderDetail(db, { key, days, cumulative }) {
  const now = Date.now()
  const window = cumulative ? cumulativeAnalyticsWindow(now) : equalComparisonWindow(days, now)
  const periodStart = window.currentStart
  const visitorKey = visitorKeySql()

  const [readerRow, contentRows] = await Promise.all([
    db.prepare(
      `SELECT MAX(visitor_type) AS visitor_type, MAX(user_provider) AS user_provider,
         MAX(user_name) AS user_name, COUNT(*) AS pv,
         COUNT(DISTINCT category || '/' || slug) AS content_count,
         MIN(created_at) AS first_seen, MAX(created_at) AS last_seen
       FROM research_pv_hits WHERE quality = 'qualified' AND created_at >= ?1 AND created_at <= ?2
         AND (${visitorKey}) = ?3`,
    ).bind(periodStart, now, key).first(),
    db.prepare(
      `SELECT category, slug, COUNT(*) AS pv, MAX(created_at) AS last_seen
       FROM research_pv_hits WHERE quality = 'qualified' AND created_at >= ?1 AND created_at <= ?2
         AND (${visitorKey}) = ?3
       GROUP BY category, slug ORDER BY pv DESC, last_seen DESC LIMIT ?4`,
    ).bind(periodStart, now, key, CONTENT_LIMIT).all().then((r) => r.results || []),
  ])

  if (!readerRow || !Number(readerRow.pv)) {
    return { status: 'ok', generatedAt: now, window: { days, cumulative, periodStart, timezone: 'Asia/Shanghai' }, reader: null, content: [] }
  }

  const archived = await readContentCatalog()
  const metadata = new Map(archived.entries.map((entry) => [entry.contentKey, { title: entry.title, href: entry.href }]))
  const keys = contentRows.map((row) => ['companies', 'topics', 'people'].includes(row.category) ? `research:${row.category}:${row.slug}` : `${row.category}:${row.slug}`)
  for (let offset = 0; offset < keys.length; offset += 100) {
    for (const [metaKey, value] of await loadContentKeyMeta(db, keys.slice(offset, offset + 100))) metadata.set(metaKey, value)
  }

  const type = readerRow.visitor_type || 'anonymous'
  const accountUserId = readerAccountUserId({ key, type })
  let unlockCount = 0
  let lastUnlockAt = null
  if (accountUserId) {
    const unlocks = await getUnlockCountsForUsers(db, [accountUserId])
    unlockCount = Number(unlocks[accountUserId]?.unlockCount) || 0
    lastUnlockAt = unlocks[accountUserId]?.lastUnlockAt || null
  }

  return {
    status: 'ok',
    generatedAt: now,
    window: { days, cumulative, periodStart, timezone: 'Asia/Shanghai' },
    reader: {
      key,
      type,
      provider: readerRow.user_provider || '',
      name: readingVisitorName({ visitorType: type, visitorKey: key, userName: readerRow.user_name || '' }),
      pv: Number(readerRow.pv) || 0,
      contentCount: Number(readerRow.content_count) || 0,
      firstSeen: Number(readerRow.first_seen) || 0,
      lastSeen: Number(readerRow.last_seen) || 0,
      accountUserId,
      unlockCount,
      lastUnlockAt,
      unlockAdminHref: readerUnlockAdminHref(accountUserId),
    },
    content: contentRows.map((row) => {
      const resolved = resolveContentKey(row.category, row.slug, metadata)
      return {
        key: `${row.category}/${row.slug}`,
        title: resolved.title,
        href: resolved.href,
        type: resolved.type,
        pv: Number(row.pv) || 0,
        lastSeen: Number(row.last_seen) || 0,
      }
    }),
  }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const params = new URL(req.url).searchParams
  const key = (params.get('key') || '').trim()
  if (!key) return Response.json({ status: 'invalid', error: 'READER_KEY_REQUIRED' }, { status: 400 })

  const requestedRange = params.get('days')
  const cumulative = requestedRange === 'all'
  const requestedDays = Number(requestedRange)
  const days = cumulative ? 'all' : (ALLOWED_DAYS.has(requestedDays) ? requestedDays : 7)

  let db
  try {
    db = getD1()
  } catch {
    return Response.json({ status: 'unavailable', error: 'D1_UNAVAILABLE' }, { status: 503 })
  }

  try {
    // 与周报同口径：读者明细也是按周看的，60 秒刷新只会重复扫明细表。
    const payload = await readThroughEdgeCache(
      `admin:content-weekly:reader:${cumulative ? 'all' : days}:${key}`,
      300,
      () => buildReaderDetail(db, { key, days, cumulative }),
    )
    return Response.json(payload)
  } catch (e) {
    return Response.json({ status: 'unavailable', error: e?.message || 'READER_DETAIL_FAILED' }, { status: 503 })
  }
}

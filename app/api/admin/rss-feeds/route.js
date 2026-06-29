import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function rowToAdmin(row) {
  return {
    id: row.id,
    siteName: row.site_name || '',
    siteUrl: row.site_url || '',
    rssUrl: row.rss_url || '',
    description: row.description || '',
    category: row.category || '',
    published: row.published ? 1 : 0,
    sortOrder: Number(row.sort_order) || 0,
    createdAt: row.created_at,
  }
}

async function loadRssAnalytics(db) {
  const now = Date.now()
  const dayStart = now - 24 * 60 * 60 * 1000
  const weekStart = now - 7 * 24 * 60 * 60 * 1000
  const monthStart = now - 30 * 24 * 60 * 60 * 1000

  try {
    const [summary, readers, recent] = await Promise.all([
      db
        .prepare(
          `SELECT
             COUNT(*) AS total_requests,
             COUNT(DISTINCT client_hash) AS total_clients,
             SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS requests_24h,
             SUM(CASE WHEN created_at >= ?2 THEN 1 ELSE 0 END) AS requests_7d,
             SUM(CASE WHEN created_at >= ?3 THEN 1 ELSE 0 END) AS requests_30d,
             COUNT(DISTINCT CASE WHEN created_at >= ?2 THEN client_hash ELSE NULL END) AS clients_7d,
             COUNT(DISTINCT CASE WHEN created_at >= ?3 THEN client_hash ELSE NULL END) AS clients_30d,
             MAX(created_at) AS last_seen_at
           FROM rss_hits`,
        )
        .bind(dayStart, weekStart, monthStart)
        .first(),
      db
        .prepare(
          `SELECT
             COALESCE(reader, 'Unknown') AS reader,
             COUNT(*) AS requests,
             COUNT(DISTINCT client_hash) AS clients,
             MAX(created_at) AS last_seen_at
           FROM rss_hits
           WHERE created_at >= ?1
           GROUP BY COALESCE(reader, 'Unknown')
           ORDER BY requests DESC, last_seen_at DESC
           LIMIT 12`,
        )
        .bind(monthStart)
        .all()
        .then((r) => r.results || []),
      db
        .prepare(
          `SELECT path, reader, user_agent, referer, created_at
           FROM rss_hits
           ORDER BY created_at DESC
           LIMIT 30`,
        )
        .all()
        .then((r) => r.results || []),
    ])

    return {
      status: 'ok',
      note: 'RSS 没有订阅回调；这里统计的是 /rss.xml 请求次数与近似独立客户端。',
      summary: {
        totalRequests: Number(summary?.total_requests) || 0,
        totalClients: Number(summary?.total_clients) || 0,
        requests24h: Number(summary?.requests_24h) || 0,
        requests7d: Number(summary?.requests_7d) || 0,
        requests30d: Number(summary?.requests_30d) || 0,
        clients7d: Number(summary?.clients_7d) || 0,
        clients30d: Number(summary?.clients_30d) || 0,
        lastSeenAt: Number(summary?.last_seen_at) || 0,
      },
      readers: readers.map((row) => ({
        reader: row.reader || 'Unknown',
        requests: Number(row.requests) || 0,
        clients: Number(row.clients) || 0,
        lastSeenAt: Number(row.last_seen_at) || 0,
      })),
      recent: recent.map((row) => ({
        path: row.path || '/rss.xml',
        reader: row.reader || 'Unknown',
        userAgent: row.user_agent || '',
        referer: row.referer || '',
        createdAt: Number(row.created_at) || 0,
      })),
    }
  } catch (error) {
    return {
      status: 'unavailable',
      message: 'RSS 请求统计未就绪（需要跑 migration 0033_rss_hits.sql）。',
      detail: String(error?.message || error),
    }
  }
}

// 宽松归一化 URL：允许站长少打 https://，空串保持空。
function normUrl(value) {
  const s = String(value || '').trim()
  if (!s) return ''
  return /^https?:\/\//i.test(s) ? s : `https://${s}`
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) {
    return Response.json({
      status: 'unavailable',
      message: '当前运行环境没有 D1 绑定，RSS 订阅管理台不可用。',
      feeds: [],
    })
  }

  try {
    const [result, analytics] = await Promise.all([
      db
        .prepare('SELECT * FROM rss_feeds ORDER BY sort_order DESC, created_at DESC')
        .all(),
      loadRssAnalytics(db),
    ])
    return Response.json({ status: 'ok', feeds: (result?.results || []).map(rowToAdmin), analytics })
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        error: 'RSS_READ_FAILED',
        message: 'RSS 列表读取失败（迁移 0031 是否已应用？）。',
        detail: String(error?.message || error),
      },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  let body = null
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const siteName = String(body?.siteName || '').trim().slice(0, 200)
  const rssUrl = normUrl(body?.rssUrl).slice(0, 500)
  if (!siteName || !rssUrl) {
    return Response.json({ error: 'NAME_AND_RSS_REQUIRED' }, { status: 400 })
  }
  const siteUrl = normUrl(body?.siteUrl).slice(0, 500)
  const description = String(body?.description || '').trim().slice(0, 600)
  const category = String(body?.category || '').trim().slice(0, 60)
  const sortOrder = Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0

  const id = crypto.randomUUID()
  const createdAt = Date.now()

  try {
    await db
      .prepare(
        `INSERT INTO rss_feeds
          (id, site_name, site_url, rss_url, description, category, published, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
      )
      .bind(id, siteName, siteUrl, rssUrl, description, category, sortOrder, createdAt)
      .run()
  } catch (error) {
    return Response.json(
      { error: 'RSS_WRITE_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }

  const row = await db.prepare('SELECT * FROM rss_feeds WHERE id = ?').bind(id).first()
  return Response.json({ ok: true, feed: row ? rowToAdmin(row) : null })
}

export async function DELETE(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  const id = new URL(req.url).searchParams.get('id')?.trim()
  if (!id) return Response.json({ error: 'INVALID_ID' }, { status: 400 })

  try {
    const result = await db.prepare('DELETE FROM rss_feeds WHERE id = ?').bind(id).run()
    if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  } catch (error) {
    return Response.json(
      { error: 'RSS_DELETE_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }
  return Response.json({ ok: true })
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  let body = null
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const id = typeof body?.id === 'string' ? body.id.trim() : ''
  if (!id) return Response.json({ error: 'INVALID_ID' }, { status: 400 })

  const sets = []
  const binds = []
  if (typeof body.siteName === 'string' && body.siteName.trim()) {
    sets.push('site_name = ?')
    binds.push(body.siteName.trim().slice(0, 200))
  }
  if (typeof body.siteUrl === 'string') {
    sets.push('site_url = ?')
    binds.push(normUrl(body.siteUrl).slice(0, 500))
  }
  if (typeof body.rssUrl === 'string' && body.rssUrl.trim()) {
    sets.push('rss_url = ?')
    binds.push(normUrl(body.rssUrl).slice(0, 500))
  }
  if (typeof body.description === 'string') {
    sets.push('description = ?')
    binds.push(body.description.trim().slice(0, 600))
  }
  if (typeof body.category === 'string') {
    sets.push('category = ?')
    binds.push(body.category.trim().slice(0, 60))
  }
  if (body.published != null) {
    sets.push('published = ?')
    binds.push(body.published ? 1 : 0)
  }
  if (body.sortOrder != null && Number.isFinite(Number(body.sortOrder))) {
    sets.push('sort_order = ?')
    binds.push(Number(body.sortOrder))
  }

  if (!sets.length) return Response.json({ error: 'NO_FIELDS' }, { status: 400 })
  binds.push(id)

  try {
    const result = await db
      .prepare(`UPDATE rss_feeds SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...binds)
      .run()
    if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    const row = await db.prepare('SELECT * FROM rss_feeds WHERE id = ?').bind(id).first()
    return Response.json({ ok: true, feed: row ? rowToAdmin(row) : null })
  } catch (error) {
    return Response.json(
      { error: 'RSS_WRITE_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }
}

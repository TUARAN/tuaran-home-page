import { getD1 } from '../../../lib/d1'
import { RSS_FEEDS_SEED } from '../../../lib/rssFeedsSeed'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function rowToPublic(row) {
  return {
    id: row.id,
    siteName: row.site_name || '',
    siteUrl: row.site_url || '',
    rssUrl: row.rss_url || '',
    description: row.description || '',
    category: row.category || '',
    sortOrder: Number(row.sort_order) || 0,
  }
}

// 公开读取：未绑 D1 / 迁移未跑 / 列表为空时，统一用内置种子兜底，保证页面不空。
export async function GET() {
  const db = dbOrNull()
  if (!db) {
    return Response.json({ status: 'seed', generatedAt: Date.now(), feeds: RSS_FEEDS_SEED })
  }

  try {
    const result = await db
      .prepare(
        'SELECT * FROM rss_feeds WHERE published = 1 ORDER BY sort_order DESC, created_at DESC'
      )
      .all()
    const feeds = (result?.results || []).map(rowToPublic)
    return Response.json({
      status: feeds.length ? 'ok' : 'seed',
      generatedAt: Date.now(),
      feeds: feeds.length ? feeds : RSS_FEEDS_SEED,
    })
  } catch (error) {
    // 表不存在（迁移未应用）等异常时也兜底
    return Response.json({
      status: 'seed',
      generatedAt: Date.now(),
      feeds: RSS_FEEDS_SEED,
      detail: String(error?.message || error),
    })
  }
}

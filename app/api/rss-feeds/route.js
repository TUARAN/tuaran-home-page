import { getD1 } from '../../../lib/d1'
import { listPublishedRssFeeds } from '../../../lib/rssFeedVisibility'
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

// 公开读取：D1 查询成功后完全尊重后台状态；仅未绑 D1 / 迁移未跑时用内置种子兜底。
export async function GET() {
  const db = dbOrNull()
  if (!db) {
    return Response.json({ status: 'seed', generatedAt: Date.now(), feeds: RSS_FEEDS_SEED })
  }

  try {
    const result = await db
      .prepare('SELECT * FROM rss_feeds ORDER BY sort_order DESC, created_at DESC')
      .all()
    const feeds = listPublishedRssFeeds(result?.results || [])
    return Response.json({
      status: 'ok',
      generatedAt: Date.now(),
      feeds,
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

import { getD1 } from '../../../lib/d1'
import { parseFeed } from '../../../lib/rssFeedParse'
import { isPublishedRssRow } from '../../../lib/rssFeedVisibility'
import { RSS_FEEDS_SEED } from '../../../lib/rssFeedsSeed'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 12000

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

// 已登记的源（D1 published + 内置种子）。只抓白名单内的 rssUrl，避免把本接口变成开放代理（SSRF）。
async function resolveFeed(id) {
  const wanted = String(id || '').trim()
  if (!wanted) return null

  const db = dbOrNull()
  if (db) {
    try {
      const row = await db
        .prepare('SELECT id, site_name, site_url, rss_url, published FROM rss_feeds WHERE id = ?')
        .bind(wanted)
        .first()
      if (row?.rss_url && isPublishedRssRow(row)) {
        return { id: row.id, siteName: row.site_name || '', siteUrl: row.site_url || '', rssUrl: row.rss_url }
      }
      // 查询成功代表 D1 已就绪；不存在或已下架都不能再回退到同名内置种子。
      return null
    } catch {
      // 表不存在等异常 → 落到种子
    }
  }
  const seed = RSS_FEEDS_SEED.find((f) => f.id === wanted)
  return seed ? { id: seed.id, siteName: seed.siteName, siteUrl: seed.siteUrl, rssUrl: seed.rssUrl } : null
}

export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id')
  const feed = await resolveFeed(id)
  if (!feed) {
    return Response.json({ status: 'not_found', entries: [] }, { status: 404 })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(feed.rssUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; 2aran-rss-reader/1.0; +https://2aran.com)',
        Accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
    })
    if (!res.ok) {
      return Response.json({ status: 'error', error: `UPSTREAM_${res.status}`, entries: [] }, { status: 200 })
    }
    const xml = await res.text()
    const entries = parseFeed(xml)
    return Response.json(
      { status: 'ok', feed: { id: feed.id, siteName: feed.siteName, siteUrl: feed.siteUrl }, entries },
      {
        headers: {
          // CDN 缓存 30 分钟，过期后台刷新，避免频繁打对方站
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error) {
    const aborted = error?.name === 'AbortError'
    return Response.json(
      { status: 'error', error: aborted ? 'TIMEOUT' : 'FETCH_FAILED', detail: String(error?.message || error), entries: [] },
      { status: 200 }
    )
  } finally {
    clearTimeout(timer)
  }
}

import { getD1 } from '../../../lib/d1'
import { RSS_FEEDS_SEED } from '../../../lib/rssFeedsSeed'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 8000
const MAX_ENTRIES = 8
const SUMMARY_MAX = 180

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
        .prepare('SELECT id, site_name, site_url, rss_url FROM rss_feeds WHERE id = ? AND published = 1')
        .bind(wanted)
        .first()
      if (row?.rss_url) {
        return { id: row.id, siteName: row.site_name || '', siteUrl: row.site_url || '', rssUrl: row.rss_url }
      }
    } catch {
      // 表不存在等异常 → 落到种子
    }
  }
  const seed = RSS_FEEDS_SEED.find((f) => f.id === wanted)
  return seed ? { id: seed.id, siteName: seed.siteName, siteUrl: seed.siteUrl, rssUrl: seed.rssUrl } : null
}

function decodeEntities(input) {
  return String(input || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&')
}

function safeCodePoint(n) {
  try {
    return String.fromCodePoint(n)
  } catch {
    return ''
  }
}

function stripTags(input) {
  return String(input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstTag(block, tag) {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(block)
  return m ? m[1] : ''
}

function atomLink(block) {
  const links = [...block.matchAll(/<link\b([^>]*?)\/?>/gi)].map((m) => m[1])
  let fallback = ''
  for (const attrs of links) {
    const href = (/href="([^"]+)"/i.exec(attrs) || [])[1]
    if (!href) continue
    if (!fallback) fallback = href
    const rel = (/rel="([^"]+)"/i.exec(attrs) || [])[1] || 'alternate'
    const type = (/type="([^"]+)"/i.exec(attrs) || [])[1] || ''
    if (rel === 'alternate' && (!type || type.includes('html'))) return href
  }
  return fallback
}

function toDateLabel(raw) {
  const s = String(raw || '').trim()
  if (!s) return ''
  const t = Date.parse(s)
  if (Number.isNaN(t)) return ''
  const d = new Date(t)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function parseFeed(xml) {
  const text = String(xml || '')
  const isAtom = /<entry[\s>]/i.test(text)
  const blocks = isAtom
    ? text.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || []
    : text.match(/<item[\s>][\s\S]*?<\/item>/gi) || []

  const entries = []
  for (const block of blocks.slice(0, MAX_ENTRIES)) {
    const title = decodeEntities(firstTag(block, 'title')).trim()
    const link = isAtom ? atomLink(block) : decodeEntities(firstTag(block, 'link')).trim()
    const dateRaw = isAtom
      ? firstTag(block, 'updated') || firstTag(block, 'published')
      : firstTag(block, 'pubDate')
    // 优先用正文（content）截取真实开头，比很多源里千篇一律的 summary 模板更有信息量
    const rawSummary = isAtom
      ? firstTag(block, 'content') || firstTag(block, 'summary')
      : firstTag(block, 'content:encoded') || firstTag(block, 'description')
    let summary = stripTags(decodeEntities(rawSummary))
    if (summary.length > SUMMARY_MAX) summary = `${summary.slice(0, SUMMARY_MAX)}…`
    if (!title && !link) continue
    entries.push({ title: title || '(无标题)', link, date: toDateLabel(dateRaw), summary })
  }
  return entries
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

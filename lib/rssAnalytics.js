import { getD1 } from './d1'

const RETENTION_MS = 180 * 24 * 60 * 60 * 1000

function getClientIp(req) {
  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : ''
}

async function sha256(input) {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function detectReader(userAgent) {
  const ua = String(userAgent || '')
  const lower = ua.toLowerCase()
  if (lower.includes('feedly')) return 'Feedly'
  if (lower.includes('folo')) return 'Folo'
  if (lower.includes('inoreader')) return 'Inoreader'
  if (lower.includes('newsblur')) return 'NewsBlur'
  if (lower.includes('reeder')) return 'Reeder'
  if (lower.includes('netnewswire')) return 'NetNewsWire'
  if (lower.includes('miniflux')) return 'Miniflux'
  if (lower.includes('freshrss')) return 'FreshRSS'
  if (lower.includes('feedbin')) return 'Feedbin'
  if (lower.includes('feedparser')) return 'Feed Parser'
  if (lower.includes('rss')) return 'RSS Reader'
  if (lower.includes('bot') || lower.includes('crawler') || lower.includes('spider')) return 'Bot / Crawler'
  if (lower.includes('mozilla')) return 'Browser / Extension'
  return 'Unknown'
}

export async function trackRssHit(req) {
  let db
  try {
    db = getD1()
  } catch {
    return { ok: false, skipped: 'DB_UNAVAILABLE' }
  }

  const now = Date.now()
  const ua = (req.headers.get('user-agent') || '').slice(0, 500)
  const referer = (req.headers.get('referer') || '').slice(0, 500)
  const acceptLanguage = (req.headers.get('accept-language') || '').slice(0, 100)
  const clientHash = await sha256([getClientIp(req), ua.slice(0, 200), acceptLanguage].join('|'))
  const path = new URL(req.url).pathname.slice(0, 120) || '/rss.xml'
  const reader = detectReader(ua)

  try {
    await db
      .prepare(
        `INSERT INTO rss_hits
          (id, path, client_hash, reader, user_agent, referer, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
      )
      .bind(crypto.randomUUID(), path, clientHash, reader, ua, referer, now)
      .run()

    await db
      .prepare('DELETE FROM rss_hits WHERE created_at < ?1')
      .bind(now - RETENTION_MS)
      .run()

    return { ok: true }
  } catch (error) {
    return { ok: false, error: String(error?.message || error) }
  }
}

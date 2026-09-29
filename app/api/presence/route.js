import { getD1 } from '../../../lib/d1'
import {
  normalizeOnlineCount,
  normalizePresenceVisitorKey,
  presenceCutoff,
  SITE_PRESENCE_RETENTION_MS,
} from '../../../lib/sitePresence'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const RESPONSE_HEADERS = {
  'cache-control': 'no-store',
}

export async function POST(req) {
  try {
    if (!req.headers.get('content-type')?.toLowerCase().includes('application/json')) {
      return Response.json({ error: 'INVALID_CONTENT_TYPE' }, { status: 415 })
    }

    let body
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    }

    const visitorKey = normalizePresenceVisitorKey(body?.visitorKey)
    if (!visitorKey) {
      return Response.json({ error: 'INVALID_VISITOR_KEY' }, { status: 400 })
    }

    const now = Date.now()
    const db = getD1()
    const results = await db.batch([
      db.prepare(
        `INSERT INTO site_presence (visitor_key, last_seen)
         VALUES (?1, ?2)
         ON CONFLICT(visitor_key) DO UPDATE SET last_seen = excluded.last_seen`
      ).bind(visitorKey, now),
      db.prepare('DELETE FROM site_presence WHERE last_seen < ?1')
        .bind(now - SITE_PRESENCE_RETENTION_MS),
      db.prepare('SELECT COUNT(*) AS count FROM site_presence WHERE last_seen >= ?1')
        .bind(presenceCutoff(now)),
    ])

    const count = normalizeOnlineCount(results?.[2]?.results?.[0]?.count)
    return Response.json({ count }, { headers: RESPONSE_HEADERS })
  } catch {
    return Response.json(
      { error: 'PRESENCE_UNAVAILABLE' },
      { status: 503, headers: RESPONSE_HEADERS }
    )
  }
}

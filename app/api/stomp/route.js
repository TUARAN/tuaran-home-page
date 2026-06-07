import { getD1 } from '../../../lib/d1'
import {
  cleanupRateLimits,
  enforceRateLimits,
  getClientIp,
  rateLimitResponse,
} from '../../../lib/abuseControls'
import { getUserFromRequest } from '../../../lib/edgeSession'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const FIVE_MINUTES_MS = 5 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = searchParams.get('limit')

    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 30))
    const db = getD1()
    const result = await db
      .prepare(
        `SELECT id, user_id, user_name, user_image, message, created_at
         FROM stomps
         ORDER BY created_at DESC
         LIMIT ?1`
      )
      .bind(safeLimit)
      .all()

    return Response.json({ items: result?.results || [] })
  } catch (e) {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    let body
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    }

    const raw = typeof body?.message === 'string' ? body.message : ''
    const message = raw.trim()
    if (!message) {
      return Response.json({ error: 'EMPTY_MESSAGE' }, { status: 400 })
    }
    if (message.length > 280) {
      return Response.json({ error: 'MESSAGE_TOO_LONG' }, { status: 400 })
    }

    const userId = String(user.id)
    const db = getD1()
    const ip = getClientIp(req)
    const limit = await enforceRateLimits(db, [
      { scope: 'stomp:create:user:5m', subject: userId, limit: 5, windowMs: FIVE_MINUTES_MS },
      { scope: 'stomp:create:user:day', subject: userId, limit: 40, windowMs: DAY_MS },
      { scope: 'stomp:create:ip:5m', subject: ip, limit: 15, windowMs: FIVE_MINUTES_MS },
      { scope: 'stomp:create:ip:day', subject: ip, limit: 120, windowMs: DAY_MS },
    ])
    if (!limit.ok) return rateLimitResponse(limit)

    const userName = String(user.name || user.login || 'GitHub User')
    const userImage = user.image ? String(user.image) : null
    const createdAt = Date.now()

    const insert = await db
      .prepare(
        `INSERT INTO stomps (user_id, user_name, user_image, message, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)
         RETURNING id, user_id, user_name, user_image, message, created_at`
      )
      .bind(userId, userName, userImage, message, createdAt)
      .first()

    await cleanupRateLimits(db).catch(() => {})

    return Response.json({ item: insert }, { status: 201 })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

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

function normalizeArticleKey(value) {
  const articleKey = typeof value === 'string' ? value.trim() : ''
  if (!articleKey || articleKey.length > 180) return ''
  return articleKey
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const articleKey = normalizeArticleKey(searchParams.get('articleKey'))
    if (!articleKey) {
      return Response.json({ error: 'INVALID_ARTICLE_KEY' }, { status: 400 })
    }

    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit')) || 50))
    const db = getD1()
    const result = await db
      .prepare(
        `SELECT id, article_key, user_id, user_provider, user_name, user_image, message, created_at
         FROM article_comments
         WHERE article_key = ?1
         ORDER BY created_at DESC
         LIMIT ?2`
      )
      .bind(articleKey, limit)
      .all()

    return Response.json({ items: result?.results || [] })
  } catch {
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

    const articleKey = normalizeArticleKey(body?.articleKey)
    if (!articleKey) {
      return Response.json({ error: 'INVALID_ARTICLE_KEY' }, { status: 400 })
    }

    const raw = typeof body?.message === 'string' ? body.message : ''
    const message = raw.trim()
    if (!message) {
      return Response.json({ error: 'EMPTY_MESSAGE' }, { status: 400 })
    }
    if (message.length > 1000) {
      return Response.json({ error: 'MESSAGE_TOO_LONG' }, { status: 400 })
    }

    const userId = String(user.id)
    const db = getD1()
    const ip = getClientIp(req)
    const limit = await enforceRateLimits(db, [
      { scope: 'comments:create:user:5m', subject: userId, limit: 8, windowMs: FIVE_MINUTES_MS },
      { scope: 'comments:create:user:day', subject: userId, limit: 80, windowMs: DAY_MS },
      { scope: 'comments:create:ip:5m', subject: ip, limit: 20, windowMs: FIVE_MINUTES_MS },
      { scope: 'comments:create:ip:day', subject: ip, limit: 160, windowMs: DAY_MS },
    ])
    if (!limit.ok) return rateLimitResponse(limit)

    const userProvider = String(user.provider || (userId.startsWith('google:') ? 'google' : 'github'))
    const userName = String(user.name || user.login || 'User')
    const userImage = user.image ? String(user.image) : null
    const createdAt = Date.now()

    const insert = await db
      .prepare(
        `INSERT INTO article_comments
           (article_key, user_id, user_provider, user_name, user_image, message, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         RETURNING id, article_key, user_id, user_provider, user_name, user_image, message, created_at`
      )
      .bind(articleKey, userId, userProvider, userName, userImage, message, createdAt)
      .first()

    await cleanupRateLimits(db).catch(() => {})

    return Response.json({ item: insert }, { status: 201 })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

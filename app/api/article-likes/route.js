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

function normalizeVisitorKey(value) {
  const visitorKey = typeof value === 'string' ? value.trim() : ''
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(visitorKey)) return ''
  return visitorKey
}

function makeVoterKey(user, visitorKey) {
  if (user?.id) return `user:${String(user.id).slice(0, 160)}`
  if (visitorKey) return `visitor:${visitorKey}`
  return ''
}

async function getLikeState(db, articleKey, voterKey) {
  const countRow = await db
    .prepare('SELECT COUNT(*) AS count FROM article_likes WHERE article_key = ?1')
    .bind(articleKey)
    .first()
  const count = Math.max(0, Number(countRow?.count) || 0)
  if (!voterKey) return { count, liked: false }

  const existing = await db
    .prepare('SELECT id FROM article_likes WHERE article_key = ?1 AND voter_key = ?2 LIMIT 1')
    .bind(articleKey, voterKey)
    .first()
  return { count, liked: !!existing }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const articleKey = normalizeArticleKey(searchParams.get('articleKey'))
    if (!articleKey) {
      return Response.json({ error: 'INVALID_ARTICLE_KEY' }, { status: 400 })
    }

    const user = await getUserFromRequest(req)
    const visitorKey = normalizeVisitorKey(searchParams.get('visitorKey'))
    const voterKey = makeVoterKey(user, visitorKey)
    const db = getD1()
    const state = await getLikeState(db, articleKey, voterKey)
    return Response.json(state)
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
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

    const user = await getUserFromRequest(req)
    const visitorKey = normalizeVisitorKey(body?.visitorKey)
    const voterKey = makeVoterKey(user, visitorKey)
    if (!voterKey) {
      return Response.json({ error: 'INVALID_VISITOR_KEY' }, { status: 400 })
    }

    const db = getD1()
    const ip = getClientIp(req)
    const subject = user?.id ? `user:${user.id}` : ip || voterKey
    const limit = await enforceRateLimits(db, [
      { scope: 'article-likes:toggle:5m', subject, limit: 30, windowMs: FIVE_MINUTES_MS },
      { scope: 'article-likes:toggle:day', subject, limit: 200, windowMs: DAY_MS },
    ])
    if (!limit.ok) return rateLimitResponse(limit)

    const existing = await db
      .prepare('SELECT id FROM article_likes WHERE article_key = ?1 AND voter_key = ?2 LIMIT 1')
      .bind(articleKey, voterKey)
      .first()

    if (existing?.id) {
      await db
        .prepare('DELETE FROM article_likes WHERE article_key = ?1 AND voter_key = ?2')
        .bind(articleKey, voterKey)
        .run()
    } else {
      await db
        .prepare(
          `INSERT INTO article_likes (article_key, voter_key, user_id, created_at)
           VALUES (?1, ?2, ?3, ?4)
           ON CONFLICT(article_key, voter_key) DO NOTHING`
        )
        .bind(articleKey, voterKey, user?.id ? String(user.id) : null, Date.now())
        .run()
    }

    await cleanupRateLimits(db).catch(() => {})

    const state = await getLikeState(db, articleKey, voterKey)
    return Response.json(state)
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

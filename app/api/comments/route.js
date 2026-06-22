import { getD1 } from '../../../lib/d1'
import {
  cleanupRateLimits,
  enforceRateLimits,
  getClientIp,
  rateLimitResponse,
} from '../../../lib/abuseControls'
import { getUserFromRequest } from '../../../lib/edgeSession'
import { getUserRole } from '../../../lib/userDirectory'
import { GUEST_USER_PREFIX, getOrIssueGuest, guestDisplayName } from '../../../lib/guestSession'
import { awardComment } from '../../../lib/points'

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
    const isGuest = !user

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

    const db = getD1()
    const ip = getClientIp(req)

    // 身份分两路：登录用户用 user.id；游客用签名 cookie 里的 guest_id（无则签发）。
    let userId
    let userProvider
    let userName
    let userImage = null
    let guestSetCookie = null

    if (isGuest) {
      const guest = await getOrIssueGuest(req)
      if (!guest) {
        return Response.json({ error: 'GUEST_UNAVAILABLE' }, { status: 500 })
      }
      guestSetCookie = guest.setCookie
      userId = `${GUEST_USER_PREFIX}${guest.gid}`
      userProvider = 'guest'
      userName = guestDisplayName(guest.gid)
    } else {
      userId = String(user.id)
      // 用户管理（/admin/users）封禁的用户禁止发评论
      if ((await getUserRole(userId)) === 'blocked') {
        return Response.json({ error: 'USER_BLOCKED' }, { status: 403 })
      }
      userProvider = String(user.provider || (userId.startsWith('google:') ? 'google' : 'github'))
      userName = String(user.name || user.login || 'User')
      userImage = user.image ? String(user.image) : null
    }

    // 游客限流更严：IP 主导（清缓存即换 gid，gid 维度防不住翻墙清缓存的连发）。
    const limitChecks = isGuest
      ? [
          { scope: 'comments:create:guest:5m', subject: userId, limit: 3, windowMs: FIVE_MINUTES_MS },
          { scope: 'comments:create:guest:day', subject: userId, limit: 15, windowMs: DAY_MS },
          { scope: 'comments:create:guestip:5m', subject: ip, limit: 5, windowMs: FIVE_MINUTES_MS },
          { scope: 'comments:create:guestip:day', subject: ip, limit: 30, windowMs: DAY_MS },
        ]
      : [
          { scope: 'comments:create:user:5m', subject: userId, limit: 8, windowMs: FIVE_MINUTES_MS },
          { scope: 'comments:create:user:day', subject: userId, limit: 80, windowMs: DAY_MS },
          { scope: 'comments:create:ip:5m', subject: ip, limit: 20, windowMs: FIVE_MINUTES_MS },
          { scope: 'comments:create:ip:day', subject: ip, limit: 160, windowMs: DAY_MS },
        ]
    const limit = await enforceRateLimits(db, limitChecks)
    if (!limit.ok) return rateLimitResponse(limit)

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

    // 有效评论奖励燃币（仅登录用户，游客零燃币）；best-effort，不阻断评论。
    if (!isGuest && insert?.id != null) {
      await awardComment(db, userId, insert.id).catch(() => {})
    }

    await cleanupRateLimits(db).catch(() => {})

    const headers = guestSetCookie ? { 'Set-Cookie': guestSetCookie } : undefined
    return Response.json({ item: insert }, { status: 201, headers })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

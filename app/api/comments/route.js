import { getD1 } from '../../../lib/d1'
import { getUserFromRequest } from '../../../lib/edgeSession'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

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
    const userProvider = String(user.provider || (userId.startsWith('google:') ? 'google' : 'github'))
    const userName = String(user.name || user.login || 'User')
    const userImage = user.image ? String(user.image) : null
    const createdAt = Date.now()

    const db = getD1()
    const insert = await db
      .prepare(
        `INSERT INTO article_comments
           (article_key, user_id, user_provider, user_name, user_image, message, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         RETURNING id, article_key, user_id, user_provider, user_name, user_image, message, created_at`
      )
      .bind(articleKey, userId, userProvider, userName, userImage, message, createdAt)
      .first()

    return Response.json({ item: insert }, { status: 201 })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

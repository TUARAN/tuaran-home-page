import { getD1 } from '../../../lib/d1'
import { getUserFromRequest } from '../../../lib/edgeSession'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

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
    const userName = String(user.name || user.login || 'GitHub User')
    const userImage = user.image ? String(user.image) : null
    const createdAt = Date.now()

    const db = getD1()
    const insert = await db
      .prepare(
        `INSERT INTO stomps (user_id, user_name, user_image, message, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)
         RETURNING id, user_id, user_name, user_image, message, created_at`
      )
      .bind(userId, userName, userImage, message, createdAt)
      .first()

    return Response.json({ item: insert }, { status: 201 })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

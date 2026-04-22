import { getD1 } from '../../../lib/d1'
import { getUserFromRequest } from '../../../lib/edgeSession'
import { getValidDadTodoItemIds, isValidDadTodoItemId } from '../../../lib/dadTodoData'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const validSet = new Set(getValidDadTodoItemIds())

function dbUnavailableResponse() {
  return Response.json(
    { error: 'DB_UNAVAILABLE', message: '待办需要部署环境（Cloudflare D1）与登录后使用。' },
    { status: 503 }
  )
}

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    let db
    try {
      db = getD1()
    } catch {
      return dbUnavailableResponse()
    }

    const result = await db
      .prepare(
        `SELECT item_id FROM dad_todo_completions WHERE user_id = ?1 ORDER BY item_id ASC`
      )
      .bind(String(user.id))
      .all()

    const rows = result?.results || []
    const completed = rows.map((r) => r.item_id).filter((id) => validSet.has(id))
    return Response.json({ completed })
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

    const itemId = body?.itemId
    if (!isValidDadTodoItemId(itemId)) {
      return Response.json({ error: 'INVALID_ITEM_ID' }, { status: 400 })
    }

    const userId = String(user.id)
    const now = Date.now()

    let db
    try {
      db = getD1()
    } catch {
      return dbUnavailableResponse()
    }

    await db
      .prepare(
        `INSERT INTO dad_todo_completions (user_id, item_id, updated_at) VALUES (?1, ?2, ?3)
         ON CONFLICT(user_id, item_id) DO UPDATE SET updated_at = excluded.updated_at`
      )
      .bind(userId, itemId, now)
      .run()

    return Response.json({ ok: true, itemId }, { status: 200 })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId') || searchParams.get('id')
    if (!isValidDadTodoItemId(itemId)) {
      return Response.json({ error: 'INVALID_ITEM_ID' }, { status: 400 })
    }

    let db
    try {
      db = getD1()
    } catch {
      return dbUnavailableResponse()
    }

    await db
      .prepare(
        `DELETE FROM dad_todo_completions WHERE user_id = ?1 AND item_id = ?2`
      )
      .bind(String(user.id), itemId)
      .run()

    return Response.json({ ok: true, itemId }, { status: 200 })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

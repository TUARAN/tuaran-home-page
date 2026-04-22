import { getD1 } from '../../../lib/d1'
import { getUserFromRequest } from '../../../lib/edgeSession'
import { getValidDadTodoItemIds, isValidDadTodoItemId } from '../../../lib/dadTodoData'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const validSet = new Set(getValidDadTodoItemIds())

function filterValidIds(arr) {
  if (!Array.isArray(arr)) return []
  const out = []
  for (const x of arr) {
    if (typeof x === 'string' && isValidDadTodoItemId(x) && !out.includes(x)) out.push(x)
  }
  return out
}

function dbUnavailableResponse() {
  return Response.json(
    { error: 'DB_UNAVAILABLE', message: '待办同步需要在部署环境（Cloudflare D1）下使用。' },
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

export async function PUT(req) {
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

    const completed = filterValidIds(body?.completed)
    const userId = String(user.id)
    const now = Date.now()

    let db
    try {
      db = getD1()
    } catch {
      return dbUnavailableResponse()
    }

    await db
      .prepare(`DELETE FROM dad_todo_completions WHERE user_id = ?1`)
      .bind(userId)
      .run()

    for (const itemId of completed) {
      await db
        .prepare(
          `INSERT INTO dad_todo_completions (user_id, item_id, updated_at) VALUES (?1, ?2, ?3)`
        )
        .bind(userId, itemId, now)
        .run()
    }

    return Response.json({ ok: true, completed })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

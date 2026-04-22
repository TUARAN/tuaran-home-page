import { getD1 } from '../../../lib/d1'
import { getUserFromRequest } from '../../../lib/edgeSession'
import { DAD_TODO_TOTAL, getValidDadTodoItemIds, isValidDadTodoItemId } from '../../../lib/dadTodoData'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const validSet = new Set(getValidDadTodoItemIds())

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/

function parseYmd(s) {
  if (s == null || s === '') return null
  const m = YMD_RE.exec(String(s))
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, mo - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
  return `${String(y).padStart(4, '0')}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function monthRange(year, month) {
  const start = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`
  const last = new Date(Date.UTC(year, month, 0))
  const end = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(last.getUTCDate()).padStart(2, '0')}`
  return { start, end }
}

/** 含首尾：end 起往前共 rangeDays 个日历日。 */
function ymdAddDays(ymd, delta) {
  const m = YMD_RE.exec(ymd)
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  d.setUTCDate(d.getUTCDate() + delta)
  const y = d.getUTCFullYear()
  const mo = d.getUTCMonth() + 1
  const day = d.getUTCDate()
  return `${String(y).padStart(4, '0')}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function dbUnavailableResponse() {
  return Response.json(
    { error: 'DB_UNAVAILABLE', message: '待办需要部署环境（Cloudflare D1）与登录后使用。' },
    { status: 503 }
  )
}

/**
 * GET ?date=YYYY-MM-DD  → { completed, date }
 * GET ?year=&month=   → { byDate, year, month }
 * GET ?end=YYYY-MM-DD&rangeDays=30 → { itemCounts, start, end, rangeDays } 进度看板用
 */
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = parseYmd(searchParams.get('date'))
    const year = Number(searchParams.get('year'))
    const month = Number(searchParams.get('month'))
    const endParam = parseYmd(searchParams.get('end'))
    const rangeDays = Number(searchParams.get('rangeDays'))

    let db
    try {
      db = getD1()
    } catch {
      return dbUnavailableResponse()
    }

    const userId = String(user.id)

    if (endParam && Number.isFinite(rangeDays)) {
      const n = Math.min(90, Math.max(1, Math.floor(rangeDays)))
      const startYmd = ymdAddDays(endParam, -(n - 1))
      if (!startYmd) {
        return Response.json({ error: 'INVALID_END_OR_RANGE' }, { status: 400 })
      }
      const result = await db
        .prepare(
          `SELECT item_id, COUNT(*) as c FROM dad_todo_completions
           WHERE user_id = ?1 AND check_date >= ?2 AND check_date <= ?3
           GROUP BY item_id`
        )
        .bind(userId, startYmd, endParam)
        .all()
      const rows = result?.results || []
      const itemCounts = {}
      for (const row of rows) {
        const id = row?.item_id
        if (id && validSet.has(String(id))) {
          itemCounts[String(id)] = Math.min(4000, Number(row.c) || 0)
        }
      }
      return Response.json({
        start: startYmd,
        end: endParam,
        rangeDays: n,
        itemCounts,
      })
    }

    if (date) {
      const result = await db
        .prepare(
          `SELECT item_id FROM dad_todo_completions
           WHERE user_id = ?1 AND check_date = ?2 ORDER BY item_id ASC`
        )
        .bind(userId, date)
        .all()
      const rows = result?.results || []
      const completed = rows.map((r) => r.item_id).filter((id) => validSet.has(id))
      return Response.json({ completed, date })
    }

    if (Number.isFinite(year) && Number.isFinite(month) && month >= 1 && month <= 12) {
      const { start, end } = monthRange(year, month)
      const result = await db
        .prepare(
          `SELECT check_date, COUNT(*) as n FROM dad_todo_completions
           WHERE user_id = ?1 AND check_date >= ?2 AND check_date <= ?3
           GROUP BY check_date`
        )
        .bind(userId, start, end)
        .all()
      const rows = result?.results || []
      const byDate = {}
      for (const row of rows) {
        if (row?.check_date) {
          byDate[String(row.check_date)] = Math.min(
            DAD_TODO_TOTAL,
            Number(row.n) || 0
          )
        }
      }
      return Response.json({ byDate, year, month })
    }

    return Response.json({ error: 'MISSING_DATE_OR_MONTH' }, { status: 400 })
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
    const checkDate = parseYmd(body?.date)
    if (!isValidDadTodoItemId(itemId) || !checkDate) {
      return Response.json({ error: 'INVALID_ITEM_ID_OR_DATE' }, { status: 400 })
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
        `INSERT INTO dad_todo_completions (user_id, item_id, check_date, updated_at) VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(user_id, item_id, check_date) DO UPDATE SET updated_at = excluded.updated_at`
      )
      .bind(userId, itemId, checkDate, now)
      .run()

    return Response.json({ ok: true, itemId, date: checkDate }, { status: 200 })
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
    const checkDate = parseYmd(searchParams.get('date'))
    if (!isValidDadTodoItemId(itemId) || !checkDate) {
      return Response.json({ error: 'INVALID_ITEM_ID_OR_DATE' }, { status: 400 })
    }

    let db
    try {
      db = getD1()
    } catch {
      return dbUnavailableResponse()
    }

    await db
      .prepare(
        `DELETE FROM dad_todo_completions
         WHERE user_id = ?1 AND item_id = ?2 AND check_date = ?3`
      )
      .bind(String(user.id), itemId, checkDate)
      .run()

    return Response.json({ ok: true, itemId, date: checkDate }, { status: 200 })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

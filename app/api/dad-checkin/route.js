import { getD1 } from '../../../lib/d1'
import { getUserFromRequest } from '../../../lib/edgeSession'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/

function parseYmd(s) {
  const m = typeof s === 'string' ? YMD_RE.exec(s) : null
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, mo - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
  return { y, mo, d, key: s }
}

function monthRange(year, month) {
  const start = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`
  const last = new Date(Date.UTC(year, month, 0))
  const end = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(last.getUTCDate()).padStart(2, '0')}`
  return { start, end }
}

function dbUnavailableResponse() {
  return Response.json(
    { error: 'DB_UNAVAILABLE', message: '打卡数据需要在部署环境（Cloudflare D1）下使用。' },
    { status: 503 }
  )
}

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const year = Number(searchParams.get('year'))
    const month = Number(searchParams.get('month'))
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return Response.json({ error: 'INVALID_YEAR_MONTH' }, { status: 400 })
    }

    let db
    try {
      db = getD1()
    } catch {
      return dbUnavailableResponse()
    }

    const { start, end } = monthRange(year, month)
    const result = await db
      .prepare(
        `SELECT checkin_date FROM dad_checkins
         WHERE user_id = ?1 AND checkin_date >= ?2 AND checkin_date <= ?3
         ORDER BY checkin_date ASC`
      )
      .bind(String(user.id), start, end)
      .all()

    const rows = result?.results || []
    const dates = rows.map((r) => r.checkin_date).filter(Boolean)
    return Response.json({ dates })
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

    const parsed = parseYmd(body?.date)
    if (!parsed) {
      return Response.json({ error: 'INVALID_DATE' }, { status: 400 })
    }

    let db
    try {
      db = getD1()
    } catch {
      return dbUnavailableResponse()
    }

    const createdAt = Date.now()
    await db
      .prepare(
        `INSERT INTO dad_checkins (user_id, checkin_date, created_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(user_id, checkin_date) DO NOTHING`
      )
      .bind(String(user.id), parsed.key, createdAt)
      .run()

    return Response.json({ ok: true, date: parsed.key }, { status: 201 })
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
    const parsed = parseYmd(searchParams.get('date'))
    if (!parsed) {
      return Response.json({ error: 'INVALID_DATE' }, { status: 400 })
    }

    let db
    try {
      db = getD1()
    } catch {
      return dbUnavailableResponse()
    }

    await db
      .prepare(`DELETE FROM dad_checkins WHERE user_id = ?1 AND checkin_date = ?2`)
      .bind(String(user.id), parsed.key)
      .run()

    return Response.json({ ok: true, date: parsed.key })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

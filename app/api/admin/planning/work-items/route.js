import { getOwnerOrReject } from '../../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../../lib/db/d1'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const STATUSES = new Set(['planned', 'doing', 'waiting', 'done'])

function database() {
  try { return getD1() } catch { return null }
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function cleanText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function dbError(error) {
  return /no such table/i.test(String(error?.message || error))
    ? Response.json({ error: 'MIGRATION_REQUIRED' }, { status: 503 })
    : Response.json({ error: 'WORK_ITEMS_FAILED' }, { status: 500 })
}

async function readBody(req) {
  try { return await req.json() } catch { return null }
}

export async function GET(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  const db = database()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  const date = new URL(req.url).searchParams.get('date')
  if (date && !validDate(date)) return Response.json({ error: 'INVALID_DATE' }, { status: 400 })
  try {
    const result = date
      ? await db.prepare('SELECT * FROM planning_work_items WHERE work_date = ? ORDER BY sort_order, created_at').bind(date).all()
      : await db.prepare('SELECT * FROM planning_work_items ORDER BY work_date DESC, sort_order, created_at LIMIT 200').all()
    return Response.json({ items: result.results || [] })
  } catch (error) { return dbError(error) }
}

export async function POST(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  const db = database()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  const body = await readBody(req)
  const workDate = body?.workDate
  const title = cleanText(body?.title, 200)
  const details = cleanText(body?.details, 2000)
  const status = body?.status || 'planned'
  if (!validDate(workDate) || !title || !STATUSES.has(status)) {
    return Response.json({ error: 'INVALID_ITEM' }, { status: 400 })
  }
  const id = crypto.randomUUID()
  const now = Date.now()
  try {
    await db.prepare(`INSERT INTO planning_work_items
      (id, work_date, title, details, status, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, COALESCE((SELECT MAX(sort_order) + 10 FROM planning_work_items WHERE work_date = ?), 10), ?, ?)`)
      .bind(id, workDate, title, details, status, workDate, now, now).run()
    return Response.json({ id }, { status: 201 })
  } catch (error) { return dbError(error) }
}

export async function PATCH(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  const db = database()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  const body = await readBody(req)
  const id = cleanText(body?.id, 100)
  if (!id) return Response.json({ error: 'INVALID_ITEM' }, { status: 400 })
  const updates = []
  const values = []
  if ('title' in (body || {})) {
    const title = cleanText(body.title, 200)
    if (!title) return Response.json({ error: 'INVALID_ITEM' }, { status: 400 })
    updates.push('title = ?'); values.push(title)
  }
  if ('details' in (body || {})) { updates.push('details = ?'); values.push(cleanText(body.details, 2000)) }
  if ('status' in (body || {})) {
    if (!STATUSES.has(body.status)) return Response.json({ error: 'INVALID_ITEM' }, { status: 400 })
    updates.push('status = ?'); values.push(body.status)
  }
  if ('workDate' in (body || {})) {
    if (!validDate(body.workDate)) return Response.json({ error: 'INVALID_DATE' }, { status: 400 })
    updates.push('work_date = ?'); values.push(body.workDate)
  }
  if (!updates.length) return Response.json({ error: 'NO_CHANGES' }, { status: 400 })
  updates.push('updated_at = ?'); values.push(Date.now(), id)
  try {
    const result = await db.prepare(`UPDATE planning_work_items SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
    if (!result.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    return Response.json({ ok: true })
  } catch (error) { return dbError(error) }
}

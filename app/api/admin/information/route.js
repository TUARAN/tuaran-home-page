import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { isValidEnvelope } from '../../../../lib/longCompass/crypto'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const ALLOWED_CATEGORIES = new Set(['apple-id', 'account', 'note'])

function getDb() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function serializeRow(row) {
  if (!row) return null
  try {
    return {
      id: row.id,
      category: row.category,
      payload: JSON.parse(row.encrypted_payload),
      createdAt: Number(row.created_at) || 0,
      updatedAt: Number(row.updated_at) || 0,
    }
  } catch {
    return null
  }
}

function unavailable() {
  return Response.json(
    { status: 'unavailable', message: 'D1 尚未绑定或信息管理数据表尚未创建。', items: [] },
    { status: 503 }
  )
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const db = getDb()
  if (!db) return unavailable()

  try {
    const result = await db
      .prepare(
        `SELECT id, category, encrypted_payload, created_at, updated_at
         FROM private_information_records
         WHERE user_id = ? AND deleted_at IS NULL
         ORDER BY updated_at DESC`
      )
      .bind(String(guard.user.id))
      .all()
    return Response.json({
      status: 'ok',
      items: (result?.results || []).map(serializeRow).filter(Boolean),
    })
  } catch (error) {
    return Response.json(
      { status: 'error', error: 'PRIVATE_INFORMATION_READ_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const db = getDb()
  if (!db) return unavailable()

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }
  const category = String(body?.category || '').trim()
  if (!ALLOWED_CATEGORIES.has(category)) return Response.json({ error: 'INVALID_CATEGORY' }, { status: 400 })
  if (!isValidEnvelope(body?.payload)) return Response.json({ error: 'INVALID_ENVELOPE' }, { status: 400 })

  const id = crypto.randomUUID()
  const now = Date.now()
  try {
    await db
      .prepare(
        `INSERT INTO private_information_records
         (id, user_id, category, encrypted_payload, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(id, String(guard.user.id), category, JSON.stringify(body.payload), now, now)
      .run()
    return Response.json({
      ok: true,
      item: { id, category, payload: body.payload, createdAt: now, updatedAt: now },
    })
  } catch (error) {
    return Response.json(
      { error: 'PRIVATE_INFORMATION_WRITE_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const db = getDb()
  if (!db) return unavailable()

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }
  const id = String(body?.id || '').trim()
  if (!id) return Response.json({ error: 'INVALID_ID' }, { status: 400 })
  if (!isValidEnvelope(body?.payload)) return Response.json({ error: 'INVALID_ENVELOPE' }, { status: 400 })
  const now = Date.now()

  try {
    const result = await db
      .prepare(
        `UPDATE private_information_records
         SET encrypted_payload = ?, updated_at = ?
         WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
      )
      .bind(JSON.stringify(body.payload), now, id, String(guard.user.id))
      .run()
    if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    return Response.json({ ok: true, updatedAt: now })
  } catch (error) {
    return Response.json(
      { error: 'PRIVATE_INFORMATION_WRITE_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }
}

export async function DELETE(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const db = getDb()
  if (!db) return unavailable()
  const id = new URL(req.url).searchParams.get('id')?.trim()
  if (!id) return Response.json({ error: 'INVALID_ID' }, { status: 400 })
  const now = Date.now()

  try {
    const result = await db
      .prepare(
        `UPDATE private_information_records
         SET deleted_at = ?, updated_at = ?
         WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
      )
      .bind(now, now, id, String(guard.user.id))
      .run()
    if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json(
      { error: 'PRIVATE_INFORMATION_DELETE_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }
}

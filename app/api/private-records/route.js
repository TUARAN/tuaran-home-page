import { getD1 } from '../../../lib/d1'
import { getPrivateVaultUser } from '../../../lib/privateVaultAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const KINDS = new Set(['snapshot', 'strategy', 'review'])
const MAX_PAYLOAD_LENGTH = 120000

function dbUnavailableResponse() {
  return Response.json(
    { error: 'DB_UNAVAILABLE', message: '长期罗盘需要部署环境（Cloudflare D1）才能读取。' },
    { status: 503 }
  )
}

function normalizeKind(value) {
  const kind = String(value || '').trim()
  return KINDS.has(kind) ? kind : ''
}

function validateEncryptedPayload(value) {
  if (!value || typeof value !== 'object') return null
  if (value.v !== 1) return null
  if (value.kdf !== 'PBKDF2-SHA256') return null
  if (value.alg !== 'AES-256-GCM') return null
  if (!Number.isInteger(value.iter) || value.iter < 100000) return null
  if (typeof value.salt !== 'string' || typeof value.iv !== 'string' || typeof value.data !== 'string') {
    return null
  }
  const serialized = JSON.stringify(value)
  if (serialized.length > MAX_PAYLOAD_LENGTH) return null
  return serialized
}

function serializeRow(row) {
  if (!row) return null
  return {
    id: row.id,
    kind: row.record_kind,
    payload: JSON.parse(row.encrypted_payload),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getDb() {
  try {
    return getD1()
  } catch {
    return null
  }
}

export async function GET(req) {
  try {
    const principal = await getPrivateVaultUser(req)
    if (principal.status === 401) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    if (principal.status === 403) return Response.json({ error: 'FORBIDDEN' }, { status: 403 })

    const db = await getDb()
    if (!db) return dbUnavailableResponse()

    const result = await db
      .prepare(
        `SELECT id, record_kind, encrypted_payload, created_at, updated_at
         FROM private_records
         WHERE user_id = ?1 AND deleted_at IS NULL
         ORDER BY updated_at DESC
         LIMIT 200`
      )
      .bind(String(principal.user.id))
      .all()

    return Response.json({
      user: {
        id: principal.user.id,
        name: principal.user.name,
        login: principal.user.login,
        image: principal.user.image,
      },
      items: (result?.results || []).map(serializeRow),
    })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const principal = await getPrivateVaultUser(req)
    if (principal.status === 401) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    if (principal.status === 403) return Response.json({ error: 'FORBIDDEN' }, { status: 403 })

    let body
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    }

    const kind = normalizeKind(body?.kind)
    if (!kind) return Response.json({ error: 'INVALID_KIND' }, { status: 400 })

    const encryptedPayload = validateEncryptedPayload(body?.payload)
    if (!encryptedPayload) return Response.json({ error: 'INVALID_PAYLOAD' }, { status: 400 })

    const db = await getDb()
    if (!db) return dbUnavailableResponse()

    const now = Date.now()
    const row = await db
      .prepare(
        `INSERT INTO private_records (user_id, record_kind, encrypted_payload, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?4)
         RETURNING id, record_kind, encrypted_payload, created_at, updated_at`
      )
      .bind(String(principal.user.id), kind, encryptedPayload, now)
      .first()

    return Response.json({ item: serializeRow(row) }, { status: 201 })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const principal = await getPrivateVaultUser(req)
    if (principal.status === 401) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    if (principal.status === 403) return Response.json({ error: 'FORBIDDEN' }, { status: 403 })

    let body
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    }

    const id = Number(body?.id)
    if (!Number.isInteger(id) || id <= 0) return Response.json({ error: 'INVALID_ID' }, { status: 400 })

    const kind = normalizeKind(body?.kind)
    if (!kind) return Response.json({ error: 'INVALID_KIND' }, { status: 400 })

    const encryptedPayload = validateEncryptedPayload(body?.payload)
    if (!encryptedPayload) return Response.json({ error: 'INVALID_PAYLOAD' }, { status: 400 })

    const db = await getDb()
    if (!db) return dbUnavailableResponse()

    const row = await db
      .prepare(
        `UPDATE private_records
         SET record_kind = ?1, encrypted_payload = ?2, updated_at = ?3
         WHERE id = ?4 AND user_id = ?5 AND deleted_at IS NULL
         RETURNING id, record_kind, encrypted_payload, created_at, updated_at`
      )
      .bind(kind, encryptedPayload, Date.now(), id, String(principal.user.id))
      .first()

    if (!row) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    return Response.json({ item: serializeRow(row) })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const principal = await getPrivateVaultUser(req)
    if (principal.status === 401) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    if (principal.status === 403) return Response.json({ error: 'FORBIDDEN' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    if (!Number.isInteger(id) || id <= 0) return Response.json({ error: 'INVALID_ID' }, { status: 400 })

    const db = await getDb()
    if (!db) return dbUnavailableResponse()

    await db
      .prepare(
        `UPDATE private_records
         SET deleted_at = ?1, updated_at = ?1
         WHERE id = ?2 AND user_id = ?3 AND deleted_at IS NULL`
      )
      .bind(Date.now(), id, String(principal.user.id))
      .run()

    return Response.json({ ok: true, id })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

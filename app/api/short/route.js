import { getD1 } from '../../../lib/d1'
import { getUserFromRequest } from '../../../lib/edgeSession'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const ORIGINAL_MAX = 2000
const LIST_LIMIT = 100

function dbUnavailableResponse() {
  return Response.json(
    { error: 'DB_UNAVAILABLE', message: '短链工具需要部署环境（Cloudflare D1）与登录后使用。' },
    { status: 503 }
  )
}

function validateUrl(raw) {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed || trimmed.length > ORIGINAL_MAX) return null
  try {
    const u = new URL(trimmed)
    if (!/^https?:$/.test(u.protocol)) return null
    return trimmed
  } catch {
    return null
  }
}

async function shortenViaTinyUrl(url) {
  const upstream = await fetch(
    `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
    { method: 'GET' }
  )
  if (!upstream.ok) {
    return { error: 'UPSTREAM_FAILED' }
  }
  const text = (await upstream.text()).trim()
  if (!/^https?:\/\//.test(text)) {
    return { error: 'UPSTREAM_INVALID', detail: text.slice(0, 200) }
  }
  return { short: text }
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
        `SELECT id, original, short, created_at
         FROM short_links
         WHERE user_id = ?1
         ORDER BY created_at DESC
         LIMIT ?2`
      )
      .bind(String(user.id), LIST_LIMIT)
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

    const original = validateUrl(body?.url ?? body?.original)
    if (!original) {
      return Response.json({ error: 'INVALID_URL' }, { status: 400 })
    }

    const result = await shortenViaTinyUrl(original)
    if (result.error) {
      return Response.json({ error: result.error, detail: result.detail }, { status: 502 })
    }

    let db
    try {
      db = getD1()
    } catch {
      return dbUnavailableResponse()
    }

    const createdAt = Date.now()
    const inserted = await db
      .prepare(
        `INSERT INTO short_links (user_id, original, short, created_at)
         VALUES (?1, ?2, ?3, ?4)
         RETURNING id, original, short, created_at`
      )
      .bind(String(user.id), original, result.short, createdAt)
      .first()

    return Response.json({ item: inserted }, { status: 201 })
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
    const id = Number(searchParams.get('id'))
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: 'INVALID_ID' }, { status: 400 })
    }

    let db
    try {
      db = getD1()
    } catch {
      return dbUnavailableResponse()
    }

    await db
      .prepare(`DELETE FROM short_links WHERE id = ?1 AND user_id = ?2`)
      .bind(id, String(user.id))
      .run()

    return Response.json({ ok: true, id })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

import { getD1 } from '../../../lib/d1'
import { getSecrets, getUserFromRequest } from '../../../lib/edgeSession'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const ORIGINAL_MAX = 2000
const LIST_LIMIT = 100
const CODE_LENGTH = 7
const CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const INSERT_RETRY = 4

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

function genCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH))
  let s = ''
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    s += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  }
  return s
}

function getShortBase(req) {
  const { appUrl } = getSecrets()
  const base = appUrl || new URL(req.url).origin
  return base.replace(/\/+$/, '')
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
        `SELECT id, original, short, code, created_at
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

    let db
    try {
      db = getD1()
    } catch {
      return dbUnavailableResponse()
    }

    const userId = String(user.id)
    const createdAt = Date.now()
    const base = getShortBase(req)

    let inserted = null
    let lastError = null
    for (let attempt = 0; attempt < INSERT_RETRY && !inserted; attempt += 1) {
      const code = genCode()
      const shortUrl = `${base}/${code}`
      try {
        inserted = await db
          .prepare(
            `INSERT INTO short_links (user_id, original, short, code, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)
             RETURNING id, original, short, code, created_at`
          )
          .bind(userId, original, shortUrl, code, createdAt)
          .first()
      } catch (e) {
        lastError = e
        // D1 抛 UNIQUE 时重试，其它错误立即抛出
        const msg = String(e?.message || '')
        if (!msg.includes('UNIQUE')) throw e
      }
    }

    if (!inserted) {
      return Response.json(
        { error: 'CODE_COLLISION', detail: String(lastError?.message || '') },
        { status: 500 }
      )
    }

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

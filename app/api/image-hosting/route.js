import { getD1 } from '../../../lib/d1'
import { getUserFromRequest } from '../../../lib/edgeSession'
import { rowToHostedImage } from '../../../lib/hostedImages'
import { POINT_RULES, award, spendPoints } from '../../../lib/points'
import { getR2 } from '../../../lib/r2'
import { getUserRole } from '../../../lib/userDirectory'
import {
  cleanupRateLimits,
  enforceRateLimits,
  getClientIp,
  rateLimitResponse,
} from '../../../lib/abuseControls'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 10 * 1024 * 1024
const LIST_LIMIT = 50
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
])

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
}

function dbOrResponse() {
  try {
    return { db: getD1() }
  } catch {
    return {
      response: Response.json(
        { error: 'DB_UNAVAILABLE', message: '图床需要 Cloudflare D1 绑定。' },
        { status: 503 }
      ),
    }
  }
}

function r2OrResponse() {
  try {
    return { bucket: getR2() }
  } catch {
    return {
      response: Response.json(
        { error: 'STORAGE_UNAVAILABLE', message: '图床需要 Cloudflare R2 MEDIA 绑定。' },
        { status: 503 }
      ),
    }
  }
}

async function requireUser(req) {
  const user = await getUserFromRequest(req)
  if (!user?.id) {
    return {
      response: Response.json(
        { error: 'LOGIN_REQUIRED', message: '请先登录后再使用图床。' },
        { status: 401 }
      ),
    }
  }

  const userId = String(user.id)
  if ((await getUserRole(userId)) === 'blocked') {
    return { response: Response.json({ error: 'USER_BLOCKED' }, { status: 403 }) }
  }

  return { user, userId }
}

export async function GET(req) {
  try {
    const auth = await requireUser(req)
    if (auth.response) return auth.response

    const { db, response } = dbOrResponse()
    if (response) return response

    const result = await db
      .prepare(
        `SELECT * FROM hosted_images
         WHERE user_id = ?1
         ORDER BY created_at DESC
         LIMIT ?2`
      )
      .bind(auth.userId, LIST_LIMIT)
      .all()

    const origin = new URL(req.url).origin
    return Response.json({
      status: 'ok',
      cost: POINT_RULES.imageHostingUpload,
      images: (result?.results || []).map((row) => rowToHostedImage(row, origin)),
    })
  } catch (error) {
    const message = String(error?.message || error)
    if (message.includes('no such table')) {
      return Response.json({ error: 'MIGRATION_REQUIRED', message }, { status: 503 })
    }
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

export async function POST(req) {
  let objectKey = ''

  try {
    const auth = await requireUser(req)
    if (auth.response) return auth.response

    const { db, response: dbResponse } = dbOrResponse()
    if (dbResponse) return dbResponse
    const { bucket, response: r2Response } = r2OrResponse()
    if (r2Response) return r2Response

    const ip = getClientIp(req)
    const limit = await enforceRateLimits(db, [
      { scope: 'image-hosting:upload:user:hour', subject: auth.userId, limit: 20, windowMs: HOUR_MS },
      { scope: 'image-hosting:upload:user:day', subject: auth.userId, limit: 80, windowMs: DAY_MS },
      { scope: 'image-hosting:upload:ip:hour', subject: ip, limit: 40, windowMs: HOUR_MS },
    ])
    if (!limit.ok) return rateLimitResponse(limit)

    let form = null
    try {
      form = await req.formData()
    } catch {
      return Response.json({ error: 'INVALID_FORM' }, { status: 400 })
    }

    const file = form.get('file')
    if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
      return Response.json({ error: 'FILE_REQUIRED' }, { status: 400 })
    }

    const contentType = file.type || ''
    if (!ALLOWED_TYPES.has(contentType)) {
      return Response.json({ error: 'UNSUPPORTED_TYPE', detail: contentType }, { status: 415 })
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: 'FILE_TOO_LARGE', maxBytes: MAX_BYTES }, { status: 413 })
    }

    const id = crypto.randomUUID()
    const ext = EXT_BY_TYPE[contentType] || 'bin'
    objectKey = `images/hosted/${auth.userId.replace(/[^a-zA-Z0-9_-]/g, '_')}/${id}.${ext}`
    const width = Number(form.get('width')) || null
    const height = Number(form.get('height')) || null
    const now = Date.now()
    const cost = POINT_RULES.imageHostingUpload

    const bytes = await file.arrayBuffer()
    await bucket.put(objectKey, bytes, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    })

    const spend = await spendPoints(db, auth.userId, {
      cost,
      reason: 'image_hosting_upload',
      ref: `image:${id}`,
      now,
    })
    if (!spend.ok) {
      await bucket.delete(objectKey).catch(() => {})
      return Response.json(spend, { status: spend.status || 400 })
    }

    try {
      await db
        .prepare(
          `INSERT INTO hosted_images
            (id, user_id, object_key, file_name, content_type, size_bytes, width, height, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
        )
        .bind(
          id,
          auth.userId,
          objectKey,
          file.name || `${id}.${ext}`,
          contentType,
          file.size,
          width,
          height,
          now
        )
        .run()
    } catch (error) {
      await bucket.delete(objectKey).catch(() => {})
      await award(db, auth.userId, {
        delta: cost,
        reason: 'image_hosting_refund',
        ref: `refund:${id}`,
      }).catch(() => {})
      return Response.json(
        { error: 'IMAGE_RECORD_FAILED', detail: String(error?.message || error) },
        { status: 500 }
      )
    }

    await cleanupRateLimits(db).catch(() => {})

    const row = await db.prepare('SELECT * FROM hosted_images WHERE id = ?1').bind(id).first()
    const origin = new URL(req.url).origin
    return Response.json(
      {
        ok: true,
        cost,
        balance: spend.balance,
        image: row ? rowToHostedImage(row, origin) : rowToHostedImage({
          id,
          object_key: objectKey,
          file_name: file.name || `${id}.${ext}`,
          content_type: contentType,
          size_bytes: file.size,
          width,
          height,
          created_at: now,
        }, origin),
      },
      { status: 201 }
    )
  } catch (error) {
    const message = String(error?.message || error)
    return Response.json(
      { error: message.includes('no such table') ? 'MIGRATION_REQUIRED' : 'INTERNAL_SERVER_ERROR', detail: message },
      { status: message.includes('no such table') ? 503 : 500 }
    )
  }
}

export async function DELETE(req) {
  try {
    const auth = await requireUser(req)
    if (auth.response) return auth.response

    const { db, response: dbResponse } = dbOrResponse()
    if (dbResponse) return dbResponse
    const { bucket, response: r2Response } = r2OrResponse()
    if (r2Response) return r2Response

    const id = new URL(req.url).searchParams.get('id')?.trim()
    if (!id) return Response.json({ error: 'INVALID_ID' }, { status: 400 })

    const row = await db
      .prepare('SELECT object_key FROM hosted_images WHERE id = ?1 AND user_id = ?2')
      .bind(id, auth.userId)
      .first()
    if (!row) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })

    await bucket.delete(row.object_key).catch(() => {})
    await db
      .prepare('DELETE FROM hosted_images WHERE id = ?1 AND user_id = ?2')
      .bind(id, auth.userId)
      .run()

    return Response.json({ ok: true })
  } catch (error) {
    const message = String(error?.message || error)
    return Response.json(
      { error: message.includes('no such table') ? 'MIGRATION_REQUIRED' : 'INTERNAL_SERVER_ERROR', detail: message },
      { status: message.includes('no such table') ? 503 : 500 }
    )
  }
}

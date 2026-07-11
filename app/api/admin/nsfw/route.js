import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { getPrivateNsfwR2 } from '../../../../lib/r2'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 50 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'video/mp4',
  'video/webm',
])
const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
}

function getStorage() {
  try {
    return { db: getD1(), bucket: getPrivateNsfwR2() }
  } catch {
    return null
  }
}

function rowToMedia(row) {
  return {
    id: row.id,
    title: row.title || '',
    fileName: row.file_name || '',
    contentType: row.content_type || '',
    sizeBytes: Number(row.size_bytes) || 0,
    status: row.status || 'active',
    createdAt: Number(row.created_at) || 0,
    previewUrl: `/api/admin/nsfw/${encodeURIComponent(row.id)}`,
  }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const storage = getStorage()
  if (!storage) {
    return Response.json({ status: 'unavailable', message: '私有 R2 桶 NSFW_MEDIA 或 D1 尚未绑定。', items: [] })
  }

  try {
    const result = await storage.db.prepare('SELECT * FROM nsfw_media ORDER BY created_at DESC').all()
    return Response.json({ status: 'ok', items: (result?.results || []).map(rowToMedia) })
  } catch (error) {
    return Response.json(
      { status: 'error', error: 'NSFW_MEDIA_READ_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const storage = getStorage()
  if (!storage) return Response.json({ error: 'STORAGE_UNAVAILABLE' }, { status: 503 })

  let form
  try {
    form = await req.formData()
  } catch {
    return Response.json({ error: 'INVALID_FORM' }, { status: 400 })
  }

  if (form.get('attested') !== 'true') {
    return Response.json({ error: 'ATTESTATION_REQUIRED' }, { status: 400 })
  }
  const file = form.get('file')
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
    return Response.json({ error: 'FILE_REQUIRED' }, { status: 400 })
  }
  const contentType = file.type || ''
  if (!ALLOWED_TYPES.has(contentType)) {
    return Response.json({ error: 'UNSUPPORTED_TYPE', detail: contentType || 'unknown' }, { status: 415 })
  }
  if (!file.size || file.size > MAX_BYTES) {
    return Response.json({ error: 'FILE_TOO_LARGE', maxBytes: MAX_BYTES }, { status: 413 })
  }

  const id = crypto.randomUUID()
  const ext = EXT_BY_TYPE[contentType]
  const objectKey = `nsfw/${id}.${ext}`
  const title = String(form.get('title') || '').trim().slice(0, 200)

  try {
    await storage.bucket.put(objectKey, await file.arrayBuffer(), {
      httpMetadata: {
        contentType,
        contentDisposition: `inline; filename="${(file.name || `${id}.${ext}`).replace(/["\\]/g, '_')}"`,
      },
    })
  } catch (error) {
    return Response.json({ error: 'R2_PUT_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }

  const createdAt = Date.now()
  try {
    await storage.db
      .prepare(
        `INSERT INTO nsfw_media (id, title, object_key, file_name, content_type, size_bytes, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`
      )
      .bind(id, title, objectKey, file.name || `${id}.${ext}`, contentType, file.size, createdAt)
      .run()
    const row = await storage.db.prepare('SELECT * FROM nsfw_media WHERE id = ?').bind(id).first()
    return Response.json({ ok: true, item: row ? rowToMedia(row) : null })
  } catch (error) {
    try {
      await storage.bucket.delete(objectKey)
    } catch {}
    return Response.json({ error: 'NSFW_MEDIA_WRITE_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const storage = getStorage()
  if (!storage) return Response.json({ error: 'STORAGE_UNAVAILABLE' }, { status: 503 })

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }
  const id = typeof body?.id === 'string' ? body.id.trim() : ''
  if (!id) return Response.json({ error: 'INVALID_ID' }, { status: 400 })

  const sets = []
  const binds = []
  if (typeof body.title === 'string') {
    sets.push('title = ?')
    binds.push(body.title.trim().slice(0, 200))
  }
  if (body.status === 'active' || body.status === 'archived') {
    sets.push('status = ?')
    binds.push(body.status)
  }
  if (!sets.length) return Response.json({ error: 'NO_FIELDS' }, { status: 400 })

  try {
    const result = await storage.db.prepare(`UPDATE nsfw_media SET ${sets.join(', ')} WHERE id = ?`).bind(...binds, id).run()
    if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    const row = await storage.db.prepare('SELECT * FROM nsfw_media WHERE id = ?').bind(id).first()
    return Response.json({ ok: true, item: row ? rowToMedia(row) : null })
  } catch (error) {
    return Response.json({ error: 'NSFW_MEDIA_WRITE_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

export async function DELETE(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const storage = getStorage()
  if (!storage) return Response.json({ error: 'STORAGE_UNAVAILABLE' }, { status: 503 })

  const id = new URL(req.url).searchParams.get('id')?.trim()
  if (!id) return Response.json({ error: 'INVALID_ID' }, { status: 400 })
  const row = await storage.db.prepare('SELECT object_key FROM nsfw_media WHERE id = ?').bind(id).first()
  if (!row) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })

  try {
    await storage.bucket.delete(row.object_key)
    await storage.db.prepare('DELETE FROM nsfw_media WHERE id = ?').bind(id).run()
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: 'NSFW_MEDIA_DELETE_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

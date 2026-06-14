import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { getR2, publicUrlFor } from '../../../../lib/r2'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 25 * 1024 * 1024 // Edge 请求体上限保护，常规壁纸足够
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

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function r2OrNull() {
  try {
    return getR2()
  } catch {
    return null
  }
}

function rowToWallpaper(row) {
  return {
    id: row.id,
    title: row.title || '',
    titleEn: row.title_en || '',
    category: row.category || 'misc',
    objectKey: row.object_key,
    url: publicUrlFor(row.object_key),
    fileName: row.file_name || '',
    contentType: row.content_type || '',
    sizeBytes: Number(row.size_bytes) || 0,
    width: row.width == null ? null : Number(row.width),
    height: row.height == null ? null : Number(row.height),
    downloads: Number(row.downloads) || 0,
    published: row.published ? 1 : 0,
    sortOrder: Number(row.sort_order) || 0,
    createdAt: row.created_at,
  }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) {
    return Response.json({
      status: 'unavailable',
      generatedAt: Date.now(),
      message: '当前运行环境没有 D1 绑定，壁纸管理台不可用。',
      wallpapers: [],
    })
  }

  try {
    const result = await db
      .prepare('SELECT * FROM wallpapers ORDER BY sort_order DESC, created_at DESC')
      .all()
    const wallpapers = (result?.results || []).map(rowToWallpaper)
    return Response.json({ status: 'ok', generatedAt: Date.now(), wallpapers })
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        error: 'WALLPAPERS_READ_FAILED',
        message: '壁纸列表读取失败（迁移 0022 是否已应用？）。',
        detail: String(error?.message || error),
      },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  const bucket = r2OrNull()
  if (!db || !bucket) {
    return Response.json({ error: 'STORAGE_UNAVAILABLE' }, { status: 503 })
  }

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

  const title = String(form.get('title') || '').trim().slice(0, 200)
  const titleEn = String(form.get('titleEn') || '').trim().slice(0, 200)
  const category = (String(form.get('category') || 'misc').trim() || 'misc').slice(0, 60)
  const width = Number(form.get('width')) || null
  const height = Number(form.get('height')) || null

  const id = crypto.randomUUID()
  const ext = EXT_BY_TYPE[contentType] || 'bin'
  const objectKey = `downloads/${id}.${ext}`

  try {
    const bytes = await file.arrayBuffer()
    await bucket.put(objectKey, bytes, {
      httpMetadata: { contentType },
    })
  } catch (error) {
    return Response.json(
      { error: 'R2_PUT_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }

  const createdAt = Date.now()
  try {
    await db
      .prepare(
        `INSERT INTO wallpapers
          (id, title, title_en, category, object_key, file_name, content_type, size_bytes, width, height, downloads, published, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?)`
      )
      .bind(
        id,
        title,
        titleEn,
        category,
        objectKey,
        file.name || `${id}.${ext}`,
        contentType,
        file.size,
        width,
        height,
        createdAt,
        createdAt
      )
      .run()
  } catch (error) {
    // D1 写失败则回滚已上传的对象，避免孤儿文件
    try {
      await bucket.delete(objectKey)
    } catch {}
    return Response.json(
      { error: 'WALLPAPERS_WRITE_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }

  const row = await db.prepare('SELECT * FROM wallpapers WHERE id = ?').bind(id).first()
  return Response.json({ ok: true, wallpaper: row ? rowToWallpaper(row) : null })
}

export async function DELETE(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  const bucket = r2OrNull()
  if (!db || !bucket) {
    return Response.json({ error: 'STORAGE_UNAVAILABLE' }, { status: 503 })
  }

  const id = new URL(req.url).searchParams.get('id')?.trim()
  if (!id) {
    return Response.json({ error: 'INVALID_ID' }, { status: 400 })
  }

  const row = await db.prepare('SELECT object_key FROM wallpapers WHERE id = ?').bind(id).first()
  if (!row) {
    return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  try {
    await bucket.delete(row.object_key)
  } catch {
    // R2 删除失败不阻断 D1 清理，避免出现“列表里删不掉”的死项
  }

  try {
    await db.prepare('DELETE FROM wallpapers WHERE id = ?').bind(id).run()
  } catch (error) {
    return Response.json(
      { error: 'WALLPAPERS_DELETE_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }

  return Response.json({ ok: true })
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  let body = null
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
  if (typeof body.titleEn === 'string') {
    sets.push('title_en = ?')
    binds.push(body.titleEn.trim().slice(0, 200))
  }
  if (typeof body.category === 'string' && body.category.trim()) {
    sets.push('category = ?')
    binds.push(body.category.trim().slice(0, 60))
  }
  if (body.published != null) {
    sets.push('published = ?')
    binds.push(body.published ? 1 : 0)
  }
  if (body.sortOrder != null && Number.isFinite(Number(body.sortOrder))) {
    sets.push('sort_order = ?')
    binds.push(Number(body.sortOrder))
  }

  if (!sets.length) return Response.json({ error: 'NO_FIELDS' }, { status: 400 })
  binds.push(id)

  try {
    const result = await db
      .prepare(`UPDATE wallpapers SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...binds)
      .run()
    if (!result?.meta?.changes) {
      return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    }
    const row = await db.prepare('SELECT * FROM wallpapers WHERE id = ?').bind(id).first()
    return Response.json({ ok: true, wallpaper: row ? rowToWallpaper(row) : null })
  } catch (error) {
    return Response.json(
      { error: 'WALLPAPERS_WRITE_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }
}

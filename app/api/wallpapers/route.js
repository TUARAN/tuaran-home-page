import { getD1 } from '../../../lib/d1'
import { publicUrlFor } from '../../../lib/r2'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function rowToPublic(row) {
  return {
    id: row.id,
    title: row.title || '',
    titleEn: row.title_en || '',
    category: row.category || 'misc',
    url: publicUrlFor(row.object_key),
    fileName: row.file_name || '',
    sizeBytes: Number(row.size_bytes) || 0,
    width: row.width == null ? null : Number(row.width),
    height: row.height == null ? null : Number(row.height),
    downloads: Number(row.downloads) || 0,
  }
}

export async function GET() {
  const db = dbOrNull()
  if (!db) {
    return Response.json({ status: 'unavailable', generatedAt: Date.now(), wallpapers: [] })
  }

  try {
    const result = await db
      .prepare(
        'SELECT * FROM wallpapers WHERE published = 1 ORDER BY sort_order DESC, created_at DESC'
      )
      .all()
    const wallpapers = (result?.results || []).map(rowToPublic)
    return Response.json({ status: 'ok', generatedAt: Date.now(), wallpapers })
  } catch (error) {
    return Response.json(
      { status: 'error', error: 'WALLPAPERS_READ_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }
}

// 下载埋点：文件本体直接走公开 R2 域名，此接口只 +1 计数。
export async function POST(req) {
  const db = dbOrNull()
  if (!db) return Response.json({ ok: false }, { status: 200 })

  let body = null
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }
  const id = typeof body?.id === 'string' ? body.id.trim() : ''
  if (!id) return Response.json({ error: 'INVALID_ID' }, { status: 400 })

  try {
    await db
      .prepare('UPDATE wallpapers SET downloads = downloads + 1 WHERE id = ? AND published = 1')
      .bind(id)
      .run()
  } catch {
    // 计数失败不影响下载，静默
  }
  return Response.json({ ok: true })
}

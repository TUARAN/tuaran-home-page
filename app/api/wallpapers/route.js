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

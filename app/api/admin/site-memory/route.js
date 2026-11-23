import { getOwnerOrReject } from '../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../lib/db/d1'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// 无参数：返回文件与版本索引（不含正文）。?id=N：返回该版本正文。
export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let db
  try {
    db = getD1()
  } catch {
    return Response.json({ error: 'D1_UNAVAILABLE' }, { status: 503 })
  }

  const id = Number(new URL(req.url).searchParams.get('id'))
  try {
    if (Number.isInteger(id) && id > 0) {
      const row = await db
        .prepare('SELECT id, content FROM site_memory_versions WHERE id = ?')
        .bind(id)
        .first()
      if (!row) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
      return Response.json({ id: row.id, content: row.content })
    }
    const { results } = await db
      .prepare(
        'SELECT id, source_id, slug, title, description, hash, bytes, created_at FROM site_memory_versions ORDER BY source_id, slug, id',
      )
      .all()
    return Response.json({ versions: results || [] })
  } catch (error) {
    return Response.json(
      { error: 'QUERY_FAILED', detail: String(error?.message || error) },
      { status: 500 },
    )
  }
}

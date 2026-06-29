import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function DELETE(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const id = Number(new URL(req.url).searchParams.get('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: 'INVALID_COMMENT_ID' }, { status: 400 })
  }

  let db
  try {
    db = getD1()
  } catch {
    return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  }

  try {
    await db
      .prepare('DELETE FROM comment_notifications WHERE comment_id = ?1 OR reply_to_comment_id = ?1')
      .bind(id)
      .run()
      .catch(() => {})
    const result = await db.prepare('DELETE FROM article_comments WHERE id = ?1').bind(id).run()
    if (!result?.meta?.changes) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    return Response.json({ ok: true, id })
  } catch (error) {
    return Response.json(
      { error: 'COMMENT_DELETE_FAILED', detail: String(error?.message || error) },
      { status: 500 },
    )
  }
}

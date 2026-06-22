import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { normalizeSlug, normalizeTags, rowToArticlePost } from '../../../../../lib/articlePosts'
import { getD1 } from '../../../../../lib/d1'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() { try { return getD1() } catch { return null } }

export async function GET(req, { params }) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  const { id } = await params
  const row = await db.prepare('SELECT * FROM article_posts WHERE id = ?').bind(id).first()
  if (!row) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  return Response.json({ article: rowToArticlePost(row) })
}

export async function PUT(req, { params }) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  let body
  try { body = await req.json() } catch { return Response.json({ error: 'INVALID_JSON' }, { status: 400 }) }
  const { id } = await params
  const current = await db.prepare('SELECT * FROM article_posts WHERE id = ?').bind(id).first()
  if (!current) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (Number(body?.revision) !== Number(current.revision)) {
    return Response.json({ error: 'REVISION_CONFLICT', article: rowToArticlePost(current) }, { status: 409 })
  }

  const title = String(body?.title || '').trim().slice(0, 200)
  const slug = normalizeSlug(body?.slug)
  const status = body?.status === 'published' ? 'published' : 'draft'
  const contentText = String(body?.contentText || '').trim().slice(0, 200000)
  if (status === 'published' && (!title || !slug || !contentText)) {
    return Response.json({ error: 'PUBLISH_FIELDS_REQUIRED' }, { status: 400 })
  }
  const now = Date.now()
  const publishedAt = status === 'published' ? (current.published_at || now) : null
  try {
    await db.prepare(
      `UPDATE article_posts SET
       slug = ?, title = ?, summary = ?, cover_url = ?, content_json = ?, content_text = ?, tags_json = ?,
       status = ?, revision = revision + 1, updated_at = ?, published_at = ?
       WHERE id = ? AND revision = ?`
    ).bind(
      slug || current.slug, title, String(body?.summary || '').trim().slice(0, 500),
      String(body?.coverUrl || '').trim().slice(0, 1000), JSON.stringify(body?.content || {}),
      contentText, JSON.stringify(normalizeTags(body?.tags)), status, now, publishedAt, id, current.revision
    ).run()
    const row = await db.prepare('SELECT * FROM article_posts WHERE id = ?').bind(id).first()
    return Response.json({ ok: true, article: rowToArticlePost(row) })
  } catch (error) {
    const message = String(error?.message || error)
    const statusCode = message.includes('UNIQUE') ? 409 : 500
    return Response.json({ error: statusCode === 409 ? 'SLUG_EXISTS' : 'ARTICLE_UPDATE_FAILED', detail: message }, { status: statusCode })
  }
}

export async function DELETE(req, { params }) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })
  const { id } = await params
  await db.prepare('DELETE FROM article_posts WHERE id = ?').bind(id).run()
  return Response.json({ ok: true })
}

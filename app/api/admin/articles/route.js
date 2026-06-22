import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { EMPTY_ARTICLE_DOC, normalizeSlug, normalizeTags, rowToArticlePost } from '../../../../lib/articlePosts'
import { getD1 } from '../../../../lib/d1'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try { return getD1() } catch { return null }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) return Response.json({ status: 'unavailable', articles: [] })
  try {
    const result = await db.prepare('SELECT * FROM article_posts ORDER BY updated_at DESC').all()
    return Response.json({ status: 'ok', articles: (result?.results || []).map(rowToArticlePost) })
  } catch (error) {
    return Response.json({ error: 'ARTICLE_POSTS_READ_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  let body
  try { body = await req.json() } catch { return Response.json({ error: 'INVALID_JSON' }, { status: 400 }) }
  const id = crypto.randomUUID()
  const now = Date.now()
  const title = String(body?.title || '').trim().slice(0, 200)
  const slug = normalizeSlug(body?.slug || title) || `draft-${id.slice(0, 8)}`
  const content = body?.content && typeof body.content === 'object' ? body.content : EMPTY_ARTICLE_DOC
  const tags = normalizeTags(body?.tags)
  try {
    await db.prepare(
      `INSERT INTO article_posts
       (id, slug, title, summary, cover_url, content_json, content_text, tags_json, status, revision, created_at, updated_at, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 1, ?, ?, NULL)`
    ).bind(
      id, slug, title, String(body?.summary || '').trim().slice(0, 500),
      String(body?.coverUrl || '').trim().slice(0, 1000), JSON.stringify(content),
      String(body?.contentText || '').slice(0, 200000), JSON.stringify(tags), now, now
    ).run()
    const row = await db.prepare('SELECT * FROM article_posts WHERE id = ?').bind(id).first()
    return Response.json({ ok: true, article: rowToArticlePost(row) }, { status: 201 })
  } catch (error) {
    const message = String(error?.message || error)
    const status = message.includes('UNIQUE') ? 409 : 500
    return Response.json({ error: status === 409 ? 'SLUG_EXISTS' : 'ARTICLE_CREATE_FAILED', detail: message }, { status })
  }
}

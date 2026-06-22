import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { getD1 } from '../../../../../lib/d1'
import { getR2, publicUrlFor } from '../../../../../lib/r2'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 10 * 1024 * 1024
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' }

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  let db, bucket
  try { db = getD1(); bucket = getR2() } catch { return Response.json({ error: 'STORAGE_UNAVAILABLE' }, { status: 503 }) }
  let form
  try { form = await req.formData() } catch { return Response.json({ error: 'INVALID_FORM' }, { status: 400 }) }
  const articleId = String(form.get('articleId') || '').trim()
  const file = form.get('file')
  if (!articleId || !file || typeof file === 'string') return Response.json({ error: 'FILE_REQUIRED' }, { status: 400 })
  const article = await db.prepare('SELECT id FROM article_posts WHERE id = ?').bind(articleId).first()
  if (!article) return Response.json({ error: 'ARTICLE_NOT_FOUND' }, { status: 404 })
  if (!EXTENSIONS[file.type]) return Response.json({ error: 'UNSUPPORTED_TYPE' }, { status: 415 })
  if (file.size > MAX_BYTES) return Response.json({ error: 'FILE_TOO_LARGE', maxBytes: MAX_BYTES }, { status: 413 })
  const objectKey = `articles/${articleId}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`
  try {
    await bucket.put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } })
    return Response.json({ ok: true, url: publicUrlFor(objectKey), objectKey })
  } catch (error) {
    return Response.json({ error: 'R2_PUT_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

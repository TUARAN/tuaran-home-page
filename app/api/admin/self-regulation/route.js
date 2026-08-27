import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { parsePrivateDocumentEnvelope } from '../../../../lib/privateDocuments'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const DOCUMENT_SLUG = 'self-regulation-memoir'

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' },
  })
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let db
  try {
    db = getD1()
  } catch {
    return json({ error: 'DB_UNAVAILABLE' }, 503)
  }

  try {
    const row = await db
      .prepare('SELECT title, content, updated_at FROM private_documents WHERE slug = ?')
      .bind(DOCUMENT_SLUG)
      .first()
    if (!row) return json({ error: 'DOCUMENT_NOT_FOUND' }, 404)
    parsePrivateDocumentEnvelope(row.content)

    return json({
      status: 'ok',
      title: String(row.title || '回忆录'),
      encryptedContent: String(row.content),
      updatedAt: Number(row.updated_at) || 0,
    })
  } catch (error) {
    return json({ error: 'PRIVATE_DOCUMENT_READ_FAILED', detail: String(error?.message || error) }, 500)
  }
}

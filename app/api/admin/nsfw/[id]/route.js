import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { getD1 } from '../../../../../lib/d1'
import { getPrivateNsfwR2 } from '../../../../../lib/r2'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function safeFilename(value) {
  return String(value || 'media').replace(/["\\\r\n]/g, '_')
}

export async function GET(req, { params }) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let db
  let bucket
  try {
    db = getD1()
    bucket = getPrivateNsfwR2()
  } catch {
    return Response.json({ error: 'STORAGE_UNAVAILABLE' }, { status: 503 })
  }

  const { id } = await params
  const row = await db
    .prepare('SELECT object_key, file_name, content_type FROM nsfw_media WHERE id = ?')
    .bind(String(id || '').trim())
    .first()
  if (!row) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })

  const object = await bucket.get(row.object_key)
  if (!object) return Response.json({ error: 'OBJECT_NOT_FOUND' }, { status: 404 })

  return new Response(object.body, {
    headers: {
      'Content-Type': row.content_type || 'application/octet-stream',
      'Content-Length': String(object.size),
      'Content-Disposition': `inline; filename="${safeFilename(row.file_name)}"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'same-origin',
    },
  })
}

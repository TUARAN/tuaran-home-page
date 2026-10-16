import { getOwnerOrReject } from '../../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../../lib/db/d1'
import { getPrivateDocumentsR2 } from '../../../../../lib/db/r2'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  let db
  let bucket
  try { db = getD1(); bucket = getPrivateDocumentsR2() } catch {
    return Response.json({ error: 'STORAGE_UNAVAILABLE' }, { status: 503 })
  }
  const { id } = await params
  const row = await db.prepare('SELECT object_key, file_name, size_bytes FROM private_document_files WHERE id = ?').bind(String(id || '')).first()
  if (!row) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  const object = await bucket.get(row.object_key)
  if (!object) return Response.json({ error: 'OBJECT_NOT_FOUND' }, { status: 404 })

  const fallbackName = String(row.file_name || 'document.pdf').replace(/["\\\r\n]/g, '_')
  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(object.size),
      'Content-Disposition': `inline; filename="${fallbackName.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(fallbackName)}`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  })
}

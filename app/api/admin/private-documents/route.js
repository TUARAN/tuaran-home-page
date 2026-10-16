import { getOwnerOrReject } from '../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../lib/db/d1'
import { getPrivateDocumentsR2 } from '../../../../lib/db/r2'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 20 * 1024 * 1024

function storageOrNull() {
  try { return { db: getD1(), bucket: getPrivateDocumentsR2() } } catch { return null }
}

function toItem(row) {
  return {
    id: row.id,
    recordId: row.record_id == null ? null : Number(row.record_id),
    title: row.title,
    fileName: row.file_name,
    sizeBytes: Number(row.size_bytes),
    sha256: row.sha256,
    createdAt: Number(row.created_at),
    previewUrl: `/api/admin/private-documents/${encodeURIComponent(row.id)}`,
  }
}

function safeName(value) {
  return String(value || 'document.pdf').replace(/[\\/\r\n\u0000-\u001f]/g, '_').slice(0, 180)
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const storage = storageOrNull()
  if (!storage) return Response.json({ error: 'STORAGE_UNAVAILABLE' }, { status: 503 })

  const rawRecordId = new URL(req.url).searchParams.get('recordId')
  const recordId = rawRecordId == null ? null : Number(rawRecordId)
  if (recordId != null && (!Number.isSafeInteger(recordId) || recordId <= 0)) {
    return Response.json({ error: 'INVALID_RECORD_ID' }, { status: 400 })
  }
  try {
    const query = recordId == null
      ? storage.db.prepare('SELECT * FROM private_document_files ORDER BY created_at DESC LIMIT 200')
      : storage.db.prepare('SELECT * FROM private_document_files WHERE record_id = ? ORDER BY created_at DESC LIMIT 200').bind(recordId)
    const result = await query.all()
    return Response.json({ items: (result?.results || []).map(toItem) }, {
      headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive' },
    })
  } catch {
    return Response.json({ error: 'DOCUMENTS_READ_FAILED' }, { status: 500 })
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const storage = storageOrNull()
  if (!storage) return Response.json({ error: 'STORAGE_UNAVAILABLE' }, { status: 503 })

  let form
  try { form = await req.formData() } catch { return Response.json({ error: 'INVALID_FORM' }, { status: 400 }) }
  const file = form.get('file')
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
    return Response.json({ error: 'FILE_REQUIRED' }, { status: 400 })
  }
  if (!file.size || file.size > MAX_BYTES) {
    return Response.json({ error: 'FILE_TOO_LARGE', maxBytes: MAX_BYTES }, { status: 413 })
  }
  if (file.type !== 'application/pdf') return Response.json({ error: 'PDF_ONLY' }, { status: 415 })

  const recordIdText = String(form.get('recordId') || '').trim()
  const recordId = recordIdText ? Number(recordIdText) : null
  if (recordId != null && (!Number.isSafeInteger(recordId) || recordId <= 0)) {
    return Response.json({ error: 'INVALID_RECORD_ID' }, { status: 400 })
  }
  if (recordId != null) {
    const record = await storage.db.prepare('SELECT id FROM private_records WHERE id = ? AND deleted_at IS NULL').bind(recordId).first()
    if (!record) return Response.json({ error: 'RECORD_NOT_FOUND' }, { status: 404 })
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  if (bytes.length < 5 || String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') {
    return Response.json({ error: 'INVALID_PDF' }, { status: 415 })
  }
  const id = crypto.randomUUID()
  const objectKey = `documents/${recordId || 'unfiled'}/${id}.pdf`
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
  const sha256 = [...digest].map((part) => part.toString(16).padStart(2, '0')).join('')
  const fileName = safeName(file.name)
  const title = String(form.get('title') || fileName.replace(/\.pdf$/i, '')).trim().slice(0, 200) || '未命名文档'
  const createdAt = Date.now()
  try {
    await storage.bucket.put(objectKey, bytes, { httpMetadata: { contentType: 'application/pdf' } })
  } catch {
    return Response.json({ error: 'DOCUMENT_UPLOAD_FAILED' }, { status: 500 })
  }
  try {
    await storage.db.prepare(
      `INSERT INTO private_document_files
       (id, record_id, title, file_name, object_key, content_type, size_bytes, sha256, created_at)
       VALUES (?, ?, ?, ?, ?, 'application/pdf', ?, ?, ?)`
    ).bind(id, recordId, title, fileName, objectKey, bytes.length, sha256, createdAt).run()
  } catch {
    await storage.bucket.delete(objectKey).catch(() => {})
    return Response.json({ error: 'DOCUMENT_WRITE_FAILED' }, { status: 500 })
  }
  return Response.json({ ok: true, item: {
    id, recordId, title, fileName, sizeBytes: bytes.length, sha256, createdAt,
    previewUrl: `/api/admin/private-documents/${encodeURIComponent(id)}`,
  } }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } })
}

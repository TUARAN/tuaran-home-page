import { getOwnerOrReject } from '../../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../../lib/db/d1'
import { normalizePrivateNote, rowToPrivateNote } from '../../../../../lib/private-data/privateDocumentNotes'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Content-Type-Options': 'nosniff',
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: PRIVATE_HEADERS })
}

function dbOrNull() {
  try { return getD1() } catch { return null }
}

async function bodyOrNull(req) {
  try { return await req.json() } catch { return null }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) return json({ error: 'DB_UNAVAILABLE' }, 503)
  try {
    const result = await db.prepare('SELECT * FROM private_document_notes ORDER BY updated_at DESC LIMIT 200').all()
    return json({ items: (result?.results || []).map(rowToPrivateNote) })
  } catch {
    return json({ error: 'NOTES_READ_FAILED' }, 500)
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) return json({ error: 'DB_UNAVAILABLE' }, 503)
  const body = await bodyOrNull(req)
  if (!body) return json({ error: 'INVALID_JSON' }, 400)
  const note = normalizePrivateNote(body)
  if (note.error) return json({ error: note.error }, 400)
  const id = crypto.randomUUID()
  const now = Date.now()
  try {
    await db.prepare('INSERT INTO private_document_notes (id, title, body, revision, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)')
      .bind(id, note.title, note.body, now, now).run()
    return json({ item: { id, ...note, revision: 1, createdAt: now, updatedAt: now } }, 201)
  } catch {
    return json({ error: 'NOTE_CREATE_FAILED' }, 500)
  }
}

export async function PUT(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const db = dbOrNull()
  if (!db) return json({ error: 'DB_UNAVAILABLE' }, 503)
  const body = await bodyOrNull(req)
  if (!body) return json({ error: 'INVALID_JSON' }, 400)
  const id = String(body.id || '')
  const revision = Number(body.revision)
  if (!/^[0-9a-f-]{36}$/i.test(id) || !Number.isSafeInteger(revision) || revision < 1) return json({ error: 'INVALID_REVISION' }, 400)
  const note = normalizePrivateNote(body)
  if (note.error) return json({ error: note.error }, 400)
  const now = Date.now()
  try {
    const result = await db.prepare('UPDATE private_document_notes SET title = ?, body = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND revision = ?')
      .bind(note.title, note.body, now, id, revision).run()
    if (!result?.meta?.changes) return json({ error: 'REVISION_CONFLICT_OR_NOT_FOUND' }, 409)
    return json({ item: { id, ...note, revision: revision + 1, updatedAt: now } })
  } catch {
    return json({ error: 'NOTE_UPDATE_FAILED' }, 500)
  }
}

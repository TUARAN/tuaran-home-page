export const MAX_PRIVATE_NOTE_TITLE = 200
export const MAX_PRIVATE_NOTE_BODY = 50000

export function normalizePrivateNote(value) {
  const title = String(value?.title || '').trim()
  const body = String(value?.body || '').replace(/\r\n?/g, '\n').trim()
  if (!title || title.length > MAX_PRIVATE_NOTE_TITLE) return { error: 'TITLE_REQUIRED' }
  if (!body || body.length > MAX_PRIVATE_NOTE_BODY) return { error: 'BODY_REQUIRED' }
  return { title, body }
}

export function rowToPrivateNote(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    revision: Number(row.revision),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  }
}

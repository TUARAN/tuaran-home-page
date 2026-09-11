import { entryFromResearchSource } from './research/source.js'
import { normalizeResearchSnapshot } from './researchDocument.mjs'
import { publishResearchSnapshot } from './researchPublication.js'

export async function prepareResearchSourcePublication(db, { category, filename, raw, status = 'published' }) {
  const entry = entryFromResearchSource(category, filename, raw)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const sourceHash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  const snapshot = { entry, sourcePath: `research/${category}/${filename}`, sourceHash, status }
  const normalized = normalizeResearchSnapshot(snapshot)
  if (normalized.error) throw new Error(normalized.error)
  // Preflight schema/revision before any Git write. Retry after a completed D1
  // publication is idempotent only for the exact same source and requested state.
  const current = await db.prepare('SELECT revision, source_hash, status FROM content_documents WHERE content_key = ?').bind(normalized.document.contentKey).first()
  return { snapshot, expectedRevision: current?.revision || 0, unchanged: current?.source_hash === sourceHash && current?.status === status }
}

export async function commitResearchSourcePublication(db, prepared) {
  if (prepared.unchanged) {
    const key = `research:${prepared.snapshot.entry.category}:${prepared.snapshot.entry.slug}`
    const current = await db.prepare('SELECT revision, source_hash, status FROM content_documents WHERE content_key = ?').bind(key).first()
    if (current?.revision !== prepared.expectedRevision || current.status !== 'published' || current.source_hash !== prepared.snapshot.sourceHash) throw new Error('REVISION_CONFLICT')
    return { ok: true, revision: prepared.expectedRevision }
  }
  const result = await publishResearchSnapshot(db, prepared.snapshot, { expectedRevision: prepared.expectedRevision })
  if (!result.ok) throw new Error(result.error)
  return result
}

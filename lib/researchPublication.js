import { normalizeResearchSnapshot, researchSnapshotIndex } from './researchDocument.mjs'
import { prepareContentIndexUpsert } from './contentIndexStatements.mjs'

export async function publishResearchSnapshot(db, input, { expectedRevision } = {}) {
  const normalized = normalizeResearchSnapshot(input)
  if (normalized.error) return { ok: false, error: normalized.error, status: 400 }
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) return { ok: false, error: 'REVISION_REQUIRED', status: 400 }
  const document = normalized.document
  const current = await db.prepare('SELECT revision FROM content_documents WHERE content_key = ?').bind(document.contentKey).first()
  if ((current?.revision || 0) !== expectedRevision) return { ok: false, error: 'REVISION_CONFLICT', status: 409 }
  const now = Date.now()
  const statements = []
  if (current) {
    // A failed compare-and-swap aborts the D1 batch through the NOT NULL constraint.
    statements.push(db.prepare(`UPDATE content_documents SET metadata_json = ?, body_json = ?, source_path = ?, source_hash = ?,
      status = ?, updated_at = ?, revision = CASE WHEN revision = ? THEN revision + 1 ELSE NULL END
      WHERE content_key = ?`).bind(document.metadataJson, document.bodyJson, document.sourcePath, document.sourceHash, document.status, now, expectedRevision, document.contentKey))
  } else {
    statements.push(db.prepare(`INSERT INTO content_documents
      (content_key, document_type, category, slug, metadata_json, body_json, source_path, source_hash, revision, status, created_at, updated_at)
      VALUES (?, 'research', ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`).bind(document.contentKey, document.category, document.slug, document.metadataJson, document.bodyJson, document.sourcePath, document.sourceHash, document.status, now, now))
  }
  for (const pathname of document.routes) {
    // A pathname owned by another document must abort the entire publication.
    statements.push(db.prepare(`INSERT INTO content_routes (pathname, content_key) VALUES (?, ?)
      ON CONFLICT(pathname) DO UPDATE SET content_key = CASE
        WHEN content_routes.content_key = excluded.content_key THEN excluded.content_key ELSE NULL END`).bind(pathname, document.contentKey))
  }
  statements.push(prepareContentIndexUpsert(db, researchSnapshotIndex(document), now))
  try {
    await db.batch(statements)
    return { ok: true, contentKey: document.contentKey, revision: expectedRevision + 1, status: document.status }
  } catch (error) {
    const message = String(error?.message || error)
    if (message.includes('content_documents.revision') || message.includes('UNIQUE constraint failed: content_documents')) return { ok: false, error: 'REVISION_CONFLICT', status: 409 }
    if (message.includes('content_routes.content_key') || message.includes('CONTENT_ROUTE_CONFLICT')) return { ok: false, error: 'ROUTE_CONFLICT', status: 409 }
    throw error
  }
}

export async function readResearchDocument(db, category, slug) {
  const row = await db.prepare(`SELECT status, metadata_json, CASE WHEN status = 'published' THEN body_json ELSE NULL END AS body_json, revision, source_path, source_hash
    FROM content_documents WHERE content_key = ?`).bind(`research:${category}:${slug}`).first()
  // Distinguish missing records from tombstones: callers must never fall back for a tombstone.
  if (!row) return { found: false }
  return {
    found: true, status: row.status, revision: row.revision,
    sourcePath: row.source_path, sourceHash: row.source_hash,
    entry: row.status === 'published' ? { ...JSON.parse(row.metadata_json), ...JSON.parse(row.body_json) } : null,
  }
}

export async function readResearchRoute(db, pathname) {
  const row = await db.prepare(`SELECT d.content_key, d.status, d.category, d.slug
    FROM content_routes r JOIN content_documents d ON d.content_key = r.content_key
    WHERE r.pathname = ?`).bind(pathname).first()
  if (!row) return { found: false }
  return { found: true, status: row.status, contentKey: row.content_key, href: `/articles/research/${row.category}/${row.slug}` }
}

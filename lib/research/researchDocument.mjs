import { researchPublicSummary } from './researchPublicSummary.js'

export const RESEARCH_DOCUMENT_MAX_BYTES = 1536 * 1024
const categories = new Set(['companies', 'topics', 'people'])
const statuses = new Set(['draft', 'published', 'retired'])

export function normalizeResearchSnapshot(input) {
  const original = input?.entry
  if (!original || !categories.has(original.category) || !/^[a-z0-9][a-z0-9-]{0,119}$/.test(original.slug || '')) return { error: 'INVALID_RESEARCH_ID' }
  const { raw, ...entry } = original
  if (!entry.title || typeof entry.title !== 'string' || entry.title.length > 300) return { error: 'INVALID_TITLE' }
  if (typeof entry.content !== 'string' || !Array.isArray(entry.variants)) return { error: 'INVALID_RESEARCH_BODY' }
  if (entry.variants.some((variant) => !variant || typeof variant.content !== 'string' || typeof variant.id !== 'string')) return { error: 'INVALID_VARIANTS' }
  if (entry.encrypted) {
    const payload = entry.encryptedPayload
    if (entry.content || entry.variants.length || !payload || payload.v !== 1 || payload.kdf !== 'PBKDF2-SHA256' || !Number.isInteger(payload.iter) || payload.iter < 1 || !['salt','iv','data'].every((key) => typeof payload[key] === 'string' && /^[A-Za-z0-9+/]+=*$/.test(payload[key]))) return { error: 'INVALID_ENCRYPTED_SNAPSHOT' }
    try {
      if (atob(payload.salt).length !== 16 || atob(payload.iv).length !== 12 || atob(payload.data).length < 16) return { error: 'INVALID_ENCRYPTED_SNAPSHOT' }
    } catch { return { error: 'INVALID_ENCRYPTED_SNAPSHOT' } }
  }
  const sourcePath = String(input.sourcePath || '')
  const expectedPath = `research/${entry.category}/${entry.filename}`
  if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/.test(entry.filename || '') || sourcePath !== expectedPath || !entry.filename.endsWith(`-${entry.slug}.md`)) return { error: 'INVALID_SOURCE_PATH' }
  if (!/^[a-f0-9]{64}$/.test(input.sourceHash || '')) return { error: 'INVALID_SOURCE_HASH' }
  const status = input.status || 'draft'
  if (!statuses.has(status)) return { error: 'INVALID_STATUS' }
  const entryJson = JSON.stringify(entry)
  if (new TextEncoder().encode(entryJson).length > RESEARCH_DOCUMENT_MAX_BYTES) return { error: 'RESEARCH_DOCUMENT_TOO_LARGE' }
  const { content, variants, encryptedPayload, ...metadata } = entry
  const metadataJson = JSON.stringify(metadata)
  const bodyJson = JSON.stringify({ content, variants, encryptedPayload: encryptedPayload || null })
  const contentKey = `research:${entry.category}:${entry.slug}`
  const href = `/articles/research/${entry.category}/${entry.slug}`
  const legacySlug = entry.filename.slice(0, -3)
  const routes = [href, `/articles/research/${entry.category}/${legacySlug}`, `/articles/${entry.slug}`, `/articles/${legacySlug}`]
  return { document: { contentKey, category: entry.category, slug: entry.slug, entry, metadataJson, bodyJson, sourcePath, sourceHash: input.sourceHash, status, routes } }
}

export function researchSnapshotIndex(document) {
  const { entry, contentKey, category, slug, status } = document
  return {
    contentKey, type: 'research', category, slug,
    title: entry.title,
    summary: researchPublicSummary(entry),
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    href: `/articles/research/${category}/${slug}`,
    date: entry.date || '',
    // Encrypted pages are addressable but must not appear in public discovery/recommendations.
    status: entry.encrypted ? 'retired' : status,
    source: 'git',
  }
}

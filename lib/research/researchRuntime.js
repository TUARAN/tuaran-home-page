import { cache } from 'react'
import { getD1 } from '../db/d1'
import { readContentAsset, readContentCatalog } from '../content/contentCatalogRuntime'
import { readResearchDocument, readResearchRoute } from './researchPublication'
import { RESEARCH_EDIT_COUNTS } from './editCounts'

function attachEditRecord(entry, category, slug, revision) {
  if (!entry) return entry
  const next = { ...entry }
  if (Number.isSafeInteger(revision) && revision >= 1) next.revision = revision
  const editCount = RESEARCH_EDIT_COUNTS[`${category}/${slug}`] || 0
  if (editCount > 0) next.editCount = editCount
  return next
}

// Only the absent, additive schema allows legacy reads during rollout. Connection
// errors must propagate: falling back could resurrect a withdrawn document.
async function optionalSchema(read) {
  try { return await read(getD1()) } catch (error) {
    if (/no such table: (?:main\.)?content_(?:documents|routes)\b/.test(String(error?.message || error))) return { found: false }
    throw error
  }
}

export async function resolveResearchPath(pathname) {
  const stored = await optionalSchema((db) => readResearchRoute(db, pathname))
  if (stored.found) return stored
  const catalog = await readContentCatalog()
  const short = /^\/articles\/([^/]+)$/.exec(pathname)
  let href = short && Object.hasOwn(catalog.researchRedirects, short[1]) ? catalog.researchRedirects[short[1]] : null
  const deep = /^\/articles\/research\/(companies|topics|people)\/([a-z0-9-]+)$/.exec(pathname)
  if (deep) {
    const slug = deep[2].replace(/^\d{4}-\d{2}-\d{2}-/, '')
    if (catalog.researchKeys.includes(`${deep[1]}/${slug}`)) href = `/articles/research/${deep[1]}/${slug}`
  }
  if (!href) return { found: false }
  // Even a legacy alias must respect the canonical record's tombstone.
  const canonical = await optionalSchema((db) => readResearchRoute(db, href))
  return canonical.found ? canonical : { found: true, status: 'published', href }
}

export const getRuntimeResearchEntry = cache(async (category, slug) => {
  if (!/^(companies|topics|people)$/.test(category) || !/^[a-z0-9-]+$/.test(slug)) return null
  const route = await resolveResearchPath(`/articles/research/${category}/${slug}`)
  if (!route.found || route.status !== 'published') return null
  const canonicalSlug = route.href.split('/').pop()
  const stored = await optionalSchema((db) => readResearchDocument(db, category, canonicalSlug))
  if (stored.found) return attachEditRecord(stored.entry, category, canonicalSlug, Number(stored.revision))
  return attachEditRecord(await readContentAsset(`/data/research-archive/${category}/${canonicalSlug}.json`), category, canonicalSlug)
})

const RESEARCH_OVERRIDE_TTL_MS = 5 * 60 * 1000
let researchOverrideCache = { expiresAt: 0, rows: null, pending: null }

async function loadResearchOverrideRows(db) {
  const rows = []
  for (let offset = 0; ; offset += 500) {
    const result = await db.prepare('SELECT content_key, status, metadata_json, source_path, updated_at FROM content_documents ORDER BY content_key LIMIT 500 OFFSET ?').bind(offset).all()
    const page = result.results || []
    rows.push(...page)
    if (page.length < 500) break
  }
  return { rows }
}

export async function listResearchOverrides({ fresh = false } = {}) {
  const now = Date.now()
  if (!fresh && researchOverrideCache.rows && researchOverrideCache.expiresAt > now) return researchOverrideCache.rows
  if (!fresh && researchOverrideCache.pending) return researchOverrideCache.pending
  const pending = optionalSchema(loadResearchOverrideRows).then((stored) => {
    if (researchOverrideCache.pending === pending) researchOverrideCache.pending = null
    if (!stored || stored.found === false || !Array.isArray(stored.rows)) return []
    researchOverrideCache = { expiresAt: Date.now() + RESEARCH_OVERRIDE_TTL_MS, rows: stored.rows, pending: null }
    return stored.rows
  }).catch((error) => {
    if (researchOverrideCache.pending === pending) researchOverrideCache.pending = null
    throw error
  })
  if (!fresh) researchOverrideCache.pending = pending
  return pending
}

export async function listRuntimeResearchByCategory(category) {
  const catalog = await readContentCatalog()
  const entries = new Map(Object.entries(catalog.researchMeta).filter(([, entry]) => entry.category === category))
  const stored = { rows: await listResearchOverrides() }
  for (const row of stored.rows || []) {
    const entry = JSON.parse(row.metadata_json)
    if (entry.category !== category) continue
    const key = `${category}/${entry.slug}`
    if (row.status === 'published' && !entry.encrypted) entries.set(key, entry)
    else entries.delete(key)
  }
  return [...entries.values()].sort((a, b) => String(b.sortKey || b.date).localeCompare(String(a.sortKey || a.date)))
}

export async function readPublishedResearchKeys() {
  const keys = new Set((await readContentCatalog()).researchKeys)
  for (const row of await listResearchOverrides()) {
    const entry = JSON.parse(row.metadata_json)
    const key = `${entry.category}/${entry.slug}`
    if (row.status === 'published') keys.add(key)
    else keys.delete(key)
  }
  return keys
}

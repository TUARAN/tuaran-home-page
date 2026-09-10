import { cache } from 'react'
import { getD1 } from './d1'
import { readContentAsset, readContentCatalog } from './contentCatalogRuntime'
import { readResearchDocument, readResearchRoute } from './researchPublication'

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
  if (stored.found) return stored.entry
  return readContentAsset(`/data/research-archive/${category}/${canonicalSlug}.json`)
})

export async function listResearchOverrides() {
  const stored = await optionalSchema(async (db) => {
    const rows = []
    for (let offset = 0; ; offset += 500) {
      const result = await db.prepare('SELECT content_key, status, metadata_json, updated_at FROM content_documents ORDER BY content_key LIMIT 500 OFFSET ?').bind(offset).all()
      rows.push(...(result.results || []))
      if ((result.results || []).length < 500) break
    }
    return { rows }
  })
  return stored.rows || []
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

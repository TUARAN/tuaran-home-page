import { readContentCatalog } from './contentCatalogRuntime'
import { listContentIndex } from './contentIndex'
import { selectRelatedContent } from './contentSelection.mjs'
export { CONTENT_PIPELINE_TYPE_LABELS } from './contentSelection.mjs'

export async function listAllContent() {
  const catalog = await readContentCatalog()
  const byKey = new Map(catalog.entries.map((entry) => [entry.contentKey, entry]))
  // A failed database read must not resurrect a retired archive entry.
  for (let offset = 0; ; offset += 1000) {
    const entries = await listContentIndex({ limit: 1000, offset })
    for (const entry of entries) {
      if (entry.status === 'published') byKey.set(entry.contentKey, entry)
      else byKey.delete(entry.contentKey)
    }
    if (entries.length < 1000) break
  }
  return [...byKey.values()]
}
export async function getContentByKey(key) {
  return (await listAllContent()).find((entry) => entry.contentKey === key) || null
}
export async function getRelatedContent(key, options) {
  try { return selectRelatedContent(await listAllContent(), key, options) }
  catch { return [] } // Optional recommendations must not prevent reading the article.
}

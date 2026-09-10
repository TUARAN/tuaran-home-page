// Build-time compatibility only. New Git documents are published through D1;
// adding a source file must not create another bundled static asset or RSS item.
import manifest from '../../data/content-archive.json'
import { listResearch as listSourceResearch, getResearchEntry as getSourceResearchEntry } from './loader'
export { CATEGORY_META, COMPANY_TYPE_META, TOPIC_TYPE_META } from './categories'

const keys = new Set(manifest.researchKeys)
export function listResearch() {
  return listSourceResearch().filter((entry) => keys.has(`${entry.category}/${entry.slug}`))
}
export function getResearchEntry(category, slug) {
  return keys.has(`${category}/${slug}`) ? getSourceResearchEntry(category, slug) : null
}

import { readContentCatalog } from './contentCatalogRuntime'
import { listResearchOverrides } from './researchRuntime'
import { researchKnowledgeItem } from './researchKnowledgeItem'
import { isAShareResearchEntry } from './research/shareTitle'
import { listDiscoverablePosts } from './articleDiscovery'
import { articlePostToKnowledgeItem } from './articlePosts'
import { listContentIndex } from './contentIndex'
import { taxonomyForManualEntry } from './contentTaxonomy'
import { compareSortKeyDesc, researchSortKey } from './research/datetime'

export async function readRuntimeKnowledgeItems() {
  const [catalog, research, posts] = await Promise.all([
    readContentCatalog(), listResearchOverrides(), listDiscoverablePosts(),
  ])
  const items = new Map(catalog.knowledgeItems.filter((item) => !item.encrypted).map((item) => [item.href, item]))
  for (const row of research) {
    const entry = JSON.parse(row.metadata_json)
    const href = `/articles/research/${entry.category}/${entry.slug}`
    if (row.status === 'published' && !entry.encrypted && !isAShareResearchEntry(entry)) items.set(href, researchKnowledgeItem(entry))
    else items.delete(href)
  }
  for (let offset = 0; ; offset += 1000) {
    const rows = await listContentIndex({ source: 'manual', limit: 1000, offset })
    for (const entry of rows) {
      if (entry.status !== 'published') { items.delete(entry.href); continue }
      if (items.has(entry.href) || !['article', 'resource', 'research'].includes(entry.type)) continue
      items.set(entry.href, {
        id: `content-db:${entry.contentKey}`, kind: entry.type === 'article' ? 'posts' : entry.type === 'resource' ? 'resources' : entry.category,
        title: entry.title, summary: entry.summary, href: entry.href, date: entry.date, sortKey: researchSortKey(entry.date),
        ...taxonomyForManualEntry(entry),
      })
    }
    if (rows.length < 1000) break
  }
  for (const post of posts) {
    const item = articlePostToKnowledgeItem(post)
    items.set(item.href, item)
  }
  return [...items.values()].sort((a, b) => compareSortKeyDesc(a.sortKey, b.sortKey, a.id, b.id))
}

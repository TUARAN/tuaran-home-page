import { readContentCatalog } from './contentCatalogRuntime'
import { listResearchOverrides } from './researchRuntime'
import { listDiscoverablePosts, postDiscoveryDate } from './articleDiscovery'
import { buildHomeRecommendationCatalog } from './homeRecommendationCatalogCore'

export async function getRuntimeHomeRecommendationCatalog() {
  const [catalog, overrides, posts] = await Promise.all([
    readContentCatalog(), listResearchOverrides(), listDiscoverablePosts(),
  ])
  const research = new Map(Object.entries(catalog.researchMeta))
  for (const row of overrides) {
    const entry = JSON.parse(row.metadata_json)
    const key = `${entry.category}/${entry.slug}`
    if (row.status === 'published' && !entry.encrypted) research.set(key, entry)
    else research.delete(key)
  }
  const articles = [...catalog.articles, ...posts.map((post) => ({
    ...post, date: postDiscoveryDate(post)?.toISOString().slice(0, 10) || '',
  }))]
  return buildHomeRecommendationCatalog(articles, [...research.values()])
}

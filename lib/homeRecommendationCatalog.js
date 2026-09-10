import { articles } from './articleMetadata.js'
import { RESEARCH_ENTRY_META } from './research/catalog.js'
import { buildHomeRecommendationCatalog } from './homeRecommendationCatalogCore.js'

export function getHomeRecommendationCatalog() {
  return buildHomeRecommendationCatalog(articles, Object.values(RESEARCH_ENTRY_META))
}

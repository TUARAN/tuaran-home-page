import { readContentCatalog } from './contentCatalogRuntime'
import { resolveResearchPath } from './researchRuntime'

const fixed = new Set(['published', 'creation-calendar', 'year-summary', 'research', 'diary-self-reflection'])
export async function resolveReservedArticleSlug(slug) {
  if (fixed.has(slug)) return { reserved: true }
  const catalog = await readContentCatalog()
  if (catalog.articles.some((article) => article.slug === slug)) return { reserved: true }
  const route = await resolveResearchPath(`/articles/${slug}`)
  return { reserved: route.found, redirectHref: route.href, status: route.status }
}
export async function isReservedArticleSlug(slug) {
  return (await resolveReservedArticleSlug(slug)).reserved
}

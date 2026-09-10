import { getOptionalRequestContext } from '@cloudflare/next-on-pages'
import { readContentCatalog } from './contentCatalogRuntime'

// Historical published articles only. New content is served from article_posts.
// Use this deployment's ASSETS binding, never a production-origin fetch from previews.
export async function getArchivedArticle(slug, catalog = null) {
  const { articles } = catalog || await readContentCatalog()
  if (!articles.some((article) => article.slug === slug)) return null
  const pathname = `/data/article-archive/${encodeURIComponent(slug)}.json`
  const assets = getOptionalRequestContext()?.env?.ASSETS
  const response = assets
    ? await assets.fetch(new Request(`https://2aran.com${pathname}`))
    : await fetch(new URL(pathname, process.env.CONTENT_ASSET_ORIGIN || 'http://127.0.0.1:3000'), { cache: 'no-store' })
  if (!response.ok) throw new Error(`Article archive unavailable: ${slug}`)
  const article = await response.json()
  if (article?.slug !== slug || !article.title) throw new Error(`Invalid article archive: ${slug}`)
  return article
}

import { readContentAsset } from '../content/contentCatalogRuntime'

// Historical article bodies live in public/data/article-archive/. Read them at
// runtime so the manuscripts are not inlined into the public Worker.
export async function readArchivedArticle(slug) {
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  try {
    const article = await readContentAsset(`/data/article-archive/${slug}.json`)
    if (!article || article.slug !== slug) return null
    return article
  } catch {
    return null
  }
}

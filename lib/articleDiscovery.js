import { readContentCatalog } from './contentCatalogRuntime'
import { listPublishedArticlePosts } from './articlePosts'

// Match detail-page precedence. Never use the manual content index as proof of publication.
export function selectDiscoverablePosts(posts, staticArticles = [], redirects = {}, { includeStaticOverrides = false } = {}) {
  const reserved = new Set([
    'published',
    ...Object.keys(redirects),
    ...(includeStaticOverrides ? [] : ['diary-self-reflection']),
    ...(includeStaticOverrides ? [] : staticArticles.map((article) => article.slug)),
  ])
  return posts.filter((post) => {
    if (post.status !== 'published' || !/^[a-z0-9\u4e00-\u9fff]+(?:-[a-z0-9\u4e00-\u9fff]+)*$/.test(post.slug || '') || reserved.has(post.slug)) return false
    reserved.add(post.slug)
    return true
  })
}

export async function listDiscoverablePosts(options) {
  const [posts, catalog] = await Promise.all([
    listPublishedArticlePosts({ metadataOnly: true }), readContentCatalog(),
  ])
  return selectDiscoverablePosts(posts, catalog.articles, catalog.researchRedirects, options)
}

export function escapeDiscoveryXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char])
}

export function postDiscoveryUrl(post) {
  return `https://2aran.com/articles/${encodeURIComponent(post.slug)}`
}

export function postDiscoveryDate(post) {
  const value = post.publishedAt || post.updatedAt || post.createdAt
  const date = new Date(value)
  return value && Number.isFinite(date.getTime()) ? date : null
}

import { articles } from '../app/(site)/articles/articlesData'
import { RESEARCH_ARTICLE_REDIRECTS } from './research/catalog'
import { listPublishedArticlePosts } from './articlePosts'

// Match detail-page precedence. Never use the manual content index as proof of publication.
export function selectDiscoverablePosts(posts, staticArticles = articles, redirects = RESEARCH_ARTICLE_REDIRECTS) {
  const reserved = new Set(['diary-self-reflection', 'published', ...staticArticles.map((article) => article.slug), ...Object.keys(redirects)])
  return posts.filter((post) => {
    if (post.status !== 'published' || !/^[a-z0-9\u4e00-\u9fff]+(?:-[a-z0-9\u4e00-\u9fff]+)*$/.test(post.slug || '') || reserved.has(post.slug)) return false
    reserved.add(post.slug)
    return true
  })
}

export async function listDiscoverablePosts() {
  return selectDiscoverablePosts(await listPublishedArticlePosts({ metadataOnly: true }))
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

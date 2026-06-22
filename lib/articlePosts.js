import { getD1 } from './d1'

export const EMPTY_ARTICLE_DOC = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function rowToArticlePost(row) {
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug,
    title: row.title || '',
    summary: row.summary || '',
    coverUrl: row.cover_url || '',
    content: parseJson(row.content_json, EMPTY_ARTICLE_DOC),
    contentText: row.content_text || '',
    tags: parseJson(row.tags_json, []),
    status: row.status === 'published' ? 'published' : 'draft',
    revision: Number(row.revision) || 1,
    createdAt: Number(row.created_at) || 0,
    updatedAt: Number(row.updated_at) || 0,
    publishedAt: row.published_at == null ? null : Number(row.published_at),
  }
}

export function articlePostToKnowledgeItem(post) {
  const timestamp = post.publishedAt || post.updatedAt || post.createdAt
  const date = timestamp ? new Date(timestamp).toISOString().slice(0, 10) : ''
  return {
    id: `post-db:${post.id}`,
    kind: 'posts',
    tagLabel: '文章',
    title: post.title,
    summary: post.summary || post.contentText.slice(0, 160),
    date,
    sortKey: timestamp ? new Date(timestamp).toISOString().replace('Z', '') : '',
    href: `/articles/${post.slug}`,
    image: post.coverUrl ? { src: post.coverUrl, alt: `${post.title} 封面` } : null,
  }
}

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

export async function listPublishedArticlePosts() {
  const db = dbOrNull()
  if (!db) return []
  try {
    const result = await db
      .prepare(
        `SELECT * FROM article_posts
         WHERE status = 'published'
         ORDER BY published_at DESC, updated_at DESC`
      )
      .all()
    return (result?.results || []).map(rowToArticlePost)
  } catch {
    return []
  }
}

export async function getPublishedArticlePostBySlug(slug) {
  const db = dbOrNull()
  if (!db || !slug) return null
  try {
    const row = await db
      .prepare("SELECT * FROM article_posts WHERE slug = ? AND status = 'published' LIMIT 1")
      .bind(slug)
      .first()
    return rowToArticlePost(row)
  } catch {
    return null
  }
}

export function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

export function normalizeTags(value) {
  const source = Array.isArray(value) ? value : String(value || '').split(/[,，]/)
  return [...new Set(source.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 12)
}

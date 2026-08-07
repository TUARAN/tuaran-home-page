/**
 * 后台「内容管理」统一列表：构建期内容管线（全站前端内容）+ 在线文章 + 手工登记条目，
 * 归一成同一形状后做服务端筛选、排序、分页，避免客户端一次拉取全量。
 */

const TYPE_SET = new Set(['all', 'article', 'research', 'resource', 'feed'])
const STATUS_SET = new Set(['all', 'published', 'draft', 'retired'])

export function normalizeContentListParams(params = {}) {
  const query = String(params.q || '').trim().slice(0, 120)
  const type = TYPE_SET.has(params.type) ? params.type : 'all'
  const status = STATUS_SET.has(params.status) ? params.status : 'all'
  const parsedOffset = Number.parseInt(params.offset, 10)
  const parsedLimit = Number.parseInt(params.limit, 10)
  const offset = Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(100, parsedLimit)
    : 20
  return { query, type, status, offset, limit }
}

function dateToTimestamp(value) {
  if (!value) return 0
  const parsed = Date.parse(String(value))
  return Number.isNaN(parsed) ? 0 : parsed
}

/** 把三种来源合并成后台行形状（entity: article-post / content-index）。 */
export function mergeAdminContentItems({ buildEntries = [], posts = [], manualEntries = [] }) {
  const byKey = new Map()

  for (const entry of buildEntries) {
    const timestamp = dateToTimestamp(entry.date)
    byKey.set(entry.contentKey, {
      key: `content-index:${entry.contentKey}`,
      entity: 'content-index',
      contentKey: entry.contentKey,
      type: entry.type || 'resource',
      source: 'sync',
      title: entry.title || entry.contentKey,
      href: entry.href || '',
      status: 'published',
      date: entry.date || '',
      updatedAt: timestamp,
    })
  }

  for (const post of posts) {
    const contentKey = `article:${post.slug}`
    byKey.set(contentKey, {
      key: `article-post:${post.id}`,
      entity: 'article-post',
      contentKey,
      type: 'article',
      source: 'editor',
      title: post.title || '未命名草稿',
      href: `/articles/${post.slug}`,
      status: post.status === 'published' ? 'published' : 'draft',
      date: post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 10) : '',
      updatedAt: Number(post.updatedAt) || Number(post.createdAt) || 0,
      article: post,
    })
  }

  for (const entry of manualEntries) {
    const contentKey = entry.content_key || entry.contentKey
    if (!contentKey || byKey.has(contentKey)) continue
    byKey.set(contentKey, {
      key: `content-index:${contentKey}`,
      entity: 'content-index',
      contentKey,
      type: entry.content_type || entry.type || 'resource',
      source: 'manual',
      title: entry.title || contentKey,
      href: entry.href || '',
      status: entry.status || 'published',
      date: entry.date || '',
      updatedAt: Number(entry.updated_at) || dateToTimestamp(entry.date),
    })
  }

  return [...byKey.values()]
}

export function filterAdminContentItems(items, { query = '', type = 'all', status = 'all' } = {}) {
  const needle = query.toLowerCase()
  return items.filter((item) => {
    if (type !== 'all' && item.type !== type) return false
    if (status !== 'all' && item.status !== status) return false
    if (!needle) return true
    return `${item.title} ${item.contentKey} ${item.href} ${item.date}`.toLowerCase().includes(needle)
  })
}

export function paginateAdminContentItems(items, offset, limit) {
  return items.slice(offset, offset + limit)
}

export function countAdminContentItems(items) {
  return {
    all: items.length,
    published: items.filter((item) => item.status === 'published').length,
    draft: items.filter((item) => item.status === 'draft').length,
    retired: items.filter((item) => item.status === 'retired').length,
  }
}

export function sortAdminContentItems(items) {
  return [...items].sort((a, b) => {
    if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt
    return String(a.title).localeCompare(String(b.title), 'zh-CN')
  })
}

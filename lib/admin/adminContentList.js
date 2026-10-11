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
export function mergeAdminContentItems({ buildEntries = [], posts = [], manualEntries = [], researchDocuments = [] }) {
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

  for (const row of researchDocuments) {
    const entry = JSON.parse(row.metadata_json)
    byKey.set(row.content_key, {
      key: `research-document:${row.content_key}`, entity: 'research-document', contentKey: row.content_key,
      type: 'research', source: 'git', title: entry.title, href: `/articles/research/${entry.category}/${entry.slug}`,
      status: row.status, date: entry.date || '', updatedAt: Number(row.updated_at) || dateToTimestamp(entry.date),
      sourcePath: row.source_path || (entry.filename ? `research/${entry.category}/${entry.filename}` : ''),
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

function researchCategoryOf(item) {
  const key = String(item?.contentKey || '')
  if (key.startsWith('research:companies:')) return 'companies'
  if (key.startsWith('research:topics:')) return 'topics'
  if (key.startsWith('research:people:')) return 'people'
  return ''
}

export function countAdminContentItems(items) {
  const counts = {
    all: items.length,
    published: 0,
    draft: 0,
    retired: 0,
    article: 0,
    research: 0,
    resource: 0,
    feed: 0,
    richPage: 0,
    other: 0,
    historical: 0,
    editor: 0,
    editorPublished: 0,
    editorDraft: 0,
    researchPublished: 0,
    researchDraft: 0,
    researchCompanies: 0,
    researchTopics: 0,
    researchPeople: 0,
    manual: 0,
  }

  for (const item of items) {
    if (item.status === 'published' || item.status === 'draft' || item.status === 'retired') {
      counts[item.status] += 1
    }

    if (item.type === 'article' || item.type === 'research' || item.type === 'resource' || item.type === 'feed') {
      counts[item.type] += 1
    } else if (item.type === 'rich-page') {
      counts.richPage += 1
    } else {
      counts.other += 1
    }

    if (item.entity === 'article-post' || item.source === 'editor') {
      counts.editor += 1
      if (item.status === 'published') counts.editorPublished += 1
      else if (item.status === 'draft') counts.editorDraft += 1
      continue
    }

    if (item.type === 'research') {
      const category = researchCategoryOf(item)
      if (category === 'companies') counts.researchCompanies += 1
      else if (category === 'topics') counts.researchTopics += 1
      else if (category === 'people') counts.researchPeople += 1
      if (item.status === 'published') counts.researchPublished += 1
      else if (item.status === 'draft') counts.researchDraft += 1
      continue
    }

    if (item.source === 'sync' && item.type === 'article') {
      counts.historical += 1
      continue
    }

    if (item.source === 'manual') counts.manual += 1
  }

  return counts
}

export function sortAdminContentItems(items) {
  return [...items].sort((a, b) => {
    if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt
    return String(a.title).localeCompare(String(b.title), 'zh-CN')
  })
}

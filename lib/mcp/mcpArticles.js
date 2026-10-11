const SITE_URL = 'https://2aran.com'

export const MCP_PROTOCOL_VERSION = '2025-11-25'
export const MCP_SUPPORTED_PROTOCOL_VERSIONS = new Set([
  '2025-11-25',
  '2025-06-18',
  '2025-03-26',
])

const ARTICLE_OUTPUT_PROPERTIES = {
  id: { type: 'string' },
  type: { type: 'string', enum: ['article', 'research', 'resource'] },
  title: { type: 'string' },
  summary: { type: 'string' },
  tags: { type: 'array', items: { type: 'string' } },
  url: { type: 'string', format: 'uri' },
  publishedAt: { type: 'string' },
}

const ARTICLE_LIST_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    count: { type: 'integer' },
    articles: {
      type: 'array',
      items: {
        type: 'object',
        properties: ARTICLE_OUTPUT_PROPERTIES,
        required: ['id', 'type', 'title', 'summary', 'tags', 'url', 'publishedAt'],
        additionalProperties: false,
      },
    },
  },
  required: ['count', 'articles'],
  additionalProperties: false,
}

const TYPE_SCHEMA = {
  type: 'string',
  enum: ['all', 'article', 'research', 'resource'],
  default: 'all',
  description: '类型；all 表示文章、调研和资源。',
}

export const ARTICLE_MCP_TOOLS = [
  {
    name: 'get_recent_articles',
    title: '查询最近更新的文章',
    description: '按发布日期倒序查询涂阿燃最近公开更新的文章、专题调研和资源。适合回答“最近写了什么”“最近更新了哪些内容”。',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 10, description: '返回条数，默认 10，最多 20。' },
        type: TYPE_SCHEMA,
        since: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: '可选，只返回该日期（YYYY-MM-DD）及之后的内容。' },
        tag: { type: 'string', maxLength: 60, description: '可选，按标签筛选（不区分大小写）。' },
      },
      additionalProperties: false,
    },
    outputSchema: ARTICLE_LIST_OUTPUT_SCHEMA,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: 'search_articles',
    title: '搜索公开文章',
    description: '在涂阿燃的公开文章标题、摘要和标签中搜索相关内容，结果按发布日期倒序返回。',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', minLength: 1, maxLength: 100, description: '搜索关键词。' },
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 10, description: '返回条数，默认 10，最多 20。' },
        type: TYPE_SCHEMA,
      },
      required: ['query'],
      additionalProperties: false,
    },
    outputSchema: ARTICLE_LIST_OUTPUT_SCHEMA,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
]

function normalizedType(entry) {
  if (entry?.type === 'research') return 'research'
  if (entry?.type === 'resource') return 'resource'
  if (entry?.type === 'article') return 'article'
  return ''
}

function absoluteUrl(href) {
  try {
    return new URL(String(href || ''), SITE_URL).toString()
  } catch {
    return ''
  }
}

function publicArticles(entries) {
  const seen = new Set()
  return (Array.isArray(entries) ? entries : [])
    .map((entry) => {
      const type = normalizedType(entry)
      const url = absoluteUrl(entry?.href)
      if (!type || !url || !entry?.title) return null
      return {
        id: String(entry.contentKey || `${type}:${entry.slug || entry.href}`),
        type,
        title: String(entry.title).trim().slice(0, 300),
        summary: String(entry.summary || '').trim().slice(0, 1200),
        tags: Array.isArray(entry.tags)
          ? entry.tags.map((tag) => String(tag || '').trim()).filter(Boolean).slice(0, 20)
          : [],
        url,
        publishedAt: /^\d{4}-\d{2}-\d{2}$/.test(String(entry.date || '')) ? String(entry.date) : '',
      }
    })
    .filter((entry) => {
      if (!entry || seen.has(entry.url)) return false
      seen.add(entry.url)
      return true
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title, 'zh-CN'))
}

function normalizeLimit(value) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return 10
  return Math.min(20, Math.max(1, parsed))
}

function filterByType(items, type) {
  const normalized = ['article', 'research', 'resource'].includes(type) ? type : 'all'
  return normalized === 'all' ? items : items.filter((item) => item.type === normalized)
}

function resultPayload(articles) {
  const structuredContent = { count: articles.length, articles }
  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
  }
}

function toolError(message) {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  }
}

export function callArticleMcpTool(name, args, entries) {
  const input = args && typeof args === 'object' && !Array.isArray(args) ? args : {}
  const all = filterByType(publicArticles(entries), input.type)
  const limit = normalizeLimit(input.limit)

  if (name === 'get_recent_articles') {
    const since = input.since == null ? '' : String(input.since).trim()
    if (since && !/^\d{4}-\d{2}-\d{2}$/.test(since)) {
      return toolError('since 必须使用 YYYY-MM-DD 格式。')
    }
    const tag = String(input.tag || '').trim().toLocaleLowerCase('zh-CN')
    const articles = all
      .filter((item) => !since || item.publishedAt >= since)
      .filter((item) => !tag || item.tags.some((value) => value.toLocaleLowerCase('zh-CN').includes(tag)))
      .slice(0, limit)
    return resultPayload(articles)
  }

  if (name === 'search_articles') {
    const query = String(input.query || '').trim().toLocaleLowerCase('zh-CN')
    if (!query || query.length > 100) return toolError('query 不能为空，且最多 100 个字符。')
    const articles = all
      .filter((item) => [item.title, item.summary, ...item.tags].join('\n').toLocaleLowerCase('zh-CN').includes(query))
      .slice(0, limit)
    return resultPayload(articles)
  }

  return null
}

export function mcpInitializeResult(requestedVersion) {
  const protocolVersion = MCP_SUPPORTED_PROTOCOL_VERSIONS.has(requestedVersion)
    ? requestedVersion
    : MCP_PROTOCOL_VERSION
  return {
    protocolVersion,
    capabilities: { tools: {} },
    serverInfo: {
      name: 'tuaran-articles',
      title: '涂阿燃文章 MCP',
      version: '1.0.0',
      description: '查询 2aran.com 最近更新的公开文章、专题调研和资源。',
      websiteUrl: `${SITE_URL}/mcp-center`,
    },
    instructions: '当用户询问涂阿燃最近写了什么或某个主题的文章时，优先调用 get_recent_articles 或 search_articles。只引用工具返回的公开链接。',
  }
}

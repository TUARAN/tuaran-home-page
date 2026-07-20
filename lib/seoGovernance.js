import { RICH_PAGE_SEO } from './richPageSeo'
import { articles } from '../app/(site)/articles/articlesData'
import { HOME_RESOURCE_ITEMS } from './homeResourceItems'
import { RESEARCH_ENTRY_META } from './research/catalog'
import { CATEGORY_META } from './research/categories'

export const SEO_STRATEGY_LAYERS = [
  {
    id: 'global-baseline',
    name: '全站基线',
    scope: '站点品牌、标题模板、作者、默认描述、搜索引擎验证与默认 robots。',
    source: 'app/layout.jsx',
    status: 'stable',
    owner: '平台层',
    rules: ['metadataBase 固定为 canonical 主域', '页面 title 进入统一站点标题模板', '默认允许索引，私域与后台显式覆盖'],
  },
  {
    id: 'discovery',
    name: '发现与抓取',
    scope: 'robots.txt、sitemap.xml、RSS 与 llms.txt，负责搜索引擎和 AI 检索入口。',
    source: 'app/robots.js · app/(site)/sitemap.js · rss.xml · llms.txt',
    status: 'stable',
    owner: '平台层',
    rules: ['Sitemap 只写真实内容日期', 'noindex 页面不得进入 Sitemap', '静态页未知更新时间时省略 lastmod'],
  },
  {
    id: 'rich-pages',
    name: '多维页面',
    scope: '交互专题、数据图谱、工程调研和长期项目。',
    source: 'lib/engineeringWorks.js · lib/richPageSeo.js',
    status: 'standardized',
    owner: '多维页面注册表',
    rules: ['目录信息与 SEO 覆盖项分层管理', 'Metadata 与 JSON-LD 由工厂生成', 'Sitemap 从同一注册表读取日期'],
  },
  {
    id: 'articles',
    name: '文章与动态内容',
    scope: '构建期文章、数据库发布文章及文章详情页。',
    source: 'app/(site)/articles/[slug]/page.jsx · PublishedArticle.jsx',
    status: 'established',
    owner: '文章内容源',
    rules: ['按内容生成 canonical 与分享卡片', '输出 Article JSON-LD', '发布时间和修改时间来自内容数据'],
  },
  {
    id: 'research',
    name: '研究目录',
    scope: 'topics、companies、people 三类研究内容。',
    source: 'lib/research/catalog.js · articles/research/[category]/[slug]',
    status: 'established',
    owner: '研究目录',
    rules: ['按目录生成静态路径', '输出 Article 与 Breadcrumb JSON-LD', '加密研究不进入 Sitemap'],
  },
  {
    id: 'static-pages',
    name: '普通静态页面',
    scope: '关于、服务、工具、资源、人物及其他独立页面。',
    source: '各 route/page.jsx',
    status: 'fragmented',
    owner: '各页面',
    rules: ['当前由页面各自声明 metadata', 'canonical、OG 与 JSON-LD 覆盖度尚未统一审计'],
  },
  {
    id: 'private-admin',
    name: '后台与私域',
    scope: 'Admin、登录、授权、账户与仅 owner 可访问页面。',
    source: 'app/(admin) · 私域页面 metadata',
    status: 'guarded',
    owner: '权限层',
    rules: ['后台页面统一 noindex/nofollow', '私域 URL 不进入 Sitemap', '不为受保护内容输出可索引摘要'],
  },
  {
    id: 'measurement',
    name: '搜索效果衡量',
    scope: '收录、查询词、曝光、点击、CTR、排名与富结果错误。',
    source: '待接入 Google Search Console / Bing Webmaster Tools',
    status: 'planned',
    owner: 'SEO 管理台',
    rules: ['流量分析与搜索效果分开衡量', '以后按 URL 与内容类型回写决策，不直接自动改标题'],
  },
]

export const SEO_GOVERNANCE_RULES = [
  {
    action: '新增公开页面',
    steps: ['确定唯一 canonical', '填写标题与摘要', '选择 schema 类型', '确认索引策略', '登记真实发布日期', '验证 OG 与 Sitemap'],
  },
  {
    action: '更新已有页面',
    steps: ['内容发生实质变化才更新 modified date', '保留 canonical', '同步 Metadata 与 JSON-LD', '检查分享图与摘要是否仍准确'],
  },
  {
    action: '迁移或改路径',
    steps: ['设置永久重定向', 'canonical 指向新路径', 'Sitemap 删除旧 URL', '修复站内链接', '观察索引迁移'],
  },
  {
    action: '下线或转私域',
    steps: ['从注册表和 Sitemap 移除', '设置 noindex', '决定 301、410 或权限门', '避免继续输出公开结构化数据'],
  },
]

export const SEO_EVOLUTION_ROADMAP = [
  {
    phase: '现在',
    status: 'done',
    title: '建立可治理的 SEO 基础层',
    items: ['多维页面统一注册表', 'Metadata / JSON-LD 工厂', '稳定 Sitemap 时间语义', '后台策略与覆盖视图'],
  },
  {
    phase: '下一步',
    status: 'next',
    title: '把“看得见”升级为“自动发现问题”',
    items: ['新增全路由 SEO 审计脚本并接入 CI', '扫描 canonical / noindex / JSON-LD / OG 缺失与冲突', '为普通静态页面建立统一注册表', '建立变更前后快照'],
  },
  {
    phase: '随后',
    status: 'planned',
    title: '接入搜索平台数据形成反馈闭环',
    items: ['接入 Google Search Console 与 Bing 数据', '按页面类型观察曝光、点击、CTR 与排名', '识别高曝光低点击和索引异常页面', '把优化建议变成待审核任务'],
  },
  {
    phase: '长期',
    status: 'planned',
    title: '安全的可视化编辑与发布治理',
    items: ['草稿、预览、审批、发布与回滚', '标题和摘要版本实验', 'Schema 模板版本化', 'SEO 与 GEO / AI 引用效果共同评估'],
  },
]

function articleHref(article) {
  return article.slug === 'diary-self-reflection' ? '/diary' : `/articles/${article.slug}`
}

function richPageEntries() {
  return Object.values(RICH_PAGE_SEO).map((page) => ({
    id: `rich-page:${page.id}`,
    contentType: 'rich-page',
    typeLabel: '多维页面',
    title: page.metadataTitle,
    href: page.canonical,
    date: page.modifiedDate || '',
    schemaType: page.schemaType,
    indexable: page.robots?.index !== false,
    metadataReady: Boolean(page.metadataTitle && page.description && page.canonical),
    jsonLdReady: Boolean(page.schemaType && page.publishedTime && page.modifiedTime),
    hasImage: Boolean(page.image),
    imageLabel: page.image ? '专属 OG' : '默认图',
    hasKeywords: Boolean(page.keywords?.length),
    category: page.category,
  }))
}

function staticArticleEntries() {
  return articles.map((article) => ({
    id: `article:${article.slug}`,
    contentType: 'article',
    typeLabel: '精选文章',
    title: article.title,
    href: articleHref(article),
    date: article.date || '',
    schemaType: 'Article',
    indexable: true,
    metadataReady: Boolean(article.title && article.summary && article.slug),
    jsonLdReady: Boolean(article.title && article.summary && article.date),
    hasImage: Boolean(article.cover),
    imageLabel: article.cover ? '专属 OG' : '默认图',
    hasKeywords: true,
    category: article.homeCategory || '文章',
  }))
}

function databaseArticleEntries(posts) {
  return (posts || []).map((post) => ({
    id: `article-db:${post.id}`,
    contentType: 'article',
    typeLabel: '精选文章',
    title: post.title,
    href: `/articles/${post.slug}`,
    date: post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 10) : '',
    schemaType: 'Article',
    indexable: true,
    metadataReady: Boolean(post.title && (post.summary || post.contentText) && post.slug),
    jsonLdReady: Boolean(post.title && post.slug),
    hasImage: Boolean(post.coverUrl),
    imageLabel: post.coverUrl ? '专属 OG' : '默认图',
    hasKeywords: Boolean(post.tags?.length),
    category: '数据库文章',
  }))
}

function researchEntries() {
  return Object.values(RESEARCH_ENTRY_META).map((entry) => ({
    id: `research:${entry.category}:${entry.slug}`,
    contentType: 'research',
    typeLabel: '分析',
    title: entry.title,
    href: `/articles/research/${entry.category}/${entry.slug}`,
    date: entry.updated || entry.date || '',
    schemaType: 'TechArticle',
    indexable: !entry.encrypted,
    metadataReady: Boolean(entry.title && (entry.summary || entry.title) && entry.slug),
    jsonLdReady: Boolean(entry.title && entry.date),
    hasImage: true,
    imageLabel: '动态 OG',
    hasKeywords: Boolean(entry.tags?.length),
    category: CATEGORY_META[entry.category]?.label || entry.category,
  }))
}

function resourceEntries() {
  return HOME_RESOURCE_ITEMS.map((entry) => ({
    id: `resource:${entry.href}`,
    contentType: 'resource',
    typeLabel: '资源',
    title: entry.title,
    href: entry.href,
    date: entry.date || '',
    schemaType: 'WebPage',
    indexable: true,
    metadataReady: Boolean(entry.title && entry.summary && entry.href),
    // 资源页目前由各 route 自行实现；在统一审计完成前不把它们误报为已有 JSON-LD。
    jsonLdReady: false,
    hasImage: false,
    imageLabel: '默认图',
    hasKeywords: false,
    category: entry.tagLabel || '资源',
  }))
}

export function getSeoGovernanceSnapshot({ publishedArticles = [] } = {}) {
  const staticArticles = staticArticleEntries()
  const staticArticleHrefs = new Set(staticArticles.map((page) => page.href))
  const pages = [
    ...richPageEntries(),
    ...staticArticles,
    ...databaseArticleEntries(publishedArticles).filter((page) => !staticArticleHrefs.has(page.href)),
    ...researchEntries(),
    ...resourceEntries(),
  ]
  const indexablePages = pages.filter((page) => page.indexable !== false)
  const metadataReady = pages.filter((page) => page.metadataReady)
  const jsonLdReady = pages.filter((page) => page.jsonLdReady)
  const withImages = pages.filter((page) => page.hasImage)
  const withKeywords = pages.filter((page) => page.hasKeywords)
  const canonicalCount = new Set(pages.map((page) => page.href)).size
  const byType = Object.fromEntries(
    ['rich-page', 'article', 'research', 'resource'].map((type) => [
      type,
      pages.filter((page) => page.contentType === type).length,
    ]),
  )

  return {
    totals: {
      pages: pages.length,
      richPages: byType['rich-page'],
      articles: byType.article,
      research: byType.research,
      resources: byType.resource,
      indexable: indexablePages.length,
      noindex: pages.length - indexablePages.length,
      metadataReady: metadataReady.length,
      jsonLdReady: jsonLdReady.length,
      withImages: withImages.length,
      withKeywords: withKeywords.length,
      canonicalUnique: canonicalCount === pages.length,
    },
    pages: pages
      .map((page) => ({ ...page, indexable: page.indexable !== false }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.title.localeCompare(b.title, 'zh-CN')),
  }
}

import { researchKnowledgeItem } from '../../../lib/researchKnowledgeItem'
import { articles } from '../../../lib/articleMetadata'
import {
  ENGINEERING_WORK_CATEGORIES,
  ENGINEERING_WORKS,
  getRichPagePvKey,
} from '../../../lib/engineeringWorks'
import { HOME_RESOURCE_ITEMS } from '../../../lib/homeResourceItems'
import { CONTENT_PV_ENTRIES } from '../../../lib/contentRegistry'
import {
  assertCompleteContentTaxonomy,
  taxonomyForArticle,
  taxonomyForInteractive,
  taxonomyForResource,
} from '../../../lib/contentTaxonomy'
import { compareSortKeyDesc, researchSortKey } from '../../../lib/research/datetime'
import { isAdsenseReviewPath } from '../../../lib/adsenseReviewPolicy'
import { isAShareResearchEntry } from '../../../lib/research/shareTitle'

// 资源页 href → 阅读统计 key（仅登记进 contentRegistry 的资源才有阅读量）
const RESOURCE_PV_KEY_BY_HREF = new Map(
  CONTENT_PV_ENTRIES.map((e) => [e.href, `${e.category}/${e.slug}`]),
)
import { listResearch } from '../../../lib/research/archive'

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function getArticleCategory(article) {
  if (article.homeCategory) return article.homeCategory
  if (article.slug === 'ocr-comparison-paddleocr-vl') return 'AI'
  if (article.slug === 'content-os-blogger-matrix-alliance') return '创作'
  if (article.slug === 'blogger-future-community') return '社区'
  if (article.slug === 'diary-self-reflection') return '随笔'
  return '工程化'
}

export function buildKnowledgeItems({ includeOwner = false } = {}) {
  const fixedSeriesItems = [
    {
      id: 'series:frontend_weekly',
      kind: 'resources',
      tagLabel: '固定系列',
      contentKind: 'resource',
      subjects: ['ai_dev'],
      entityType: '',
      delivery: 'subscribe',
      series: 'frontend_weekly',
      title: '前端周看',
      summary: '前端、AI Agent 与大模型工程情报，包含周刊、每日精选和持续更新。',
      date: '',
      sortKey: '',
      href: '/frontend-weekly',
    },
    {
      id: 'series:a_share_research',
      kind: 'companies',
      tagLabel: '固定系列',
      contentKind: 'analysis',
      subjects: ['business_market'],
      entityType: '',
      delivery: 'read',
      series: 'a_share_research',
      title: 'A股调研',
      summary: '每天观察一家 A 股上市公司，关注业务、财务、治理、估值与风险。',
      date: '',
      sortKey: '',
      href: '/a-share-research',
    },
    {
      id: 'series:crypto_research',
      kind: 'topics',
      tagLabel: '固定系列',
      contentKind: 'analysis',
      subjects: ['business_market'],
      entityType: '',
      delivery: 'read',
      series: 'crypto_research',
      title: '加密调研',
      summary: '按市值每天观察一个加密资产，关注背景、技术、代币经济、治理、安全与监管。',
      date: '',
      sortKey: '',
      href: '/crypto-research',
    },
  ]

  const postItems = articles.map((article) => {
    const path = article.slug === 'diary-self-reflection' ? '/diary' : `/articles/${article.slug}`
    const columnCategory = getArticleCategory(article)
    const href = isExternalHref(article.href) ? article.href : path
    return {
      id: `post:${article.slug || article.href || article.title}`,
      kind: 'posts',
      tagLabel: '文章',
      columnCategory,
      columnCategoryLabel: columnCategory,
      ...taxonomyForArticle({
        category: columnCategory,
        slug: article.slug,
        href,
        title: article.title,
      }),
      title: article.title,
      summary: article.summary,
      date: article.date || '',
      sortKey: researchSortKey(article.date),
      href,
      reviewReady: !isExternalHref(article.href) && isAdsenseReviewPath(path),
      ...(!isExternalHref(article.href) ? { pvKey: `article/${article.slug}`, pv: null } : {}),
    }
  })

  const researchItems = listResearch().filter((entry) => !entry.encrypted && !isAShareResearchEntry(entry)).map(researchKnowledgeItem)

  const resourceItems = HOME_RESOURCE_ITEMS.map((p) => {
    const pvKey = RESOURCE_PV_KEY_BY_HREF.get(p.href) || ''
    return {
      id: `resource:${p.resourceType}:${p.href}`,
      kind: 'resources',
      tagLabel: p.tagLabel || '资源库',
      resourceType: p.resourceType || 'other',
      ...taxonomyForResource(p),
      title: p.title,
      summary: p.summary,
      date: p.date,
      sortKey: researchSortKey(p.date),
      href: p.href,
      // 登记过阅读统计的资源才挂 pv，列表才会显示阅读量
      ...(pvKey ? { pvKey, pv: null } : {}),
    }
  })

  const worksItems = ENGINEERING_WORKS
    .filter((p) => includeOwner || p.audience !== 'owner')
    .map((p) => ({
    id: `work:${p.href}`,
    kind: 'works',
    tagLabel: p.kind ? `互动专题 · ${p.kind}` : '互动专题',
    columnCategory: p.category || 'uncategorized',
    columnCategoryLabel:
      ENGINEERING_WORK_CATEGORIES.find((category) => category.id === p.category)?.title || '未分类',
    columnCategoryOrder: ENGINEERING_WORK_CATEGORIES.findIndex((category) => category.id === p.category),
    ...taxonomyForInteractive(p),
    title: p.title,
    summary: p.summary,
    date: p.date,
    sortKey: researchSortKey(p.date),
    href: p.href,
    reviewReady: isAdsenseReviewPath(p.href),
    pvKey: getRichPagePvKey(p),
    pv: null,
    canvasId: p.canvasId || null,
    audience: p.audience || 'public',
  }))

  const items = [
    ...fixedSeriesItems,
    ...postItems,
    ...worksItems,
    ...researchItems,
    ...resourceItems,
  ].sort((a, b) => compareSortKeyDesc(a.sortKey, b.sortKey, a.id, b.id))

  return assertCompleteContentTaxonomy(items)
}

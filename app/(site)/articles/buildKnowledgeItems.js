import { articles } from './articlesData'
import { ENGINEERING_WORKS } from '../../../lib/engineeringWorks'
import { HOME_RESOURCE_ITEMS } from '../../../lib/homeResourceItems'
import { compareSortKeyDesc, researchSortKey } from '../../../lib/research/datetime'
import {
  CATEGORY_META,
  COMPANY_TYPE_META,
  PEOPLE_TYPE_META,
  TOPIC_TYPE_META,
  listResearch,
} from '../../../lib/research/loader'

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

export function buildKnowledgeItems() {
  const postItems = articles.map((article) => {
    const path = article.slug === 'diary-self-reflection' ? '/diary' : `/articles/${article.slug}`
    return {
      id: `post:${article.slug || article.href || article.title}`,
      kind: 'posts',
      tagLabel: '文章',
      title: article.title,
      summary: article.summary,
      date: article.date || '',
      sortKey: researchSortKey(article.date),
      href: isExternalHref(article.href) ? article.href : path,
    }
  })

  const researchItems = listResearch().map((entry) => {
    const baseLabel = CATEGORY_META[entry.category]?.label || entry.category
    const companyLabel = entry.companyType && COMPANY_TYPE_META[entry.companyType]?.label
    const topicLabel = entry.topicType && TOPIC_TYPE_META[entry.topicType]?.label
    const peopleLabel = entry.peopleType && PEOPLE_TYPE_META[entry.peopleType]?.label
    const subLabel = companyLabel || topicLabel || peopleLabel
    return {
      id: `research:${entry.category}:${entry.slug}`,
      kind: entry.category, // 'companies' | 'topics' | 'people'
      tagLabel: subLabel ? `${baseLabel} · ${subLabel}` : baseLabel,
      companyType: entry.companyType || '',
      topicType: entry.topicType || '',
      peopleType: entry.peopleType || '',
      version: entry.version || '',
      title: entry.title,
      summary: entry.tldr || entry.summary,
      date: entry.date,
      dateLabel: entry.dateLabel || entry.date,
      sortKey: entry.sortKey,
      readingMinutes: entry.readingMinutes,
      pv: entry.pv || 0,
      encrypted: entry.encrypted,
      image: entry.images?.[0] || null,
      href: `/articles/research/${entry.category}/${entry.slug}`,
    }
  })

  const resourceItems = HOME_RESOURCE_ITEMS.map((p) => ({
    id: `resource:${p.resourceType}:${p.href}`,
    kind: 'resources',
    tagLabel: p.tagLabel || '资料库',
    resourceType: p.resourceType || 'other',
    title: p.title,
    summary: p.summary,
    date: p.date,
    sortKey: researchSortKey(p.date),
    href: p.href,
  }))

  const worksItems = ENGINEERING_WORKS.map((p) => ({
    id: `work:${p.href}`,
    kind: 'works',
    tagLabel: p.kind ? `多维页面 · ${p.kind}` : '多维页面',
    title: p.title,
    summary: p.summary,
    date: p.date,
    sortKey: researchSortKey(p.date),
    href: p.href,
    canvasId: p.canvasId || null,
  }))

  return [
    ...postItems,
    ...worksItems,
    ...researchItems,
    ...resourceItems,
  ].sort((a, b) => compareSortKeyDesc(a.sortKey, b.sortKey, a.id, b.id))
}

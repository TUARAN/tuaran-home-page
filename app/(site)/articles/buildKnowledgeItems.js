import { articles } from './articlesData'
import { ENGINEERING_WORKS } from '../../../lib/engineeringWorks'
import { CATEGORY_META, COMPANY_TYPE_META, TOPIC_TYPE_META, listResearch } from '../../../lib/research/loader'

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

// 资料层（80% 输入层）：站内资料 + 资源收藏。低个人表达，强检索与复用。
const RESOURCE_ITEMS = [
  {
    title: '单篇封神的中国古典名篇',
    summary: '辞赋、唐诗宋词、政论奏疏、古文散文、祭文书信 —— 古典文学高密度原文索引，可检索、可引用。',
    date: '2026-05-20',
    href: '/classical-masterpieces',
    resourceType: 'classics',
    tagLabel: '资料库 · 古典名篇',
  },
  {
    title: '儒释道 · 神仙体系',
    summary: '佛教五层果位、道教十级神格、儒家文庙道统 —— 三教神仙体系结构图。',
    date: '2026-05-21',
    href: '/ru-shi-dao',
    resourceType: 'humanities',
    tagLabel: '资料库 · 人文思想',
  },
  {
    title: '中国政治体制',
    summary: '中央与国务院组织结构、历届三中全会、领导层沿革（1971–至今）。',
    date: '2026-05-21',
    href: '/china-politics',
    resourceType: 'politics',
    tagLabel: '资料库 · 政经资料',
  },
  {
    title: '历史资料：明清与三国',
    summary: '以时间线梳理三国、明清 —— 曹操、朱元璋、朱棣、嘉靖、张居正、万历、康熙、雍正的制度、权力与人物命运。',
    date: '2026-05-20',
    href: '/history/ming-qing',
    resourceType: 'humanities',
    tagLabel: '资料库 · 人文思想',
  },
  {
    title: '书目索引',
    summary: '正在读、想读、读书笔记和待写书单统一沉淀，作为长期输入与选题来源。',
    date: '2026-05-20',
    href: '/reading',
    resourceType: 'books',
    tagLabel: '资料库 · 书目索引',
  },
  {
    title: '资源收藏',
    summary: 'AI 工具、开发资源、LLM 教程、Twitter / YouTube 收藏与外部材料入口。',
    date: '2026-05-20',
    href: '/bookmarks',
    resourceType: 'bookmarks',
    tagLabel: '资料库 · 资源收藏',
  },
]

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
      href: isExternalHref(article.href) ? article.href : path,
    }
  })

  const researchItems = listResearch().map((entry) => {
    const baseLabel = CATEGORY_META[entry.category]?.label || entry.category
    const companyLabel = entry.companyType && COMPANY_TYPE_META[entry.companyType]?.label
    const topicLabel = entry.topicType && TOPIC_TYPE_META[entry.topicType]?.label
    const subLabel = companyLabel || topicLabel
    return {
      id: `research:${entry.category}:${entry.slug}`,
      kind: entry.category, // 'companies' | 'topics' | 'people'
      tagLabel: subLabel ? `${baseLabel} · ${subLabel}` : baseLabel,
      companyType: entry.companyType || '',
      topicType: entry.topicType || '',
      version: entry.version || '',
      title: entry.title,
      summary: entry.tldr || entry.summary,
      date: entry.date,
      readingMinutes: entry.readingMinutes,
      pv: entry.pv || 0,
      encrypted: entry.encrypted,
      image: entry.images?.[0] || null,
      href: `/articles/research/${entry.category}/${entry.slug}`,
    }
  })

  const resourceItems = RESOURCE_ITEMS.map((p) => ({
    id: `resource:${p.resourceType}:${p.href}`,
    kind: 'resources',
    tagLabel: p.tagLabel || '资料库',
    resourceType: p.resourceType || 'other',
    title: p.title,
    summary: p.summary,
    date: p.date,
    href: p.href,
  }))

  const worksItems = ENGINEERING_WORKS.map((p) => ({
    id: `work:${p.href}`,
    kind: 'works',
    tagLabel: p.kind ? `工程作品 · ${p.kind}` : '工程作品',
    title: p.title,
    summary: p.summary,
    date: p.date,
    href: p.href,
  }))

  return [
    ...postItems,
    ...worksItems,
    ...researchItems,
    ...resourceItems,
  ].sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  })
}

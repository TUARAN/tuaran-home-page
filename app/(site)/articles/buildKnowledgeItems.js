import { articles } from './articlesData'
import { CATEGORY_META, COMPANY_TYPE_META, TOPIC_TYPE_META, listResearch } from '../../../lib/research/loader'

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

// 资料层（80% 输入层）：站内资料 + 资源收藏。低个人表达，强检索与复用。
const RESOURCE_ITEMS = [
  {
    title: '单篇封神的中国古典名篇',
    summary: '辞赋、诗歌、政论奏疏、古文散文、祭文书信杂文体的古典文学资料索引，并整合诗词巅峰原文库。',
    date: '2026-05-20',
    href: '/classical-masterpieces',
    resourceType: 'classics',
    tagLabel: '资料库 · 古典名篇',
  },
  {
    title: '诗歌原文索引',
    summary: '唐诗、宋词、辞赋、祭文与古文中的高密度原文材料，作为可检索、可引用的文本底座。',
    date: '2026-05-20',
    href: '/classical-masterpieces',
    resourceType: 'poetry',
    tagLabel: '资料库 · 诗歌原文',
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
    title: '苏轼',
    summary: '以时间线梳理苏轼的仕途、流放、心境与作品 —— 一个在时代洪流里反复被贬却始终通透的样本。',
    date: '2026-05-20',
    href: '/people/su-shi',
    resourceType: 'humanities',
    tagLabel: '资料库 · 人文思想',
  },
  {
    title: '人工智能先驱',
    summary: '深度学习先驱群像：李飞飞、杨立昆、本吉奥、辛顿、苏茨克维、克里泽夫斯基的关键贡献与时间线。',
    date: '2026-05-20',
    href: '/people/ai-pioneers',
    resourceType: 'humanities',
    tagLabel: '资料库 · 人文思想',
  },
  {
    title: '埃隆·马斯克（Elon Musk）',
    summary: '工程、产品、组织、叙事——以第一性原理 + 工程迭代 + 资本市场叙事驱动的超级企业家样本。',
    date: '2024-09-01',
    href: '/people/elon-musk',
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

// 工程作品（5% 原创层）：自研可视化、亲身实测、长期写作项目。富页面背后是不可被 AI 替代的工程量/原创判断。
const ENGINEERING_WORKS = [
  {
    title: '日月运行交互可视化',
    summary:
      '用日心视角探索太阳中心、地球公转与自转、月球绕地运行与月相变化；把日出日落、昼夜分界和月相循环放在一个可交互模型里复盘。',
    date: '2026-05-31',
    href: '/sun-moon-motion',
    tagLabel: '工程作品 · 可视化',
  },
  {
    title: 'AI Token 用量与花费强度调研',
    summary:
      '日耗 1 亿 / 4.5 亿 tokens（账单口径，含缓存命中）对照：账单 vs 净处理双账户 + 对数刻度强度尺 + cache-aware 三段定价折算月费 + 订阅 vs 按量口径 + 效率信号 + 优化抓手 ROI 排序。',
    date: '2026-05-31',
    href: '/ai-token-usage-research',
    tagLabel: '工程作品 · 实测数据',
  },
  {
    title: '《张居正：一个改革者的成事与代价》· 写作出版工程',
    summary: '用输出倒逼输入：把"写一本张居正的书并发布出版"作为长期富页面项目运营。主线、目录、人物关系、关键事件、12 个月节奏与进度看板。',
    date: '2026-05-30',
    href: '/zhang-juzheng-book',
    tagLabel: '工程作品 · 长期项目',
  },
]

const WRITING_SPECIAL_TOPIC_SLUGS = new Set([
  'isbn-ban-hao-publishing-number-system',
  'edge-agent-dev-course',
])

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
    const isWritingSpecial = entry.category === 'topics' && WRITING_SPECIAL_TOPIC_SLUGS.has(entry.slug)
    return {
      id: `research:${entry.category}:${entry.slug}`,
      kind: isWritingSpecial ? 'special' : entry.category, // 'companies' | 'topics' | 'special'
      tagLabel: isWritingSpecial ? '专题调研 · 写作创作' : subLabel ? `${baseLabel} · ${subLabel}` : baseLabel,
      companyType: entry.companyType || '',
      topicType: entry.topicType || '',
      specialType: isWritingSpecial ? 'writing' : '',
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
    tagLabel: p.tagLabel || '工程作品',
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

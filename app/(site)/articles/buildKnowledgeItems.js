import { articles } from './articlesData'
import { CATEGORY_META, COMPANY_TYPE_META, TOPIC_TYPE_META, listResearch } from '../../../lib/research/loader'

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

// 人物调研：暂时硬编码（数量少），将来如 research/people/ 目录扩展可改为 loader 驱动
const PEOPLE_RESEARCH = [
  {
    title: '苏轼',
    summary: '以时间线梳理苏轼的仕途、流放、心境与作品 —— 一个在时代洪流里反复被贬却始终通透的样本。',
    date: '2026-05-20',
    href: '/people/su-shi',
  },
  {
    title: '人工智能先驱',
    summary: '深度学习先驱群像：李飞飞、杨立昆、本吉奥、辛顿、苏茨克维、克里泽夫斯基的关键贡献与时间线。',
    date: '2026-05-20',
    href: '/people/ai-pioneers',
  },
  {
    title: '埃隆·马斯克（Elon Musk）',
    summary: '工程、产品、组织、叙事——以第一性原理 + 工程迭代 + 资本市场叙事驱动的超级企业家样本。',
    date: '2024-09-01',
    href: '/people/elon-musk',
  },
]

// 历史调研：富页面形式（迁移自原读书·历史）
const HISTORY_RESEARCH = [
  {
    title: '历史调研：明清与三国',
    summary: '以时间线梳理三国、明清 —— 曹操、朱元璋、朱棣、嘉靖、张居正、万历、康熙、雍正的制度、权力与人物命运。',
    date: '2026-05-20',
    href: '/history/ming-qing',
  },
]

// 诗歌调研
const POETRY_RESEARCH = [
  {
    title: '单篇封神的中国古典名篇',
    summary: '辞赋、诗歌、政论奏疏、古文散文、祭文书信杂文体的古典文学专题，并整合诗词巅峰原文库。',
    date: '2026-05-20',
    href: '/classical-masterpieces',
  },
]

// 专题页：富媒体形式的事项调研，归入「事项调研」Tab
const TOPIC_PAGES = [
  {
    title: '日月运行交互可视化专题',
    summary:
      '用日心视角探索太阳中心、地球公转与自转、月球绕地运行与月相变化；把日出日落、昼夜分界和月相循环放在一个可交互模型里复盘。',
    date: '2026-05-31',
    href: '/sun-moon-motion',
    specialType: 'science',
    tagLabel: '专题 · 科学探索',
  },
  {
    title: 'AI Token 用量与花费强度调研',
    summary:
      '日耗 1 亿 / 4.5 亿 tokens（账单口径，含缓存命中）对照：账单 vs 净处理双账户 + 对数刻度强度尺 + cache-aware 三段定价折算月费 + 订阅 vs 按量口径 + 效率信号 + 优化抓手 ROI 排序。',
    date: '2026-05-31',
    href: '/ai-token-usage-research',
    specialType: 'ai',
  },
  {
    title: '《张居正：一个改革者的成事与代价》· 写作出版工程',
    summary: '用输出倒逼输入：把"写一本张居正的书并发布出版"作为长期专题项目运营。主线、目录、人物关系、关键事件、12 个月节奏与进度看板。',
    date: '2026-05-30',
    href: '/zhang-juzheng-book',
    specialType: 'writing',
  },
  // /writing-monetization-2026 仍可直接访问，但不在知识库卡片列表里露出
  {
    title: '儒释道 · 神仙体系',
    summary: '佛教五层果位、道教十级神格、儒家文庙道统 —— 三教神仙体系结构图。',
    date: '2026-05-21',
    href: '/ru-shi-dao',
    specialType: 'culture',
  },
  {
    title: '中国政治体制',
    summary: '中央与国务院组织结构、历届三中全会、领导层沿革（1971–至今）。',
    date: '2026-05-21',
    href: '/china-politics',
    specialType: 'politics',
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
      kind: isWritingSpecial ? 'special' : entry.category, // 'companies' | 'topics' | 'special'
      tagLabel: isWritingSpecial ? '专题 · 写作创作' : subLabel ? `${baseLabel} · ${subLabel}` : baseLabel,
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

  const peopleItems = PEOPLE_RESEARCH.map((p) => ({
    kind: 'special',
    specialType: 'people',
    tagLabel: '专题 · 人物调研',
    title: p.title,
    summary: p.summary,
    date: p.date,
    href: p.href,
  }))

  const historyItems = HISTORY_RESEARCH.map((p) => ({
    kind: 'special',
    specialType: 'history',
    tagLabel: '专题 · 历史调研',
    title: p.title,
    summary: p.summary,
    date: p.date,
    href: p.href,
  }))

  const poetryItems = POETRY_RESEARCH.map((p) => ({
    kind: 'special',
    specialType: 'poetry',
    tagLabel: '专题 · 诗歌调研',
    title: p.title,
    summary: p.summary,
    date: p.date,
    href: p.href,
  }))

  const topicPageItems = TOPIC_PAGES.map((p) => ({
    kind: 'special',
    tagLabel: p.tagLabel || '专题',
    specialType: p.specialType || 'other',
    title: p.title,
    summary: p.summary,
    date: p.date,
    href: p.href,
  }))

  return [
    ...postItems,
    ...researchItems,
    ...peopleItems,
    ...historyItems,
    ...poetryItems,
    ...topicPageItems,
  ].sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  })
}

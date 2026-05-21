import { Suspense } from 'react'

import { articles } from './articlesData'
import ArticlesIndexClient from './ArticlesIndexClient'
import { CATEGORY_META, TOPIC_TYPE_META, listResearch } from '../../lib/research/loader'

export const dynamic = 'force-static'

export const metadata = {
  title: '知识库',
  description:
    '涂阿燃（tuaran）的知识库：精选文章、公司调研与事项调研。所有调研以 Markdown 归档在 GitHub 仓库，自动渲染上线。',
  keywords: ['涂阿燃', 'tuaran', '掘金安东尼', '安东尼404', '知识库', '调研', '公司调研', '事项调研', 'AI'],
  alternates: {
    canonical: '/articles',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

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
    title: '明清史',
    summary: '以皇帝时间线梳理明清两代 —— 朱元璋、朱棣、嘉靖、张居正、万历、康熙、雍正的制度与命运。',
    date: '2026-05-20',
    href: '/history/ming-qing',
  },
  {
    title: '三国史',
    summary: '以时间线梳理曹操的崛起、用人与争议。',
    date: '2026-05-20',
    href: '/history/three-kingdoms',
  },
]

// 诗歌调研
const POETRY_RESEARCH = [
  {
    title: '诗词巅峰',
    summary: '历代诗词名篇的整理与原文：短歌行、洛神赋、兰亭集序、春江花月夜、滕王阁序……',
    date: '2026-05-20',
    href: '/poetry',
  },
]

function buildItems() {
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
    const subLabel = entry.topicType && TOPIC_TYPE_META[entry.topicType]?.label
    return {
      kind: entry.category, // 'companies' | 'topics'
      tagLabel: subLabel ? `${baseLabel} · ${subLabel}` : baseLabel,
      title: entry.title,
      summary: entry.tldr || entry.summary,
      date: entry.date,
      readingMinutes: entry.readingMinutes,
      encrypted: entry.encrypted,
      href: `/articles/research/${entry.category}/${entry.slug}`,
    }
  })

  const peopleItems = PEOPLE_RESEARCH.map((p) => ({
    kind: 'people',
    tagLabel: '人物调研',
    title: p.title,
    summary: p.summary,
    date: p.date,
    href: p.href,
  }))

  const historyItems = HISTORY_RESEARCH.map((p) => ({
    kind: 'history',
    tagLabel: '历史调研',
    title: p.title,
    summary: p.summary,
    date: p.date,
    href: p.href,
  }))

  const poetryItems = POETRY_RESEARCH.map((p) => ({
    kind: 'poetry',
    tagLabel: '诗歌调研',
    title: p.title,
    summary: p.summary,
    date: p.date,
    href: p.href,
  }))

  return [...postItems, ...researchItems, ...peopleItems, ...historyItems, ...poetryItems].sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  })
}

export default function ArticlesPage() {
  const items = buildItems()

  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-10">
      <header className="mb-10 border-b border-[#eee] dark:border-gray-800 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">
              知识库
            </h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">
              我读到、研究过、想反复回看的东西，都沉淀在这里——长文观察、公司画像、事项专题，按主题持续累积。
            </p>
          </div>
        </div>
      </header>

      <Suspense fallback={<div className="text-sm text-[#666] dark:text-gray-400">加载中…</div>}>
        <ArticlesIndexClient items={items} />
      </Suspense>
    </main>
  )
}

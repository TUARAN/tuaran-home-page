import { Suspense } from 'react'

import { articles } from './articlesData'
import ArticlesIndexClient from './ArticlesIndexClient'
import { CATEGORY_META, listResearch } from '../../lib/research/loader'

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
    title: '埃隆·马斯克（Elon Musk）',
    summary: '工程、产品、组织、叙事——以第一性原理 + 工程迭代 + 资本市场叙事驱动的超级企业家样本。',
    date: '2024-09-01',
    href: '/people/elon-musk',
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

  const researchItems = listResearch().map((entry) => ({
    kind: entry.category, // 'companies' | 'topics'
    tagLabel: CATEGORY_META[entry.category]?.label || entry.category,
    title: entry.title,
    summary: entry.summary,
    date: entry.date,
    href: `/articles/research/${entry.category}/${entry.slug}`,
  }))

  const peopleItems = PEOPLE_RESEARCH.map((p) => ({
    kind: 'people',
    tagLabel: '人物调研',
    title: p.title,
    summary: p.summary,
    date: p.date,
    href: p.href,
  }))

  return [...postItems, ...researchItems, ...peopleItems].sort((a, b) => {
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

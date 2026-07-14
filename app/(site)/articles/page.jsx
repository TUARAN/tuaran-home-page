import { Suspense } from 'react'

import ArticlesHeaderClient from './ArticlesHeaderClient'
import ArticlesIndexClient from './ArticlesIndexClient'
import { buildKnowledgeItems } from './buildKnowledgeItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '文章与分析',
  description:
    '涂阿燃（tuaran）的文章与分析：原创观点、技术实践、专题分析、公司观察、人物内容与资源索引。',
  keywords: ['涂阿燃', 'tuaran', '掘金安东尼', '安东尼404', '原创文章', '技术实践', '专题分析', '公司观察', '人物', '资源库', 'AI'],
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

export default function ArticlesPage() {
  const items = buildKnowledgeItems()
  const heatmapItems = items.map((item) => ({ id: item.id, date: item.date }))

  return (
    <main className="w-full max-w-[1120px] mx-auto px-4 py-10">
      <Suspense fallback={<div className="mb-4 text-sm text-[#666] dark:text-gray-400">加载文章与分析…</div>}>
        <ArticlesHeaderClient items={heatmapItems} />
      </Suspense>

      <Suspense fallback={<div className="text-sm text-[#666] dark:text-gray-400">加载中…</div>}>
        <ArticlesIndexClient items={items} />
      </Suspense>
    </main>
  )
}

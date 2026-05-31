import { Suspense } from 'react'

import ArticlesIndexClient from './ArticlesIndexClient'
import KnowledgeHeatmapClient from './KnowledgeHeatmapClient'
import { buildKnowledgeItems } from './buildKnowledgeItems'

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

export default function ArticlesPage() {
  const items = buildKnowledgeItems()

  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-10">
      <header className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">
              知识库
            </h1>
          </div>
        </div>
        <div className="mt-3">
          <KnowledgeHeatmapClient items={items} />
        </div>
      </header>

      <Suspense fallback={<div className="text-sm text-[#666] dark:text-gray-400">加载中…</div>}>
        <ArticlesIndexClient items={items} />
      </Suspense>
    </main>
  )
}

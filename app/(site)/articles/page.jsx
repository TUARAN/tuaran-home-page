import { Suspense } from 'react'

import ArticlesIndexClient from './ArticlesIndexClient'
import KnowledgeHeatmapClient from './KnowledgeHeatmapClient'
import { buildKnowledgeItems } from './buildKnowledgeItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '原创 & 调研 & 资料',
  description:
    '涂阿燃（tuaran）的原创、调研与资料库：原创判断、AI 协助调研、原文谱系与可检索资料三类内容。',
  keywords: ['涂阿燃', 'tuaran', '掘金安东尼', '安东尼404', '原创', '调研', '资料库', '公司调研', '事项调研', 'AI'],
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
              原创 & 调研 & 资料
            </h1>
            <p className="mt-2 max-w-3xl text-[13.5px] leading-[1.8] text-[#6e6452] dark:text-[#9aa5b6]">
              原创：精选文章 / 工程作品；调研：专题 / 公司 / 事项；资料：站内资料 + 资源收藏。
            </p>
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

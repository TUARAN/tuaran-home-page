import { Suspense } from 'react'

import ArticlesIndexClient from './ArticlesIndexClient'
import KnowledgeHeatmapClient from './KnowledgeHeatmapClient'
import { buildKnowledgeItems } from './buildKnowledgeItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '作品 & 调研 & 资料',
  description:
    '涂阿燃（tuaran）的作品、调研与资料库：5% 原创判断、15% AI 协助调研、80% 原文谱系与可检索资料按 80/15/5 框架分层呈现。',
  keywords: ['涂阿燃', 'tuaran', '掘金安东尼', '安东尼404', '作品集', '调研', '资料库', '公司调研', '事项调研', 'AI', '80/15/5'],
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
              作品 & 调研 & 资料
            </h1>
            <p className="mt-2 max-w-3xl text-[13.5px] leading-[1.8] text-[#6e6452] dark:text-[#9aa5b6]">
              5% 作品层：精选文章 / 工程作品；15% 调研层：专题 / 公司 / 事项；80% 资料层：站内资料 + 资源收藏。
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

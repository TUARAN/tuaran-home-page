import { Suspense } from 'react'

import ArticlesHeaderClient from './ArticlesHeaderClient'
import ArticlesIndexClient from './ArticlesIndexClient'
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
      <ArticlesHeaderClient items={items} />

      <Suspense fallback={<div className="text-sm text-[#666] dark:text-gray-400">加载中…</div>}>
        <ArticlesIndexClient items={items} />
      </Suspense>
    </main>
  )
}

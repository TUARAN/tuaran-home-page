import { Suspense } from 'react'

import ArticlesHeaderClient from './ArticlesHeaderClient'
import ArticlesIndexClient from './ArticlesIndexClient'
import { buildKnowledgeItems } from './buildKnowledgeItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '知识库',
  description:
    '涂阿燃（tuaran）的知识库：创作文章、多维页面、AI 协助调研、资源索引与可检索资料入口。',
  keywords: ['涂阿燃', 'tuaran', '掘金安东尼', '安东尼404', '知识库', '创作', '专栏', '调研', '资源库', '资料库', '公司调研', '事项调研', '人物调研', 'AI'],
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
    <main className="w-full max-w-[1120px] mx-auto px-4 py-10">
      <Suspense fallback={<div className="mb-4 text-sm text-[#666] dark:text-gray-400">加载知识库…</div>}>
        <ArticlesHeaderClient items={items} />
      </Suspense>

      <Suspense fallback={<div className="text-sm text-[#666] dark:text-gray-400">加载中…</div>}>
        <ArticlesIndexClient items={items} />
      </Suspense>
    </main>
  )
}

import { Suspense } from 'react'

import ArticlesHeaderClient from './ArticlesHeaderClient'
import ArticlesIndexClient from './ArticlesIndexClient'
import ArticlesIndexSkeleton from './ArticlesIndexSkeleton'
import { buildKnowledgeItems } from './buildKnowledgeItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '统一内容目录',
  description:
    '按唯一主题和内容类型浏览精选文章、分析、工程实践、互动专题与资源。',
  keywords: ['涂阿燃', 'tuaran', '掘金安东尼', '安东尼404', '原创文章', '技术实践', '工程分析', '资料核验', 'AI'],
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

function ArticlesHeaderFallback() {
  return (
    <header className="mb-4">
      <div className="flex min-w-0 flex-nowrap items-baseline gap-3 overflow-hidden">
        <h1 className="shrink-0 font-serif text-2xl font-semibold tracking-wide text-[#222] dark:text-gray-100 md:text-3xl">
          内容导航
        </h1>
        <p className="min-w-0 truncate text-[12px] text-[#85877d] dark:text-[#737f91] md:text-[13px]">
          <q>千里之行，始于足下。</q>
          <cite className="ml-1 not-italic">— 老子</cite>
        </p>
      </div>
    </header>
  )
}

export default function ArticlesPage() {
  const items = buildKnowledgeItems()

  return (
    <main className="w-full max-w-[1120px] mx-auto px-4 py-10">
      <Suspense fallback={<ArticlesHeaderFallback />}>
        <ArticlesHeaderClient />
      </Suspense>

      <Suspense fallback={<ArticlesIndexSkeleton />}>
        <ArticlesIndexClient items={items} />
      </Suspense>
    </main>
  )
}

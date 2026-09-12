import ArticlesHeaderClient from './ArticlesHeaderClient'
import ArticlesIndexClient from './ArticlesIndexClient'
import { filtersFromParams, toUrlSearchParams } from '../../../lib/articlesDirectoryFilters'
import { readRuntimeKnowledgeItems } from '../../../lib/knowledgeRuntime'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

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

export default async function ArticlesPage({ searchParams }) {
  const items = await readRuntimeKnowledgeItems()
  const initialFilters = filtersFromParams(toUrlSearchParams(await searchParams))

  return (
    <main className="h5-articles-page mx-auto w-full max-w-[1120px] px-0 py-2 md:px-4 md:py-10">
      <ArticlesHeaderClient
        discovery={(
          <nav aria-label="文章发现" className="shrink-0">
            {/* Plain HTML endpoint: use document navigation rather than the RSC router. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/articles/published" className="whitespace-nowrap text-[13px] text-[#958aa1] no-underline transition-colors hover:text-[#20172f] hover:underline hover:underline-offset-4 dark:text-gray-500 dark:hover:text-gray-200">
              最新发布
            </a>
          </nav>
        )}
      />

      <ArticlesIndexClient items={items} initialFilters={initialFilters} />
    </main>
  )
}

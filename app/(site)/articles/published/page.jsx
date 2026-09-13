import Link from 'next/link'

import ArticleListItem from '../ArticleListItem'
import { readRuntimeKnowledgeItems } from '../../../../lib/knowledgeRuntime'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '最新发布',
  description: '按时间浏览最新发布的公开文章、调研与资源。',
  keywords: ['涂阿燃', 'tuaran', '最新发布', '原创文章'],
  alternates: {
    canonical: '/articles/published',
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

export default async function PublishedArticlesPage() {
  const items = await readRuntimeKnowledgeItems()

  return (
    <main className="h5-articles-page mx-auto w-full max-w-[1120px] px-0 py-2 md:px-4 md:py-10">
      <header className="mb-5 flex items-baseline justify-between gap-4 px-[0.9rem] md:px-0">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-wide text-[#222] dark:text-gray-100 md:text-3xl">
            最新发布
          </h1>
          <p className="mt-1 mb-0 text-[13px] text-[#958aa1] dark:text-gray-500">
            按发布时间排列的公开内容
          </p>
        </div>
        <nav aria-label="文章发现" className="shrink-0">
          <Link
            href="/articles"
            className="whitespace-nowrap text-[13px] text-[#958aa1] no-underline transition-colors hover:text-[#20172f] hover:underline hover:underline-offset-4 dark:text-gray-500 dark:hover:text-gray-200"
          >
            全部内容
          </Link>
        </nav>
      </header>

      {items.length ? (
        <div className="h5-feed-list overflow-hidden border-y border-[var(--site-line)] bg-transparent md:bg-white/45 md:dark:bg-[#101721]/65">
          {items.map((item, index) => (
            <ArticleListItem
              key={item.id || `${item.kind}:${item.href}:${item.title}`}
              item={item}
              position={index + 1}
            />
          ))}
        </div>
      ) : (
        <p className="px-[0.9rem] text-sm text-[#666] dark:text-gray-400 md:px-0">暂无公开内容。</p>
      )}
    </main>
  )
}

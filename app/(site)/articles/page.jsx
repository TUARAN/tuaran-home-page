import { Suspense } from 'react'

import ArticleListItem from './ArticleListItem'
import ArticlesHeaderClient from './ArticlesHeaderClient'
import ArticlesIndexClient from './ArticlesIndexClient'
import { buildKnowledgeItems } from './buildKnowledgeItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '统一内容目录',
  description:
    '按内容主题和内容类型浏览文章、分析、工程实践与资源。',
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

function ArticlesIndexFallback({ items }) {
  // 与客户端目录保持同一行式布局（复用 ArticleListItem），
  // 避免静态 HTML 先出现卡片网格、hydration 后再切换成行式列表的样式跳变。
  return (
    <section
      aria-label="全部内容"
      className="overflow-hidden border-y border-[#d9d2df] bg-white/45 dark:border-gray-800 dark:bg-[#101721]/65"
    >
      {items.slice(0, 24).map((item, index) => {
        // 静态 fallback 不加载阅读量，去掉 pv 字段避免展示过期的“阅读量 0 / -”
        const fallbackItem = { ...item }
        delete fallbackItem.pv
        delete fallbackItem.pvKey
        return (
          <ArticleListItem
            key={item.id}
            item={fallbackItem}
            position={index + 1}
          />
        )
      })}
    </section>
  )
}

export default function ArticlesPage() {
  const items = buildKnowledgeItems()

  return (
    <main className="w-full max-w-[1120px] mx-auto px-4 py-10">
      <Suspense fallback={<ArticlesHeaderFallback />}>
        <ArticlesHeaderClient />
      </Suspense>

      <Suspense fallback={<ArticlesIndexFallback items={items} />}>
        <ArticlesIndexClient items={items} />
      </Suspense>
    </main>
  )
}

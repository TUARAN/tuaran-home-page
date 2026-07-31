import { Suspense } from 'react'
import Link from 'next/link'

import ArticlesHeaderClient from './ArticlesHeaderClient'
import ArticlesIndexClient from './ArticlesIndexClient'
import { buildKnowledgeItems } from './buildKnowledgeItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '文章与分析',
  description:
    '涂阿燃（tuaran）结合本人实践、公开资料与询证形成的工程分析、技术文章和交互作品。',
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
      <h1 className="font-serif text-2xl font-semibold tracking-wide text-[#222] dark:text-gray-100 md:text-3xl">
        文章与分析
      </h1>
      <p className="mt-2 text-[13.5px] leading-[1.8] text-[#5c5e52] dark:text-[#9aa5b6]">
        工程实践、作者判断与公开资料核验放在一起，明确区分事实、推断和待确认信息。
      </p>
    </header>
  )
}

function ArticlesIndexFallback({ items }) {
  return (
    <section aria-labelledby="articles-fallback-title">
      <h2 id="articles-fallback-title" className="mb-3 text-lg font-semibold text-[#29232f] dark:text-gray-100">
        全部内容
      </h2>
      <ul className="grid list-none gap-3 p-0 md:grid-cols-2">
        {items.slice(0, 12).map((item) => (
          <li key={item.id} className="rounded-xl border border-[#e3dfe7] bg-white/70 p-4 dark:border-[#333039] dark:bg-[#17161a]">
            <Link href={item.href} className="font-semibold leading-6 text-[#2b2137] no-underline hover:underline dark:text-gray-100">
              {item.title}
            </Link>
            {item.summary ? (
              <p className="mt-2 line-clamp-3 text-[13px] leading-6 text-[#66606d] dark:text-gray-400">
                {item.summary}
              </p>
            ) : null}
            {item.date ? (
              <p className="mt-2 font-mono text-[10px] text-[#8c8494] dark:text-gray-500">{item.date}</p>
            ) : null}
          </li>
        ))}
      </ul>
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

import Link from 'next/link'
import { articles } from './articlesData'

export const dynamic = 'force-static'

export const metadata = {
  title: '文章列表',
  description: '涂阿燃（tuaran）的文章列表：技术观察、实践复盘、SEO、AI 智能体与工程化内容。',
  keywords: ['涂阿燃', 'tuaran', '掘金安东尼', '安东尼404', 'SEO', '文章列表', '个人博客'],
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

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

export default function ArticlesPage() {
  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-10">
      <header className="mb-10 border-b border-[#eee] dark:border-gray-800 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">文章列表</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">
              精选技术观察、实践复盘与连载日记内容。
              <span className="ml-2 inline-flex items-center gap-2">
                <a
                  href="https://juejin.cn/user/1521379823340792/posts"
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100 underline underline-offset-4"
                >
                  掘金历史文章
                </a>
                <span aria-hidden="true">·</span>
                <a
                  href="https://juejin.cn/user/1521379823340792/columns"
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100 underline underline-offset-4"
                >
                  掘金历史专栏
                </a>
              </span>
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {articles.map((article) => {
          const articlePath = article.slug === 'diary-self-reflection'
            ? '/diary'
            : `/articles/${article.slug}`
          const external = isExternalHref(article.href)
          const href = external ? article.href : articlePath

          return (
            <Link
              key={article.slug}
              href={href}
              {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
              className="group block border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 no-underline hover:no-underline opacity-90 hover:opacity-100 transition-all"
            >
              <div className="p-4">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-[#999] text-sm">▪</span>
                  <span className="text-xs text-[#999] dark:text-gray-400">{article.date}</span>
                  <span aria-hidden="true" className="text-[#ddd] text-xs">·</span>
                  <h2 className="text-lg font-semibold text-[#333] dark:text-gray-100 group-hover:text-[#111] dark:group-hover:text-white transition-colors">
                    {article.title}
                  </h2>
                </div>
                <p className="text-sm text-[#666] dark:text-gray-300 ml-5 leading-relaxed group-hover:text-[#333] dark:group-hover:text-gray-200 transition-colors">
                  {article.summary}
                </p>
                <div className="ml-5 mt-2 text-sm text-[#999] dark:text-gray-400">
                  {external ? '阅读原文 →' : '阅读全文 →'}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}

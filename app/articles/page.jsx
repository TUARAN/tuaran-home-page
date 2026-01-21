import Link from 'next/link'
import { articles } from './articlesData'
import SettingsButton from '../components/SettingsButton'

export const dynamic = 'force-static'

export const metadata = {
  title: '文章列表',
  description: '涂阿燃（tuaran）的文章列表：技术观察、实践复盘、SEO、AI 智能体与工程化内容。',
  keywords: ['涂阿燃', 'tuaran', '掘金安东尼', '安东尼404', 'SEO', '文章列表', '个人博客'],
  alternates: {
    canonical: '/articles',
  },
}

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

export default function ArticlesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-10 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[#555] dark:text-gray-200">文章列表</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2">
              精选技术观察、实践复盘与周刊内容。
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
          <SettingsButton />
        </div>
      </header>

      <div className="space-y-6">
        {articles.map((article) => (
          <article
            key={article.slug}
            className="border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 p-5 hover:border-[#ddd] dark:hover:border-gray-700 transition-colors"
          >
            <div className="flex flex-col gap-2">
              <div className="text-xs text-[#999] dark:text-gray-400">{article.date}</div>
              <h2 className="text-lg text-[#444] dark:text-gray-200">{article.title}</h2>
              <p className="text-sm text-[#666] dark:text-gray-300 leading-relaxed">{article.summary}</p>
              <div className="text-sm text-[#666] dark:text-gray-300 flex flex-wrap gap-4 pt-2">
                <Link
                  href={`/articles/${article.slug}`}
                  className="opacity-80 hover:opacity-100 underline underline-offset-4"
                >
                  阅读全文
                </Link>
                {isExternalHref(article.href) ? (
                  <a
                    href={article.href}
                    target="_blank"
                    rel="noreferrer"
                    className="opacity-80 hover:opacity-100 underline underline-offset-4"
                  >
                    阅读原文
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

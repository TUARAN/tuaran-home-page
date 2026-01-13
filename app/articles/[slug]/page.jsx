import { notFound } from 'next/navigation'
import { articles } from '../articlesData'
import SettingsButton from '../../components/SettingsButton'

export const dynamic = 'force-static'

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }))
}

export default async function ArticleDetailPage({ params }) {
  const resolvedParams = await params
  const article = articles.find((item) => item.slug === resolvedParams.slug)

  if (!article) {
    notFound()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-8 border-b border-[#eee] pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs text-[#999]">{article.date}</div>
            <h1 className="mt-2 text-2xl text-[#444] leading-snug">{article.title}</h1>
            <p className="text-sm text-[#666] mt-3 leading-relaxed">{article.summary}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#666]">
              <a
                href="/articles"
                className="opacity-80 hover:opacity-100 underline underline-offset-4"
              >
                返回列表
              </a>
              {isExternalHref(article.href) ? (
                <a
                  href={article.href}
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-80 hover:opacity-100 underline underline-offset-4"
                >
                  原文阅读
                </a>
              ) : null}
            </div>
          </div>
          <SettingsButton />
        </div>
      </header>

      {article.cover ? (
        <div className="mb-8">
          <img
            src={article.cover}
            alt={`${article.title} 封面`}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="w-full border border-[#eee] bg-white"
          />
        </div>
      ) : null}

      <div className="space-y-5 text-sm leading-relaxed text-[#555]">
        {article.content.map((paragraph, idx) => {
          // 支持两种日期写法：
          // 1）纯字符串日期：'2026-01-05'
          // 2）对象：{ date: '2026-01-05', label: '小标题' }
          const isDateString =
            typeof paragraph === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(paragraph.trim())
          const isDateObject = paragraph && typeof paragraph === 'object' && paragraph.date

          if (isDateString || isDateObject) {
            const date = isDateObject ? paragraph.date : paragraph.trim()
            const label = isDateObject ? paragraph.label : ''

            return (
              <div
                key={`${idx}-${date}-${label || 'no-label'}`}
                className="mt-8 mb-2 flex items-center gap-2 text-[11px] text-[#999]"
              >
                <span>{date}</span>
                <span className="inline-block w-1 h-1 rounded-full bg-[#111]" aria-hidden="true" />
                {label ? <span className="text-[#444] font-medium">{label}</span> : null}
              </div>
            )
          }

          return <p key={`${idx}-${paragraph}`}>{paragraph}</p>
        })}
      </div>
    </div>
  )
}

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

export default function ArticleDetailPage({ params }) {
  const article = articles.find((item) => item.slug === params.slug)

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
        {article.content.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  )
}

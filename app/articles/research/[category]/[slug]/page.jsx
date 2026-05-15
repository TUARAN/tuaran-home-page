import { notFound } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'

import {
  CATEGORY_META,
  RESEARCH_CATEGORIES,
  getAllResearchParams,
  getResearchEntry,
} from '../../../../../lib/research/loader'
import { extractToc, renderMarkdown } from '../../../../../lib/research/markdown'

const SITE_URL = 'https://tuaran.me'
const SITE_TITLE = '涂阿燃（tuaran）的网络日志'

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return getAllResearchParams()
}

export async function generateMetadata({ params }) {
  const { category, slug } = await params
  const entry = getResearchEntry(category, slug)
  if (!entry) {
    return {
      title: `调研未找到 · ${SITE_TITLE}`,
      robots: { index: false, follow: false },
    }
  }

  const url = `${SITE_URL}/articles/research/${entry.category}/${entry.slug}`
  const title = entry.title
  const description = entry.summary || `${CATEGORY_META[entry.category]?.label || ''}：${entry.title}`

  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: ['涂阿燃', 'tuaran', '调研', CATEGORY_META[entry.category]?.label, ...(entry.tags || [])].filter(Boolean),
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_TITLE,
      locale: 'zh_CN',
      type: 'article',
      publishedTime: entry.date ? new Date(entry.date).toISOString() : undefined,
    },
    twitter: { card: 'summary', title, description },
  }
}

export default async function ResearchDetailPage({ params }) {
  const { category, slug } = await params
  if (!RESEARCH_CATEGORIES.includes(category)) notFound()
  const entry = getResearchEntry(category, slug)
  if (!entry) notFound()

  const html = renderMarkdown(entry.content)
  const toc = extractToc(entry.content)
  const categoryLabel = CATEGORY_META[entry.category]?.label || entry.category
  const url = `${SITE_URL}/articles/research/${entry.category}/${entry.slug}`

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: entry.title,
    description: entry.summary || undefined,
    datePublished: entry.date ? new Date(entry.date).toISOString() : undefined,
    author: { '@type': 'Person', name: '涂阿燃', url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Script id={`research-jsonld-${entry.category}-${entry.slug}`} type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(structuredData)}
      </Script>

      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-4">
        <div className="text-xs text-[#999] dark:text-gray-400 flex flex-wrap items-center gap-2">
          <Link href="/articles" className="opacity-80 hover:opacity-100 underline underline-offset-4">
            知识库
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            href={`/articles?tab=${entry.category}`}
            className="opacity-80 hover:opacity-100 underline underline-offset-4"
          >
            {categoryLabel}
          </Link>
          {entry.date ? (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={entry.date}>{entry.date}</time>
            </>
          ) : null}
          {entry.source ? (
            <>
              <span aria-hidden="true">·</span>
              <span>来源：{entry.source}</span>
            </>
          ) : null}
        </div>
        <h1 className="mt-3 text-2xl text-[#444] dark:text-gray-200 leading-snug">{entry.title}</h1>
        {entry.summary ? (
          <p className="text-sm text-[#666] dark:text-gray-300 mt-3 leading-relaxed">{entry.summary}</p>
        ) : null}
        {entry.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-[#ddd8cb] bg-white/70 px-2 py-0.5 text-[11px] text-[#5f5a4d] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <div className="flex flex-col gap-6 md:flex-row">
        {toc.length > 1 ? (
          <aside className="hidden md:block md:w-52 shrink-0">
            <nav className="border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:sticky md:top-6">
              <div className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">
                目录
              </div>
              <ul className="text-sm text-[#666] space-y-2 dark:text-gray-300">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        ) : null}

        <main className="flex-1 min-w-0">
          <article className="prose-tuaran" dangerouslySetInnerHTML={{ __html: html }} />
        </main>
      </div>
    </div>
  )
}

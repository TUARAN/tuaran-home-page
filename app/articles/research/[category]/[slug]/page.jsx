import { notFound } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'

import {
  CATEGORY_META,
  COMPANY_TYPE_META,
  RESEARCH_CATEGORIES,
  TOPIC_TYPE_META,
  getAllResearchParams,
  getResearchEntry,
  listResearchByCategory,
} from '../../../../../lib/research/loader'
import { extractToc, renderMarkdown } from '../../../../../lib/research/markdown'
import ArticleFooterCta from '../../../../components/ArticleFooterCta'
import CopyMarkdownButton from './CopyMarkdownButton'
import EncryptedArticle from './EncryptedArticle'
import ShareResearchButton from './ShareResearchButton'

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

  const isEncrypted = entry.encrypted
  const html = isEncrypted ? '' : renderMarkdown(entry.content)
  const toc = isEncrypted ? [] : extractToc(entry.content)
  // 一键复制用的 Markdown：标题 + 正文（不含 YAML frontmatter）；加密文章不提供
  const markdownDoc = isEncrypted ? '' : `# ${entry.title}\n\n${entry.content}`
  const categoryLabel = CATEGORY_META[entry.category]?.label || entry.category
  const url = `${SITE_URL}/articles/research/${entry.category}/${entry.slug}`

  // 相关阅读：同 category 其它条目，最近 3 篇
  const relatedPool = listResearchByCategory(entry.category).filter((e) => e.slug !== entry.slug)
  const related =
    entry.category === 'companies' && entry.companyType
      ? [
          ...relatedPool.filter((e) => e.companyType === entry.companyType),
          ...relatedPool.filter((e) => e.companyType !== entry.companyType),
        ].slice(0, 3)
      : relatedPool.slice(0, 3)

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
          {entry.companyType && COMPANY_TYPE_META[entry.companyType] ? (
            <>
              <span aria-hidden="true">·</span>
              <Link
                href={`/articles?tab=companies&company_type=${entry.companyType}`}
                className="inline-flex items-center rounded-full border border-[#cbd9ee] bg-[#eff4fc] px-2 py-[1px] text-[10px] text-[#3b5b8a] no-underline hover:border-[#9fb7d8] dark:border-[#2a3a55] dark:bg-[#152034] dark:text-[#9bb6df]"
              >
                {COMPANY_TYPE_META[entry.companyType].label}
              </Link>
            </>
          ) : null}
          {entry.topicType && TOPIC_TYPE_META[entry.topicType] ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center rounded-full border border-[#e9d5b8] bg-[#fbf3e3] px-2 py-[1px] text-[10px] text-[#8a5a14] dark:border-[#3a2f1c] dark:bg-[#2a2115] dark:text-[#e2bd75]">
                {TOPIC_TYPE_META[entry.topicType].label}
              </span>
            </>
          ) : null}
          {entry.date ? (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={entry.date}>{entry.date}</time>
            </>
          ) : null}
          {entry.version ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center rounded-full border border-[#ddd8cb] bg-white/70 px-2 py-[1px] text-[10px] text-[#5f5a4d] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300">
                {entry.version}
              </span>
            </>
          ) : null}
          {entry.readingMinutes ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{entry.readingMinutes} min read</span>
            </>
          ) : null}
          {entry.source ? (
            <>
              <span aria-hidden="true">·</span>
              <span>来源：{entry.source}</span>
            </>
          ) : null}
          {isEncrypted ? null : (
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <ShareResearchButton title={entry.title} text={entry.summary || entry.tldr || entry.title} url={url} />
              <CopyMarkdownButton markdown={markdownDoc} />
            </div>
          )}
        </div>
        <h1 className="mt-3 text-2xl text-[#444] dark:text-gray-200 leading-snug">{entry.title}</h1>
        {entry.tldr ? (
          <aside className="mt-4 border-l-2 border-[#b7791f] bg-[#fbf3e3] px-4 py-3 text-sm leading-7 text-[#5d503f] dark:border-[#e2bd75] dark:bg-[#2a2115] dark:text-gray-200">
            <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a5a14] dark:text-[#e2bd75]">
              TL;DR
            </span>
            {entry.tldr}
          </aside>
        ) : entry.summary ? (
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
          {isEncrypted ? (
            <EncryptedArticle
              payload={entry.encryptedPayload}
              storageKey={`research-dec:${entry.category}:${entry.slug}`}
            />
          ) : (
            <article className="prose-tuaran" dangerouslySetInnerHTML={{ __html: html }} />
          )}

          {related.length ? (
            <section className="mx-auto mt-12 max-w-[72ch] border-t border-[#e8dfd0] pt-8 dark:border-gray-800">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[#a09176] dark:text-[#8e9ab0]">
                Related · 同类调研
              </p>
              <ul className="space-y-2">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/articles/research/${r.category}/${r.slug}`}
                      className="group flex items-baseline gap-3 rounded-lg border border-transparent px-3 py-2 no-underline transition hover:border-[#e8dfd0] hover:bg-white dark:hover:border-gray-800 dark:hover:bg-gray-900"
                    >
                      {r.date ? (
                        <time className="font-mono text-[11px] text-[#999] dark:text-gray-500">{r.date}</time>
                      ) : null}
                      <span className="text-[15px] text-[#333] group-hover:text-[#111] dark:text-gray-200 dark:group-hover:text-white">
                        {r.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <ArticleFooterCta />
        </main>
      </div>
    </div>
  )
}

import { notFound, redirect } from 'next/navigation'
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
import ArticleComments from '../../../../components/ArticleComments'
import ArticleFooterCta from '../../../../components/ArticleFooterCta'
import CopyMarkdownButton from './CopyMarkdownButton'
import DistributeMarkdownButton from './DistributeMarkdownButton'
import DownloadPptButton from './DownloadPptButton'
import EncryptedArticle from './EncryptedArticle'
import ResearchBody from './ResearchBody'
import ResearchPvCounter from './ResearchPvCounter'
import ShareResearchButton from './ShareResearchButton'

const SITE_URL = 'https://2aran.com'
const SITE_TITLE = '涂阿燃（tuaran）的网络日志'

export const dynamic = 'force-static'
export const dynamicParams = true

export function generateStaticParams() {
  return getAllResearchParams()
}

function resolveResearchEntry(category, slug) {
  const entry = getResearchEntry(category, slug)
  if (entry) return entry
  const legacySlug = String(slug || '').replace(/^\d{4}-\d{2}-\d{2}-/, '')
  if (legacySlug && legacySlug !== slug) return getResearchEntry(category, legacySlug)
  return null
}

export async function generateMetadata({ params }) {
  const { category, slug } = await params
  const entry = resolveResearchEntry(category, slug)
  if (!entry) {
    return {
      title: `调研未找到 · ${SITE_TITLE}`,
      robots: { index: false, follow: false },
    }
  }

  const url = `${SITE_URL}/articles/research/${entry.category}/${entry.slug}`
  const title = entry.title
  const description = entry.summary || `${CATEGORY_META[entry.category]?.label || ''}：${entry.title}`
  const cover = entry.images?.[0]

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
      images: cover ? [{ url: cover.src, alt: cover.alt || `${entry.title} 配图` }] : undefined,
    },
    twitter: { card: cover ? 'summary_large_image' : 'summary', title, description, images: cover ? [cover.src] : undefined },
  }
}

export default async function ResearchDetailPage({ params }) {
  const { category, slug } = await params
  if (!RESEARCH_CATEGORIES.includes(category)) notFound()
  const entry = resolveResearchEntry(category, slug)
  if (!entry) notFound()
  if (entry.slug !== slug) redirect(`/articles/research/${entry.category}/${entry.slug}`)

  const isEncrypted = entry.encrypted
  const variantList = isEncrypted ? [] : Array.isArray(entry.variants) && entry.variants.length > 0
    ? entry.variants
    : [{ id: entry.source || 'claude-code', label: '', content: entry.content }]
  const renderedVariants = isEncrypted
    ? []
    : variantList.map((variant, index) => ({
        id: variant.id,
        label: variant.label || variant.id,
        content: variant.content,
        html: renderMarkdown(variant.content, {
          images: index === 0 ? entry.images || [] : [],
          seed: `${entry.category}:${entry.slug}:${variant.id}`,
          title: entry.title,
        }),
        toc: extractToc(variant.content),
      }))
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
    image: entry.images?.length ? entry.images.map((image) => image.src) : undefined,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'ReadAction' },
      userInteractionCount: entry.pv || 0,
    },
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
          <span aria-hidden="true">·</span>
          <ResearchPvCounter category={entry.category} slug={entry.slug} initialPv={entry.pv} />
          {entry.source ? (
            <>
              <span aria-hidden="true">·</span>
              <span>来源：{entry.sourceLabel || 'TUARAN'}</span>
            </>
          ) : null}
          {isEncrypted ? null : (
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <ShareResearchButton title={entry.title} text={entry.summary || entry.tldr || entry.title} url={url} />
              <CopyMarkdownButton markdown={markdownDoc} />
              <DownloadPptButton
                title={entry.title}
                subtitle={entry.tldr || entry.summary || ''}
                fileBaseName={entry.slug}
                images={entry.images || []}
                variants={renderedVariants.map((v) => ({ id: v.id, content: v.content }))}
              />
              <DistributeMarkdownButton
                title={entry.title}
                summary={entry.summary || entry.tldr || ''}
                markdown={markdownDoc}
                url={url}
                category={entry.category}
                slug={entry.slug}
                tags={entry.tags || []}
              />
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

      {isEncrypted ? (
        <main>
          <EncryptedArticle
            payload={entry.encryptedPayload}
            storageKey={`research-dec:${entry.category}:${entry.slug}`}
          />
        </main>
      ) : (
        <ResearchBody variants={renderedVariants} />
      )}

      <div className="flex flex-col gap-6 md:flex-row">
        <div className="hidden md:block md:w-52 shrink-0" aria-hidden="true" />
        <main className="flex-1 min-w-0">
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

          <ArticleComments articleKey={`research:${entry.category}:${entry.slug}`} />
          <ArticleFooterCta />
        </main>
      </div>
    </div>
  )
}

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'

import {
  CATEGORY_META,
  COMPANY_TYPE_META,
  TECH_TYPE_META,
  RESEARCH_CATEGORIES,
  TOPIC_TYPE_META,
  getAllResearchParams,
  getResearchEntry,
  listResearch,
  listResearchByCategory,
} from '../../../../../../lib/research/loader'
import { avatarAbsoluteUrl } from '../../../../../../lib/avatar'
import { buildResearchMarkdownDocument, extractToc, renderMarkdown } from '../../../../../../lib/research/markdown'
import { AUTHOR_INTRO_MARKDOWN, AuthorByline } from '../../../../components/ArticleAuthorIntro'
import ArticleComments from '../../../../components/ArticleComments'
import ArticleFooterCta from '../../../../components/ArticleFooterCta'
import ArticleEngagementPanel from '../../../../components/ArticleEngagementPanel'
import ArticleHeaderActions from '../../../../components/ArticleHeaderActions'
import CopyMarkdownButton from './CopyMarkdownButton'
import DistributeMarkdownButton from './DistributeMarkdownButton'
import DownloadPptButton from './DownloadPptButton'
import EncryptedArticle from './EncryptedArticle'
import ResearchBody from './ResearchBody'
import RanbiPaywall from '../../../../components/RanbiPaywall'
import ResearchPvCounter from './ResearchPvCounter'
import LifeTrafficTest from './LifeTrafficTest'
import RebuttalPersonalityTest from './RebuttalPersonalityTest'

const SITE_URL = 'https://2aran.com'
const SITE_TITLE = '涂阿燃（tuaran）的网络日志'
const AVATAR_URL = avatarAbsoluteUrl(SITE_URL)

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  const params = getAllResearchParams()
  for (const entry of listResearch()) {
    const legacySlug = entry.filename?.replace(/\.md$/i, '')
    if (legacySlug && legacySlug !== entry.slug) {
      params.push({ category: entry.category, slug: legacySlug })
    }
  }
  return params
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
      title: `内容未找到 · ${SITE_TITLE}`,
      robots: { index: false, follow: false },
    }
  }

  const url = `${SITE_URL}/articles/research/${entry.category}/${entry.slug}`
  const title = entry.title
  const description = entry.summary || `${CATEGORY_META[entry.category]?.label || ''}：${entry.title}`
  const isEncrypted = entry.encrypted
  // 分享卡片：永远走同目录 opengraph-image.jsx 动态生成（头像 + 标题 + 摘要），
  // 不再依赖文内 cover（多为 Unsplash 经 wsrv.nl 代理，Twitterbot 拉不稳定）。
  // 文内 cover 保留为页面视觉，与 OG 分工。

  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: ['涂阿燃', 'tuaran', '分析', CATEGORY_META[entry.category]?.label, ...(entry.tags || [])].filter(Boolean),
    robots: {
      index: !isEncrypted,
      follow: !isEncrypted,
      googleBot: { index: !isEncrypted, follow: !isEncrypted },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_TITLE,
      locale: 'zh_CN',
      type: 'article',
      publishedTime: entry.dateTimeIso ? new Date(entry.dateTimeIso).toISOString() : entry.date ? new Date(entry.date).toISOString() : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function ResearchDetailPage({ params }) {
  const { category, slug } = await params
  if (!RESEARCH_CATEGORIES.includes(category)) notFound()
  const entry = resolveResearchEntry(category, slug)
  if (!entry) notFound()
  if (entry.slug !== slug) redirect(`/articles/research/${entry.category}/${entry.slug}`)

  const isEncrypted = entry.encrypted
  const assistance = entry.assistance || entry.source || ''
  const variantList = isEncrypted ? [] : Array.isArray(entry.variants) && entry.variants.length > 0
    ? entry.variants
    : [{ id: assistance || 'claude-code', label: '', content: entry.content }]
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
  // 一键复制/分发用的 Markdown：标题 + 正文 + 配图（不含 YAML frontmatter）；加密文章不提供
  const markdownDoc = isEncrypted ? '' : buildResearchMarkdownDocument(entry.content, {
    images: entry.images || [],
    seed: `${entry.category}:${entry.slug}:${variantList[0]?.id || assistance || 'assistance'}`,
    title: entry.title,
    intro: AUTHOR_INTRO_MARKDOWN,
  })
  const categoryLabel = entry.contentTypeLabel || CATEGORY_META[entry.category]?.label || entry.category
  const topicTypeLabel = entry.topicType && TOPIC_TYPE_META[entry.topicType]?.label
  const showTopicType = topicTypeLabel && topicTypeLabel !== categoryLabel
  const categoryHref = entry.category === 'topics'
    ? entry.topicType === 'tech'
      ? '/articles?tab=tech'
      : '/articles?tab=other'
    : `/articles?tab=${entry.category}`
  const url = `${SITE_URL}/articles/research/${entry.category}/${entry.slug}`
  const articleKey = `research:${entry.category}:${entry.slug}`
  const showLifeTrafficTest = entry.category === 'topics' && entry.slug === 'lifetime-human-attention-traffic-pv-uv'
  const showRebuttalPersonalityTest = entry.category === 'topics' && entry.slug === 'rebuttal-personality-communication-pattern'

  // 相关阅读：同 category 其它条目，最近 3 篇
  const relatedPool = listResearchByCategory(entry.category).filter((e) => e.slug !== entry.slug)
  const related =
    entry.category === 'companies' && entry.companyType
      ? [
          ...relatedPool.filter((e) => e.companyType === entry.companyType),
          ...relatedPool.filter((e) => e.companyType !== entry.companyType),
        ].slice(0, 3)
      : relatedPool.slice(0, 3)

  const publishedISO = entry.dateTimeIso
    ? new Date(entry.dateTimeIso).toISOString()
    : entry.date
      ? new Date(entry.date).toISOString()
      : undefined
  const modifiedISO = entry.updated
    ? new Date(entry.updated).toISOString()
    : publishedISO

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: entry.title,
    description: entry.summary || undefined,
    inLanguage: 'zh-CN',
    datePublished: publishedISO,
    dateModified: modifiedISO,
    keywords: entry.tags?.length ? entry.tags.join(', ') : undefined,
    author: {
      '@type': 'Person',
      name: '涂阿燃',
      url: SITE_URL,
      sameAs: [
        'https://juejin.cn/user/1521379823340792',
        'https://github.com/TUARAN',
        'https://x.com/Anthony404',
      ],
    },
    publisher: {
      '@type': 'Organization',
      name: 'TUARAN',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: AVATAR_URL },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: entry.images?.length ? entry.images.map((image) => image.src) : undefined,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'ReadAction' },
      userInteractionCount: entry.pv || 0,
    },
  }

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '知识库', item: `${SITE_URL}/articles` },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryLabel,
        item: `${SITE_URL}${categoryHref}`,
      },
      { '@type': 'ListItem', position: 3, name: entry.title, item: url },
    ],
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:py-8">
      <Script id={`research-jsonld-${entry.category}-${entry.slug}`} type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(structuredData)}
      </Script>
      <Script id={`research-breadcrumb-${entry.category}-${entry.slug}`} type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(breadcrumbData)}
      </Script>

      <header className="research-article-header mb-8 border-b pb-4">
        <div className="research-article-meta flex flex-wrap items-center gap-2 text-xs">
          <Link href="/articles" className="opacity-80 hover:opacity-100 underline underline-offset-4">
            文章与分析
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            href={categoryHref}
            className="opacity-80 hover:opacity-100 underline underline-offset-4"
          >
            {categoryLabel}
          </Link>
          {entry.companyType && COMPANY_TYPE_META[entry.companyType] ? (
            <>
              <span aria-hidden="true">·</span>
              <Link
                href={`/articles?tab=companies&company_type=${entry.companyType}`}
                className="research-pill research-pill-blue"
              >
                {COMPANY_TYPE_META[entry.companyType].label}
              </Link>
            </>
          ) : null}
          {showTopicType ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="research-pill research-pill-accent">
                {topicTypeLabel}
              </span>
            </>
          ) : null}
          {entry.techType && TECH_TYPE_META[entry.techType] ? (
            <>
              <span aria-hidden="true">·</span>
              <Link
                href={`/articles?tab=tech&tech_type=${entry.techType}`}
                className="research-pill research-pill-accent"
              >
                {TECH_TYPE_META[entry.techType].label}
              </Link>
            </>
          ) : null}
          {entry.dateLabel || entry.date ? (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={entry.dateTimeIso || entry.date}>{entry.dateLabel || entry.date}</time>
            </>
          ) : null}
          {entry.version ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="research-pill">
                {entry.version}
              </span>
            </>
          ) : null}
          {entry.hasAssessment ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="research-pill research-pill-accent">
                测评
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
          {entry.showAssistance && assistance && !isEncrypted ? (
            <>
              <span aria-hidden="true">·</span>
              <Link href="/editorial" className="underline decoration-dotted underline-offset-4">
                协助：{entry.assistanceLabel || entry.sourceLabel || 'TUARAN'}
              </Link>
            </>
          ) : null}
          <ArticleHeaderActions
            title={entry.title}
            text={entry.summary || entry.tldr || entry.title}
            url={url}
            actionsEnabled={!isEncrypted}
            className="mt-2 sm:mt-0 sm:ml-auto lg:flex-nowrap"
          >
            <CopyMarkdownButton markdown={markdownDoc} />
            <DistributeMarkdownButton
                  title={entry.title}
                  summary={entry.tldr || entry.summary || ''}
                  markdown={markdownDoc}
                  images={entry.images || []}
                  url={url}
                  category={entry.category}
                  slug={entry.slug}
                  tags={entry.tags || []}
                  kindLabel={entry.contentTypeLabel || '文章'}
                  allowArticle
            />
            <DownloadPptButton
                  title={entry.title}
                  subtitle={entry.tldr || entry.summary || ''}
                  fileBaseName={entry.slug}
                  images={entry.images || []}
                  variants={renderedVariants.map((v) => ({ id: v.id, content: v.content }))}
            />
          </ArticleHeaderActions>
        </div>
        <h1 className="research-article-title mt-3 text-2xl leading-snug">{entry.title}</h1>
        <aside className="research-summary-box mt-4 border-l-2 px-4 py-3 text-sm leading-7">
          <AuthorByline />
          {entry.tldr ? (
            <div className="research-summary-divider mt-2 border-t pt-3">
              <span className="research-summary-label mr-2 font-mono text-[10px] uppercase tracking-[0.18em]">
                TL;DR
              </span>
              {entry.tldr}
            </div>
          ) : entry.summary ? (
            <div className="research-summary-divider mt-2 border-t pt-3">
              {entry.summary}
            </div>
          ) : null}
        </aside>
        {entry.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="research-pill px-2 py-0.5 text-[11px]"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      {showRebuttalPersonalityTest && !isEncrypted ? <RebuttalPersonalityTest /> : null}

      {showLifeTrafficTest && !isEncrypted ? <LifeTrafficTest /> : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <main className="min-w-0">
          {isEncrypted ? (
            <EncryptedArticle
              payload={entry.encryptedPayload}
              storageKey={`research-dec:${entry.category}:${entry.slug}`}
            />
          ) : (
            <RanbiPaywall resourceKey={articleKey} unitLabel="文章">
              <ResearchBody variants={renderedVariants} />
            </RanbiPaywall>
          )}

        </main>
        <ArticleEngagementPanel articleKey={articleKey} related={related} />
      </div>

      <div id="comments" className="scroll-mt-24">
        <ArticleComments articleKey={articleKey} />
      </div>
      <ArticleFooterCta />
    </div>
  )
}

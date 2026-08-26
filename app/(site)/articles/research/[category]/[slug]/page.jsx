import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'

import {
  CATEGORY_META,
  COMPANY_TYPE_META,
  RESEARCH_CATEGORIES,
  getAllResearchParams,
  getResearchEntry,
  listResearch,
  listResearchByCategory,
} from '../../../../../../lib/research/loader'
import { avatarAbsoluteUrl } from '../../../../../../lib/avatar'
import { buildArticleOgUrl } from '../../../../../../lib/articleOg'
import { buildResearchMarkdownDocument, extractToc, renderMarkdown } from '../../../../../../lib/research/markdown'
import { buildResearchShareTitle, isAShareCompanyObservation, isAShareResearchEntry, isCryptoAssetObservation } from '../../../../../../lib/research/shareTitle'
import { AUTHOR_INTRO_MARKDOWN } from '../../../../components/ArticleAuthorIntro'
import ArticleDetailHeader from '../../../../components/ArticleDetailHeader'
import ArticleComments from '../../../../components/ArticleComments'
import ContentPvBeacon from '../../../../components/ContentPvBeacon'
import ArticleFooterCta from '../../../../components/ArticleFooterCta'
import ArticleEngagementPanel from '../../../../components/ArticleEngagementPanel'
import ArticleHeaderActions from '../../../../components/ArticleHeaderActions'
import CopyMarkdownButton from './CopyMarkdownButton'
import DistributeMarkdownButton from './DistributeMarkdownButton'
import DownloadPptButton from './DownloadPptButton'
import EncryptedArticle from './EncryptedArticle'
import ResearchBody from './ResearchBody'
import RanbiPaywall from '../../../../components/RanbiPaywall'
import LifeTrafficTest from './LifeTrafficTest'
import RebuttalPersonalityTest from './RebuttalPersonalityTest'
import AShareCompanyList from './AShareCompanyList'
import aShareSnapshot from '../../../../../../data/a-shares/companies.json'
import { taxonomyForResearch } from '../../../../../../lib/contentTaxonomy'

const SITE_URL = 'https://2aran.com'
const SITE_TITLE = '涂阿燃（tuaran）的网络日志'
const AVATAR_URL = avatarAbsoluteUrl(SITE_URL)
const A_SHARE_LIST_SLUG = 'a-share-company-list'
const A_SHARE_PAGE_SIZE = 100

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
  const shareTitle = buildResearchShareTitle(entry)
  const description = entry.summary || `${CATEGORY_META[entry.category]?.label || ''}：${entry.title}`
  const isEncrypted = entry.encrypted
  const ogImage = buildArticleOgUrl({
    title: shareTitle,
    description,
    category: CATEGORY_META[entry.category]?.label || '分析',
    date: entry.date,
  })

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
      title: shareTitle,
      description,
      url,
      siteName: SITE_TITLE,
      locale: 'zh_CN',
      type: 'article',
      publishedTime: entry.dateTimeIso ? new Date(entry.dateTimeIso).toISOString() : entry.date ? new Date(entry.date).toISOString() : undefined,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${shareTitle} 分享卡片` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      images: [ogImage],
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
  const isAShareCompanyList = entry.category === 'companies' && entry.slug === A_SHARE_LIST_SLUG
  const assistance = entry.assistance || entry.source || ''
  const variantList = isEncrypted ? [] : Array.isArray(entry.variants) && entry.variants.length > 0
    ? entry.variants
    : [{ id: assistance || 'claude-code', label: '', content: entry.content }]
  const renderedVariants = isEncrypted || isAShareCompanyList
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
  const markdownDoc = isEncrypted || isAShareCompanyList ? '' : buildResearchMarkdownDocument(entry.content, {
    images: entry.images || [],
    seed: `${entry.category}:${entry.slug}:${variantList[0]?.id || assistance || 'assistance'}`,
    title: entry.title,
    intro: AUTHOR_INTRO_MARKDOWN,
  })
  const xArticleHtml = markdownDoc ? renderMarkdown(markdownDoc) : ''
  const categoryLabel = entry.contentTypeLabel || CATEGORY_META[entry.category]?.label || entry.category
  const isAShareResearch = isAShareResearchEntry(entry)
  const isCryptoResearch = isCryptoAssetObservation(entry)
  const categoryHref = isAShareResearch
    ? '/a-share-research'
    : isCryptoResearch
      ? '/crypto-research'
    : entry.contentType === 'engineering_case'
    ? '/articles?tab=engineering-cases'
    : entry.contentType === 'build_log'
      ? '/articles?tab=build-logs'
      : entry.category === 'topics'
    ? entry.topicType === 'tech'
      ? '/articles?tab=tech'
      : '/articles?tab=other'
    : `/articles?tab=${entry.category}`
  const url = `${SITE_URL}/articles/research/${entry.category}/${entry.slug}`
  const shareTitle = buildResearchShareTitle(entry)
  const shareText = isAShareCompanyObservation(entry)
    ? shareTitle
    : entry.summary || entry.tldr || entry.title
  const articleKey = `research:${entry.category}:${entry.slug}`
  const showLifeTrafficTest = entry.category === 'topics' && entry.slug === 'lifetime-human-attention-traffic-pv-uv'
  const showRebuttalPersonalityTest = entry.category === 'topics' && entry.slug === 'rebuttal-personality-communication-pattern'
  const companyListHeading = '\n## 公司名单\n'
  const companyListFooterHeading = '\n## 信息来源与说明\n'
  const companyListStart = isAShareCompanyList ? entry.content.indexOf(companyListHeading) : -1
  const companyListFooterStart = isAShareCompanyList ? entry.content.indexOf(companyListFooterHeading) : -1
  const companyListIntro = isAShareCompanyList && companyListStart >= 0
    ? entry.content.slice(0, companyListStart)
    : ''
  const companyListFooter = isAShareCompanyList && companyListFooterStart >= 0
    ? entry.content.slice(companyListFooterStart)
    : ''
  const initialCompanyPage = isAShareCompanyList
    ? {
        page: 1,
        pageSize: A_SHARE_PAGE_SIZE,
        total: aShareSnapshot.companies.length,
        totalPages: Math.ceil(aShareSnapshot.companies.length / A_SHARE_PAGE_SIZE),
        companies: aShareSnapshot.companies.slice(0, A_SHARE_PAGE_SIZE),
      }
    : null

  // 相关阅读：同 category 其它条目，最近 3 篇
  const relatedPool = listResearchByCategory(entry.category).filter((e) => e.slug !== entry.slug)
  const related =
    isAShareResearch
      ? relatedPool.filter(isAShareCompanyObservation).slice(0, 3)
      : entry.category === 'companies'
      ? [
          ...relatedPool.filter((e) => !isAShareResearchEntry(e) && entry.companyType && e.companyType === entry.companyType),
          ...relatedPool.filter((e) => !isAShareResearchEntry(e) && (!entry.companyType || e.companyType !== entry.companyType)),
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

      <ArticleDetailHeader
        taxonomy={taxonomyForResearch(entry)}
        categoryHref={categoryHref}
        categoryLabel={isAShareResearch ? 'A股调研' : isCryptoResearch ? '加密调研' : categoryLabel}
        dateLabel={entry.dateLabel || entry.date}
        dateTime={entry.dateTimeIso || entry.date}
        readingMinutes={entry.readingMinutes}
        pvNode={(
          <ContentPvBeacon
            category={entry.category}
            slug={entry.slug}
            display
            initialPv={entry.pv}
          />
        )}
        metaExtras={(
          <>
          {!isAShareResearch && entry.companyType && COMPANY_TYPE_META[entry.companyType] ? (
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
          {entry.reviewReady ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="research-pill research-pill-accent">
                编辑精选
              </span>
            </>
          ) : null}
          {entry.showAssistance && assistance && !isEncrypted ? (
            <>
              <span aria-hidden="true">·</span>
              <Link href="/help#editorial" className="underline decoration-dotted underline-offset-4">
                协助：{entry.assistanceLabel || entry.sourceLabel || 'TUARAN'}
              </Link>
            </>
          ) : null}
          </>
        )}
        ownerMeta={{
          author: 'TUARAN',
          assistance: entry.assistance,
          assistanceLabel: entry.assistanceLabel,
          model: entry.model,
          version: entry.version,
        }}
        actions={(
          <ArticleHeaderActions
            title={shareTitle}
            text={shareText}
            url={url}
            actionsEnabled={!isEncrypted}
            className="mt-2 sm:mt-0 sm:ml-auto lg:flex-nowrap"
          >
            {!isAShareCompanyList ? <>
              <CopyMarkdownButton markdown={markdownDoc} html={xArticleHtml} />
              <DistributeMarkdownButton
                  title={entry.title}
                  summary={entry.tldr || entry.summary || ''}
                  markdown={markdownDoc}
                  html={xArticleHtml}
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
            </> : null}
          </ArticleHeaderActions>
        )}
        title={entry.title}
        summary={entry.tldr || entry.summary}
        summaryLabel={entry.tldr ? 'TL;DR' : ''}
        tags={entry.tags || []}
      />

      {showRebuttalPersonalityTest && !isEncrypted ? <RebuttalPersonalityTest /> : null}

      {showLifeTrafficTest && !isEncrypted ? <LifeTrafficTest /> : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <main className="min-w-0">
          {isEncrypted ? (
            <EncryptedArticle
              payload={entry.encryptedPayload}
              storageKey={`research-dec:${entry.category}:${entry.slug}`}
            />
          ) : isAShareCompanyList ? (
            <AShareCompanyList
              introHtml={renderMarkdown(companyListIntro)}
              footerHtml={renderMarkdown(companyListFooter)}
              initialPage={initialCompanyPage}
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

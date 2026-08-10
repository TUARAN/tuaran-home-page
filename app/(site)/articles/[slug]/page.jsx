import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Script from 'next/script'
import { articles } from '../articlesData'
import ArticleDetailHeader from '../../components/ArticleDetailHeader'
import ArticleHeaderActions from '../../components/ArticleHeaderActions'
import ArticleComments from '../../components/ArticleComments'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import ArticleFooterCta from '../../components/ArticleFooterCta'
import ArticleEngagementPanel from '../../components/ArticleEngagementPanel'
import ArticleToc from '../../components/ArticleToc'
import DistributeContentButton from '../../components/DistributeContentButton'
import CopyMarkdownButton from '../research/[category]/[slug]/CopyMarkdownButton'
import { RESEARCH_ARTICLE_REDIRECTS } from '../../../../lib/research/catalog'
import { getPublishedArticlePostBySlug } from '../../../../lib/articlePosts'
import { buildArticleOgUrl } from '../../../../lib/articleOg'
import { extractToc, renderMarkdown } from '../../../../lib/research/markdown'
import PublishedArticle from './PublishedArticle'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const dynamicParams = true

const SITE_URL = 'https://2aran.com'
const SITE_TITLE = '涂阿燃（tuaran）的网络日志'

function toIsoDate(dateString) {
  const parsed = Date.parse(dateString)
  if (Number.isNaN(parsed)) return null
  return new Date(parsed).toISOString()
}

function isExternalHref(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function parseMarkdownImage(text) {
  if (typeof text !== 'string') return null
  const trimmed = text.trim()
  const match = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/.exec(trimmed)
  if (!match) return null
  const alt = match[1] || ''
  const src = match[2]
  return { alt, src }
}

function renderInlineBold(text) {
  if (typeof text !== 'string' || !text.includes('**')) return text

  const nodes = []
  let lastIndex = 0
  const regex = /\*\*([^*]+)\*\*/g
  let match

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index
    const before = text.slice(lastIndex, matchIndex)
    if (before) nodes.push(before)

    const boldText = match[1]
    nodes.push(
      <strong key={`b-${matchIndex}`} className="font-semibold">
        {boldText}
      </strong>
    )

    lastIndex = matchIndex + match[0].length
  }

  const after = text.slice(lastIndex)
  if (after) nodes.push(after)

  return nodes.length ? nodes : text
}

function articleContentToMarkdown(article, articleUrl) {
  if (article.markdown) return article.markdown
  const parts = [`# ${article.title}`]
  if (article.summary) parts.push(article.summary)
  const body = (article.content || [])
    .map((item) => {
      if (!item) return ''
      if (typeof item === 'string') return item
      if (item.date) return `## ${item.label || item.date}\n\n${item.date}`
      if (item.heading) return `## ${item.heading}`
      return ''
    })
    .filter(Boolean)
    .join('\n\n')
  if (body) parts.push(body)
  if (article.sourceUrl) parts.push(`同步来源：${article.sourceUrl}`)
  else if (article.href) parts.push(`原文：${article.href}`)
  else parts.push(`原文：${articleUrl}`)
  return parts.join('\n\n')
}

function normalizeArticleMarkdown(markdown) {
  return String(markdown || '').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
}

function readingMinutes(text) {
  const length = String(text || '').replace(/\s+/g, '').length
  return Math.max(1, Math.ceil(length / 500))
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params
  const article = articles.find((item) => item.slug === resolvedParams.slug)
  const researchRedirect = !article ? RESEARCH_ARTICLE_REDIRECTS[resolvedParams.slug] : null
  const publishedArticle = !article && !researchRedirect
    ? await getPublishedArticlePostBySlug(resolvedParams.slug)
    : null

  if (!article && !researchRedirect && !publishedArticle) {
    return {
      title: `文章未找到 · ${SITE_TITLE}`,
      robots: { index: false, follow: false },
    }
  }

  if (researchRedirect) {
    return {
      title: `分析文章 · ${SITE_TITLE}`,
      alternates: { canonical: `${SITE_URL}${researchRedirect}` },
      robots: { index: false, follow: true },
    }
  }

  if (publishedArticle) {
    const url = `${SITE_URL}/articles/${publishedArticle.slug}`
    const description = publishedArticle.summary || publishedArticle.contentText.slice(0, 160)
    const ogImage = buildArticleOgUrl({
      title: publishedArticle.title,
      description,
      category: '文章',
      date: publishedArticle.publishedAt
        ? new Date(publishedArticle.publishedAt).toISOString().slice(0, 10)
        : '',
    })
    const publishedTime = publishedArticle.publishedAt
      ? new Date(publishedArticle.publishedAt).toISOString()
      : undefined
    return {
      title: publishedArticle.title,
      description,
      alternates: { canonical: url },
      robots: { index: true, follow: true },
      openGraph: {
        title: publishedArticle.title,
        description,
        url,
        siteName: SITE_TITLE,
        locale: 'zh_CN',
        type: 'article',
        publishedTime,
        images: [{ url: ogImage, width: 1200, height: 630, alt: `${publishedArticle.title} 分享卡片` }],
      },
      twitter: {
        card: 'summary_large_image',
        title: publishedArticle.title,
        description,
        images: [ogImage],
      },
    }
  }

  const url = `${SITE_URL}/articles/${article.slug}`
  const title = article.title
  const description = article.summary
  const publishedTime = toIsoDate(article.date)
  const ogImage = buildArticleOgUrl({
    title,
    description,
    category: article.homeCategory || '文章',
    date: article.date,
  })

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    keywords: ['涂阿燃', 'tuaran', '掘金安东尼', '安东尼404', 'SEO', '个人博客', title],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_TITLE,
      locale: 'zh_CN',
      type: 'article',
      publishedTime: publishedTime || undefined,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${article.title} 分享卡片` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function ArticleDetailPage({ params }) {
  const resolvedParams = await params
  const article = articles.find((item) => item.slug === resolvedParams.slug)
  const researchRedirect = !article ? RESEARCH_ARTICLE_REDIRECTS[resolvedParams.slug] : null

  if (researchRedirect) {
    redirect(researchRedirect)
  }

  if (!article) {
    const publishedArticle = await getPublishedArticlePostBySlug(resolvedParams.slug)
    if (publishedArticle) return <PublishedArticle article={publishedArticle} siteUrl={SITE_URL} />
  }

  if (!article) {
    notFound()
  }

  const articleUrl = `${SITE_URL}/articles/${article.slug}`
  const articleMarkdown = articleContentToMarkdown(article, articleUrl)
  const xArticleHtml = renderMarkdown(articleMarkdown, {
    images: article.cover ? [{ src: article.cover, alt: `${article.title} 封面` }] : [],
    seed: `article:${article.slug}`,
    title: article.title,
  })
  const articleMarkdownHtml = article.markdown
    ? renderMarkdown(normalizeArticleMarkdown(article.markdown), { seed: `article:${article.slug}`, title: article.title })
    : ''
  const publishedTime = toIsoDate(article.date)
  const enableDiaryToc = article.slug === 'diary-self-reflection'
  const tocItems = article.markdown ? extractToc(normalizeArticleMarkdown(article.markdown)) : []

  if (!article.markdown) {
    article.content.forEach((paragraph, idx) => {
      const isDateString = typeof paragraph === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(paragraph.trim())
      const isDateObject = paragraph && typeof paragraph === 'object' && paragraph.date

      if (isDateString || isDateObject) {
        const date = isDateObject ? paragraph.date : paragraph.trim()
        const label = isDateObject ? paragraph.label : ''
        const id = `section-${date}-${idx}`
        tocItems.push({ date, label: label || date, id })
      } else if (paragraph && typeof paragraph === 'object' && paragraph.heading) {
        tocItems.push({ text: paragraph.heading, id: `section-content-${idx}` })
      }
    })
  }

  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary,
    image: article.cover ? [article.cover] : undefined,
    datePublished: publishedTime || undefined,
    dateModified: publishedTime || undefined,
    author: {
      '@type': 'Person',
      name: '涂阿燃',
      alternateName: ['tuaran', '掘金安东尼', '安东尼404'],
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: '涂阿燃',
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:py-8">
      <Script id={`article-jsonld-${article.slug}`} type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(articleStructuredData)}
      </Script>

      <ArticleDetailHeader
        categoryHref="/articles?tab=posts"
        categoryLabel="精选文章"
        dateLabel={article.date}
        dateTime={publishedTime || article.date}
        readingMinutes={readingMinutes(articleMarkdown)}
        pvNode={<ContentPvBeacon category="article" slug={article.slug} display />}
        ownerMeta={{ author: '涂阿燃（TUARAN）' }}
        metaExtras={article.sourceUrl || isExternalHref(article.href) ? (
          <>
            <span aria-hidden="true">·</span>
            <a
              href={article.sourceUrl || article.href}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              {article.sourceUrl ? '同步来源' : '原文'}
            </a>
          </>
        ) : null}
        actions={(
          <ArticleHeaderActions
            title={article.title}
            text={article.summary}
            url={articleUrl}
            className="mt-2 sm:ml-auto sm:mt-0 lg:flex-nowrap"
          >
            <CopyMarkdownButton markdown={articleMarkdown} html={xArticleHtml} />
            <DistributeContentButton
              title={article.title}
              summary={article.summary}
              markdown={articleMarkdown}
              html={xArticleHtml}
              images={article.cover ? [article.cover] : []}
              url={articleUrl}
              category="article"
              slug={article.slug}
              tags={article.tags || []}
              kindLabel="文章"
              allowArticle
            />
          </ArticleHeaderActions>
        )}
        title={article.title}
        summary={article.summary}
        summaryLabel="TL;DR"
        tags={article.tags || []}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <main className="min-w-0">
      {enableDiaryToc ? (
        <>
          <div className="min-w-0 flex flex-col gap-6 md:flex-row">
            <ArticleToc items={tocItems} title="目录" />

            <div className="min-w-0 flex-1">
              {article.cover ? (
                <div className="mb-8 max-w-3xl mx-auto">
                  <Image
                    src={article.cover}
                    alt={`${article.title} 封面`}
                    width={800}
                    height={533}
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="w-full h-auto border border-[#eee] dark:border-gray-800 bg-white dark:bg-gray-900"
                  />
                </div>
              ) : null}

              <article className="prose-tuaran">
                {articleMarkdownHtml ? <div dangerouslySetInnerHTML={{ __html: articleMarkdownHtml }} /> : article.content.map((paragraph, idx) => {
          // 支持两种日期写法：
          // 1）纯字符串日期：'2026-01-05'
          // 2）对象：{ date: '2026-01-05', label: '小标题' }
          const isDateString =
            typeof paragraph === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(paragraph.trim())
          const isDateObject = paragraph && typeof paragraph === 'object' && paragraph.date

          if (isDateString || isDateObject) {
            const date = isDateObject ? paragraph.date : paragraph.trim()
            const label = isDateObject ? paragraph.label : ''
            const id = `section-${date}-${idx}`

            return (
              <div key={`${idx}-${date}-${label || 'no-label'}`} id={id} className="mt-10 mb-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="m-0 text-lg sm:text-xl font-semibold text-[#444] dark:text-gray-200 leading-snug scroll-mt-24">
                    {label || date}
                  </h2>
                  <span className="text-[#999] dark:text-gray-500" aria-hidden="true">·</span>
                  <time className="text-base text-[#999] dark:text-gray-400" dateTime={date}>
                    {date}
                  </time>
                </div>
              </div>
            )
          }

          if (paragraph && typeof paragraph === 'object' && paragraph.heading) {
            return <h2 key={`${idx}-${paragraph.heading}`} id={`section-content-${idx}`} className="mt-10 mb-4 scroll-mt-24 text-xl font-semibold text-[#444] dark:text-gray-200 leading-snug">{paragraph.heading}</h2>
          }

          const image = parseMarkdownImage(paragraph)
          if (image) {
            return (
              <figure key={`${idx}-${image.src}`} className="my-6">
                <Image
                  src={image.src}
                  alt={image.alt || `${article.title} 配图`}
                  width={1200}
                  height={675}
                  sizes="(max-width: 768px) 100vw, 768px"
                  unoptimized
                  className="w-full h-auto border border-[#eee] dark:border-gray-800 bg-white dark:bg-gray-900"
                />
              </figure>
            )
          }

          return <p key={`${idx}-${paragraph}`}>{renderInlineBold(paragraph)}</p>
                })}
              </article>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="min-w-0 flex flex-col gap-6 md:flex-row">
            <ArticleToc items={tocItems} />
            <div className="min-w-0 flex-1">
          {article.cover ? (
            <div className="mb-8 max-w-3xl mx-auto">
              <Image
                src={article.cover}
                alt={`${article.title} 封面`}
                width={800}
                height={533}
                sizes="(max-width: 768px) 100vw, 768px"
                className="w-full h-auto border border-[#eee] dark:border-gray-800 bg-white dark:bg-gray-900"
              />
            </div>
          ) : null}

          <article className="prose-tuaran">
            {articleMarkdownHtml ? <div dangerouslySetInnerHTML={{ __html: articleMarkdownHtml }} /> : article.content.map((paragraph, idx) => {
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
                  <div key={`${idx}-${date}-${label || 'no-label'}`} id={`section-${date}-${idx}`} className="mt-10 mb-4 scroll-mt-24">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h2 className="m-0 text-lg sm:text-xl font-semibold text-[#444] dark:text-gray-200 leading-snug scroll-mt-24">
                        {label || date}
                      </h2>
                      <span className="text-[#999] dark:text-gray-500" aria-hidden="true">
                        ·
                      </span>
                      <time className="text-base text-[#999] dark:text-gray-400" dateTime={date}>
                        {date}
                      </time>
                    </div>
                  </div>
                )
              }

              if (paragraph && typeof paragraph === 'object' && paragraph.heading) {
                return <h2 key={`${idx}-${paragraph.heading}`} id={`section-content-${idx}`} className="mt-10 mb-4 scroll-mt-24 text-xl font-semibold text-[#444] dark:text-gray-200 leading-snug">{paragraph.heading}</h2>
              }

              const image = parseMarkdownImage(paragraph)
              if (image) {
                return (
                  <figure key={`${idx}-${image.src}`} className="my-6">
                    <Image
                      src={image.src}
                      alt={image.alt || `${article.title} 配图`}
                      width={1200}
                      height={675}
                      sizes="(max-width: 768px) 100vw, 768px"
                      unoptimized
                      className="w-full h-auto border border-[#eee] dark:border-gray-800 bg-white dark:bg-gray-900"
                    />
                  </figure>
                )
              }

              return <p key={`${idx}`}>{renderInlineBold(paragraph)}</p>
            })}
          </article>
            </div>
          </div>
        </>
      )}
        </main>
        <ArticleEngagementPanel articleKey={`article:${article.slug}`} />
      </div>

      <div id="comments" className="scroll-mt-24">
        <ArticleComments articleKey={`article:${article.slug}`} />
      </div>
      <ArticleFooterCta />
    </div>
  )
}

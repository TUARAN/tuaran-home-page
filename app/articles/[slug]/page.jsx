import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { articles } from '../articlesData'
import ArticleFooterCta from '../../components/ArticleFooterCta'

export const dynamic = 'force-static'
export const dynamicParams = false

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

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params
  const article = articles.find((item) => item.slug === resolvedParams.slug)

  if (!article) {
    return {
      title: `文章未找到 · ${SITE_TITLE}`,
      robots: { index: false, follow: false },
    }
  }

  const url = `${SITE_URL}/articles/${article.slug}`
  const title = article.title
  const description = article.summary
  const publishedTime = toIsoDate(article.date)

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
      images: article.cover
        ? [{ url: article.cover, alt: `${article.title} 封面` }]
        : [{ url: `${SITE_URL}/tuaranme.png`, width: 512, height: 512, alt: '涂阿燃（掘金安东尼）头像' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [article.cover || `${SITE_URL}/tuaranme.png`],
    },
  }
}

export default async function ArticleDetailPage({ params }) {
  const resolvedParams = await params
  const article = articles.find((item) => item.slug === resolvedParams.slug)

  if (!article) {
    notFound()
  }

  const articleUrl = `${SITE_URL}/articles/${article.slug}`
  const publishedTime = toIsoDate(article.date)
  const enableDiaryToc = article.slug === 'diary-self-reflection'
  const tocItems = []

  if (enableDiaryToc) {
    article.content.forEach((paragraph, idx) => {
      const isDateString = typeof paragraph === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(paragraph.trim())
      const isDateObject = paragraph && typeof paragraph === 'object' && paragraph.date

      if (isDateString || isDateObject) {
        const date = isDateObject ? paragraph.date : paragraph.trim()
        const label = isDateObject ? paragraph.label : ''
        const id = `section-${date}-${idx}`
        tocItems.push({ date, label: label || date, id })
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Script id={`article-jsonld-${article.slug}`} type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(articleStructuredData)}
      </Script>

      {enableDiaryToc ? (
        <>
          <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl text-[#444] dark:text-gray-200 leading-snug">{article.title}</h1>
                <p className="text-sm text-[#666] dark:text-gray-300 mt-3 leading-relaxed">{article.summary}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#666] dark:text-gray-300">
                  <Link href="/articles" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                    返回列表
                  </Link>
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
            </div>
          </header>

          <div className="flex flex-col gap-6 md:flex-row">
            {tocItems.length > 1 ? (
              <aside className="hidden md:block md:w-52 shrink-0">
                <nav className="toc-scroll-panel">
                  <div className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">
                    目录
                  </div>
                  <ul className="text-sm text-[#666] space-y-2 dark:text-gray-300">
                    {tocItems.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="font-bold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
            ) : null}

            <main className="flex-1 min-w-0">
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
            </main>
          </div>
        </>
      ) : (
        <>
          <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="mt-2 text-2xl text-[#444] dark:text-gray-200 leading-snug">{article.title}</h1>
                <div className="mt-2 text-sm text-[#999] dark:text-gray-400">{article.date}</div>
                <p className="text-sm text-[#666] dark:text-gray-300 mt-3 leading-relaxed">{article.summary}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#666] dark:text-gray-300">
                  <Link href="/articles" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                    返回列表
                  </Link>
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
            </div>
          </header>

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
                  <div key={`${idx}-${date}-${label || 'no-label'}`} className="mt-10 mb-4">
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
        </>
      )}

      <ArticleFooterCta />
    </div>
  )
}

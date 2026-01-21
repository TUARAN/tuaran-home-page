import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { articles } from '../articlesData'
import SettingsButton from '../../components/SettingsButton'

export const dynamic = 'force-static'

const SITE_URL = 'https://tuaran.me'
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Script id={`article-jsonld-${article.slug}`} type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(articleStructuredData)}
      </Script>
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs text-[#999] dark:text-gray-400">{article.date}</div>
            <h1 className="mt-2 text-2xl text-[#444] dark:text-gray-200 leading-snug">{article.title}</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-3 leading-relaxed">{article.summary}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#666] dark:text-gray-300">
              <Link
                href="/articles"
                className="opacity-80 hover:opacity-100 underline underline-offset-4"
              >
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
          <SettingsButton />
        </div>
      </header>

      {article.cover ? (
        <div className="mb-8">
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
                  <time className="text-sm text-[#999] dark:text-gray-400" dateTime={date}>
                    {date}
                  </time>
                  <span className="text-[#999] dark:text-gray-500" aria-hidden="true">·</span>
                  <h2 className="m-0 text-xl sm:text-2xl font-semibold text-[#444] dark:text-gray-200 leading-snug scroll-mt-24">
                    {label || date}
                  </h2>
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
    </div>
  )
}

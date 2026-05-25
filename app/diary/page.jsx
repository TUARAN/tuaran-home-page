import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import { articles } from '../articles/articlesData'

export const dynamic = 'force-static'

const SITE_URL = 'https://2aran.com'
const SITE_TITLE = '涂阿燃（tuaran）的网络日志'
const DIARY_SLUG = 'diary-self-reflection'
const DEFAULT_DIARY_CATEGORY = '未分类'

function toIsoDate(dateString) {
  const parsed = Date.parse(dateString)
  if (Number.isNaN(parsed)) return null
  return new Date(parsed).toISOString()
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

function parseMarkdownBlockquote(text) {
  if (typeof text !== 'string') return null
  const trimmed = text.trim()
  const match = /^>\s?(.*)$/.exec(trimmed)
  if (!match) return null
  return match[1]
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

export function generateMetadata() {
  const diary = articles.find((item) => item.slug === DIARY_SLUG)

  if (!diary) {
    return {
      title: `浮生日记 · ${SITE_TITLE}`,
      robots: { index: false, follow: false },
    }
  }

  return {
    title: diary.title,
    description: diary.summary,
    alternates: {
      canonical: '/diary',
    },
    keywords: ['涂阿燃', 'tuaran', '浮生日记', '连载', '生活记录', '个人博客'],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    openGraph: {
      title: diary.title,
      description: diary.summary,
      url: `${SITE_URL}/diary`,
      siteName: SITE_TITLE,
      locale: 'zh_CN',
      type: 'article',
      publishedTime: toIsoDate(diary.date) || undefined,
      images: diary.cover
        ? [{ url: diary.cover, alt: `${diary.title} 封面` }]
        : [{ url: `${SITE_URL}/tuaranme.png`, width: 512, height: 512, alt: '涂阿燃头像' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: diary.title,
      description: diary.summary,
      images: [diary.cover || `${SITE_URL}/tuaranme.png`],
    },
  }
}

export default function DiaryPage() {
  const diary = articles.find((item) => item.slug === DIARY_SLUG)

  if (!diary) {
    notFound()
  }

  const tocItems = []
  diary.content.forEach((paragraph, idx) => {
    const isDateString = typeof paragraph === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(paragraph.trim())
    const isDateObject = paragraph && typeof paragraph === 'object' && paragraph.date

    if (isDateString || isDateObject) {
      const date = isDateObject ? paragraph.date : paragraph.trim()
      const label = isDateObject ? paragraph.label : ''
      const category = isDateObject ? paragraph.category || DEFAULT_DIARY_CATEGORY : DEFAULT_DIARY_CATEGORY
      const id = `section-${date}-${idx}`
      tocItems.push({ date, label: label || date, category, id })
    }
  })
  const categoryGroups = tocItems.reduce((groups, item) => {
    const key = item.category || DEFAULT_DIARY_CATEGORY
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
    return groups
  }, {})
  const categoryItems = Object.entries(categoryGroups).map(([category, entries]) => ({
    category,
    count: entries.length,
    entries,
  }))

  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: diary.title,
    description: diary.summary,
    image: diary.cover ? [diary.cover] : undefined,
    datePublished: toIsoDate(diary.date) || undefined,
    dateModified: toIsoDate(diary.date) || undefined,
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
      '@id': `${SITE_URL}/diary`,
    },
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Script id="diary-jsonld" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(articleStructuredData)}
      </Script>

      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl text-[#444] dark:text-gray-200 leading-snug">{diary.title}</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-3 leading-relaxed">{diary.summary}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#666] dark:text-gray-300">
              <Link href="/articles" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                返回列表
              </Link>
            </div>
            {categoryItems.length ? (
              <div className="mt-5 border-t border-[#eee] pt-4 dark:border-gray-800">
                <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#a09176] dark:text-[#8e9ab0]">
                  Topics · 主题分类
                </p>
                <div className="flex flex-wrap gap-2">
                  {categoryItems.map((item) => (
                    <a
                      key={item.category}
                      href={`#diary-category-${encodeURIComponent(item.category)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#ddd8cb] bg-white/70 px-3 py-1 text-xs text-[#5f5a4d] no-underline transition-colors hover:border-[#b8aa90] hover:text-[#2d261d] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300 dark:hover:border-[#566174] dark:hover:text-gray-100"
                    >
                      <span>{item.category}</span>
                      <span className="text-[#aaa] dark:text-gray-500">{item.count}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6 md:flex-row">
        {tocItems.length > 1 ? (
          <aside className="hidden md:block md:w-52 shrink-0">
            <nav className="toc-scroll-panel">
              <div className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">
                主题
              </div>
              <div className="space-y-4 text-sm text-[#666] dark:text-gray-300">
                {categoryItems.map((group) => (
                  <section key={group.category} id={`diary-category-${group.category}`}>
                    <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-[#8a7c64] dark:text-[#9aa6b8]">
                      <span>{group.category}</span>
                      <span className="font-mono text-[10px] text-[#bbb] dark:text-gray-600">{group.count}</span>
                    </div>
                    <ul className="space-y-2">
                      {group.entries.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            className="text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                          >
                            {item.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </nav>
          </aside>
        ) : null}

        <main className="flex-1 min-w-0">
          {diary.cover ? (
            <div className="mb-8 max-w-3xl mx-auto">
              <Image
                src={diary.cover}
                alt={`${diary.title} 封面`}
                width={800}
                height={533}
                sizes="(max-width: 768px) 100vw, 768px"
                className="w-full h-auto border border-[#eee] dark:border-gray-800 bg-white dark:bg-gray-900"
              />
            </div>
          ) : null}

          <article className="prose-tuaran">
            {diary.content.map((paragraph, idx) => {
              const isDateString = typeof paragraph === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(paragraph.trim())
              const isDateObject = paragraph && typeof paragraph === 'object' && paragraph.date

              if (isDateString || isDateObject) {
                const date = isDateObject ? paragraph.date : paragraph.trim()
                const label = isDateObject ? paragraph.label : ''
                const category = isDateObject ? paragraph.category : ''
                const id = `section-${date}-${idx}`

                return (
                  <div
                    key={`${idx}-${date}-${label || 'no-label'}`}
                    id={id}
                    className="mt-10 mb-4"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h2 className="m-0 text-lg sm:text-xl font-semibold text-[#444] dark:text-gray-200 leading-snug">
                        {label || date}
                      </h2>
                      <span className="text-[#999] dark:text-gray-500" aria-hidden="true">·</span>
                      <time className="text-base text-[#999] dark:text-gray-400" dateTime={date}>
                        {date}
                      </time>
                      {category ? (
                        <span className="inline-flex items-center rounded-full border border-[#ddd8cb] bg-white/70 px-2 py-[1px] text-[11px] text-[#5f5a4d] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300">
                          {category}
                        </span>
                      ) : null}
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
                      alt={image.alt || `${diary.title} 配图`}
                      width={1200}
                      height={675}
                      sizes="(max-width: 768px) 100vw, 768px"
                      unoptimized
                      className="w-full h-auto border border-[#eee] dark:border-gray-800 bg-white dark:bg-gray-900"
                    />
                  </figure>
                )
              }

              const blockquote = parseMarkdownBlockquote(paragraph)
              if (blockquote) {
                return <blockquote key={`${idx}-${blockquote}`}>{renderInlineBold(blockquote)}</blockquote>
              }

              return <p key={`${idx}-${paragraph}`}>{renderInlineBold(paragraph)}</p>
            })}
          </article>
        </main>
      </div>
    </div>
  )
}

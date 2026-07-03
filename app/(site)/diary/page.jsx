import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import { articles } from '../articles/articlesData'
import { YEAR_SUMMARY_ARTICLES, YEAR_SUMMARY_COLUMN } from '../articles/year-summary/yearSummaryData'
import { avatarAbsoluteUrl } from '../../../lib/avatar'

export const dynamic = 'force-static'

const SITE_URL = 'https://2aran.com'
const AVATAR_URL = avatarAbsoluteUrl(SITE_URL)
const SITE_TITLE = '涂阿燃（tuaran）的网络日志'
const DIARY_SLUG = 'diary-self-reflection'
const numberFormatter = new Intl.NumberFormat('zh-CN')

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

function normalizeDiaryLabel(label) {
  if (typeof label !== 'string') return ''
  const trimmed = label.trim()
  if (!trimmed) return ''
  if (/^感悟\s*\d+$/i.test(trimmed)) return ''
  return trimmed
}

function formatNumber(value) {
  return numberFormatter.format(value)
}

function formatDate(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  return `${year}.${month}.${day}`
}

function getMonthDay(value) {
  if (!value) return ''
  const [, month, day] = value.split('-')
  return `${month}/${day}`
}

function isDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
}

function isDateObject(value) {
  return value && typeof value === 'object' && value.date
}

function buildDiaryEntries(content) {
  const entries = []
  let current = null

  content.forEach((paragraph, idx) => {
    if (isDateString(paragraph) || isDateObject(paragraph)) {
      const date = isDateObject(paragraph) ? paragraph.date : paragraph.trim()
      const label = isDateObject(paragraph) ? normalizeDiaryLabel(paragraph.label) : ''

      current = {
        id: `diary-${date}-${idx}`,
        kind: 'diary',
        date,
        label: label || date,
        category: isDateObject(paragraph) ? paragraph.category || '日记' : '日记',
        blocks: [],
        index: idx,
      }
      entries.push(current)
      return
    }

    if (!current) {
      current = {
        id: `diary-untitled-${idx}`,
        kind: 'diary',
        date: '',
        label: '浮生日记',
        category: '日记',
        blocks: [],
        index: idx,
      }
      entries.push(current)
    }

    current.blocks.push(paragraph)
  })

  return entries
}

function buildTimelineEntries(diary) {
  const diaryEntries = buildDiaryEntries(diary.content)
  const yearSummaryEntries = YEAR_SUMMARY_ARTICLES.map((article, idx) => ({
    id: `year-summary-${article.id}`,
    kind: 'year-summary',
    date: article.date,
    label: article.title,
    category: article.phase,
    article,
    index: 10000 + idx,
  }))

  return [...diaryEntries, ...yearSummaryEntries].sort((a, b) => {
    const byDate = (b.date || '').localeCompare(a.date || '')
    if (byDate !== 0) return byDate
    return a.index - b.index
  })
}

function groupTimelineByYear(entries) {
  const grouped = new Map()
  entries.forEach((entry) => {
    const year = entry.date ? entry.date.slice(0, 4) : '未归档'
    if (!grouped.has(year)) grouped.set(year, [])
    grouped.get(year).push(entry)
  })
  return Array.from(grouped.entries()).map(([year, items]) => ({ year, items }))
}

function renderInlineBold(text) {
  if (typeof text !== 'string' || (!text.includes('**') && !text.includes(']('))) return text

  const nodes = []
  let lastIndex = 0
  const regex = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g
  let match

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index
    const before = text.slice(lastIndex, matchIndex)
    if (before) nodes.push(before)

    if (match[1]) {
      nodes.push(
        <strong key={`b-${matchIndex}`} className="font-semibold">
          {match[1]}
        </strong>
      )
    } else {
      nodes.push(
        <a
          key={`a-${matchIndex}`}
          href={match[3]}
          target="_blank"
          rel="noreferrer"
          className="text-[#7a5a1f] underline underline-offset-4 hover:text-[#15140f] dark:text-[#d7a85c] dark:hover:text-gray-100"
        >
          {match[2]}
        </a>
      )
    }

    lastIndex = matchIndex + match[0].length
  }

  const after = text.slice(lastIndex)
  if (after) nodes.push(after)

  return nodes.length ? nodes : text
}

function TimelineToc({ groups }) {
  return (
    <nav className="toc-scroll-panel" aria-label="浮生日记时间线目录">
      <div className="text-sm font-bold border-b border-[#eee] pb-2 mb-3 dark:border-gray-800 dark:text-gray-200">
        时间线目录
      </div>
      <div className="space-y-4 text-sm text-[#666] dark:text-gray-300">
        {groups.map((group) => (
          <div key={group.year}>
            <a
              href={`#year-${group.year}`}
              className="font-mono text-sm font-semibold text-[#7a5a1f] hover:underline dark:text-[#d7a85c]"
            >
              {group.year}
            </a>
            <ul className="mt-2 space-y-1.5">
              {group.items.map((item) => (
                <li key={`toc-${item.id}`}>
                  <a
                    href={`#${item.id}`}
                    className="block truncate text-[#444] opacity-90 hover:opacity-100 hover:text-[#7a5a1f] dark:text-gray-200 dark:hover:text-[#d7a85c]"
                  >
                    <span className="font-mono text-xs text-[#999] dark:text-gray-500">{getMonthDay(item.date)}</span>{' '}
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-5 border-t border-[#eee] pt-4 text-xs leading-5 text-[#777] dark:border-gray-800 dark:text-gray-400">
        年中年终总结已并入浮生日记，共 {YEAR_SUMMARY_ARTICLES.length} 篇外部原文。
      </div>
    </nav>
  )
}

function YearSummaryTimelineCard({ article }) {
  return (
    <div className="rounded-lg border border-[#e4ded3] bg-[#fffefa] p-5 dark:border-[#2b312a] dark:bg-[#151813]">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#7b766d] dark:text-[#aaa69d]">
        <span className="rounded-full border border-[#ddd4c5] bg-[#f8f4ec] px-2 py-0.5 text-[#745c36] dark:border-[#4a412d] dark:bg-[#211f17] dark:text-[#d7bd7f]">
          {article.phase}
        </span>
        <span>{formatDate(article.date)}</span>
        <span>{article.readTime}</span>
      </div>
      <h3 className="mt-3 text-xl font-semibold leading-snug text-[#20221f] dark:text-[#f4f0e8]">
        <a href={article.href} target="_blank" rel="noreferrer" className="hover:text-[#7a5a1f] dark:hover:text-[#d7a85c]">
          {article.title}
        </a>
      </h3>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#716d64] dark:text-[#aaa69d]">
        <span>{formatNumber(article.views)} 阅读</span>
        <span>{formatNumber(article.diggs)} 点赞</span>
        <span>{formatNumber(article.comments)} 评论</span>
        <a
          href={article.href}
          target="_blank"
          rel="noreferrer"
          className="ml-auto font-semibold text-[#7a5a1f] underline-offset-4 hover:underline dark:text-[#d7a85c]"
        >
          查看原文
        </a>
      </div>
    </div>
  )
}

function DiaryBlocks({ blocks, diary }) {
  return blocks.map((paragraph, idx) => {
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
  })
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
        : [{ url: AVATAR_URL, width: 512, height: 512, alt: '涂阿燃头像' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: diary.title,
      description: diary.summary,
      images: [diary.cover || AVATAR_URL],
    },
  }
}

export default function DiaryPage() {
  const diary = articles.find((item) => item.slug === DIARY_SLUG)

  if (!diary) {
    notFound()
  }

  const timelineEntries = buildTimelineEntries(diary)
  const timelineGroups = groupTimelineByYear(timelineEntries)

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
              <a href="#year-summary" className="opacity-80 hover:opacity-100 underline underline-offset-4">
                年中年终总结
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6 md:flex-row">
        {timelineGroups.length > 0 ? (
          <aside className="hidden md:block md:w-52 shrink-0">
            <TimelineToc groups={timelineGroups} />
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

          <div id="year-summary" className="mb-6 rounded-lg border border-[#eee] bg-[#fffefa] p-4 text-sm leading-6 text-[#666] dark:border-gray-800 dark:bg-[#151813] dark:text-gray-300">
            <div className="font-semibold text-[#444] dark:text-gray-100">{YEAR_SUMMARY_COLUMN.title}已并入浮生日记</div>
            <p className="mt-1">
              {YEAR_SUMMARY_COLUMN.subtitle}这里按时间线统一展示日记、阶段复盘与掘金总结，外部长文继续保留原文入口。
            </p>
          </div>

          <section className="space-y-10" aria-label="浮生日记时间线">
            {timelineGroups.map((group) => (
              <div key={group.year} id={`year-${group.year}`} className="scroll-mt-24">
                <div className="mb-5 flex items-baseline justify-between border-b border-[#eee] pb-3 dark:border-gray-800">
                  <h2 className="font-mono text-2xl font-semibold text-[#444] dark:text-gray-200">{group.year}</h2>
                  <span className="text-sm text-[#777] dark:text-gray-400">{group.items.length} 条</span>
                </div>
                <div className="space-y-7">
                  {group.items.map((entry, index) => (
                    <article
                      key={entry.id}
                      id={entry.id}
                      className="relative scroll-mt-24 pl-8"
                    >
                      <div className="absolute left-0 top-1 h-full">
                        <span className="block h-3 w-3 rounded-full border-2 border-[#9b7a3d] bg-[#fbfaf6] dark:border-[#d7a85c] dark:bg-[#11130f]" />
                        {index !== group.items.length - 1 ? (
                          <span className="ml-[5px] mt-2 block h-[calc(100%-8px)] w-px bg-[#e6dfd3] dark:bg-[#343a33]" />
                        ) : null}
                      </div>

                      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="m-0 text-lg sm:text-xl font-semibold text-[#444] dark:text-gray-200 leading-snug">
                          {entry.label}
                        </h3>
                        <span className="text-[#999] dark:text-gray-500" aria-hidden="true">·</span>
                        <time className="text-base text-[#999] dark:text-gray-400" dateTime={entry.date}>
                          {entry.date}
                        </time>
                        {entry.category ? (
                          <span className="rounded-full border border-[#e4ded3] px-2 py-0.5 text-xs text-[#7a5a1f] dark:border-[#3a4038] dark:text-[#d7a85c]">
                            {entry.category}
                          </span>
                        ) : null}
                      </div>

                      {entry.kind === 'year-summary' ? (
                        <YearSummaryTimelineCard article={entry.article} />
                      ) : (
                        <div className="prose-tuaran">
                          <DiaryBlocks blocks={entry.blocks} diary={diary} />
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import { articles } from '../articles/articlesData'
import { YEAR_SUMMARY_COLUMN } from '../articles/year-summary/yearSummaryData'
import { avatarAbsoluteUrl } from '../../../lib/auth/avatar'
import { getPublishedArticlePostBySlug } from '../../../lib/article/articlePosts'
import { isMarkdownDocument } from '../../../lib/article/articleDocument.mjs'
import { diaryContentFromMarkdown } from '../../../lib/article/legacyArticleMigration.mjs'
import {
  DIARY_SERIES_COUPLET,
  DIARY_SERIES_NOTE,
  DIARY_SERIES_STARTED_ON,
  DIARY_SLUG,
  buildDiaryTimelineEntries,
  findDiaryArticle,
  formatDiarySpan,
  formatDiaryTocDate,
  latestDiaryDate,
  selectDiarySeries,
} from '../../../lib/diary/diarySeries.mjs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const SITE_URL = 'https://2aran.com'
const AVATAR_URL = avatarAbsoluteUrl(SITE_URL)
const SITE_TITLE = '涂阿燃（tuaran）的网络日志'

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

async function readDiary() {
  const archived = findDiaryArticle(articles)
  const post = await getPublishedArticlePostBySlug(DIARY_SLUG)
  if (!post) return selectDiarySeries(archived, null)
  const markdown = isMarkdownDocument(post.content) ? post.content.markdown : post.contentText
  const published = {
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    cover: post.coverUrl,
    date: post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 10) : '',
    content: diaryContentFromMarkdown(markdown),
  }
  return selectDiarySeries(archived, published)
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

function TocGroup({ title, groups, baseIdPrefix = 'year' }) {
  return (
    <div>
      {title ? (
        <div className="text-xs font-bold tracking-[0.16em] text-[#999] dark:text-gray-500">{title}</div>
      ) : null}
      <div className={`${title ? 'mt-3' : ''} space-y-4 text-sm text-[#666] dark:text-gray-300`}>
        {groups.map((group) => (
          <div key={group.year}>
            <a
              href={`#${baseIdPrefix}-${group.year}`}
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
                    <span className="font-mono text-xs text-[#999] dark:text-gray-500">{formatDiaryTocDate(item)}</span>{' '}
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineToc({ diaryGroups }) {
  return (
    <nav className="toc-scroll-panel space-y-6 md:static" aria-label="浮生日记目录">
      <div className="text-sm font-bold border-b border-[#eee] pb-2 dark:border-gray-800 dark:text-gray-200">
        目录
      </div>
      <TocGroup title="浮生日记" groups={diaryGroups} />
      <div className="border-t border-[#eee] pt-5 dark:border-gray-800">
        <Link
          href="/articles/year-summary"
          className="text-xs font-bold tracking-[0.16em] text-[#999] hover:text-[#7a5a1f] dark:text-gray-500 dark:hover:text-[#d7a85c]"
        >
          年中年终总结
        </Link>
        <p className="mt-2 text-sm leading-6 text-[#666] dark:text-gray-300">
          {YEAR_SUMMARY_COLUMN.subtitle}
        </p>
      </div>
    </nav>
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

export async function generateMetadata() {
  const diary = await readDiary()

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
      publishedTime: toIsoDate(DIARY_SERIES_STARTED_ON) || undefined,
      modifiedTime: toIsoDate(latestDiaryDate(diary)) || undefined,
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

export default async function DiaryPage() {
  const diary = await readDiary()

  if (!diary) {
    notFound()
  }

  const diaryEntries = buildDiaryTimelineEntries(diary)
  const diaryGroups = groupTimelineByYear(diaryEntries)

  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: diary.title,
    description: diary.summary,
    image: diary.cover ? [diary.cover] : undefined,
    datePublished: toIsoDate(DIARY_SERIES_STARTED_ON) || undefined,
    dateModified: toIsoDate(latestDiaryDate(diary)) || toIsoDate(DIARY_SERIES_STARTED_ON) || undefined,
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
    <div className="diary-page mx-auto max-w-4xl px-4 py-8">
      <Script id="diary-jsonld" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(articleStructuredData)}
      </Script>

      <header className="diary-sheet diary-page-header">
        <p className="diary-sheet-kicker">从 {DIARY_SERIES_STARTED_ON} 起</p>
        <h1 className="diary-sheet-title">{diary.title}</h1>
        <p className="diary-sheet-note">{DIARY_SERIES_NOTE}</p>
        <p className="diary-sheet-couplet">
          {typeof diary.summary === 'string' && diary.summary.includes(DIARY_SERIES_NOTE)
            ? DIARY_SERIES_COUPLET
            : diary.summary}
        </p>
        <div className="diary-sheet-links">
          <Link href="/articles">返回列表</Link>
          <Link href="/articles/year-summary">年中年终总结</Link>
        </div>
      </header>

      <div className="flex flex-col gap-6 md:flex-row">
        {diaryGroups.length > 0 ? (
          <>
            <aside className="hidden md:sticky md:top-24 md:block md:w-56 md:self-start shrink-0">
              <TimelineToc diaryGroups={diaryGroups} />
            </aside>

            <details className="md:hidden border border-[#eee] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <summary className="cursor-pointer text-sm font-bold text-[#444] dark:text-gray-200">
                展开目录
              </summary>
              <div className="mt-4">
                <TimelineToc diaryGroups={diaryGroups} />
              </div>
            </details>
          </>
        ) : null}

        <main className="diary-sheet diary-page-sheet min-w-0 flex-1">
          {diary.cover ? (
            <div className="diary-pasted-photo">
              <Image
                src={diary.cover}
                alt={`${diary.title} 封面`}
                width={800}
                height={533}
                sizes="(max-width: 768px) 100vw, 768px"
                unoptimized
                className="h-auto w-full bg-white dark:bg-[#1c1915]"
              />
            </div>
          ) : null}

          <section className="space-y-10" aria-label="浮生日记时间线">
            {diaryGroups.map((group) => (
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
                          {formatDiarySpan(entry)}
                        </time>
                        {entry.category ? (
                          <span className="rounded-full border border-[#e4ded3] px-2 py-0.5 text-xs text-[#7a5a1f] dark:border-[#3a4038] dark:text-[#d7a85c]">
                            {entry.category}
                          </span>
                        ) : null}
                      </div>

                      <div className="prose-tuaran">
                        <DiaryBlocks blocks={entry.blocks} diary={diary} />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section id="year-summary" className="mt-14 scroll-mt-24" aria-label="年中年终总结">
            <header className="border-b border-[#eee] pb-4 dark:border-gray-800">
              <h2 className="text-2xl font-semibold text-[#444] dark:text-gray-200">{YEAR_SUMMARY_COLUMN.title}</h2>
              <p className="mt-2 text-sm text-[#777] dark:text-gray-400">{YEAR_SUMMARY_COLUMN.subtitle}</p>
            </header>
            <p className="mt-4 text-sm leading-7 text-[#666] dark:text-gray-300">
              <Link href="/articles/year-summary" className="font-semibold text-[#7a5a1f] underline underline-offset-4 dark:text-[#d7a85c]">
                查看独立时间线
              </Link>
              <span aria-hidden="true"> · </span>
              <a href={YEAR_SUMMARY_COLUMN.sourceHref} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                {YEAR_SUMMARY_COLUMN.sourceLabel}
              </a>
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}

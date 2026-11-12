import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import { articles } from '../articles/articlesData'
import { Timeline } from '../components/aceternity/timeline'
import { YEAR_SUMMARY_COLUMN } from '../articles/year-summary/yearSummaryData'
import { avatarAbsoluteUrl } from '../../../lib/auth/avatar'
import { getPublishedArticlePostBySlug } from '../../../lib/article/articlePosts'
import { isMarkdownDocument } from '../../../lib/article/articleDocument.mjs'
import { diaryContentFromMarkdown } from '../../../lib/article/legacyArticleMigration.mjs'
import {
  DIARY_SERIES_COUPLET,
  DIARY_SERIES_STARTED_ON,
  DIARY_SLUG,
  buildDiaryTimelineEntries,
  diaryDescription,
  findDiaryArticle,
  formatDiarySpan,
  latestDiaryDate,
  selectDiarySeries,
  withArchivedSourceNotes,
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

function splitIsoDate(value) {
  const [year, month, day] = String(value || '').split('-')
  return { year, month, day }
}

function DiaryDateMark({ entry }) {
  const end = splitIsoDate(entry.date)
  const start = entry.dateStart && entry.dateStart !== entry.date ? splitIsoDate(entry.dateStart) : null
  if (!end.month || !end.day) return formatDiarySpan(entry) || entry.label
  return (
    <span className="block pl-14 leading-none">
      <span className="block text-[11px] font-medium tracking-[0.18em] text-neutral-400">{end.year}</span>
      {start ? (
        <span className="mt-1 flex items-baseline gap-1 text-lg font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">
          <span>{start.month}/{start.day}</span>
          <span className="text-xs font-medium text-neutral-400">～</span>
          <span>{end.month}/{end.day}</span>
        </span>
      ) : (
        <span className="mt-1 block text-lg font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">
          {end.month}/{end.day}
        </span>
      )}
    </span>
  )
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
          className="no-external-arrow font-semibold text-neutral-900 underline-offset-4 hover:text-purple-700 hover:underline dark:text-neutral-100 dark:hover:text-blue-300"
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
            className="h-auto w-full rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
          />
        </figure>
      )
    }

    const blockquote = parseMarkdownBlockquote(paragraph)
    if (blockquote) {
      return (
        <blockquote key={`${idx}-${blockquote}`} className="border-l-2 border-neutral-200 pl-4 text-neutral-600 not-italic dark:border-neutral-700 dark:text-neutral-300">
          {renderInlineBold(blockquote)}
        </blockquote>
      )
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
    description: diaryDescription(diary.summary),
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
      description: diaryDescription(diary.summary),
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
      description: diaryDescription(diary.summary),
      images: [diary.cover || AVATAR_URL],
    },
  }
}

export default async function DiaryPage() {
  const diary = await readDiary()

  if (!diary) {
    notFound()
  }

  const diaryEntries = withArchivedSourceNotes(buildDiaryTimelineEntries(diary), findDiaryArticle(articles))

  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: diary.title,
    description: diaryDescription(diary.summary),
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

  const timelineData = diaryEntries.map((entry) => ({
    id: entry.id,
    title: formatDiarySpan(entry) || entry.label,
    label: <DiaryDateMark entry={entry} />,
    content: (
      <article
        id={entry.id}
        className="scroll-mt-28 rounded-lg border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {entry.category ? (
            <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-neutral-700 dark:border-neutral-700 dark:text-neutral-200">
              {entry.category}
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-50">
          {entry.label}
        </h3>
        <div className="mt-4 space-y-3 text-sm leading-7 text-neutral-700 dark:text-neutral-300">
          <DiaryBlocks blocks={entry.blocks} diary={diary} />
        </div>
        {entry.sourceNote ? <p className="diary-entry-source-note">{entry.sourceNote}</p> : null}
      </article>
    ),
  }))

  return (
    <section aria-label="浮生日记时间线">
      <Script id="diary-jsonld" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(articleStructuredData)}
      </Script>
      <Timeline
        data={timelineData}
        title={diary.title}
        rowClassName="flex items-start justify-start gap-3 pt-8"
        railClassName="sticky top-24 z-40 w-max shrink-0 self-start"
        labelClassName="hidden md:block"
        description={(
          <div className="space-y-1">
            <p>从 {DIARY_SERIES_STARTED_ON} 起 · {diaryEntries.length} 条</p>
            <p>{DIARY_SERIES_COUPLET}</p>
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/articles" className="font-semibold text-neutral-900 underline-offset-4 hover:text-purple-700 hover:underline dark:text-neutral-100 dark:hover:text-blue-300">
                返回列表
              </Link>
              <Link
                id="year-summary"
                href="/articles/year-summary"
                aria-label="年中年终总结"
                className="font-semibold text-neutral-900 underline-offset-4 hover:text-purple-700 hover:underline dark:text-neutral-100 dark:hover:text-blue-300"
              >
                {YEAR_SUMMARY_COLUMN.title}
              </Link>
            </p>
          </div>
        )}
      />
    </section>
  )
}

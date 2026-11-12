import Link from 'next/link'
import Script from 'next/script'

import { Timeline } from '../../components/aceternity/timeline'
import {
  YEAR_SUMMARY_ARTICLES,
  YEAR_SUMMARY_COLUMN,
  getYearSummaryGroups,
  getYearSummaryStats,
} from './yearSummaryData'

export const dynamic = 'force-static'

const SITE_URL = 'https://2aran.com'
const PAGE_PATH = '/articles/year-summary'
const PAGE_URL = `${SITE_URL}${PAGE_PATH}`
const SITE_TITLE = '涂阿燃（tuaran）的网络日志'
const numberFormatter = new Intl.NumberFormat('zh-CN')

function formatDate(value) {
  const [year, month, day] = value.split('-')
  return `${year}.${month}.${day}`
}

function formatNumber(value) {
  return numberFormatter.format(value)
}

export const metadata = {
  title: `${YEAR_SUMMARY_COLUMN.title} · ${SITE_TITLE}`,
  description: YEAR_SUMMARY_COLUMN.subtitle,
  alternates: {
    canonical: '/articles/year-summary',
  },
  keywords: ['涂阿燃', 'tuaran', '年中总结', '年终总结', '掘金专栏'],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: YEAR_SUMMARY_COLUMN.title,
    description: YEAR_SUMMARY_COLUMN.subtitle,
    url: 'https://2aran.com/articles/year-summary',
    siteName: SITE_TITLE,
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: YEAR_SUMMARY_COLUMN.title,
    description: YEAR_SUMMARY_COLUMN.subtitle,
  },
}

function YearSummaryArticle({ article }) {
  return (
    <article
      id={`summary-${article.id}`}
      className="scroll-mt-28 rounded-lg border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-neutral-700 dark:border-neutral-700 dark:text-neutral-200">
          {article.phase}
        </span>
        <time dateTime={article.date}>{formatDate(article.date)}</time>
        <span>{article.readTime}</span>
      </div>
      <h3 className="mt-3 text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-50">
        <a
          href={article.href}
          target="_blank"
          rel="noreferrer"
          className="no-external-arrow hover:text-purple-700 dark:hover:text-blue-300"
        >
          {article.title}
        </a>
      </h3>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-600 dark:text-neutral-300">
        <span>{formatNumber(article.views)} 阅读</span>
        <span>{formatNumber(article.diggs)} 点赞</span>
        <span>{formatNumber(article.comments)} 评论</span>
        <a
          href={article.href}
          target="_blank"
          rel="noreferrer"
          className="no-external-arrow ml-auto font-semibold text-neutral-900 underline-offset-4 hover:text-purple-700 hover:underline dark:text-neutral-100 dark:hover:text-blue-300"
        >
          查看原文
        </a>
      </div>
    </article>
  )
}

export default function YearSummaryPage() {
  const stats = getYearSummaryStats()
  const data = getYearSummaryGroups().map((group) => ({
    title: group.year,
    content: (
      <div className="space-y-4">
        {group.articles.map((article) => (
          <YearSummaryArticle key={article.id} article={article} />
        ))}
      </div>
    ),
  }))

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: YEAR_SUMMARY_COLUMN.title,
    description: YEAR_SUMMARY_COLUMN.subtitle,
    url: PAGE_URL,
    inLanguage: 'zh-CN',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_TITLE,
      url: SITE_URL,
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: YEAR_SUMMARY_ARTICLES.length,
      itemListElement: YEAR_SUMMARY_ARTICLES.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: article.title,
        url: article.href,
      })),
    },
  }

  return (
    <>
      <Script id="year-summary-jsonld" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(structuredData)}
      </Script>
      <Timeline
        data={data}
        title={YEAR_SUMMARY_COLUMN.title}
        description={(
          <div className="space-y-3">
            <p>{YEAR_SUMMARY_COLUMN.subtitle}</p>
            <p>
              {formatNumber(stats.articles)} 篇
              <span aria-hidden="true"> · </span>
              {formatNumber(stats.views)} 阅读
              <span aria-hidden="true"> · </span>
              {formatNumber(stats.diggs)} 点赞
              <span aria-hidden="true"> · </span>
              {formatNumber(stats.comments)} 评论
            </p>
            <p className="flex flex-wrap gap-x-4 gap-y-2">
              <Link href="/diary" className="font-semibold text-neutral-900 underline-offset-4 hover:text-purple-700 hover:underline dark:text-neutral-100 dark:hover:text-blue-300">
                浮生日记
              </Link>
              <a
                href={YEAR_SUMMARY_COLUMN.sourceHref}
                target="_blank"
                rel="noreferrer"
                className="no-external-arrow font-semibold text-neutral-900 underline-offset-4 hover:text-purple-700 hover:underline dark:text-neutral-100 dark:hover:text-blue-300"
              >
                {YEAR_SUMMARY_COLUMN.sourceLabel}
              </a>
              <span className="text-neutral-500 dark:text-neutral-400">更新于 {YEAR_SUMMARY_COLUMN.updatedAt}</span>
            </p>
          </div>
        )}
      />
    </>
  )
}

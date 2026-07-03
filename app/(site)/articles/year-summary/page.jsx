import Link from 'next/link'

import {
  YEAR_SUMMARY_ARTICLES,
  YEAR_SUMMARY_COLUMN,
  getYearSummaryGroups,
  getYearSummaryStats,
} from './yearSummaryData'

export const dynamic = 'force-static'

export const metadata = {
  title: '年中年终总结',
  description: '涂阿燃在掘金发布的年中、年终与阶段性总结文章时间线目录。',
  keywords: ['涂阿燃', '掘金安东尼', '年中总结', '年终总结', '年度总结', '阶段总结'],
  alternates: {
    canonical: '/articles/year-summary',
  },
}

const numberFormatter = new Intl.NumberFormat('zh-CN')

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

function StatsCard({ label, value }) {
  return (
    <div className="rounded-lg border border-[#e7e1d8] bg-white/75 px-4 py-3 dark:border-[#2d332d] dark:bg-[#151815]">
      <div className="text-[12px] font-medium text-[#7b766d] dark:text-[#a8a59c]">{label}</div>
      <div className="mt-1 font-mono text-[22px] font-semibold text-[#1f211d] dark:text-[#f4f0e8]">
        {formatNumber(value)}
      </div>
    </div>
  )
}

function TimelineArticle({ article, isLast }) {
  return (
    <article id={`article-${article.id}`} className="relative grid gap-4 pl-9 sm:grid-cols-[96px_minmax(0,1fr)] sm:pl-0">
      <div className="absolute left-1 top-1 h-full sm:left-[104px]">
        <span className="block h-3 w-3 rounded-full border-2 border-[#8b6d41] bg-[#fbfaf6] dark:border-[#d7b56d] dark:bg-[#11130f]" />
        {!isLast ? <span className="ml-[5px] mt-2 block h-[calc(100%-8px)] w-px bg-[#ded7ca] dark:bg-[#343a33]" /> : null}
      </div>
      <div className="hidden pt-0.5 text-right font-mono text-sm font-semibold text-[#8b6d41] dark:text-[#d7b56d] sm:block">
        {getMonthDay(article.date)}
      </div>
      <div className="rounded-lg border border-[#e4ded3] bg-[#fffefa] p-5 shadow-[0_1px_0_rgba(32,29,24,0.03)] dark:border-[#2b312a] dark:bg-[#151813]">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#7b766d] dark:text-[#aaa69d]">
          <span className="rounded-full border border-[#ddd4c5] bg-[#f8f4ec] px-2 py-0.5 text-[#745c36] dark:border-[#4a412d] dark:bg-[#211f17] dark:text-[#d7bd7f]">
            {article.phase}
          </span>
          <span>{formatDate(article.date)}</span>
          <span>{article.readTime}</span>
        </div>
        <h2 className="mt-3 text-xl font-semibold leading-snug text-[#20221f] dark:text-[#f4f0e8]">
          <a href={article.href} target="_blank" rel="noreferrer" className="hover:text-[#2f6f73] dark:hover:text-[#8dd5cf]">
            {article.title}
          </a>
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#716d64] dark:text-[#aaa69d]">
          <span>{formatNumber(article.views)} 阅读</span>
          <span>{formatNumber(article.diggs)} 点赞</span>
          <span>{formatNumber(article.comments)} 评论</span>
          <a
            href={article.href}
            target="_blank"
            rel="noreferrer"
            className="ml-auto font-semibold text-[#2f6f73] underline-offset-4 hover:underline dark:text-[#8dd5cf]"
          >
            查看原文
          </a>
        </div>
      </div>
    </article>
  )
}

export default function YearSummaryPage() {
  const groups = getYearSummaryGroups()
  const stats = getYearSummaryStats()

  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-[#68645c] dark:text-[#b8b3aa]">
        <Link href="/articles?tab=posts" className="font-semibold text-[#2f6f73] hover:underline dark:text-[#8dd5cf]">
          专栏
        </Link>
        <span>/</span>
        <span>{YEAR_SUMMARY_COLUMN.title}</span>
      </div>

      <header className="border-b border-[#e2ddd3] pb-8 dark:border-[#2c322b]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-[#8b6d41] dark:text-[#d7b56d]">
              {YEAR_SUMMARY_COLUMN.sourceLabel}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-[#1f211d] dark:text-[#f4f0e8] sm:text-5xl">
              {YEAR_SUMMARY_COLUMN.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#66625a] dark:text-[#b8b3aa]">
              {YEAR_SUMMARY_COLUMN.subtitle}本站保留时间线目录与阅读入口，全文继续跳转到掘金原文。
            </p>
          </div>
          <a
            href={YEAR_SUMMARY_COLUMN.sourceHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#d8d1c5] bg-white px-4 text-sm font-semibold text-[#2f6f73] hover:border-[#2f6f73] dark:border-[#3a4038] dark:bg-[#151815] dark:text-[#8dd5cf]"
          >
            打开掘金专栏
          </a>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="文章" value={stats.articles} />
          <StatsCard label="阅读" value={stats.views} />
          <StatsCard label="点赞" value={stats.diggs} />
          <StatsCard label="评论" value={stats.comments} />
        </div>
      </header>

      <div className="grid gap-8 py-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <div className="rounded-lg border border-[#e4ded3] bg-[#fffefa] p-4 dark:border-[#2b312a] dark:bg-[#151813]">
            <div className="text-sm font-semibold text-[#1f211d] dark:text-[#f4f0e8]">时间线目录</div>
            <nav className="mt-4 space-y-4" aria-label="年中年终总结时间线目录">
              {groups.map((group) => (
                <div key={group.year}>
                  <a
                    href={`#year-${group.year}`}
                    className="font-mono text-sm font-semibold text-[#8b6d41] hover:underline dark:text-[#d7b56d]"
                  >
                    {group.year}
                  </a>
                  <div className="mt-2 space-y-1.5">
                    {group.articles.map((article) => (
                      <a
                        key={article.id}
                        href={`#article-${article.id}`}
                        className="block truncate text-sm text-[#66625a] hover:text-[#2f6f73] dark:text-[#b8b3aa] dark:hover:text-[#8dd5cf]"
                      >
                        {getMonthDay(article.date)} {article.title}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <div className="mt-5 border-t border-[#ebe6dc] pt-4 text-xs leading-5 text-[#7b766d] dark:border-[#30362f] dark:text-[#aaa69d]">
              数据同步于 {YEAR_SUMMARY_COLUMN.updatedAt}，共 {YEAR_SUMMARY_ARTICLES.length} 篇。
            </div>
          </div>
        </aside>

        <section className="space-y-10">
          {groups.map((group) => (
            <div key={group.year} id={`year-${group.year}`} className="scroll-mt-24">
              <div className="mb-5 flex items-baseline justify-between border-b border-[#e4ded3] pb-3 dark:border-[#2b312a]">
                <h2 className="font-mono text-2xl font-semibold text-[#1f211d] dark:text-[#f4f0e8]">{group.year}</h2>
                <span className="text-sm text-[#7b766d] dark:text-[#aaa69d]">{group.articles.length} 篇</span>
              </div>
              <div className="space-y-5">
                {group.articles.map((article, index) => (
                  <TimelineArticle
                    key={article.id}
                    article={article}
                    isLast={index === group.articles.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}

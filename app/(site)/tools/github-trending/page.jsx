import Link from 'next/link'

import {
  formatShanghaiDateTime,
  formatStarCount,
  GITHUB_TRENDING_PATH,
  GITHUB_TRENDING_REPO,
  isTrendingMonthKey,
  loadGithubTrending,
  shiftTrendingMonth,
  trendingMonthMatrix,
} from '../../../../lib/page-data/githubTrending'

export const runtime = 'edge'
export const revalidate = 3600

const PAGE_URL = `https://2aran.com${GITHUB_TRENDING_PATH}`
const TITLE = 'GitHub 每日热门仓库'
const DESCRIPTION = '按北京时间查看当日与近期 GitHub 热门仓库：全名、简介、语言、星标和入选原因。清单只供查阅，不含自动点 star 或自动关注。'

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['GitHub 热门仓库', 'GitHub Trending', '开源项目', '每日热门', '2aran'],
  alternates: { canonical: '/tools/github-trending' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/tools/github-trending',
    type: 'website',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: TITLE,
  description: DESCRIPTION,
  url: PAGE_URL,
  inLanguage: 'zh-CN',
  isAccessibleForFree: true,
}

const CALENDAR_WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function monthTitle(yearMonth) {
  const [year, month] = yearMonth.split('-')
  return `${Number(year)}年${Number(month)}月`
}

export default async function GitHubTrendingPage({ searchParams }) {
  const params = await searchParams
  const requestedDate = typeof params?.date === 'string' ? params.date : ''
  const snapshot = await loadGithubTrending({ date: requestedDate })
  const defaultDate = snapshot.dates.includes(snapshot.today) ? snapshot.today : snapshot.latest
  const generatedLabel = formatShanghaiDateTime(snapshot.daily?.generatedAt)

  const availableDates = new Set(snapshot.dates)
  const anchorDate = snapshot.selectedDate || snapshot.today
  const requestedMonth = typeof params?.month === 'string' ? params.month : ''
  const visibleMonth = isTrendingMonthKey(requestedMonth)
    ? requestedMonth
    : anchorDate.slice(0, 7)
  const calendarCells = snapshot.dates.length > 0 ? trendingMonthMatrix(visibleMonth) : []
  const prevMonth = shiftTrendingMonth(visibleMonth, -1)
  const nextMonth = shiftTrendingMonth(visibleMonth, 1)
  const earliestMonth = snapshot.dates.at(-1)?.slice(0, 7) || ''
  const currentMonth = snapshot.today.slice(0, 7)
  const hasPrevMonth = Boolean(prevMonth) && (!earliestMonth || prevMonth >= earliestMonth)
  const hasNextMonth = Boolean(nextMonth) && nextMonth <= currentMonth
  const keepDateQuery = snapshot.selectedDate && snapshot.selectedDate !== defaultDate
    ? `&date=${snapshot.selectedDate}`
    : ''
  const monthHref = (month) => `${GITHUB_TRENDING_PATH}?month=${month}${keepDateQuery}`

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-9 text-[var(--site-ink)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="border-b border-[var(--site-line)] pb-5">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--site-muted)]">
          <Link href="/tools" className="hover:text-[var(--site-ink)]">工具库</Link>
          <span>／</span>
          <Link href="/tools#analysis" className="hover:text-[var(--site-ink)]">分析</Link>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{TITLE}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--site-muted)]">{DESCRIPTION}</p>
        <p className="mt-3 text-xs text-[var(--site-faint)]">
          数据来自{' '}
          <a
            href={`https://github.com/${GITHUB_TRENDING_REPO}`}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-[var(--site-line-strong)] underline-offset-2 hover:text-[var(--site-ink)]"
          >
            {GITHUB_TRENDING_REPO}
          </a>
          的公开清单，时区为 Asia/Shanghai。
        </p>
      </header>

      {snapshot.dates.length > 0 && (
        <nav aria-label="选择日期" className="mt-5 flex flex-wrap gap-2">
          {snapshot.dates.map((date) => {
            const selected = date === snapshot.selectedDate
            const href = date === defaultDate ? GITHUB_TRENDING_PATH : `${GITHUB_TRENDING_PATH}?date=${date}`
            return (
              <Link
                key={date}
                href={href}
                aria-current={selected ? 'page' : undefined}
                className={[
                  'rounded-full border px-3 py-1 text-xs tabular-nums transition',
                  selected
                    ? 'border-[var(--site-ink)] bg-[var(--site-ink)] text-[var(--page-bg)]'
                    : 'border-[var(--site-line-strong)] text-[var(--site-muted)] hover:border-[var(--site-ink)] hover:text-[var(--site-ink)]',
                ].join(' ')}
              >
                {date}
                {date === snapshot.today ? ' · 今天' : date === snapshot.latest ? ' · 最新' : ''}
              </Link>
            )
          })}
        </nav>
      )}

      {calendarCells.length > 0 && (
        <details className="mt-3 rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] px-4 py-3">
          <summary className="cursor-pointer select-none text-xs text-[var(--site-muted)] marker:content-none hover:text-[var(--site-ink)]">
            按月历选日期
          </summary>
          <div className="mt-3 max-w-xs" role="group" aria-label="月历选日期">
            <div className="flex items-center justify-between text-xs">
              {hasPrevMonth ? (
                <Link href={monthHref(prevMonth)} className="text-[var(--site-muted)] hover:text-[var(--site-ink)]">
                  ← 上个月
                </Link>
              ) : (
                <span aria-disabled="true" className="text-[var(--site-faint)]">← 上个月</span>
              )}
              <strong className="tabular-nums">{monthTitle(visibleMonth)}</strong>
              {hasNextMonth ? (
                <Link href={monthHref(nextMonth)} className="text-[var(--site-muted)] hover:text-[var(--site-ink)]">
                  下个月 →
                </Link>
              ) : (
                <span aria-disabled="true" className="text-[var(--site-faint)]">下个月 →</span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-y-1 text-center text-[11px] text-[var(--site-faint)]" aria-hidden="true">
              {CALENDAR_WEEKDAYS.map((label) => <span key={label}>{label}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center text-xs tabular-nums">
              {calendarCells.map((date, index) => {
                if (!date) return <span key={`empty-${index}`} />
                const available = availableDates.has(date)
                const selected = date === snapshot.selectedDate
                const isToday = date === snapshot.today
                if (!available) {
                  return (
                    <span
                      key={date}
                      aria-label={`${date}，暂无数据`}
                      className={[
                        'mx-auto flex h-7 w-7 items-center justify-center rounded-full',
                        isToday ? 'text-[var(--site-muted)] underline decoration-dotted underline-offset-2' : 'text-[var(--site-faint)]',
                      ].join(' ')}
                    >
                      {Number(date.slice(8))}
                    </span>
                  )
                }
                const href = date === defaultDate ? GITHUB_TRENDING_PATH : `${GITHUB_TRENDING_PATH}?date=${date}`
                return (
                  <Link
                    key={date}
                    href={href}
                    aria-current={selected ? 'date' : undefined}
                    aria-label={isToday ? `${date}，今天` : date}
                    className={[
                      'mx-auto flex h-7 w-7 items-center justify-center rounded-full transition',
                      selected
                        ? 'bg-[var(--site-ink)] text-[var(--page-bg)]'
                        : 'text-[var(--site-muted)] hover:bg-[color-mix(in_srgb,var(--site-line)_45%,transparent)] hover:text-[var(--site-ink)]',
                      isToday && !selected ? 'border border-dashed border-[var(--site-line-strong)]' : '',
                    ].join(' ')}
                  >
                    {Number(date.slice(8))}
                  </Link>
                )
              })}
            </div>
          </div>
        </details>
      )}

      <section className="mt-6" aria-live="polite">
        {snapshot.status === 'ok' ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-[var(--site-muted)]">
              <p>
                {snapshot.selectedDate}
                <span className="mx-2 text-[var(--site-faint)]">·</span>
                {snapshot.daily.items.length} 个仓库
                {generatedLabel ? (
                  <>
                    <span className="mx-2 text-[var(--site-faint)]">·</span>
                    生成于 {generatedLabel}（{snapshot.daily.timezone}）
                  </>
                ) : null}
              </p>
            </div>
            <ol className="mt-3 divide-y divide-[var(--site-line)] border-y border-[var(--site-line)]">
              {snapshot.daily.items.map((item, index) => (
                <li key={item.url} className="py-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="w-6 shrink-0 text-right font-mono text-xs text-[var(--site-faint)]">{index + 1}</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate font-medium hover:underline"
                      >
                        {item.fullName}
                      </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 text-xs tabular-nums text-[var(--site-muted)]">
                      {item.language ? <span>{item.language}</span> : null}
                      <span>{formatStarCount(item.stars)} 星标</span>
                    </div>
                  </div>
                  {item.descriptionZh || item.description ? (
                    <p className="mt-1 pl-8 text-sm leading-6 text-[var(--site-muted)]">
                      {item.descriptionZh || item.description}
                    </p>
                  ) : null}
                  {item.descriptionZh && item.description ? (
                    <p className="mt-1 pl-8 text-xs leading-5 text-[var(--site-faint)]">{item.description}</p>
                  ) : null}
                  {item.reason ? (
                    <p className="mt-1 pl-8 text-xs leading-5 text-[var(--site-faint)]">
                      入选原因：{item.reason}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <div className="border-y border-[var(--site-line)] py-10 text-sm leading-6 text-[var(--site-muted)]">
            {snapshot.status === 'index-unavailable'
              ? '清单暂时无法读取，请稍后再试。'
              : snapshot.selectedDate
                ? `${snapshot.selectedDate} 还没有可展示的清单，换一个日期看看。`
                : '暂时没有可展示的热门仓库清单。'}
          </div>
        )}
      </section>
    </main>
  )
}

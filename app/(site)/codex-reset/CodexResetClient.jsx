'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import SharePageButton from '../components/SharePageButton'
import {
  AIHOT_CODEX_RESET_PAGE,
  CODEX_RESET_HERO_BG_PATH,
  CODEX_RESET_PAGE_URL,
  FALLBACK_SNAPSHOT,
  KIND_META,
  TIBO_AVATAR_PATH,
  TIBO_HANDLE,
  TIBO_NAME,
  TIBO_PROFILE_URL,
  WEEKDAY_LABELS,
  buildMonthGrid,
  calendarDateForEvent,
  eventKind,
  eventsOnDate,
  featuredKicker,
  formatBeijingPostTime,
  formatCompactDate,
  formatDayHeading,
  formatMonthTitle,
  homeCardModel,
  latestPost,
  monthStats,
  monthStatsLabel,
  pickFeaturedEvent,
  shiftYearMonth,
  todayBeijing,
  yearMonthOf,
} from '../../../lib/codexResets'

function kindClass(kind) {
  if (kind === 'preview') {
    return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200'
  }
  if (kind === 'credit') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
  }
  return 'border-[#cdd5c3] bg-[#eef3e6] text-[#3f5340] dark:border-[#2f3d31] dark:bg-[#152018] dark:text-[#c5d6b8]'
}

function cellKindClass(kind, selected) {
  if (kind === 'preview') {
    return selected
      ? 'border-amber-700 bg-amber-50 text-amber-950 dark:border-amber-300 dark:bg-amber-950/50 dark:text-amber-50'
      : 'border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100'
  }
  if (kind === 'credit' || kind === 'reset') {
    return selected
      ? 'border-emerald-800 bg-emerald-50 text-emerald-950 dark:border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-50'
      : 'border-emerald-200 bg-[#f3f7ef] text-[#35503a] dark:border-emerald-900/40 dark:bg-[#152018] dark:text-[#d5e4cc]'
  }
  return selected
    ? 'border-[#1d1a16] bg-white text-[#1d1a16] dark:border-gray-200 dark:bg-[#151c25] dark:text-gray-100'
    : 'border-[#e4e2da] bg-white text-[#1d1a16] hover:border-[#c8c5b8] dark:border-[#2b3440] dark:bg-[#111923] dark:text-gray-200 dark:hover:border-[#435062]'
}

function KindBadge({ kind, children }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${kindClass(kind)}`}>
      {children || KIND_META[kind].label}
    </span>
  )
}

function PostCard({ post, scheduleLabel }) {
  if (!post) return null
  return (
    <article className="rounded-2xl border border-[#e4e2da] bg-white p-4 dark:border-[#2b3440] dark:bg-[#111923]">
      <div className="flex items-start justify-between gap-3">
        <a href={TIBO_PROFILE_URL} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-3 no-underline">
          <Image
            src={TIBO_AVATAR_PATH}
            alt={TIBO_NAME}
            width={40}
            height={40}
            unoptimized
            className="h-10 w-10 shrink-0 rounded-full border border-[#e4e2da] object-cover dark:border-[#324050]"
          />
          <span className="min-w-0">
            <strong className="block text-[14px] text-[#1d1a16] dark:text-gray-100">{TIBO_NAME}</strong>
            <span className="font-mono text-[12px] text-[#767869] dark:text-[#8e9ab0]">{TIBO_HANDLE}</span>
          </span>
        </a>
        <time className="shrink-0 font-mono text-[11px] text-[#8a8174] dark:text-[#8e9ab0]" dateTime={post.publishedAt}>
          {formatBeijingPostTime(post.publishedAt)} 发布
        </time>
      </div>
      <p className="mt-3 text-[15px] leading-7 text-[#1d1a16] dark:text-gray-100">{post.text}</p>
      {scheduleLabel ? (
        <p className="mt-2 text-[13px] leading-6 text-[#3f6a8a] dark:text-[#9fc5de]">{scheduleLabel}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#767869] dark:text-[#8e9ab0]">
        <span>{post.stage || '原帖'}{post.originalText ? ' · 中文译文' : ''}</span>
        <a href={post.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 no-underline hover:text-[#1d1a16] dark:hover:text-gray-100">
          在 X 查看原帖 <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  )
}

function EventDetail({ event }) {
  const kind = eventKind(event)
  const date = calendarDateForEvent(event)
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <KindBadge kind={kind} />
        {event.scope ? <span className="text-[12px] text-[#767869] dark:text-[#8e9ab0]">{event.scope}</span> : null}
      </div>
      <h3 className="font-serif text-[20px] font-semibold text-[#1d1a16] dark:text-gray-100">{event.title}</h3>
      <div className="space-y-3">
        {event.posts.map((post, index) => (
          <PostCard
            key={post.id}
            post={post}
            scheduleLabel={index === 0 ? event.schedule?.label : ''}
          />
        ))}
      </div>
      {date ? <p className="text-[12px] text-[#8a8174] dark:text-[#8e9ab0]">日历日期 {date}</p> : null}
    </section>
  )
}

export default function CodexResetClient() {
  const [snapshot, setSnapshot] = useState(FALLBACK_SNAPSHOT)
  const [source, setSource] = useState('fallback')
  const [loadState, setLoadState] = useState('loading')
  const [reloadToken, setReloadToken] = useState(0)
  const [today] = useState(() => todayBeijing())
  const [month, setMonth] = useState(() => yearMonthOf(today))
  const [selectedDate, setSelectedDate] = useState(today)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadState('loading')
      try {
        const response = await fetch('/api/codex-resets', { cache: 'no-store' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const payload = await response.json()
        if (!payload?.snapshot?.events) throw new Error('invalid snapshot')
        if (cancelled) return
        setSnapshot(payload.snapshot)
        setSource(payload.source === 'live' ? 'live' : 'fallback')
        setLoadState('ok')
      } catch {
        if (!cancelled) setLoadState('error')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const events = snapshot.events
  const featured = useMemo(() => pickFeaturedEvent(events, today), [events, today])
  const featuredDate = featured ? calendarDateForEvent(featured) : today
  const featuredPost = latestPost(featured)
  const featuredModel = useMemo(() => homeCardModel(snapshot, today), [snapshot, today])

  useEffect(() => {
    if (!featuredDate) return
    setMonth((current) => current || yearMonthOf(featuredDate))
    setSelectedDate((current) => current || featuredDate)
  }, [featuredDate])

  const grid = useMemo(() => buildMonthGrid(month), [month])
  const stats = useMemo(() => monthStats(events, month), [events, month])
  const selectedEvents = useMemo(() => eventsOnDate(events, selectedDate), [events, selectedDate])
  const eventsByDate = useMemo(() => {
    const map = new Map()
    for (const event of events) {
      const date = calendarDateForEvent(event)
      if (!date) continue
      const list = map.get(date) || []
      list.push(event)
      map.set(date, list)
    }
    return map
  }, [events])

  const goToday = useCallback(() => {
    setMonth(yearMonthOf(today))
    setSelectedDate(today)
  }, [today])

  return (
    <main className="codex-reset-page relative min-h-[calc(100vh-var(--site-header-height))]">
      <div className="codex-reset-page-content mx-auto w-full max-w-[1120px] px-4 py-6 sm:py-10">
        <header className="flex flex-col gap-4 border-b border-[#dee0db]/80 pb-5 dark:border-gray-800/80 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#767869] dark:text-[#8e9ab0]">
                Codex Reset · 北京时间 UTC+8
              </p>
              <h1 className="mt-1 font-serif text-[26px] font-semibold leading-tight text-[#15140f] dark:text-gray-100 sm:text-[30px]">
                Codex 重置监控
              </h1>
              <p className="mt-1 text-[12px] text-[#585a4c] dark:text-gray-400">
                {TIBO_NAME} {TIBO_HANDLE}
              </p>
            <p className="mt-3 max-w-2xl text-[13px] leading-6 text-[#51514a] dark:text-gray-400">
              追踪 Tibo 公开的 Codex 额度重置、重置卡发放与原帖。
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setReloadToken((value) => value + 1)}
              className="rounded-md border border-[#c6cab8] bg-white/75 px-2.5 py-1 text-[11px] text-[#585a4c] backdrop-blur-sm hover:bg-[#e9eae2] dark:border-gray-700 dark:bg-[#111923]/85 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {loadState === 'loading' ? '同步中…' : source === 'live' ? '重新同步' : '使用备用记录'}
            </button>
            <SharePageButton
              title="Codex 重置监控"
              text="Tibo 公开的 Codex 额度重置、重置卡发放与原帖日历。"
              url={CODEX_RESET_PAGE_URL}
              size="md"
            />
          </div>
        </header>

      {featured ? (
        <section className="codex-reset-featured mt-5 overflow-hidden rounded-[24px] border border-[#e4e2da] dark:border-[#2b3440]">
          <div
            className="codex-reset-featured-bg"
            style={{ backgroundImage: `url('${CODEX_RESET_HERO_BG_PATH}')` }}
            aria-hidden="true"
          />
          <div className="codex-reset-featured-overlay" aria-hidden="true" />
          <div className="codex-reset-featured-inner grid gap-4 p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:p-5">
            <div className="rounded-2xl border border-[#e4e2da]/80 bg-white/[0.92] p-5 backdrop-blur-sm dark:border-[#2b3440]/80 dark:bg-[#151c25]/[0.92]">
              <div className="flex flex-wrap items-center gap-2">
                <KindBadge kind={featuredModel.kind}>{featuredModel.kicker}</KindBadge>
                {featuredDate === today ? <span className="text-[11px] text-[#767869] dark:text-[#8e9ab0]">今天</span> : null}
              </div>
              <p className="mt-4 font-serif text-[34px] font-semibold leading-none text-[#1d1a16] dark:text-gray-100 sm:text-[40px]">
                {formatCompactDate(featuredDate)}
              </p>
              {featured.schedule?.label ? (
                <p className="mt-3 text-[13px] leading-6 text-[#51514a] dark:text-gray-400">{featured.schedule.label}</p>
              ) : null}
              <p className="mt-2 text-[12px] leading-6 text-[#8a8174] dark:text-[#8e9ab0]">
                发卡不代表额度已恢复。没有完成帖时保留原预告，时间经过不会自动改成已确认。
              </p>
            </div>
            <PostCard post={featuredPost} />
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#767869] dark:text-[#8e9ab0]">Reset calendar</p>
            <h2 className="mt-1 font-serif text-[22px] font-semibold text-[#15140f] dark:text-gray-100">重置日历</h2>
            <p className="mt-1 text-[13px] text-[#51514a] dark:text-gray-400">选择日期，查看重置状态与原帖记录。</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="rounded-[24px] border border-[#e4e2da] bg-white p-4 dark:border-[#2b3440] dark:bg-[#111923] sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-[20px] font-semibold text-[#1d1a16] dark:text-gray-100">{formatMonthTitle(month)}</h3>
                <p className="mt-1 text-[12px] text-[#767869] dark:text-[#8e9ab0]">本月：{monthStatsLabel(stats)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={goToday} className="rounded-md px-2 py-1 text-[12px] text-[#585a4c] hover:bg-[#f3f1ea] dark:text-gray-300 dark:hover:bg-[#1a222c]">
                  回到最近
                </button>
                <button type="button" onClick={() => setMonth((value) => shiftYearMonth(value, -1))} className="rounded-md border border-[#d8d5cb] px-2 py-1 text-[12px] dark:border-[#324050]" aria-label="上个月">
                  ‹
                </button>
                <button type="button" onClick={() => setMonth((value) => shiftYearMonth(value, 1))} className="rounded-md border border-[#d8d5cb] px-2 py-1 text-[12px] dark:border-[#324050]" aria-label="下个月">
                  ›
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-[11px] text-[#8a8174] dark:text-[#8e9ab0]">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="py-1">{label}</div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1.5" role="grid" aria-label={`${formatMonthTitle(month)}重置记录`}>
              {grid.map((cell) => {
                const dayEvents = eventsByDate.get(cell.date) || []
                const primary = dayEvents[0]
                const kind = primary ? eventKind(primary) : null
                const selected = cell.date === selectedDate
                const isToday = cell.date === today
                return (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => {
                      setSelectedDate(cell.date)
                      if (!cell.inMonth) setMonth(yearMonthOf(cell.date))
                    }}
                    className={`min-h-[76px] rounded-xl border px-1.5 py-2 text-left transition ${cellKindClass(kind, selected)} ${cell.inMonth ? '' : 'opacity-55'}`}
                    aria-current={isToday ? 'date' : undefined}
                    aria-pressed={selected}
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span className="font-serif text-[16px] font-semibold">{cell.day}</span>
                      {isToday ? <span className="text-[10px] text-[#8a8174] dark:text-[#8e9ab0]">今天</span> : null}
                    </span>
                    {dayEvents.length ? (
                      <span className="mt-2 block text-[10px] leading-4">
                        {dayEvents.slice(0, 2).map((event) => KIND_META[eventKind(event)].calendarLabel).join(' ')}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-[12px] leading-5 text-[#8a8174] dark:text-[#8e9ab0]">
              黄色为预告，绿色为已确认。跨日预告只标在预计范围的起始日。
            </p>
          </div>

          <aside className="rounded-[24px] border border-[#e4e2da] bg-[#f7f5ef] p-4 dark:border-[#2b3440] dark:bg-[#10151d] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-serif text-[20px] font-semibold text-[#1d1a16] dark:text-gray-100">{formatDayHeading(selectedDate)}</h3>
              {selectedDate === today ? <span className="text-[12px] text-[#767869] dark:text-[#8e9ab0]">今天</span> : null}
            </div>
            {selectedEvents.length ? (
              <div className="space-y-6">
                {selectedEvents.map((event) => <EventDetail key={event.id} event={event} />)}
              </div>
            ) : (
              <p className="text-[14px] leading-6 text-[#51514a] dark:text-gray-400">这一天没有公开的重置或发卡记录。</p>
            )}
          </aside>
        </div>
      </section>

      <section className="mt-8 space-y-3 border-t border-[#dee0db] pt-5 text-[13px] leading-6 text-[#51514a] dark:border-gray-800 dark:text-gray-400">
        <p>这里只记录公开的额度重置与重置卡发放。确认帖时间不等于账号到账时间；发卡不代表额度已恢复。</p>
        <p>
          统一使用北京时间。未写时区的预告按美国太平洋时间推定。核验水位以接口返回的 <code>checkedAt</code> 为准
          {snapshot.checkedAt ? `（最近 ${formatBeijingPostTime(snapshot.checkedAt)}）` : ''}
          {source === 'fallback' ? '；当前展示的是备用快照，待上游恢复后再同步。' : '。'}
        </p>
        <p>
          原帖作者是 {TIBO_NAME}{' '}
          <a href={TIBO_PROFILE_URL} target="_blank" rel="noreferrer">{TIBO_HANDLE}</a>
          。日历整理来自 <a href={AIHOT_CODEX_RESET_PAGE} target="_blank" rel="noreferrer">AIHOT</a>
          ，本页不猜测下一次重置时间。
        </p>
        <p>
          <Link href="/tools#analysis">返回分析工具</Link>
        </p>
      </section>
      </div>
    </main>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import SharePageButton from '../components/SharePageButton'
import {
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
  formatBeijingPostTime,
  formatDayHeading,
  formatMonthTitle,
  monthStats,
  monthStatsLabel,
  pickFeaturedEvent,
  shiftYearMonth,
  todayBeijing,
  yearMonthOf,
} from '../../../lib/ai/codexResets'

const KIND_DOT_CLASS = {
  preview: 'bg-amber-500 dark:bg-amber-400',
  credit: 'bg-emerald-600 dark:bg-emerald-400',
  reset: 'bg-emerald-600 dark:bg-emerald-400',
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

function PostCard({ post, scheduleLabel }) {
  if (!post) return null
  return (
    <article className="codex-reset-post-card rounded-2xl border border-[#e4e2da] p-3.5 dark:border-[#2b3440] sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <a href={TIBO_PROFILE_URL} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2.5 no-underline">
          <Image
            src={TIBO_AVATAR_PATH}
            alt={TIBO_NAME}
            width={40}
            height={40}
            unoptimized
            className="h-9 w-9 shrink-0 rounded-full border border-[#e4e2da] object-cover dark:border-[#324050] sm:h-10 sm:w-10"
          />
          <span className="min-w-0">
            <strong className="block truncate text-[14px] text-[#1d1a16] dark:text-gray-100">{TIBO_NAME}</strong>
            <span className="block truncate font-mono text-[11px] text-[#767869] dark:text-[#8e9ab0]">{TIBO_HANDLE}</span>
          </span>
        </a>
        <time className="shrink-0 font-mono text-[11px] text-[#8a8174] dark:text-[#8e9ab0]" dateTime={post.publishedAt}>
          {formatBeijingPostTime(post.publishedAt)}
        </time>
      </div>
      <p className="mt-3 text-[15px] leading-7 text-[#1d1a16] dark:text-gray-100">{post.text}</p>
      {scheduleLabel ? (
        <p className="mt-2 rounded-lg bg-[#eaf2f8] px-2.5 py-1.5 text-[12px] leading-5 text-[#3f6a8a] dark:bg-[#162837] dark:text-[#9fc5de]">
          {scheduleLabel}
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#e4e2da]/70 pt-2.5 text-[12px] text-[#767869] dark:border-[#2b3440]/70 dark:text-[#8e9ab0]">
        <span className="min-w-0 truncate">{post.stage || '原帖'}{post.originalText ? ' · 中文译文' : ''}</span>
        <a href={post.url} target="_blank" rel="noreferrer" className="inline-flex min-h-[36px] shrink-0 items-center gap-1 no-underline hover:text-[#1d1a16] dark:hover:text-gray-100">
          在 X 查看原帖 <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  )
}

function EventDetail({ event }) {
  return (
    <section className="space-y-3">
      {event.posts.map((post, index) => (
        <PostCard
          key={post.id}
          post={post}
          scheduleLabel={index === 0 ? event.schedule?.label : ''}
        />
      ))}
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

  const syncLabel = loadState === 'loading' ? '同步中…' : source === 'live' ? '重新同步' : '使用备用记录'

  return (
    <main className="codex-reset-page relative">
      <div className="codex-reset-page-content mx-auto w-full max-w-[1120px] px-4 pt-4 sm:px-6 sm:pt-10">
        <header className="flex items-start justify-between gap-2 border-b border-[#dee0db]/80 pb-3 dark:border-gray-800/80 sm:pb-4">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#767869] dark:text-[#8e9ab0] sm:tracking-[0.22em]">
              Codex Reset · 北京时间 UTC+8
            </p>
            <h1 className="mt-1 font-serif text-[22px] font-semibold leading-tight text-[#15140f] dark:text-gray-100 sm:text-[26px]">
              Codex 重置监控
            </h1>
            <p className="mt-1 text-[12px] leading-5 text-[#51514a] dark:text-gray-400 sm:hidden">
              Tibo 公开的重置、发卡与原帖
            </p>
            <p className="mt-1.5 hidden max-w-2xl text-[13px] leading-6 text-[#51514a] dark:text-gray-400 sm:block">
              追踪 {TIBO_NAME} {TIBO_HANDLE} 公开的重置、发卡与原帖；选择日期查看记录。
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 pt-0.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setReloadToken((value) => value + 1)}
              aria-label={syncLabel}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#c6cab8] bg-white/75 text-[15px] text-[#585a4c] backdrop-blur-sm hover:bg-[#e9eae2] dark:border-gray-700 dark:bg-[#111923]/85 dark:text-gray-400 dark:hover:bg-gray-800 sm:h-auto sm:w-auto sm:rounded-md sm:px-2.5 sm:py-1 sm:text-[11px]"
            >
              <span className="sm:hidden" aria-hidden="true">↻</span>
              <span className="hidden sm:inline">{syncLabel}</span>
            </button>
            <SharePageButton
              title="Codex 重置监控"
              text="Tibo 公开的 Codex 额度重置、重置卡发放与原帖日历。"
              url={CODEX_RESET_PAGE_URL}
              size="sm"
            />
          </div>
        </header>

        <section className="mt-4 sm:mt-5">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="min-w-0 rounded-[20px] border border-[#e4e2da] bg-white p-3.5 dark:border-[#2b3440] dark:bg-[#111923] sm:rounded-[24px] sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
                <div className="min-w-0">
                  <h3 className="font-serif text-[19px] font-semibold leading-tight text-[#1d1a16] dark:text-gray-100 sm:text-[20px]">
                    {formatMonthTitle(month)}
                  </h3>
                  <p className="mt-1 text-[11px] leading-4 text-[#767869] dark:text-[#8e9ab0] sm:text-[12px]">
                    本月：{monthStatsLabel(stats)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={goToday}
                    className="flex h-11 items-center rounded-xl border border-[#d8d5cb] px-2.5 text-[12px] text-[#585a4c] hover:bg-[#f3f1ea] dark:border-[#324050] dark:text-gray-300 dark:hover:bg-[#1a222c] sm:h-8 sm:rounded-md sm:px-2 sm:py-1"
                  >
                    最近
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonth((value) => shiftYearMonth(value, -1))}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d8d5cb] text-[20px] leading-none text-[#585a4c] hover:bg-[#f3f1ea] dark:border-[#324050] dark:text-gray-300 dark:hover:bg-[#1a222c] sm:h-8 sm:w-8 sm:rounded-md sm:text-[16px]"
                    aria-label="上个月"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonth((value) => shiftYearMonth(value, 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d8d5cb] text-[20px] leading-none text-[#585a4c] hover:bg-[#f3f1ea] dark:border-[#324050] dark:text-gray-300 dark:hover:bg-[#1a222c] sm:h-8 sm:w-8 sm:rounded-md sm:text-[16px]"
                    aria-label="下个月"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[12px] text-[#8a8174] dark:text-[#8e9ab0] sm:gap-1.5 sm:text-[11px]">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="py-1.5 sm:py-1">{label}</div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-1.5" role="grid" aria-label={`${formatMonthTitle(month)}重置记录`}>
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
                      className={`codex-reset-cell flex h-[46px] w-full flex-col items-center justify-center rounded-xl border px-0.5 text-center transition sm:h-[76px] sm:items-start sm:justify-start sm:px-1.5 sm:py-2 sm:text-left ${cellKindClass(kind, selected)} ${cell.inMonth ? '' : 'opacity-45'}`}
                      aria-current={isToday ? 'date' : undefined}
                      aria-pressed={selected}
                      aria-label={`${cell.day} 日${dayEvents.length ? `，${dayEvents.map((event) => KIND_META[eventKind(event)].label).join('、')}` : ''}`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full font-serif text-[15px] font-semibold leading-none sm:hidden ${
                          selected
                            ? 'bg-[#1d1a16] text-white dark:bg-gray-100 dark:text-[#111923]'
                            : isToday
                              ? 'text-[#a16207] dark:text-amber-300'
                              : ''
                        }`}
                      >
                        {cell.day}
                      </span>
                      <span className="hidden w-full items-center justify-between gap-1 sm:flex">
                        <span className="font-serif text-[16px] font-semibold">{cell.day}</span>
                        {isToday ? <span className="text-[10px] text-[#8a8174] dark:text-[#8e9ab0]">今天</span> : null}
                      </span>
                      {dayEvents.length ? (
                        <span className="mt-1 flex items-center justify-center gap-[3px] sm:hidden" aria-hidden="true">
                          {dayEvents.slice(0, 3).map((event, index) => (
                            <i
                              key={`${event.id}-${index}`}
                              className={`h-[5px] w-[5px] rounded-full ${KIND_DOT_CLASS[eventKind(event)]}`}
                            />
                          ))}
                        </span>
                      ) : null}
                      {dayEvents.length ? (
                        <span className="mt-2 hidden text-[10px] leading-4 sm:block">
                          {dayEvents.slice(0, 2).map((event) => KIND_META[eventKind(event)].calendarLabel).join(' ')}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[#eee9dd] pt-3 text-[11px] text-[#767869] dark:border-[#2b3440] dark:text-[#8e9ab0] sm:text-[12px]">
                <span className="flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />预告
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />已确认
                </span>
                <span className="ml-auto font-mono text-[10px] text-[#8a8174] dark:text-[#8e9ab0]">
                  点日期看当天原帖 ↓
                </span>
              </div>
            </div>

            <aside className="codex-reset-day-panel relative min-w-0 overflow-hidden rounded-[20px] border border-[#e4e2da] dark:border-[#2b3440] sm:rounded-[24px]">
              <div
                className="codex-reset-day-panel-bg hidden sm:block"
                style={{ backgroundImage: `url('${CODEX_RESET_HERO_BG_PATH}')` }}
                aria-hidden="true"
              />
              <div className="codex-reset-day-panel-content relative z-[1] p-3.5 sm:p-5">
                <div className="codex-reset-day-caption mb-3 flex items-center gap-3 sm:hidden">
                  <div
                    className="h-[76px] w-[58px] shrink-0 rounded-xl border border-[#e0d6bb] bg-[#f7f0dc] bg-cover shadow-sm"
                    style={{ backgroundImage: `url('${CODEX_RESET_HERO_BG_PATH}')`, backgroundPosition: 'center 22%' }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8a8174] dark:text-[#8e9ab0]">当天记录</p>
                    <p className="mt-1 font-serif text-[22px] font-semibold leading-tight text-[#1d1a16] dark:text-gray-100">
                      {formatDayHeading(selectedDate)}
                    </p>
                    <p className="mt-1 text-[12px] text-[#767869] dark:text-[#8e9ab0]">
                      {selectedDate === today ? '今天 · ' : ''}
                      {selectedEvents.length ? `${selectedEvents.length} 条事件` : '暂无公开记录'}
                    </p>
                  </div>
                </div>
                <div className="codex-reset-day-caption mb-4 hidden items-baseline justify-between gap-3 sm:flex">
                  <p className="font-serif text-[22px] font-semibold leading-none text-[#1d1a16] dark:text-gray-100 sm:text-[24px]">
                    {formatDayHeading(selectedDate)}
                  </p>
                  {selectedDate === today ? (
                    <span className="font-mono text-[12px] font-medium tracking-[0.06em] text-[#3f3f38] dark:text-[#d5dde8]">今天</span>
                  ) : null}
                </div>
                {selectedEvents.length ? (
                  <div className="space-y-4 sm:space-y-6">
                    {selectedEvents.map((event) => <EventDetail key={event.id} event={event} />)}
                  </div>
                ) : (
                  <div className="codex-reset-post-card rounded-2xl border border-[#e4e2da] px-4 py-7 text-center dark:border-[#2b3440]">
                    <p className="text-[15px] leading-6 text-[#1d1a16] dark:text-gray-100">许愿中 ✨🙏</p>
                    <p className="mt-1 text-[12px] leading-5 text-[#8a8174] dark:text-[#8e9ab0]">
                      这天还没有公开的重置或发卡记录
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-6 space-y-2.5 border-t border-[#dee0db] pt-4 text-[12px] leading-6 text-[#51514a] dark:border-gray-800 dark:text-gray-400 sm:mt-8 sm:space-y-3 sm:pt-5 sm:text-[13px]">
          <p>这里只记录公开的额度重置与重置卡发放，不猜测下一次重置。确认帖时间不等于账号到账时间；发卡不代表额度已恢复。</p>
          <p>
            统一使用北京时间。未写时区的预告按美国太平洋时间推定；跨日预告只标在预计范围的起始日。核验水位以接口返回的 <code>checkedAt</code> 为准
            {snapshot.checkedAt ? `（最近 ${formatBeijingPostTime(snapshot.checkedAt)}）` : ''}
            {source === 'fallback' ? '；当前展示的是备用快照，待上游恢复后再同步。' : '。'}
          </p>
          <p>
            <Link href="/tools#analysis">返回监测分析</Link>
          </p>
        </section>
      </div>
    </main>
  )
}

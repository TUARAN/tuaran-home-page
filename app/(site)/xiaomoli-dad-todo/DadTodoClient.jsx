'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { DAD_TODO_SECTIONS, DAD_TODO_TOTAL, isValidDadTodoItemId } from '../../../lib/dadTodoData'
import DadCheckinCalendar from './DadCheckinCalendar'

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { error: 'NON_JSON' }
  }
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function localYmd(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

const LEGACY_TODO_KEY = 'xiaomoli-dad-todo-v1'

export default function DadTodoClient() {
  const pathname = usePathname() || '/xiaomoli-dad-todo'
  const loginHref = `/login?returnTo=${encodeURIComponent(pathname)}`
  const logoutHref = `/api/auth/logout?returnTo=${encodeURIComponent(pathname)}`

  const [calView, setCalView] = useState(() => {
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() + 1 }
  })
  const [selectedYmd, setSelectedYmd] = useState(() => localYmd())
  const [dayCountByYmd, setDayCountByYmd] = useState({})
  const [loadingMonth, setLoadingMonth] = useState(false)

  const [completed, setCompleted] = useState(() => new Set())
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [useRemote, setUseRemote] = useState(false)
  const [todoRemoteNote, setTodoRemoteNote] = useState('')
  const [pendingId, setPendingId] = useState(null)

  const [boardRange, setBoardRange] = useState(() => ({ start: '', end: '', days: 30 }))
  const [boardItemCounts, setBoardItemCounts] = useState(null)
  const [loadingBoard, setLoadingBoard] = useState(false)

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_TODO_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const t = localYmd()
    if (selectedYmd > t) setSelectedYmd(t)
  }, [selectedYmd])

  const loadMonthCounts = useCallback(
    async (y, m) => {
      if (!user || !useRemote) {
        setDayCountByYmd({})
        return
      }
      setLoadingMonth(true)
      try {
        const res = await fetch(`/api/dad-todo?year=${y}&month=${m}`, { cache: 'no-store' })
        const data = await safeJson(res)
        if (res.status === 503) {
          setDayCountByYmd({})
          return
        }
        if (res.ok && data?.byDate && typeof data.byDate === 'object') {
          setDayCountByYmd(data.byDate)
        } else {
          setDayCountByYmd({})
        }
      } catch {
        setDayCountByYmd({})
      } finally {
        setLoadingMonth(false)
      }
    },
    [user, useRemote]
  )

  const loadBoard30 = useCallback(async () => {
    if (!user || !useRemote) {
      setBoardItemCounts(null)
      return
    }
    setLoadingBoard(true)
    const end = localYmd()
    try {
      const res = await fetch(
        `/api/dad-todo?end=${encodeURIComponent(end)}&rangeDays=30`,
        { cache: 'no-store' }
      )
      const data = await safeJson(res)
      if (res.status === 503) {
        setBoardItemCounts({})
        return
      }
      if (res.ok && data?.itemCounts && typeof data.itemCounts === 'object') {
        setBoardItemCounts(data.itemCounts)
        const days = Number(data.rangeDays) || 30
        setBoardRange({
          start: data.start || '',
          end: data.end || end,
          days: days >= 1 && days <= 90 ? days : 30,
        })
      } else {
        setBoardItemCounts({})
      }
    } catch {
      setBoardItemCounts({})
    } finally {
      setLoadingBoard(false)
    }
  }, [user, useRemote])

  useEffect(() => {
    loadMonthCounts(calView.year, calView.month)
  }, [calView.year, calView.month, loadMonthCounts])

  useEffect(() => {
    loadBoard30()
  }, [loadBoard30])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const meRes = await fetch('/api/me', { cache: 'no-store' })
        const me = await safeJson(meRes)
        if (cancelled) return
        setUser(me?.user || null)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!user) {
        setCompleted(new Set())
        setUseRemote(false)
        setTodoRemoteNote('')
        return
      }

      const tRes = await fetch(`/api/dad-todo?date=${encodeURIComponent(selectedYmd)}`, {
        cache: 'no-store',
      })
      const tData = await safeJson(tRes)
      if (cancelled) return

      if (tRes.status === 503) {
        setTodoRemoteNote(
          tData?.message || '待办需数据库。当前环境不可用，请稍后在已部署站点使用。'
        )
        setCompleted(new Set())
        setUseRemote(false)
        return
      }

      if (tRes.status === 401 || !tRes.ok) {
        setCompleted(new Set())
        setUseRemote(false)
        setTodoRemoteNote('')
        return
      }

      setUseRemote(true)
      setTodoRemoteNote('')

      const fromServer = new Set(
        (Array.isArray(tData?.completed) ? tData.completed : []).filter(
          (x) => typeof x === 'string' && isValidDadTodoItemId(x)
        )
      )
      if (!cancelled) setCompleted(fromServer)
    })()
    return () => {
      cancelled = true
    }
  }, [user, selectedYmd])

  const toggle = useCallback(
    async (id) => {
      if (!isValidDadTodoItemId(id) || !user || !useRemote || pendingId) return
      const t = localYmd()
      if (selectedYmd > t) return
      const wasDone = completed.has(id)
      setPendingId(id)

      setCompleted((prev) => {
        const next = new Set(prev)
        if (wasDone) next.delete(id)
        else next.add(id)
        return next
      })

      try {
        const res = wasDone
          ? await fetch(
              `/api/dad-todo?itemId=${encodeURIComponent(id)}&date=${encodeURIComponent(selectedYmd)}`,
              { method: 'DELETE', credentials: 'same-origin' }
            )
          : await fetch('/api/dad-todo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ itemId: id, date: selectedYmd }),
              credentials: 'same-origin',
            })

        if (res.status === 503) {
          const d = await safeJson(res)
          setTodoRemoteNote(d?.message || '数据库不可用，已恢复勾选。')
          setUseRemote(false)
          setCompleted((prev) => {
            const next = new Set(prev)
            if (wasDone) next.add(id)
            else next.delete(id)
            return next
          })
          return
        }

        if (!res.ok) {
          setCompleted((prev) => {
            const next = new Set(prev)
            if (wasDone) next.add(id)
            else next.delete(id)
            return next
          })
        } else {
          await loadMonthCounts(calView.year, calView.month)
          await loadBoard30()
        }
      } catch {
        setCompleted((prev) => {
          const next = new Set(prev)
          if (wasDone) next.add(id)
          else next.delete(id)
          return next
        })
      } finally {
        setPendingId(null)
      }
    },
    [user, useRemote, completed, pendingId, selectedYmd, calView.year, calView.month, loadMonthCounts, loadBoard30]
  )

  const doneCount = completed.size
  const todayYmd = localYmd()
  const canCheck = user && useRemote && selectedYmd <= todayYmd
  const persistHint = !user
    ? '登录 GitHub 后即可勾选清单，完成情况会按日保存到服务器。'
    : !useRemote
      ? '当前无法连接待办数据库。'
      : `对清单打勾会记在「${selectedYmd}」这一天的完成记录里。`

  const windowDays = boardRange.days
  const counts = boardItemCounts
  const sumSection = (itemIds) =>
    itemIds.reduce((acc, iid) => acc + (counts && typeof counts[iid] === 'number' ? counts[iid] : 0), 0)
  const sumAll =
    counts == null
      ? 0
      : DAD_TODO_SECTIONS.reduce((a, s) => a + sumSection(s.items.map((i) => i.id)), 0)

  const barBoardRows = [
    ...DAD_TODO_SECTIONS.map((s) => ({
      key: s.id,
      label: s.title,
      short: s.short || s.title.slice(0, 2),
      done: sumSection(s.items.map((i) => i.id)),
      total: windowDays * s.items.length,
    })),
    {
      key: 'all',
      label: '全部',
      short: '合计',
      done: sumAll,
      total: windowDays * DAD_TODO_TOTAL,
    },
  ]

  const sectionById = Object.fromEntries(DAD_TODO_SECTIONS.map((s) => [s.id, s]))
  const poopSection = sectionById['baby-poop']
  const momSection = sectionById['mom-fitness']
  const dailySection = sectionById['daily']

  const SECTION_ACCENT = {
    'baby-poop': '#c89978',
    'mom-fitness': '#8ba98b',
    daily: '#7a93b0',
  }

  const formatMD = (ymd) => {
    if (!ymd) return ''
    const parts = ymd.split('-')
    if (parts.length !== 3) return ymd
    return `${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`
  }
  const isToday = selectedYmd === todayYmd
  const todayPct = DAD_TODO_TOTAL > 0 ? Math.round((doneCount / DAD_TODO_TOTAL) * 100) : 0

  const renderCheckbox = (item) => {
    const isDone = completed.has(item.id)
    const isBusy = pendingId === item.id
    return (
      <li key={item.id}>
        <label
          className={`flex items-start gap-2.5 rounded-md px-1 py-0.5 transition-colors ${
            canCheck ? 'cursor-pointer hover:bg-[#f8f5f0]/80 dark:hover:bg-[#1a222c]' : 'cursor-not-allowed opacity-60'
          } ${isDone ? 'opacity-55' : ''}`}
        >
          <input
            type="checkbox"
            checked={isDone}
            disabled={!canCheck || isBusy}
            onChange={() => toggle(item.id)}
            className="mt-[3px] h-[15px] w-[15px] shrink-0 rounded border-[#c4b8a8] text-[#4a6fa5] focus:ring-[#4a6fa5] disabled:cursor-not-allowed dark:border-[#4a5568] dark:bg-[#1a222c]"
          />
          <span
            className={`text-[0.88rem] leading-relaxed text-[#333] dark:text-gray-200 ${
              isDone ? 'line-through decoration-[#9a8f82]' : ''
            }`}
          >
            {item.label}
          </span>
        </label>
      </li>
    )
  }

  const renderChip = (item) => {
    const isDone = completed.has(item.id)
    const isBusy = pendingId === item.id
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => toggle(item.id)}
        disabled={!canCheck || isBusy}
        aria-pressed={isDone}
        className={`flex-1 rounded-full border px-3 py-2 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
          isDone
            ? 'border-[#4a6fa5] bg-[#4a6fa5] text-white shadow-sm dark:border-[#5a7ab0] dark:bg-[#3d5a8a]'
            : 'border-[#e2d8c6] bg-white text-[#5c5348] hover:border-[#c8b89e] dark:border-[#2a3440] dark:bg-[#121820] dark:text-gray-300'
        }`}
      >
        {item.label}
      </button>
    )
  }

  const renderPill = (item) => {
    const isDone = completed.has(item.id)
    const isBusy = pendingId === item.id
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => toggle(item.id)}
        disabled={!canCheck || isBusy}
        aria-pressed={isDone}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm font-medium transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
          isDone
            ? 'border-[#4a6fa5] bg-[#4a6fa5] text-white shadow-sm dark:border-[#5a7ab0] dark:bg-[#3d5a8a]'
            : 'border-[#e2d8c6] bg-white text-[#5c5348] hover:border-[#c8b89e] dark:border-[#2a3440] dark:bg-[#121820] dark:text-gray-300'
        }`}
      >
        <span>{item.label}</span>
        <span aria-hidden="true" className="text-base leading-none">{isDone ? '✓' : '○'}</span>
      </button>
    )
  }

  const SectionShell = ({ accent, title, hint, count, total, children }) => (
    <section className="rounded-2xl border border-[#e8e0d0] bg-white/85 p-3.5 dark:border-[#252d38] dark:bg-[#121820]/90">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h2 className="!mb-0 !border-b-0 !pb-0 flex items-center gap-2 text-[0.95rem] font-semibold leading-tight tracking-tight text-[#2d261d] dark:text-gray-100">
          <span
            aria-hidden="true"
            className="inline-block h-[7px] w-[7px] rounded-full"
            style={{ backgroundColor: accent }}
          />
          {title}
        </h2>
        <span className="flex items-baseline gap-2 text-[11px] text-[#9a8f7f] dark:text-gray-500">
          {typeof count === 'number' && typeof total === 'number' ? (
            <span className="tabular-nums">
              <span className="font-semibold text-[#2d261d] dark:text-gray-200">{count}</span>
              <span> / {total}</span>
            </span>
          ) : null}
          {hint ? <span>{hint}</span> : null}
        </span>
      </div>
      {children}
    </section>
  )

  const poopDone = poopSection ? poopSection.items.filter((i) => completed.has(i.id)).length : 0
  const momDone = momSection ? momSection.items.filter((i) => completed.has(i.id)).length : 0
  const dailyDone = dailySection ? dailySection.items.filter((i) => completed.has(i.id)).length : 0

  return (
    <main className="min-h-[100dvh] bg-[#f8f5f0] px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] dark:bg-[#0b1016]">
      <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col">
        <header className="pb-3 pt-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[1.15rem] font-semibold leading-tight tracking-tight text-[#221f19] dark:text-gray-100">
              小茉莉的爸爸带娃清单
            </h1>
            <Link
              href="/eatwhat"
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#d8e6dd] bg-white/70 px-2.5 py-1 text-[11px] font-medium text-[#42957f] transition hover:border-[#a8d4c0] dark:border-[#2a3f3a] dark:bg-[#121820]/70 dark:text-[#7fc7b0]"
            >
              今天吃什么
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </header>

        {todoRemoteNote ? (
          <p className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            {todoRemoteNote}
          </p>
        ) : null}

        {/* 登录态：默认显示登录 CTA，确认登录后切换成用户 chip */}
        {user ? (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-[#e8e0d0] bg-white/70 px-3 py-1.5 text-xs text-[#5c5348] dark:border-[#252d38] dark:bg-[#121820]/70 dark:text-gray-400">
            <div className="flex min-w-0 items-center gap-2">
              {user.image ? (
                <Image
                  src={user.image}
                  alt=""
                  width={20}
                  height={20}
                  unoptimized
                  className="h-5 w-5 shrink-0 rounded-full"
                />
              ) : (
                <span aria-hidden="true" className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#8ba98b]" />
              )}
              <span className="truncate">{user.name || user.login || '已登录'}</span>
            </div>
            <a
              href={logoutHref}
              className="shrink-0 text-[11px] text-[#9a8f7f] no-underline hover:text-[#5c5348] dark:text-gray-500 dark:hover:text-gray-300"
            >
              退出
            </a>
          </div>
        ) : (
          <a
            href={loginHref}
            className={`mb-3 flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium no-underline transition ${
              authLoading
                ? 'border-[#d8cdb8] bg-white/60 text-[#8a7f6f] dark:border-[#2a3440] dark:bg-[#121820]/60 dark:text-gray-500'
                : 'border-[#4a6fa5] bg-[#4a6fa5]/10 text-[#3d5a80] hover:bg-[#4a6fa5]/15 dark:border-[#6b8cbc] dark:bg-[#2a3f5c]/40 dark:text-[#a8c4e8]'
            }`}
          >
            <span>{authLoading ? '检测登录…' : '私域内容 · 仅站长可写入 · 登录 →'}</span>
            <span aria-hidden="true">→</span>
          </a>
        )}

        {/* 今日卡片：选中日期 + 进度 */}
        <div className="mb-4 rounded-2xl border border-[#e8e0d0] bg-white/85 px-4 py-3 dark:border-[#252d38] dark:bg-[#121820]/90">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#9a8f7f] dark:text-gray-500">
                {isToday ? '今日' : '回填'}
              </p>
              <p className="mt-0.5 text-[1.05rem] font-semibold tracking-tight text-[#221f19] dark:text-gray-100">
                {formatMD(selectedYmd)}
                {!isToday ? (
                  <span className="ml-2 text-[11px] font-normal text-[#9a8f7f]">{selectedYmd}</span>
                ) : null}
              </p>
            </div>
            <p className="tabular-nums text-[#2d261d] dark:text-gray-200">
              <span className="text-[1.35rem] font-semibold">{doneCount}</span>
              <span className="text-[0.85rem] text-[#b0a99c] dark:text-gray-500"> / {DAD_TODO_TOTAL}</span>
            </p>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-[#ece4d6] dark:bg-[#1a222c]">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#2d4a78] to-[#5a8cc9] transition-[width] duration-300 dark:from-[#2a4570] dark:to-[#5a7ab0]"
              style={{ width: `${todayPct}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-[#9a8f7f] dark:text-gray-500">
            {persistHint}
          </p>
        </div>

        {/* 三个操作模块 */}
        <div className="flex flex-col gap-3">
          {poopSection ? (
            <SectionShell
              accent={SECTION_ACCENT['baby-poop']}
              title="便便记录"
              hint="按时段"
              count={poopDone}
              total={poopSection.items.length}
            >
              <div className="flex gap-2">{poopSection.items.map(renderChip)}</div>
            </SectionShell>
          ) : null}

          {momSection ? (
            <SectionShell
              accent={SECTION_ACCENT['mom-fitness']}
              title="妈妈锻炼"
              hint="每日"
              count={momDone}
              total={momSection.items.length}
            >
              {momSection.items.map(renderPill)}
            </SectionShell>
          ) : null}

          {dailySection ? (
            <SectionShell
              accent={SECTION_ACCENT.daily}
              title="日常 · 家务动线"
              count={dailyDone}
              total={dailySection.items.length}
            >
              <ul className="space-y-1.5">{dailySection.items.map(renderCheckbox)}</ul>
            </SectionShell>
          ) : null}
        </div>

        {/* 历史区：日历 + 30 天统计，折叠 */}
        <details className="group mt-5 rounded-2xl border border-[#e8e0d0] bg-white/60 dark:border-[#252d38] dark:bg-[#121820]/70">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[0.85rem] font-medium text-[#5c5348] transition hover:text-[#221f19] dark:text-gray-300 dark:hover:text-gray-100">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="inline-block h-[7px] w-[7px] rounded-full bg-[#b0a99c]" />
              历史 · 日历与统计
            </span>
            <span
              aria-hidden="true"
              className="text-[#b0a99c] transition-transform group-open:rotate-180 dark:text-gray-500"
            >
              ▾
            </span>
          </summary>
          <div className="space-y-4 px-3 pb-4">
            <DadCheckinCalendar
              user={user}
              authLoading={authLoading}
              view={calView}
              onViewChange={setCalView}
              selectedYmd={selectedYmd}
              onSelectYmd={setSelectedYmd}
              dayCountByYmd={dayCountByYmd}
              loadingMonth={loadingMonth}
            />
            <div className="rounded-xl border border-[#e8e0d0] bg-white/70 px-3.5 py-3 dark:border-[#252d38] dark:bg-[#121820]/80">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9a8f7f] dark:text-gray-500">
                  近 {windowDays} 天
                </p>
                {boardRange.start && boardRange.end ? (
                  <p className="font-mono text-[10.5px] text-[#b0a99c] dark:text-gray-500">
                    {boardRange.start} ～ {boardRange.end}
                  </p>
                ) : loadingBoard && user && useRemote ? (
                  <p className="text-[10.5px] text-[#b0a99c]">加载中…</p>
                ) : null}
              </div>
              <div
                className="space-y-1.5"
                role="img"
                aria-label={
                  user && useRemote && boardItemCounts
                    ? `最近 ${windowDays} 天合计 ${sumAll} 次，满额 ${windowDays * DAD_TODO_TOTAL} 人次`
                    : '进度看板'
                }
              >
                {barBoardRows.map((row) => {
                  const pct = row.total > 0 ? Math.round((row.done / row.total) * 100) : 0
                  const isAll = row.key === 'all'
                  return (
                    <div key={row.key} className="flex items-center gap-2.5 text-[0.72rem]">
                      <span
                        className={`w-10 shrink-0 ${
                          isAll
                            ? 'font-semibold text-[#2d261d] dark:text-gray-200'
                            : 'text-[#8a7f6f] dark:text-gray-400'
                        }`}
                      >
                        {row.short}
                      </span>
                      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#ece4d6] dark:bg-[#1a222c]">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ${
                            isAll
                              ? 'bg-gradient-to-r from-[#2d4a78] to-[#4a6fa5] dark:from-[#2a4570] dark:to-[#5a7ab0]'
                              : 'bg-gradient-to-r from-[#5a8cc9] to-[#7fa8d4] dark:from-[#3d5a8a] dark:to-[#5a7ab0]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-14 shrink-0 text-right tabular-nums text-[#2d261d] dark:text-gray-200">
                        <span className="font-semibold">{row.done}</span>
                        <span className="text-[#b0a99c] dark:text-gray-500"> / {row.total}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </details>
      </div>
    </main>
  )
}

'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { DAD_TODO_SECTIONS, DAD_TODO_TOTAL, isValidDadTodoItemId } from '../../lib/dadTodoData'
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
    ? '请先用上方 GitHub 登录；点日历选「当日」，再对下方清单勾选（按日保存到服务器）。'
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

  return (
    <main className="min-h-[100dvh] bg-[#f8f5f0] px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] dark:bg-[#0b1016]">
      <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col">
        <header className="pt-6 pb-5">
          <h1 className="mb-2 text-[1.35rem] font-semibold leading-snug tracking-tight text-[#221f19] dark:text-gray-100">
            小茉莉的爸爸带娃清单
          </h1>
          <p className="mb-3 text-[0.95rem] leading-relaxed text-[#5c5348] dark:text-gray-400">
            好习惯，增强动线，让琐碎生活少点折磨。
          </p>
          <Link
            href="/eatwhat"
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#cfe6d8] bg-gradient-to-br from-[#edf8f1] to-[#e7f3ff] px-4 py-2 text-sm font-semibold text-[#42957f] shadow-sm transition-transform active:scale-[0.985] dark:border-[#2a3f3a] dark:from-[#1a2e26] dark:to-[#1a2532] dark:text-[#7fc7b0]"
          >
            <span>今天吃什么</span>
            <span aria-hidden="true">→</span>
          </Link>
          {todoRemoteNote ? (
            <p className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              {todoRemoteNote}
            </p>
          ) : null}
          <div className="rounded-xl border border-[#ddd3c4] bg-white/80 px-4 py-3 dark:border-[#2a3440] dark:bg-[#121820]/90">
            <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
              <p className="text-xs font-medium tracking-wide text-[#8a7f6f] dark:text-gray-500">进度看板</p>
              {boardRange.start && boardRange.end ? (
                <p className="text-[11px] leading-relaxed text-[#9a8f7f] dark:text-gray-500">
                  最近 {windowDays} 天
                  <span className="ml-1.5 font-mono text-[#5c5348] dark:text-gray-400">
                    {boardRange.start} ～ {boardRange.end}
                  </span>
                </p>
              ) : loadingBoard && user && useRemote ? (
                <p className="text-[11px] text-[#9a8f7f]">统计加载中…</p>
              ) : null}
            </div>
            <div
              className="flex items-end justify-between gap-1.5 sm:gap-3"
              role="img"
              aria-label={
                user && useRemote && boardItemCounts
                  ? `最近 ${windowDays} 天 合计勾选 ${sumAll} 次，满额 ${windowDays * DAD_TODO_TOTAL} 人次数`
                  : '进度看板'
              }
            >
              {barBoardRows.map((row) => {
                const pct = row.total > 0 ? Math.round((row.done / row.total) * 100) : 0
                const isAll = row.key === 'all'
                return (
                  <div
                    key={row.key}
                    className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                  >
                    <div
                      className={`relative w-full max-w-[3.5rem] overflow-hidden rounded-t-md border border-[#e8dfd2] bg-[#f0e9de] dark:border-[#2f3a45] dark:bg-[#1a222c] ${
                        isAll ? 'h-36 sm:h-40' : 'h-28 sm:h-32'
                      }`}
                      title={`${row.label}：${row.done} / ${row.total}（近 ${windowDays} 天累计人次数 / 满额）`}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-[5px] bg-gradient-to-t from-[#3d6ba8] to-[#5a8cc9] transition-[height] duration-300 dark:from-[#3d5a8a] dark:to-[#5a7ab0]"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <p className="w-full text-center text-[0.65rem] font-medium leading-tight text-[#6b6258] dark:text-gray-500">
                      {row.short}
                    </p>
                    <p className="text-[0.7rem] tabular-nums text-[#2d261d] dark:text-gray-200">
                      <span className="font-semibold">{row.done}</span>
                      <span className="text-[#b0a99c] dark:text-gray-500"> / {row.total}</span>
                    </p>
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#8a7f6f] dark:text-gray-500">{persistHint}</p>
          </div>
        </header>

        <div className="mb-6">
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
        </div>

        <div className="flex flex-1 flex-col gap-6">
          {DAD_TODO_SECTIONS.map((section) => (
            <section
              key={section.id}
              className="rounded-2xl border border-[#e5ddd0] bg-white/90 p-4 shadow-sm dark:border-[#2a3440] dark:bg-[#121820]/95"
            >
              <h2 className="mb-3 text-base font-semibold text-[#2d261d] dark:text-gray-100">{section.title}</h2>
              <p className="mb-4 text-sm leading-relaxed text-[#5c5348] dark:text-gray-400">
                {section.description}
              </p>
              <ul className="space-y-3">
                {section.items.map((item) => {
                  const isDone = completed.has(item.id)
                  const isBusy = pendingId === item.id
                  return (
                    <li key={item.id}>
                      <label
                        className={`flex items-start gap-3 rounded-lg px-1 py-1 transition-colors ${
                          canCheck ? 'cursor-pointer hover:bg-[#f8f5f0]/80 dark:hover:bg-[#1a222c]' : 'cursor-not-allowed opacity-60'
                        } ${isDone ? 'opacity-60' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          disabled={!canCheck || isBusy}
                          onChange={() => toggle(item.id)}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-[#c4b8a8] text-[#4a6fa5] focus:ring-[#4a6fa5] disabled:cursor-not-allowed dark:border-[#4a5568] dark:bg-[#1a222c]"
                        />
                        <span
                          className={`text-[0.95rem] leading-relaxed text-[#333] dark:text-gray-200 ${
                            isDone ? 'line-through decoration-[#9a8f82]' : ''
                          }`}
                        >
                          {item.label}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}

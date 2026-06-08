'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  DAD_TODO_SECTIONS,
  DAD_TODO_TOTAL,
  getSectionItems,
  isValidDadTodoItemId,
} from '../../../lib/dadTodoData'
import { useSessionAccount } from '../components/SessionProvider'
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

function formatMD(ymd) {
  if (!ymd) return ''
  const parts = ymd.split('-')
  if (parts.length !== 3) return ymd
  return `${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`
}

const LEGACY_TODO_KEY = 'xiaomoli-dad-todo-v1'

export default function DadTodoClient() {
  const pathname = usePathname() || '/xiaomoli-dad-todo'
  const loginHref = `/login?returnTo=${encodeURIComponent(pathname)}`
  const logoutHref = `/api/auth/logout?returnTo=${encodeURIComponent(pathname)}`

  const [activeTab, setActiveTab] = useState('daily')

  const [calView, setCalView] = useState(() => {
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() + 1 }
  })
  const [selectedYmd, setSelectedYmd] = useState(() => localYmd())
  const [dayCountByYmd, setDayCountByYmd] = useState({})
  const [loadingMonth, setLoadingMonth] = useState(false)

  const [completed, setCompleted] = useState(() => new Set())
  const session = useSessionAccount()
  const user = session.isOwner ? session.user : null
  const authLoading = session.loading
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

  const todayYmd = localYmd()
  const canCheck = user && useRemote && selectedYmd <= todayYmd
  const isToday = selectedYmd === todayYmd

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

  // 每 tab 的完成进度
  const sectionStats = useMemo(() => {
    const out = {}
    for (const s of DAD_TODO_SECTIONS) {
      const items = getSectionItems(s)
      const done = items.filter((i) => completed.has(i.id)).length
      out[s.id] = { done, total: items.length }
    }
    return out
  }, [completed])

  const activeSection = DAD_TODO_SECTIONS.find((s) => s.id === activeTab) || DAD_TODO_SECTIONS[0]
  const activeStats = sectionStats[activeSection.id] || { done: 0, total: 0 }
  const activePct =
    activeStats.total > 0 ? Math.round((activeStats.done / activeStats.total) * 100) : 0

  // 30 天柱状图
  const windowDays = boardRange.days
  const counts = boardItemCounts
  const sumSection = (itemIds) =>
    itemIds.reduce((acc, iid) => acc + (counts && typeof counts[iid] === 'number' ? counts[iid] : 0), 0)
  const sumAll =
    counts == null
      ? 0
      : DAD_TODO_SECTIONS.reduce((a, s) => a + sumSection(getSectionItems(s).map((i) => i.id)), 0)

  const barBoardRows = [
    ...DAD_TODO_SECTIONS.map((s) => ({
      key: s.id,
      label: s.title,
      short: s.short || s.title.slice(0, 2),
      done: sumSection(getSectionItems(s).map((i) => i.id)),
      total: windowDays * getSectionItems(s).length,
    })),
    {
      key: 'all',
      label: '合计',
      short: '合计',
      done: sumAll,
      total: windowDays * DAD_TODO_TOTAL,
    },
  ]

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
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#d8e6dd] bg-white/70 px-2.5 py-1 text-[11px] font-medium text-[#42957f] no-underline transition hover:border-[#a8d4c0] dark:border-[#2a3f3a] dark:bg-[#121820]/70 dark:text-[#7fc7b0]"
            >
              今天吃什么
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </header>

        {/* 未登录态：极简 CTA，不渲染下方的打卡 UI */}
        {!user ? (
          <UnauthenticatedView authLoading={authLoading} loginHref={loginHref} />
        ) : (
          <>
            {todoRemoteNote ? (
              <p className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                {todoRemoteNote}
              </p>
            ) : null}

            <UserChip user={user} logoutHref={logoutHref} />

            <DateCard
              selectedYmd={selectedYmd}
              isToday={isToday}
              activeSection={activeSection}
              activeStats={activeStats}
              activePct={activePct}
              onJumpToToday={() => setSelectedYmd(todayYmd)}
            />

            <TabStrip
              sections={DAD_TODO_SECTIONS}
              activeTab={activeTab}
              onChange={setActiveTab}
              sectionStats={sectionStats}
            />

            <TabPanel
              section={activeSection}
              completed={completed}
              pendingId={pendingId}
              canCheck={canCheck}
              onToggle={toggle}
            />

            <HistoryFold
              user={user}
              authLoading={authLoading}
              calView={calView}
              setCalView={setCalView}
              selectedYmd={selectedYmd}
              setSelectedYmd={setSelectedYmd}
              dayCountByYmd={dayCountByYmd}
              loadingMonth={loadingMonth}
              barBoardRows={barBoardRows}
              boardRange={boardRange}
              loadingBoard={loadingBoard}
              useRemote={useRemote}
              sumAll={sumAll}
              windowDays={windowDays}
            />
          </>
        )}
      </div>
    </main>
  )
}

/** 未登录态 —— 不渲染任何打卡 UI，只一句 CTA。 */
function UnauthenticatedView({ authLoading, loginHref }) {
  return (
    <section className="mt-6 rounded-2xl border border-[#e8e0d0] bg-white/85 px-5 py-8 text-center dark:border-[#252d38] dark:bg-[#121820]/90">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[#9a8f7f] dark:text-[#8e9ab0]">
        Private · 仅站长本人可见
      </p>
      <h2 className="mt-3 font-serif text-[1.1rem] font-semibold text-[#221f19] dark:text-gray-100">
        家庭打卡清单
      </h2>
      <p className="mt-2 px-2 text-[12.5px] leading-6 text-[#6f6757] dark:text-gray-400">
        这是站长（涂阿燃）家庭日常的私域打卡，不公开。
      </p>
      <a
        href={loginHref}
        className={`mt-6 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium no-underline transition ${
          authLoading
            ? 'border-[#d8cdb8] bg-white/60 text-[#8a7f6f] dark:border-[#2a3440] dark:bg-[#121820]/60 dark:text-gray-500'
            : 'border-[#4a6fa5] bg-[#4a6fa5]/10 text-[#3d5a80] hover:bg-[#4a6fa5]/15 dark:border-[#6b8cbc] dark:bg-[#2a3f5c]/40 dark:text-[#a8c4e8]'
        }`}
      >
        <span>{authLoading ? '检测登录…' : '登录'}</span>
        <span aria-hidden="true">→</span>
      </a>
    </section>
  )
}

function UserChip({ user, logoutHref }) {
  return (
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
  )
}

/** 日期卡片：选中日 + 当前 tab 的子合计 + 进度条 + 回到今天。 */
function DateCard({ selectedYmd, isToday, activeSection, activeStats, activePct, onJumpToToday }) {
  return (
    <div className="mb-4 rounded-2xl border border-[#e8e0d0] bg-white/85 px-4 py-3 dark:border-[#252d38] dark:bg-[#121820]/90">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#9a8f7f] dark:text-gray-500">
            {isToday ? '今日' : '回填'}
          </p>
          <p className="mt-0.5 text-[1.05rem] font-semibold tracking-tight text-[#221f19] dark:text-gray-100">
            {formatMD(selectedYmd)}
            {!isToday ? (
              <button
                type="button"
                onClick={onJumpToToday}
                className="ml-3 rounded-full border border-[#dcd3c4] bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-[#5c5348] no-underline transition hover:border-[#b9aa8c] dark:border-[#2d3744] dark:bg-[#1a222c] dark:text-gray-300 dark:hover:border-gray-500"
              >
                ← 回到今天
              </button>
            ) : null}
          </p>
        </div>
        <p className="text-right tabular-nums text-[#2d261d] dark:text-gray-200">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9a8f7f] dark:text-gray-500">
            {activeSection.short}
          </span>
          <br />
          <span className="text-[1.35rem] font-semibold">{activeStats.done}</span>
          <span className="text-[0.85rem] text-[#b0a99c] dark:text-gray-500"> / {activeStats.total}</span>
        </p>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-[#ece4d6] dark:bg-[#1a222c]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#2d4a78] to-[#5a8cc9] transition-[width] duration-300 dark:from-[#2a4570] dark:to-[#5a7ab0]"
          style={{ width: `${activePct}%` }}
        />
      </div>
    </div>
  )
}

/** Tab 条：三个主体并排，各自显示 X/N。 */
function TabStrip({ sections, activeTab, onChange, sectionStats }) {
  return (
    <div
      role="tablist"
      aria-label="打卡分类"
      className="mb-3 flex gap-1.5 rounded-xl border border-[#e8e0d0] bg-white/60 p-1 dark:border-[#252d38] dark:bg-[#121820]/60"
    >
      {sections.map((s) => {
        const active = s.id === activeTab
        const stats = sectionStats[s.id] || { done: 0, total: 0 }
        const fullyDone = stats.total > 0 && stats.done === stats.total
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.id)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-center text-[12.5px] font-medium transition-colors ${
              active
                ? 'bg-[#4a6fa5] text-white shadow-sm dark:bg-[#3d5a8a]'
                : 'text-[#5c5348] hover:bg-white/80 dark:text-gray-400 dark:hover:bg-[#1a222c]'
            }`}
          >
            <span className="block">{s.short}</span>
            <span
              className={`mt-0.5 block text-[10.5px] tabular-nums ${
                active
                  ? 'text-white/85'
                  : fullyDone
                    ? 'text-[#3d6b4a] dark:text-[#7fcf8f]'
                    : 'text-[#9a8f7f] dark:text-gray-500'
              }`}
            >
              {stats.done} / {stats.total}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Tab 内容：渲染 active section 的所有 item，统一用 pill 控件。 */
function TabPanel({ section, completed, pendingId, canCheck, onToggle }) {
  // 有 groups 的 section（如「爸爸 · 日常」）按 group 渲染子标题；否则平铺
  const groups = section.groups || [{ id: section.id, title: '', items: getSectionItems(section) }]
  return (
    <section
      role="tabpanel"
      className="rounded-2xl border border-[#e8e0d0] bg-white/85 p-3.5 dark:border-[#252d38] dark:bg-[#121820]/90"
    >
      <div className="flex flex-col gap-4">
        {groups.map((group, idx) => (
          <div key={group.id}>
            {group.title ? (
              <p
                className={`mb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#9a8f7f] dark:text-gray-500 ${
                  idx > 0 ? '' : ''
                }`}
              >
                {group.title}
              </p>
            ) : null}
            <div className="flex flex-col gap-1.5">
              {group.items.map((item) => (
                <TodoPill
                  key={item.id}
                  item={item}
                  done={completed.has(item.id)}
                  busy={pendingId === item.id}
                  disabled={!canCheck}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/** 唯一的打勾控件：pill。短 label 自动收窄，长 label 自动换行。 */
function TodoPill({ item, done, busy, disabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(item.id)}
      disabled={disabled || busy}
      aria-pressed={done}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
        done
          ? 'border-[#4a6fa5] bg-[#4a6fa5] text-white shadow-sm dark:border-[#5a7ab0] dark:bg-[#3d5a8a]'
          : 'border-[#e2d8c6] bg-white text-[#5c5348] hover:border-[#c8b89e] dark:border-[#2a3440] dark:bg-[#121820] dark:text-gray-300'
      }`}
    >
      <span className="min-w-0 flex-1">{item.label}</span>
      <span aria-hidden="true" className="shrink-0 text-base leading-none">
        {done ? '✓' : '○'}
      </span>
    </button>
  )
}

function HistoryFold({
  user,
  authLoading,
  calView,
  setCalView,
  selectedYmd,
  setSelectedYmd,
  dayCountByYmd,
  loadingMonth,
  barBoardRows,
  boardRange,
  loadingBoard,
  useRemote,
  sumAll,
  windowDays,
}) {
  return (
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
              user && useRemote
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
  )
}

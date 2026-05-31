'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

import { DAD_TODO_TOTAL } from '../../../lib/dadTodoData'

function pad2(n) {
  return String(n).padStart(2, '0')
}

function localYmd(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function monthGrid(year, month) {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  const daysInMonth = last.getDate()
  const startPad = (first.getDay() + 6) % 7
  const cells = []
  for (let i = 0; i < startPad; i += 1) cells.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d)
  return cells
}

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日']

/**
 * 仅作日期切换与当月进度展示（由 dad_todo 日维度统计画点）。
 * dayCountByYmd: 某日在 dad_todo 中已勾选的条数 0~TOTAL
 */
export default function DadCheckinCalendar({
  user,
  authLoading,
  view,
  onViewChange,
  selectedYmd,
  onSelectYmd,
  dayCountByYmd = {},
  loadingMonth,
}) {
  const pathname = usePathname() || '/'
  const loginHref = `/api/auth/login?returnTo=${encodeURIComponent(pathname)}`
  const logoutHref = `/api/auth/logout?returnTo=${encodeURIComponent(pathname)}`

  const todayYmd = localYmd()
  const cells = useMemo(() => monthGrid(view.year, view.month), [view.year, view.month])

  const p = `${view.year}-${pad2(view.month)}-`
  const monthHasProgressDays = useMemo(() => {
    let n = 0
    for (const [ymd, c] of Object.entries(dayCountByYmd)) {
      if (ymd.startsWith(p) && (c || 0) > 0) n += 1
    }
    return n
  }, [dayCountByYmd, p])

  function shiftMonth(delta) {
    onViewChange((v) => {
      let y = v.year
      let m = v.month + delta
      if (m < 1) {
        m = 12
        y -= 1
      } else if (m > 12) {
        m = 1
        y += 1
      }
      return { year: y, month: m }
    })
  }

  const title = `${view.year} 年 ${view.month} 月`

  return (
    <section className="rounded-2xl border border-[#e5ddd0] bg-white/90 p-4 shadow-sm dark:border-[#2a3440] dark:bg-[#121820]/95">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-[#2d261d] dark:text-gray-100">选择日期</h2>
        <div className="flex items-center gap-2">
          {user ? (
            <a
              href={logoutHref}
              className="inline-flex items-center rounded-lg border border-[#ddd3c4] bg-white/80 px-3 py-1 text-xs text-[#5c5348] no-underline hover:bg-[#f0ebe3] dark:border-[#3d4a5c] dark:bg-[#1a222c] dark:text-gray-300 dark:hover:bg-[#243040]"
            >
              退出
            </a>
          ) : (
            <a
              href={loginHref}
              className="inline-flex items-center rounded-lg border border-[#4a6fa5] bg-[#4a6fa5]/10 px-3 py-1 text-xs font-medium text-[#3d5a80] no-underline hover:bg-[#4a6fa5]/20 dark:border-[#6b8cbc] dark:bg-[#2a3f5c]/40 dark:text-[#a8c4e8]"
            >
              {authLoading ? '检测登录…' : 'GitHub 登录'}
            </a>
          )}
        </div>
      </div>

      {user ? (
        <div className="mb-3 flex items-center gap-2 text-xs text-[#5c5348] dark:text-gray-400">
          {user.image ? (
            <Image src={user.image} alt="" width={24} height={24} unoptimized className="h-6 w-6 rounded-full" />
          ) : null}
          <span>{user.name || user.login || '已登录'}</span>
        </div>
      ) : (
        <p className="mb-3 text-xs leading-relaxed text-[#8a7f6f] dark:text-gray-500">
          登录后，点选日期会切换下面同一套清单的当日勾选；日历上的圆点表示该日已有完成条数；无需单独「打卡」某日期。
        </p>
      )}

      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="上个月"
          onClick={() => shiftMonth(-1)}
          disabled={!user || loadingMonth}
          className="rounded-lg border border-[#ddd3c4] px-2 py-1 text-sm text-[#2d261d] disabled:opacity-40 dark:border-[#3d4a5c] dark:text-gray-200"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-[#2d261d] dark:text-gray-100">{title}</span>
        <button
          type="button"
          aria-label="下个月"
          onClick={() => shiftMonth(1)}
          disabled={!user || loadingMonth}
          className="rounded-lg border border-[#ddd3c4] px-2 py-1 text-sm text-[#2d261d] disabled:opacity-40 dark:border-[#3d4a5c] dark:text-gray-200"
        >
          ›
        </button>
      </div>

      <p className="mb-2 text-xs text-[#8a7f6f] dark:text-gray-500">
        本月有完成记录{' '}
        <span className="font-semibold tabular-nums text-[#2d261d] dark:text-gray-200">
          {user ? monthHasProgressDays : '—'}
        </span>{' '}
        天 · 点选日期在下方打勾（不晚于今天）
      </p>

      <div
        className={`grid grid-cols-7 gap-1 text-center text-xs ${!user ? 'pointer-events-none opacity-50' : ''}`}
      >
        {WEEK_LABELS.map((w) => (
          <div key={w} className="py-1 font-medium text-[#8a7f6f] dark:text-gray-500">
            {w}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (day == null) {
            return <div key={`e-${idx}`} className="aspect-square" />
          }
          const ymd = `${view.year}-${pad2(view.month)}-${pad2(day)}`
          const isToday = ymd === todayYmd
          const isFuture = ymd > todayYmd
          const isSelected = ymd === selectedYmd
          const count = dayCountByYmd[ymd] || 0
          const isFull = count >= DAD_TODO_TOTAL
          const hasAny = count > 0
          return (
            <button
              key={ymd}
              type="button"
              disabled={!user || isFuture || loadingMonth}
              onClick={() => !isFuture && onSelectYmd(ymd)}
              className={`relative flex aspect-square items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
                hasAny
                  ? isFull
                    ? 'bg-[#6b9b7a]/45 text-[#1a3d24] dark:bg-[#5a8f6a]/50 dark:text-gray-100'
                    : 'bg-[#6b9b7a]/20 text-[#2d261d] dark:bg-[#3d4a40]/50 dark:text-gray-200'
                  : 'bg-[#f0ede6] text-[#2d261d] hover:bg-[#ebe4d6] dark:bg-[#1a222c] dark:text-gray-200 dark:hover:bg-[#243040]'
              } ${isSelected ? 'ring-2 ring-[#4a6fa5] ring-offset-1 ring-offset-[#f8f5f0] dark:ring-offset-[#0b1016]' : ''} ${
                isToday && !isSelected ? 'ring-1 ring-[#c4b8a8] dark:ring-gray-600' : ''
              } ${isFuture ? 'cursor-not-allowed opacity-35' : ''} ${!isFuture && user ? 'cursor-pointer' : ''} disabled:cursor-not-allowed`}
            >
              {day}
              {hasAny && !isFull ? (
                <span
                  className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-[#3d6b4a] dark:bg-[#7fcf8f]"
                  title={`已勾 ${count}/${DAD_TODO_TOTAL}`}
                />
              ) : null}
              {isFull ? (
                <span
                  className="absolute bottom-0.5 text-[8px] font-semibold text-[#1a3d24] dark:text-white/90"
                  title="当日已全部勾选"
                >
                  ✓
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}

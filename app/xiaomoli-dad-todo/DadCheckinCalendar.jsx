'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { error: 'NON_JSON_RESPONSE', detail: text.slice(0, 120) }
  }
}

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

export default function DadCheckinCalendar() {
  const pathname = usePathname() || '/'
  const loginHref = `/api/auth/login?returnTo=${encodeURIComponent(pathname)}`
  const logoutHref = `/api/auth/logout?returnTo=${encodeURIComponent(pathname)}`

  const [user, setUser] = useState(null)
  const [userLoading, setUserLoading] = useState(true)
  const [view, setView] = useState(() => {
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() + 1 }
  })
  const [checkedSet, setCheckedSet] = useState(() => new Set())
  const [loadingMonth, setLoadingMonth] = useState(false)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState('')
  const [dbNote, setDbNote] = useState('')

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/me', { cache: 'no-store' })
      const data = await safeJson(res)
      setUser(data?.user || null)
    } catch {
      setUser(null)
    } finally {
      setUserLoading(false)
    }
  }, [])

  const refreshMonth = useCallback(async () => {
    if (!user) {
      setCheckedSet(new Set())
      return
    }
    setLoadingMonth(true)
    setError('')
    setDbNote('')
    try {
      const res = await fetch(
        `/api/dad-checkin?year=${view.year}&month=${view.month}`,
        { cache: 'no-store' }
      )
      const data = await safeJson(res)
      if (res.status === 503) {
        setCheckedSet(new Set())
        setDbNote(data?.message || '当前环境无法连接打卡数据库。')
        return
      }
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      const dates = Array.isArray(data?.dates) ? data.dates : []
      setCheckedSet(new Set(dates.filter((x) => typeof x === 'string')))
    } catch (e) {
      setError(e?.message || 'LOAD_FAILED')
      setCheckedSet(new Set())
    } finally {
      setLoadingMonth(false)
    }
  }, [user, view.year, view.month])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  useEffect(() => {
    refreshMonth()
  }, [refreshMonth])

  const cells = useMemo(() => monthGrid(view.year, view.month), [view.year, view.month])

  const monthCheckedCount = checkedSet.size
  const todayYmd = localYmd()

  async function onDayClick(day) {
    if (!user || !day || mutating) return
    const ymd = `${view.year}-${pad2(view.month)}-${pad2(day)}`
    if (ymd > localYmd()) return

    setMutating(true)
    setError('')
    try {
      const isOn = checkedSet.has(ymd)
      if (isOn) {
        const res = await fetch(`/api/dad-checkin?date=${encodeURIComponent(ymd)}`, {
          method: 'DELETE',
        })
        const data = await safeJson(res)
        if (res.status === 503) {
          setDbNote(data?.message || '当前环境无法连接打卡数据库。')
          return
        }
        if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
        setCheckedSet((prev) => {
          const next = new Set(prev)
          next.delete(ymd)
          return next
        })
      } else {
        const res = await fetch('/api/dad-checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: ymd }),
        })
        const data = await safeJson(res)
        if (res.status === 503) {
          setDbNote(data?.message || '当前环境无法连接打卡数据库。')
          return
        }
        if (!res.ok && res.status !== 201) throw new Error(data?.error || `HTTP_${res.status}`)
        setCheckedSet((prev) => new Set(prev).add(ymd))
      }
    } catch (e) {
      setError(e?.message || 'UPDATE_FAILED')
    } finally {
      setMutating(false)
    }
  }

  function shiftMonth(delta) {
    setView((v) => {
      let { year, month } = v
      month += delta
      if (month < 1) {
        month = 12
        year -= 1
      } else if (month > 12) {
        month = 1
        year += 1
      }
      return { year, month }
    })
  }

  const title = `${view.year} 年 ${view.month} 月`

  return (
    <section className="rounded-2xl border border-[#e5ddd0] bg-white/90 p-4 shadow-sm dark:border-[#2a3440] dark:bg-[#121820]/95">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-[#2d261d] dark:text-gray-100">习惯打卡</h2>
        <div className="flex items-center gap-2">
          {user ? (
            <a
              href={logoutHref}
              className="inline-flex items-center rounded-lg border border-[#ddd3c4] bg-white/80 px-3 py-1 text-xs text-[#5c5348] no-underline hover:bg-[#f5f1e8] dark:border-[#3d4a5c] dark:bg-[#1a222c] dark:text-gray-300 dark:hover:bg-[#243040]"
            >
              退出
            </a>
          ) : (
            <a
              href={loginHref}
              className="inline-flex items-center rounded-lg border border-[#4a6fa5] bg-[#4a6fa5]/10 px-3 py-1 text-xs font-medium text-[#3d5a80] no-underline hover:bg-[#4a6fa5]/20 dark:border-[#6b8cbc] dark:bg-[#2a3f5c]/40 dark:text-[#a8c4e8]"
            >
              {userLoading ? '检测登录…' : 'GitHub 登录'}
            </a>
          )}
        </div>
      </div>

      {user ? (
        <div className="mb-3 flex items-center gap-2 text-xs text-[#5c5348] dark:text-gray-400">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="h-6 w-6 rounded-full" />
          ) : null}
          <span>{user.name || user.login || '已登录'}</span>
        </div>
      ) : (
        <p className="mb-3 text-xs leading-relaxed text-[#8a7f6f] dark:text-gray-500">
          使用 GitHub 登录后，可在日历上记录每日打卡；数据保存在服务器，仅与当前账号关联。
        </p>
      )}

      {dbNote ? (
        <p className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          {dbNote}
        </p>
      ) : null}

      {error ? (
        <p className="mb-3 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}

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
        本月已打卡{' '}
        <span className="font-semibold tabular-nums text-[#2d261d] dark:text-gray-200">
          {user ? monthCheckedCount : '—'}
        </span>{' '}
        天 · 点击日期可勾选 / 取消（不含未来日期）
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
          const isOn = checkedSet.has(ymd)
          return (
            <button
              key={ymd}
              type="button"
              disabled={!user || isFuture || mutating || loadingMonth}
              onClick={() => onDayClick(day)}
              className={`relative flex aspect-square items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
                isOn
                  ? 'bg-[#6b9b7a] text-white shadow-sm dark:bg-[#5a8f6a]'
                  : 'bg-[#f5f1e8] text-[#2d261d] hover:bg-[#ebe4d6] dark:bg-[#1a222c] dark:text-gray-200 dark:hover:bg-[#243040]'
              } ${isToday ? 'ring-2 ring-[#4a6fa5] ring-offset-1 ring-offset-[#f5f1e8] dark:ring-offset-[#0b1016]' : ''} ${
                isFuture ? 'cursor-not-allowed opacity-35' : ''
              } disabled:cursor-not-allowed`}
            >
              {day}
              {isOn ? (
                <span className="absolute bottom-0.5 text-[9px] font-normal opacity-90">✓</span>
              ) : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}

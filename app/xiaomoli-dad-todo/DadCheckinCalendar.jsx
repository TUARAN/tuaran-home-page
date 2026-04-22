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
  const [selectedYmd, setSelectedYmd] = useState(() => localYmd())
  const [dayHasRecord, setDayHasRecord] = useState(() => new Set())
  const [loadingMonth, setLoadingMonth] = useState(false)
  const [actionPending, setActionPending] = useState(false)
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
      setDayHasRecord(new Set())
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
        setDayHasRecord(new Set())
        setDbNote(data?.message || '当前环境无法连接打卡数据库。')
        return
      }
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      const dates = Array.isArray(data?.dates) ? data.dates : []
      const monthPrefix = `${view.year}-${pad2(view.month)}-`
      setDayHasRecord((prev) => {
        const next = new Set(prev)
        for (const k of next) {
          if (k.startsWith(monthPrefix)) next.delete(k)
        }
        for (const d of dates) {
          if (typeof d === 'string') next.add(d)
        }
        return next
      })
    } catch (e) {
      setError(e?.message || 'LOAD_FAILED')
      setDayHasRecord(new Set())
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
  const todayYmd = localYmd()

  const monthHasRecordCount = useMemo(() => {
    if (!user) return 0
    const p = `${view.year}-${pad2(view.month)}-`
    let n = 0
    for (const d of dayHasRecord) {
      if (d.startsWith(p)) n += 1
    }
    return n
  }, [user, dayHasRecord, view.year, view.month])

  const selectedHasRecord = user ? dayHasRecord.has(selectedYmd) : false
  const isSelectedFuture = selectedYmd > todayYmd
  const canActOnSelected = user && !isSelectedFuture && !dbNote

  function onSelectDay(day) {
    if (!user || !day) return
    const ymd = `${view.year}-${pad2(view.month)}-${pad2(day)}`
    if (ymd > todayYmd) return
    setSelectedYmd(ymd)
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

  async function onRecordThisDay() {
    if (!canActOnSelected || actionPending) return
    if (dayHasRecord.has(selectedYmd)) return
    setActionPending(true)
    setError('')
    try {
      const res = await fetch('/api/dad-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedYmd }),
        credentials: 'same-origin',
      })
      const data = await safeJson(res)
      if (res.status === 503) {
        setDbNote(data?.message || '当前环境无法连接打卡数据库。')
        return
      }
      if (!res.ok && res.status !== 201) throw new Error(data?.error || `HTTP_${res.status}`)
      setDayHasRecord((prev) => new Set(prev).add(selectedYmd))
      await refreshMonth()
    } catch (e) {
      setError(e?.message || 'UPDATE_FAILED')
    } finally {
      setActionPending(false)
    }
  }

  async function onCancelThisDay() {
    if (!canActOnSelected || actionPending) return
    if (!dayHasRecord.has(selectedYmd)) return
    setActionPending(true)
    setError('')
    try {
      const res = await fetch(`/api/dad-checkin?date=${encodeURIComponent(selectedYmd)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = await safeJson(res)
      if (res.status === 503) {
        setDbNote(data?.message || '当前环境无法连接打卡数据库。')
        return
      }
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setDayHasRecord((prev) => {
        const n = new Set(prev)
        n.delete(selectedYmd)
        return n
      })
      await refreshMonth()
    } catch (e) {
      setError(e?.message || 'UPDATE_FAILED')
    } finally {
      setActionPending(false)
    }
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
              className="inline-flex items-center rounded-lg border border-[#ddd3c4] bg-white/80 px-3 py-1 text-xs text-[#5c5348] no-underline hover:bg-[#f0ebe3] dark:border-[#3d4a5c] dark:bg-[#1a222c] dark:text-gray-300 dark:hover:bg-[#243040]"
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
          使用 GitHub 登录后，点击日历中的日期可切换「当前查看的日期」；有打卡的日期在格子上有标记。打卡/取消在日历下方对所选日操作。
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
        本月有打卡记录{' '}
        <span className="font-semibold tabular-nums text-[#2d261d] dark:text-gray-200">
          {user ? monthHasRecordCount : '—'}
        </span>{' '}
        天 · 点击日期切换当前查看的日期（不直接打卡）
      </p>

      <div
        className={`mb-4 grid grid-cols-7 gap-1 text-center text-xs ${!user ? 'pointer-events-none opacity-50' : ''}`}
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
          const hasRec = dayHasRecord.has(ymd)
          return (
            <button
              key={ymd}
              type="button"
              disabled={!user || isFuture || loadingMonth}
              onClick={() => onSelectDay(day)}
              className={`relative flex aspect-square items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
                hasRec
                  ? 'bg-[#6b9b7a]/35 text-[#1a3d24] dark:bg-[#5a8f6a]/40 dark:text-gray-100'
                  : 'bg-[#f0ede6] text-[#2d261d] hover:bg-[#ebe4d6] dark:bg-[#1a222c] dark:text-gray-200 dark:hover:bg-[#243040]'
              } ${isSelected ? 'ring-2 ring-[#4a6fa5] ring-offset-1 ring-offset-[#f8f5f0] dark:ring-offset-[#0b1016]' : ''} ${
                isToday && !isSelected ? 'ring-1 ring-[#c4b8a8] dark:ring-gray-600' : ''
              } ${isFuture ? 'cursor-not-allowed opacity-35' : ''} ${!isFuture && user ? 'cursor-pointer' : ''} disabled:cursor-not-allowed`}
            >
              {day}
              {hasRec ? (
                <span className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-[#3d6b4a] dark:bg-[#8fdf9f]" title="有打卡" />
              ) : null}
            </button>
          )
        })}
      </div>

      {user && !userLoading && (
        <div className="rounded-xl border border-[#e5ddd0] bg-[#f9f6f0] px-3 py-3 text-sm dark:border-[#2a3440] dark:bg-[#151c24]">
          <p className="text-xs text-[#5c5348] dark:text-gray-400">当前查看</p>
          <p className="mt-0.5 font-mono text-[0.9rem] font-semibold tabular-nums text-[#2d261d] dark:text-gray-100">
            {selectedYmd}
            {isSelectedFuture ? <span className="ml-2 text-xs font-normal text-amber-800 dark:text-amber-200">（未来日仅可查看，不可选）</span> : null}
            {!isSelectedFuture && !dbNote ? (
              <span
                className={`ml-2 text-xs font-normal ${
                  selectedHasRecord
                    ? 'text-[#2d5a3d] dark:text-green-300'
                    : 'text-[#8a7f6f] dark:text-gray-500'
                }`}
              >
                {selectedHasRecord ? '· 本日有打卡' : '· 本日无打卡'}
              </span>
            ) : null}
          </p>
          {canActOnSelected ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {!selectedHasRecord ? (
                <button
                  type="button"
                  disabled={actionPending}
                  onClick={onRecordThisDay}
                  className="rounded-lg border border-[#5a8f6a] bg-[#6b9b7a] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#5a8a68] disabled:opacity-50 dark:border-[#4a7c59] dark:bg-[#4f7a5c]"
                >
                  {actionPending ? '处理中…' : '为所选日期记「已打卡」'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionPending}
                  onClick={onCancelThisDay}
                  className="rounded-lg border border-[#c9bfb0] bg-white/90 px-3 py-1.5 text-xs text-[#5c4f42] dark:border-[#3d4a5c] dark:bg-[#1a222c] dark:text-gray-300"
                >
                  {actionPending ? '处理中…' : '取消本日打卡记录'}
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}

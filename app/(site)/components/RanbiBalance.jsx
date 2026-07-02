'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { useSessionAccount } from './SessionProvider'

async function safeJson(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * 燃币余额 + 每日签到。登录用户显示余额 + 签到；游客显示余额 + 「注册得 100」入口。
 * 内联小组件，放在评论区头部等处；不依赖任何外部状态。
 */
export default function RanbiBalance({ className = '' }) {
  const { user, loading: userLoading } = useSessionAccount()
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState('')

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/points/me', { cache: 'no-store', credentials: 'same-origin' })
      const data = await safeJson(res)
      setInfo(data || null)
    } catch {
      setInfo(null)
    }
  }, [])

  useEffect(() => {
    // 登录用户与游客都拉余额（游客由 /api/points/me 自动播种 50 燃币）
    if (!userLoading) refresh()
  }, [user, userLoading, refresh])

  async function checkin() {
    setBusy(true)
    setHint('')
    try {
      const res = await fetch('/api/points/checkin', {
        method: 'POST',
        credentials: 'same-origin',
      })
      const data = await safeJson(res)
      if (res.ok && data?.ok) {
        setHint(data.awarded ? `签到 +${data.gained} 燃币` : '今天已签到')
        await refresh()
      } else {
        setHint(
          data?.error === 'EMAIL_ACTIVATION_REQUIRED'
            ? `未激活邮箱先开放 ${data?.pendingCheckinLimit || 3} 次签到；激活后继续每日签到`
            : data?.error || '签到失败'
        )
      }
    } catch (e) {
      setHint(String(e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  // 燃币系统不可用（无 D1）时不展示，避免误显示 0
  if (userLoading || !info || info.dbUnavailable || (!info.authed && !info.isGuest)) return null

  const isGuest = !info.authed

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className="inline-flex items-center gap-1 rounded-full bg-[#fbf3df] px-2.5 py-1 text-xs font-medium text-[#7a5b1e] dark:bg-amber-950/30 dark:text-amber-200"
        title="燃币余额"
      >
        🔥 {info.balance} 燃币
      </span>
      {isGuest ? (
        <Link
          href="/login"
          className="rounded-full border border-[#caa86a] bg-white/80 px-3 py-1 text-xs font-medium text-[#7a5b1e] no-underline hover:bg-white dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
          title="注册 / 登录立得 100 燃币"
        >
          注册得 100
        </Link>
      ) : (
        <button
          type="button"
          onClick={checkin}
          disabled={busy || info.checkedInToday}
          className="rounded-full border border-gray-200/80 bg-white/80 px-3 py-1 text-xs text-gray-700 hover:bg-white disabled:opacity-60 dark:border-gray-700/70 dark:bg-gray-900/70 dark:text-gray-200"
          title={info.checkedInToday ? '今天已签到' : `签到 +${info?.rules?.checkin ?? 5} 燃币`}
        >
          {info.checkedInToday ? '已签到' : '签到'}
        </button>
      )}
      {hint ? <span className="text-[11px] text-[#8a7a55] dark:text-amber-300/70">{hint}</span> : null}
    </div>
  )
}

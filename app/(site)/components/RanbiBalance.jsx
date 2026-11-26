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
 * 燃币余额。游客额外显示「注册得 100」入口。
 * 内联小组件，放在评论区头部等处；不依赖任何外部状态。
 */
export default function RanbiBalance({ className = '' }) {
  const { user, loading: userLoading } = useSessionAccount()
  const [info, setInfo] = useState(null)

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
    // 登录用户与游客都只读余额；游客试用在解锁或领取资源时发放。
    if (!userLoading) refresh()
  }, [user, userLoading, refresh])

  // 燃币系统不可用（无 D1）时不展示，避免误显示 0
  if (userLoading || !info || info.dbUnavailable || (!info.authed && !info.isGuest)) return null

  const isGuest = !info.authed

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
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
      ) : null}
      <Link href="/ranbi#earn" className="text-[11px] text-[#8a7a55] underline underline-offset-2 dark:text-amber-300/80" title="燃币不支持充值，可免费领取或联系站长补充">
        获取燃币
      </Link>
    </div>
  )
}

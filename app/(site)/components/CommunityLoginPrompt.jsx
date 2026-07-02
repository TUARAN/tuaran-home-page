'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useSessionAccount } from './SessionProvider'

const DISMISS_KEY = 'tuaran:community-prompt-dismissed'
const AUTO_DISMISS_SECONDS = 10

/**
 * 登录后引导：提示加微信进社群（指向 /community，那里有社群码与微信号）。
 * 仅对已登录的非站长用户展示，可关闭（localStorage 持久），在社群页本身不展示。
 */
export default function CommunityLoginPrompt() {
  const { loading, user, isOwner } = useSessionAccount()
  const pathname = usePathname()
  // 初始按「已关闭」渲染，避免 SSR/首帧闪烁；挂载后再读 localStorage。
  const [dismissed, setDismissed] = useState(true)
  const [secondsLeft, setSecondsLeft] = useState(AUTO_DISMISS_SECONDS)

  const dismiss = useCallback(() => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* localStorage 不可用时仅当次关闭 */
    }
  }, [])

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  const shouldShow =
    !loading &&
    user &&
    user.status !== 'pending' &&
    !isOwner &&
    !dismissed &&
    pathname !== '/community'

  useEffect(() => {
    if (!shouldShow) return undefined

    setSecondsLeft(AUTO_DISMISS_SECONDS)
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          dismiss()
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [dismiss, shouldShow])

  if (!shouldShow) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--site-header-height)+0.5rem)] z-[110] px-4">
      <div className="pointer-events-auto mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl border border-[#e2d8c6] bg-[#faf7ef] px-4 py-2 text-sm shadow-sm dark:border-gray-800 dark:bg-[#12161d] sm:rounded-full">
        <span aria-hidden="true" className="shrink-0 text-base leading-none">
          👋
        </span>
        <p className="m-0 min-w-0 text-[13px] leading-5 text-[#5a5648] dark:text-gray-300 sm:text-sm">
          欢迎回来。加微信进社群，一起聊 AI、创作与折腾。
        </p>
        <Link
          href="/community"
          className="inline-flex h-8 shrink-0 items-center rounded-full border border-[#d8cdb8] bg-white/75 px-3 text-xs font-semibold text-[#4a463b] no-underline transition hover:border-[#bfb29b] hover:bg-white dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-200 dark:hover:border-gray-500"
        >
          查看社群 / 加微信
        </Link>
        <span
          aria-live="polite"
          className="shrink-0 rounded-full bg-[#ede5d6] px-2.5 py-1 font-mono text-[11px] leading-none text-[#8a806c] dark:bg-white/5 dark:text-gray-400"
        >
          {secondsLeft} 秒后自动关闭
        </span>
        <button
          type="button"
          onClick={dismiss}
          aria-label="关闭提示"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base leading-none text-[#9a9482] transition-colors hover:bg-black/5 hover:text-[#5a5648] dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          ×
        </button>
      </div>
    </div>
  )
}

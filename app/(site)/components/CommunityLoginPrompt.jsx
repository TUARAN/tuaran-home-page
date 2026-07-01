'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useSessionAccount } from './SessionProvider'

const DISMISS_KEY = 'tuaran:community-prompt-dismissed'

/**
 * 登录后引导：提示加微信进社群（指向 /community，那里有社群码与微信号）。
 * 仅对已登录的非站长用户展示，可关闭（localStorage 持久），在社群页本身不展示。
 */
export default function CommunityLoginPrompt() {
  const { loading, user, isOwner } = useSessionAccount()
  const pathname = usePathname()
  // 初始按「已关闭」渲染，避免 SSR/首帧闪烁；挂载后再读 localStorage。
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  if (loading || !user || isOwner || dismissed) return null
  if (pathname === '/community') return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* localStorage 不可用时仅当次关闭 */
    }
  }

  return (
    <div className="border-b border-[#e7e2d6] bg-[#faf7ef] dark:border-gray-800 dark:bg-[#12161d]">
      <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-3 px-4 py-2.5 text-sm">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className="shrink-0 text-base leading-none">
            👋
          </span>
          <p className="min-w-0 text-[13px] leading-6 text-[#5a5648] dark:text-gray-300 sm:text-sm">
            欢迎回来。加微信进社群，一起聊 AI、创作与折腾。
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/community"
            className="rounded-full border border-[#d8cdb8] bg-white/70 px-3 py-1 text-xs font-semibold text-[#4a463b] no-underline transition hover:border-[#bfb29b] hover:bg-white dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-200 dark:hover:border-gray-500"
          >
            查看社群 / 加微信
          </Link>
          <button
            type="button"
            onClick={dismiss}
            aria-label="关闭提示"
            className="rounded-full px-2 py-1 text-base leading-none text-[#9a9482] transition-colors hover:bg-black/5 hover:text-[#5a5648] dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

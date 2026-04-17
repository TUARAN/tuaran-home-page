'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import WebLlmModal from './WebLlmModal'
import SettingsButton from './SettingsButton'

export default function SiteHeader() {
  const pathname = usePathname()
  const isAiProjectsActive = pathname === '/ai-projects'

  // Hide global header on special immersive pages.
  if (pathname?.startsWith('/people/elon-musk')) return null

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-[#eee] bg-[#fdfdf0]/92 backdrop-blur dark:border-gray-800 dark:bg-gray-900/88">
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="no-underline hover:no-underline opacity-90 hover:opacity-100" aria-label="返回首页">
          <div className="text-[#111] dark:text-gray-100 leading-tight inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-xl sm:text-2xl font-semibold">涂阿燃</span>
            <span className="text-base sm:text-lg text-[#777] dark:text-gray-400 font-normal tracking-wide uppercase">
              tuaran
            </span>
            <span className="text-[#999] dark:text-gray-500" aria-hidden="true">
              ·
            </span>
            <span className="text-xl sm:text-2xl text-[#555] dark:text-gray-300 font-semibold tracking-wide">
              网络日志
            </span>
          </div>
        </Link>

        <div className="flex items-start gap-3 sm:items-center">
          <nav aria-label="主导航" className="text-sm text-[#666] dark:text-gray-300 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/ai-projects"
            className={[
              'ai-projects-nav no-underline hover:no-underline',
              isAiProjectsActive ? 'ai-projects-nav-active' : '',
            ].join(' ')}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="ai-projects-nav-icon shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3.5 13.7 8l4.8.3-3.7 3.1 1.2 4.6-4-2.5-4 2.5 1.2-4.6-3.7-3.1L10.3 8 12 3.5Z" />
              <path d="M19 16.5v3" />
              <path d="M20.5 18h-3" />
            </svg>
            <span className="ai-projects-nav-label">AI 项目</span>
          </Link>
          <Link href="/articles" className="opacity-80 hover:opacity-100 underline underline-offset-4">
            文章
          </Link>
          <Link href="/reading" className="opacity-80 hover:opacity-100 underline underline-offset-4">
            读书
          </Link>
          <Link href="/bookmarks" className="opacity-80 hover:opacity-100 underline underline-offset-4">
            收藏
          </Link>
          <Link href="/messages" className="opacity-80 hover:opacity-100 underline underline-offset-4">
            留言板
          </Link>
          </nav>
          <SettingsButton />
        </div>
      </div>
    </header>
    <WebLlmModal />
    </>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SiteHeader() {
  const pathname = usePathname()

  // Hide global header on special immersive pages.
  if (pathname?.startsWith('/people/elon-musk')) return null

  return (
    <header className="border-b border-[#eee] dark:border-gray-800">
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

        <nav aria-label="主导航" className="text-sm text-[#666] dark:text-gray-300 flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/" className="opacity-80 hover:opacity-100 underline underline-offset-4">
            首页
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
          <a
            href="https://github.com/TUARAN"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="no-external-arrow inline-flex -translate-y-0.5 items-center justify-center rounded-full border border-[#e6e6e6] bg-white p-1.5 text-[#444] opacity-90 transition hover:opacity-100 hover:border-[#d4d4d4] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="h-4 w-4"
              fill="currentColor"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.58 7.58 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </a>
        </nav>
      </div>
    </header>
  )
}

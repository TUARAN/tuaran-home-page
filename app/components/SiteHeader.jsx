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
            className="no-external-arrow opacity-80 hover:opacity-100 underline underline-offset-4"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}

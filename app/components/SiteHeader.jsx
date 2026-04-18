'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import WebLlmModal from './WebLlmModal'
import SettingsButton from './SettingsButton'

export default function SiteHeader() {
  const pathname = usePathname()

  // Hide global header on special immersive pages.
  if (pathname?.startsWith('/people/elon-musk')) return null

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-[#e8dfd0] bg-[#f5f1e8]/90 backdrop-blur dark:border-gray-800 dark:bg-[#0f141b]/88">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="no-underline hover:no-underline group" aria-label="返回首页">
          <div className="leading-tight inline-flex flex-wrap items-baseline gap-x-2">
            <span className="font-serif text-xl sm:text-2xl font-semibold tracking-wide text-[#111] dark:text-gray-100">
              涂阿燃 · 网络日志
            </span>
            <span className="text-[11px] sm:text-xs text-[#999] dark:text-gray-500 font-normal tracking-[0.2em] uppercase">
              tuaran
            </span>
          </div>
        </Link>

        <div className="flex items-start gap-3 sm:items-center">
          <nav aria-label="主导航" className="text-sm flex flex-wrap items-center gap-x-5 gap-y-2">
            {[
              { href: '/ai-projects', label: 'AI 项目', match: (p) => p === '/ai-projects' },
              { href: '/articles', label: '文章', match: (p) => p?.startsWith('/articles') },
              { href: '/reading', label: '读书', match: (p) => p?.startsWith('/reading') },
              { href: '/bookmarks', label: '收藏', match: (p) => p?.startsWith('/bookmarks') },
              { href: '/messages', label: '留言板', match: (p) => p?.startsWith('/messages') },
            ].map((item) => {
              const active = item.match(pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'no-underline hover:no-underline transition-colors',
                    active
                      ? 'text-[#111] dark:text-gray-100 font-medium'
                      : 'text-[#666] dark:text-gray-400 hover:text-[#111] dark:hover:text-gray-100',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <Link
            href="/articles"
            aria-label="搜索文章"
            title="搜索文章"
            className="header-icon-link"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-[18px] w-[18px]">
              <path
                d="M13.75 13.75L17 17M15.5 9a6.5 6.5 0 11-13 0a6.5 6.5 0 0113 0z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <SettingsButton />
        </div>
      </div>
    </header>
    <WebLlmModal />
    </>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import WebLlmModal from './WebLlmModal'
import SettingsButton from './SettingsButton'
import { SITE_DOMAIN } from '../../lib/siteIntro'

const navItems = [
  { href: '/ai-projects', label: 'AI 项目', match: (p) => p === '/ai-projects' },
  { href: '/articles', label: '知识库', match: (p) => p?.startsWith('/articles') },
  { href: '/reading', label: '书库', match: (p) => p?.startsWith('/reading') },
  { href: '/bookmarks', label: '资源库', match: (p) => p?.startsWith('/bookmarks') },
]

export default function SiteHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Hide global header on special immersive pages.
  if (pathname?.startsWith('/people/elon-musk')) return null

  return (
    <>
      <header className="sticky top-0 z-40 w-full overflow-x-hidden border-b border-[#e8dfd0] bg-[#f8f5f0]/90 backdrop-blur dark:border-gray-800 dark:bg-[#0f141b]/88">
        <div className="max-w-[1120px] mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="no-underline hover:no-underline group min-w-0" aria-label="返回首页">
            <div className="leading-tight inline-flex flex-wrap items-baseline gap-x-2">
              <span className="font-serif text-xl sm:text-2xl font-semibold tracking-wide text-[#111] dark:text-gray-100">
                涂阿燃 · 网络日志
              </span>
              <span className="font-mono text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase text-[#8b5a1f] transition-colors group-hover:text-[#5d3a12] dark:text-[#e2bd7a] dark:group-hover:text-[#ffd895]">
                {SITE_DOMAIN}
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <nav aria-label="主导航" className="text-sm flex flex-wrap items-center gap-x-5 gap-y-2">
              {navItems.map((item) => {
                const active = item.match(pathname)
                return (
                  <Link
                    key={item.href}
                  href={item.href}
                  className={[
                      'no-underline hover:no-underline transition-colors visited:text-inherit',
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
            <WebLlmModal />
            <SettingsButton />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <WebLlmModal />
            <SettingsButton />
            <button
              type="button"
              aria-label={mobileMenuOpen ? '关闭导航菜单' : '打开导航菜单'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="header-icon-link"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-[18px] w-[18px]">
                {mobileMenuOpen ? (
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M4 6h12M4 10h12M4 14h12"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div
        className={[
          'fixed inset-0 z-30 bg-[rgba(23,18,12,0.22)] transition-opacity duration-200 md:hidden',
          mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        className={[
          'fixed right-0 top-[73px] z-40 w-[min(88vw,320px)] border-l border-[#e5dccd] bg-[#faf7f0] px-5 py-5 shadow-[-18px_0_48px_rgba(77,62,37,0.10)] transition-transform duration-200 dark:border-[#232c36] dark:bg-[#10151d] md:hidden',
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#9e8f75] dark:text-[#8e9ab0]">
          Menu
        </p>
        <nav aria-label="移动端主导航" className="flex flex-col gap-2">
          {navItems.map((item) => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'rounded-2xl border px-4 py-3 text-[15px] no-underline transition-colors visited:text-inherit',
                  active
                    ? 'border-[#d8ccb8] bg-white text-[#191611] dark:border-[#33404d] dark:bg-[#151c25] dark:text-gray-100'
                    : 'border-transparent bg-transparent text-[#615845] hover:border-[#e4dac8] hover:bg-white dark:text-gray-300 dark:hover:border-[#2d3744] dark:hover:bg-[#151c25]',
                ].join(' ')}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}

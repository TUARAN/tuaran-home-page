'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ADMIN_CONSOLE_ITEMS } from '../../../lib/adminRoutes'

const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: '后台总览', shortLabel: '总览', desc: '状态与入口' },
  ...ADMIN_CONSOLE_ITEMS,
]

function isActivePath(pathname, href) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function navClass(active) {
  return active
    ? 'border-[#15140f] bg-[#15140f] text-white shadow-sm dark:border-gray-200 dark:bg-gray-100 dark:text-[#111827]'
    : 'border-[#d8dad0] bg-white text-[#51514a] hover:border-[#a8aa9c] hover:text-[#15140f] dark:border-[#243040] dark:bg-[#10161f] dark:text-gray-300 dark:hover:border-[#4a5568] dark:hover:text-gray-100'
}

export default function AdminShell({ children }) {
  const pathname = usePathname() || '/admin'
  const activeItem = ADMIN_NAV_ITEMS.find((item) => isActivePath(pathname, item.href)) || ADMIN_NAV_ITEMS[0]

  return (
    <div className="min-h-screen bg-[var(--page-bg,#f4f5f0)] dark:bg-[#0b0f14]">
      <header className="sticky top-0 z-40 border-b border-[#d8dad0] bg-white/90 backdrop-blur dark:border-[#1e2733] dark:bg-[#0f141c]/95">
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-serif text-lg font-semibold text-[#15140f] dark:text-gray-100">
              2aran Admin
            </Link>
            <span className="hidden rounded-full border border-[#e0e2d8] px-2.5 py-1 text-xs text-[#67695d] dark:border-[#263142] dark:text-gray-400 sm:inline-flex">
              {activeItem.label}
            </span>
          </div>
          <Link
            href="/"
            className="rounded-md px-2 py-1 text-[13px] text-[#67695d] underline-offset-2 hover:bg-[#f1f2ea] hover:text-[#15140f] dark:text-gray-400 dark:hover:bg-[#151c26] dark:hover:text-gray-100"
          >
            返回主站
          </Link>
        </div>
        <nav className="mx-auto flex w-full max-w-[1280px] gap-2 overflow-x-auto px-4 pb-3" aria-label="后台模块">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                title={item.label}
                className={`inline-flex h-9 shrink-0 items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${navClass(active)}`}
              >
                {item.shortLabel || item.label}
              </Link>
            )
          })}
        </nav>
      </header>
      {children}
    </div>
  )
}

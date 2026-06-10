'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ADMIN_CONSOLE_ITEMS } from '../../../lib/adminRoutes'

function navClass(active) {
  return active
    ? 'rounded-lg bg-[#e7e8e0] px-3 py-1.5 text-sm font-medium text-[#15140f] dark:bg-[#19212b] dark:text-gray-100'
    : 'rounded-lg px-3 py-1.5 text-sm text-[#51514a] transition hover:bg-[#eceee6] hover:text-[#15140f] dark:text-gray-400 dark:hover:bg-[#141b24] dark:hover:text-gray-100'
}

export default function AdminShell({ children }) {
  const pathname = usePathname() || '/admin'

  return (
    <div className="min-h-screen bg-[var(--page-bg,#f4f5f0)] dark:bg-[#0b0f14]">
      <header className="border-b border-[#d8dad0] bg-white/80 backdrop-blur dark:border-[#1e2733] dark:bg-[#0f141c]/90">
        <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-serif text-lg font-semibold text-[#15140f] dark:text-gray-100">
              2aran Admin
            </Link>
            <nav className="hidden items-center gap-1 lg:flex">
              <Link href="/admin" className={navClass(pathname === '/admin')}>
                总览
              </Link>
              {ADMIN_CONSOLE_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className={navClass(pathname === item.href)}>
                  {item.label.replace(/管理$/, '').replace(/控制台$/, 'Ops')}
                </Link>
              ))}
            </nav>
          </div>
          <Link
            href="/"
            className="text-[13px] text-[#67695d] underline-offset-2 hover:text-[#15140f] hover:underline dark:text-gray-400 dark:hover:text-gray-100"
          >
            返回主站
          </Link>
        </div>
      </header>
      {children}
    </div>
  )
}

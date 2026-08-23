'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'
import { resolveAdminTrail } from '../../../lib/adminRoutes'

const COLLAPSE_KEY = 'admin:nav:collapsed'

export default function AdminShell({ children }) {
  const pathname = usePathname() || '/admin'
  const activeTrail = resolveAdminTrail(pathname)

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [badges, setBadges] = useState(null)

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1')
    } catch {}
  }, [])

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      } catch {}
      return next
    })
  }, [])

  // 路由切换时收起移动端抽屉
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [mobileOpen])

  // 侧栏徽标计数（best-effort，端点未就绪时静默）
  useEffect(() => {
    let alive = true
    fetch('/api/admin/overview', { cache: 'no-store', credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (alive && data?.badges) setBadges(data.badges)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="admin-shell min-h-screen">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-[#e6e7df] transition-[width] dark:border-[#1b2430] md:block ${
          collapsed ? 'md:w-[64px]' : 'md:w-[236px]'
        }`}
      >
        <AdminSidebar pathname={pathname} collapsed={collapsed} badges={badges} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="后台导航"
            className="absolute inset-y-0 left-0 w-[280px] max-w-[86vw] border-r border-[#e6e7df] shadow-xl dark:border-[#1b2430]"
          >
            <AdminSidebar
              pathname={pathname}
              collapsed={false}
              badges={badges}
              onNavigate={() => setMobileOpen(false)}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div
        className={`flex min-h-screen flex-col transition-[padding] ${
          collapsed ? 'md:pl-[64px]' : 'md:pl-[236px]'
        }`}
      >
        <AdminTopbar
          activeTrail={activeTrail}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <div className="admin-shell__content flex-1">{children}</div>
      </div>
    </div>
  )
}

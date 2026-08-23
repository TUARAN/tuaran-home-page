'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { IconX } from '@tabler/icons-react'

import { ADMIN_NAV_GROUPS, ADMIN_HOST, CANONICAL_HOST, isActiveAdminPath } from '../../../lib/adminRoutes'
import { AdminIcon } from '../../../lib/adminIcons'

function navItemClass(active) {
  return active
    ? 'bg-[#e8e7dc] text-[#15140f] shadow-[inset_3px_0_0_#7f8863] dark:bg-[#1a2330] dark:text-gray-100 dark:shadow-[inset_3px_0_0_#82906a]'
    : 'text-[#53554d] hover:bg-[#ecede5] hover:text-[#15140f] dark:text-gray-300 dark:hover:bg-[#151c26] dark:hover:text-gray-100'
}

function workspaceChildren(item, pathname) {
  return (item.sections || [])
    .flatMap((section) => section.items || [])
    .filter((child) => child.sidebar !== false || isActiveAdminPath(pathname, child.matchPath || child.href))
}

function badgeFor(item, badges) {
  return item.badgeKey && badges ? badges[item.badgeKey] : null
}

function PrimaryNavItem({ item, pathname, collapsed, badges, onNavigate, onAdminHost }) {
  const active = isActiveAdminPath(pathname, item.href, item.activePaths)
  const exact = isActiveAdminPath(pathname, item.href)
  const badge = badgeFor(item, badges)
  const externalHop = item.external && onAdminHost
  const className = `group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition ${
    active
      ? 'bg-[#eeece3] text-[#15140f] dark:bg-[#171f2a] dark:text-gray-100'
      : 'text-[#53554d] hover:bg-[#ecede5] hover:text-[#15140f] dark:text-gray-300 dark:hover:bg-[#151c26] dark:hover:text-gray-100'
  } ${collapsed ? 'justify-center' : ''}`
  const inner = (
    <>
      <AdminIcon name={item.icon} size={18} className="shrink-0" />
      {collapsed ? null : <span className="min-w-0 flex-1 truncate">{item.label}</span>}
      {!collapsed && externalHop ? <span className="font-mono text-[10px] text-[#9a9c8e]">↗</span> : null}
      {!collapsed && badge != null ? (
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-normal text-[#67695d] dark:bg-[#0f151e] dark:text-gray-400">
          {badge}
        </span>
      ) : null}
    </>
  )

  if (externalHop) {
    return (
      <a
        href={`https://${CANONICAL_HOST}${item.href}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        title={`${item.label}（主站新标签打开）`}
        className={className}
      >
        {inner}
      </a>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={exact ? 'page' : undefined}
      data-workspace-active={active ? 'true' : undefined}
      title={item.label}
      className={className}
    >
      {inner}
    </Link>
  )
}

/** 稳定两级导航：工作区始终可点击，只展开当前工作区的具体页面。 */
export default function AdminSidebar({ pathname, collapsed = false, badges = null, onNavigate, onClose }) {
  const [onAdminHost, setOnAdminHost] = useState(false)
  const navRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined') setOnAdminHost(window.location.hostname === ADMIN_HOST)
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const current = navRef.current?.querySelector('[aria-current="page"]')
      current?.scrollIntoView({ block: 'nearest' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [pathname, collapsed])

  const canonicalHomeHref = onAdminHost ? `https://${CANONICAL_HOST}/` : '/'
  const overview = ADMIN_NAV_GROUPS.find((group) => group.id === 'overview')?.items?.[0]
  const workspaces = ADMIN_NAV_GROUPS.find((group) => group.id === 'workspaces')?.items || []

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#0f141c]">
      <div
        className={`flex items-center gap-2 border-b border-[#e6e7df] px-4 py-[14px] dark:border-[#1b2430] ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2 font-serif text-[15px] font-semibold text-[#15140f] dark:text-gray-100"
          title="2aran Admin"
        >
          <AdminIcon name="dashboard" size={20} />
          {collapsed ? null : <span className="truncate">2aran Admin</span>}
        </Link>
        {!collapsed && onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭导航"
            className="ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#67695d] hover:bg-[#ecede5] dark:text-gray-400 dark:hover:bg-[#151c26]"
          >
            <IconX size={19} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <nav ref={navRef} className="flex-1 overflow-y-auto px-2 py-3" aria-label="后台模块">
        {overview ? (
          <PrimaryNavItem
            item={overview}
            pathname={pathname}
            collapsed={collapsed}
            badges={badges}
            onNavigate={onNavigate}
            onAdminHost={onAdminHost}
          />
        ) : null}

        {collapsed ? null : (
          <p className="mb-1 mt-4 px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#929487] dark:text-[#667286]">
            工作区
          </p>
        )}

        <div className="space-y-1">
          {workspaces.map((item) => {
            const active = isActiveAdminPath(pathname, item.href, item.activePaths)
            const children = workspaceChildren(item, pathname)
            return (
              <div key={item.href}>
                <PrimaryNavItem
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                  badges={badges}
                  onNavigate={onNavigate}
                  onAdminHost={onAdminHost}
                />

                {!collapsed && active && children.length ? (
                  <div className="ml-[18px] mt-1 border-l border-[#d9dccf] pb-1 pl-3 dark:border-[#2a3543]">
                    {children.map((child) => {
                      const childActive = isActiveAdminPath(pathname, child.matchPath || child.href)
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onNavigate}
                          aria-current={childActive ? 'page' : undefined}
                          title={child.label}
                          className={`mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] font-medium transition ${navItemClass(
                            childActive
                          )}`}
                        >
                          <AdminIcon name={child.icon} size={15} className="shrink-0 opacity-75" />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-[#e6e7df] px-2 py-2 dark:border-[#1b2430]">
        <Link
          href={canonicalHomeHref}
          onClick={onNavigate}
          title="返回主站"
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-[#67695d] transition hover:bg-[#ecede5] hover:text-[#15140f] dark:text-gray-400 dark:hover:bg-[#151c26] dark:hover:text-gray-100 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <AdminIcon name="back" size={18} />
          {collapsed ? null : <span>返回主站</span>}
        </Link>
      </div>
    </div>
  )
}

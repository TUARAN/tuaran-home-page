'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { ADMIN_NAV_GROUPS, ADMIN_PLANNED, ADMIN_HOST, CANONICAL_HOST, isActiveAdminPath } from '../../../lib/adminRoutes'
import { AdminIcon } from '../../../lib/adminIcons'

const OPEN_SECTIONS_KEY = 'admin:nav:open-sections:v3'

function sectionMenuId(item, section) {
  return `${item.href}#${section.id}`
}

function expandableSectionIds() {
  return ADMIN_NAV_GROUPS.flatMap((group) =>
    group.items.flatMap((item) =>
      (item.sections || []).map((section) => sectionMenuId(item, section))
    )
  )
}

function activeSectionIds(pathname) {
  return ADMIN_NAV_GROUPS.flatMap((group) =>
    group.items.flatMap((item) =>
      (item.sections || [])
        .filter((section) =>
          section.items.some((child) => isActiveAdminPath(pathname, child.href))
        )
        .map((section) => sectionMenuId(item, section))
    )
  )
}

function navItemClass(active) {
  return active
    ? 'bg-[#eeece0] text-[#15140f] dark:bg-[#1a2330] dark:text-gray-100'
    : 'text-[#53554d] hover:bg-[#ecede5] hover:text-[#15140f] dark:text-gray-300 dark:hover:bg-[#151c26] dark:hover:text-gray-100'
}

function DirectNavItem({ item, pathname, collapsed, badges, onNavigate, onAdminHost }) {
  const active = isActiveAdminPath(pathname, item.href, item.activePaths)
  const badge = item.badgeKey && badges ? badges[item.badgeKey] : null
  const externalHop = item.external && onAdminHost
  const className = `group mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${navItemClass(
    active
  )} ${collapsed ? 'justify-center' : ''}`
  const inner = (
    <>
      <AdminIcon name={item.icon} size={18} />
      {collapsed ? null : <span className="truncate">{item.label}</span>}
      {!collapsed && externalHop ? (
        <span className="ml-auto font-mono text-[10px] text-[#9a9c8e] dark:text-[#5d6b80]" aria-hidden="true">
          ↗
        </span>
      ) : null}
      {!collapsed && badge != null ? (
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-normal ${
            active
              ? 'bg-[#15140f] text-white dark:bg-gray-100 dark:text-[#111827]'
              : 'bg-[#eef0e8] text-[#67695d] dark:bg-[#1a2230] dark:text-gray-400'
          }`}
        >
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
      aria-current={active ? 'page' : undefined}
      title={item.label}
      className={className}
    >
      {inner}
    </Link>
  )
}

/**
 * 后台两级导航面板：
 *  - 工作区名称（内容中心等）与普通分组 label 都只作区隔标题
 *  - sections 是可展开的一级菜单，section.items 是二级入口
 *  - collapsed：仅图标（桌面折叠），此时工作区回落为聚合页图标入口
 */
export default function AdminSidebar({ pathname, collapsed = false, badges = null, onNavigate }) {
  const [onAdminHost, setOnAdminHost] = useState(false)
  const [openSections, setOpenSections] = useState(expandableSectionIds)

  useEffect(() => {
    if (typeof window !== 'undefined') setOnAdminHost(window.location.hostname === ADMIN_HOST)
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(OPEN_SECTIONS_KEY) || 'null')
      if (Array.isArray(saved)) setOpenSections(saved)
    } catch {}
  }, [])

  useEffect(() => {
    const activeIds = activeSectionIds(pathname)
    if (!activeIds.length) return
    setOpenSections((previous) => Array.from(new Set([...previous, ...activeIds])))
  }, [pathname])

  function toggleSection(sectionId) {
    setOpenSections((previous) => {
      const next = previous.includes(sectionId)
        ? previous.filter((id) => id !== sectionId)
        : [...previous, sectionId]
      try {
        window.localStorage.setItem(OPEN_SECTIONS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const canonicalHomeHref = onAdminHost ? `https://${CANONICAL_HOST}/` : '/'

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
          className="flex items-center gap-2 font-serif text-[15px] font-semibold text-[#15140f] dark:text-gray-100"
          title="2aran Admin"
        >
          <AdminIcon name="dashboard" size={20} />
          {collapsed ? null : <span>2aran Admin</span>}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="后台模块">
        {ADMIN_NAV_GROUPS.map((group) => {
          const containsWorkspaces = group.items.some((item) => item.sections?.length)

          return (
            <div key={group.id} className="mb-1.5">
              {group.label && !collapsed && !containsWorkspaces ? (
                <p className="px-2 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#9a9c8e] dark:text-[#5d6b80]">
                  {group.label}
                </p>
              ) : null}

              {group.items.map((item) => {
                if (item.sidebar === false) return null

                if (!item.sections?.length || collapsed) {
                  return (
                    <DirectNavItem
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      collapsed={collapsed}
                      badges={badges}
                      onNavigate={onNavigate}
                      onAdminHost={onAdminHost}
                    />
                  )
                }

                return (
                  <section key={item.href} className="mb-2">
                    <p className="px-2 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#9a9c8e] dark:text-[#5d6b80]">
                      {item.label}
                    </p>

                    {item.sections.map((section) => {
                      const sectionId = sectionMenuId(item, section)
                      const sectionOpen = openSections.includes(sectionId)
                      const sectionActive = section.items.some((child) =>
                        isActiveAdminPath(pathname, child.href)
                      )
                      const panelId = `admin-section-${section.id}-${item.href.split('/').pop()}`

                      return (
                        <div key={sectionId} className="mb-0.5">
                          <button
                            type="button"
                            onClick={() => toggleSection(sectionId)}
                            aria-expanded={sectionOpen}
                            aria-controls={panelId}
                            className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold transition hover:bg-[#ecede5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a1ab76]/60 dark:hover:bg-[#151c26] ${
                              sectionActive
                                ? 'text-[#15140f] dark:text-gray-100'
                                : 'text-[#53554d] dark:text-gray-300'
                            }`}
                          >
                            <span className="truncate">{section.label}</span>
                            <AdminIcon
                              name="chevronDown"
                              size={15}
                              stroke={1.8}
                              className={`ml-auto shrink-0 transition-transform duration-200 ${sectionOpen ? 'rotate-180' : ''}`}
                            />
                          </button>

                          <div
                            id={panelId}
                            className={`grid transition-[grid-template-rows,opacity] duration-200 ${
                              sectionOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-60'
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="ml-[18px] border-l border-[#e2e3da] pb-1 pl-3 pt-1 dark:border-[#26313e]">
                                {section.items.map((child) => {
                                  const childActive = isActiveAdminPath(pathname, child.href)
                                  return (
                                    <Link
                                      key={child.href}
                                      href={child.href}
                                      onClick={onNavigate}
                                      aria-current={childActive ? 'page' : undefined}
                                      title={child.label}
                                      className={`mb-0.5 flex items-center rounded-md px-2 py-1.5 text-[12px] font-medium transition ${navItemClass(
                                        childActive
                                      )}`}
                                    >
                                      <span className="truncate">{child.label}</span>
                                    </Link>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </section>
                )
              })}
            </div>
          )
        })}

        {collapsed ? null : (
          <div className="mt-3 border-t border-[#eceee6] pt-2 dark:border-[#1b2430]">
            <p className="px-2 pb-1 pt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#9a9c8e] dark:text-[#5d6b80]">
              规划中
            </p>
            {ADMIN_PLANNED.map((item) => (
              <div
                key={item.id}
                title={item.desc}
                className="mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-[#aaab9f] dark:text-[#525e70]"
              >
                <AdminIcon name={item.icon} size={18} />
                <span className="truncate">{item.label}</span>
                <span className="ml-auto rounded-full border border-dashed border-[#d4d6cb] px-2 py-0.5 text-[10px] dark:border-[#2a3543]">
                  规划中
                </span>
              </div>
            ))}
          </div>
        )}
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

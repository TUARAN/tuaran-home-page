'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { ADMIN_NAV_GROUPS, ADMIN_PLANNED, ADMIN_HOST, CANONICAL_HOST, isActiveAdminPath } from '../../../lib/adminRoutes'
import { AdminIcon } from '../../../lib/adminIcons'

const OPEN_MENUS_KEY = 'admin:nav:open-menus:v2'

function expandableMenuIds() {
  return ADMIN_NAV_GROUPS.flatMap((group) =>
    group.items.filter((item) => item.children?.length).map((item) => item.href)
  )
}

function activeMenuIds(pathname) {
  return ADMIN_NAV_GROUPS.flatMap((group) =>
    group.items
      .filter(
        (item) =>
          item.children?.length &&
          isActiveAdminPath(pathname, item.href, item.activePaths)
      )
      .map((item) => item.href)
  )
}

function navItemClass(active) {
  return active
    ? 'bg-[#eeece0] text-[#15140f] dark:bg-[#1a2330] dark:text-gray-100'
    : 'text-[#53554d] hover:bg-[#ecede5] hover:text-[#15140f] dark:text-gray-300 dark:hover:bg-[#151c26] dark:hover:text-gray-100'
}

function NavItemInner({ item, collapsed, badge, active, externalHop }) {
  return (
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
}

/**
 * 后台两级导航面板：
 *  - 分组 label 仅作视觉分隔
 *  - items 是一级菜单，children 是可展开的二级菜单
 *  - collapsed：仅图标（桌面折叠）
 *  - badges：{ [badgeKey]: number }，来自 /api/admin/overview
 *  - onNavigate：移动端抽屉里点击后关闭
 */
export default function AdminSidebar({ pathname, collapsed = false, badges = null, onNavigate }) {
  const [onAdminHost, setOnAdminHost] = useState(false)
  const [openMenus, setOpenMenus] = useState(expandableMenuIds)

  useEffect(() => {
    if (typeof window !== 'undefined') setOnAdminHost(window.location.hostname === ADMIN_HOST)
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(OPEN_MENUS_KEY) || 'null')
      if (Array.isArray(saved)) setOpenMenus(saved)
    } catch {}
  }, [])

  // 进入二级页面时确保所属一级菜单可见；其他一级菜单默认保持展开。
  useEffect(() => {
    const activeIds = activeMenuIds(pathname)
    if (!activeIds.length) return
    setOpenMenus((previous) => Array.from(new Set([...previous, ...activeIds])))
  }, [pathname])

  function toggleMenu(menuId) {
    setOpenMenus((previous) => {
      const next = previous.includes(menuId)
        ? previous.filter((id) => id !== menuId)
        : [...previous, menuId]
      try {
        window.localStorage.setItem(OPEN_MENUS_KEY, JSON.stringify(next))
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
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.id} className="mb-1.5">
            {group.label && !collapsed ? (
              <p className="px-2 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#9a9c8e] dark:text-[#5d6b80]">
                {group.label}
              </p>
            ) : null}

            {group.items.map((item) => {
              if (item.sidebar === false) return null

              const children = item.children || []
              const hasChildren = children.length > 0 && !collapsed
              const menuOpen = hasChildren && openMenus.includes(item.href)
              const parentPageActive = isActiveAdminPath(pathname, item.href)
              const parentTreeActive = isActiveAdminPath(pathname, item.href, item.activePaths)
              const badge = item.badgeKey && badges ? badges[item.badgeKey] : null
              const externalHop = item.external && onAdminHost
              const itemClassName = `group flex min-w-0 items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium transition ${navItemClass(
                parentPageActive
              )} ${collapsed ? 'justify-center rounded-lg' : hasChildren ? 'flex-1 rounded-l-lg' : 'rounded-lg'}`

              const inner = (
                <NavItemInner
                  item={item}
                  collapsed={collapsed}
                  badge={badge}
                  active={parentPageActive}
                  externalHop={externalHop}
                />
              )

              return (
                <div key={item.href} className="mb-0.5">
                  <div className={`flex rounded-lg ${parentTreeActive && !parentPageActive ? 'text-[#15140f] dark:text-gray-100' : ''}`}>
                    {externalHop ? (
                      <a
                        href={`https://${CANONICAL_HOST}${item.href}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onNavigate}
                        title={`${item.label}（主站新标签打开）`}
                        className={itemClassName}
                      >
                        {inner}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={parentPageActive ? 'page' : undefined}
                        title={item.label}
                        className={itemClassName}
                      >
                        {inner}
                      </Link>
                    )}

                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggleMenu(item.href)}
                        aria-label={`${menuOpen ? '收起' : '展开'}${item.label}`}
                        aria-expanded={menuOpen}
                        aria-controls={`admin-submenu-${group.id}-${item.href.split('/').pop()}`}
                        className="flex w-9 shrink-0 items-center justify-center rounded-r-lg text-[#77796d] transition hover:bg-[#ecede5] hover:text-[#15140f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a1ab76]/60 dark:text-gray-400 dark:hover:bg-[#151c26] dark:hover:text-gray-100"
                      >
                        <AdminIcon
                          name="chevronDown"
                          size={15}
                          stroke={1.8}
                          className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                    ) : null}
                  </div>

                  {hasChildren ? (
                    <div
                      id={`admin-submenu-${group.id}-${item.href.split('/').pop()}`}
                      className={`grid transition-[grid-template-rows,opacity] duration-200 ${
                        menuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-60'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="ml-[18px] border-l border-[#e2e3da] pb-1 pl-3 pt-1 dark:border-[#26313e]">
                          {children.map((child) => {
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
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}

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

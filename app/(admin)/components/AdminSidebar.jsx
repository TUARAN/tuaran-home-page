'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { ADMIN_NAV_GROUPS, ADMIN_PLANNED, ADMIN_HOST, CANONICAL_HOST, isActiveAdminPath } from '../../../lib/adminRoutes'
import { AdminIcon } from '../../../lib/adminIcons'

function navItemClass(active) {
  return active
    ? 'bg-[#eeece0] text-[#15140f] dark:bg-[#1a2330] dark:text-gray-100'
    : 'text-[#53554d] hover:bg-[#ecede5] hover:text-[#15140f] dark:text-gray-300 dark:hover:bg-[#151c26] dark:hover:text-gray-100'
}

/**
 * 后台分组导航面板。展示态组件：
 *  - collapsed：仅图标（桌面折叠）
 *  - badges：{ [badgeKey]: number }，来自 /api/admin/overview
 *  - onNavigate：移动端抽屉里点击后关闭
 */
export default function AdminSidebar({ pathname, collapsed = false, badges = null, onNavigate }) {
  // 是否运行在 admin 子域：决定「主站页面」外链是否要改走 canonical host。
  const [onAdminHost, setOnAdminHost] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') setOnAdminHost(window.location.hostname === ADMIN_HOST)
  }, [])
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
              const active = isActiveAdminPath(pathname, item.href)
              const badge = item.badgeKey && badges ? badges[item.badgeKey] : null
              // 「主站页面」外链：在 admin 子域上点它本会被 301 回跳，改成直接指 canonical host + 新标签打开。
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
                    key={item.href}
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
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  title={item.label}
                  className={className}
                >
                  {inner}
                </Link>
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

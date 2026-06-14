'use client'

import { useEffect, useState } from 'react'
import { IconMenu2, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconChevronRight, IconShieldLock } from '@tabler/icons-react'

import { AdminIcon } from '../../../lib/adminIcons'

function useEnvLabel() {
  const [env, setEnv] = useState(null)
  useEffect(() => {
    const host = window.location.hostname
    if (host === 'admin.2aran.com' || host === '2aran.com') setEnv({ label: 'production', tone: 'prod' })
    else if (host.endsWith('pages.dev')) setEnv({ label: 'preview', tone: 'preview' })
    else setEnv({ label: 'local', tone: 'local' })
  }, [])
  return env
}

const ENV_TONE = {
  prod: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  preview: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  local: 'border-[#d8dad0] bg-[#f1f2ea] text-[#67695d] dark:border-[#263142] dark:bg-[#151c26] dark:text-gray-400',
}

export default function AdminTopbar({ activeItem, collapsed, onToggleCollapse, onOpenMobile }) {
  const env = useEnvLabel()
  const isOverview = activeItem?.href === '/admin'

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[#e6e7df] bg-white/90 px-3 backdrop-blur dark:border-[#1b2430] dark:bg-[#0f141c]/95 md:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="打开导航"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#53554d] hover:bg-[#ecede5] dark:text-gray-300 dark:hover:bg-[#151c26] md:hidden"
        >
          <IconMenu2 size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? '展开侧栏' : '折叠侧栏'}
          className="hidden h-8 w-8 items-center justify-center rounded-lg text-[#53554d] hover:bg-[#ecede5] dark:text-gray-300 dark:hover:bg-[#151c26] md:inline-flex"
        >
          {collapsed ? (
            <IconLayoutSidebarLeftExpand size={20} aria-hidden="true" />
          ) : (
            <IconLayoutSidebarLeftCollapse size={20} aria-hidden="true" />
          )}
        </button>

        <nav aria-label="面包屑" className="flex min-w-0 items-center gap-1.5 text-[13px]">
          <span className="hidden text-[#9a9c8e] dark:text-[#5d6b80] sm:inline">后台</span>
          {!isOverview ? (
            <IconChevronRight size={14} className="hidden text-[#c2c4b8] dark:text-[#3a4757] sm:inline" aria-hidden="true" />
          ) : null}
          <span className="flex min-w-0 items-center gap-1.5 font-medium text-[#15140f] dark:text-gray-100">
            {activeItem ? <AdminIcon name={activeItem.icon} size={16} /> : null}
            <span className="truncate">{activeItem?.label || '后台总览'}</span>
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-2.5">
        {env ? (
          <span className={`hidden rounded-full border px-2.5 py-0.5 text-[11px] font-medium sm:inline-flex ${ENV_TONE[env.tone]}`}>
            {env.label}
          </span>
        ) : null}
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e0e2d8] bg-[#fafbf7] px-2 py-1 text-[12px] text-[#53554d] dark:border-[#263142] dark:bg-[#10161f] dark:text-gray-300"
          title="已以站长身份登录"
        >
          <IconShieldLock size={15} aria-hidden="true" />
          <span className="hidden sm:inline">站长</span>
        </span>
      </div>
    </header>
  )
}

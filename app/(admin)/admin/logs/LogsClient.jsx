'use client'

import { useState } from 'react'

import { AdminButton, AdminPage } from '../../components/ui'
import AutomationRunsPanel from './AutomationRunsPanel'
import ModelCallRecordsPanel from './ModelCallRecordsPanel'

const TABS = [
  { id: 'runs', label: '最近运行' },
  { id: 'calls', label: '调用记录' },
]

const PAGE_TAB_CLASS = 'h-9 rounded-md px-4 text-[13px] font-medium transition'

export default function LogsClient({ initialTab = 'runs', initialCallFilters = {} }) {
  const [tab, setTab] = useState(TABS.some((item) => item.id === initialTab) ? initialTab : 'runs')
  const [callFilters, setCallFilters] = useState(initialCallFilters)

  function selectTab(next) {
    setTab(next)
    const url = new URL(window.location.href)
    url.searchParams.delete('key')
    url.searchParams.delete('provider')
    url.searchParams.delete('providerId')
    url.searchParams.delete('scope')
    url.searchParams.delete('source')
    if (next === 'runs') {
      setCallFilters({})
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', next)
    }
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }

  return (
    <AdminPage
      title="日志记录"
      description="集中查看自动化最近运行和模型调用记录。"
      actions={
        <>
          <AdminButton href="/admin/ops">自动化台账</AdminButton>
          <AdminButton href="/admin/deepseek-tasks">模型服务</AdminButton>
        </>
      }
    >
      <div
        role="tablist"
        aria-label="日志记录"
        className="mb-4 grid max-w-md grid-cols-2 overflow-hidden rounded-lg border border-[#d5d7cd] bg-[#f7f8f2] p-1 dark:border-[#2a3544] dark:bg-[#0d131b]"
      >
        {TABS.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${PAGE_TAB_CLASS} ${active ? 'bg-[#2f3027] text-white shadow-sm dark:bg-gray-100 dark:text-[#111]' : 'text-[#626459] hover:bg-white dark:text-[#9aa6b6] dark:hover:bg-[#151c25]'}`}
              onClick={() => selectTab(item.id)}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === 'runs' ? (
        <AutomationRunsPanel />
      ) : (
        <ModelCallRecordsPanel initialFilters={callFilters} />
      )}
    </AdminPage>
  )
}

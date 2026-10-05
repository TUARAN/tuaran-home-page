'use client'

import { IconSearch, IconX } from '@tabler/icons-react'

export default function AgentCenterControls({
  query,
  onQueryChange,
  placeholder,
  tabs,
  activeTab,
  onTabChange,
  count,
  countLabel,
  onClear,
}) {
  const hasFilters = Boolean(query || activeTab !== tabs[0]?.id)

  return (
    <div className="mb-6 rounded-2xl border border-[#d8d9d5] bg-white/85 p-3 shadow-[0_10px_35px_rgba(34,31,25,0.05)] backdrop-blur dark:border-[#2b333e] dark:bg-[#111821]/85 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl bg-[#f2f2ed] px-3 text-[var(--site-muted)] dark:bg-[#1b2530]">
          <IconSearch size={18} aria-hidden="true" />
          <span className="sr-only">搜索</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[var(--site-ink)] outline-none placeholder:text-[var(--site-faint)] focus:ring-0"
          />
          {query ? <button type="button" onClick={() => onQueryChange('')} aria-label="清空搜索" className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10"><IconX size={16} /></button> : null}
        </label>

        <div className="flex gap-1 overflow-x-auto rounded-xl bg-[#f2f2ed] p-1 dark:bg-[#1b2530]" role="tablist" aria-label="筛选目录">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${activeTab === tab.id ? 'bg-white text-[#1c1d18] shadow-sm dark:bg-[#354352] dark:text-white' : 'text-[var(--site-muted)] hover:text-[var(--site-ink)]'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex min-h-5 items-center justify-between px-1 text-xs text-[var(--site-faint)]">
        <span><strong className="text-[var(--site-ink)]">{count}</strong> {countLabel}</span>
        {hasFilters ? <button type="button" onClick={onClear} className="font-medium text-[#8b5a1f] hover:text-[#724817] dark:text-[#d1aa6c]">清除筛选</button> : null}
      </div>
    </div>
  )
}

export function AgentCenterEmpty({ noun }) {
  return (
    <div className="col-span-full flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#cfd0ca] bg-white/55 px-6 text-center dark:border-[#36414d] dark:bg-[#111821]/50">
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#ecece6] text-[var(--site-muted)] dark:bg-[#24303c]"><IconSearch size={23} /></span>
      <strong className="text-base text-[var(--site-ink)]">没有匹配的{noun}</strong>
      <span className="mt-1 text-sm text-[var(--site-muted)]">换个关键词或筛选条件试试。</span>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { IconArrowUpRight, IconDownload, IconPackage, IconShieldCheck } from '@tabler/icons-react'

import AgentCenterControls, { AgentCenterEmpty } from '../components/AgentCenterControls'

const TABS = [
  { id: 'all', label: '全部能力包' },
  { id: 'Skill', label: 'Skill' },
  { id: 'MCP', label: 'MCP' },
  { id: 'ready', label: '可测试 / 可上传' },
]

function formatBytes(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}

function PackageCard({ artifact }) {
  const ready = artifact.readiness === 'ready'
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#d8d9d5] bg-white/85 transition duration-200 hover:-translate-y-1 hover:border-[#aeb1aa] hover:shadow-[0_18px_44px_rgba(34,31,25,0.10)] dark:border-[#2b333e] dark:bg-[#111821]/85 dark:hover:border-[#4d5967]">
      <div className={`h-1.5 ${artifact.kind === 'Skill' ? 'bg-[#7fa78e]' : 'bg-[#78a4a2]'}`} />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4eee8] text-[#356451] transition group-hover:scale-105 dark:bg-[#1e352e] dark:text-[#b7d9c5]"><IconPackage size={23} stroke={1.7} /></span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${ready ? 'bg-[#e3efe5] text-[#376344] dark:bg-[#1e3627] dark:text-[#b9d8bd]' : 'bg-[#f5ead5] text-[#825f27] dark:bg-[#3b2e19] dark:text-[#e5ca94]'}`}>{artifact.readinessLabel}</span>
        </div>
        <p className="mb-1 truncate font-mono text-[11px] text-[var(--site-faint)]">{artifact.kind} · {artifact.id}</p>
        <h3 className="mb-2 border-b-0 pb-0 text-xl font-bold leading-snug text-[var(--site-ink)]">{artifact.title}</h3>
        <p className="mb-5 text-sm leading-6 text-[var(--site-muted)]">{artifact.note}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#e8e6e0] pt-4 dark:border-[#2a333d]">
          <Link href={artifact.sourceUrl} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--site-muted)] no-underline hover:text-[var(--site-ink)] hover:!no-underline">查看详情 <IconArrowUpRight size={15} /></Link>
          <a href={artifact.downloadUrl} download className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#171b21] px-3.5 text-xs font-semibold text-white no-underline hover:bg-[#42464b] hover:!no-underline dark:bg-[#d9deca] dark:text-[#151713] dark:hover:bg-white"><IconDownload size={15} /> 下载 ZIP · {formatBytes(artifact.bytes)}</a>
        </div>
      </div>
    </article>
  )
}

export default function WorkBuddyCatalog({ artifacts }) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return artifacts.filter((artifact) => {
      const tabMatch = tab === 'all' || artifact.kind === tab || (tab === 'ready' && artifact.readiness === 'ready')
      const text = `${artifact.kind} ${artifact.id} ${artifact.title} ${artifact.note} ${artifact.readinessLabel}`.toLowerCase()
      return tabMatch && (!needle || text.includes(needle))
    })
  }, [artifacts, query, tab])

  return (
    <section id="items" className="scroll-mt-28">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#3e7562] dark:text-[#b7d9c5]">Install packages</p><h2 className="mb-1 border-b-0 pb-0 text-2xl font-black tracking-tight text-[var(--site-ink)] sm:text-3xl">找到适合 WorkBuddy 的能力包</h2><p className="mb-0 text-sm text-[var(--site-muted)]">按包类型和可用状态筛选，查看来源后下载。</p></div><span className="inline-flex items-center gap-1.5 text-xs text-[var(--site-faint)]"><IconShieldCheck size={17} /> 状态与风险已标注</span></div>
      <AgentCenterControls query={query} onQueryChange={setQuery} placeholder="搜索能力包、用途或状态" tabs={TABS} activeTab={tab} onTabChange={setTab} count={filtered.length} countLabel="个能力包" onClear={() => { setQuery(''); setTab('all') }} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.length ? filtered.map((artifact) => <PackageCard key={artifact.id} artifact={artifact} />) : <AgentCenterEmpty noun="能力包" />}</div>
      <p className="mb-0 mt-8 rounded-xl bg-[#f2f1ec] px-5 py-4 text-xs leading-6 text-[var(--site-muted)] dark:bg-[#1b2530]">“需复核”或“测试”状态的包仍可下载，但不代表已通过市场审核。安装或提交前，请在详情页核对适用范围、授权和配置要求。</p>
    </section>
  )
}

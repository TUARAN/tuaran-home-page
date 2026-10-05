'use client'

import { useMemo, useState } from 'react'
import { IconCloud, IconPlugConnected, IconShieldCheck, IconTerminal2 } from '@tabler/icons-react'

import AgentCenterControls, { AgentCenterEmpty } from '../components/AgentCenterControls'
import McpConfigActions from './McpConfigActions'

const TABS = [
  { id: 'all', label: '全部服务' },
  { id: 'remote', label: '远程 HTTP' },
  { id: 'local', label: '本地 stdio' },
]

function Pill({ children }) {
  return <span className="inline-flex rounded-full bg-[#eeefe9] px-2.5 py-1 text-[11px] leading-4 text-[#626653] dark:bg-[#25303a] dark:text-[#c9d6e5]">{children}</span>
}

function ServiceCard({ service }) {
  const prompts = service.prompts || [service.prompt]
  const local = service.kind === 'local'
  const Icon = local ? IconTerminal2 : IconCloud

  return (
    <article id={service.name} className="group flex min-w-0 scroll-mt-28 flex-col overflow-hidden rounded-2xl border border-[#d8d9d5] bg-white/85 transition duration-200 hover:-translate-y-1 hover:border-[#aeb1aa] hover:shadow-[0_18px_44px_rgba(34,31,25,0.10)] dark:border-[#2b333e] dark:bg-[#111821]/85 dark:hover:border-[#4d5967]">
      <div className={`h-1.5 ${local ? 'bg-[#8fa47b]' : 'bg-[#83a8bf]'}`} />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <header>
          <div className="mb-5 flex items-start justify-between gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6ecf0] text-[#42617a] transition group-hover:scale-105 dark:bg-[#20313e] dark:text-[#b9d0de]"><Icon size={23} stroke={1.7} /></span>
            <Pill>{service.transport}</Pill>
          </div>
          <p className="mb-1 truncate font-mono text-[11px] text-[var(--site-faint)]">{service.name}</p>
          <h2 className="mb-2 border-b-0 pb-0 text-xl font-bold leading-snug text-[var(--site-ink)]">{service.title}</h2>
          <p className="mb-4 text-sm leading-6 text-[var(--site-muted)]">{service.desc}</p>
          <div className="flex flex-wrap gap-1.5">{service.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}</div>
        </header>
        <div className="mt-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--site-faint)]">可调用工具 · {service.tools.length}</p>
          <div className="flex flex-wrap gap-1.5">{service.tools.map((tool) => <code key={tool} className="rounded-md bg-[#f3f4ef] px-2 py-1 font-mono text-[10px] text-[#555640] dark:bg-[#25303a] dark:text-gray-300">{tool}</code>)}</div>
        </div>
        <details className="mt-5 rounded-xl bg-[#f5f3ee] p-4 dark:bg-[#1a2530]">
          <summary className="cursor-pointer text-xs font-semibold text-[var(--site-muted)]">查看调用示例</summary>
          {prompts.length > 1 ? <ol className="mb-0 mt-2 grid gap-1 pl-4 text-xs leading-5 text-[#34362e] dark:text-gray-200">{prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ol> : <p className="mb-0 mt-2 text-xs leading-5 text-[#34362e] dark:text-gray-200">{prompts[0]}</p>}
        </details>
        {service.guide ? <p className="mb-0 mt-3 text-xs leading-5 text-[var(--site-muted)]">本地路径和环境变量需要按当前设备修改。</p> : null}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#e8e6e0] pt-4 dark:border-[#2a333d]">
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--site-faint)]"><IconPlugConnected size={15} /> 配置后可调用</span>
          <McpConfigActions title={service.title} config={service.config} codexConfig={service.codexConfig} />
        </div>
      </div>
    </article>
  )
}

export default function McpCatalog({ services }) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return services.filter((service) => {
      const tabMatch = tab === 'all' || service.kind === tab
      const text = `${service.name} ${service.title} ${service.desc} ${service.tags.join(' ')} ${service.tools.join(' ')}`.toLowerCase()
      return tabMatch && (!needle || text.includes(needle))
    })
  }, [query, services, tab])

  return (
    <section id="items" className="scroll-mt-28">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#527188] dark:text-[#a8c2d2]">Explore services</p><h2 className="mb-1 border-b-0 pb-0 text-2xl font-black tracking-tight text-[var(--site-ink)] sm:text-3xl">选择要连接的服务</h2><p className="mb-0 text-sm text-[var(--site-muted)]">先确认运行位置和权限边界，再复制客户端配置。</p></div>
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--site-faint)]"><IconShieldCheck size={17} /> 权限已标注</span>
      </div>
      <AgentCenterControls query={query} onQueryChange={setQuery} placeholder="搜索服务、工具或用途" tabs={TABS} activeTab={tab} onTabChange={setTab} count={filtered.length} countLabel="个可连接服务" onClear={() => { setQuery(''); setTab('all') }} />
      <div className="grid gap-4 md:grid-cols-2">{filtered.length ? filtered.map((service) => <ServiceCard key={service.name} service={service} />) : <AgentCenterEmpty noun="MCP 服务" />}</div>
    </section>
  )
}

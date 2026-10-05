'use client'

import { useMemo, useState } from 'react'
import { IconBraces, IconSparkles } from '@tabler/icons-react'

import AgentCenterControls, { AgentCenterEmpty } from '../components/AgentCenterControls'
import PromptCopyButton, { PromptDetailButton } from './PromptCopyButton'

const TABS = [
  { id: 'all', label: '全部模板' },
  { id: '入门', label: '快速上手' },
  { id: '进阶', label: '进阶任务' },
  { id: '工程化', label: '工程化' },
]

function Pill({ children }) {
  return <span className="inline-flex rounded-full bg-[#f2ecdc] px-2.5 py-1 text-[11px] leading-4 text-[#78612f] dark:bg-[#332b1d] dark:text-[#e0cc94]">{children}</span>
}

function PromptCard({ item, index }) {
  const colors = ['bg-[#e9dfc7]', 'bg-[#dce7e5]', 'bg-[#e0e4ef]', 'bg-[#eadbd8]']
  return (
    <article id={item.id} className="group flex min-w-0 scroll-mt-28 flex-col overflow-hidden rounded-2xl border border-[#d8d9d5] bg-white/85 transition duration-200 hover:-translate-y-1 hover:border-[#aeb1aa] hover:shadow-[0_18px_44px_rgba(34,31,25,0.10)] dark:border-[#2b333e] dark:bg-[#111821]/85 dark:hover:border-[#4d5967]">
      <div className={`relative flex h-28 items-center justify-center overflow-hidden ${colors[index % colors.length]} dark:bg-[#222c37]`}>
        <IconBraces size={44} stroke={1.15} className="text-[#5e5a4e] opacity-80 dark:text-[#cbd3dc]" />
        <span className="absolute left-4 top-3 font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-black/45 dark:text-white/45">{item.category}</span>
        <span className="absolute bottom-3 right-4 font-mono text-[10px] text-black/35 dark:text-white/35">0{index + 1}</span>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <header>
          <div className="mb-3 flex items-center justify-between gap-3"><p className="mb-0 truncate font-mono text-[11px] text-[var(--site-faint)]">{item.name}</p><Pill>{item.level}</Pill></div>
          <h2 className="mb-2 border-b-0 pb-0 text-xl font-bold leading-snug text-[var(--site-ink)]">{item.title}</h2>
          <p className="mb-5 text-sm leading-6 text-[var(--site-muted)]">{item.desc}</p>
        </header>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#e8e6e0] pt-4 dark:border-[#2a333d]">
          <PromptDetailButton id={item.id} title={item.title} description={item.desc} prompt={item.prompt} />
          <PromptCopyButton prompt={item.prompt} />
        </div>
      </div>
    </article>
  )
}

export default function PromptCatalog({ prompts }) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return prompts.filter((item) => {
      const tabMatch = tab === 'all' || item.level === tab
      const text = `${item.name} ${item.title} ${item.category} ${item.level} ${item.desc}`.toLowerCase()
      return tabMatch && (!needle || text.includes(needle))
    })
  }, [prompts, query, tab])

  return (
    <section id="items" className="scroll-mt-28">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#8b682c] dark:text-[#e0cc94]">Explore prompts</p><h2 className="mb-1 border-b-0 pb-0 text-2xl font-black tracking-tight text-[var(--site-ink)] sm:text-3xl">从真实任务开始</h2><p className="mb-0 text-sm text-[var(--site-muted)]">按难度和用途找到模板，预览后复制并替换占位内容。</p></div><span className="inline-flex items-center gap-1.5 text-xs text-[var(--site-faint)]"><IconSparkles size={17} /> 含输入与验收约束</span></div>
      <AgentCenterControls query={query} onQueryChange={setQuery} placeholder="搜索任务、场景或模板名" tabs={TABS} activeTab={tab} onTabChange={setTab} count={filtered.length} countLabel="个可复制模板" onClear={() => { setQuery(''); setTab('all') }} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.length ? filtered.map((item, index) => <PromptCard key={item.id} item={item} index={index} />) : <AgentCenterEmpty noun="Prompt 模板" />}</div>
      <div className="mt-8 grid gap-3 rounded-2xl bg-[#f2f1ec] p-5 dark:bg-[#1b2530] sm:grid-cols-3 sm:p-6">
        {['替换方括号里的任务信息', '补上模型无法自行获得的资料', '用验收标准检查结果'].map((text, index) => <div key={text} className="flex gap-3"><span className="font-mono text-[10px] font-bold text-[#8b682c] dark:text-[#e0cc94]">0{index + 1}</span><span className="text-xs leading-5 text-[var(--site-muted)]">{text}</span></div>)}
      </div>
    </section>
  )
}

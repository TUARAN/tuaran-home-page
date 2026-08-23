'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  IconArrowDown, IconArrowUpRight, IconBuildingFactory2, IconCalendarEvent,
  IconChevronRight, IconPlanet, IconQuote, IconRocket, IconSatellite, IconWorld,
} from '@tabler/icons-react'

const KIND_META = {
  musk: { label: '创始人观点', icon: IconQuote, dot: 'bg-amber-300', tone: 'border-amber-300/20 bg-amber-300/10 text-amber-100' },
  spacex: { label: '官方进展', icon: IconBuildingFactory2, dot: 'bg-cyan-300', tone: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100' },
  launch: { label: '发射任务', icon: IconRocket, dot: 'bg-white', tone: 'border-white/15 bg-white/[0.06] text-slate-100' },
}

const KIND_FILTERS = [
  { id: 'all', label: '全部信号' },
  { id: 'musk', label: '愿景' },
  { id: 'spacex', label: '官方进展' },
  { id: 'launch', label: '发射任务' },
]

const SYSTEMS = [
  { index: '01', name: '运载系统', product: 'Falcon · Starship', description: '以可复用火箭降低进入轨道的边际成本，让高频发射成为可能。', accent: 'from-orange-300 to-amber-500' },
  { index: '02', name: '轨道网络', product: 'Starlink', description: '用低轨卫星星座提供全球连接，同时形成稳定、持续的发射需求。', accent: 'from-cyan-200 to-sky-500' },
  { index: '03', name: '载人航天', product: 'Dragon', description: '承担往返近地轨道的人员与货物运输，连接地面、空间站与商业任务。', accent: 'from-violet-200 to-indigo-500' },
  { index: '04', name: '深空运输', product: 'Mars Architecture', description: '通过在轨加注、完全复用与规模化运输，把火星目标拆成可验证的工程系统。', accent: 'from-rose-300 to-red-600' },
]

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(date).replaceAll('/', '.')
}

function TimelineCard({ entry, index }) {
  const meta = KIND_META[entry.kind] || KIND_META.launch
  const KindIcon = meta.icon
  const title = entry.titleTranslated || entry.title
  const summary = entry.summaryTranslated || entry.summary
  const note = entry.noteTranslated || entry.note

  return (
    <article className="group relative grid gap-5 border-t border-white/10 py-9 first:border-t-0 md:grid-cols-[150px_minmax(0,1fr)_36px] md:gap-8">
      <div>
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-slate-500">
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> SIGNAL {String(index + 1).padStart(2, '0')}
        </div>
        <p className="mt-3 font-mono text-sm text-slate-300">{formatDate(entry.publishedAt)}</p>
        {entry.phase === 'upcoming' ? <span className="mt-3 inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-emerald-200">即将发射</span> : null}
      </div>
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.tone}`}><KindIcon size={13} stroke={1.7} />{meta.label}</span>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400">{entry.topic}</span>
        </div>
        <h3 className="max-w-3xl text-xl font-medium leading-snug tracking-[-0.02em] text-white md:text-2xl">{title}</h3>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 md:text-[15px]">{summary}</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <a href={entry.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-slate-300 transition hover:text-white">查看原始信号 <IconArrowUpRight size={14} /></a>
          {note ? <span>{note}</span> : null}
        </div>
      </div>
      <a href={entry.sourceUrl} target="_blank" rel="noreferrer" aria-label={`打开${title}`} className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-500 transition group-hover:border-white/30 group-hover:text-white md:flex"><IconChevronRight size={16} /></a>
    </article>
  )
}

function OrbitGraphic() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[500px]" aria-label="SpaceX 从地球轨道通往火星的系统示意图">
      <div className="absolute inset-[7%] rounded-full border border-white/[0.07]" />
      <div className="absolute inset-[20%] rounded-full border border-dashed border-cyan-200/20" />
      <div className="absolute inset-[35%] rounded-full border border-white/10" />
      <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-300/[0.07] shadow-[0_0_80px_rgba(34,211,238,0.12)]"><IconWorld size={42} stroke={1.1} className="text-cyan-100" /></div>
      <div className="absolute left-[11%] top-[47%] flex items-center gap-2 rounded-full border border-white/10 bg-[#0a111b]/90 px-3 py-2 text-[10px] tracking-[0.12em] text-slate-300"><IconSatellite size={14} className="text-cyan-200" /> STARLINK</div>
      <div className="absolute right-[5%] top-[22%] flex items-center gap-2 rounded-full border border-white/10 bg-[#0a111b]/90 px-3 py-2 text-[10px] tracking-[0.12em] text-slate-300"><IconRocket size={14} className="text-orange-200" /> STARSHIP</div>
      <div className="absolute bottom-[8%] right-[22%] flex h-16 w-16 items-center justify-center rounded-full border border-red-300/20 bg-red-400/10 shadow-[0_0_50px_rgba(248,113,113,0.12)]"><IconPlanet size={27} stroke={1.2} className="text-red-200" /></div>
      <div className="absolute bottom-[3%] right-[10%] text-[10px] tracking-[0.18em] text-red-200/70">MARS</div>
    </div>
  )
}

export default function SpaceXTimelineClient({ entries, launchSourceStatus }) {
  const [kind, setKind] = useState('all')
  const visibleEntries = useMemo(() => entries.filter((entry) => kind === 'all' || entry.kind === kind), [entries, kind])
  const launchCount = entries.filter((entry) => entry.kind === 'launch').length
  const upcomingCount = entries.filter((entry) => entry.phase === 'upcoming').length

  return (
    <main className="min-h-screen overflow-hidden bg-[#05080d] text-white">
      <section className="relative min-h-[92svh] overflow-hidden border-b border-white/10">
        <video className="absolute inset-0 h-full w-full object-cover object-center" autoPlay muted loop playsInline preload="metadata" aria-label="SpaceX 航天影像"><source src="/videos/spacex-opening.mp4" type="video/mp4" /></video>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,6,10,0.94)_0%,rgba(3,6,10,0.68)_45%,rgba(3,6,10,0.12)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#05080d_0%,transparent_42%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="relative mx-auto flex min-h-[92svh] max-w-7xl flex-col px-5 pb-10 pt-24 md:px-10 md:pb-14 md:pt-32">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-slate-300"><span className="h-px w-10 bg-cyan-200" />Space Transportation System</div>
          <div className="my-auto max-w-4xl py-16">
            <p className="mb-5 text-sm font-medium tracking-[0.2em] text-cyan-100/80">从地球轨道，到多行星文明</p>
            <h1 className="text-6xl font-semibold leading-[0.88] tracking-[-0.07em] sm:text-7xl md:text-[8.5rem]">SPACEX</h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-slate-200 md:text-lg">一家公司，一套彼此咬合的航天体系：可复用运载器负责降低成本，卫星网络创造规模，载人飞船连接近地轨道，Starship 把运输边界推向月球与火星。</p>
            <a href="#system" className="mt-9 inline-flex items-center gap-3 rounded-full border border-white/20 bg-black/20 px-5 py-3 text-xs font-semibold tracking-[0.12em] backdrop-blur-sm transition hover:border-white/50 hover:bg-white/10">探索体系 <IconArrowDown size={16} /></a>
          </div>
          <div className="grid gap-4 border-t border-white/15 pt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400 sm:grid-cols-3"><span>01 / Reusability · 完全复用</span><span>02 / Orbital Scale · 轨道规模</span><span>03 / Mars · 火星运输</span></div>
        </div>
      </section>

      <section id="system" className="relative border-b border-white/10 px-5 py-24 md:px-10 md:py-32">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.04] blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-200">Architecture / 体系</p>
              <h2 className="mt-5 text-4xl font-medium tracking-[-0.045em] md:text-6xl">四个系统，组成一条通往深空的运输链。</h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-400">运载、连接、载人和深空运输并行演进。每一次复用减少发射成本，每一批卫星增加轨道网络密度，每一次载人任务验证可靠性，最终共同服务于规模化星际运输。</p>
              <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
                {[[4, '核心系统'], [launchCount, '近期任务'], [upcomingCount, '待发任务']].map(([value, label]) => <div key={label} className="bg-[#080d14] px-4 py-5"><div className="text-2xl font-medium">{value}</div><div className="mt-1 text-[10px] tracking-wide text-slate-500">{label}</div></div>)}
              </div>
            </div>
            <OrbitGraphic />
          </div>
          <div className="mt-20 grid border-y border-white/10 md:grid-cols-2 xl:grid-cols-4">
            {SYSTEMS.map((system) => <article key={system.index} className="group relative border-b border-white/10 px-1 py-8 md:px-7 md:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:first:pl-0 xl:last:border-r-0 xl:last:pr-0"><div className={`h-px w-12 bg-gradient-to-r ${system.accent}`} /><p className="mt-6 font-mono text-[10px] tracking-[0.2em] text-slate-600">SYSTEM {system.index}</p><h3 className="mt-5 text-xl font-medium">{system.name}</h3><p className="mt-1 text-xs tracking-wide text-slate-500">{system.product}</p><p className="mt-5 text-sm leading-7 text-slate-400">{system.description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#080d14] px-5 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.24em] text-orange-200">Mission / 愿景</p><h2 className="mt-5 text-4xl font-medium tracking-[-0.045em] md:text-6xl">让生命成为多行星物种。</h2></div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
            {[
              ['降低成本', '把火箭从一次性产品变成可快速周转的运输工具。'],
              ['扩大运力', '通过大型、完全复用的 Starship 提升单次运输规模。'],
              ['建立频率', '用高频发射、在轨加注和持续测试形成稳定航线。'],
            ].map(([title, body], index) => <div key={title} className="bg-[#0b111a] p-6 md:p-7"><span className="font-mono text-[10px] text-slate-600">0{index + 1}</span><h3 className="mt-8 text-lg font-medium">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{body}</p></div>)}
          </div>
        </div>
      </section>

      <section id="timeline" className="px-5 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 border-b border-white/10 pb-9 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-200">Signal Timeline / 新闻事件线</p><h2 className="mt-5 text-4xl font-medium tracking-[-0.045em] md:text-6xl">追踪正在发生的航天进程。</h2><p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400">官方进展、公开观点与近期发射任务汇入同一条时间线。任务时间来自 Launch Library 2，临近发射仍可能调整。</p></div>
            <div className="flex flex-wrap gap-2">{KIND_FILTERS.map((filter) => <button key={filter.id} type="button" onClick={() => setKind(filter.id)} className={`rounded-full px-4 py-2 text-xs font-medium transition ${kind === filter.id ? 'bg-white text-slate-950' : 'border border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}>{filter.label}</button>)}</div>
          </div>
          {launchSourceStatus !== 'ok' ? <p className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{launchSourceStatus === 'partial' ? '部分发射数据暂时未同步，当前保留已取得的任务。' : '发射数据源暂时不可用，当前展示已核验的官方进展与观点。'}</p> : null}
          <div>{visibleEntries.length ? visibleEntries.map((entry, index) => <TimelineCard key={entry.id} entry={entry} index={index} />) : <p className="py-20 text-center text-sm text-slate-500">当前筛选条件下没有事件。</p>}</div>
          <aside className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2">
            <div className="bg-[#080d14] p-7"><IconCalendarEvent size={20} stroke={1.5} className="text-cyan-200" /><h3 className="mt-5 text-base font-medium">信号收录标准</h3><p className="mt-3 text-sm leading-7 text-slate-400">只收录可回到官方页面、公开论文、任务页面或可靠事件数据库的内容。</p></div>
            <div className="bg-[#080d14] p-7"><IconBuildingFactory2 size={20} stroke={1.5} className="text-orange-200" /><h3 className="mt-5 text-base font-medium">理解工程组织</h3><p className="mt-3 text-sm leading-7 text-slate-400">继续查看马斯克的工程方法、组织风格与争议边界。</p><Link href="/articles/research/people/elon-musk" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-white transition hover:text-cyan-200">阅读人物调研 <IconArrowUpRight size={15} /></Link></div>
          </aside>
        </div>
      </section>
    </main>
  )
}

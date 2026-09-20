'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  IconArrowDown, IconArrowUpRight, IconBuildingFactory2, IconCalendarEvent,
  IconChartBar, IconCheck, IconChevronRight, IconCopy, IconQuote, IconRocket,
} from '@tabler/icons-react'
import { SPACEX_GROK_ARCHIVE_PROMPT } from '../../../lib/spacexArchivePrompt'

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

const SECTION_LINKS = [
  { id: 'system', index: '01', label: '航天体系' },
  { id: 'dashboard', index: '02', label: '数据看板' },
  { id: 'research', index: '03', label: '归档调研' },
  { id: 'mission', index: '04', label: '多行星愿景' },
  { id: 'timeline', index: '05', label: '任务时间线' },
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
    <article id={`event-${entry.id}`} className="group relative scroll-mt-24 grid gap-5 border-t border-white/10 py-9 first:border-t-0 md:grid-cols-[150px_minmax(0,1fr)_36px] md:gap-8">
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
        {entry.video ? (
          <figure className="mt-6 max-w-3xl overflow-hidden rounded-xl border border-white/10 bg-black">
            <video className="aspect-video w-full object-cover" controls playsInline preload="metadata" aria-label={entry.video.label || `${title} 发射影像`}>
              <source src={entry.video.src} type="video/mp4" />
            </video>
            <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-[11px] text-slate-500">
              <span>{entry.video.label}</span>
              {entry.video.postUrl ? <a href={entry.video.postUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-slate-400 transition hover:text-white">{entry.video.credit} · X 原帖 <IconArrowUpRight size={12} /></a> : <span>{entry.video.credit}</span>}
            </figcaption>
          </figure>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <a href={entry.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-slate-300 transition hover:text-white">查看原始信号 <IconArrowUpRight size={14} /></a>
          {note ? <span>{note}</span> : null}
        </div>
      </div>
      <a href={entry.sourceUrl} target="_blank" rel="noreferrer" aria-label={`打开${title}`} className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-500 transition group-hover:border-white/30 group-hover:text-white md:flex"><IconChevronRight size={16} /></a>
    </article>
  )
}

export default function SpaceXTimelineClient({ entries, launchSourceStatus, stats = {} }) {
  const [kind, setKind] = useState('all')
  const [activeSection, setActiveSection] = useState('system')
  const [promptCopyState, setPromptCopyState] = useState('idle')
  const visibleEntries = useMemo(() => entries.filter((entry) => kind === 'all' || entry.kind === kind), [entries, kind])
  const launchCount = entries.filter((entry) => entry.kind === 'launch').length
  const upcomingCount = entries.filter((entry) => entry.phase === 'upcoming').length
  const milestoneEntries = entries.filter((entry) => entry.video || entry.kind === 'spacex').slice(0, 12)
  const historicalLaunchCount = stats.historicalLaunchCount || 0
  const archivedVideoCount = stats.archivedVideoCount || 0
  const archiveProgress = historicalLaunchCount ? (archivedVideoCount / historicalLaunchCount) * 100 : 0
  const topicCounts = entries
    .filter((entry) => entry.kind === 'launch')
    .reduce((counts, entry) => ({ ...counts, [entry.topic]: (counts[entry.topic] || 0) + 1 }), {})
  const maxTopicCount = Math.max(1, ...Object.values(topicCounts))

  useEffect(() => {
    let frame = 0
    function updateActiveSection() {
      frame = 0
      const threshold = window.innerHeight * 0.34
      const current = SECTION_LINKS.reduce((selected, section) => {
        const node = document.getElementById(section.id)
        return node && node.getBoundingClientRect().top <= threshold ? section.id : selected
      }, SECTION_LINKS[0].id)
      setActiveSection(current)
    }
    function onScroll() {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection)
    }
    updateActiveSection()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  async function copyGrokArchivePrompt() {
    try {
      await navigator.clipboard.writeText(SPACEX_GROK_ARCHIVE_PROMPT)
      setPromptCopyState('copied')
      window.setTimeout(() => setPromptCopyState('idle'), 2400)
    } catch {
      setPromptCopyState('error')
    }
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#05080d] text-white">
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

      <nav id="directory" aria-label="SpaceX 页面目录" className="sticky top-0 z-30 flex gap-1 overflow-x-auto border-b border-white/10 bg-[#070b11]/95 px-4 py-2.5 backdrop-blur-xl xl:hidden">
        {SECTION_LINKS.map((section) => <a key={section.id} href={`#${section.id}`} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] transition ${activeSection === section.id ? 'bg-white text-slate-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>{section.label}</a>)}
      </nav>

      <div className="relative xl:grid xl:grid-cols-[224px_minmax(0,1fr)]">
        <aside aria-label="SpaceX 章节与里程碑" className="hidden border-r border-white/10 bg-[#070b11] xl:block">
          <div className="sticky top-0 max-h-screen overflow-y-auto px-7 py-10">
            <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.24em] text-slate-600"><span className="h-px w-6 bg-cyan-200/60" />Explore</div>
            <nav className="mt-7" aria-label="章节目录">
              {SECTION_LINKS.map((section) => {
                const isActive = activeSection === section.id
                return <a key={section.id} href={`#${section.id}`} aria-current={isActive ? 'location' : undefined} className={`group relative flex items-center gap-3 border-l py-2.5 pl-4 text-sm transition ${isActive ? 'border-cyan-200 text-white' : 'border-white/10 text-slate-500 hover:border-white/30 hover:text-slate-200'}`}><span className={`font-mono text-[9px] ${isActive ? 'text-cyan-200' : 'text-slate-700'}`}>{section.index}</span><span>{section.label}</span></a>
              })}
            </nav>
            <div className="mt-10 border-t border-white/10 pt-7">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-600">Milestones</p>
              <div className="mt-4 space-y-1">
                {milestoneEntries.slice(0, 6).map((entry) => <a key={entry.id} href={`#event-${entry.id}`} className="group block rounded-lg px-3 py-2.5 transition hover:bg-white/[0.04]"><span className="font-mono text-[9px] text-slate-700 transition group-hover:text-cyan-200">{formatDate(entry.publishedAt)}</span><span className="mt-1 block line-clamp-2 text-[11px] leading-5 text-slate-500 transition group-hover:text-slate-200">{entry.titleTranslated || entry.title}</span></a>)}
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">

      <section id="system" className="relative border-b border-white/10 px-5 py-24 md:px-10 md:py-32">
        <div
          className="absolute inset-x-0 top-0 h-[820px] bg-cover bg-[position:72%_center] opacity-80 sm:bg-[position:65%_center] lg:bg-center"
          style={{ backgroundImage: "url('/images/home/deep-space-transport-network-bg.webp')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 top-0 h-[820px] bg-[linear-gradient(180deg,rgba(5,8,13,0.96)_0%,rgba(5,8,13,0.78)_45%,rgba(5,8,13,0.18)_72%,#05080d_100%)] lg:bg-[linear-gradient(90deg,rgba(5,8,13,0.96)_0%,rgba(5,8,13,0.83)_42%,rgba(5,8,13,0.12)_72%,rgba(5,8,13,0.08)_100%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-200">Architecture / 体系</p>
              <h2 className="mt-5 text-4xl font-medium tracking-[-0.045em] md:text-5xl 2xl:text-6xl">四个系统，组成一条通往深空的运输链。</h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-400">运载、连接、载人和深空运输并行演进。每一次复用减少发射成本，每一批卫星增加轨道网络密度，每一次载人任务验证可靠性，最终共同服务于规模化星际运输。</p>
              <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
                {[[4, '核心系统'], [launchCount, '近期任务'], [upcomingCount, '待发任务']].map(([value, label]) => <div key={label} className="bg-[#080d14] px-4 py-5"><div className="text-2xl font-medium">{value}</div><div className="mt-1 text-[10px] tracking-wide text-slate-500">{label}</div></div>)}
              </div>
            </div>
            <div className="min-h-[300px] sm:min-h-[380px] lg:min-h-[500px]" aria-hidden="true" />
          </div>
          <figure className="mt-16 overflow-hidden rounded-2xl border border-cyan-200/15 bg-[#07111c] shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
            <Image
              src="/images/spacex/system-comparison.webp"
              alt="Falcon、Starlink、Dragon 与 Starship 的职责对比：火箭负责发射，卫星提供网络，飞船承担往返，Starship 面向下一代深空运输"
              width={1672}
              height={941}
              sizes="(min-width: 1280px) 1120px, 100vw"
              className="h-auto w-full"
              priority={false}
            />
            <figcaption className="border-t border-white/10 px-5 py-4 text-xs leading-6 text-slate-500">
              Falcon、Starlink、Dragon 与 Starship 分别对应运载、轨道网络、载人货运和深空运输。
            </figcaption>
          </figure>
          <div className="mt-12 grid border-y border-white/10 md:grid-cols-2 xl:grid-cols-4">
            {SYSTEMS.map((system) => <article key={system.index} className="group relative border-b border-white/10 px-1 py-8 md:px-7 md:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:first:pl-0 xl:last:border-r-0 xl:last:pr-0"><div className={`h-px w-12 bg-gradient-to-r ${system.accent}`} /><p className="mt-6 font-mono text-[10px] tracking-[0.2em] text-slate-600">SYSTEM {system.index}</p><h3 className="mt-5 text-xl font-medium">{system.name}</h3><p className="mt-1 text-xs tracking-wide text-slate-500">{system.product}</p><p className="mt-5 text-sm leading-7 text-slate-400">{system.description}</p></article>)}
          </div>
        </div>
      </section>

      <section id="dashboard" className="border-b border-white/10 bg-[#05080d] px-5 py-20 md:px-10 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-200">Launch Archive / 数据看板</p><h2 className="mt-5 text-4xl font-medium tracking-[-0.045em] md:text-5xl">从发射总量看到归档进度。</h2><p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400">历史发射总量来自 Launch Library 2；视频归档数来自已经核验并写入时间线的本地记录。实时来源不可用时，总量显示为待同步。</p></div>
            <a href="#research" className="inline-flex items-center gap-1.5 text-sm font-medium text-white transition hover:text-cyan-200">查看方法、规模与边界 <IconArrowDown size={15} /></a>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [historicalLaunchCount || '—', '历史发射记录', 'Launch Library 2'],
              [archivedVideoCount, '已归档视频', '均可回到来源'],
              [historicalLaunchCount ? `${archiveProgress.toFixed(2)}%` : '—', '影像归档进度', '按一场一段计算'],
              [stats.upcomingLaunchCount ?? upcomingCount, '近期待发任务', '计划可能调整'],
            ].map(([value, label, note]) => <div key={label} className="bg-[#080d14] p-6 md:p-7"><div className="font-mono text-3xl text-white">{value}</div><div className="mt-4 text-sm font-medium text-slate-200">{label}</div><div className="mt-1 text-xs text-slate-600">{note}</div></div>)}
          </div>
          <div className="mt-6 grid gap-6 rounded-2xl border border-white/10 bg-[#080d14] p-6 lg:grid-cols-[0.65fr_1.35fr] md:p-8">
            <div><IconChartBar size={20} stroke={1.5} className="text-orange-200" /><h3 className="mt-5 text-lg font-medium">当前窗口的任务构成</h3><p className="mt-3 text-sm leading-7 text-slate-500">统计近期同步任务和已经归档的历史任务。随着视频持续回溯，分布会逐步扩展。</p></div>
            <div className="space-y-4">
              {Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).map(([topic, count]) => <div key={topic}><div className="mb-2 flex items-center justify-between text-xs"><span className="text-slate-300">{topic}</span><span className="font-mono text-slate-500">{count}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" style={{ width: `${Math.max(8, (count / maxTopicCount) * 100)}%` }} /></div></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="research" className="border-b border-white/10 bg-[#080d14] px-5 py-24 md:px-10 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-orange-200">Research / 归档调研</p>
              <h2 className="mt-5 text-4xl font-medium tracking-[-0.045em] md:text-5xl">730 场发射，按任务、时间与来源串成视频时间线。</h2>
              <p className="mt-6 text-sm leading-7 text-slate-400">时间线覆盖 2006—2026 年的 SpaceX 发射记录。每段影像对应具体任务、发射时间、地点与官方来源，可按年代查找，也能回到原始记录复核。</p>
              <a href="#timeline" className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-white transition hover:text-cyan-200">进入发射时间线 <IconArrowDown size={15} /></a>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
              {[
                ['时间跨度', '2006—2026', '从 Falcon 1 / FalconSAT-2 到当前任务，早期公开视频和元数据相对稀少。'],
                ['任务分布', '419 + 223 + 88', '2024 年至今 419 场，2020—2023 年 223 场，2006—2019 年 88 场。'],
                ['检索字段', '任务 · 时间 · 地点', '影像与任务名称、发射时间和发射地点对应，避免脱离上下文的片段。'],
                ['核验来源', '官方记录优先', '保留任务记录、官方原帖、数据库来源和必要说明，便于交叉查证。'],
              ].map(([label, value, description]) => <article key={label} className="bg-[#0b111a] p-6 md:p-7"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-600">{label}</p><h3 className="mt-5 text-2xl font-medium text-white">{value}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{description}</p></article>)}
            </div>
          </div>
          <div className="mt-8 grid gap-6 rounded-2xl border border-white/10 bg-[#05080d] p-6 md:grid-cols-3 md:p-8">
            {[
              ['2024 年至今', '高频发射期 · 419 场', '任务数据、官方帖子和直播记录较完整，可集中查看 Starlink 与高频复用。'],
              ['2020—2023', '常规复用期 · 223 场', 'Falcon 9 发射频率快速提升，直播与官方短视频共同构成影像来源。'],
              ['2006—2019', '早期任务 · 88 场', '从 Falcon 1 到猎鹰重型早期任务，旧链接与缺失元数据需要逐项交叉核验。'],
            ].map(([step, title, description]) => <div key={step}><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-200">{step}</p><h3 className="mt-4 text-base font-medium">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-500">{description}</p></div>)}
          </div>
          <p className="mt-6 max-w-4xl text-xs leading-6 text-slate-600">数据口径截至 2026 年 9 月 20 日。发射总量来自 Launch Library 2 的 SpaceX 历史任务查询；影像优先采用 SpaceX 官方公开内容，并保留原帖链接与署名。著作权、平台条款与传播许可可能变化，页面仅展示理解任务所需的片段。</p>
        </div>
      </section>

      <section id="mission" className="border-b border-white/10 bg-[#080d14] px-5 py-24 md:px-10 md:py-32">
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
            <div><p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-200">Signal Timeline / 新闻事件线</p><h2 className="mt-5 text-4xl font-medium tracking-[-0.045em] md:text-6xl">追踪正在发生的航天进程。</h2><p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400">官方进展、公开观点与发射任务汇入同一条时间线。近期任务由 Launch Library 2 同步；已核验的历史任务和视频会持续归档，不随近期列表滚动消失。</p></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={copyGrokArchivePrompt} className="inline-flex items-center gap-1 rounded-md border border-cyan-200/20 bg-cyan-200/[0.07] px-2.5 py-1.5 text-[11px] font-medium text-cyan-100 transition hover:border-cyan-100/45 hover:bg-cyan-200/10" title="复制 Grok 归档提示词" aria-label="复制 Grok 归档提示词">
                {promptCopyState === 'copied' ? <IconCheck size={12} /> : <IconCopy size={12} />}
                {promptCopyState === 'copied' ? '已复制' : promptCopyState === 'error' ? '重试' : 'Grok'}
              </button>
              {KIND_FILTERS.map((filter) => <button key={filter.id} type="button" onClick={() => setKind(filter.id)} className={`rounded-full px-4 py-2 text-xs font-medium transition ${kind === filter.id ? 'bg-white text-slate-950' : 'border border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}>{filter.label}</button>)}
            </div>
          </div>
          {launchSourceStatus !== 'ok' ? <p className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{launchSourceStatus === 'partial' ? '部分发射数据暂时未同步，当前保留已取得的任务。' : '发射数据源暂时不可用，当前展示已归档任务、官方进展与观点。'}</p> : null}
          <div>{visibleEntries.length ? visibleEntries.map((entry, index) => <TimelineCard key={entry.id} entry={entry} index={index} />) : <p className="py-20 text-center text-sm text-slate-500">当前筛选条件下没有事件。</p>}</div>
          <aside className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2">
            <div className="bg-[#080d14] p-7"><IconCalendarEvent size={20} stroke={1.5} className="text-cyan-200" /><h3 className="mt-5 text-base font-medium">信号收录标准</h3><p className="mt-3 text-sm leading-7 text-slate-400">只收录可回到官方页面、公开论文、任务页面或可靠事件数据库的内容。</p></div>
            <div className="bg-[#080d14] p-7"><IconBuildingFactory2 size={20} stroke={1.5} className="text-orange-200" /><h3 className="mt-5 text-base font-medium">理解工程组织</h3><p className="mt-3 text-sm leading-7 text-slate-400">继续查看马斯克的工程方法、组织风格与争议边界。</p><Link href="/articles/research/people/elon-musk" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-white transition hover:text-cyan-200">阅读人物调研 <IconArrowUpRight size={15} /></Link></div>
          </aside>
        </div>
      </section>
        </div>
      </div>
    </main>
  )
}

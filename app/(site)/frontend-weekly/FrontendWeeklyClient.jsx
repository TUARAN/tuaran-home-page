'use client'

import { useEffect, useMemo, useState } from 'react'

const TABS = [
  { key: 'weekly', label: '前端周刊', note: '每周更新' },
  { key: 'daily', label: '每日精选', note: '每日 09:00' },
  { key: 'live', label: '每时新闻', note: '每小时' },
]

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}

function WeeklyPanel({ issues }) {
  const [selectedId, setSelectedId] = useState(issues[0]?.id || null)
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return issues
    return issues.filter((issue) => `${issue.title} ${issue.recommendation} ${issue.sections.flatMap((s) => s.items.map((i) => i.title)).join(' ')}`.toLowerCase().includes(q))
  }, [issues, query])
  const issue = issues.find((item) => item.id === selectedId) || filtered[0]

  if (!issues.length) return <Empty text="周刊内容同步中，稍后再来看看。" />
  return <div className="grid gap-6 lg:grid-cols-[252px_minmax(0,1fr)]">
    <aside className="rounded-xl border border-[#e2e3da] bg-white/70 p-3 dark:border-[#293342] dark:bg-[#111923]">
      <label className="block">
        <span className="sr-only">搜索周刊</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索期号或主题" className="w-full rounded-lg border border-[#d9d8ce] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#596a4b] dark:border-[#354153] dark:bg-[#0d131b]" />
      </label>
      <div className="mt-3 max-h-[560px] space-y-1 overflow-auto pr-1">
        {filtered.map((item) => <button type="button" key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${item.id === issue?.id ? 'bg-[#25301e] text-white dark:bg-[#b9cf9a] dark:text-[#182014]' : 'text-[#4f504b] hover:bg-[#eceee5] dark:text-[#c7ccd4] dark:hover:bg-[#202b37]'}`}>
          <span className="font-medium">{item.title}</span>
          <span className="mt-0.5 block text-xs opacity-70">{item.sections?.reduce((total, section) => total + section.items.length, 0) || 0} 篇精选</span>
        </button>)}
      </div>
    </aside>
    {issue ? <article className="min-w-0 rounded-xl border border-[#e2e3da] bg-white/70 p-5 dark:border-[#293342] dark:bg-[#111923] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e6e5dd] pb-5 dark:border-[#293342]">
        <div><p className="text-xs font-semibold tracking-[0.16em] text-[#78886a]">FRONTEND WEEKLY</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">{issue.title}</h2></div>
        <a href={issue.source} target="_blank" rel="noreferrer" className="rounded-full border border-[#cdd5c4] px-3 py-1.5 text-xs text-[#526345] transition hover:bg-[#edf0e8] dark:border-[#46533d] dark:text-[#b9cf9a] dark:hover:bg-[#202a1a]">查看原始 Markdown ↗</a>
      </div>
      {issue.recommendation ? <p className="my-6 whitespace-pre-line rounded-lg border-l-2 border-[#91a780] bg-[#f4f6f0] px-4 py-3 text-sm leading-7 text-[#4f504b] dark:border-[#9eb789] dark:bg-[#182116] dark:text-[#ced7c7]">{issue.recommendation}</p> : null}
      <div className="space-y-7">{issue.sections.map((section) => <section key={section.title}><h3 className="text-base font-semibold">{section.title}</h3><ul className="mt-3 space-y-3">{section.items.map((item) => <li key={item.href} className="rounded-lg border border-[#e7e7df] p-3 transition hover:border-[#bdcbb0] dark:border-[#2e3947] dark:hover:border-[#506346]"><a href={item.href} target="_blank" rel="noreferrer" className="font-medium text-[#2f4724] underline decoration-[#b8c9aa] underline-offset-4 dark:text-[#b9cf9a]">{item.title} ↗</a>{item.summary ? <p className="mt-1 text-sm leading-6 text-[#696b65] dark:text-[#aeb5c0]">{item.summary}</p> : null}</li>)}</ul></section>)}</div>
    </article> : <Empty text="没有匹配的周刊。" />}
  </div>
}

function DailyPanel({ manifest }) {
  const [date, setDate] = useState(manifest.latest || manifest.list?.[0]?.date || '')
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(false)
  const selectDate = (nextDate) => { setDate(nextDate); setEntry(null) }
  useEffect(() => {
    if (!date) return
    let active = true
    setLoading(true)
    fetch(`/frontend-weekly/daily/${encodeURIComponent(date)}.json`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => { if (active) setEntry(data) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [date])
  if (!date) return <Empty text="每日精选将在首次自动更新后显示。" />
  return <section className="rounded-xl border border-[#e2e3da] bg-white/70 p-5 dark:border-[#293342] dark:bg-[#111923] sm:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold tracking-[0.16em] text-[#78886a]">AI DAILY</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">每日精选</h2><p className="mt-2 text-sm text-[#696b65] dark:text-[#aeb5c0]">AI Coding 与具身智能的高密度追踪，每日 09:00 自动更新。</p></div><select value={date} onChange={(event) => selectDate(event.target.value)} className="rounded-lg border border-[#d9d8ce] bg-white px-3 py-2 text-sm dark:border-[#354153] dark:bg-[#0d131b]">{manifest.list.map((item) => <option key={item.date} value={item.date}>{item.displayDate || item.date} · {item.count} 条</option>)}</select></div>{loading ? <p className="py-16 text-center text-sm text-[#777]">加载中…</p> : entry ? <div className="mt-6 grid gap-4 md:grid-cols-2">{entry.items.map((item) => <article key={item.num} className="rounded-lg border border-[#e5e7de] p-4 dark:border-[#2e3947]"><div className="flex items-center gap-2 text-xs"><span className="rounded-full bg-[#edf3e8] px-2 py-1 font-semibold text-[#4f633f] dark:bg-[#26361f] dark:text-[#c0d6ac]">{item.topic}</span><span className="text-[#85877f]">{item.num}</span></div><a href={item.href} target="_blank" rel="noreferrer" className="mt-3 block font-semibold leading-6 text-[#2f4724] hover:underline dark:text-[#b9cf9a]">{item.title} ↗</a><p className="mt-2 text-sm leading-6 text-[#696b65] dark:text-[#aeb5c0]">{item.summary}</p><p className="mt-3 border-l-2 border-[#c6d9b6] pl-3 text-xs leading-5 text-[#738068] dark:text-[#b7c2ac]">{item.reason}</p></article>)}</div> : <Empty text="这一天的内容暂无数据。" />}</section>
}

function LivePanel({ live }) {
  return <section className="rounded-xl border border-[#e2e3da] bg-white/70 p-5 dark:border-[#293342] dark:bg-[#111923] sm:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold tracking-[0.16em] text-[#78886a]">LIVE SIGNAL</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">每时新闻</h2><p className="mt-2 text-sm text-[#696b65] dark:text-[#aeb5c0]">AI、Agent、前端与科技动态，每小时自动汇总。</p></div>{live.updatedAt ? <span className="rounded-full bg-[#edf3e8] px-3 py-1.5 text-xs font-medium text-[#506345] dark:bg-[#26361f] dark:text-[#c0d6ac]">● 更新于 {formatTime(live.updatedAt)}</span> : null}</div>{live.items?.length ? <div className="mt-6 space-y-3">{live.items.map((item) => <article key={item.href} className="rounded-lg border border-[#e5e7de] p-4 dark:border-[#2e3947]"><div className="flex flex-wrap items-center gap-2 text-xs text-[#777] dark:text-[#aeb5c0]"><span className="rounded-full bg-[#edf3e8] px-2 py-1 font-semibold text-[#4f633f] dark:bg-[#26361f] dark:text-[#c0d6ac]">{item.topic}</span><span>{item.source}</span><span>{formatTime(item.publishedAt)}</span></div><a href={item.href} target="_blank" rel="noreferrer" className="mt-2 block font-semibold leading-6 text-[#2f4724] hover:underline dark:text-[#b9cf9a]">{item.title} ↗</a>{item.summary ? <p className="mt-1.5 text-sm leading-6 text-[#696b65] dark:text-[#aeb5c0]">{item.summary}</p> : null}</article>)}</div> : <Empty text="新闻流将在首次自动更新后显示。" />}</section>
}

function Empty({ text }) { return <div className="rounded-xl border border-dashed border-[#cfd2c8] p-12 text-center text-sm text-[#777] dark:border-[#3b4654] dark:text-[#aeb5c0]">{text}</div> }

export default function FrontendWeeklyClient({ weekly, daily, live }) {
  const [tab, setTab] = useState('weekly')
  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14"><header className="border-b border-[#dedfd6] pb-7 dark:border-[#293342]"><p className="text-xs font-semibold tracking-[0.18em] text-[#78886a]">CONTENT / FRONTEND WEEKLY</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">前端周看</h1><p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#686963] dark:text-[#aeb5c0]">把前端周刊、AI 每日精选和每时新闻放进本站的内容流：沿用本站阅读体验，内容自动同步更新。</p></header><nav className="mt-6 flex gap-2 overflow-auto pb-1" aria-label="前端周看内容类型">{TABS.map((item) => <button type="button" key={item.key} onClick={() => setTab(item.key)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${tab === item.key ? 'border-[#25301e] bg-[#25301e] text-white dark:border-[#b9cf9a] dark:bg-[#b9cf9a] dark:text-[#182014]' : 'border-[#d9d8ce] text-[#5d5f57] hover:border-[#aebba3] dark:border-[#354153] dark:text-[#c7ccd4]'}`}>{item.label}<span className="ml-2 text-xs opacity-65">{item.note}</span></button>)}</nav><div className="mt-6">{tab === 'weekly' ? <WeeklyPanel issues={weekly.issues || []} /> : null}{tab === 'daily' ? <DailyPanel manifest={daily} /> : null}{tab === 'live' ? <LivePanel live={live} /> : null}</div></main>
}

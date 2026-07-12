'use client'

import { useEffect, useMemo, useState } from 'react'

const TABS = [
  { key: 'weekly', label: '前端周刊', note: '每周更新' },
  { key: 'daily', label: '每日精选', note: '每日 09:00' },
  { key: 'live', label: '每时新闻', note: '每小时' },
]

const shell = 'border border-[#e2e3da] bg-white/70 dark:border-[#293342] dark:bg-[#111923]'
const rule = 'border-[#e6e5dd] dark:border-[#293342]'
const muted = 'text-[#696b65] dark:text-[#aeb5c0]'
const link = 'font-medium text-[#2f4724] underline decoration-[#b8c9aa] underline-offset-4 dark:text-[#b9cf9a]'

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function ReadingLayout({ aside, children }) {
  return <div className="grid gap-6 lg:grid-cols-[252px_minmax(0,1fr)]">
    <aside className={`${shell} h-fit p-3`}>{aside}</aside>
    {children}
  </div>
}

function SectionHeading({ eyebrow, title, description, action }) {
  return <div className={`flex flex-wrap items-start justify-between gap-4 border-b pb-5 ${rule}`}>
    <div>
      <p className="text-xs font-semibold tracking-[0.16em] text-[#78886a]">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
      {description ? <p className={`mt-2 text-sm leading-6 ${muted}`}>{description}</p> : null}
    </div>
    {action}
  </div>
}

function WeeklyPanel({ issues }) {
  const [selectedId, setSelectedId] = useState(issues[0]?.id || null)
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return issues
    return issues.filter((issue) => `${issue.title} ${issue.recommendation} ${issue.sections.flatMap((section) => section.items.map((item) => item.title)).join(' ')}`.toLowerCase().includes(q))
  }, [issues, query])
  const issue = issues.find((item) => item.id === selectedId) || filtered[0]

  if (!issues.length) return <Empty text="周刊内容同步中，稍后再来看看。" />
  return <ReadingLayout aside={<>
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
  </>}>
    {issue ? <article className={`${shell} min-w-0 p-5 sm:p-7`}>
      <SectionHeading eyebrow="FRONTEND WEEKLY" title={issue.title} action={<a href={issue.source} target="_blank" rel="noreferrer" className="rounded-full border border-[#cdd5c4] px-3 py-1.5 text-xs text-[#526345] transition hover:bg-[#edf0e8] dark:border-[#46533d] dark:text-[#b9cf9a] dark:hover:bg-[#202a1a]">查看原始 Markdown ↗</a>} />
      {issue.recommendation ? <p className="my-6 whitespace-pre-line border-l-2 border-[#91a780] pl-4 text-sm leading-7 text-[#4f504b] dark:border-[#9eb789] dark:text-[#ced7c7]">{issue.recommendation}</p> : null}
      <div className="space-y-7">
        {issue.sections.map((section) => <section key={section.title}>
          <h3 className="text-base font-semibold">{section.title}</h3>
          <ul className={`mt-3 divide-y border-t ${rule}`}>
            {section.items.map((item) => <li key={item.href} className={`py-4 first:pt-3 ${rule}`}>
              <a href={item.href} target="_blank" rel="noreferrer" className={link}>{item.title} ↗</a>
              {item.summary ? <p className={`mt-1 text-sm leading-6 ${muted}`}>{item.summary}</p> : null}
            </li>)}
          </ul>
        </section>)}
      </div>
    </article> : <Empty text="没有匹配的周刊。" />}
  </ReadingLayout>
}

function DailyPanel({ manifest }) {
  const [date, setDate] = useState(manifest.latest || manifest.list?.[0]?.date || '')
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(false)

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
  return <ReadingLayout aside={<>
    <p className="px-3 pt-2 text-xs font-semibold tracking-[0.14em] text-[#78886a]">ARCHIVE</p>
    <div className="mt-2 max-h-[560px] space-y-1 overflow-auto pr-1">
      {manifest.list.map((item) => <button type="button" key={item.date} onClick={() => setDate(item.date)} className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${item.date === date ? 'bg-[#25301e] text-white dark:bg-[#b9cf9a] dark:text-[#182014]' : 'text-[#4f504b] hover:bg-[#eceee5] dark:text-[#c7ccd4] dark:hover:bg-[#202b37]'}`}>
        <span className="font-medium">{item.displayDate || item.date}</span>
        <span className="mt-0.5 block text-xs opacity-70">{item.count} 条精选</span>
      </button>)}
    </div>
  </>}>
    <article className={`${shell} min-w-0 p-5 sm:p-7`}>
      <SectionHeading eyebrow="AI DAILY" title="每日精选" description="AI Coding 与具身智能的高密度追踪，每日 09:00 自动更新。" />
      {loading ? <p className="py-16 text-center text-sm text-[#777]">加载中…</p> : entry ? <ol className={`mt-6 divide-y border-t ${rule}`}>
        {entry.items.map((item) => <li key={item.num} className={`py-5 first:pt-4 ${rule}`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#85877f]">
            <span className="font-semibold text-[#4f633f] dark:text-[#c0d6ac]">{item.topic}</span>
            <span>#{item.num}</span>
          </div>
          <a href={item.href} target="_blank" rel="noreferrer" className={`mt-2 block leading-6 ${link}`}>{item.title} ↗</a>
          <p className={`mt-2 text-sm leading-6 ${muted}`}>{item.summary}</p>
          {item.reason ? <p className="mt-3 border-l-2 border-[#c6d9b6] pl-3 text-xs leading-5 text-[#738068] dark:text-[#b7c2ac]">{item.reason}</p> : null}
        </li>)}
      </ol> : <Empty text="这一天的内容暂无数据。" />}
    </article>
  </ReadingLayout>
}

function LivePanel({ live }) {
  return <ReadingLayout aside={<div className="px-3 py-2">
    <p className="text-xs font-semibold tracking-[0.14em] text-[#78886a]">LIVE SIGNAL</p>
    <p className={`mt-3 text-sm leading-6 ${muted}`}>AI、Agent、前端与科技动态，每小时自动汇总。</p>
    {live.updatedAt ? <p className={`mt-5 border-t pt-4 text-xs leading-5 ${rule} ${muted}`}>最近更新<br /><span className="mt-1 block font-medium text-[#4f633f] dark:text-[#c0d6ac]">{formatTime(live.updatedAt)}</span></p> : null}
  </div>}>
    <article className={`${shell} min-w-0 p-5 sm:p-7`}>
      <SectionHeading eyebrow="LIVE SIGNAL" title="每时新闻" description="来自正在发生的技术现场。" />
      {live.items?.length ? <ol className={`mt-6 divide-y border-t ${rule}`}>
        {live.items.map((item) => <li key={item.href} className={`py-5 first:pt-4 ${rule}`}>
          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${muted}`}>
            <span className="font-semibold text-[#4f633f] dark:text-[#c0d6ac]">{item.topic}</span>
            <span>{item.source}</span>
            <span>{formatTime(item.publishedAt)}</span>
          </div>
          <a href={item.href} target="_blank" rel="noreferrer" className={`mt-2 block leading-6 ${link}`}>{item.title} ↗</a>
          {item.summary ? <p className={`mt-1.5 text-sm leading-6 ${muted}`}>{item.summary}</p> : null}
        </li>)}
      </ol> : <Empty text="新闻流将在首次自动更新后显示。" />}
    </article>
  </ReadingLayout>
}

function Empty({ text }) {
  return <div className="border border-dashed border-[#cfd2c8] p-12 text-center text-sm text-[#777] dark:border-[#3b4654] dark:text-[#aeb5c0]">{text}</div>
}

export default function FrontendWeeklyClient({ weekly, daily, live }) {
  const [tab, setTab] = useState('weekly')
  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
    <header className="border-b border-[#dedfd6] pb-7 dark:border-[#293342]">
      <p className="text-xs font-semibold tracking-[0.18em] text-[#78886a]">CONTENT / FRONTEND WEEKLY</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">前端周看</h1>
      <p className={`mt-3 max-w-2xl text-[15px] leading-7 ${muted}`}>把前端周刊、AI 每日精选和每时新闻放进本站的内容流：沿用本站阅读体验，内容自动同步更新。</p>
    </header>
    <nav className="mt-6 flex gap-2 overflow-auto pb-1" aria-label="前端周看内容类型">
      {TABS.map((item) => <button type="button" key={item.key} onClick={() => setTab(item.key)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${tab === item.key ? 'border-[#25301e] bg-[#25301e] text-white dark:border-[#b9cf9a] dark:bg-[#b9cf9a] dark:text-[#182014]' : 'border-[#d9d8ce] text-[#5d5f57] hover:border-[#aebba3] dark:border-[#354153] dark:text-[#c7ccd4]'}`}>{item.label}<span className="ml-2 text-xs opacity-65">{item.note}</span></button>)}
    </nav>
    <div className="mt-6">
      {tab === 'weekly' ? <WeeklyPanel issues={weekly.issues || []} /> : null}
      {tab === 'daily' ? <DailyPanel manifest={daily} /> : null}
      {tab === 'live' ? <LivePanel live={live} /> : null}
    </div>
  </main>
}

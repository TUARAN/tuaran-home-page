'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  IconArrowUpRight,
  IconBuildingFactory2,
  IconCalendarEvent,
  IconQuote,
  IconRocket,
  IconSatellite,
} from '@tabler/icons-react'

const KIND_META = {
  musk: { label: '马斯克观点', icon: IconQuote, tone: 'border-amber-300/70 bg-amber-50 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100' },
  spacex: { label: 'SpaceX 官方', icon: IconBuildingFactory2, tone: 'border-sky-300/70 bg-sky-50 text-sky-950 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100' },
  launch: { label: '发射任务', icon: IconRocket, tone: 'border-slate-300 bg-white text-slate-900 dark:border-white/15 dark:bg-white/[0.045] dark:text-slate-100' },
}

const KIND_FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'musk', label: '马斯克' },
  { id: 'spacex', label: 'SpaceX 官方' },
  { id: 'launch', label: '发射任务' },
]

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

function TimelineCard({ entry }) {
  const meta = KIND_META[entry.kind] || KIND_META.launch
  const KindIcon = meta.icon
  const [translated, setTranslated] = useState(false)
  const canTranslate = entry.originalLanguage !== 'zh'
    && Boolean(entry.summaryOriginal)
    && Boolean(entry.summaryTranslated)
  const title = translated ? entry.titleTranslated : entry.titleOriginal || entry.title
  const summary = translated ? entry.summaryTranslated : entry.summaryOriginal || entry.summary
  const note = translated ? entry.noteTranslated : entry.noteOriginal || entry.note

  return (
    <article className="group relative grid gap-4 border-t border-slate-200 py-7 first:border-t-0 dark:border-white/10 md:grid-cols-[132px_minmax(0,1fr)]">
      <div className="md:pt-1">
        <p className="font-mono text-sm font-semibold tracking-tight text-slate-500 dark:text-slate-400">
          {formatDate(entry.publishedAt)}
        </p>
        {entry.phase === 'upcoming' ? (
          <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">
            即将进行
          </span>
        ) : null}
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.tone}`}>
            <KindIcon size={14} stroke={1.8} />
            {meta.label}
          </span>
          <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
            {entry.topic}
          </span>
        </div>

        <h2 lang={translated ? 'zh-CN' : entry.originalLanguage} className="text-xl font-semibold leading-snug tracking-tight text-slate-950 dark:text-white md:text-2xl">
          {title}
        </h2>
        <p lang={translated ? 'zh-CN' : entry.originalLanguage} className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-600 dark:text-slate-300">
          {summary}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
          <a
            href={entry.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-sky-700 dark:text-slate-200 dark:decoration-slate-600 dark:hover:text-sky-300"
          >
            {entry.sourceLabel}
            <IconArrowUpRight size={14} />
          </a>
          {note ? <span>{note}</span> : null}
          {canTranslate ? (
            <button
              type="button"
              onClick={() => setTranslated((value) => !value)}
              className="rounded-full border border-slate-200 px-2.5 py-1 font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50 dark:border-white/15 dark:text-sky-300 dark:hover:border-sky-400/40 dark:hover:bg-sky-400/10"
            >
              {translated ? '查看英文' : '翻译成中文'}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default function SpaceXTimelineClient({ entries, launchSourceStatus }) {
  const [kind, setKind] = useState('all')
  const [topic, setTopic] = useState('all')
  const topics = useMemo(
    () => ['all', ...Array.from(new Set(entries.map((entry) => entry.topic)))],
    [entries],
  )
  const visibleEntries = useMemo(
    () => entries.filter((entry) => (kind === 'all' || entry.kind === kind) && (topic === 'all' || entry.topic === topic)),
    [entries, kind, topic],
  )
  const upcomingCount = entries.filter((entry) => entry.phase === 'upcoming').length

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-slate-950 dark:bg-[#07101b] dark:text-white">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#081524] text-white dark:border-white/10">
        <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_78%_20%,rgba(14,165,233,0.28),transparent_30%),radial-gradient(circle_at_15%_100%,rgba(99,102,241,0.22),transparent_36%)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-sky-300">
            <IconSatellite size={17} />
            SpaceX Signal Timeline
          </div>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.04em] md:text-7xl">SpaceX 时间线</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
            马斯克公开观点与 SpaceX 官方表述均附原始出处；发射任务提供可核验的时间、状态与地点。
          </p>

          <div className="mt-10 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4">
            {[
              ['观点与官方条目', entries.filter((entry) => entry.kind !== 'launch').length],
              ['近期任务', entries.filter((entry) => entry.kind === 'launch').length],
              ['待发任务', upcomingCount],
              ['同步频率', '3 小时'],
            ].map(([label, value]) => (
              <div key={label} className="bg-[#0b1929]/90 px-4 py-4">
                <div className="text-2xl font-semibold text-white">{value}</div>
                <div className="mt-1 text-xs text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] md:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <IconCalendarEvent size={18} />
                筛选时间线
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">观点是编辑摘要；任务时间来自 Launch Library 2，临近发射仍可能调整。</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {KIND_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setKind(filter.id)}
                  className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${kind === filter.id ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-400 dark:border-white/10 dark:bg-transparent dark:text-slate-300 dark:hover:border-white/30'}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto border-t border-slate-100 pt-5 dark:border-white/10">
            {topics.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTopic(item)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs transition ${topic === item ? 'bg-sky-100 font-semibold text-sky-900 dark:bg-sky-400/15 dark:text-sky-200' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'}`}
              >
                {item === 'all' ? '全部主题' : item}
              </button>
            ))}
          </div>
        </section>

        {launchSourceStatus !== 'ok' ? (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            {launchSourceStatus === 'partial'
              ? '部分发射数据暂时没有同步成功，当前列表仍保留已取得的任务。'
              : 'Launch Library 2 暂时不可用，当前先展示已核验的观点与官方条目。'}
          </p>
        ) : null}

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white px-5 shadow-sm dark:border-white/10 dark:bg-white/[0.025] md:px-8">
          {visibleEntries.length ? (
            visibleEntries.map((entry) => <TimelineCard key={entry.id} entry={entry} />)
          ) : (
            <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">当前筛选条件下没有条目。</p>
          )}
        </section>

        <aside className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
            <h2 className="text-base font-semibold">收录标准</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">只收录能回到原始页面、论文、官方任务或可靠事件数据库的内容。普通转述和无法定位出处的截图不进入时间线。</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
            <h2 className="text-base font-semibold">延伸阅读</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">马斯克的工程方法、组织风格和争议边界，可在人物调研中继续查看。</p>
            <Link href="/articles/research/people/elon-musk" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:underline dark:text-sky-300">
              阅读马斯克人物调研 <IconArrowUpRight size={15} />
            </Link>
          </div>
        </aside>
      </div>
    </main>
  )
}

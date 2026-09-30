'use client'

import {
  IconActivity,
  IconArrowUpRight,
  IconBolt,
  IconBook2,
  IconChartBar,
  IconClock,
  IconDatabaseSearch,
  IconExternalLink,
  IconFilter,
  IconFlame,
  IconListDetails,
  IconRefresh,
  IconSearch,
  IconShieldCheck,
  IconSparkles,
  IconTopologyStar3,
} from '@tabler/icons-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { LoadingSpinner } from '../../components/loading/LoadingPrimitives'
import { buildPublicOpinionSnapshot, getSentimentBucket, getSentimentLabel, materializePublicOpinionPostTimes } from '../../../lib/publicOpinionData'

const STANCE_LABELS = { support: '支持', neutral: '中立', question: '质疑', oppose: '反对' }
const SENTIMENT_STYLES = {
  positive: 'border-[#b8ddd3] bg-[#eff9f5] text-[#287365] dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
  neutral: 'border-[#cbd9df] bg-[#f2f7f8] text-[#4f707a] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  negative: 'border-[#efc7bd] bg-[#fff3ef] text-[#b9523b] dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300',
}
const RISK_STYLES = {
  高: 'border-[#e7a99b] bg-[#fff1ed] text-[#c14732] dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300',
  中: 'border-[#e8d3a7] bg-[#fff8e9] text-[#9b692a] dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
  低: 'border-[#b7dcd4] bg-[#eef8f5] text-[#277265] dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
}
const NAV_ITEMS = [
  { id: 'selected', label: '精选舆情', icon: IconBolt, target: 'feed' },
  { id: 'all', label: '全部动态', icon: IconListDetails, target: 'feed' },
  { id: 'hot', label: '热点榜', icon: IconFlame, target: 'hot' },
  { id: 'trend', label: '趋势研判', icon: IconChartBar, target: 'trend' },
  { id: 'sources', label: '公开来源', icon: IconDatabaseSearch, target: 'sources' },
]

function numberFormat(value) {
  return new Intl.NumberFormat('zh-CN').format(Number(value || 0))
}

function formatClock(value, fallback = '') {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}

function formatDate(value) {
  const date = value ? new Date(value) : new Date()
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date
  return {
    date: new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: 'long', day: 'numeric' }).format(safeDate),
    weekday: new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', weekday: 'short' }).format(safeDate),
  }
}

function scrollToSection(target) {
  document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3 px-2 py-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#14343b] text-[17px] font-bold text-white shadow-sm dark:bg-[#dce9e3] dark:text-[#15211d]">舆</div>
      <div>
        <p className="mb-0 text-[17px] font-bold tracking-[0.08em] text-[#17252a] dark:text-gray-100">OPINION</p>
        <p className="mb-0 text-[10px] font-semibold tracking-[0.22em] text-[#2f7d82] dark:text-[#8bc3bd]">INTELLIGENCE</p>
      </div>
    </div>
  )
}

function WorkspaceSidebar({ activeView, onViewChange, snapshot, connectors, dataStatus, lastUpdated }) {
  return (
    <aside className="border-b border-[#dfe4e1] bg-[#fbfcfa] px-3 py-4 dark:border-[#293640] dark:bg-[#0f171e] lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r lg:px-4 lg:py-5">
      <BrandMark />
      <div className="mt-6 hidden text-[11px] font-medium text-[#89928e] lg:block">内容</div>
      <nav className="mt-2 flex gap-2 overflow-x-auto pb-1 lg:grid lg:gap-1.5" aria-label="舆情工作台栏目">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = activeView === item.id
          return (
            <button key={item.id} type="button" onClick={() => { onViewChange(item.id); scrollToSection(item.target) }} className={`inline-flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-left text-[13px] font-semibold transition lg:w-full ${active ? 'bg-[#e4eeee] text-[#173e45] dark:bg-[#173038] dark:text-[#c7e4df]' : 'text-[#5f6e70] hover:bg-[#f0f3f0] dark:text-[#94a5ad] dark:hover:bg-[#18232d] dark:hover:text-gray-100'}`}>
              <Icon className={`h-[18px] w-[18px] ${active ? 'text-[#25818a]' : ''}`} aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="mt-7 hidden lg:block">
        <p className="mb-3 text-[11px] font-medium text-[#89928e]">运行状态</p>
        <div className="space-y-2 rounded-2xl border border-[#e0e5e2] bg-white p-3 dark:border-[#2c3944] dark:bg-[#111c25]">
          {[
            ['当前状态', dataStatus],
            ['聚合事件', snapshot.events.length],
            ['公开来源', connectors.length],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between text-[12px]">
              <span className="text-[#75817d] dark:text-[#8999a3]">{label}</span>
              <span className="font-semibold text-[#287a7e] dark:text-[#87c6bd]">{value}</span>
            </div>
          ))}
          <p className="mb-0 border-t border-[#edf0ee] pt-2 text-[10px] leading-4 text-[#89928e] dark:border-[#28343e]">更新于 {lastUpdated}</p>
        </div>
      </div>
    </aside>
  )
}

function TopicTabs({ topics, activeTopicId, onChange }) {
  const options = [{ id: 'all', title: '全部' }, ...topics]
  return (
    <div className="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-[#e0e5e2] bg-[#f1f3f1] p-1 dark:border-[#2d3942] dark:bg-[#151f27]">
      {options.map((topic) => (
        <button key={topic.id} type="button" onClick={() => onChange(topic.id)} className={`min-h-10 shrink-0 rounded-xl px-5 text-[13px] font-semibold transition ${activeTopicId === topic.id ? 'bg-white text-[#1c2b2e] shadow-sm dark:bg-[#25323d] dark:text-gray-100' : 'text-[#657275] hover:text-[#26373a] dark:text-[#91a0a9]'}`}>
          {topic.title}
        </button>
      ))}
    </div>
  )
}

function SourceFaces({ names = [], count = 0 }) {
  const palette = ['bg-[#1b555a]', 'bg-[#c86843]', 'bg-[#66734d]', 'bg-[#514d76]', 'bg-[#a77b36]']
  const visible = names.slice(0, 5)
  return (
    <div className="flex items-center">
      {visible.map((name, index) => (
        <span key={`${name}-${index}`} title={name} className={`-ml-1.5 grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[9px] font-bold text-white first:ml-0 dark:border-[#152029] ${palette[index % palette.length]}`}>
          {String(name).trim().slice(0, 1).toUpperCase()}
        </span>
      ))}
      {count > visible.length ? <span className="-ml-1 rounded-full border-2 border-white bg-[#f0f2ef] px-2 py-1 text-[10px] font-semibold text-[#657275] dark:border-[#152029] dark:bg-[#28353f] dark:text-[#b0bec5]">+{count - visible.length}</span> : null}
    </div>
  )
}

function HotRanking({ events, topics, onSelectTopic, windowLabel }) {
  const topicMap = Object.fromEntries(topics.map((topic) => [topic.id, topic.title]))
  return (
    <section id="hot" className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#dce3df] bg-white shadow-[0_1px_2px_rgba(30,55,48,0.04)] dark:border-[#2b3943] dark:bg-[#111b24]">
      <div className="flex items-center justify-between border-b border-[#eef1ef] px-5 py-4 dark:border-[#26333d]">
        <div className="flex items-center gap-2.5"><span className="h-2.5 w-2.5 rounded-full bg-[#c84d38] shadow-[0_0_0_4px_rgba(200,77,56,0.1)]" /><h2 className="mb-0 border-0 p-0 text-[15px] font-bold text-[#263438] dark:text-gray-100">当前热点</h2></div>
        <span className="inline-flex items-center gap-1 text-[12px] text-[#76817f] dark:text-[#91a0a9]">{windowLabel}榜单 <IconArrowUpRight className="h-4 w-4" aria-hidden="true" /></span>
      </div>
      <ol className="divide-y divide-[#f0f2f0] px-5 dark:divide-[#25313b]">
        {events.slice(0, 5).map((event, index) => (
          <li key={event.id} className="grid min-h-[58px] grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 py-2.5">
            <span className={`font-mono text-[16px] font-bold ${index === 0 ? 'text-[#c34733]' : index < 3 ? 'text-[#a8702d]' : 'text-[#7d898b]'}`}>{index + 1}</span>
            <div className="min-w-0">
              <button type="button" onClick={() => onSelectTopic(event.topicId)} className="block max-w-full truncate text-left text-[14px] font-semibold text-[#29363a] hover:text-[#297a80] dark:text-gray-100 dark:hover:text-[#8ac7bf]">{event.title}</button>
              <span className="text-[11px] text-[#909997] dark:text-[#7f909a]">{topicMap[event.topicId] || event.topicId} · {event.reportCount} 条证据</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block"><SourceFaces names={event.sourceNames} count={event.sourceCount} /></div>
              <div className="min-w-[62px] text-right"><span className="font-mono text-[15px] font-semibold text-[#39494c] dark:text-gray-100">{event.heat}</span><span className="ml-1 text-[11px] text-[#85918e]">热度</span></div>
              <span className={`text-[15px] ${event.trend === 'up' || event.trend === 'new' ? 'text-[#c34c38]' : 'text-[#8c9695]'}`}>{event.trend === 'up' || event.trend === 'new' ? '↗' : '—'}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function FeedCard({ post, event, connectorLabel }) {
  const sentiment = getSentimentBucket(post.sentiment)
  const riskLevel = event?.riskLevel || '低'
  return (
    <article className="group rounded-2xl border border-[#dbe2de] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(30,55,48,0.035)] transition hover:border-[#aebfba] hover:shadow-[0_6px_24px_rgba(37,63,55,0.07)] dark:border-[#2b3943] dark:bg-[#111b24] dark:hover:border-[#435661] sm:px-6 sm:py-5">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#7c8987] dark:text-[#8b9ba4]">
        <span className="inline-flex h-6 items-center rounded-full bg-[#eaf2f1] px-2.5 font-semibold text-[#36777a] dark:bg-[#193138] dark:text-[#88c2bb]">{post.platform}</span>
        <span>{connectorLabel}</span>
        <span className={`rounded-full border px-2 py-0.5 font-semibold ${SENTIMENT_STYLES[sentiment]}`}>{getSentimentLabel(post.sentiment)}</span>
        <span className="rounded-full border border-[#e6dfcc] bg-[#fbf7ec] px-2 py-0.5 font-semibold text-[#8c6c31] dark:border-[#55482c] dark:bg-[#2d281c] dark:text-[#d8b873]">{STANCE_LABELS[post.stance] || '中立'}</span>
        <span className={`ml-auto rounded-full border px-2.5 py-1 font-semibold ${RISK_STYLES[riskLevel]}`}>风险 {event?.riskScore ?? 0}</span>
      </div>
      <h3 className="mb-0 mt-3 text-[17px] font-bold leading-7 tracking-[-0.01em] text-[#243236] dark:text-gray-100 sm:text-[19px]">{post.text}</h3>
      <p className="mb-0 mt-2 text-[13px] leading-6 text-[#667476] dark:text-[#a6b3ba] sm:text-[14px]">{post.viewpoint}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#7c8987] dark:text-[#8999a3]">
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#287c80] dark:text-[#83c1ba]"><IconActivity className="h-4 w-4" aria-hidden="true" />最新研判</span>
        <span>{event?.trend === 'new' ? '新事件进入观察窗口' : event?.trend === 'up' ? '讨论仍在发酵' : '讨论强度保持稳定'}</span>
        <span>{event?.sourceCount || 1} 个独立来源</span>
        <span>{numberFormat(post.engagement)} 互动信号</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0ee] pt-3 dark:border-[#27343d]">
        <p className="mb-0 text-[12px] leading-5 text-[#6b7f80] dark:text-[#91a4ab]"><span className="font-semibold text-[#4c6465] dark:text-[#acc0c5]">研判依据：</span>{event?.riskReasons?.length ? event.riskReasons.join('、') : '当前未发现需要升级处置的集中风险信号'}</p>
        {post.url ? <a href={post.url} target="_blank" rel="noreferrer" className="no-external-arrow inline-flex shrink-0 items-center gap-1.5 text-[12px] font-semibold text-[#2b7379] no-underline hover:underline dark:text-[#8ac7bf]">查看原文 <IconExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a> : null}
      </div>
    </article>
  )
}

function TimelineFeed({ posts, events, connectors }) {
  const eventByPost = useMemo(() => {
    const map = {}
    for (const event of events) for (const postId of event.postIds || []) map[postId] = event
    return map
  }, [events])
  const connectorMap = Object.fromEntries(connectors.map((connector) => [connector.id, connector.label]))
  const ordered = [...posts].sort((a, b) => Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0))
  const header = formatDate(ordered[0]?.publishedAt)
  return (
    <section id="feed" className="scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-end gap-x-3 gap-y-1"><h2 className="mb-0 border-0 p-0 text-[24px] font-bold tracking-[-0.03em] text-[#243236] dark:text-gray-100">{header.date}</h2><span className="pb-0.5 text-[12px] text-[#7c8987] dark:text-[#8b9aa3]">{header.weekday} · {posts.length} 条</span></div>
      {ordered.length ? (
        <div className="space-y-3">
          {ordered.map((post, index) => (
            <div key={post.id} className="grid grid-cols-[48px_minmax(0,1fr)] gap-3 sm:grid-cols-[72px_minmax(0,1fr)] sm:gap-5">
              <div className="relative pt-5 text-right"><span className="font-mono text-[11px] font-semibold text-[#6e7e80] dark:text-[#8fa0a9] sm:text-[12px]">{formatClock(post.publishedAt, post.time)}</span><span className="absolute right-[-8px] top-[26px] h-2.5 w-2.5 rounded-full border-2 border-[#f7f7f3] bg-[#2b858b] dark:border-[#0d151b]" />{index < ordered.length - 1 ? <span className="absolute right-[-4px] top-9 h-[calc(100%+12px)] w-px bg-[#d8e0dc] dark:bg-[#2d3b45]" /> : null}</div>
              <FeedCard post={post} event={eventByPost[post.id]} connectorLabel={connectorMap[post.sourceId] || post.sourceId} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#ccd6d1] bg-white px-6 py-16 text-center dark:border-[#34444e] dark:bg-[#111b24]"><IconSearch className="mx-auto h-7 w-7 text-[#91a09d]" aria-hidden="true" /><p className="mb-0 mt-3 text-[13px] text-[#75817f] dark:text-[#91a0a9]">当前筛选条件下没有舆情证据。</p></div>
      )}
    </section>
  )
}

function TrendSection({ trendPoints, snapshot }) {
  const maxHeat = Math.max(...trendPoints.map((point) => point.heat), 1)
  return (
    <section id="trend" className="scroll-mt-24 rounded-2xl border border-[#dce3df] bg-white p-5 dark:border-[#2b3943] dark:bg-[#111b24]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2e7b80] dark:text-[#84c2bb]">Trend Intelligence</p><h2 className="mb-0 border-0 p-0 text-[19px] font-bold text-[#253438] dark:text-gray-100">趋势研判</h2></div>
        <div className="flex gap-5 text-[11px] text-[#778582] dark:text-[#8e9da6]"><span>正向 {snapshot.sentimentCounts.positive}</span><span>中性 {snapshot.sentimentCounts.neutral}</span><span>负向 {snapshot.sentimentCounts.negative}</span></div>
      </div>
      <div className="mt-6 flex h-36 items-end gap-2 border-b border-[#e5eae7] px-2 dark:border-[#2b3943]">
        {trendPoints.map((point) => (
          <div key={point.time} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><div className="flex h-24 items-end gap-1"><span className="w-2.5 rounded-t bg-[#2c7f83]" style={{ height: `${Math.max(10, (point.heat / maxHeat) * 90)}px` }} title={`热度 ${point.heat}`} /><span className="w-2.5 rounded-t bg-[#d0634c]" style={{ height: `${Math.max(8, point.negative)}px` }} title={`负向 ${point.negative}%`} /></div><span className="font-mono text-[9px] text-[#8a9693] sm:text-[10px]">{point.time}</span></div>
        ))}
      </div>
    </section>
  )
}

function SourceSection({ connectors, sourceCounts }) {
  return (
    <section id="sources" className="scroll-mt-24 rounded-2xl border border-[#dce3df] bg-white p-5 dark:border-[#2b3943] dark:bg-[#111b24]">
      <div className="mb-4 flex items-center gap-2"><IconShieldCheck className="h-5 w-5 text-[#2d7d82]" aria-hidden="true" /><h2 className="mb-0 border-0 p-0 text-[19px] font-bold text-[#253438] dark:text-gray-100">公开来源与采集边界</h2></div>
      <div className="grid gap-3 md:grid-cols-3">
        {connectors.map((connector) => (
          <article key={connector.id} className="rounded-xl border border-[#e3e8e5] bg-[#fafbf9] p-4 dark:border-[#2d3a44] dark:bg-[#151f28]"><div className="flex items-start justify-between gap-3"><h3 className="mb-0 text-[14px] font-bold text-[#2a383b] dark:text-gray-100">{connector.label}</h3><span className="font-mono text-[13px] font-semibold text-[#2d7d82] dark:text-[#87c3bc]">{sourceCounts[connector.id] || 0}</span></div><p className="mb-0 mt-2 text-[11px] leading-5 text-[#72807e] dark:text-[#91a0a9]">{connector.scope}</p><p className="mb-0 mt-2 text-[10px] leading-4 text-[#987242] dark:text-[#ceb17a]">{connector.compliance}</p></article>
        ))}
      </div>
    </section>
  )
}

export default function PublicOpinionClient({ topics, posts, connectors, stack, trendPoints, initialSnapshot, initialGeneratedAt }) {
  const [data, setData] = useState({ source: 'fallback', generatedAt: initialGeneratedAt, meta: { lastCollectAt: 0, lastCollectStatus: 'loading', isStale: true, hasData: false }, topics, posts, connectors, stack, trendPoints, snapshot: initialSnapshot })
  const [activeView, setActiveView] = useState('selected')
  const [activeTopicId, setActiveTopicId] = useState('all')
  const [query, setQuery] = useState('')
  const [timeWindow, setTimeWindow] = useState('48h')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')

  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    setRefreshError('')
    try {
      const response = await fetch('/api/public-opinion', { cache: 'no-store' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setData(await response.json())
    } catch (error) {
      setRefreshError(error.message || '刷新失败')
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => { refreshData() }, [refreshData])

  const timedPosts = useMemo(
    () => materializePublicOpinionPostTimes(data.posts, data.generatedAt),
    [data.generatedAt, data.posts],
  )

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const windowMs = timeWindow === '6h' ? 6 * 60 * 60 * 1000 : timeWindow === '24h' ? 24 * 60 * 60 * 1000 : 48 * 60 * 60 * 1000
    const parsedReference = Date.parse(data.generatedAt)
    const referenceTime = Number.isFinite(parsedReference) ? parsedReference : Date.now()
    const topicSearchText = Object.fromEntries(data.topics.map((topic) => [topic.id, `${topic.title} ${topic.category} ${(topic.keywords || []).join(' ')}`.toLowerCase()]))
    return timedPosts.filter((post) => {
      if (activeTopicId !== 'all' && post.topicId !== activeTopicId) return false
      if (referenceTime - Date.parse(post.publishedAt) > windowMs) return false
      if (normalizedQuery && !`${post.text} ${post.viewpoint} ${post.platform} ${topicSearchText[post.topicId] || ''}`.toLowerCase().includes(normalizedQuery)) return false
      return true
    })
  }, [activeTopicId, data.generatedAt, data.topics, query, timedPosts, timeWindow])

  const snapshot = useMemo(() => buildPublicOpinionSnapshot(filteredPosts, data.topics, data.connectors), [data.connectors, data.topics, filteredPosts])
  const lastUpdated = data.meta?.lastCollectAt ? new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(data.meta.lastCollectAt * 1000)) : '等待首次采集'
  const dataStatus = data.source === 'd1' ? (data.meta?.isStale ? '数据待更新' : data.meta?.lastCollectStatus === 'partial' ? '部分可用' : '实时运行') : '演示数据'

  return (
    <main className="min-h-screen bg-[#f7f7f3] text-[#253236] dark:bg-[#0c141a]">
      <div className="mx-auto grid w-full max-w-[1680px] lg:grid-cols-[232px_minmax(0,1fr)]">
        <WorkspaceSidebar activeView={activeView} onViewChange={setActiveView} snapshot={snapshot} connectors={data.connectors} dataStatus={dataStatus} lastUpdated={lastUpdated} />
        <div className="min-w-0 px-4 py-7 sm:px-6 lg:px-8 lg:py-9 xl:px-10">
          <header>
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div><div className="flex items-center gap-2"><IconSparkles className="h-5 w-5 text-[#2a7d82]" aria-hidden="true" /><p className="mb-0 text-[11px] font-bold uppercase tracking-[0.16em] text-[#2c7c81] dark:text-[#82c0b9]">Public Opinion Selection</p></div><h1 className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-[#223135] dark:text-gray-100 sm:text-[36px]">舆情精选</h1></div>
              <label className="flex h-12 w-full items-center gap-2 rounded-2xl border border-[#e0e5e2] bg-[#f0f2ef] px-4 xl:max-w-[330px] dark:border-[#2c3943] dark:bg-[#151f27]"><IconSearch className="h-4 w-4 shrink-0 text-[#74817f]" aria-hidden="true" /><span className="sr-only">搜索舆情</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、摘要、来源…" className="min-w-0 flex-1 bg-transparent text-[13px] text-[#29373a] outline-none placeholder:text-[#8d9795] dark:text-gray-100" /><kbd className="rounded-md border border-[#d2d9d5] bg-white px-2 py-0.5 font-mono text-[10px] text-[#87918f] dark:border-[#384651] dark:bg-[#202c35]">/</kbd></label>
            </div>
            <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <TopicTabs topics={data.topics} activeTopicId={activeTopicId} onChange={setActiveTopicId} />
              <div className="flex items-center gap-1 rounded-xl border border-[#e0e5e2] bg-white p-1 dark:border-[#2c3943] dark:bg-[#111b24]">
                {['6h', '24h', '48h'].map((value) => <button key={value} type="button" aria-pressed={timeWindow === value} onPointerDown={() => setTimeWindow(value)} onClick={() => setTimeWindow(value)} className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition ${timeWindow === value ? 'bg-[#193d43] text-white dark:bg-[#d4e6df] dark:text-[#18231f]' : 'text-[#74817f] hover:bg-[#f1f3f1] dark:text-[#93a2aa] dark:hover:bg-[#1c2831]'}`}>{value === '6h' ? '6 小时' : value === '24h' ? '24 小时' : '48 小时'}</button>)}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#71807e] dark:text-[#8d9ca5]">
              <p className="mb-0">先看研判摘要，再打开感兴趣的原始证据。<span className="ml-2 font-semibold text-[#2a7d82] dark:text-[#83c0b9]">当前 {filteredPosts.length} 条 · {snapshot.events.length} 个事件</span></p>
              <button type="button" onClick={refreshData} disabled={isRefreshing} className="inline-flex items-center gap-2 rounded-xl border border-[#d9e0dc] bg-white px-3 py-2 font-semibold text-[#536466] transition hover:border-[#9fb4ae] dark:border-[#34424c] dark:bg-[#111b24] dark:text-[#a8b7bd]">{isRefreshing ? <LoadingSpinner size="sm" /> : <IconRefresh className="h-4 w-4" aria-hidden="true" />}{isRefreshing ? '刷新中' : '刷新数据'}</button>
              {refreshError ? <span className="text-[#bf4d3a]">刷新失败：{refreshError}</span> : null}
            </div>
          </header>
          <div className="mt-6 space-y-8">
            <HotRanking events={snapshot.events} topics={data.topics} onSelectTopic={setActiveTopicId} windowLabel={timeWindow === '6h' ? '6 小时' : timeWindow === '24h' ? '24 小时' : '48 小时'} />
            <TimelineFeed posts={filteredPosts} events={snapshot.events} connectors={data.connectors} />
            <TrendSection trendPoints={data.trendPoints} snapshot={snapshot} />
            <SourceSection connectors={data.connectors} sourceCounts={snapshot.sourceCounts} />
            <section className="rounded-2xl border border-[#dce3df] bg-[#eef4f1] px-5 py-4 dark:border-[#2b3943] dark:bg-[#132229]">
              <div className="flex flex-wrap items-center gap-3"><IconBook2 className="h-5 w-5 text-[#2b7b80]" aria-hidden="true" /><p className="mb-0 flex-1 text-[12px] leading-6 text-[#5f7172] dark:text-[#9fb0b6]">研判基于公开标题、摘要、来源数量、互动信号与时间衰减计算；高风险结论需要多来源或足够热度支持，单一低热度负面内容不会直接升级。</p><span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2a777c] dark:text-[#82beb8]"><IconFilter className="h-4 w-4" />事件级去重</span><span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2a777c] dark:text-[#82beb8]"><IconClock className="h-4 w-4" />48 小时衰减</span><span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2a777c] dark:text-[#82beb8]"><IconTopologyStar3 className="h-4 w-4" />独立来源计数</span></div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

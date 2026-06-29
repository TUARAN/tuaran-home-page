'use client'

import {
  IconChartBar,
  IconDatabaseSearch,
  IconExternalLink,
  IconFilter,
  IconMessageCircle2,
  IconRefresh,
  IconScale,
  IconTopologyStar3,
} from '@tabler/icons-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  buildPublicOpinionSnapshot,
  formatPercent,
  getSentimentBucket,
  getSentimentLabel,
} from '../../../lib/publicOpinionData'

const STANCE_META = {
  support: { label: '支持', color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
  neutral: { label: '中立', color: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-300' },
  question: { label: '质疑', color: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' },
  oppose: { label: '反对', color: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300' },
}

const SENTIMENT_META = {
  positive: { label: '正向', color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
  neutral: { label: '中性', color: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-300' },
  negative: { label: '负向', color: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300' },
}

function numberFormat(value) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

function StatTile({ icon: Icon, label, value, note }) {
  return (
    <div className="border border-[#d7d9cf] bg-white p-4 dark:border-[#2b3644] dark:bg-[#111923]">
      <div className="flex items-center justify-between gap-3">
        <p className="mb-0 text-[12px] text-[#68706a] dark:text-[#98a5b6]">{label}</p>
        <Icon className="h-4 w-4 text-[#476a75] dark:text-[#9fc5ad]" aria-hidden="true" />
      </div>
      <div className="mt-3 font-mono text-[26px] font-semibold leading-none text-[#161b1a] dark:text-gray-100">
        {value}
      </div>
      <p className="mb-0 mt-2 text-[12px] leading-5 text-[#77736b] dark:text-[#8d98a8]">{note}</p>
    </div>
  )
}

function SegmentButton({ active, children, onClick, testId }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`min-h-9 border px-3 py-1.5 text-[12px] font-medium transition ${
        active
          ? 'border-[#20343c] bg-[#20343c] text-white dark:border-[#d6dbc5] dark:bg-[#d6dbc5] dark:text-[#141914]'
          : 'border-[#cfd4ca] bg-white text-[#535d59] hover:border-[#8da0a2] dark:border-[#324050] dark:bg-[#101720] dark:text-[#b8c2cf] dark:hover:border-[#536579]'
      }`}
    >
      {children}
    </button>
  )
}

function Meter({ value, color = 'bg-[#476a75]' }) {
  const width = Math.max(4, Math.min(100, value))
  return (
    <div className="h-2 w-full overflow-hidden bg-[#e8e7df] dark:bg-[#263241]" aria-hidden="true">
      <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
    </div>
  )
}

function Distribution({ title, items, total, meta }) {
  return (
    <section className="border border-[#d7d9cf] bg-white p-4 dark:border-[#2b3644] dark:bg-[#111923]">
      <h2 className="mb-4 border-0 p-0 text-[17px] font-semibold text-[#161b1a] dark:text-gray-100">{title}</h2>
      <div className="space-y-4">
        {Object.entries(items).map(([key, count]) => {
          const percent = total ? (count / total) * 100 : 0
          return (
            <div key={key}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className={`text-[13px] font-medium ${meta[key].text}`}>{meta[key].label}</span>
                <span className="font-mono text-[12px] text-[#61655d] dark:text-[#98a5b6]">
                  {count} · {formatPercent(percent)}
                </span>
              </div>
              <Meter value={percent} color={meta[key].color} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

function TrendPanel({ trendPoints }) {
  const maxHeat = Math.max(...trendPoints.map((point) => point.heat), 1)

  return (
    <section className="border border-[#d7d9cf] bg-white p-4 dark:border-[#2b3644] dark:bg-[#111923] lg:col-span-2">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[12px] text-[#69736d] dark:text-[#98a5b6]">Discussion Trend</p>
          <h2 className="mb-0 border-0 p-0 text-[18px] font-semibold text-[#161b1a] dark:text-gray-100">
            大众讨论趋势
          </h2>
        </div>
        <div className="flex flex-wrap gap-3 text-[12px] text-[#646b66] dark:text-[#98a5b6]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 bg-[#476a75]" />
            热度
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 bg-emerald-500" />
            正向
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 bg-rose-500" />
            负向
          </span>
        </div>
      </div>
      <div
        className="grid min-h-[220px] items-end gap-2 overflow-x-auto border-b border-l border-[#dfe1d6] px-2 pt-2 dark:border-[#334052]"
        style={{ gridTemplateColumns: `repeat(${trendPoints.length}, minmax(58px, 1fr))` }}
      >
        {trendPoints.map((point) => (
          <div key={point.time} className="flex h-full flex-col justify-end gap-2">
            <div className="flex h-[160px] items-end justify-center gap-1">
              <div
                className="w-3 bg-[#476a75]"
                style={{ height: `${Math.max(12, (point.heat / maxHeat) * 150)}px` }}
                title={`${point.time} 热度 ${point.heat}`}
              />
              <div
                className="w-3 bg-emerald-500"
                style={{ height: `${Math.max(12, point.positive * 1.5)}px` }}
                title={`${point.time} 正向 ${point.positive}%`}
              />
              <div
                className="w-3 bg-rose-500"
                style={{ height: `${Math.max(12, point.negative * 1.5)}px` }}
                title={`${point.time} 负向 ${point.negative}%`}
              />
            </div>
            <span className="pb-2 text-center font-mono text-[11px] text-[#70776f] dark:text-[#8d98a8]">{point.time}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function TopicTable({ topics, activeTopicId, onSelect }) {
  return (
    <section className="border border-[#d7d9cf] bg-white p-4 dark:border-[#2b3644] dark:bg-[#111923] lg:col-span-2">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[12px] text-[#69736d] dark:text-[#98a5b6]">Hot Topics</p>
          <h2 className="mb-0 border-0 p-0 text-[18px] font-semibold text-[#161b1a] dark:text-gray-100">
            自动聚合热点话题
          </h2>
        </div>
        <IconTopologyStar3 className="h-5 w-5 text-[#7b5d36] dark:text-[#d2b47d]" aria-hidden="true" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#dfe1d6] text-[12px] text-[#69736d] dark:border-[#303b4a] dark:text-[#98a5b6]">
              <th className="py-2 pr-3 font-medium">话题</th>
              <th className="py-2 pr-3 font-medium">热度</th>
              <th className="py-2 pr-3 font-medium">情绪</th>
              <th className="py-2 pr-3 font-medium">风险</th>
              <th className="py-2 pr-3 font-medium">核心关键词</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => {
              const active = activeTopicId === topic.id
              return (
                <tr
                  key={topic.id}
                  className={`border-b border-[#ecece5] transition dark:border-[#273241] ${
                    active ? 'bg-[#eef4f1] dark:bg-[#16231f]' : 'hover:bg-[#f7f8f3] dark:hover:bg-[#151d27]'
                  }`}
                >
                  <td className="py-3 pr-3">
                    <button
                      type="button"
                      onClick={() => onSelect(topic.id)}
                      className="text-left text-[14px] font-semibold text-[#17201c] hover:text-[#2f668a] dark:text-gray-100 dark:hover:text-[#9ab6d4]"
                    >
                      {topic.title}
                    </button>
                    <p className="mb-0 mt-1 text-[12px] text-[#70756d] dark:text-[#8d98a8]">{topic.category}</p>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="min-w-[110px]">
                      <div className="mb-1 font-mono text-[12px] text-[#59605b] dark:text-[#98a5b6]">{topic.heat}</div>
                      <Meter value={topic.heat} />
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`text-[13px] font-medium ${
                        SENTIMENT_META[getSentimentBucket(topic.sentiment)].text
                      }`}
                    >
                      {topic.sentimentLabel}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <span className="font-mono text-[12px] text-[#6d5f40] dark:text-[#d2b47d]">{topic.risk}</span>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex max-w-[300px] flex-wrap gap-1.5">
                      {topic.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="border border-[#d7d9cf] bg-[#f7f7f1] px-2 py-0.5 text-[12px] text-[#59605b] dark:border-[#303b4a] dark:bg-[#151d27] dark:text-[#b8c2cf]"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TopicDetail({ topic }) {
  if (!topic) return null

  return (
    <section className="border border-[#d7d9cf] bg-white p-4 dark:border-[#2b3644] dark:bg-[#111923]">
      <p className="mb-1 text-[12px] text-[#69736d] dark:text-[#98a5b6]">Selected Topic</p>
      <h2 className="mb-3 border-0 p-0 text-[18px] font-semibold text-[#161b1a] dark:text-gray-100">{topic.title}</h2>
      <p className="text-[13px] leading-6 text-[#59605b] dark:text-[#b8c2cf]">{topic.summary}</p>
      <div className="mt-4 space-y-3">
        {topic.coreViews.map((view, index) => (
          <div key={view} className="border-l-2 border-[#7b5d36] pl-3 dark:border-[#d2b47d]">
            <p className="mb-1 font-mono text-[11px] text-[#7b5d36] dark:text-[#d2b47d]">
              Viewpoint {index + 1}
            </p>
            <p className="mb-0 text-[13px] leading-6 text-[#4c544f] dark:text-[#c8d1dc]">{view}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function SourceConnectors({ connectors, sourceCounts, activeSourceId, onSelect }) {
  const max = Math.max(...Object.values(sourceCounts), 1)

  return (
    <section className="border border-[#d7d9cf] bg-white p-4 dark:border-[#2b3644] dark:bg-[#111923]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[12px] text-[#69736d] dark:text-[#98a5b6]">Public Sources</p>
          <h2 className="mb-0 border-0 p-0 text-[18px] font-semibold text-[#161b1a] dark:text-gray-100">
            公开内容采集连接器
          </h2>
        </div>
        <IconDatabaseSearch className="h-5 w-5 text-[#476a75] dark:text-[#9fc5ad]" aria-hidden="true" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {connectors.map((connector) => {
          const active = activeSourceId === connector.id
          const count = sourceCounts[connector.id] || 0
          return (
            <button
              key={connector.id}
              type="button"
              onClick={() => onSelect(active ? 'all' : connector.id)}
              data-testid={`public-opinion-source-${connector.id}`}
              className={`border p-3 text-left transition ${
                active
                  ? 'border-[#20343c] bg-[#eef4f1] dark:border-[#d6dbc5] dark:bg-[#16231f]'
                  : 'border-[#d7d9cf] bg-[#fbfbf7] hover:border-[#8da0a2] dark:border-[#303b4a] dark:bg-[#151d27] dark:hover:border-[#536579]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="mb-1 text-[15px] font-semibold text-[#17201c] dark:text-gray-100">{connector.label}</h3>
                  <p className="mb-0 text-[12px] leading-5 text-[#68706a] dark:text-[#98a5b6]">{connector.collector}</p>
                </div>
                <span className="font-mono text-[12px] text-[#476a75] dark:text-[#9fc5ad]">{count}</span>
              </div>
              <div className="mt-3">
                <Meter value={(count / max) * 100} />
              </div>
              <p className="mb-0 mt-3 text-[12px] leading-5 text-[#68706a] dark:text-[#98a5b6]">{connector.scope}</p>
              <p className="mb-0 mt-2 text-[11px] leading-5 text-[#7b5d36] dark:text-[#d2b47d]">{connector.compliance}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function PostFeed({ posts }) {
  return (
    <section className="border border-[#d7d9cf] bg-white p-4 dark:border-[#2b3644] dark:bg-[#111923] lg:col-span-2">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[12px] text-[#69736d] dark:text-[#98a5b6]">Evidence Feed</p>
          <h2 className="mb-0 border-0 p-0 text-[18px] font-semibold text-[#161b1a] dark:text-gray-100">
            样本观点与立场识别
          </h2>
        </div>
        <IconMessageCircle2 className="h-5 w-5 text-[#476a75] dark:text-[#9fc5ad]" aria-hidden="true" />
      </div>
      <div className="space-y-3">
        {posts.map((post) => {
          const sentimentKey = getSentimentBucket(post.sentiment)
          return (
            <article key={post.id} className="border border-[#e2e4da] bg-[#fbfbf7] p-3 dark:border-[#303b4a] dark:bg-[#151d27]">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px]">
                <span className="font-mono text-[#5b6762] dark:text-[#98a5b6]">{post.time}</span>
                <span className="text-[#68706a] dark:text-[#98a5b6]">{post.platform}</span>
                <span className={SENTIMENT_META[sentimentKey].text}>{getSentimentLabel(post.sentiment)}</span>
                <span className={STANCE_META[post.stance].text}>{STANCE_META[post.stance].label}</span>
                <span className="ml-auto font-mono text-[#7b5d36] dark:text-[#d2b47d]">{numberFormat(post.engagement)}</span>
              </div>
              <p className="mb-2 text-[14px] leading-6 text-[#242b28] dark:text-gray-100">{post.text}</p>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <p className="mb-0 text-[12px] leading-5 text-[#68706a] dark:text-[#98a5b6]">
                  核心观点：{post.viewpoint}
                </p>
                {post.url ? (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noreferrer"
                    className="no-external-arrow inline-flex items-center gap-1 text-[12px] font-medium text-[#2f668a] no-underline hover:underline dark:text-[#9ab6d4]"
                  >
                    查看原文
                    <IconExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function StackSection({ stack }) {
  return (
    <section className="border border-[#d7d9cf] bg-white p-4 dark:border-[#2b3644] dark:bg-[#111923]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-[12px] text-[#69736d] dark:text-[#98a5b6]">Open Source Stack</p>
          <h2 className="mb-0 border-0 p-0 text-[18px] font-semibold text-[#161b1a] dark:text-gray-100">
            对接的主流开源项目
          </h2>
        </div>
        <IconScale className="h-5 w-5 text-[#7b5d36] dark:text-[#d2b47d]" aria-hidden="true" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {stack.map((item) => (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="no-external-arrow border border-[#d7d9cf] bg-[#fbfbf7] p-3 no-underline transition hover:border-[#8da0a2] dark:border-[#303b4a] dark:bg-[#151d27] dark:hover:border-[#536579]"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h3 className="mb-1 text-[15px] font-semibold text-[#17201c] dark:text-gray-100">{item.name}</h3>
                <p className="mb-0 text-[12px] text-[#7b5d36] dark:text-[#d2b47d]">{item.type} · {item.maturity}</p>
              </div>
              <IconExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-[#476a75] dark:text-[#9fc5ad]" aria-hidden="true" />
            </div>
            <p className="mb-2 text-[12px] leading-5 text-[#68706a] dark:text-[#98a5b6]">{item.role}</p>
            <p className="mb-0 text-[12px] leading-5 text-[#4c544f] dark:text-[#c8d1dc]">{item.integration}</p>
          </a>
        ))}
      </div>
    </section>
  )
}

export default function PublicOpinionClient({
  topics,
  posts,
  connectors,
  stack,
  trendPoints,
  initialSnapshot,
  initialGeneratedAt,
}) {
  const [data, setData] = useState({
    source: 'fallback',
    generatedAt: initialGeneratedAt,
    meta: {
      lastCollectAt: 0,
      lastCollectStatus: 'loading',
      isStale: true,
      hasData: false,
    },
    topics,
    posts,
    connectors,
    stack,
    trendPoints,
    snapshot: initialSnapshot,
  })
  const [activeTopicId, setActiveTopicId] = useState('all')
  const [activeSourceId, setActiveSourceId] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')

  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    setRefreshError('')
    try {
      const response = await fetch('/api/public-opinion', { cache: 'no-store' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const nextData = await response.json()
      setData(nextData)
    } catch (error) {
      setRefreshError(error.message || '刷新失败')
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const filteredPosts = useMemo(() => {
    return data.posts.filter((post) => {
      if (activeTopicId !== 'all' && post.topicId !== activeTopicId) return false
      if (activeSourceId !== 'all' && post.sourceId !== activeSourceId) return false
      return true
    })
  }, [activeSourceId, activeTopicId, data.posts])

  const snapshot = useMemo(
    () => buildPublicOpinionSnapshot(filteredPosts, data.topics, data.connectors),
    [data.connectors, data.topics, filteredPosts],
  )
  const allTopicSnapshot = data.snapshot
  const activeTopic = snapshot.topicCards.find((topic) => topic.id === activeTopicId) || snapshot.topicCards[0]
  const averageSentimentLabel = getSentimentLabel(snapshot.averageSentiment || 0)
  const lastUpdated = data.meta?.lastCollectAt
    ? new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(data.meta.lastCollectAt * 1000))
    : '等待首次采集'
  const dataStatus =
    data.source === 'd1'
      ? data.meta?.isStale
        ? '数据已过期'
        : data.meta?.lastCollectStatus === 'partial'
          ? '部分数据源可用'
          : '定时采集中'
      : '降级数据'

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-8 sm:px-6 sm:py-10">
      <header className="border-b border-[#d7d9cf] pb-6 dark:border-[#2b3644]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase text-[#476a75] dark:text-[#9fc5ad]">
              Public Opinion Intelligence
            </p>
            <h1 className="max-w-4xl text-[28px] font-semibold leading-tight text-[#121817] dark:text-gray-100 sm:text-[36px]">
              舆情分析工作台
            </h1>
            <p className="mt-4 max-w-3xl text-[14px] leading-7 text-[#59605b] dark:text-[#b8c2cf]">
              每小时从公开新闻与开发者社区采集数据，自动完成热点聚合、情绪识别和立场分析。
              数据保留来源链接；外部数据源异常时自动降级到内置样本。
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#68706a] dark:text-[#98a5b6]">
              <span className="font-medium text-[#476a75] dark:text-[#9fc5ad]">{dataStatus}</span>
              <span>最后采集：{lastUpdated}</span>
              {refreshError ? <span className="text-rose-700 dark:text-rose-300">刷新失败：{refreshError}</span> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={refreshData}
            disabled={isRefreshing}
            className="inline-flex min-h-10 items-center justify-center gap-2 border border-[#20343c] bg-[#20343c] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#2e4c57] dark:border-[#d6dbc5] dark:bg-[#d6dbc5] dark:text-[#141914] dark:hover:bg-[#e6ead6]"
          >
            <IconRefresh className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {isRefreshing ? '刷新中' : '刷新数据'}
          </button>
        </div>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
          <section className="border border-[#d7d9cf] bg-[#fbfbf7] p-4 dark:border-[#2b3644] dark:bg-[#101720]">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[#17201c] dark:text-gray-100">
              <IconFilter className="h-4 w-4 text-[#476a75] dark:text-[#9fc5ad]" aria-hidden="true" />
              筛选视图
            </div>
            <div className="grid gap-2">
              <SegmentButton
                active={activeTopicId === 'all'}
                onClick={() => setActiveTopicId('all')}
                testId="public-opinion-topic-all"
              >
                全部话题
              </SegmentButton>
              {data.topics.map((topic) => (
                <SegmentButton
                  key={topic.id}
                  active={activeTopicId === topic.id}
                  onClick={() => setActiveTopicId(topic.id)}
                  testId={`public-opinion-topic-${topic.id}`}
                >
                  {topic.title}
                </SegmentButton>
              ))}
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <StatTile
              icon={IconDatabaseSearch}
              label="公开采集连接器"
              value={data.connectors.length}
              note={data.connectors.map((connector) => connector.label).join('、')}
            />
            <StatTile
              icon={IconTopologyStar3}
              label="热点话题"
              value={allTopicSnapshot.topicCards.length}
              note={`当前最高热度：${allTopicSnapshot.topTopic.title}`}
            />
            <StatTile
              icon={IconMessageCircle2}
              label="分析样本"
              value={numberFormat(snapshot.totalPosts)}
              note={`互动量 ${numberFormat(snapshot.totalEngagement)}`}
            />
            <StatTile
              icon={IconChartBar}
              label="综合情绪"
              value={averageSentimentLabel}
              note={`均值 ${Number.isFinite(snapshot.averageSentiment) ? snapshot.averageSentiment.toFixed(2) : '0.00'}`}
            />
          </div>
        </aside>

        <div className="min-w-0">
          <section className="grid gap-4 lg:grid-cols-3">
            <TrendPanel trendPoints={data.trendPoints} />
            <Distribution title="情绪倾向" items={snapshot.sentimentCounts} total={snapshot.totalPosts} meta={SENTIMENT_META} />
            <TopicTable topics={snapshot.topicCards} activeTopicId={activeTopicId} onSelect={setActiveTopicId} />
            <Distribution title="网民立场" items={snapshot.stanceCounts} total={snapshot.totalPosts} meta={STANCE_META} />
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-3">
            <TopicDetail topic={activeTopic} />
            <PostFeed posts={filteredPosts} />
          </section>

          <section className="mt-4">
            <SourceConnectors
              connectors={data.connectors}
              sourceCounts={snapshot.sourceCounts}
              activeSourceId={activeSourceId}
              onSelect={setActiveSourceId}
            />
          </section>

          <section className="mt-4">
            <StackSection stack={data.stack} />
          </section>
        </div>
      </div>
    </main>
  )
}

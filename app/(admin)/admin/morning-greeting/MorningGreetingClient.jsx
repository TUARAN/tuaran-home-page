'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import XImagePool from './XImagePool'
import { X_POST_SLOTS } from '../../../../lib/xPostingSchedule'
import { X_MEME_GROUPS } from '../../../../lib/xMemeAssets'
import AutomationModelSelector from './AutomationModelSelector'

import { AdminButton, AdminPage, Section, StatusPill } from '../../components/ui'

const formatUsd = (microUsd, minimumFractionDigits = 3) => `$${(Math.max(0, Number(microUsd) || 0) / 1_000_000).toLocaleString('en-US', { minimumFractionDigits, maximumFractionDigits: 3 })}`

const generationModeLabel = (mode) => ({ deepseek: 'DeepSeek Flash', ollama: 'Ollama Qwen', template: '模板库', llm: 'DeepSeek Flash' })[mode] || mode
const TIMELINE_FILTERS = [
  { id: 'all', label: '全部任务' },
  { id: 'greeting', label: '问候' },
  { id: 'community', label: '朋友交流' },

]
const STATUS_FILTERS = [
  { id: 'all', label: '全部状态' },
  { id: 'success', label: '成功' },
  { id: 'attention', label: '需处理' },
  { id: 'empty', label: '无记录' },
]

async function safeJson(response) {
  try { return await response.json() } catch { return null }
}

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(Number(value))
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('zh-CN', { hour12: false })
}

function runState(run) {
  if (!run) return { key: 'empty', label: '无记录', tone: 'neutral' }
  return run.ok
    ? { key: 'success', label: '成功', tone: 'success' }
    : { key: 'attention', label: '失败', tone: 'danger' }
}

function TimelineNode({ item }) {
  const isAttention = item.state.key === 'attention'
  return (
    <article
      className="relative min-w-0 pt-12"

      aria-label={`${item.schedule} ${item.label}${item.hasImage ? '，带图片' : ''}，${item.state.label}`}
    >
      <time className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap text-[12px] font-semibold tabular-nums text-[#4f5148] dark:text-gray-300">
        {item.schedule} ±30分钟
      </time>
      <span
        className={`absolute left-1/2 top-[25px] z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[3px] border-white ring-2 dark:border-[#10161f] ${
          item.state.key === 'success'
            ? 'bg-emerald-500 ring-emerald-200 dark:ring-emerald-900'
            : isAttention
              ? 'bg-rose-500 ring-rose-200 dark:ring-rose-900'
              : 'bg-[#b8baaf] ring-[#e2e4da] dark:bg-[#566171] dark:ring-[#293545]'
        }`}
        aria-hidden="true"
      />
      <div className={`mt-1 h-full rounded-xl border bg-white p-3 shadow-[0_8px_24px_rgba(40,42,33,0.04)] dark:bg-[#0f141d] ${isAttention ? 'border-rose-200 dark:border-rose-900' : 'border-[#e2e4da] dark:border-[#243041]'}`}>
        <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-0 flex flex-wrap items-center gap-1.5">
              <p className="m-0 text-[10px] font-medium tracking-[0.08em] text-[#96988e] dark:text-gray-500">{item.typeLabel}</p>
              {item.hasImage ? (
                <span className="inline-flex items-center rounded-full border border-violet-300 bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold tracking-normal text-violet-800 dark:border-violet-700 dark:bg-violet-950/70 dark:text-violet-200">
                  <span aria-hidden="true">🖼️</span>&nbsp;带图片
                </span>
              ) : null}
            </div>
            <h3 className="mt-0.5 truncate text-[13px] font-semibold text-[#2f302a] dark:text-gray-100" title={item.label}>{item.label}</h3>
          </div>
          <span className="shrink-0 whitespace-nowrap"><StatusPill tone={item.state.tone} size="sm">{item.state.label}</StatusPill></span>
        </div>
        <p className="mb-0 text-[11px] leading-5 text-[#7b7d73] dark:text-gray-400">
          {item.recordedAt ? `执行 ${formatTime(item.recordedAt)}` : '尚无执行记录'}
        </p>
        {item.imageUrl ? <a href={item.imageUrl} target="_blank" rel="noreferrer" aria-label={`预览${item.label}配图`} className="mt-2 block overflow-hidden rounded-lg"><img src={item.imageUrl} alt={`${item.label}配图`} loading="lazy" className="aspect-square w-full object-contain" /></a> : <p className="mb-0 mt-2 text-[11px] text-[#96988e]">{item.recordedAt ? (item.state.key === 'success' ? '纯文本' : '该次记录无配图') : '原创表情包'}</p>}
        {item.meta ? <p className="mb-0 mt-1 break-words text-[11px] leading-5 text-[#7b7d73] dark:text-gray-400">{item.meta}</p> : null}
        {item.costMicroUsd ? <p className="mb-0 mt-1 text-[11px] font-medium tabular-nums text-[#5f6257] dark:text-gray-300">X API {formatUsd(item.costMicroUsd)} / 次</p> : null}
        {item.link ? <a href={item.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-[11px] font-medium text-sky-700 hover:underline dark:text-sky-300">查看 X 内容 ↗</a> : null}
        {item.detail ? <p className={`mb-0 mt-2 break-words text-[11px] leading-5 ${isAttention ? 'text-rose-600 dark:text-rose-300' : 'text-[#77796e] dark:text-gray-400'}`}>{item.detail}</p> : null}
      </div>
    </article>
  )
}

function TaskTimeline({ lastRuns, communityRuns }) {
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const items = useMemo(() => {
    const labels = { morning: '☀️ 早安问候', noon: '🍚 午安问候', community_friends: '👋 认识新朋友', community_learning: '💙 蓝 V 交流', community_growth: '🐱 互关串门' }
    return X_POST_SLOTS.map((slot) => {
      const run = slot.query === 'period' ? lastRuns[slot.id] : communityRuns[slot.id]
      return {
        id: slot.id, label: labels[slot.id], schedule: slot.time,
        type: slot.query === 'period' ? 'greeting' : 'community',
        typeLabel: slot.query === 'period' ? '早午安' : '朋友交流',
        hasImage: Boolean(run?.imagePath), imageUrl: run?.imagePath || '',
        state: runState(run), recordedAt: run?.at,
        meta: [run?.theme, run?.styleLabel, run?.model].filter(Boolean).join(' · '),
        link: run?.postUrl, detail: run?.error, costMicroUsd: run?.xApiCostMicroUsd,
      }
    }).sort((a, b) => a.schedule.localeCompare(b.schedule))
  }, [communityRuns, lastRuns])

  const visibleItems = items.filter((item) => (
    (typeFilter === 'all' || item.type === typeFilter)
    && (statusFilter === 'all' || item.state.key === statusFilter)
  ))

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 border-b border-[#eceee5] pb-4 dark:border-[#202b39] xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-1.5" aria-label="按任务类型筛选">
          {TIMELINE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={typeFilter === filter.id}
              onClick={() => setTypeFilter(filter.id)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${typeFilter === filter.id ? 'border-[#303229] bg-[#303229] text-white dark:border-gray-200 dark:bg-gray-100 dark:text-[#111827]' : 'border-[#d8dad0] bg-white text-[#66685e] hover:border-[#9a9d90] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-400'}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="timeline-status-filter" className="text-[12px] text-[#7b7d73] dark:text-gray-400">执行状态</label>
          <select
            id="timeline-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-8 rounded-lg border border-[#d8dad0] bg-white px-2.5 text-[12px] text-[#4f5148] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300"
          >
            {STATUS_FILTERS.map((filter) => <option key={filter.id} value={filter.id}>{filter.label}</option>)}
          </select>
          <span className="whitespace-nowrap text-[11px] tabular-nums text-[#96988e]">{visibleItems.length} / {items.length} 个节点</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2" aria-label="每日自动发布横向时间轴">
        <div className="relative grid min-w-[1100px] grid-cols-5 gap-3 px-2 pb-1">
          <div className="absolute left-2 right-2 top-[31px] h-px bg-[#d8dad0] dark:bg-[#354052]" aria-hidden="true" />
          {visibleItems.map((item) => <TimelineNode key={item.id} item={item} />)}
          {!visibleItems.length ? (
            <div className="col-span-5 mt-12 rounded-xl border border-dashed border-[#d8dad0] px-4 py-8 text-center text-sm text-[#77796e] dark:border-[#2d3744] dark:text-gray-400">
              当前筛选下没有任务节点。
            </div>
          ) : null}
        </div>
      </div>
      <p className="mb-0 mt-2 text-[11px] leading-5 text-[#96988e] dark:text-gray-500">横轴为北京时间基准节点，每天在前后 30 分钟内随机安排；每 5 分钟检查到期任务，调度延迟或失败补跑可能更晚。卡片展示最近一次执行记录。</p>
    </div>
  )
}

function XApiCostPanel({ cost }) {
  if (!cost) return null
  const metrics = [
    { label: '今日已发生', value: formatUsd(cost.todayMicroUsd), detail: `${cost.todayPosts || 0} 次成功发布` },
    { label: '本月已发生', value: formatUsd(cost.monthMicroUsd), detail: `${cost.monthPosts || 0} 次成功发布` },
    { label: '30 天预计', value: formatUsd(cost.projected30DayMicroUsd, 2), detail: `${cost.projected30DayPosts || 300} 次发帖` },
  ]
  return (
    <section className="rounded-xl border border-[#e2e4da] bg-[#fbfbf8] p-4 dark:border-[#243041] dark:bg-[#0f141d]" aria-labelledby="x-api-cost-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="x-api-cost-title" className="m-0 text-[13px] font-semibold text-[#34352f] dark:text-gray-100">X API 成本</h3>
          <p className="mb-0 mt-1 text-[11px] leading-5 text-[#85877c]">成功发帖后自动入账；重复回调按 Post ID 去重。</p>
        </div>
        <a href={cost.pricingSourceUrl} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-sky-700 hover:underline dark:text-sky-300">查看 X 官方价格 ↗</a>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-[#e5e7de] bg-white px-3 py-2.5 dark:border-[#293545] dark:bg-[#10161f]">
            <p className="m-0 text-[10px] text-[#85877c] dark:text-gray-500">{metric.label}</p>
            <p className="mb-0 mt-1 text-lg font-semibold tabular-nums text-[#2f302a] dark:text-gray-100">{metric.value}</p>
            <p className="mb-0 mt-0.5 text-[10px] text-[#96988e] dark:text-gray-500">{metric.detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] leading-5 text-[#6f7167] dark:text-gray-400">
        <span>纯文本 {formatUsd(cost.postCreateMicroUsd)} / 次</span>
        <span>含 URL {formatUsd(cost.postCreateWithUrlMicroUsd, 3)} / 次</span>
        <span>价格核对于 {cost.pricingCheckedAt}</span>
      </div>
      <p className="mb-0 mt-1 text-[10px] leading-5 text-[#96988e] dark:text-gray-500">
        仅统计 X 发帖接口，不含图片生成、图片上传、R2 存储和 DeepSeek 文案及提示词生成成本；30 天预计按每天 {X_POST_SLOTS.length} 条且不含 URL 计算。实际扣费以 X Developer Console 为准。
      </p>
      {!cost.available ? <p className="mb-0 mt-1 text-[10px] text-amber-700 dark:text-amber-300">成本流水表尚未启用；部署数据库迁移后开始累计实际金额。</p> : null}
    </section>
  )
}

export default function MorningGreetingClient() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/morning-greeting', { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.message || payload?.detail || payload?.error || `HTTP_${response.status}`)
      setData(payload)
    } catch (fetchError) {
      setError(fetchError?.message || 'X 发布配置读取失败。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const lastRuns = data?.lastRuns || {}
  const communityRuns = data?.communityRuns || {}

  async function togglePause() {
    setSaving(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/admin/morning-greeting', {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: data?.paused ? 'resume' : 'pause' }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
      setNotice(data?.paused ? '已恢复全部自动任务。' : '已暂停，所有自动发布都不会执行。')
      await refresh()
    } catch (pauseError) { setError(pauseError?.message || '状态切换失败。') } finally { setSaving(false) }
  }

  return (
    <AdminPage
      title="X 发布任务"
      description="每日 5 条：早午安、互关交友与蓝 V 交流。"
      actions={<AdminButton type="button" onClick={() => refresh()} disabled={loading}>{loading ? '刷新中…' : '刷新'}</AdminButton>}
    >
      {error ? <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}
      {notice ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div> : null}

      <AutomationModelSelector />

      <Section
          title="自动任务"
          description="每天 5 条：08:00 早安、09:30 交朋友、12:00 午安、15:00 蓝 V 交流、19:00 互关串门。各时段前后 30 分钟浮动，短文案搭配 emoji，图文和纯文本各 50% 概率，图文使用对应主题的原创表情包。加密观点、文化短故事、美区英文已暂停。"
          className="mb-4"
          actions={
            <>
              <StatusPill tone={!data ? 'neutral' : data.paused ? 'warning' : 'success'} size="sm">{!data ? '状态未读取' : data.paused ? '已暂停' : '运行中'}</StatusPill>
              <AdminButton type="button" onClick={togglePause} disabled={saving || loading || !data} variant={data?.paused ? 'primary' : 'ghost'}>{data?.paused ? '恢复运行' : '暂停自动化'}</AdminButton>
            </>
          }
        >
        <div className="space-y-4">
          <TaskTimeline lastRuns={lastRuns} communityRuns={communityRuns} />
          <Section title="表情包模板 · 5 组 15 张" description="每组包含早安、午安、交友各 1 张。按日期和时段轮换风格，重试保留已选图片。">
            <div className="space-y-5">
              {X_MEME_GROUPS.map((group) => (
                <section key={group.id} aria-label={group.label}>
                  <h3 className="mb-2 text-sm font-semibold">{group.label}<span className="ml-2 text-xs font-normal text-gray-500">3 张</span></h3>
                  <div className="grid grid-cols-3 gap-3">
                    {group.assets.map((meme) => <figure key={meme.id} className="m-0"><a href={meme.path} target="_blank" rel="noreferrer" aria-label={`预览${meme.label}`}><img src={meme.path} alt={meme.label} loading="lazy" className="aspect-square w-full rounded-xl object-contain" /></a><figcaption className="mt-2 text-center text-xs">{meme.label}</figcaption></figure>)}
                  </div>
                </section>
              ))}
            </div>
          </Section>
          <details><summary className="cursor-pointer text-sm">历史素材库</summary><XImagePool /></details>
          <XApiCostPanel cost={data?.xApiCost} />
        </div>
        </Section>
    </AdminPage>
  )
}

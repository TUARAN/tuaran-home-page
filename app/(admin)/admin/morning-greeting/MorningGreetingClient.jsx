'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import XImagePool from './XImagePool'

import { AdminButton, AdminPage, Section, StatusPill } from '../../components/ui'
import ModelSelector from '../../components/ModelSelector'

const formatUsd = (microUsd, minimumFractionDigits = 3) => `$${(Math.max(0, Number(microUsd) || 0) / 1_000_000).toLocaleString('en-US', { minimumFractionDigits, maximumFractionDigits: 3 })}`

const CULTURE_STORY_SLOTS = [
  { id: 'culture_morning', label: '上午短故事', time: '10:00' },
  { id: 'culture_evening', label: '晚间短故事', time: '20:00' },
]
const COMMUNITY_POST_SLOTS = [
  { id: 'community_friends', label: '认识新朋友', time: '09:00' },
  { id: 'community_learning', label: '寻找同好', time: '15:00' },
]
const US_AUDIENCE_SLOTS = [
  { id: 'us_morning', label: 'US morning', time: '23:00' },
  { id: 'us_midday', label: 'US midday', time: '次日 03:00' },
  { id: 'us_evening', label: 'US afternoon', time: '次日 07:00' },
]
const CRYPTO_POST_SLOTS = [
  { id: 'crypto_knowledge', label: '加密知识', time: '11:00' },
  { id: 'crypto_market', label: '币与走势观点', time: '17:00' },
]
const CULTURE_CATEGORY_LABELS = {
  guoxue: '国学哲思',
  chinese_story: '中华寓言 / 历史',
  foreign_fable: '国外童话 / 寓言',
}
const inputClass = 'w-full rounded-lg border border-[#d8dad0] bg-white px-3 py-2 text-[13px] leading-5 text-[#3f4039] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#0f141d] dark:text-gray-200'
const generationModeLabel = (mode) => ({ deepseek: 'DeepSeek Flash', ollama: 'Ollama Qwen', template: '模板库', llm: 'DeepSeek Flash' })[mode] || mode
const fieldClass = 'mb-3 flex flex-col gap-1 text-[12px] font-semibold text-[#34352f] dark:text-gray-200'
const TIMELINE_FILTERS = [
  { id: 'all', label: '全部任务' },
  { id: 'greeting', label: '问候' },
  { id: 'community', label: '朋友交流' },
  { id: 'culture', label: '文化短故事' },
  { id: 'crypto', label: '加密观点' },
  { id: 'us', label: '美区英文' },
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

function Field({ label, className = '', children }) {
  return <label className={`${fieldClass} ${className}`.trim()}>{label}{children}</label>
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
      style={{ gridColumn: `${item.column} / span 1` }}
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
          <StatusPill tone={item.state.tone} size="sm">{item.state.label}</StatusPill>
        </div>
        <p className="mb-0 text-[11px] leading-5 text-[#7b7d73] dark:text-gray-400">
          {item.recordedAt ? `执行 ${formatTime(item.recordedAt)}` : '尚无执行记录'}
        </p>
        {item.imageUrl ? <a href={item.imageUrl} target="_blank" rel="noreferrer" aria-label={`预览${item.label}配图`} className="mt-2 block overflow-hidden rounded-lg"><img src={item.imageUrl} alt={`${item.label}配图`} loading="lazy" className="aspect-[4/3] w-full object-cover" /></a> : <p className="mb-0 mt-2 text-[11px] text-[#96988e]">{item.recordedAt ? (item.state.key === 'success' ? '纯文本' : '该次记录无配图') : '图文 / 纯文本随机'}</p>}
        {item.meta ? <p className="mb-0 mt-1 break-words text-[11px] leading-5 text-[#7b7d73] dark:text-gray-400">{item.meta}</p> : null}
        {item.costMicroUsd ? <p className="mb-0 mt-1 text-[11px] font-medium tabular-nums text-[#5f6257] dark:text-gray-300">X API {formatUsd(item.costMicroUsd)} / 次</p> : null}
        {item.link ? <a href={item.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-[11px] font-medium text-sky-700 hover:underline dark:text-sky-300">查看 X 内容 ↗</a> : null}
        {item.detail ? <p className={`mb-0 mt-2 break-words text-[11px] leading-5 ${isAttention ? 'text-rose-600 dark:text-rose-300' : 'text-[#77796e] dark:text-gray-400'}`}>{item.detail}</p> : null}
      </div>
    </article>
  )
}

function TaskTimeline({ lastRuns, cultureRuns, communityRuns, cryptoRuns, usRuns }) {
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const items = useMemo(() => {
    const greetingItems = [
      { id: 'morning', label: '早安', schedule: '08:00', column: 1 },
    ].map((item) => {
      const run = lastRuns[item.id]
      return {
        ...item,
        type: 'greeting',
        typeLabel: '问候',
        hasImage: Boolean(run?.imagePath),
        imageUrl: run?.imagePath || '',
        state: runState(run),
        recordedAt: run?.at,
        meta: [run?.mode && generationModeLabel(run.mode), run?.styleLabel, run?.model].filter(Boolean).join(' · '),
        link: run?.postUrl,
        detail: run?.error,
        costMicroUsd: run?.xApiCostMicroUsd,
      }
    })
    const cultureItems = CULTURE_STORY_SLOTS.map((item, index) => {
      const run = cultureRuns[item.id]
      return {
        ...item,
        schedule: item.time,
        column: [3, 7][index],
        type: 'culture',
        typeLabel: '文化短故事',
        hasImage: Boolean(run?.imagePath),
        imageUrl: run?.imagePath || '',
        state: runState(run),
        recordedAt: run?.at,
        meta: run?.category ? CULTURE_CATEGORY_LABELS[run.category] || run.category : '',
        link: run?.postUrl,
        detail: run?.error,
        costMicroUsd: run?.xApiCostMicroUsd,
      }
    })
    const communityItems = COMMUNITY_POST_SLOTS.map((item, index) => {
      const run = communityRuns[item.id]
      return {
        ...item,
        schedule: item.time,
        column: [2, 5][index],
        type: 'community',
        typeLabel: '朋友交流',
        hasImage: Boolean(run?.imagePath),
        imageUrl: run?.imagePath || '',
        state: runState(run),
        recordedAt: run?.at,
        meta: [run?.theme, run?.mode && generationModeLabel(run.mode), run?.model].filter(Boolean).join(' · '),
        link: run?.postUrl,
        detail: run?.error,
        costMicroUsd: run?.xApiCostMicroUsd,
      }
    })
    const cryptoItems = CRYPTO_POST_SLOTS.map((item, index) => {
      const run = cryptoRuns[item.id]
      return {
        ...item,
        schedule: item.time,
        column: [4, 6][index],
        type: 'crypto',
        typeLabel: '加密观点',
        hasImage: Boolean(run?.imagePath),
        imageUrl: run?.imagePath || '',
        state: runState(run),
        recordedAt: run?.at,
        meta: [run?.topic, run?.mode && generationModeLabel(run.mode), run?.model].filter(Boolean).join(' · '),
        link: run?.postUrl,
        detail: run?.error,
        costMicroUsd: run?.xApiCostMicroUsd,
      }
    })
    const usItems = US_AUDIENCE_SLOTS.map((item, index) => {
      const run = usRuns[item.id]
      return {
        ...item,
        schedule: item.time,
        column: [8, 9, 10][index],
        type: 'us',
        typeLabel: '美区英文',
        hasImage: Boolean(run?.imagePath),
        imageUrl: run?.imagePath || '',
        state: runState(run),
        recordedAt: run?.at,
        meta: [run?.mode && generationModeLabel(run.mode), run?.model].filter(Boolean).join(' · '),
        link: run?.postUrl,
        detail: run?.error,
        costMicroUsd: run?.xApiCostMicroUsd,
      }
    })
    return [...greetingItems, ...communityItems, ...cultureItems, ...cryptoItems, ...usItems].sort((a, b) => a.column - b.column)
  }, [communityRuns, cryptoRuns, cultureRuns, lastRuns, usRuns])

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
        <div className="relative grid min-w-[1800px] grid-cols-10 gap-3 px-2 pb-1">
          <div className="absolute left-2 right-2 top-[31px] h-px bg-[#d8dad0] dark:bg-[#354052]" aria-hidden="true" />
          {visibleItems.map((item) => <TimelineNode key={item.id} item={item} />)}
          {!visibleItems.length ? (
            <div className="col-span-10 mt-12 rounded-xl border border-dashed border-[#d8dad0] px-4 py-8 text-center text-sm text-[#77796e] dark:border-[#2d3744] dark:text-gray-400">
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
        仅统计 X 发帖接口，不含图片生成、图片上传、R2 存储和 DeepSeek 文案及提示词生成成本；30 天预计按每天 10 条且不含 URL 计算。实际扣费以 X Developer Console 为准。
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
  const [selectedModelIds, setSelectedModelIds] = useState(['deepseek'])
  const [llmIntent, setLlmIntent] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/morning-greeting', { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.message || payload?.detail || payload?.error || `HTTP_${response.status}`)
      setData(payload)
      setSelectedModelIds(payload.selectedModelIds?.length ? payload.selectedModelIds : ['deepseek'])
      setLlmIntent(payload.llmIntent || '')
    } catch (fetchError) {
      setError(fetchError?.message || 'X 发布配置读取失败。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const lastRuns = data?.lastRuns || {}
  const cultureRuns = data?.cultureRuns || {}
  const communityRuns = data?.communityRuns || {}
  const cryptoRuns = data?.cryptoRuns || {}
  const usRuns = data?.usRuns || {}

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

  async function saveGenerationSettings() {
    if (!selectedModelIds.length || selectedModelIds.length > 2) return setError('请选择 1—2 个模型。')
    if (!llmIntent.trim()) return setError('生成意图不能为空。')
    setSaving(true); setError(''); setNotice('')
    try {
      const response = await fetch('/api/admin/morning-greeting', {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'save-generation', modelIds: selectedModelIds, intent: llmIntent }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setNotice(`已应用 ${selectedModelIds.length} 个模型；下一次自动发布开始按新配置生成。`)
      await refresh()
    } catch (saveError) { setError(saveError?.message || '生成方式保存失败。') } finally { setSaving(false) }
  }

  const appliedModelIds = data?.selectedModelIds || ['deepseek']
  const isGenerationDirty = JSON.stringify(selectedModelIds) !== JSON.stringify(appliedModelIds)
    || llmIntent !== (data?.llmIntent || '')
  const modelOptions = [
    { id: 'deepseek', label: 'DeepSeek', hint: 'Flash · 线上 API' },
    ...(data?.ollamaProviders || []).map((provider) => ({
      id: `ollama:${provider.id}`,
      label: provider.model || 'Ollama',
      hint: `${provider.name} · Ollama`,
    })),
  ]
  const appliedModelLabel = modelOptions
    .filter((option) => appliedModelIds.includes(option.id))
    .map((option) => option.label)
    .join(' + ') || 'DeepSeek'

  return (
    <AdminPage
      title="X 发布任务"
      description="管理每日问候、朋友交流、文化短故事、加密观点和美区英文帖的全自动发布。"
      actions={<AdminButton type="button" onClick={() => refresh()} disabled={loading}>{loading ? '刷新中…' : '刷新'}</AdminButton>}
    >
      {error ? <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}
      {notice ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div> : null}

      <Section
          title="自动任务"
          description="每天全自动发布 10 条：一条晨间问候、两条朋友交流、两条文化短故事、两条加密观点和三条美区英文帖。每条用鲜明判断开场，以具体问题收尾；各时段前后 30 分钟随机浮动，图文和纯文本各 50% 概率；图文统一使用固定模板池，直接发布，不经人工审核。"
          className="mb-4"
          actions={
            <>
              <StatusPill tone={!data ? 'neutral' : data.paused ? 'warning' : 'success'} size="sm">{!data ? '状态未读取' : data.paused ? '已暂停' : '运行中'}</StatusPill>
              <AdminButton type="button" onClick={togglePause} disabled={saving || loading || !data} variant={data?.paused ? 'primary' : 'ghost'}>{data?.paused ? '恢复运行' : '暂停自动化'}</AdminButton>
            </>
          }
        >
        <div className="space-y-4">
          <TaskTimeline lastRuns={lastRuns} cultureRuns={cultureRuns} communityRuns={communityRuns} cryptoRuns={cryptoRuns} usRuns={usRuns} />
          <XImagePool />
          <XApiCostPanel cost={data?.xApiCost} />

          <div className="rounded-xl border border-[#e2e4da] bg-[#fbfbf8] p-4 dark:border-[#243041] dark:bg-[#0f141d]">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-[#85877c]">当前生效：{appliedModelLabel}</span>
              {isGenerationDirty ? <span className="text-[11px] text-amber-700 dark:text-amber-300">选择尚未生效，保存后用于下一次自动发布</span> : null}
            </div>
            <ModelSelector options={modelOptions} value={selectedModelIds} onChange={setSelectedModelIds} max={2} disabled={saving || loading} />
            <div className="mt-4 border-t border-[#e2e4da] pt-4 dark:border-[#243041]">
              <Field className="mb-0" label="意图（提示语）"><textarea value={llmIntent} onChange={(event) => setLlmIntent(event.target.value)} rows={4} maxLength={4000} placeholder="告诉模型希望写出什么样的问候文案" className={inputClass} /></Field>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="m-0 flex-1 text-[11px] leading-5 text-[#85877c]">每次从五种写作方向中选择一种，再由已选模型结合日期、时段和内容意图生成。</p>
                <AdminButton type="button" variant="primary" disabled={saving || loading || !isGenerationDirty || !llmIntent.trim() || !selectedModelIds.length} onClick={saveGenerationSettings}>{saving ? '保存中…' : isGenerationDirty ? '保存并应用' : '已应用'}</AdminButton>
              </div>
            </div>
          </div>
        </div>
        </Section>
    </AdminPage>
  )
}

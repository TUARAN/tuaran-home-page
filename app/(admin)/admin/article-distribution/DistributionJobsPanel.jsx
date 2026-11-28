'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { IconAlertTriangle, IconClipboard, IconExternalLink, IconRefresh, IconX } from '@tabler/icons-react'

import { RESULT_STATUS_LABELS } from '../../../../lib/distribution/harness'
import { DISTRIBUTION_PLATFORMS, distributionPlatformShortLabel } from '../../../../lib/distribution/platforms'
import { buildDistributionClaimPrompt } from '../../../../lib/distribution/taskPrompt'
import { copyPlainText } from '../../../../lib/content/contentClipboard'
import AdminButton from '../../components/ui/AdminButton'
import DataTable from '../../components/ui/DataTable'
import Section from '../../components/ui/Section'
import StatusPill from '../../components/ui/StatusPill'
import Toolbar from '../../components/ui/Toolbar'

const JOB_STATUS = {
  pending: { label: '待领取', tone: 'neutral' },
  claimed: { label: '执行中', tone: 'info' },
  done: { label: '完成', tone: 'success' },
  partial: { label: '部分完成', tone: 'warning' },
  failed: { label: '失败', tone: 'danger' },
  cancelled: { label: '已取消', tone: 'neutral' },
}

// 行内最多显示的平台数，其余折叠为 +N，全部结果在悬停提示和详情弹窗里。
const MAX_ROW_PLATFORMS = 3

const RESULT_TONES = { published: 'success', reviewing: 'info', draft: 'warning', failed: 'danger', skipped: 'neutral' }

const controlClass = 'h-8 rounded-md border border-[#d8dad0] bg-white px-2 text-[12px] text-[#3f4039] outline-none focus:border-[#818472] dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-200'

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function hasText(value) {
  return Boolean(value && value.trim() && value.trim() !== '无')
}

function isActive(job) {
  return job.status === 'pending' || job.status === 'claimed'
}

function resultLabel(result) {
  return result ? RESULT_STATUS_LABELS[result.status] || result.status : '未回报'
}

function deviationCount(job) {
  return job.results.filter((result) => hasText(result.playbookDeviation)).length
}

function PlatformResultPill({ platformId, result, withLink = true, compact = false }) {
  const name = distributionPlatformShortLabel(platformId)
  const pill = (
    <StatusPill tone={result ? RESULT_TONES[result.status] : 'neutral'} size="sm" icon={false}>
      {compact ? name : `${name}：${resultLabel(result)}`}
    </StatusPill>
  )
  if (withLink && result?.articleUrl && /^https?:\/\//.test(result.articleUrl)) {
    return <a href={result.articleUrl} target="_blank" rel="noreferrer" title={result.articleUrl}>{pill}</a>
  }
  return pill
}

function JobDetailDialog({ job, busy, onClose, onAct }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const status = JOB_STATUS[job.status] || JOB_STATUS.pending
  const results = new Map(job.results.map((result) => [result.platformId, result]))
  const meta = [
    ['创建', formatTime(job.createdAt)],
    ['领取', formatTime(job.claimedAt)],
    ['结束', formatTime(job.finishedAt)],
    ['harness', job.harnessVersion],
    ['领取指令有效期', isActive(job) && job.tokenExpiresAt ? `${formatTime(job.tokenExpiresAt)} 前` : ''],
    ['内容键', job.contentKey],
  ].filter(([, value]) => value)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-4" role="presentation" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="distribution-job-title"
        className="flex max-h-[min(100dvh-1.5rem,calc(100vh-2rem))] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[#d8dad0] bg-white shadow-2xl dark:border-[#2d3744] dark:bg-[#10161f]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[#e2e3da] px-5 py-4 dark:border-[#1e2733]">
          <div className="min-w-0">
            <h3 id="distribution-job-title" className="m-0 text-base font-semibold leading-6 text-[#15140f] dark:text-gray-100">{job.title}</h3>
            <a href={job.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 text-[12px] text-[#67695d] hover:underline dark:text-gray-400">
              <span className="truncate">{job.url}</span>
              <IconExternalLink size={13} className="shrink-0" aria-hidden="true" />
            </a>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusPill tone={status.tone} size="sm">{status.label}</StatusPill>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="rounded-md border border-[#d8dad0] p-1 text-[#53554d] hover:border-[#818472] dark:border-[#2d3744] dark:text-gray-300"
            >
              <IconX size={15} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 text-[13px] leading-6 text-[#3f4039] dark:text-gray-200">
          <dl className="m-0 grid grid-cols-1 gap-x-4 gap-y-1 min-[480px]:grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto_1fr]">
            {meta.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="whitespace-nowrap text-[#82847a] dark:text-gray-500">{label}</dt>
                <dd className="m-0 min-w-0 truncate" title={value}>{value}</dd>
              </div>
            ))}
          </dl>

          {job.summary ? <p className="m-0 text-[#53554d] dark:text-gray-300">{job.summary}</p> : null}
          {job.tags?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {job.tags.map((tag) => (
                <span key={tag} className="rounded border border-[#e1e2d9] px-1.5 text-[11px] text-[#67695d] dark:border-[#263142] dark:text-gray-400">{tag}</span>
              ))}
            </div>
          ) : null}

          <div className="space-y-3">
            {job.platformIds.map((platformId) => {
              const result = results.get(platformId)
              return (
                <article key={platformId} className="rounded-lg border border-[#e1e2d9] p-3 dark:border-[#263142]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <PlatformResultPill platformId={platformId} result={result} withLink={false} />
                    <span className="text-[11px] text-[#82847a] dark:text-gray-500">{result?.reportedAt ? `${formatTime(result.reportedAt)} 回报` : ''}</span>
                  </div>
                  {result?.articleUrl ? (
                    /^https?:\/\//.test(result.articleUrl) ? (
                      <a href={result.articleUrl} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 text-[12px] text-blue-700 hover:underline dark:text-blue-300">
                        <span className="truncate">{result.articleUrl}</span>
                        <IconExternalLink size={13} className="shrink-0" aria-hidden="true" />
                      </a>
                    ) : (
                      <p className="m-0 mt-2 truncate text-[12px] text-[#67695d] dark:text-gray-400">文章 ID：{result.articleUrl}</p>
                    )
                  ) : null}
                  {hasText(result?.notes) ? (
                    <div className="mt-2">
                      <p className="m-0 text-[11px] font-medium text-[#82847a] dark:text-gray-500">问题与处理</p>
                      <p className="m-0 whitespace-pre-wrap break-words">{result.notes}</p>
                    </div>
                  ) : null}
                  {hasText(result?.playbookDeviation) ? (
                    <div className="mt-2 rounded-md bg-amber-50 px-2.5 py-1.5 dark:bg-amber-950/30">
                      <p className="m-0 text-[11px] font-medium text-amber-700 dark:text-amber-300">手册偏差</p>
                      <p className="m-0 whitespace-pre-wrap break-words text-amber-800 dark:text-amber-200">{result.playbookDeviation}</p>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        </div>

        {isActive(job) ? (
          <footer className="flex flex-col-reverse gap-2 border-t border-[#e2e3da] px-4 py-3 sm:flex-row sm:justify-end sm:px-5 dark:border-[#1e2733]">
            <AdminButton type="button" size="sm" variant="ghost" className="w-full sm:w-auto" onClick={() => onAct(job, 'cancel')} disabled={busy}>
              <IconX size={15} /> 取消任务
            </AdminButton>
            <AdminButton type="button" size="sm" className="w-full sm:w-auto max-sm:whitespace-normal" onClick={() => onAct(job, 'reissue')} disabled={busy}>
              <IconClipboard size={15} /> 复制领取指令
            </AdminButton>
          </footer>
        ) : null}
      </section>
    </div>
  )
}

// 智能体任务台：本页「分发智能体」建的任务，以及智能体逐平台回报的结果。
// 每个任务一行，可按状态、平台、关键词筛选；回报全文在详情弹窗里看。
export default function DistributionJobsPanel() {
  const [jobs, setJobs] = useState([])
  const [state, setState] = useState({ loading: true, error: '', notice: '' })
  const [busyId, setBusyId] = useState('')
  const [filters, setFilters] = useState({ status: '', platform: '', query: '' })
  const [detailId, setDetailId] = useState('')

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }))
    try {
      const response = await fetch('/api/admin/distribution-jobs', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error === 'MIGRATION_REQUIRED' ? '任务表未建：请在 Cloudflare 执行迁移 0139_distribution_agent_jobs.sql。' : data.error || `HTTP ${response.status}`)
      setJobs(data.jobs || [])
      setState({ loading: false, error: '', notice: '' })
    } catch (error) {
      setState({ loading: false, error: error.message, notice: '' })
    }
  }, [])

  useEffect(() => { load() }, [load])

  const platformOptions = useMemo(() => {
    const used = new Set(jobs.flatMap((job) => job.platformIds))
    return DISTRIBUTION_PLATFORMS.filter((platform) => used.has(platform.id))
  }, [jobs])

  const visibleJobs = useMemo(() => {
    const query = filters.query.trim().toLowerCase()
    return jobs.filter((job) => {
      if (filters.status && job.status !== filters.status) return false
      if (filters.platform && !job.platformIds.includes(filters.platform)) return false
      if (query && !`${job.title} ${job.url} ${(job.tags || []).join(' ')}`.toLowerCase().includes(query)) return false
      return true
    })
  }, [jobs, filters])

  const detailJob = jobs.find((job) => job.id === detailId) || null
  const closeDetail = useCallback(() => setDetailId(''), [])

  async function act(job, action) {
    if (action === 'cancel' && !window.confirm(`取消任务「${job.title}」？已发出的领取指令随之失效。`)) return
    setBusyId(job.id)
    try {
      const response = await fetch('/api/admin/distribution-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id: job.id }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
      let notice = '任务已取消。'
      if (action === 'reissue') {
        const copied = await copyPlainText(buildDistributionClaimPrompt({ jobId: job.id, token: data.token, title: job.title }))
        notice = copied ? '已复制新的领取指令，旧指令作废。' : '新 token 已签发，但复制失败，请重试。'
      }
      await load()
      setState((current) => ({ ...current, notice }))
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    } finally {
      setBusyId('')
    }
  }

  function setFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const columns = [
    {
      key: 'title',
      header: '文章',
      render: (job) => {
        const count = deviationCount(job)
        return (
          <div className="min-w-0">
            <a href={job.url} target="_blank" rel="noreferrer" title={job.title} className="block truncate font-medium text-[#15140f] hover:underline dark:text-gray-100">
              {job.title}
            </a>
            <p className="m-0 mt-0.5 flex items-center gap-1.5 truncate text-[11px] tabular-nums text-[#82847a] dark:text-gray-500">
              <span>{formatTime(job.createdAt)}</span>
              {count ? (
                <span className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-300" title={`${count} 个平台回报了手册偏差`}>
                  <IconAlertTriangle size={12} aria-hidden="true" />{count} 处手册偏差
                </span>
              ) : null}
            </p>
          </div>
        )
      },
    },
    {
      key: 'platforms',
      header: '平台',
      hideSm: true,
      width: '12.5rem',
      render: (job) => {
        const results = new Map(job.results.map((result) => [result.platformId, result]))
        const shown = job.platformIds.slice(0, MAX_ROW_PLATFORMS)
        const hidden = job.platformIds.length - shown.length
        const summary = job.platformIds.map((id) => `${distributionPlatformShortLabel(id)}：${resultLabel(results.get(id))}`).join('\n')
        return (
          <div className="flex items-center gap-1 overflow-hidden" title={summary}>
            {shown.map((platformId) => (
              <PlatformResultPill key={platformId} platformId={platformId} result={results.get(platformId)} compact />
            ))}
            {hidden > 0 ? <span className="shrink-0 text-[11px] text-[#82847a] dark:text-gray-500">+{hidden}</span> : null}
          </div>
        )
      },
    },
    {
      key: 'status',
      header: '状态',
      width: '6.25rem',
      render: (job) => {
        const status = JOB_STATUS[job.status] || JOB_STATUS.pending
        return <StatusPill tone={status.tone} size="sm">{status.label}</StatusPill>
      },
    },
    {
      key: 'actions',
      header: '',
      width: '4.5rem',
      align: 'right',
      render: (job) => <AdminButton type="button" size="sm" onClick={() => setDetailId(job.id)}>详情</AdminButton>,
    },
  ]

  const filtered = filters.status || filters.platform || filters.query.trim()

  return (
    <Section
      title="智能体任务台"
      description="在本页建的任务都在这里。智能体用 ego lite 发布后逐平台回报。"
      actions={(
        <AdminButton type="button" size="sm" onClick={load} disabled={state.loading}>
          <IconRefresh size={15} /> 刷新
        </AdminButton>
      )}
    >
      <div className="min-w-0 space-y-3 text-sm">
        <Toolbar
          className="min-w-0 w-full"
          left={(
            <>
              <select aria-label="按状态筛选" className={`${controlClass} w-full min-w-0 sm:w-auto`} value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
                <option value="">全部状态</option>
                {Object.entries(JOB_STATUS).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select aria-label="按平台筛选" className={`${controlClass} w-full min-w-0 sm:w-auto`} value={filters.platform} onChange={(event) => setFilter('platform', event.target.value)}>
                <option value="">全部平台</option>
                {platformOptions.map((platform) => <option key={platform.id} value={platform.id}>{platform.shortLabel}</option>)}
              </select>
              <input
                type="search"
                aria-label="按标题搜索"
                placeholder="搜索标题、链接或标签"
                className={`${controlClass} w-full min-w-0 sm:w-44 sm:max-w-[14rem]`}
                value={filters.query}
                onChange={(event) => setFilter('query', event.target.value)}
              />
              {filtered ? (
                <button type="button" className="text-[12px] text-[#67695d] underline-offset-2 hover:underline dark:text-gray-400" onClick={() => setFilters({ status: '', platform: '', query: '' })}>
                  清除筛选
                </button>
              ) : null}
            </>
          )}
          right={<span className="w-full text-[12px] tabular-nums text-[#82847a] sm:w-auto dark:text-gray-500">{filtered ? `${visibleJobs.length} / ${jobs.length}` : jobs.length} 个任务</span>}
        />
        {state.error ? <p className="m-0 text-xs text-rose-600 dark:text-rose-300">{state.error}</p> : null}
        {state.notice ? <p className="m-0 text-xs text-emerald-700 dark:text-emerald-300">{state.notice}</p> : null}
        {!state.loading && !state.error ? (
          <DataTable
            columns={columns}
            rows={visibleJobs}
            rowKey={(job) => job.id}
            tableClassName="sm:table-fixed sm:min-w-[34rem]"
            empty={<p className="m-0 py-6 text-center text-xs text-[#7b7d72] dark:text-gray-500">{jobs.length ? '没有符合筛选的任务。' : '还没有任务。'}</p>}
          />
        ) : null}
      </div>
      {detailJob ? <JobDetailDialog job={detailJob} busy={busyId === detailJob.id} onClose={closeDetail} onAct={act} /> : null}
    </Section>
  )
}

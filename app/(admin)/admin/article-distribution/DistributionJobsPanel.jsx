'use client'

import { useCallback, useEffect, useState } from 'react'
import { IconClipboard, IconExternalLink, IconRefresh, IconX } from '@tabler/icons-react'

import { RESULT_STATUS_LABELS } from '../../../../lib/distribution/harness'
import { distributionPlatformShortLabel } from '../../../../lib/distribution/platforms'
import { buildDistributionClaimPrompt } from '../../../../lib/distribution/taskPrompt'
import { copyPlainText } from '../../../../lib/content/contentClipboard'
import AdminButton from '../../components/ui/AdminButton'
import Section from '../../components/ui/Section'
import StatusPill from '../../components/ui/StatusPill'

const JOB_STATUS = {
  pending: { label: '待领取', tone: 'neutral' },
  claimed: { label: '执行中', tone: 'info' },
  done: { label: '完成', tone: 'success' },
  partial: { label: '部分完成', tone: 'warning' },
  failed: { label: '失败', tone: 'danger' },
  cancelled: { label: '已取消', tone: 'neutral' },
}

const RESULT_TONES = { published: 'success', reviewing: 'info', draft: 'warning', failed: 'danger', skipped: 'neutral' }

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function hasText(value) {
  return value && value.trim() && value.trim() !== '无'
}

// 智能体任务台：文章页「ego」按钮建的任务和智能体逐平台回报的结果。
export default function DistributionJobsPanel() {
  const [jobs, setJobs] = useState([])
  const [state, setState] = useState({ loading: true, error: '', notice: '' })
  const [busyId, setBusyId] = useState('')

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

  return (
    <Section
      title="智能体任务台"
      description="在文章页点「ego」建任务并复制领取指令，智能体用 ego lite 发布后逐平台回报到这里。"
      actions={(
        <AdminButton type="button" size="sm" onClick={load} disabled={state.loading}>
          <IconRefresh size={15} /> 刷新
        </AdminButton>
      )}
    >
      <div className="space-y-3 text-sm">
        {state.error ? <p className="m-0 text-xs text-rose-600 dark:text-rose-300">{state.error}</p> : null}
        {state.notice ? <p className="m-0 text-xs text-emerald-700 dark:text-emerald-300">{state.notice}</p> : null}
        {!state.loading && !state.error && jobs.length === 0 ? (
          <p className="m-0 text-xs text-[#7b7d72] dark:text-gray-500">还没有任务。</p>
        ) : null}
        {jobs.map((job) => {
          const status = JOB_STATUS[job.status] || JOB_STATUS.pending
          const active = job.status === 'pending' || job.status === 'claimed'
          const results = new Map(job.results.map((result) => [result.platformId, result]))
          const notes = job.results.filter((result) => hasText(result.notes) || hasText(result.playbookDeviation))
          return (
            <article key={job.id} className="rounded-lg border border-[#e1e2d9] p-3 dark:border-[#263142]">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <a href={job.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-[#15140f] hover:underline dark:text-gray-100">
                    {job.title} <IconExternalLink size={13} aria-hidden="true" />
                  </a>
                  <p className="m-0 mt-0.5 text-[11px] text-[#7b7d72] dark:text-gray-500">
                    {formatTime(job.createdAt)} 建 · harness {job.harnessVersion}
                    {job.finishedAt ? ` · ${formatTime(job.finishedAt)} 结束` : ''}
                    {active && job.tokenExpiresAt ? ` · 指令 ${formatTime(job.tokenExpiresAt)} 前有效` : ''}
                  </p>
                </div>
                <StatusPill tone={status.tone} size="sm">{status.label}</StatusPill>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.platformIds.map((platformId) => {
                  const result = results.get(platformId)
                  const label = `${distributionPlatformShortLabel(platformId)}：${result ? RESULT_STATUS_LABELS[result.status] || result.status : '未回报'}`
                  return result?.articleUrl && /^https?:\/\//.test(result.articleUrl) ? (
                    <a key={platformId} href={result.articleUrl} target="_blank" rel="noreferrer">
                      <StatusPill tone={RESULT_TONES[result.status]} size="sm" icon={false}>{label}</StatusPill>
                    </a>
                  ) : (
                    <StatusPill key={platformId} tone={result ? RESULT_TONES[result.status] : 'neutral'} size="sm" icon={false}>{label}</StatusPill>
                  )
                })}
              </div>
              {notes.length ? (
                <ul className="m-0 mt-2 space-y-1 pl-4 text-[12px] leading-5 text-[#53554d] dark:text-gray-300">
                  {notes.map((result) => (
                    <li key={result.platformId}>
                      <span className="font-medium">{distributionPlatformShortLabel(result.platformId)}</span>
                      {hasText(result.notes) ? `：${result.notes}` : ''}
                      {hasText(result.playbookDeviation) ? <span className="text-amber-700 dark:text-amber-300">（手册偏差：{result.playbookDeviation}）</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {active ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <AdminButton type="button" size="sm" onClick={() => act(job, 'reissue')} disabled={busyId === job.id}>
                    <IconClipboard size={15} /> 复制领取指令
                  </AdminButton>
                  <AdminButton type="button" size="sm" variant="ghost" onClick={() => act(job, 'cancel')} disabled={busyId === job.id}>
                    <IconX size={15} /> 取消
                  </AdminButton>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </Section>
  )
}

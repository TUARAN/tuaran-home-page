'use client'

import { useCallback, useEffect, useState } from 'react'

import { AdminButton, AdminPage, EmptyState, Section, StatCard, StatusPill } from '../../components/ui'

const DRAFT_STATUS_META = {
  pending: { label: '待复核', tone: 'warning' },
  reviewed: { label: '已复核', tone: 'success' },
  rejected: { label: '已退回', tone: 'danger' },
}

const ACTION_LABELS = {
  'pool-sync': '公司池同步',
  draft: '选题起草',
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

async function safeJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export default function AShareResearchClient() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [openId, setOpenId] = useState('')
  const [copied, setCopied] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/a-share-research', { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setData(payload)
    } catch (fetchError) {
      setError(fetchError?.message || 'A 股研究数据读取失败。')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function setDraftStatus(draft, status) {
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/admin/a-share-research', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: draft.id, status }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      await refresh()
    } catch (updateError) {
      setError(updateError?.message || '草稿状态更新失败。')
    } finally {
      setSaving(false)
    }
  }

  async function copyDraft(draft) {
    try {
      await navigator.clipboard.writeText(draft.content || '')
      setCopied(draft.id)
      setTimeout(() => setCopied(''), 1600)
    } catch {
      setError('复制失败，请手动选择内容复制。')
    }
  }

  const drafts = data?.drafts || []
  const logs = data?.logs || []

  return (
    <AdminPage
      title="A 股研究自动化"
      description="每天由线上定时任务选题并调用 DeepSeek 起草公司观察，草稿自动保持待复核状态，站长确认后才进入内容管线。"
      actions={<AdminButton type="button" onClick={refresh} disabled={loading}>{loading ? '刷新中…' : '刷新'}</AdminButton>}
    >
      {error ? <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}
      {data?.status === 'unavailable' ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          D1 不可用或迁移 0060 尚未部署，当前无法读取 A 股研究数据。
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="公司池" value={loading ? '—' : data?.pool ? data.pool.count.toLocaleString() : '—'} sub={data?.pool ? `快照 ${data.pool.snapshotDate}` : '未同步'} />
        <StatCard label="待完成选题" value={loading ? '—' : data?.pending ? 1 : 0} tone={data?.pending ? 'info' : 'neutral'} sub={data?.pending ? `${data.pending.name}（${data.pending.code}）` : '无'} />
        <StatCard label="待复核草稿" value={loading ? '—' : data?.draftStats?.pending || 0} tone="warning" />
        <StatCard label="已复核草稿" value={loading ? '—' : data?.draftStats?.reviewed || 0} tone="success" />
      </div>

      <Section
        title="自动生成草稿"
        description="内容为 DeepSeek 依据公司池与实时行情生成的初稿，财务数据可能缺失，务必人工复核后再发布。"
        actions={<span className="text-[12px] text-[#82847a]">最近 {drafts.length} 篇</span>}
      >
        {!loading && !drafts.length ? (
          <EmptyState title="暂无草稿" description="线上定时任务首次选题后会出现在这里。" />
        ) : (
          <div className="space-y-2">
            {drafts.map((draft) => {
              const statusMeta = DRAFT_STATUS_META[draft.status] || { label: draft.status, tone: 'neutral' }
              const open = openId === draft.id
              return (
                <article key={draft.id} className="rounded-lg border border-[#e6e7df] p-3 dark:border-[#243041]">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <button type="button" onClick={() => setOpenId(open ? '' : draft.id)} className="min-w-0 flex-1 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={statusMeta.tone} size="sm">{statusMeta.label}</StatusPill>
                        <span className="text-[11px] text-[#82847a]">{draft.draftDate} · {draft.code} · {draft.templateVersion ? `模板 v${draft.templateVersion}` : ''}</span>
                      </div>
                      <h3 className="mt-1.5 truncate text-[14px] font-semibold text-[#15140f] dark:text-gray-100">{draft.title || `${draft.name}（${draft.code}）`}</h3>
                      <p className="mt-1 text-[12px] text-[#67695d] dark:text-gray-400">
                        {draft.attemptCount ? `生成尝试 ${draft.attemptCount} 次 · ` : ''}
                        {draft.deepseekTaskId ? `DeepSeek 台账 ${draft.deepseekTaskId.slice(0, 8)}…` : '尚未完成生成'}
                      </p>
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminButton type="button" variant="ghost" onClick={() => copyDraft(draft)}>{copied === draft.id ? '已复制' : '复制全文'}</AdminButton>
                      {draft.status === 'pending' ? (
                        <>
                          <AdminButton type="button" variant="primary" onClick={() => setDraftStatus(draft, 'reviewed')} disabled={saving}>标记已复核</AdminButton>
                          <AdminButton type="button" variant="ghost" onClick={() => setDraftStatus(draft, 'rejected')} disabled={saving}>退回</AdminButton>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {open && draft.content ? (
                    <pre className="mt-3 max-h-[480px] overflow-auto whitespace-pre-wrap rounded-lg border border-[#e6e7df] bg-[#fafbf6] p-3 font-sans text-[12px] leading-6 text-[#3f4039] dark:border-[#243041] dark:bg-[#0e141d] dark:text-gray-200">{draft.content}</pre>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}
      </Section>

      <Section title="运行日志" description="线上定时任务最近 20 次执行记录；失败项会自动重试同一家公司。" className="mt-4">
        {!loading && !logs.length ? (
          <EmptyState title="暂无运行记录" description="定时任务首次触发后会出现在这里。" />
        ) : (
          <div className="space-y-1.5">
            {logs.map((log) => (
              <div key={log.id} className="flex flex-col gap-1 rounded-lg border border-[#e6e7df] px-3 py-2 text-[12px] dark:border-[#243041] lg:flex-row lg:items-center">
                <StatusPill tone={log.status === 'ok' ? 'success' : log.status === 'skipped' ? 'neutral' : 'danger'} size="sm">
                  {log.status === 'ok' ? '成功' : log.status === 'skipped' ? '跳过' : '失败'}
                </StatusPill>
                <span className="min-w-0 flex-1 truncate">
                  {ACTION_LABELS[log.action] || log.action}
                  {log.companyName ? ` · ${log.companyName}（${log.code}）` : ''}
                  {log.error ? <span className="ml-1 text-rose-600 dark:text-rose-300">· {log.error}</span> : null}
                </span>
                <span className="text-[#82847a]">{formatDate(log.ranAt)} · {(Number(log.durationMs) / 1000).toFixed(1)} 秒</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </AdminPage>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'

import { AdminButton, AdminPage, EmptyState, Section, StatCard, StatusPill } from '../../components/ui'

const DRAFT_STATUS_META = {
  pending: { label: '待复核', tone: 'warning' },
  reviewed: { label: '已复核', tone: 'success' },
  published: { label: '已发布', tone: 'success' },
  rejected: { label: '已退回', tone: 'danger' },
}

const ACTION_LABELS = {
  'pool-sync': '公司池同步',
  draft: '选题起草',
  publish: '后台发布',
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
  const [logs, setLogs] = useState([])
  const [logTotal, setLogTotal] = useState(0)
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsLoadingMore, setLogsLoadingMore] = useState(false)
  const [logsError, setLogsError] = useState('')

  const loadLogs = useCallback(async (offset, { append = false } = {}) => {
    if (append) setLogsLoadingMore(true)
    else setLogsLoading(true)
    setLogsError('')
    try {
      const response = await fetch(`/api/admin/a-share-research/logs?offset=${offset}&limit=20`, { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      const rows = Array.isArray(payload?.logs) ? payload.logs : []
      setLogs((prev) => (append ? [...prev, ...rows] : rows))
      setLogTotal(Number(payload?.total) || 0)
    } catch (fetchError) {
      setLogsError(fetchError?.message || '运行日志读取失败。')
    } finally {
      if (append) setLogsLoadingMore(false)
      else setLogsLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/a-share-research', { cache: 'no-store' })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      setData(payload)
      await loadLogs(0)
    } catch (fetchError) {
      setError(fetchError?.message || 'A 股研究数据读取失败。')
    } finally {
      setLoading(false)
    }
  }, [loadLogs])

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

  async function publishDraft(draft) {
    const confirmed = window.confirm(
      `确认发布「${draft.title || draft.name}」？\n\n将把草稿写入 research/companies/ 并提交推送 main，触发线上构建。`,
    )
    if (!confirmed) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/admin/a-share-research/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: draft.id }),
      })
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
      await refresh()
    } catch (publishError) {
      setError(publishError?.message || '发布失败，草稿已保留为已复核，可稍后重试。')
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
  const hasMoreLogs = logs.length < logTotal

  return (
    <AdminPage
      title="A 股研究自动化"
      description="每天由线上定时任务选题并调用 DeepSeek 起草公司观察；草稿待复核满 3 天仍未处理时自动发布。"
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
        description="内容为 DeepSeek 依据公司池与实时行情生成的初稿。请在 3 天内复核发布或退回；到期仍为待复核状态时，系统会自动发布。"
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
                        {draft.status === 'pending' && draft.autoPublishAt ? ` · ${new Date(draft.autoPublishAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })} 后自动发布` : ''}
                      </p>
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminButton type="button" variant="ghost" onClick={() => copyDraft(draft)}>{copied === draft.id ? '已复制' : '复制全文'}</AdminButton>
                      {draft.status === 'pending' ? (
                        <>
                          <AdminButton type="button" variant="primary" onClick={() => publishDraft(draft)} disabled={saving}>复核并发布</AdminButton>
                          <AdminButton type="button" variant="ghost" onClick={() => setDraftStatus(draft, 'rejected')} disabled={saving}>退回</AdminButton>
                        </>
                      ) : null}
                      {draft.status === 'reviewed' ? (
                        <>
                          <AdminButton type="button" variant="primary" onClick={() => publishDraft(draft)} disabled={saving}>发布</AdminButton>
                          <AdminButton type="button" variant="ghost" onClick={() => setDraftStatus(draft, 'rejected')} disabled={saving}>退回</AdminButton>
                        </>
                      ) : null}
                      {draft.status === 'published' ? (
                        <>
                          <AdminButton href={`/articles/research/companies/a-share-${draft.code}`} target="_blank" rel="noreferrer" size="sm">查看文章</AdminButton>
                          {draft.publishCommit ? (
                            <AdminButton href={`https://github.com/TUARAN/tuaran-home-page/commit/${draft.publishCommit}`} target="_blank" rel="noreferrer" size="sm">提交 {draft.publishCommit.slice(0, 7)}</AdminButton>
                          ) : null}
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

      <Section
        title="运行日志"
        description="线上定时任务按时间倒序分页记录；失败项会自动重试同一家公司。"
        className="mt-4"
        actions={<span className="text-[12px] text-[#82847a]">共 {logsLoading ? '…' : logTotal} 条</span>}
      >
        {logsLoading ? (
          <p className="py-4 text-center text-[12px] text-[#82847a]">日志加载中…</p>
        ) : logsError ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            {logsError}
          </p>
        ) : !logs.length ? (
          <EmptyState title="暂无运行记录" description="定时任务首次触发后会出现在这里。" />
        ) : (
          <>
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
            {hasMoreLogs ? (
              <div className="mt-3 text-center">
                <AdminButton
                  type="button"
                  variant="ghost"
                  onClick={() => loadLogs(logs.length, { append: true })}
                  disabled={logsLoadingMore}
                >
                  {logsLoadingMore ? '加载中…' : `加载更多（还有 ${logTotal - logs.length} 条）`}
                </AdminButton>
              </div>
            ) : null}
          </>
        )}
      </Section>
    </AdminPage>
  )
}

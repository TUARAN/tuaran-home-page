'use client'

import { useCallback, useEffect, useState } from 'react'

import { AdminButton, AdminPage, EmptyState, Section, StatCard, StatusPill } from '../../components/ui'
import AdminPagination from '../../components/ui/AdminPagination'

const LOG_PAGE_SIZE = 20

const STATUS = {
  generating: ['生成中', 'info'], failed: ['生成失败', 'danger'], pending: ['待复核', 'warning'],
  reviewed: ['已复核', 'success'], published: ['已发布', 'success'], rejected: ['已退回', 'danger'],
}
const FILTERS = [['all', '全部'], ['generating', '生成中'], ['failed', '生成失败'], ['pending', '待复核'], ['reviewed', '已复核'], ['published', '已发布'], ['rejected', '已退回']]

async function json(response) {
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.detail || payload?.error || `HTTP_${response.status}`)
  return payload
}

export default function CryptoResearchClient() {
  const [data, setData] = useState(null)
  const [logs, setLogs] = useState([])
  const [logTotal, setLogTotal] = useState(0)
  const [logOffset, setLogOffset] = useState(0)
  const [logsLoading, setLogsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadOverview = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const query = filter === 'all' ? '' : `?status=${filter}`
      const overview = await fetch(`/api/admin/crypto-research${query}`, { cache: 'no-store' }).then(json)
      setData(overview)
    } catch (cause) { setError(cause.message || '读取失败。') }
    finally { setLoading(false) }
  }, [filter])

  const loadLogs = useCallback(async (nextOffset = 0) => {
    setLogsLoading(true); setError('')
    try {
      const params = new URLSearchParams({ limit: String(LOG_PAGE_SIZE), offset: String(nextOffset) })
      const logData = await fetch(`/api/admin/crypto-research/logs?${params}`, { cache: 'no-store' }).then(json)
      setLogs(logData.logs || [])
      setLogTotal(Number(logData.total) || 0)
      setLogOffset(Number(logData.offset) || 0)
    } catch (cause) { setError(cause.message || '运行日志读取失败。') }
    finally { setLogsLoading(false) }
  }, [])

  const refresh = useCallback(async () => {
    await Promise.all([loadOverview(), loadLogs(logOffset)])
  }, [loadOverview, loadLogs, logOffset])

  useEffect(() => { loadOverview() }, [loadOverview])
  useEffect(() => { loadLogs(0) }, [loadLogs])

  async function mutate(draft, action) {
    setSaving(true); setError('')
    try {
      const publish = action === 'publish'
      await fetch(`/api/admin/crypto-research${publish ? '/publish' : ''}`, {
        method: publish ? 'POST' : 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(publish ? { id: draft.id } : { id: draft.id, status: action }),
      }).then(json)
      await refresh()
    } catch (cause) { setError(cause.message || '操作失败。') }
    finally { setSaving(false) }
  }

  const stats = data?.draftStats || {}
  const total = Object.values(stats).reduce((sum, count) => sum + Number(count || 0), 0)

  return <AdminPage title="加密调研自动化" description="每天刷新市值前 250 名，依次选择尚未完成的最高市值币种，由 DeepSeek 联网起草；待复核满 3 天后自动发布。" actions={<AdminButton onClick={refresh} disabled={loading}>{loading ? '刷新中…' : '刷新'}</AdminButton>}>
    {error ? <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</div> : null}
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="市值币种池" value={data?.pool?.count || '—'} sub={data?.pool ? `快照 ${data.pool.snapshotDate}` : '未同步'} />
      <StatCard label="当前选题" value={data?.pending ? `#${data.pending.marketCapRank}` : '无'} sub={data?.pending ? `${data.pending.name}（${data.pending.symbol}）` : '等待下一次任务'} />
      <StatCard label="待复核" value={stats.pending || 0} tone="warning" />
      <StatCard label="已发布" value={stats.published || 0} tone="success" />
    </div>
    <Section title="自动生成草稿" description="请在草稿进入待复核后的 72 小时内发布或退回；到期仍待复核的草稿，在后续每日北京时间 01:30 调度时自动发布，每次最多一篇。退回可阻止自动发布，发布失败会保留原到期时间重试。">
      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map(([id, label]) => <button key={id} type="button" onClick={() => setFilter(id)} className={`rounded-full border px-3 py-1.5 text-xs ${filter === id ? 'border-[#15140f] bg-[#15140f] text-white dark:border-gray-100 dark:bg-gray-100 dark:text-black' : 'border-[#d9dacd] dark:border-[#2d3744]'}`}>{label} · {id === 'all' ? total : stats[id] || 0}</button>)}
      </div>
      {!loading && !data?.drafts?.length ? <EmptyState title="暂无草稿" description="定时任务完成首次起草后会出现在这里。" /> : <div className="space-y-2">
        {(data?.drafts || []).map((draft) => {
          const [label, tone] = STATUS[draft.status] || [draft.status, 'neutral']
          const open = openId === draft.id
          return <article key={draft.id} className="rounded-lg border border-[#e6e7df] p-3 dark:border-[#243041]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <button className="min-w-0 flex-1 text-left" onClick={() => setOpenId(open ? '' : draft.id)}>
                <div className="flex items-center gap-2"><StatusPill tone={tone} size="sm">{label}</StatusPill><span className="text-xs text-[#82847a]">#{draft.marketCapRank} · {draft.symbol} · {draft.draftDate} · 模板 v{draft.templateVersion}</span></div>
                <h3 className="mt-2 truncate text-sm font-semibold">{draft.name}（{draft.symbol}）</h3>
                <p className="mt-1 text-xs text-[#67695d] dark:text-gray-400">{draft.status === 'failed' ? draft.generationError : draft.autoPublishAt ? `${new Date(draft.autoPublishAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}（北京时间）到期，后续调度自动发布` : `生成尝试 ${draft.attemptCount} 次`}</p>
              </button>
              <div className="flex flex-wrap gap-2">
                {draft.status === 'failed' ? <AdminButton variant="primary" onClick={() => mutate(draft, 'retry')} disabled={saving}>重新生成</AdminButton> : null}
                {['pending', 'reviewed'].includes(draft.status) ? <AdminButton variant="primary" onClick={() => mutate(draft, 'publish')} disabled={saving}>发布</AdminButton> : null}
                {['pending', 'reviewed'].includes(draft.status) ? <AdminButton variant="ghost" onClick={() => mutate(draft, 'rejected')} disabled={saving}>退回</AdminButton> : null}
                {draft.status === 'published' ? <AdminButton href={`/articles/research/topics/crypto-${draft.coinId}`} target="_blank">查看文章</AdminButton> : null}
              </div>
            </div>
            {open && draft.content ? <pre className="mt-3 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg bg-[#fafbf6] p-3 text-xs leading-6 dark:bg-[#0e141d]">{draft.content}</pre> : null}
          </article>
        })}
      </div>}
    </Section>
    <Section title="运行日志" description="同步、起草和发布记录按时间倒序分页展示。" className="mt-4" actions={<span className="text-xs text-[#82847a]">共 {logsLoading ? '…' : logTotal} 条</span>}>
      {!logsLoading && !logs.length ? <EmptyState title="暂无运行记录" description="首次触发后会出现在这里。" /> : <div className="space-y-1.5">{logs.map((log) => <div key={log.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-[#e6e7df] px-3 py-2 text-xs dark:border-[#243041]"><StatusPill tone={log.status === 'ok' ? 'success' : log.status === 'failed' ? 'danger' : 'neutral'} size="sm">{log.status === 'ok' ? '成功' : log.status === 'failed' ? '失败' : '跳过'}</StatusPill><span className="min-w-0 flex-1 truncate">{log.action}{log.coinName ? ` · #${log.coinId} ${log.coinName}（${log.symbol}）` : ''}{log.error ? ` · ${log.error}` : ''}</span><time className="text-[#82847a]">{new Date(log.ranAt).toLocaleString('zh-CN', { hour12: false })}</time></div>)}</div>}
      <AdminPagination total={logTotal} offset={logOffset} limit={LOG_PAGE_SIZE} onOffsetChange={loadLogs} loading={logsLoading} />
    </Section>
  </AdminPage>
}

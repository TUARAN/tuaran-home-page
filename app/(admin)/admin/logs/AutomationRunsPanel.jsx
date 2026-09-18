'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { AdminButton, StatusPill } from '../../components/ui'

const RUNS_PAGE_SIZE = 8
const CONTROL_CLASS = 'h-9 rounded-lg border border-[#d8dad0] bg-white px-2.5 text-[13px] text-[#3f4039] dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200'

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(value) {
  if (value == null) return '—'
  if (value < 1000) return `${value} ms`
  return `${(value / 1000).toFixed(1)} s`
}

function statusText(status) {
  return (
    {
      success: '成功',
      failed: '失败',
      running: '运行中',
    }[status] || status || '状态未知'
  )
}

function reviewText(status) {
  return (
    {
      approved: '已审核',
      pending_review: '待审核',
      not_required: '无需审核',
    }[status] || status || '—'
  )
}

function runTone(status) {
  if (status === 'success') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'running') return 'info'
  return 'neutral'
}

function reviewTone(status) {
  if (status === 'approved') return 'success'
  if (status === 'pending_review') return 'warning'
  return 'neutral'
}

function Pagination({ page, total, pageSize, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  return (
    <div className="mt-3 flex items-center justify-between text-[12px] text-[#686962] dark:text-gray-400">
      <span>共 {total} 条 · 第 {page} / {pages} 页</span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded border border-[#d8dad0] bg-white px-2.5 py-1 text-[#3f4039] transition hover:border-[#a37b3c] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200"
        >
          上一页
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className="rounded border border-[#d8dad0] bg-white px-2.5 py-1 text-[#3f4039] transition hover:border-[#a37b3c] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200"
        >
          下一页
        </button>
      </div>
    </div>
  )
}

export default function AutomationRunsPanel() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [repositoryFilter, setRepositoryFilter] = useState('all')
  const [openRunId, setOpenRunId] = useState('')
  const [runsPage, setRunsPage] = useState(1)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/ops-console', { cache: 'no-store', credentials: 'same-origin' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
      setStatus(data)
    } catch (e) {
      setError(e?.message || 'FETCH_FAILED')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const registry = useMemo(() => status?.registry || [], [status?.registry])
  const repositoryOptions = useMemo(
    () => Array.from(new Set(registry.map((item) => item.repository).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [registry],
  )
  const allRuns = useMemo(
    () => (status?.recentRuns || []).filter((run) => repositoryFilter === 'all' || run.repository === repositoryFilter),
    [status?.recentRuns, repositoryFilter],
  )
  const pagedRuns = allRuns.slice((runsPage - 1) * RUNS_PAGE_SIZE, runsPage * RUNS_PAGE_SIZE)

  function changeRepository(value) {
    setRepositoryFilter(value)
    setRunsPage(1)
  }

  return (
    <section className="rounded-xl border border-[#d5d7cd] bg-white/70 dark:border-[#252e39] dark:bg-[#10161f]">
      <div className="flex flex-col gap-3 border-b border-[#e6e7df] px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between dark:border-[#263142]">
        <div>
          <h2 className="text-sm font-semibold text-[#15140f] dark:text-gray-100">最近运行</h2>
          <p className="text-[11px] text-[#858779] dark:text-gray-500">点击行查看详情；共 {allRuns.length} 条</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className={CONTROL_CLASS} value={repositoryFilter} onChange={(event) => changeRepository(event.target.value)} aria-label="按项目仓库筛选">
            <option value="all">全部仓库（{registry.length}）</option>
            {repositoryOptions.map((repository) => (
              <option key={repository} value={repository}>
                {repository}（{registry.filter((item) => item.repository === repository).length}）
              </option>
            ))}
          </select>
          <AdminButton type="button" onClick={refresh} disabled={loading}>
            {loading ? '检查中…' : '重新检查'}
          </AdminButton>
        </div>
      </div>
      {error ? (
        <div role="alert" className="mx-4 mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </div>
      ) : null}
      <div className="divide-y divide-[#e6e7df] dark:divide-[#1f2a37]">
        {pagedRuns.map((run) => {
          const open = openRunId === run.id
          return (
            <RunRow
              key={run.id}
              run={run}
              open={open}
              onOpen={() => setOpenRunId(open ? '' : run.id)}
            />
          )
        })}
        {!loading && !pagedRuns.length ? (
          <p className="px-4 py-8 text-center text-sm text-[#77796d] dark:text-gray-400">暂无运行记录。</p>
        ) : null}
      </div>
      <div className="px-4 pb-3">
        <Pagination page={runsPage} total={allRuns.length} pageSize={RUNS_PAGE_SIZE} onChange={setRunsPage} />
      </div>
    </section>
  )
}

function RunRow({ run, open, onOpen }) {
  return (
    <div onClick={onOpen} className={`cursor-pointer px-4 py-2.5 transition ${open ? 'bg-[#f4f5ee] dark:bg-[#151d29]' : 'hover:bg-[#f8f9f3] dark:hover:bg-[#131b26]'}`}>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
        <StatusPill tone={runTone(run.status)} size="sm">{statusText(run.status)}</StatusPill>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#15140f] dark:text-gray-100">{run.taskName}</span>
        <span className="font-mono text-[11px] text-[#858779] dark:text-gray-500">{run.repository || '未关联仓库'}</span>
        <span className="text-[12px] text-[#686962] dark:text-gray-400">{formatTime(run.startedAt)}</span>
        <span className="w-20 text-right text-[12px] text-[#686962] dark:text-gray-400">{formatDuration(run.durationMs)}</span>
      </div>
      {open ? (
        <div className="mt-2 border-t border-[#e6e7df] pt-2 dark:border-[#263142]">
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#686962] dark:text-gray-400">
            <StatusPill tone={reviewTone(run.reviewStatus)} size="sm">{reviewText(run.reviewStatus)}</StatusPill>
            <span className="font-mono">{run.taskId}</span>
            {(run.artifacts || []).map((artifact) => (
              <span key={artifact} className="rounded border border-[#d9dbd1] px-2 py-0.5 font-mono text-[11px] text-[#6b6d61] dark:border-[#263142] dark:text-gray-400">
                {artifact}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

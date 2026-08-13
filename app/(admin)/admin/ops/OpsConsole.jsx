'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { AdminButton, AdminPage, StatusPill } from '../../components/ui'

const PAGE_SIZE = 10
const RUNS_PAGE_SIZE = 8

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
      active: '已启用',
      on_demand: '按需运行',
      paused: '已暂停',
      never_run: '未运行',
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

function riskTone(level) {
  if (level === 'high') return 'danger'
  if (level === 'medium') return 'warning'
  return 'success'
}

function riskText(level) {
  return (
    {
      high: '高风险',
      medium: '中风险',
      low: '低风险',
    }[level] || '未分级'
  )
}

function scopeText(scope) {
  return scope === 'cloud' ? '云端' : '本地'
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

const CONTROL_CLASS = 'h-9 rounded-lg border border-[#d8dad0] bg-white px-2.5 text-[13px] text-[#3f4039] dark:border-[#2b3644] dark:bg-[#0e141d] dark:text-gray-200'

export default function OpsConsoleClient() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [copyError, setCopyError] = useState('')
  const [togglingId, setTogglingId] = useState('')
  const [repositoryFilter, setRepositoryFilter] = useState('all')
  const [scopeFilter, setScopeFilter] = useState('all')
  const [openId, setOpenId] = useState('')
  const [openRunId, setOpenRunId] = useState('')
  const [registryPage, setRegistryPage] = useState(1)
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
  const filteredRegistry = useMemo(() => {
    const byRepo = repositoryFilter === 'all' ? registry : registry.filter((item) => item.repository === repositoryFilter)
    return scopeFilter === 'all' ? byRepo : byRepo.filter((item) => item.scope === scopeFilter)
  }, [registry, repositoryFilter, scopeFilter])
  const pagedRegistry = filteredRegistry.slice((registryPage - 1) * PAGE_SIZE, registryPage * PAGE_SIZE)
  const allRuns = useMemo(
    () => (status?.recentRuns || []).filter((run) => repositoryFilter === 'all' || run.repository === repositoryFilter),
    [status?.recentRuns, repositoryFilter],
  )
  const pagedRuns = allRuns.slice((runsPage - 1) * RUNS_PAGE_SIZE, runsPage * RUNS_PAGE_SIZE)
  const stats = repositoryFilter === 'all'
    ? status?.stats || {}
    : {
        totalTasks: filteredRegistry.length,
        cloudTasks: filteredRegistry.filter((item) => item.scope === 'cloud').length,
        localTasks: filteredRegistry.filter((item) => item.scope === 'local').length,
        reviewRequired: filteredRegistry.filter((item) => item.reviewRequired).length,
      }

  const copyText = useCallback(async (key, text) => {
    setCopyError('')
    try {
      let wrote = false
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text)
          wrote = true
        } catch {
          wrote = false
        }
      }
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        const ok = document.execCommand('copy')
        textarea.remove()
        wrote = wrote || ok
      } catch {
        // Keep the Clipboard API result if it already succeeded.
      }
      if (!wrote) throw new Error('COPY_UNAVAILABLE')
      setCopied(key)
      window.setTimeout(() => setCopied(''), 1200)
    } catch (e) {
      setCopied('')
      setCopyError(e?.message || 'COPY_FAILED')
    }
  }, [])

  const togglePause = useCallback(
    async (item) => {
      const action = item.status === 'paused' ? 'resume' : 'pause'
      setTogglingId(item.id)
      try {
        const res = await fetch('/api/admin/ops-console', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action, id: item.id }),
        })
        const data = await safeJson(res)
        if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`)
        await refresh()
      } catch (e) {
        setError(e?.message || 'TOGGLE_FAILED')
      } finally {
        setTogglingId('')
      }
    },
    [refresh],
  )

  function changeRepository(value) {
    setRepositoryFilter(value)
    setRegistryPage(1)
    setRunsPage(1)
  }

  function changeScope(value) {
    setScopeFilter(value)
    setRegistryPage(1)
  }

  return (
    <AdminPage
      title="自动化运行"
      description="云端与本地自动化统一登记；列表紧凑展示，点击任意一行查看详情。"
      actions={
        <div className="flex flex-wrap gap-2">
          <AdminButton href="/admin/a-share-research" variant="primary">A 股研究自动化</AdminButton>
          <AdminButton href={status?.localUrl || 'http://localhost:4179'} target="_blank" rel="noreferrer">本机控制台</AdminButton>
          <AdminButton href={status?.externalUrl || 'https://ops.2aran.com/'} target="_blank" rel="noreferrer">Tunnel 入口</AdminButton>
          <AdminButton
            type="button"
            onClick={() => copyText('registry', JSON.stringify(filteredRegistry, null, 2))}
            disabled={!filteredRegistry.length}
          >
            {copied === 'registry' ? '已复制' : '复制台账'}
          </AdminButton>
          <AdminButton type="button" onClick={refresh} disabled={loading}>
            {loading ? '检查中…' : '重新检查'}
          </AdminButton>
        </div>
      }
    >
      {error ? (
        <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </div>
      ) : null}
      {copyError ? (
        <div role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          复制失败：{copyError}
        </div>
      ) : null}

      <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="自动化总数" value={loading ? '—' : stats.totalTasks ?? '—'} />
        <Stat label="云端自动化" value={loading ? '—' : stats.cloudTasks ?? '—'} />
        <Stat label="本地自动化" value={loading ? '—' : stats.localTasks ?? '—'} />
        <Stat label="需人工审核" value={loading ? '—' : stats.reviewRequired ?? '—'} />
        <Stat label="最近运行" value={loading ? '—' : allRuns.length ?? '—'} />
      </section>

      <section className="mb-4 rounded-xl border border-[#d5d7cd] bg-white/70 p-4 dark:border-[#252e39] dark:bg-[#10161f]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#858779] dark:text-[#8e9ab0]">Current Status</p>
            <h2 className="mt-0.5 text-base font-semibold text-[#15140f] dark:text-gray-100">{loading ? '检查中' : status?.label || '未知'}</h2>
            <p className="mt-0.5 truncate text-[12px] leading-5 text-[#686962] dark:text-gray-400">{status?.message || '正在检查自动化注册表。'}</p>
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
            <select className={CONTROL_CLASS} value={scopeFilter} onChange={(event) => changeScope(event.target.value)} aria-label="按云端或本地筛选">
              <option value="all">全部环境</option>
              <option value="cloud">云端</option>
              <option value="local">本地</option>
            </select>
          </div>
        </div>
      </section>

      <section className="mb-4 overflow-hidden rounded-xl border border-[#d5d7cd] bg-white/70 dark:border-[#252e39] dark:bg-[#10161f]">
        <div className="flex items-center justify-between border-b border-[#e6e7df] px-4 py-2.5 dark:border-[#263142]">
          <div>
            <h2 className="text-sm font-semibold text-[#15140f] dark:text-gray-100">自动化列表</h2>
            <p className="text-[11px] text-[#858779] dark:text-gray-500">点击行查看详情；共 {filteredRegistry.length} 条</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-separate border-spacing-0 text-left text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.1em] text-[#858779] dark:text-[#8e9ab0]">
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">调度状态</th>
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">名称</th>
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">环境</th>
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">触发</th>
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">最近运行</th>
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">成功率</th>
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">风险</th>
              </tr>
            </thead>
            <tbody>
              {pagedRegistry.map((item) => {
                const open = openId === item.id
                return (
                  <FragmentRow
                    key={item.id}
                    item={item}
                    open={open}
                    toggling={togglingId === item.id}
                    copied={copied}
                    onToggle={togglePause}
                    onCopy={copyText}
                    onOpen={() => setOpenId(open ? '' : item.id)}
                  />
                )
              })}
              {!loading && !pagedRegistry.length ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-[#77796d] dark:text-gray-400">没有符合筛选条件的自动化。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-3">
          <Pagination page={registryPage} total={filteredRegistry.length} pageSize={PAGE_SIZE} onChange={setRegistryPage} />
        </div>
      </section>

      <section className="rounded-xl border border-[#d5d7cd] bg-white/70 dark:border-[#252e39] dark:bg-[#10161f]">
        <div className="flex items-center justify-between border-b border-[#e6e7df] px-4 py-2.5 dark:border-[#263142]">
          <div>
            <h2 className="text-sm font-semibold text-[#15140f] dark:text-gray-100">最近运行</h2>
            <p className="text-[11px] text-[#858779] dark:text-gray-500">点击行查看详情；共 {allRuns.length} 条</p>
          </div>
        </div>
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

      <p className="mt-4 text-[12px] leading-6 text-[#858779] dark:text-gray-500">
        调度状态表示任务是否已启用：定时任务在两次触发之间仍显示“已启用”，仅有实时执行记录时才使用“运行中”；“按需运行”表示由人工触发。最近一次执行结果见“最近运行”。
      </p>
    </AdminPage>
  )
}

function FragmentRow({ item, open, toggling, copied, onToggle, onCopy, onOpen }) {
  return (
    <>
      <tr
        onClick={onOpen}
        className={`cursor-pointer transition ${open ? 'bg-[#f4f5ee] dark:bg-[#151d29]' : 'hover:bg-[#f8f9f3] dark:hover:bg-[#131b26]'}`}
      >
        <td className="border-b border-[#f0f1ea] px-3 py-2.5 dark:border-[#1c2632]">
          <StatusPill tone={item.status === 'paused' ? 'danger' : item.status === 'active' || item.status === 'running' ? 'success' : 'neutral'} size="sm">
            {statusText(item.status)}
          </StatusPill>
        </td>
        <td className="border-b border-[#f0f1ea] px-3 py-2.5 dark:border-[#1c2632]">
          <div className="font-medium text-[#15140f] dark:text-gray-100">{item.name}</div>
          <div className="font-mono text-[11px] text-[#858779] dark:text-gray-500">{item.id}</div>
        </td>
        <td className="border-b border-[#f0f1ea] px-3 py-2.5 dark:border-[#1c2632]">
          <StatusPill tone={item.scope === 'cloud' ? 'info' : 'neutral'} size="sm">{scopeText(item.scope)}</StatusPill>
        </td>
        <td className="max-w-[180px] border-b border-[#f0f1ea] px-3 py-2.5 text-[12px] text-[#54554e] dark:border-[#1c2632] dark:text-gray-300">{item.trigger}</td>
        <td className="border-b border-[#f0f1ea] px-3 py-2.5 text-[12px] text-[#686962] dark:border-[#1c2632] dark:text-gray-400">{item.lastRun}</td>
        <td className="border-b border-[#f0f1ea] px-3 py-2.5 text-[12px] text-[#686962] dark:border-[#1c2632] dark:text-gray-400">{item.successRate}</td>
        <td className="border-b border-[#f0f1ea] px-3 py-2.5 dark:border-[#1c2632]">
          <StatusPill tone={riskTone(item.riskLevel)} size="sm">{riskText(item.riskLevel)}</StatusPill>
        </td>
      </tr>
      {open ? (
        <tr className="bg-[#fafbf6] dark:bg-[#0f1722]">
          <td colSpan={7} className="border-b border-[#e6e7df] px-4 py-3 dark:border-[#263142]">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <p className="text-[13px] leading-6 text-[#3f4039] dark:text-gray-200">{item.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusPill tone={item.autoRun ? 'info' : 'neutral'} size="sm">自动执行：{item.autoRun ? '是' : '否'}</StatusPill>
                  <StatusPill tone={item.reviewRequired ? 'warning' : 'success'} size="sm">人工审核：{item.reviewRequired ? '是' : '否'}</StatusPill>
                  {(item.artifacts || []).map((artifact) => (
                    <span key={artifact} className="rounded border border-[#d9dbd1] px-2 py-0.5 font-mono text-[11px] text-[#6b6d61] dark:border-[#263142] dark:text-gray-400">
                      {artifact}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-[#686962] dark:text-gray-400">
                  <span>仓库：<code className="font-mono">{item.repository || '—'}</code></span>
                  <span>入口：<code className="font-mono break-all">{item.entry || '—'}</code></span>
                </div>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                {item.adminHref ? (
                  <AdminButton href={item.adminHref} size="sm">进入管理</AdminButton>
                ) : null}
                {String(item.entry || '').startsWith('http') ? (
                  <AdminButton href={item.entry} target="_blank" rel="noreferrer" size="sm">打开入口</AdminButton>
                ) : null}
                <AdminButton type="button" size="sm" onClick={() => onCopy(item.id, item.registryText)}>
                  {copied === item.id ? '已复制' : '复制任务字段'}
                </AdminButton>
                {item.pausable ? (
                  <AdminButton type="button" size="sm" onClick={() => onToggle(item)} disabled={toggling}>
                    {toggling ? '处理中…' : item.status === 'paused' ? '恢复执行' : '暂停'}
                  </AdminButton>
                ) : null}
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
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

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-[#d5d7cd] bg-white/70 px-4 py-2.5 dark:border-[#252e39] dark:bg-[#10161f]">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#858779] dark:text-[#8e9ab0]">{label}</div>
      <div className="mt-0.5 text-xl font-semibold text-[#15140f] dark:text-gray-100">{value}</div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'

import { AdminButton, AdminPage, StatusPill } from '../../components/ui'

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

function toneFor(status) {
  if (status === 'reachable' || status === 'access') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
  }
  if (status === 'down' || status === 'warning') {
    return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
  }
  return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
}

function statusText(status) {
  return (
    {
      success: '成功',
      failed: '失败',
      running: '运行中',
      never_run: '未运行',
    }[status] || status || '未运行'
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

export default function OpsConsoleClient() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [copyError, setCopyError] = useState('')

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

  const tone = toneFor(status?.status)
  const registry = status?.registry || []
  const cloudAutomations = status?.cloudAutomations || []
  const localAutomations = status?.localAutomations || []
  const recentRuns = status?.recentRuns || []
  const stats = status?.stats || {}

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

  return (
    <AdminPage
      title="自动化控制台"
      maxWidth="1180px"
      description="统一登记云端与本地自动化，固定追踪入口、触发频率、最近运行、成功率、产物、风险和审核策略。"
      actions={
        <div className="flex flex-wrap gap-2">
          <AdminButton href={status?.localUrl || 'http://localhost:4179'} target="_blank" rel="noreferrer">
            本机控制台
          </AdminButton>
          <AdminButton href={status?.externalUrl || 'https://ops.2aran.com/'} target="_blank" rel="noreferrer">
            Tunnel 入口
          </AdminButton>
          <AdminButton type="button" onClick={refresh} disabled={loading}>
            {loading ? '检查中…' : '重新检查'}
          </AdminButton>
        </div>
      }
    >

      {error ? (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {copyError ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          复制失败：{copyError}
        </div>
      ) : null}

      <section className={`mb-5 rounded-xl border px-5 py-4 ${tone}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">Current Status</p>
            <h2 className="mt-1 text-2xl font-semibold">{loading ? '检查中' : status?.label || '未知'}</h2>
            <p className="mt-2 text-sm leading-6 opacity-85">{status?.message || '正在检查自动化注册表。'}</p>
            <p className="mt-2 font-mono text-xs opacity-70">{status?.root || '/Users/tuaran/Documents/codex/agent-ops'}</p>
          </div>
          <span
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#15140f] px-4 text-sm font-medium text-white no-underline transition hover:bg-[#2f3027] dark:bg-gray-100 dark:text-[#111827] dark:hover:bg-white"
          >
            /admin/ops
          </span>
        </div>
      </section>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="自动化总数" value={loading ? '—' : stats.totalTasks ?? '—'} />
        <Stat label="云端自动化" value={loading ? '—' : stats.cloudTasks ?? '—'} />
        <Stat label="本地自动化" value={loading ? '—' : stats.localTasks ?? '—'} />
        <Stat label="需人工审核" value={loading ? '—' : stats.reviewRequired ?? '—'} />
      </section>

      <section className="mb-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#d5d7cd] bg-white/70 p-5 dark:border-[#252e39] dark:bg-[#10161f]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#15140f] dark:text-gray-100">云端自动化</h2>
              <p className="mt-1 text-sm text-[#686962] dark:text-gray-400">运行在 GitHub / Cloudflare / 站点云端链路，重点看限流、频率和回滚。</p>
            </div>
            <AdminButton
              type="button"
              size="sm"
              onClick={() => copyText('cloud-registry', JSON.stringify(cloudAutomations, null, 2))}
              disabled={!cloudAutomations.length}
            >
              {copied === 'cloud-registry' ? '已复制' : '复制云端台账'}
            </AdminButton>
          </div>

          <div className="mt-4 grid gap-3">
            {cloudAutomations.map((item) => (
              <AutomationCard key={item.id} item={item} copied={copied} onCopy={copyText} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#d5d7cd] bg-white/70 p-5 dark:border-[#252e39] dark:bg-[#10161f]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#15140f] dark:text-gray-100">本地自动化</h2>
              <p className="mt-1 text-sm text-[#686962] dark:text-gray-400">运行在本机或 worktree，重点看人工审核、产物落盘和权限边界。</p>
            </div>
            <AdminButton
              type="button"
              size="sm"
              onClick={() => copyText('local-registry', JSON.stringify(localAutomations, null, 2))}
              disabled={!localAutomations.length}
            >
              {copied === 'local-registry' ? '已复制' : '复制本地台账'}
            </AdminButton>
          </div>

          <div className="mt-4 grid gap-3">
            {localAutomations.map((item) => (
              <AutomationCard key={item.id} item={item} copied={copied} onCopy={copyText} />
            ))}
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-xl border border-[#d5d7cd] bg-white/70 p-5 dark:border-[#252e39] dark:bg-[#10161f]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#15140f] dark:text-gray-100">Automation Registry 字段</h2>
            <p className="mt-1 text-sm text-[#686962] dark:text-gray-400">所有自动化统一按固定字段入库，后续再接真实运行状态回写。</p>
          </div>
          <AdminButton type="button" size="sm" onClick={() => copyText('registry', JSON.stringify(registry, null, 2))} disabled={!registry.length}>
            {copied === 'registry' ? '已复制' : '复制完整台账'}
          </AdminButton>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.12em] text-[#7a7c70] dark:text-[#8e9ab0]">
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">id</th>
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">名称</th>
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">云端或本地</th>
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">触发频率</th>
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">入口</th>
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">最近运行</th>
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">成功率</th>
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">产物</th>
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">风险</th>
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">自动执行</th>
                <th className="border-b border-[#e6e7df] px-3 py-2 dark:border-[#263142]">人工审核</th>
              </tr>
            </thead>
            <tbody>
              {registry.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="border-b border-[#f0f1ea] px-3 py-3 font-mono text-xs text-[#686962] dark:border-[#1c2632] dark:text-gray-400">{item.id}</td>
                  <td className="border-b border-[#f0f1ea] px-3 py-3 font-medium text-[#15140f] dark:border-[#1c2632] dark:text-gray-100">{item.name}</td>
                  <td className="border-b border-[#f0f1ea] px-3 py-3 dark:border-[#1c2632]">{scopeText(item.scope)}</td>
                  <td className="border-b border-[#f0f1ea] px-3 py-3 dark:border-[#1c2632]">{item.trigger}</td>
                  <td className="max-w-[180px] border-b border-[#f0f1ea] px-3 py-3 font-mono text-xs dark:border-[#1c2632]">{item.entry}</td>
                  <td className="border-b border-[#f0f1ea] px-3 py-3 dark:border-[#1c2632]">{item.lastRun}</td>
                  <td className="border-b border-[#f0f1ea] px-3 py-3 dark:border-[#1c2632]">{item.successRate}</td>
                  <td className="border-b border-[#f0f1ea] px-3 py-3 dark:border-[#1c2632]">{(item.artifacts || []).join(' / ')}</td>
                  <td className="border-b border-[#f0f1ea] px-3 py-3 dark:border-[#1c2632]"><StatusPill tone={riskTone(item.riskLevel)} size="sm">{riskText(item.riskLevel)}</StatusPill></td>
                  <td className="border-b border-[#f0f1ea] px-3 py-3 dark:border-[#1c2632]">{item.autoRun ? '是' : '否'}</td>
                  <td className="border-b border-[#f0f1ea] px-3 py-3 dark:border-[#1c2632]">{item.reviewRequired ? '是' : '否'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-5 rounded-xl border border-[#d5d7cd] bg-white/70 p-5 dark:border-[#252e39] dark:bg-[#10161f]">
        <h2 className="text-base font-semibold text-[#15140f] dark:text-gray-100">最近运行</h2>
        <p className="mt-1 text-sm text-[#686962] dark:text-gray-400">当前先接入本地任务最近运行快照；云端状态回写后会合并到这里。</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {recentRuns.map((run) => (
            <article key={run.id} className="rounded-lg border border-[#d9dbd1] bg-[#fbfbf7] p-3 dark:border-[#263142] dark:bg-[#0c1118]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#15140f] dark:text-gray-100">{run.taskName}</h3>
                  <p className="mt-1 font-mono text-[11px] text-[#77796d] dark:text-gray-500">{run.taskId}</p>
                </div>
                <StatusPill tone={runTone(run.status)} size="sm">{statusText(run.status)}</StatusPill>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#686962] dark:text-gray-400">
                <span>{formatTime(run.startedAt)}</span>
                <span>{formatDuration(run.durationMs)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill tone={reviewTone(run.reviewStatus)} size="sm">{reviewText(run.reviewStatus)}</StatusPill>
                {(run.artifacts || []).slice(0, 3).map((artifact) => (
                  <span key={artifact} className="rounded border border-[#d9dbd1] px-2 py-0.5 font-mono text-[11px] text-[#6b6d61] dark:border-[#263142] dark:text-gray-400">
                    {artifact}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="路由" value={loading ? '—' : status?.route || '/admin/ops'} compact />
        <Stat label="延迟" value={loading || status?.latencyMs == null ? '—' : `${status.latencyMs} ms`} />
        <Stat label="检查时间" value={formatTime(status?.checkedAt)} compact />
      </section>

      <section className="mt-5 rounded-xl border border-[#d5d7cd] bg-white/70 p-5 dark:border-[#252e39] dark:bg-[#10161f]">
        <h2 className="text-base font-semibold text-[#15140f] dark:text-gray-100">访问链路</h2>
        <ol className="mt-4 space-y-3 text-sm leading-6 text-[#51514a] dark:text-gray-300">
          <Step title="1. Automation Registry" body="先统一登记所有自动化资产，字段固定，后续才能做状态回写、审计和调度。" />
          <Step title="2. 云端自动化" body="GitHub follow、FrontendNext 小时抓取、每日汇总归入云端列，重点管 API 限流、触发频率和回滚。" />
          <Step title="3. 本地自动化" body="Medium 翻译、OpenClaw PR、数字员工周报、内容分发、客户雷达、指标报告和 EmployeeHub 巡检都作为本地任务同级登记。" />
        </ol>
      </section>
    </AdminPage>
  )
}

function AutomationCard({ item, copied, onCopy }) {
  return (
    <article className="rounded-lg border border-[#d9dbd1] bg-[#fbfbf7] p-4 dark:border-[#263142] dark:bg-[#0c1118]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#15140f] dark:text-gray-100">{item.name}</h3>
          <p className="mt-1 font-mono text-xs text-[#77796d] dark:text-gray-500">{item.id}</p>
        </div>
        <StatusPill tone={item.scope === 'cloud' ? 'info' : 'neutral'} size="sm">
          {scopeText(item.scope)}
        </StatusPill>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#54554e] dark:text-gray-300">{item.description}</p>
      <div className="mt-3 grid gap-2 text-xs text-[#686962] dark:text-gray-400 sm:grid-cols-2">
        <InfoLine label="触发" value={item.trigger} />
        <InfoLine label="最近" value={item.lastRun} />
        <InfoLine label="成功率" value={item.successRate} />
        <InfoLine label="入口" value={item.entry} mono />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill tone={riskTone(item.riskLevel)} size="sm">{riskText(item.riskLevel)}</StatusPill>
        <StatusPill tone={item.autoRun ? 'info' : 'neutral'} size="sm">自动执行：{item.autoRun ? '是' : '否'}</StatusPill>
        <StatusPill tone={item.reviewRequired ? 'warning' : 'success'} size="sm">人工审核：{item.reviewRequired ? '是' : '否'}</StatusPill>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(item.artifacts || []).map((artifact) => (
          <span key={artifact} className="rounded border border-[#d9dbd1] px-2 py-0.5 font-mono text-[11px] text-[#6b6d61] dark:border-[#263142] dark:text-gray-400">
            {artifact}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <AdminButton type="button" size="sm" onClick={() => onCopy(item.id, item.registryText)}>
          {copied === item.id ? '已复制' : '复制任务字段'}
        </AdminButton>
        {String(item.entry || '').startsWith('http') ? (
          <AdminButton href={item.entry} target="_blank" rel="noreferrer" size="sm">
            打开入口
          </AdminButton>
        ) : null}
      </div>
    </article>
  )
}

function InfoLine({ label, value, mono = false }) {
  return (
    <div className="min-w-0 rounded border border-[#e6e7df] bg-white/70 px-2 py-1.5 dark:border-[#1f2a37] dark:bg-[#111821]">
      <span className="mr-2 text-[#858779] dark:text-gray-500">{label}</span>
      <span className={`break-words ${mono ? 'font-mono text-[11px]' : ''}`}>{value || '—'}</span>
    </div>
  )
}

function Stat({ label, value, compact = false }) {
  return (
    <div className="rounded-xl border border-[#d5d7cd] bg-white/70 px-4 py-3 dark:border-[#252e39] dark:bg-[#10161f]">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#858779] dark:text-[#8e9ab0]">{label}</div>
      <div className={`mt-1 font-semibold text-[#15140f] dark:text-gray-100 ${compact ? 'text-sm' : 'text-2xl'}`}>{value}</div>
    </div>
  )
}

function Step({ title, body }) {
  return (
    <li className="border-l-2 border-[#cbcdc2] pl-3 dark:border-[#2d3744]">
      <b className="block text-[#15140f] dark:text-gray-100">{title}</b>
      <span>{body}</span>
    </li>
  )
}

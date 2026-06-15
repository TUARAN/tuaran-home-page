'use client'

import { useCallback, useEffect, useState } from 'react'

import { AdminPage } from '../../components/ui'

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

function toneFor(status) {
  if (status === 'reachable' || status === 'access') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
  }
  if (status === 'down' || status === 'warning') {
    return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
  }
  return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
}

export default function OpsConsoleClient() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <AdminPage
      title="自动化控制台"
      maxWidth="960px"
      description="Ops 已收敛到本站 admin 路由。访问控制复用站内 owner session，不再经过独立子域和 Cloudflare Access。"
      actions={
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-[#caccc0] bg-white px-3 text-sm font-medium text-[#53554d] transition hover:border-[#818472] hover:text-[#15140f] disabled:opacity-50 dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300 dark:hover:border-[#4a5568]"
        >
          {loading ? '检查中…' : '重新检查'}
        </button>
      }
    >

      {error ? (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <section className={`mb-5 rounded-xl border px-5 py-4 ${tone}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">Current Status</p>
            <h2 className="mt-1 text-2xl font-semibold">{loading ? '检查中' : status?.label || '未知'}</h2>
            <p className="mt-2 text-sm leading-6 opacity-85">{status?.message || '正在检查站内 Ops 入口。'}</p>
          </div>
          <span
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#15140f] px-4 text-sm font-medium text-white no-underline transition hover:bg-[#2f3027] dark:bg-gray-100 dark:text-[#111827] dark:hover:bg-white"
          >
            /admin/ops
          </span>
        </div>
      </section>

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Stat label="路由" value={loading ? '—' : status?.route || '/admin/ops'} compact />
        <Stat label="延迟" value={loading || status?.latencyMs == null ? '—' : `${status.latencyMs} ms`} />
        <Stat label="检查时间" value={formatTime(status?.checkedAt)} compact />
      </section>

      <section className="rounded-xl border border-[#d5d7cd] bg-white/70 p-5 dark:border-[#252e39] dark:bg-[#10161f]">
        <h2 className="text-base font-semibold text-[#15140f] dark:text-gray-100">访问链路</h2>
        <ol className="mt-4 space-y-3 text-sm leading-6 text-[#51514a] dark:text-gray-300">
          <Step title="1. /admin/ops" body="所有入口统一落在本站后台路由，旧子域只做 301 回流。" />
          <Step title="2. Owner Gate" body="页面和 API 复用站内 tuaran_session，只允许 owner 账号访问。" />
          <Step title="3. Admin API" body="/api/admin/ops-console 只在 owner 校验通过后返回状态，避免再叠加外部 Access 权限。" />
        </ol>
      </section>
    </AdminPage>
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

'use client'

import { useCallback, useEffect, useState } from 'react'

const OPS_URL = 'https://ops.2aran.com/'

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
    <main className="mx-auto w-full max-w-[960px] px-4 py-8 md:py-12">
      <header className="mb-8">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#9c8f79] dark:text-[#8e9ab0]">
          Admin · Agent Ops
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mb-2 font-serif text-[1.9rem] font-semibold text-[#221f19] dark:text-gray-100 md:text-[2.2rem]">
              自动化控制台
            </h1>
            <p className="mb-0 max-w-[44rem] text-[14px] leading-7 text-[#5d554a] dark:text-gray-300">
              这是外部 Agent Ops 控制台的站内入口。它依赖 Cloudflare Access、Cloudflare Tunnel 和本机
              <code className="mx-1 rounded bg-[#f4ede0] px-1 py-px font-mono text-[11px] dark:bg-[#19212b]">127.0.0.1:4179</code>
              服务，不是主站自己的 Next 页面。
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-[#dcd3c0] bg-white px-3 text-sm font-medium text-[#5f5a4d] transition hover:border-[#9c8e72] hover:text-[#221f19] disabled:opacity-50 dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300 dark:hover:border-[#4a5568]"
          >
            {loading ? '检查中…' : '重新检查'}
          </button>
        </div>
      </header>

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
            <p className="mt-2 text-sm leading-6 opacity-85">{status?.message || '正在检查 Agent Ops 外部入口。'}</p>
          </div>
          <a
            href={OPS_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#221f19] px-4 text-sm font-medium text-white no-underline transition hover:bg-[#3f3527] dark:bg-gray-100 dark:text-[#111827] dark:hover:bg-white"
          >
            打开外部控制台 ↗
          </a>
        </div>
      </section>

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Stat label="HTTP" value={loading ? '—' : status?.httpStatus || '—'} />
        <Stat label="延迟" value={loading || status?.latencyMs == null ? '—' : `${status.latencyMs} ms`} />
        <Stat label="检查时间" value={formatTime(status?.checkedAt)} compact />
      </section>

      <section className="rounded-xl border border-[#e5dccd] bg-white/70 p-5 dark:border-[#252e39] dark:bg-[#10161f]">
        <h2 className="text-base font-semibold text-[#221f19] dark:text-gray-100">链路拆解</h2>
        <ol className="mt-4 space-y-3 text-sm leading-6 text-[#5d554a] dark:text-gray-300">
          <Step title="1. 站内入口" body="当前页面只负责说明状态和提供跳转，不直接承载自动化控制台。" />
          <Step title="2. Cloudflare Access" body="外部入口会先跳到 Cloudflare Access。这里检查到 Access 跳转，说明域名和边缘鉴权入口是通的。" />
          <Step title="3. Cloudflare Tunnel" body="登录后请求才会进入 tunnel。若浏览器显示 ERR_CONNECTION_CLOSED，通常要检查网络、VPN、Access 登录域或 tunnel 稳定性。" />
          <Step title="4. 本机 Agent Ops" body="最终服务在你的 Mac 本机 127.0.0.1:4179。Mac 休眠、服务没起、tunnel 断线都会导致外部入口不可用。" />
        </ol>
      </section>
    </main>
  )
}

function Stat({ label, value, compact = false }) {
  return (
    <div className="rounded-xl border border-[#e5dccd] bg-white/70 px-4 py-3 dark:border-[#252e39] dark:bg-[#10161f]">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9c8f79] dark:text-[#8e9ab0]">{label}</div>
      <div className={`mt-1 font-semibold text-[#221f19] dark:text-gray-100 ${compact ? 'text-sm' : 'text-2xl'}`}>{value}</div>
    </div>
  )
}

function Step({ title, body }) {
  return (
    <li className="border-l-2 border-[#ddd3c2] pl-3 dark:border-[#2d3744]">
      <b className="block text-[#221f19] dark:text-gray-100">{title}</b>
      <span>{body}</span>
    </li>
  )
}

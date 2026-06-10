'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

import { ADMIN_CONSOLE_ITEMS, ADMIN_PRIVATE_TOOL_LINKS } from '../../../lib/adminRoutes'

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function toneForDb(status) {
  if (status === 'connected') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
  }
  if (status === 'unavailable') {
    return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
  }
  return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
}

function toneForOps(status) {
  if (status === 'reachable' || status === 'access') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
  }
  if (status === 'down') {
    return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
  }
  return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
}

function dbLabel(snapshot) {
  if (!snapshot) return '加载中'
  if (snapshot.status === 'connected') return 'D1 已连接'
  if (snapshot.status === 'unavailable') return 'D1 未绑定'
  return 'D1 异常'
}

function opsLabel(status) {
  if (!status) return '加载中'
  return status.label || status.status || '—'
}

export default function AdminDashboardClient() {
  const [dbSnapshot, setDbSnapshot] = useState(null)
  const [opsStatus, setOpsStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [dbRes, opsRes] = await Promise.all([
        fetch('/api/admin/db', { cache: 'no-store', credentials: 'same-origin' }),
        fetch('/api/admin/ops-console', { cache: 'no-store', credentials: 'same-origin' }),
      ])
      const [dbData, opsData] = await Promise.all([safeJson(dbRes), safeJson(opsRes)])
      if (!dbRes.ok) throw new Error(dbData?.error || `DB_HTTP_${dbRes.status}`)
      if (!opsRes.ok) throw new Error(opsData?.error || `OPS_HTTP_${opsRes.status}`)
      setDbSnapshot(dbData)
      setOpsStatus(opsData)
    } catch (e) {
      setError(e?.message || 'FETCH_FAILED')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const tableCount = Array.isArray(dbSnapshot?.tables) ? dbSnapshot.tables.length : null

  return (
    <main className="mx-auto w-full max-w-[1080px] px-4 py-8 md:py-12">
      <header className="mb-8">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#858779] dark:text-[#8e9ab0]">
          Admin · Dashboard
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mb-2 font-serif text-[1.9rem] font-semibold text-[#15140f] dark:text-gray-100 md:text-[2.2rem]">
              后台总览
            </h1>
            <p className="mb-0 max-w-[44rem] text-[14px] leading-7 text-[#51514a] dark:text-gray-300">
              站长控制台统一入口。配置与观测走 /admin；日常私有工具仍留在主站对应路径。
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-[#caccc0] bg-white px-3 text-sm font-medium text-[#53554d] transition hover:border-[#818472] hover:text-[#15140f] disabled:opacity-50 dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300 dark:hover:border-[#4a5568]"
          >
            {loading ? '刷新中…' : '刷新状态'}
          </button>
        </div>
      </header>

      {error ? (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/db"
          className={`block rounded-xl border px-5 py-4 transition hover:opacity-90 ${toneForDb(dbSnapshot?.status)}`}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-80">Database</p>
          <p className="mt-2 text-lg font-semibold">{dbLabel(dbSnapshot)}</p>
          <p className="mt-1 text-sm opacity-90">
            {tableCount != null ? `${tableCount} 张表` : '—'}
            {dbSnapshot?.database?.name ? ` · ${dbSnapshot.database.name}` : ''}
          </p>
        </Link>
        <Link
          href="/admin/ops"
          className={`block rounded-xl border px-5 py-4 transition hover:opacity-90 ${toneForOps(opsStatus?.status)}`}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-80">Agent Ops</p>
          <p className="mt-2 text-lg font-semibold">{opsLabel(opsStatus)}</p>
          <p className="mt-1 text-sm opacity-90">
            ops.2aran.com
            {opsStatus?.latencyMs != null ? ` · ${opsStatus.latencyMs}ms` : ''}
          </p>
        </Link>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 font-serif text-xl font-semibold text-[#15140f] dark:text-gray-100">管理控制台</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {ADMIN_CONSOLE_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-[#d8dad0] bg-white px-4 py-4 transition hover:border-[#a8aa9c] dark:border-[#1e2733] dark:bg-[#10161f] dark:hover:border-[#3d4a5c]"
            >
              <p className="font-medium text-[#15140f] dark:text-gray-100">{item.label}</p>
              <p className="mt-1 text-[13px] leading-6 text-[#51514a] dark:text-gray-400">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-serif text-xl font-semibold text-[#15140f] dark:text-gray-100">主站私有工具</h2>
        <p className="mb-4 text-[13px] text-[#67695d] dark:text-gray-400">
          高频日常工具不迁入 admin 子域，此处仅作快捷入口。
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ADMIN_PRIVATE_TOOL_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-dashed border-[#caccc0] bg-[#fafbf7] px-4 py-4 transition hover:border-[#a8aa9c] dark:border-[#2d3744] dark:bg-[#0d1218] dark:hover:border-[#4a5568]"
            >
              <p className="font-medium text-[#15140f] dark:text-gray-100">{item.label}</p>
              <p className="mt-1 text-[13px] leading-6 text-[#51514a] dark:text-gray-400">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

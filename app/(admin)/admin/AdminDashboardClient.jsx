'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { IconRefresh, IconUserCircle, IconTypography, IconArrowRight } from '@tabler/icons-react'

import { ADMIN_CONSOLE_ITEMS, ADMIN_PRIVATE_TOOL_LINKS } from '../../../lib/adminRoutes'
import { AdminIcon } from '../../../lib/adminIcons'
import { AdminPage, Section, StatCard, AdminButton, EmptyState } from '../components/ui'

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function dbTone(status) {
  if (status === 'connected') return 'success'
  if (status === 'unavailable' || status === 'unknown') return 'warning'
  return 'danger'
}

function opsTone(status) {
  if (status === 'reachable' || status === 'access') return 'success'
  if (status === 'down') return 'danger'
  return 'warning'
}

function dbValue(db) {
  if (!db) return '—'
  if (db.status === 'connected') return db.tables != null ? db.tables : '已连接'
  if (db.status === 'unavailable') return '未绑定'
  return '异常'
}

function dbSub(db) {
  if (!db) return '加载中'
  if (db.status === 'connected') return `${db.tables != null ? `${db.tables} 张表` : 'D1'}${db.name ? ` · ${db.name}` : ''}`
  if (db.status === 'unavailable') return '当前环境无 D1 绑定'
  return 'D1 状态异常'
}

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

const providerLabels = { github: 'GitHub', google: 'Google', email: '邮箱' }

export default function AdminDashboardClient() {
  const [overview, setOverview] = useState(null)
  const [ops, setOps] = useState(null)
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [loadingOps, setLoadingOps] = useState(true)
  const [error, setError] = useState('')

  // 总览与 Ops 各自独立加载：谁先回谁先显示，不让某个慢接口拖黑整屏。
  const loadOverview = useCallback(async () => {
    setLoadingOverview(true)
    setError('')
    try {
      const res = await fetch('/api/admin/overview', { cache: 'no-store', credentials: 'same-origin' })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data?.error || `OVERVIEW_HTTP_${res.status}`)
      setOverview(data)
    } catch (e) {
      setError(e?.message || 'FETCH_FAILED')
    } finally {
      setLoadingOverview(false)
    }
  }, [])

  const loadOps = useCallback(async () => {
    setLoadingOps(true)
    try {
      const res = await fetch('/api/admin/ops-console', { cache: 'no-store', credentials: 'same-origin' })
      setOps(await safeJson(res))
    } catch {
      // Ops 状态卡失败不阻断总览，卡片回落到「—」
    } finally {
      setLoadingOps(false)
    }
  }, [])

  const refresh = useCallback(() => {
    loadOverview()
    loadOps()
  }, [loadOverview, loadOps])

  const busy = loadingOverview || loadingOps

  useEffect(() => {
    refresh()
  }, [refresh])

  const pv = overview?.pv
  const users = overview?.users
  const db = overview?.db
  const recentUsers = overview?.recent?.users || []
  const activeStyle = overview?.recent?.style || null

  return (
    <AdminPage
      title="后台总览"
      description="站点状态、近期变更与快捷操作一屏可见。配置、观测、项目治理与长期罗盘走左侧导航。"
      actions={
        <AdminButton onClick={refresh} disabled={busy}>
          <IconRefresh size={16} aria-hidden="true" />
          {busy ? '刷新中…' : '刷新状态'}
        </AdminButton>
      }
    >
      {error ? (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="注册用户"
          value={users?.count != null ? users.count : '—'}
          sub="登录过的全部账号"
          icon="users"
          href="/admin/users"
        />
        <StatCard
          label="今日 PV"
          value={pv?.today != null ? pv.today : '—'}
          sub={pv?.total != null ? `累计 ${pv.total.toLocaleString('zh-CN')}` : '调研文章阅读量'}
          icon="analytics"
        />
        <StatCard
          label="D1 数据库"
          value={dbValue(db)}
          sub={dbSub(db)}
          icon="database"
          tone={dbTone(db?.status)}
          href="/admin/db"
        />
        <StatCard
          label="Ops 入口"
          value={ops?.label || '—'}
          sub={ops?.latencyMs != null ? `/admin/ops · ${ops.latencyMs}ms` : '/admin/ops'}
          icon="ops"
          tone={opsTone(ops?.status)}
          href="/admin/ops"
        />
      </div>

      <div className="mb-7">
        <Section title="最近活动" description="登录目录与生效规则的近期变化">
          {recentUsers.length || activeStyle ? (
            <ul className="divide-y divide-[#f1f2ec] dark:divide-[#161e29]">
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                  {u.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.image} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full border border-[#e2e6ee] object-cover dark:border-gray-700" />
                  ) : (
                    <IconUserCircle size={28} className="shrink-0 text-[#b6b8ab] dark:text-[#4a5668]" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[#3f4039] dark:text-gray-200">{u.name}</p>
                    <p className="truncate text-[11px] text-[#82847a] dark:text-gray-500">
                      {providerLabels[u.provider] || u.provider || '—'} · 活跃于 {formatTime(u.lastSeenAt)}
                    </p>
                  </div>
                </li>
              ))}
              {activeStyle ? (
                <li className="flex items-center gap-3 py-2.5">
                  <IconTypography size={28} className="shrink-0 text-[#b6b8ab] dark:text-[#4a5668]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[#3f4039] dark:text-gray-200">
                      调研风格生效版本：{activeStyle.label}
                    </p>
                    <p className="truncate text-[11px] text-[#82847a] dark:text-gray-500">
                      {activeStyle.id} · {activeStyle.date}
                    </p>
                  </div>
                </li>
              ) : null}
            </ul>
          ) : (
            <EmptyState title={loadingOverview ? '加载中…' : '暂无近期活动'} description={loadingOverview ? undefined : '用户登录或规则更新后会显示在这里。'} />
          )}
        </Section>
      </div>

      <Section title="全部控制台" description="左侧导航也可直达；这里按域汇总。">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {ADMIN_CONSOLE_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-3 rounded-lg border border-[#e2e3da] bg-white px-3.5 py-3 transition hover:border-[#b9bbad] dark:border-[#1e2733] dark:bg-[#10161f] dark:hover:border-[#34414f]"
            >
              <AdminIcon name={item.icon} size={18} className="mt-0.5 shrink-0 text-[#7a7c70] dark:text-[#7c8aa0]" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-[13.5px] font-medium text-[#15140f] dark:text-gray-100">
                  {item.label}
                  <IconArrowRight size={14} className="opacity-0 transition group-hover:opacity-60" aria-hidden="true" />
                </p>
                <p className="mt-0.5 text-[12px] leading-5 text-[#67695d] dark:text-gray-400">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <div className="mt-6">
        <h2 className="mb-3 font-serif text-[1.05rem] font-semibold text-[#15140f] dark:text-gray-100">主站私有工具</h2>
        <p className="mb-3 text-[12.5px] text-[#67695d] dark:text-gray-400">高频日常工具不迁入 admin 子域，此处仅作快捷入口。</p>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {ADMIN_PRIVATE_TOOL_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-dashed border-[#caccc0] bg-[#fafbf7] px-3.5 py-3 transition hover:border-[#a8aa9c] dark:border-[#2d3744] dark:bg-[#0d1218] dark:hover:border-[#4a5568]"
            >
              <p className="text-[13.5px] font-medium text-[#15140f] dark:text-gray-100">{item.label}</p>
              <p className="mt-0.5 text-[12px] leading-5 text-[#67695d] dark:text-gray-400">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </AdminPage>
  )
}

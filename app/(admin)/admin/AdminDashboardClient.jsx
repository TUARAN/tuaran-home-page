'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  IconArrowRight,
  IconChevronRight,
  IconRefresh,
  IconTypography,
  IconUserCircle,
} from '@tabler/icons-react'

import {
  ADMIN_CONSOLE_ITEMS,
  ADMIN_HOST,
  ADMIN_PRIVATE_TOOL_LINKS,
  CANONICAL_HOST,
} from '../../../lib/adminRoutes'
import { AdminIcon } from '../../../lib/adminIcons'
import { AdminButton, AdminPage, EmptyState } from '../components/ui'

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
  if (db.status === 'connected') return db.tables != null ? db.tables : '正常'
  if (db.status === 'unavailable') return '未绑定'
  return '异常'
}

function dbSub(db) {
  if (!db) return '加载中'
  if (db.status === 'connected') return db.tables != null ? `${db.tables} 张表` : 'D1 已连接'
  if (db.status === 'unavailable') return '当前环境无 D1'
  return '连接异常'
}

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

const providerLabels = { github: 'GitHub', google: 'Google', email: '邮箱' }

const toneClasses = {
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-rose-600 dark:text-rose-400',
  neutral: 'text-[#15140f] dark:text-gray-100',
}

function DashboardMetric({ label, value, sub, icon, tone = 'neutral', href, index }) {
  const body = (
    <>
      <span className="flex items-center gap-2 text-[11.5px] font-medium text-[#77796d] dark:text-gray-400">
        <AdminIcon name={icon} size={15} className={toneClasses[tone]} />
        {label}
      </span>
      <span className={`mt-2 block text-[1.45rem] font-semibold leading-none tabular-nums ${toneClasses[tone]}`}>
        {value}
      </span>
      <span className="mt-1.5 block truncate text-[11px] text-[#929487] dark:text-gray-500">{sub}</span>
    </>
  )
  const dividerClass = index === 0
    ? ''
    : index === 1
      ? 'border-l border-[#e6e7df] dark:border-[#1b2430]'
      : index === 4
        ? 'col-span-2 border-t border-[#e6e7df] dark:border-[#1b2430] md:col-span-1 md:border-l md:border-t-0'
        : index % 2 === 1
          ? 'border-l border-t border-[#e6e7df] dark:border-[#1b2430] md:border-t-0'
          : 'border-t border-[#e6e7df] dark:border-[#1b2430] md:border-l md:border-t-0'
  const className = `group min-w-0 px-4 py-3.5 transition hover:bg-[#f8f8f4] dark:hover:bg-[#131b25] ${dividerClass}`

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

function WorkspaceCard({ item, index, onAdminHost }) {
  const externalHop = item.external && onAdminHost
  const href = externalHop ? `https://${CANONICAL_HOST}${item.href}` : item.href
  const quickLinks = (item.sections || [])
    .flatMap((section) => section.items || [])
    .filter((entry) => entry.sidebar !== false)
    .slice(0, 3)
  const dividerClass = index === 0
    ? ''
    : index === 1
      ? 'border-t border-[#eceee6] dark:border-[#1b2430] md:border-l md:border-t-0'
      : index % 2 === 1
        ? 'border-t border-[#eceee6] dark:border-[#1b2430] md:border-l'
        : 'border-t border-[#eceee6] dark:border-[#1b2430]'

  const title = externalHop ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#15140f] hover:text-[#666b54] dark:text-gray-100 dark:hover:text-[#a5b38e]"
    >
      {item.label}
      <IconArrowRight size={14} aria-hidden="true" />
    </a>
  ) : (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#15140f] hover:text-[#666b54] dark:text-gray-100 dark:hover:text-[#a5b38e]"
    >
      {item.label}
      <IconArrowRight size={14} aria-hidden="true" />
    </Link>
  )

  return (
    <article className={`group relative min-w-0 px-4 py-4 transition hover:bg-[#f8f8f4] dark:hover:bg-[#131b25] md:px-5 ${dividerClass}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eeefe7] text-[#696d59] dark:bg-[#19222d] dark:text-[#91a07d]">
          <AdminIcon name={item.icon} size={17} />
        </span>
        <div className="min-w-0 flex-1">
          {title}
          <p className="mt-1 line-clamp-1 text-[11.5px] leading-5 text-[#77796d] dark:text-gray-400">{item.desc}</p>
        </div>
      </div>

      {quickLinks.length ? (
        <nav aria-label={`${item.label}快捷入口`} className="mt-3 flex flex-wrap gap-x-3 gap-y-1 pl-11">
          {quickLinks.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="inline-flex items-center gap-0.5 text-[11px] text-[#67695d] hover:text-[#15140f] dark:text-gray-500 dark:hover:text-gray-200"
            >
              {entry.label}
              <IconChevronRight size={11} aria-hidden="true" />
            </Link>
          ))}
        </nav>
      ) : null}
    </article>
  )
}

export default function AdminDashboardClient() {
  const [overview, setOverview] = useState(null)
  const [ops, setOps] = useState(null)
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [loadingOps, setLoadingOps] = useState(true)
  const [error, setError] = useState('')
  const [onAdminHost, setOnAdminHost] = useState(false)

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
      // Ops 状态失败不阻断其余总览。
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

  useEffect(() => {
    setOnAdminHost(window.location.hostname === ADMIN_HOST)
  }, [])

  const pv = overview?.pv
  const uv = overview?.uv
  const users = overview?.users
  const db = overview?.db
  const recentUsers = overview?.recent?.users || []
  const activeStyle = overview?.recent?.style || null
  const systemHealthy = db?.status === 'connected' && ['reachable', 'access'].includes(ops?.status)
  const systemLabel = busy ? '正在同步' : systemHealthy ? '运行正常' : '需要留意'
  const systemTone = busy
    ? 'bg-[#eeefe7] text-[#77796d] dark:bg-[#19222d] dark:text-gray-400'
    : systemHealthy
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'

  return (
    <AdminPage
      title="后台总览"
      description="先看运行状态和近期变化，再进入对应工作区。"
      actions={
        <AdminButton onClick={refresh} disabled={busy}>
          <IconRefresh size={16} className={busy ? 'animate-spin' : ''} aria-hidden="true" />
          {busy ? '同步中…' : '刷新'}
        </AdminButton>
      }
    >
      {error ? (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="admin-section mb-5 overflow-hidden rounded-xl border" aria-labelledby="runtime-summary-title">
        <header className="flex items-center justify-between gap-3 px-4 py-3 md:px-5">
          <div className="min-w-0">
            <h2 id="runtime-summary-title" className="text-[13px] font-semibold text-[#15140f] dark:text-gray-100">
              运行摘要
            </h2>
            <p className="mt-0.5 text-[10.5px] text-[#929487] dark:text-gray-500">
              {overview?.generatedAt ? `更新于 ${formatTime(overview.generatedAt)}` : '正在获取最新状态'}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${systemTone}`}>
            {systemLabel}
          </span>
        </header>

        <div className="grid grid-cols-2 border-t border-[#e6e7df] dark:border-[#1b2430] md:grid-cols-5">
          <DashboardMetric index={0} label="注册用户" value={users?.count != null ? users.count : '—'} sub="全部登录账号" icon="users" href="/admin/users" />
          <DashboardMetric index={1} label="今日阅读" value={pv?.today != null ? pv.today : '—'} sub={pv?.total != null ? `累计 ${pv.total.toLocaleString('zh-CN')}` : '有效阅读'} icon="analytics" />
          <DashboardMetric index={2} label="今日读者" value={uv?.today != null ? uv.today : '—'} sub={uv?.total != null ? `累计 ${uv.total.toLocaleString('zh-CN')}` : '独立读者'} icon="users" />
          <DashboardMetric index={3} label="D1 数据库" value={dbValue(db)} sub={dbSub(db)} icon="database" tone={dbTone(db?.status)} href="/admin/db" />
          <DashboardMetric index={4} label="自动化" value={ops?.label || '—'} sub={ops?.latencyMs != null ? `${ops.latencyMs}ms 响应` : '运行台账'} icon="ops" tone={opsTone(ops?.status)} href="/admin/ops" />
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.75fr)]">
        <section className="admin-section overflow-hidden rounded-xl border" aria-labelledby="recent-activity-title">
          <header className="flex items-center justify-between gap-3 border-b border-[#e6e7df] px-4 py-3 dark:border-[#1b2430] md:px-5">
            <div>
              <h2 id="recent-activity-title" className="text-[13px] font-semibold text-[#15140f] dark:text-gray-100">最近活动</h2>
              <p className="mt-0.5 text-[10.5px] text-[#929487] dark:text-gray-500">登录与规则变更</p>
            </div>
            <Link href="/admin/users" className="text-[11px] text-[#67695d] hover:text-[#15140f] dark:text-gray-400 dark:hover:text-gray-100">用户目录</Link>
          </header>

          {recentUsers.length || activeStyle ? (
            <ul className="divide-y divide-[#eceee6] px-4 dark:divide-[#1b2430] md:px-5">
              {activeStyle ? (
                <li className="flex items-center gap-3 py-3">
                  <IconTypography size={25} className="shrink-0 text-[#a6a99a] dark:text-[#566376]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-[#3f4039] dark:text-gray-200">{activeStyle.label}</p>
                    <p className="mt-0.5 truncate text-[10.5px] text-[#929487] dark:text-gray-500">调研风格 · {activeStyle.date}</p>
                  </div>
                </li>
              ) : null}
              {recentUsers.slice(0, 4).map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-3">
                  {u.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.image} alt="" width={25} height={25} className="h-[25px] w-[25px] shrink-0 rounded-full border border-[#e2e6ee] object-cover dark:border-gray-700" />
                  ) : (
                    <IconUserCircle size={25} className="shrink-0 text-[#b6b8ab] dark:text-[#4a5668]" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-[#3f4039] dark:text-gray-200">{u.name}</p>
                    <p className="mt-0.5 truncate text-[10.5px] text-[#929487] dark:text-gray-500">
                      {providerLabels[u.provider] || u.provider || '—'} · {formatTime(u.lastSeenAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-5 md:px-5">
              <EmptyState title={loadingOverview ? '加载中…' : '暂无近期活动'} description={loadingOverview ? undefined : '用户登录或规则更新后会显示在这里。'} />
            </div>
          )}
        </section>

        <section className="admin-section overflow-hidden rounded-xl border" aria-labelledby="workspace-title">
          <header className="border-b border-[#e6e7df] px-4 py-3 dark:border-[#1b2430] md:px-5">
            <h2 id="workspace-title" className="text-[13px] font-semibold text-[#15140f] dark:text-gray-100">工作区</h2>
            <p className="mt-0.5 text-[10.5px] text-[#929487] dark:text-gray-500">进入管理域，或直接打开常用功能</p>
          </header>
          <div className="grid md:grid-cols-2">
            {ADMIN_CONSOLE_ITEMS.map((item, index) => (
              <WorkspaceCard key={item.href} item={item} index={index} onAdminHost={onAdminHost} />
            ))}
          </div>
        </section>
      </div>

      {ADMIN_PRIVATE_TOOL_LINKS.length ? (
        <section className="mt-5 border-t border-[#d9d9cf] pt-5 dark:border-[#26313e]">
          <h2 className="text-[13px] font-semibold text-[#15140f] dark:text-gray-100">主站私有工具</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {ADMIN_PRIVATE_TOOL_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border border-[#d9d9cf] px-3 py-2 text-[12px] text-[#53554d] hover:border-[#a8aa9c] dark:border-[#2d3744] dark:text-gray-300 dark:hover:border-[#4a5568]">
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </AdminPage>
  )
}

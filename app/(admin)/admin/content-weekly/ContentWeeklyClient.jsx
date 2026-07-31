'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconClock,
  IconEye,
  IconRefresh,
  IconRoute,
  IconUsers,
} from '@tabler/icons-react'

import { AdminButton, AdminPage, EmptyState, Section } from '../../components/ui'

const PERIODS = [
  { days: 1, label: '今日' },
  { days: 7, label: '近 7 天' },
  { days: 30, label: '近 30 天' },
  { days: 90, label: '近 90 天' },
]

const AUDIENCE_LABELS = { user: '登录用户', guest: '稳定游客', anonymous: '匿名访客' }
const AUDIENCE_COLORS = { user: 'bg-blue-500', guest: 'bg-emerald-500', anonymous: 'bg-stone-400' }
const SOURCE_LABELS = {
  direct: '直接访问', internal: '站内流转', organic: '自然搜索', social: '社交媒体',
  referral: '外部引荐', campaign: '活动投放', navigation: '站内导航', none: '无媒介',
}

async function safeJson(res) {
  try { return await res.json() } catch { return null }
}

function number(value, digits = 0) {
  const n = Number(value) || 0
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: digits }).format(n)
}

function percent(value) {
  return `${Math.round((Number(value) || 0) * 1000) / 10}%`
}

function formatDateTime(value, withDate = true) {
  if (!Number(value)) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    ...(withDate ? { month: '2-digit', day: '2-digit' } : {}),
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(Number(value)))
}

function periodLabel(days) {
  return PERIODS.find((item) => item.days === days)?.label || `近 ${days} 天`
}

function Delta({ value, suffix = '' }) {
  const delta = Number(value) || 0
  const positive = delta >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
      {positive ? <IconArrowUpRight size={13} /> : <IconArrowDownRight size={13} />}
      {positive ? '+' : ''}{number(delta)}{suffix}
    </span>
  )
}

function MetricCard({ icon: Icon, eyebrow, value, unit, detail, delta, accent = 'stone' }) {
  const accents = {
    ink: 'from-stone-900 to-stone-700 text-white dark:from-stone-100 dark:to-stone-300 dark:text-stone-950',
    blue: 'from-blue-600 to-indigo-600 text-white',
    emerald: 'from-emerald-600 to-teal-600 text-white',
    stone: 'from-[#f6f4ed] to-white text-[#171611] dark:from-[#151c26] dark:to-[#0d131b] dark:text-gray-100',
  }
  const solid = accent !== 'stone'
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-black/[0.06] bg-gradient-to-br p-4 shadow-[0_10px_30px_rgba(34,31,24,0.04)] dark:border-white/[0.07] ${accents[accent]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-[11px] font-medium uppercase tracking-[0.13em] ${solid ? 'text-white/70 dark:text-black/60' : 'text-[#77786f] dark:text-gray-500'}`}>{eyebrow}</p>
        <Icon size={17} stroke={1.7} className={solid ? 'opacity-70' : 'text-[#9a9b91] dark:text-gray-600'} />
      </div>
      <div className="mt-4 flex items-end gap-1.5">
        <strong className="text-[2rem] font-semibold leading-none tracking-[-0.04em]">{value}</strong>
        {unit ? <span className={`mb-0.5 text-xs ${solid ? 'opacity-70' : 'text-[#77786f] dark:text-gray-500'}`}>{unit}</span> : null}
      </div>
      <div className={`mt-3 flex min-h-5 items-center justify-between gap-2 text-[11px] ${solid ? 'text-white/70 dark:text-black/60' : 'text-[#77786f] dark:text-gray-500'}`}>
        <span>{detail}</span>
        {delta !== undefined ? <Delta value={delta} /> : null}
      </div>
    </div>
  )
}

function PeriodSwitcher({ days, onChange, disabled }) {
  return (
    <div className="inline-flex rounded-xl border border-[#dcded5] bg-[#f3f3ee] p-1 dark:border-[#273241] dark:bg-[#111821]" aria-label="统计周期">
      {PERIODS.map((item) => (
        <button
          key={item.days}
          type="button"
          onClick={() => onChange(item.days)}
          disabled={disabled}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${days === item.days ? 'bg-white text-[#171611] shadow-sm dark:bg-[#263140] dark:text-white' : 'text-[#77786f] hover:text-[#171611] dark:text-gray-500 dark:hover:text-gray-200'}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function DailyChart({ rows, days, loading }) {
  if (loading) return <LoadingRows />
  if (!rows?.length) return <EmptyState title="暂无趋势数据" description="有新访问后会按北京时间自然日生成走势。" />
  const max = Math.max(...rows.map((row) => Number(row.pv) || 0), 1)
  const labelStep = days <= 7 ? 1 : days <= 30 ? 5 : 15
  const minWidth = days <= 7 ? 560 : days <= 30 ? 760 : 980
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex h-52 items-end gap-1.5" style={{ minWidth }}>
        {rows.map((row, index) => {
          const pv = Number(row.pv) || 0
          const showLabel = index % labelStep === 0 || index === rows.length - 1
          return (
            <div key={row.date} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
              <div className="pointer-events-none absolute bottom-[calc(var(--bar-height)+28px)] left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#171611] px-2 py-1 text-[10px] text-white shadow-lg group-hover:block dark:bg-white dark:text-black" style={{ '--bar-height': `${Math.max(3, (pv / max) * 150)}px` }}>
                {row.date} · {pv} PV
              </div>
              <div className="flex h-[160px] items-end rounded-md bg-[#f2f1eb] px-[2px] dark:bg-[#0b1118]">
                <div
                  className={`w-full min-w-[3px] rounded-t-sm transition-colors ${index === rows.length - 1 ? 'bg-emerald-500' : 'bg-[#aaa28f] group-hover:bg-[#756d5b] dark:bg-[#526174] dark:group-hover:bg-[#7d91a9]'}`}
                  style={{ height: Math.max(3, (pv / max) * 150) }}
                />
              </div>
              <span className="mt-2 h-4 whitespace-nowrap text-center font-mono text-[9px] text-[#9b9c93] dark:text-gray-600">{showLabel ? row.label : ''}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ContentTable({ rows, loading, emptyTitle = '暂无阅读数据', showDelta = true }) {
  if (loading) return <LoadingRows />
  if (!rows?.length) return <EmptyState title={emptyTitle} description="新阅读产生后会自动进入排行。" />
  const total = rows.reduce((sum, row) => sum + Number(row.pv || 0), 0)
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] border-collapse text-sm">
        <thead><tr className="border-b border-[#e5e6de] text-left text-[10px] uppercase tracking-[0.12em] text-[#93958b] dark:border-[#25303e] dark:text-gray-600">
          <th className="pb-2 font-medium">排名 / 内容</th><th className="pb-2 text-right font-medium">PV</th><th className="pb-2 text-right font-medium">UV</th><th className="pb-2 text-right font-medium">占比</th>{showDelta ? <th className="pb-2 text-right font-medium">环比</th> : null}
        </tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.key} className="border-b border-[#efefe9] last:border-0 dark:border-[#1d2733]">
              <td className="py-3 pr-4"><div className="flex min-w-0 items-center gap-3"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] ${index < 3 ? 'bg-[#25231d] text-white dark:bg-gray-100 dark:text-gray-950' : 'bg-[#efeee8] text-[#7d7f74] dark:bg-[#1c2531] dark:text-gray-500'}`}>{index + 1}</span><div className="min-w-0"><div className="flex items-center gap-2"><span className="rounded bg-[#f0f1eb] px-1.5 py-0.5 text-[9px] text-[#77796d] dark:bg-[#1b2430] dark:text-gray-500">{row.type}</span><a href={row.href} target="_blank" rel="noreferrer" className="max-w-[32rem] truncate font-medium text-[#171611] hover:underline dark:text-gray-100">{row.title}</a></div><p className="mt-0.5 truncate font-mono text-[10px] text-[#aaa99f] dark:text-gray-700">{row.key}</p></div></div></td>
              <td className="py-3 text-right font-semibold text-[#171611] dark:text-gray-100">{number(row.pv)}</td>
              <td className="py-3 text-right text-[#66685f] dark:text-gray-400">{number(row.uv)}</td>
              <td className="py-3 text-right text-[#77796f] dark:text-gray-500">{total ? percent(row.pv / total) : '0%'}</td>
              {showDelta ? <td className="py-3 text-right"><Delta value={row.delta} /></td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SourceList({ rows, loading }) {
  if (loading) return <LoadingRows />
  if (!rows?.length) return <EmptyState title="暂无来源数据" description="新访问会按 UTM、引荐域名与直接访问归类。" />
  const max = Math.max(...rows.map((row) => row.pv), 1)
  return <ol className="space-y-3">{rows.map((row, index) => (
    <li key={`${row.source}-${row.medium}-${row.campaign}-${index}`}>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <div className="min-w-0"><span className="font-medium text-[#171611] dark:text-gray-100">{row.source === 'direct' ? '直接访问' : row.source}</span><span className="ml-2 text-[#9a9b92] dark:text-gray-600">{SOURCE_LABELS[row.medium] || row.medium}{row.campaign ? ` · ${row.campaign}` : ''}</span></div>
        <div className="shrink-0 text-right"><strong>{number(row.pv)}</strong><span className="ml-1 text-[#9a9b92]">PV</span><span className="ml-2 text-[#77796f] dark:text-gray-500">{row.uv} UV</span></div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#efeee8] dark:bg-[#19222d]"><div className="h-full rounded-full bg-[#7a8f82] dark:bg-emerald-500/70" style={{ width: `${Math.max(3, (row.pv / max) * 100)}%` }} /></div>
    </li>
  ))}</ol>
}

function AudiencePanel({ data, loading }) {
  const breakdown = data?.breakdown || []
  const visitors = data?.visitors || []
  const totalPv = breakdown.reduce((sum, row) => sum + row.pv, 0)
  return (
    <div className="space-y-5">
      {loading ? <LoadingRows /> : breakdown.length ? (
        <div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-[#efeee8] dark:bg-[#19222d]">{breakdown.map((row) => <div key={row.type} className={AUDIENCE_COLORS[row.type] || AUDIENCE_COLORS.anonymous} style={{ width: `${totalPv ? (row.pv / totalPv) * 100 : 0}%` }} />)}</div>
          <div className="mt-3 grid grid-cols-3 gap-2">{breakdown.map((row) => <div key={row.type}><p className="text-[10px] text-[#8f9187] dark:text-gray-600">{AUDIENCE_LABELS[row.type] || row.type}</p><p className="mt-0.5 text-sm font-semibold text-[#171611] dark:text-gray-100">{row.uv} <span className="text-[10px] font-normal text-[#9a9b92]">UV</span></p></div>)}</div>
        </div>
      ) : <EmptyState title="暂无受众数据" description="新访问会区分登录用户、稳定游客和匿名访客。" />}
      {visitors.length ? <div><h3 className="mb-2 text-[10px] font-medium uppercase tracking-[0.13em] text-[#8f9187] dark:text-gray-600">活跃读者</h3><ol className="divide-y divide-[#ecece5] dark:divide-[#202a37]">{visitors.slice(0, 8).map((visitor) => <li key={visitor.key} className="flex items-center justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-xs font-medium text-[#171611] dark:text-gray-100">{visitor.name}</p><p className="mt-0.5 text-[10px] text-[#9a9b92] dark:text-gray-600">{AUDIENCE_LABELS[visitor.type] || visitor.type} · {visitor.contentCount} 篇 · {formatDateTime(visitor.lastSeen)}</p></div><span className="shrink-0 text-xs font-semibold">{visitor.pv} <span className="font-normal text-[#9a9b92]">PV</span></span></li>)}</ol></div> : null}
    </div>
  )
}

function LoadingRows() {
  return <div className="space-y-2" aria-label="加载中"><div className="h-10 animate-pulse rounded-lg bg-[#efeee8] dark:bg-[#18212c]" /><div className="h-10 animate-pulse rounded-lg bg-[#f3f2ed] dark:bg-[#141c26]" /><div className="h-10 animate-pulse rounded-lg bg-[#f6f5f1] dark:bg-[#111821]" /></div>
}

function CommentFollowUp({ comments, loading, deletingId, onDelete }) {
  const recent = comments?.recent || []
  if (loading) return <LoadingRows />
  if (!recent.length) return <EmptyState title="暂无评论" description="新评论会显示在这里。" />
  return <ol className="grid gap-2">{recent.map((comment) => (
    <li key={comment.id} className="rounded-xl border border-[#e6e7df] bg-white/50 p-3 dark:border-[#243041] dark:bg-[#0e141d]">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs"><strong className="text-[#171611] dark:text-gray-100">{comment.userName || '匿名用户'}</strong><span className="ml-2 text-[#9a9b92]">{formatDateTime(comment.createdAt)} · </span><a href={comment.href} target="_blank" rel="noreferrer" className="text-[#59736a] hover:underline dark:text-emerald-400">{comment.articleTitle}</a></p><p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#66685f] dark:text-gray-400">{comment.message}</p></div><button type="button" onClick={() => onDelete(comment)} disabled={deletingId === comment.id} className="shrink-0 text-[11px] text-rose-600 hover:underline disabled:opacity-50">{deletingId === comment.id ? '删除中…' : '删除'}</button></div>
    </li>
  ))}</ol>
}

function LikedContentList({ likes, loading }) {
  const rows = likes?.top || []
  if (loading) return <LoadingRows />
  if (!rows.length) return <EmptyState title="暂无获赞文章" description="当前周期产生点赞后，会在这里列出对应文章。" />
  return (
    <ol className="divide-y divide-[#ecece5] dark:divide-[#202a37]">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center justify-between gap-4 py-2.5">
          <div className="min-w-0">
            {row.href ? (
              <a href={row.href} target="_blank" rel="noreferrer" className="block truncate text-xs font-medium text-[#171611] hover:underline dark:text-gray-100">
                {row.title}
              </a>
            ) : (
              <p className="truncate text-xs font-medium text-[#171611] dark:text-gray-100">{row.title}</p>
            )}
            <p className="mt-0.5 truncate font-mono text-[10px] text-[#aaa99f] dark:text-gray-700">{row.key}</p>
          </div>
          <span className="shrink-0 text-xs font-semibold text-[#55574f] dark:text-gray-300">{number(row.total)} 赞</span>
        </li>
      ))}
    </ol>
  )
}

export default function ContentWeeklyClient() {
  const [days, setDays] = useState(7)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingCommentId, setDeletingCommentId] = useState(null)

  const refresh = useCallback(async (nextDays = days) => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/admin/content-weekly?days=${nextDays}`, { cache: 'no-store', credentials: 'same-origin' })
      const json = await safeJson(res)
      if (!res.ok) throw new Error(json?.detail || json?.error || `HTTP_${res.status}`)
      setData(json)
    } catch (e) { setError(e?.message || 'FETCH_FAILED') } finally { setLoading(false) }
  }, [days])

  useEffect(() => { refresh(days) }, [days, refresh])

  const changePeriod = useCallback((nextDays) => {
    if (nextDays === days) return
    setDays(nextDays)
  }, [days])

  const deleteComment = useCallback(async (comment) => {
    if (!comment?.id || !window.confirm(`确认删除「${comment.userName || '匿名用户'}」的这条评论？`)) return
    setDeletingCommentId(comment.id); setError('')
    try {
      const res = await fetch(`/api/admin/comments?id=${encodeURIComponent(comment.id)}`, { method: 'DELETE', credentials: 'same-origin' })
      const json = await safeJson(res)
      if (!res.ok) throw new Error(json?.detail || json?.error || `HTTP_${res.status}`)
      await refresh(days)
    } catch (e) { setError(e?.message || 'COMMENT_DELETE_FAILED') } finally { setDeletingCommentId(null) }
  }, [days, refresh])

  const overview = data?.overview || { pv: 0, previousPv: 0, uv: 0, previousUv: 0, returning: 0, returnRate: 0, viewsPerVisitor: 0 }
  const today = data?.today || { pv: 0, uv: 0, topContent: [], sources: [], visitors: [] }
  const todayAudience = useMemo(() => ({ breakdown: [], visitors: today.visitors || [] }), [today.visitors])
  const label = periodLabel(days)

  return (
    <AdminPage
      title="阅读分析"
      description={`按内容、读者与来源交叉观察阅读表现。PV 按「访客 + 内容 + 1 小时」去重；UV 按登录账号或稳定游客身份去重，时区为北京时间。`}
      actions={<div className="flex flex-wrap items-center gap-2"><PeriodSwitcher days={days} onChange={changePeriod} disabled={loading} /><AdminButton type="button" onClick={() => refresh(days)} disabled={loading}><span className="inline-flex items-center gap-1.5"><IconRefresh size={14} className={loading ? 'animate-spin' : ''} />{loading ? '计算中' : '刷新'}</span></AdminButton></div>}
    >
      {error ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">{error}</div> : null}
      {data?.status === 'unavailable' ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">当前环境没有连接统计数据库，部署后才会显示真实数据。</div> : null}
      {data?.status === 'ok' && !data.window?.complete && days > 7 ? <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">{label}维度已启用，但历史明细此前只保留约 8 天；当前最早可用数据为 {formatDateTime(data.window?.availableFrom)}，30/90 天数据会从本次升级后逐日补齐。</div> : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={IconEye} eyebrow={`${label}阅读`} value={loading ? '—' : number(overview.pv)} unit="PV" detail={`上期 ${number(overview.previousPv)}`} delta={overview.pv - overview.previousPv} accent="ink" />
        <MetricCard icon={IconUsers} eyebrow="独立读者" value={loading ? '—' : number(overview.uv)} unit="UV" detail={`上期 ${number(overview.previousUv)}`} delta={overview.uv - overview.previousUv} accent="blue" />
        <MetricCard icon={IconClock} eyebrow="回访读者" value={loading ? '—' : number(overview.returning)} unit="人" detail={`跨 ≥ 2 个自然日 · ${percent(overview.returnRate)}`} accent="emerald" />
        <MetricCard icon={IconRoute} eyebrow="人均阅读" value={loading ? '—' : number(overview.viewsPerVisitor, 1)} unit="篇次" detail={`${label} PV / UV`} accent="stone" />
      </div>

      <Section title={`${label}阅读趋势`} description="按北京时间自然日聚合；悬停柱形查看准确日期和 PV。" className="mb-4">
        <DailyChart rows={data?.series} days={days} loading={loading} />
      </Section>

      <div className="mb-4 grid min-w-0 gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Section title={`${label}内容排行`} description="同时看 PV、独立读者、阅读占比和与上一个等长周期的增减。" className="min-w-0 overflow-hidden">
          <ContentTable rows={data?.topContent} loading={loading} />
        </Section>
        <Section title="读者结构" description="登录用户可识别账号；游客使用站内稳定昵称，不展示原始指纹。" className="min-w-0">
          <AudiencePanel data={data?.audience} loading={loading} />
        </Section>
      </div>

      <div className="mb-4 grid min-w-0 gap-4 xl:grid-cols-2">
        <Section title="阅读来源" description="UTM 优先，其次按引荐域名归为搜索、社交、外部引荐、站内或直接访问。">
          <SourceList rows={data?.sources} loading={loading} />
        </Section>
        <Section title="类型分布" description="分析、资源与灵感在当前周期的阅读贡献。">
          {loading ? <LoadingRows /> : data?.byType?.length ? <div className="space-y-3">{data.byType.map((row) => <div key={row.type} className="flex items-center justify-between rounded-xl border border-[#e8e8e1] px-3 py-3 dark:border-[#222d3a]"><div><p className="text-sm font-medium text-[#171611] dark:text-gray-100">{row.type}</p><p className="mt-0.5 text-[10px] text-[#9a9b92]">上期 {number(row.previousPv)} PV</p></div><div className="flex items-center gap-3"><strong>{number(row.pv)} <span className="text-[10px] font-normal text-[#9a9b92]">PV</span></strong><Delta value={row.delta} /></div></div>)}</div> : <EmptyState title="暂无类型数据" description="有阅读后会显示各类型的贡献。" />}
        </Section>
      </div>

      <section className="mb-4 overflow-hidden rounded-2xl border border-[#dfe2d9] bg-[#f7f7f2] dark:border-[#283442] dark:bg-[#0c131b]">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#dfe2d9] px-4 py-4 dark:border-[#283442] md:px-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-emerald-700 dark:text-emerald-400">Live · Today</p><h2 className="mt-1 font-serif text-xl font-semibold text-[#171611] dark:text-gray-100">今日阅读现场</h2><p className="mt-1 text-xs text-[#77796f] dark:text-gray-500">截至 {data?.generatedAt ? formatDateTime(data.generatedAt, false) : '—'} · {today.pv} PV · {today.uv} UV</p></div></header>
        <div className="grid gap-4 p-4 md:p-5 xl:grid-cols-[1.4fr_0.9fr_0.9fr]">
          <div className="min-w-0 rounded-xl bg-white p-4 dark:bg-[#111a24]"><h3 className="mb-3 text-sm font-semibold">今日文章排行</h3><ContentTable rows={today.topContent} loading={loading} emptyTitle="今天还没有阅读" showDelta={false} /></div>
          <div className="rounded-xl bg-white p-4 dark:bg-[#111a24]"><h3 className="mb-3 text-sm font-semibold">今日来源</h3><SourceList rows={today.sources} loading={loading} /></div>
          <div className="rounded-xl bg-white p-4 dark:bg-[#111a24]"><h3 className="mb-3 text-sm font-semibold">今日读者 / 游客</h3><AudiencePanel data={todayAudience} loading={loading} /></div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="互动与留存" description={`${label}点赞、评论与订阅沉淀，用于观察阅读后的进一步行动。`}>
          <div className="grid grid-cols-3 gap-3"><div><p className="text-[10px] text-[#8f9187]">点赞</p><p className="mt-1 text-xl font-semibold">{loading ? '—' : number(data?.likes?.total)}</p><Delta value={(data?.likes?.total || 0) - (data?.likes?.previousTotal || 0)} /></div><div><p className="text-[10px] text-[#8f9187]">评论</p><p className="mt-1 text-xl font-semibold">{loading ? '—' : number(data?.comments?.total?.period)}</p><p className="mt-1 text-[10px] text-[#9a9b92]">累计 {number(data?.comments?.total?.all)}</p></div><div><p className="text-[10px] text-[#8f9187]">有效订阅</p><p className="mt-1 text-xl font-semibold">{loading ? '—' : number(data?.newsletter?.active)}</p><p className="mt-1 text-[10px] text-[#9a9b92]">周期新增 +{number(data?.newsletter?.period)}</p></div></div>
          <div className="mt-5 border-t border-[#e5e6de] pt-4 dark:border-[#25303e]">
            <h3 className="mb-2 text-[10px] font-medium uppercase tracking-[0.13em] text-[#8f9187] dark:text-gray-600">{label}获赞文章</h3>
            <LikedContentList likes={data?.likes} loading={loading} />
          </div>
        </Section>
        <Section title="最新评论" description="保留内容运营所需的评论跟进入口。">
          <CommentFollowUp comments={data?.comments} loading={loading} deletingId={deletingCommentId} onDelete={deleteComment} />
        </Section>
      </div>
    </AdminPage>
  )
}

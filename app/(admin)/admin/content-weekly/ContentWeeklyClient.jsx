'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconChartBar,
  IconClock,
  IconCloud,
  IconDatabase,
  IconEye,
  IconRefresh,
  IconRoute,
  IconUsers,
} from '@tabler/icons-react'

import { AdminButton, AdminPage, EmptyState, Section } from '../../components/ui'
import { LoadingSpinner, Skeleton } from '../../../components/loading/LoadingPrimitives'
import { ANALYTICS_METRIC_DEFINITIONS, VIBECAFE_ANALYTICS } from '../../../../lib/analyticsSources.mjs'
import VibeCafeUvTest from './VibeCafeUvTest'

const PERIODS = [
  { days: 1, label: '今日' },
  { days: 7, label: '近 7 天' },
  { days: 30, label: '近 30 天' },
  { days: 90, label: '近 90 天' },
]

const VIEWS = [
  { id: 'overview', label: '访问概览', detail: '多少人来、多少 IP、停留多久', icon: IconChartBar },
  { id: 'reading', label: '内容阅读', detail: '读了什么、从哪里来、是否回访', icon: IconEye },
  { id: 'engagement', label: '互动反馈', detail: '点赞、评论与订阅', icon: IconUsers },
  { id: 'sources', label: '数据来源', detail: '接入状态、统计规则与指标字典', icon: IconDatabase },
  { id: 'testing', label: '测试工具', detail: 'VibeCafé 访客标识的本地模拟', icon: IconRoute },
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
  if (value == null || !Number.isFinite(Number(value))) return '—'
  const n = Number(value) || 0
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: digits }).format(n)
}

function percent(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  return `${Math.round((Number(value) || 0) * 1000) / 10}%`
}

function duration(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  const seconds = Math.max(0, Math.round(Number(value)))
  return seconds < 60 ? `${seconds} 秒` : `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`
}

function bytes(value) {
  const amount = Number(value) || 0
  if (amount < 1024) return `${number(amount)} B`
  if (amount < 1024 ** 2) return `${number(amount / 1024, 1)} KB`
  if (amount < 1024 ** 3) return `${number(amount / 1024 ** 2, 1)} MB`
  return `${number(amount / 1024 ** 3, 1)} GB`
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

function SourceState({ source, children }) {
  if (!source || source.status === 'unconfigured') {
    const required = source?.required || []
    return (
      <div className="rounded-xl border border-dashed border-[#d6d8cf] bg-[#f8f8f4] p-3 text-xs leading-5 text-[#74766d] dark:border-[#2c3745] dark:bg-[#0d141d] dark:text-gray-400">
        <p>{source?.message || '尚未接入实时数据。'}</p>
        {required.length ? <p className="mt-1 font-mono text-[10px] text-[#989a90]">{required.join(' · ')}</p> : null}
        <Link href="/admin/integrations" className="mt-2 inline-block font-medium text-[#536d63] hover:underline dark:text-emerald-400">查看集成配置 →</Link>
      </div>
    )
  }
  if (source.status === 'error') {
    return <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">读取失败：{source.message}</div>
  }
  return children
}

function SourceMetric({ label, value, unit, sub }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium text-[#8c8e84] dark:text-gray-600">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold tracking-[-0.02em] text-[#171611] dark:text-gray-100">{value}<span className="ml-1 text-[10px] font-normal text-[#92948a]">{unit}</span></p>
      {sub ? <p className="mt-1 truncate text-[10px] text-[#9a9c92] dark:text-gray-600">{sub}</p> : null}
    </div>
  )
}

function UnifiedAnalyticsOverview({ sourceData, contentOverview, loading, view }) {
  const umami = sourceData?.sources?.umami
  const cloudflare = sourceData?.sources?.cloudflare
  const definitions = sourceData?.definitions || ANALYTICS_METRIC_DEFINITIONS
  const ips = sourceData?.sources?.cloudflareIps
  const vibe = sourceData?.sources?.vibecafe || VIBECAFE_ANALYTICS
  const umamiViews = Number(umami?.current?.views) || 0
  const qualifiedReads = Number(contentOverview?.pv) || 0
  const edgeRequests = Number(cloudflare?.current?.requests) || 0

  return (
    <>
      {view === 'overview' ? <Section title="访问与停留" description="访客是去重标识的估算，无法直接等同于真实人数。以下来源分别展示，不相加；缺失数据用 — 表示。" className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={IconUsers} eyebrow="所选周期 · 浏览器访客" value={!loading && umami?.status === 'ok' ? number(umami.current.visitors) : '—'} unit="UV" detail="Umami · 不要求停留 8 秒" accent="blue" />
          <MetricCard icon={IconEye} eyebrow="所选周期 · 页面浏览" value={!loading && umami?.status === 'ok' ? number(umami.current.views) : '—'} unit="PV" detail="Umami · 浏览器脚本上报" />
          <MetricCard icon={IconClock} eyebrow="所选周期 · 平均访问时长" value={!loading && umami?.status === 'ok' && umami.current.visits > 0 ? duration(umami.current.averageVisitSeconds) : '—'} detail="Umami · 单页和末页可能漏计时长" />
          <MetricCard icon={IconCloud} eyebrow={`UTC ${ips?.currentDate || '当日'} · 独立 IP`} value={!loading && ips?.status === 'ok' && ips.currentDayUniqueIps != null ? number(ips.currentDayUniqueIps) : '—'} unit="个" detail="Cloudflare · 含探测/爬虫 · 北京时间 08:00 起" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-[#dfe1d8] p-4 dark:border-[#273240]">
            <h3 className="text-sm font-semibold">每日浏览器访客与浏览 · 北京时间</h3>
            <div className="mt-3 max-h-80 overflow-y-auto"><SourceState source={umami}>
              {umami?.series?.length ? <table className="mt-3 w-full text-left text-xs"><thead><tr><th className="py-2">日期</th><th>访客 UV</th><th>浏览 PV</th></tr></thead><tbody>{umami.series.map(row => <tr key={row.date}><td className="py-1.5">{row.date.slice(0, 10)}</td><td>{number(row.visitors)}</td><td>{number(row.views)}</td></tr>)}</tbody></table> : <p className="mt-3 text-xs">暂无每日统计记录。</p>}
            </SourceState></div>
          </div>
          <div className="rounded-xl border border-[#dfe1d8] p-4 dark:border-[#273240]">
            <h3 className="text-sm font-semibold">每日独立 IP · UTC</h3>
            <p className="my-2 text-xs leading-5 text-[#77786f] dark:text-gray-400">UTC 一天对应北京时间当日 08:00 至次日 08:00。不同日期可能重复同一 IP，不能把每日数字相加当作总人数。</p>
            <div className="max-h-80 overflow-y-auto"><SourceState source={ips}>
              {ips?.series?.length ? <table className="mt-3 w-full text-left text-xs"><thead><tr><th className="py-2">日期（UTC）</th><th>独立 IP</th></tr></thead><tbody>{ips.series.map(row => <tr key={row.date}><td className="py-1.5">{row.date}</td><td>{row.uniqueIps == null ? '—' : number(row.uniqueIps)}</td></tr>)}</tbody></table> : <p className="mt-3 text-xs">暂无独立 IP 记录，不能据此认定无人访问。</p>}
            </SourceState></div>
          </div>
        </div>
      </Section> : null}
      {view === 'sources' ? <>
      <Section
        title="统一统计总览"
        description="Umami 看浏览器访问，自建统计看达到阅读门槛的内容访问，VibeCafé 提供补充采集，Cloudflare 看网络请求。"
        className="mb-4"
      >
        <div className="grid gap-3 xl:grid-cols-2">
          <article className="rounded-2xl border border-blue-200/70 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
            <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">主口径 · 站点访问</p><h3 className="mt-1 text-sm font-semibold">Umami</h3></div><IconChartBar size={19} className="text-blue-500" /></div>
            <SourceState source={umami}>
              <div className="grid grid-cols-3 gap-3">
                <SourceMetric label="访客" value={loading ? '—' : number(umami?.current?.visitors)} unit="人" sub={`上期 ${number(umami?.previous?.visitors)}`} />
                <SourceMetric label="访问" value={loading ? '—' : number(umami?.current?.visits)} unit="次" sub={`跳出 ${percent(umami?.current?.bounceRate)}`} />
                <SourceMetric label="浏览" value={loading ? '—' : number(umami?.current?.views)} unit="次" sub={`上期 ${number(umami?.previous?.views)}`} />
              </div>
            </SourceState>
            <a href="https://cloud.umami.is/share/3mOsBgzrmb9wY8bI" target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs underline">打开现有 Umami 独立面板</a>
          </article>

          <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">主口径 · 内容消费</p><h3 className="mt-1 text-sm font-semibold">自建 D1</h3></div><IconDatabase size={19} className="text-emerald-500" /></div>
            <div className="grid grid-cols-3 gap-3">
              <SourceMetric label="有效阅读" value={loading ? '—' : number(contentOverview?.pv)} unit="篇次" sub={`上期 ${number(contentOverview?.previousPv)}`} />
              <SourceMetric label="独立读者" value={loading ? '—' : number(contentOverview?.uv)} unit="人" sub="合格事件去重" />
              <SourceMetric label="人均阅读" value={loading ? '—' : number(contentOverview?.viewsPerVisitor, 1)} unit="篇次" sub="有效阅读 / 读者" />
            </div>
            <p className="mt-3 text-xs leading-5 text-[#66685f] dark:text-gray-400">内容页累计可见满 8 秒才上报，每个内容/请求指纹每小时最多一次。这是本站自定义门槛，不代表平均停留 8 秒，也不适用于 Umami 和 VibeCafé。</p>
            {contentOverview?.excludedLegacyPv > 0 ? <p className="mt-3 text-[10px] leading-4 text-amber-700 dark:text-amber-300">当前周期另有 {number(contentOverview.excludedLegacyPv)} 条旧版未验证事件，已从主指标排除。</p> : null}
          </article>
          <article className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4 dark:border-violet-900 dark:bg-violet-950/20">
            <h3 className="text-sm font-semibold">VibeCafé</h3>
            <p className="mt-2 text-xs font-medium">已安装采集脚本 · 报表尚未接入</p>
            <p className="mt-2 text-xs leading-6 text-[#66685f] dark:text-gray-400">{vibe.message}</p>
            <p className="mt-2 text-xs leading-6 text-[#66685f] dark:text-gray-400">浏览器为产品保存随机 visitorId，初次加载及网址变化时发送 pageview，无 8 秒等待。换 IP 通常保留 ID；清除存储或换浏览器可能产生新 ID。DNT/GPC 开启时不发送。当前脚本没有停留计时，后台去重周期和过滤规则尚未确认。</p>
            <p className="mt-2 text-xs leading-6 text-[#66685f] dark:text-gray-400">脚本位于根布局，也可能覆盖后台访问；产品页访问和实际站点访问须以平台报表区分。</p>
            <div className="mt-3 flex gap-4 text-xs underline"><a href={vibe.productUrl} target="_blank" rel="noreferrer">查看 VibeCafé 产品页</a><a href={vibe.scriptUrl} target="_blank" rel="noreferrer">核对采集脚本</a></div>
          </article>

          <article className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-950/20">
            <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-600 dark:text-stone-400">诊断口径 · 边缘流量</p><h3 className="mt-1 text-sm font-semibold">Cloudflare</h3></div><IconCloud size={19} className="text-stone-500" /></div>
            <SourceState source={cloudflare}>
              <div className="grid grid-cols-3 gap-3">
                <SourceMetric label="请求" value={loading ? '—' : number(cloudflare?.current?.requests)} unit="条" sub={`上期 ${number(cloudflare?.previous?.requests)}`} />
                <SourceMetric label="入口" value={loading ? '—' : number(cloudflare?.current?.visits)} unit="Visit" sub="Referer 规则" />
                <SourceMetric label="传输" value={loading ? '—' : bytes(cloudflare?.current?.bytes)} unit="" sub="边缘响应字节" />
              </div>
              {cloudflare?.spike ? <p className="mt-3 text-[10px] leading-4 text-rose-700 dark:text-rose-300">检测到 {cloudflare.spike.date} 请求尖峰：{number(cloudflare.spike.requests)}，约为其余日期中位数的 {number(cloudflare.spike.multiple, 1)} 倍。优先按爬虫、攻击、资产热链或循环请求排查。</p> : null}
            </SourceState>
          </article>
        </div>

        {!loading && contentOverview && umami?.status === 'ok' && cloudflare?.status === 'ok' ? (
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <p className="rounded-xl bg-[#f5f5f0] px-3 py-2 text-[#6d6f66] dark:bg-[#111923] dark:text-gray-400">Cloudflare 请求 / Umami 浏览：<strong className="text-[#25251f] dark:text-gray-200">{umamiViews ? number(edgeRequests / umamiViews, 1) : '—'}×</strong>。这个倍数反映每次页面浏览产生的资产/API 请求与自动流量，不是漏记率。</p>
            <p className="rounded-xl bg-[#f5f5f0] px-3 py-2 text-[#6d6f66] dark:bg-[#111923] dark:text-gray-400">有效内容阅读 / Umami 浏览：<strong className="text-[#25251f] dark:text-gray-200">{umamiViews ? percent(qualifiedReads / umamiViews) : '—'}</strong>。分母覆盖全站，分子只覆盖白名单内容页且需活跃 8 秒。</p>
          </div>
        ) : null}
      </Section>

<p className="mt-4 text-xs leading-6 text-[#66685f] dark:text-gray-400">Globalping 每 20 分钟发起一轮 HTTP 检查，正常每日 72 轮、约 144 次目标请求（不含重定向）。它不执行 JavaScript，不触发 Umami、VibeCafé 或自建有效阅读上报；边缘请求和独立 IP 则可能包含它。响应耗时也不等于访客停留时间。</p>
      <details className="mb-4 rounded-2xl border border-[#dfe1d8] bg-white/60 p-4 dark:border-[#273240] dark:bg-[#0d141d]">
        <summary className="cursor-pointer text-sm font-semibold text-[#292921] dark:text-gray-100">指标字典与差异说明</summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-xs">
            <thead><tr className="border-b border-[#e3e4dc] text-[10px] uppercase tracking-[0.12em] text-[#92948a] dark:border-[#283341]"><th className="pb-2 pr-4 font-medium">指标</th><th className="pb-2 pr-4 font-medium">来源 / 角色</th><th className="pb-2 pr-4 font-medium">计算口径</th><th className="pb-2 font-medium">边界</th></tr></thead>
            <tbody>{definitions.map((item) => <tr key={item.id} className="border-b border-[#ededE7] last:border-0 dark:border-[#202a36]"><td className="py-3 pr-4 font-medium text-[#24241f] dark:text-gray-100">{item.label}</td><td className="py-3 pr-4 text-[#66685f] dark:text-gray-400">{item.source}<span className="ml-1.5 rounded bg-[#efefe9] px-1.5 py-0.5 text-[9px] dark:bg-[#1b2531]">{item.role}</span></td><td className="py-3 pr-4 leading-5 text-[#66685f] dark:text-gray-400">{item.definition}</td><td className="py-3 leading-5 text-[#8b6d42] dark:text-amber-300">{item.caveat}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-3 text-[10px] text-[#95978d] dark:text-gray-600">Umami、自建阅读和边缘请求总量采用北京时间范围；环比比较相同已过时长。Cloudflare 日分组与每日独立 IP 使用 UTC，独立 IP 不提供跨日相加的总数。VibeCafé 报表的时间窗尚未核实。</p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs underline"><a href="https://docs.umami.is/docs/metric-definitions" target="_blank" rel="noreferrer">Umami 指标定义</a><a href="https://developers.cloudflare.com/analytics/graphql-api/features/data-sets/" target="_blank" rel="noreferrer">Cloudflare 数据集定义</a><a href={vibe.scriptUrl} target="_blank" rel="noreferrer">VibeCafé v1 采集脚本（2026-09-04 核对）</a></div>
      </details>
      </> : null}
    </>
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
  return <div className="space-y-2" role="status" aria-label="正在加载数据"><Skeleton className="h-10 rounded-lg" /><Skeleton className="h-10 rounded-lg" /><Skeleton className="h-10 rounded-lg" /></div>
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
  const [days, setDays] = useState(1)
  const [view, setView] = useState('overview')

  useEffect(() => {
    const syncView = () => {
      const id = window.location.hash.slice(1)
      setView(VIEWS.some(item => item.id === id) ? id : 'overview')
    }
    syncView()
    window.addEventListener('hashchange', syncView)
    return () => window.removeEventListener('hashchange', syncView)
  }, [])
  const [data, setData] = useState(null)
  const [sourceData, setSourceData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingCommentId, setDeletingCommentId] = useState(null)

  const refresh = useCallback(async (nextDays = days) => {
    setLoading(true); setError('')
    try {
      const [contentResponse, sourceResponse] = await Promise.all([
        fetch(`/api/admin/content-weekly?days=${nextDays}`, { cache: 'no-store', credentials: 'same-origin' }),
        fetch(`/api/admin/analytics-sources?days=${nextDays}`, { cache: 'no-store', credentials: 'same-origin' }),
      ])
      const [contentPayload, sourcePayload] = await Promise.all([
        safeJson(contentResponse),
        safeJson(sourceResponse),
      ])
      if (!contentResponse.ok) throw new Error(contentPayload?.detail || contentPayload?.error || `CONTENT_HTTP_${contentResponse.status}`)
      if (!sourceResponse.ok) throw new Error(sourcePayload?.detail || sourcePayload?.error || `SOURCES_HTTP_${sourceResponse.status}`)
      setData(contentPayload)
      setSourceData(sourcePayload)
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

  const overview = data?.status === 'ok' && data.overview ? data.overview : { pv: null, previousPv: null, uv: null, previousUv: null, returning: null, returnRate: null, viewsPerVisitor: null }
  const today = data?.status === 'ok' && data.today ? data.today : { pv: null, uv: null, topContent: [], sources: [], visitors: [] }
  const todayAudience = useMemo(() => ({ breakdown: [], visitors: today.visitors || [] }), [today.visitors])
  const label = periodLabel(days)

  return (
    <AdminPage
      title="数据统计"
      description="了解访问、阅读与互动，按问题查看对应数据。"
    >
      <nav aria-label="数据统计导航" className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-[#dfe1d8] bg-[#f3f3ee] p-1.5 dark:border-[#273240] dark:bg-[#111821] sm:grid-cols-5">
        {VIEWS.map(({ id, label: name, icon: Icon }) => (
          <a key={id} href={`#${id}`} onClick={() => setView(id)} aria-current={view === id ? 'page' : undefined}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${view === id ? 'bg-white text-[#171611] shadow-sm dark:bg-[#263140] dark:text-white' : 'text-[#77786f] hover:bg-white/60 hover:text-[#171611] dark:text-gray-400 dark:hover:bg-[#1b2531] dark:hover:text-white'}`}>
            <Icon size={17} aria-hidden="true" />{name}
          </a>
        ))}
      </nav>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{VIEWS.find(item => item.id === view)?.label}</h2>
          <p className="mt-1 text-xs leading-5 text-[#77786f] dark:text-gray-400">{VIEWS.find(item => item.id === view)?.detail}</p>
        </div>
        {view !== 'testing' ? <div className="flex flex-wrap items-center gap-2"><PeriodSwitcher days={days} onChange={changePeriod} disabled={loading} /><AdminButton type="button" onClick={() => refresh(days)} disabled={loading}><span className="inline-flex items-center gap-1.5">{loading ? <LoadingSpinner size="sm" /> : <IconRefresh size={14} />}{loading ? '计算中' : '刷新'}</span></AdminButton></div> : null}
      </div>
      {error ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">{error}</div> : null}
      {view !== 'testing' && data?.status === 'unavailable' ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">当前环境没有连接统计数据库，部署后才会显示真实数据。</div> : null}
      {view === 'reading' && data?.status === 'ok' && !data.window?.complete && days > 7 ? <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">{label}维度已启用，但历史明细此前只保留约 8 天；当前最早可用数据为 {formatDateTime(data.window?.availableFrom)}，30/90 天数据会从本次升级后逐日补齐。</div> : null}

      {view === 'overview' || view === 'sources' ? <UnifiedAnalyticsOverview sourceData={sourceData} contentOverview={data?.status === 'ok' ? overview : null} loading={loading} view={view} /> : null}
      {view === 'overview' ? <p className="text-xs leading-6 text-[#77786f] dark:text-gray-400">数据为 — 时表示尚未取得统计结果。<a href="#sources" onClick={() => setView('sources')} className="ml-1 font-medium text-emerald-700 underline underline-offset-4 dark:text-emerald-400">查看接入状态与统计规则 →</a></p> : null}
      {view === 'testing' ? <VibeCafeUvTest /> : null}

      {view === 'reading' ? <>
      <p className="mb-4 text-xs leading-6 text-[#77786f] dark:text-gray-400">自建统计 · 内容页累计可见满 8 秒后计入有效阅读。以下指标只覆盖内容阅读。</p>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={IconEye} eyebrow={`${label}有效阅读`} value={loading ? '—' : number(overview.pv)} unit="篇次" detail={`等长上期 ${number(overview.previousPv)}`} delta={overview.pv == null ? undefined : overview.pv - overview.previousPv} accent="ink" />
        <MetricCard icon={IconUsers} eyebrow="独立内容读者" value={loading ? '—' : number(overview.uv)} unit="人" detail={`等长上期 ${number(overview.previousUv)}`} delta={overview.uv == null ? undefined : overview.uv - overview.previousUv} accent="stone" />
        <MetricCard icon={IconClock} eyebrow="回访读者" value={loading ? '—' : number(overview.returning)} unit="人" detail={`跨 ≥ 2 个自然日 · ${percent(overview.returnRate)}`} accent="stone" />
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

      <details className="mb-4 rounded-xl border border-[#dfe1d8] p-4 dark:border-[#273240]">
      <summary className="cursor-pointer text-sm font-medium">今日阅读现场 <span className="ml-2 text-xs font-normal text-[#77786f]">固定查看今日 · 展开排行、来源与读者</span></summary>
      <section className="mt-4 overflow-hidden rounded-2xl border border-[#dfe2d9] bg-[#f7f7f2] dark:border-[#283442] dark:bg-[#0c131b]">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#dfe2d9] px-4 py-4 dark:border-[#283442] md:px-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-emerald-700 dark:text-emerald-400">Live · Today</p><h2 className="mt-1 font-serif text-xl font-semibold text-[#171611] dark:text-gray-100">今日阅读现场</h2><p className="mt-1 text-xs text-[#77796f] dark:text-gray-500">截至 {data?.generatedAt ? formatDateTime(data.generatedAt, false) : '—'} · {number(today.pv)} PV · {number(today.uv)} UV</p></div></header>
        <div className="grid gap-4 p-4 md:p-5 xl:grid-cols-[1.4fr_0.9fr_0.9fr]">
          <div className="min-w-0 rounded-xl bg-white p-4 dark:bg-[#111a24]"><h3 className="mb-3 text-sm font-semibold">今日文章排行</h3><ContentTable rows={today.topContent} loading={loading} emptyTitle="今天还没有阅读" showDelta={false} /></div>
          <div className="rounded-xl bg-white p-4 dark:bg-[#111a24]"><h3 className="mb-3 text-sm font-semibold">今日来源</h3><SourceList rows={today.sources} loading={loading} /></div>
          <div className="rounded-xl bg-white p-4 dark:bg-[#111a24]"><h3 className="mb-3 text-sm font-semibold">今日读者 / 游客</h3><AudiencePanel data={todayAudience} loading={loading} /></div>
        </div>
      </section>
      </details>
      </> : null}

      {view === 'engagement' ? <div className="grid gap-4 xl:grid-cols-2">
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
      </div> : null}
    </AdminPage>
  )
}

'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

import SharePageButton from '../components/SharePageButton'

import {
  PAIRS,
  SCORING_RUBRIC,
  STATUS_FILTERS,
  STATUS_META,
  TOTALS,
} from './data'
import { FRAMEWORK_META, FRAMEWORK_SECTIONS, PRIMARY_SOURCES, SIGNAL_TIMELINE } from './framework'

const SHARE_URL = 'https://2aran.com/platform-framework-pairs'

const SORT_OPTIONS = [
  { id: 'lockIn', label: '捆绑深度', accessor: (c) => c.lockIn, kind: 'subjective', unit: '' },
  { id: 'frameworkStars', label: '框架影响力', accessor: (c) => c.frameworkStars, kind: 'measured', unit: 'k★' },
  { id: 'backlash', label: '社区反弹', accessor: (c) => c.backlash, kind: 'subjective', unit: '' },
  { id: 'aiIntegration', label: 'AI 整合度', accessor: (c) => c.aiIntegration, kind: 'subjective', unit: '' },
  { id: 'foundedPairing', label: '关系建立年', accessor: (c) => c.foundedPairing, kind: 'measured', unit: '' },
]

const MAX_COMPARE = 3

function formatStars(n) {
  if (n <= 0) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}M`
  return `${n}k`
}

function tierLabel(t) {
  return ['—', '个人 / 早期', '小规模 ARR', 'Focused 平台', '主流云', 'Hyperscaler'][t] || '—'
}

export default function PlatformFrameworkPairsClient() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('lockIn')
  const [openId, setOpenId] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareIds, setCompareIds] = useState([])
  const [hoverId, setHoverId] = useState(null)

  // ---- URL 同步 ----
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    const s = params.get('status')
    const sort = params.get('sort')
    const o = params.get('open')
    const m = params.get('mode')
    const cmp = params.get('compare')
    if (q) setQuery(q)
    if (s && STATUS_FILTERS.some((f) => f.id === s)) setStatusFilter(s)
    if (sort && SORT_OPTIONS.some((f) => f.id === sort)) setSortBy(sort)
    if (o && PAIRS.some((p) => p.id === o)) setOpenId(o)
    if (m === 'compare') setCompareMode(true)
    if (cmp) {
      const ids = cmp.split(',').filter((id) => PAIRS.some((p) => p.id === id)).slice(0, MAX_COMPARE)
      if (ids.length) setCompareIds(ids)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (sortBy !== 'lockIn') params.set('sort', sortBy)
    if (compareMode) params.set('mode', 'compare')
    if (compareMode && compareIds.length) params.set('compare', compareIds.join(','))
    if (!compareMode && openId) params.set('open', openId)
    const qs = params.toString()
    const next = qs ? `?${qs}` : window.location.pathname
    window.history.replaceState(null, '', next)
  }, [query, statusFilter, sortBy, openId, compareMode, compareIds])

  const handleSelect = useCallback(
    (id) => {
      if (compareMode) {
        setCompareIds((prev) => {
          if (prev.includes(id)) return prev.filter((x) => x !== id)
          if (prev.length >= MAX_COMPARE) return prev
          return [...prev, id]
        })
      } else {
        setOpenId((prev) => (prev === id ? null : id))
      }
    },
    [compareMode]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PAIRS.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (q) {
        const hay = `${p.platform}${p.framework}${p.primaryLockIn}${p.latestSignal}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [query, statusFilter])

  const sortAccessor = SORT_OPTIONS.find((o) => o.id === sortBy).accessor
  const sorted = useMemo(() => [...filtered].sort((a, b) => sortAccessor(b) - sortAccessor(a)), [filtered, sortAccessor])

  const focusIds = compareMode ? compareIds : openId ? [openId] : []
  const compareEntities = useMemo(() => compareIds.map((id) => PAIRS.find((p) => p.id === id)).filter(Boolean), [compareIds])
  const openEntity = !compareMode && openId ? PAIRS.find((p) => p.id === openId) : null

  // 统计数字
  const counts = useMemo(() => {
    const c = { active: 0, forming: 0, historical: 0, neutral: 0, unverified: 0 }
    for (const p of filtered) {
      c[p.status] += 1
      if (!p.verified) c.unverified += 1
    }
    return c
  }, [filtered])

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
      {/* ---- Header ---- */}
      <header className="flex flex-col gap-4 border-b border-[#e8dfd0] pb-5 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
            Platform × Framework · 2024–2026
          </p>
          <h1 className="mt-2 font-serif text-[26px] font-semibold leading-tight text-[#221f19] dark:text-gray-100 sm:text-[30px]">
            平台 × 前端框架捆绑配对
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#5d554a] dark:text-gray-400">
            10 组「平台 × 框架」配对的捆绑深度、社区反弹、AI 整合度与生命周期状态。基于公开新闻、GitHub 数据与社区信号。{' '}
            <strong className="text-[#a05a3c] dark:text-[#e2a07a]">主观打分仅作分析参考，不构成投资 / 选型决策建议。</strong>
            {' '}2026-06-04 Cloudflare 正式收购 VoidZero —— 数据已对应更新。
          </p>
        </div>
        <SharePageButton
          title="平台 × 前端框架捆绑配对调研"
          text="10 组配对的捆绑深度 / 社区反弹 / AI 整合 / 生命周期可视化"
          url={SHARE_URL}
          size="md"
        />
      </header>

      {/* ---- 研报框架（主体判断层） ---- */}
      <ResearchFramework />

      {/* ---- Mode + status ---- */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#e8dfd0] pt-5 dark:border-gray-800">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
          状态
        </span>
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#e0d3b8] bg-white p-0.5 text-xs dark:border-gray-700 dark:bg-gray-950">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`rounded-md px-3 py-1 transition ${
                statusFilter === f.id
                  ? 'bg-[#3f3527] text-white dark:bg-gray-200 dark:text-[#111]'
                  : 'text-[#6d614c] hover:bg-[#f5efe2] dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="mx-2 hidden h-4 w-px bg-[#e0d3b8] dark:bg-gray-700 sm:inline-block" />

        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
          模式
        </span>
        <div className="flex items-center gap-1 rounded-lg border border-[#e0d3b8] bg-white p-0.5 text-xs dark:border-gray-700 dark:bg-gray-950">
          <button
            type="button"
            onClick={() => setCompareMode(false)}
            className={`rounded-md px-3 py-1 transition ${
              !compareMode
                ? 'bg-[#3f3527] text-white dark:bg-gray-200 dark:text-[#111]'
                : 'text-[#6d614c] hover:bg-[#f5efe2] dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            单选详情
          </button>
          <button
            type="button"
            onClick={() => setCompareMode(true)}
            className={`rounded-md px-3 py-1 transition ${
              compareMode
                ? 'bg-[#3f3527] text-white dark:bg-gray-200 dark:text-[#111]'
                : 'text-[#6d614c] hover:bg-[#f5efe2] dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            两两对比（最多 {MAX_COMPARE}）
          </button>
        </div>
        {compareMode && compareIds.length ? (
          <button
            type="button"
            onClick={() => setCompareIds([])}
            className="text-[11px] text-[#8f8069] underline underline-offset-2 hover:text-[#5d503f] dark:text-gray-500 dark:hover:text-gray-300"
          >
            清空（{compareIds.length}）
          </button>
        ) : null}
      </div>

      {/* ---- Filters ---- */}
      <section className="mt-3 rounded-xl border border-[#e8dfd0] bg-[#fdfaf3]/70 p-3 dark:border-gray-800 dark:bg-gray-900/60 sm:p-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索：vercel / vue / lock / Astro…"
            className="min-w-[200px] flex-1 rounded-lg border border-[#e0d3b8] bg-white px-3 py-1.5 text-sm text-[#221f19] outline-none placeholder:text-[#bbae93] focus:border-[#b7791f] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-600"
          />
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#e0d3b8] bg-white p-0.5 text-xs dark:border-gray-700 dark:bg-gray-950">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSortBy(opt.id)}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                  sortBy === opt.id
                    ? 'bg-[#3f3527] text-white dark:bg-gray-200 dark:text-[#111]'
                    : 'text-[#6d614c] hover:bg-[#f5efe2] dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
                title={opt.kind === 'subjective' ? '主观打分 0–100' : '实测数据'}
              >
                <span>{opt.label}</span>
                {opt.kind === 'subjective' ? (
                  <span className="rounded-full bg-[#dee6f0]/80 px-1 text-[8.5px] font-mono uppercase tracking-[0.1em] text-[#3f4b5d] dark:bg-[#1c2632] dark:text-[#9bb6df]">
                    主观
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          {(query || statusFilter !== 'all' || sortBy !== 'lockIn') ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setStatusFilter('all')
                setSortBy('lockIn')
              }}
              className="ml-auto text-[11px] text-[#8f8069] underline underline-offset-2 hover:text-[#5d503f] dark:text-gray-500 dark:hover:text-gray-300"
            >
              重置全部
            </button>
          ) : null}
        </div>
      </section>

      {/* ---- Stat tiles ---- */}
      <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatTile label="筛选后配对数" value={`${filtered.length} / ${TOTALS.pairs}`} sub="当前条件下展示数量" />
        <StatTile label="现役 + 形成中" value={`${counts.active + counts.forming}`} sub={`active ${counts.active} · forming ${counts.forming}`} />
        <StatTile label="中立 / 历史绑定" value={`${counts.neutral + counts.historical}`} sub={`neutral ${counts.neutral} · historical ${counts.historical}`} />
        <StatTile label="含待核实条目" value={`${counts.unverified}`} sub="数字含估算 / 传闻成分" />
      </section>

      {/* ---- Quadrant scatter ---- */}
      <section className="mt-5 rounded-xl border border-[#e8dfd0] bg-white/80 p-3 dark:border-gray-800 dark:bg-gray-900/70 sm:p-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
            散点 · 框架影响力 × 捆绑深度
          </h2>
          <p className="text-[11px] text-[#8f8069] dark:text-gray-500">
            气泡大小 = 平台体量 tier · 颜色 = 状态 · {compareMode ? `点选 ≤${MAX_COMPARE} 个对比` : '点选展开详情'}
          </p>
        </div>
        <QuadrantChart
          pairs={filtered}
          focusIds={focusIds}
          hoverId={hoverId}
          onHover={setHoverId}
          onSelect={handleSelect}
        />
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#8f8069] dark:text-gray-500">
          {Object.entries(STATUS_META).map(([k, v]) => (
            <LegendDot key={k} color={v.color} label={v.label} />
          ))}
        </div>
      </section>

      {/* ---- Ranking list ---- */}
      <section className="mt-5 rounded-xl border border-[#e8dfd0] bg-white/80 dark:border-gray-800 dark:bg-gray-900/70">
        <div className="border-b border-[#e8dfd0] px-3 py-2 dark:border-gray-800 sm:px-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
            排行 · 按 {SORT_OPTIONS.find((o) => o.id === sortBy).label} 降序
          </h2>
        </div>
        <RankingList
          pairs={sorted}
          sortBy={sortBy}
          focusIds={focusIds}
          hoverId={hoverId}
          onHover={setHoverId}
          onSelect={handleSelect}
          compareMode={compareMode}
        />
        {!sorted.length ? (
          <div className="py-12 text-center text-[13px] text-[#8f8069] dark:text-gray-500">
            没有匹配的配对。试着放宽筛选或重置。
          </div>
        ) : null}
      </section>

      {/* ---- Detail / Compare ---- */}
      {compareMode ? (
        compareEntities.length ? (
          <CompareTable entities={compareEntities} onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))} />
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-[#e0d3b8] py-10 text-center text-[13px] text-[#8f8069] dark:border-gray-700 dark:text-gray-500">
            在上面点选 2–{MAX_COMPARE} 个配对开始对比
          </div>
        )
      ) : openEntity ? (
        <section
          className="mt-5 rounded-xl border-l-4 bg-white/85 p-4 dark:bg-gray-900/80 sm:p-5"
          style={{ borderLeftColor: STATUS_META[openEntity.status].color }}
        >
          <PairDetail entity={openEntity} onClose={() => setOpenId(null)} />
        </section>
      ) : null}

      {/* ---- Footer with rubric ---- */}
      <footer className="mt-10 border-t border-[#e8dfd0] pt-6 text-[12px] leading-6 text-[#7a6f5d] dark:border-gray-800 dark:text-gray-500">
        <p className="font-semibold text-[#5d503f] dark:text-gray-300">数据口径、主观评分 rubric 与免责声明</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>实测数据</strong>：框架 stars 取近年 GitHub 公开值近似（千为单位）；平台体量 tier 1–5 表示商业规模量级（个人 → hyperscaler），不是精确 ARR。
          </li>
          <li>
            <strong>主观打分（0–100）</strong>：
            <ul className="mt-1 list-[circle] space-y-0.5 pl-5">
              <li><strong>捆绑深度（lockIn）</strong>：{SCORING_RUBRIC.lockIn}</li>
              <li><strong>社区反弹（backlash）</strong>：{SCORING_RUBRIC.backlash}</li>
              <li><strong>AI 整合度（aiIntegration）</strong>：{SCORING_RUBRIC.aiIntegration}</li>
            </ul>
            评分由作者基于 2024–2026 公开信号判断，取整到 5；不同观察者评分会有差异。
          </li>
          <li>
            <strong>verified = false</strong> 的条目（如 Cloudflare × Vue）含未官方确认的细节，卡片右上角有「估算」徽章。读到这些数字时请打折看。
          </li>
          <li>
            <strong>不构成投资 / 选型建议</strong>。具体技术选型与平台采购请结合自身上下文、合同条款与平台稳定性评估。
          </li>
        </ul>
        <p className="mt-4 text-[11px] text-[#8f8069] dark:text-gray-600">
          数据来源：{TOTALS.source} · 数据更新：2026-06 · 站点：
          <Link href="/" className="underline underline-offset-2">2aran.com</Link>
        </p>
      </footer>
    </main>
  )
}

// ===================== Sub-components =====================

function StatTile({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-[#e8dfd0] bg-white/70 p-3 dark:border-gray-800 dark:bg-gray-900/70">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">{label}</p>
      <p className="mt-1 font-serif text-[18px] font-semibold tabular-nums text-[#221f19] dark:text-gray-100 sm:text-[20px]">
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-[11px] text-[#8f8069] dark:text-gray-500">{sub}</p> : null}
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function VerifiedBadge({ verified, size = 'sm' }) {
  if (verified) return null
  const sizeCls = size === 'lg' ? 'px-1.5 py-0.5 text-[10px]' : 'px-1 py-px text-[9px]'
  return (
    <span
      className={`shrink-0 rounded-full bg-[#fde6c6] font-mono uppercase tracking-[0.12em] text-[#8b5a1f] dark:bg-[#3a2c14] dark:text-[#f0c776] ${sizeCls}`}
      title="该条目部分数据来自传闻 / 估算 / 推断"
    >
      估算
    </span>
  )
}

function SubjectiveChip({ size = 'xs' }) {
  return (
    <span
      className={`shrink-0 rounded-full bg-[#dee6f0]/80 ${size === 'xs' ? 'px-1 py-px text-[8px]' : 'px-1.5 py-0.5 text-[10px]'} font-mono uppercase tracking-[0.1em] text-[#3f4b5d] dark:bg-[#1c2632] dark:text-[#9bb6df]`}
    >
      主观
    </span>
  )
}

// -------- Scatter chart --------

function QuadrantChart({ pairs, focusIds, hoverId, onHover, onSelect }) {
  const W = 720
  const H = 360
  const padL = 50
  const padR = 24
  const padT = 28
  const padB = 40
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  // X = framework stars (log10, 1k → 300k 范围)
  const xMin = 0
  const xMax = 2.5
  const xPos = (stars) => padL + ((Math.log10(Math.max(stars, 1)) - xMin) / (xMax - xMin)) * innerW

  // Y = lockIn 0-100
  const yPos = (lockIn) => padT + (1 - lockIn / 100) * innerH

  // bubble radius = platform tier 1-5
  const rPos = (tier) => 6 + (tier / 5) * 18

  const xTicks = [
    { v: 1, label: '1k' },
    { v: 10, label: '10k' },
    { v: 50, label: '50k' },
    { v: 100, label: '100k' },
    { v: 240, label: '240k' },
  ]
  const yTicks = [25, 50, 75]
  const midY = yPos(50)

  const hovered = hoverId ? pairs.find((p) => p.id === hoverId) : null
  const hasFocus = focusIds.length > 0

  return (
    <div className="relative w-full">
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="block w-full text-[#5d503f] dark:text-gray-300"
          role="img"
          aria-label="平台 × 框架 散点图"
        >
          {/* 四象限背景 + 角落标签 */}
          <rect x={padL} y={padT} width={innerW} height={midY - padT} fill="#e8d8d3" opacity={0.28} />
          <rect x={padL} y={midY} width={innerW} height={padT + innerH - midY} fill="#f5efe2" opacity={0.35} />

          <text x={padL + 8} y={padT + 14} fontSize="10" fill="#a05a3c" opacity={0.85}>小众 · 深度绑定</text>
          <text x={padL + innerW - 8} y={padT + 14} fontSize="10" fill="#a05a3c" opacity={0.95} textAnchor="end" fontWeight="600">
            主流 · 深度绑定（锁定区）
          </text>
          <text x={padL + 8} y={padT + innerH - 4} fontSize="10" fill="#3f6a3f" opacity={0.85}>小众 · 自由</text>
          <text x={padL + innerW - 8} y={padT + innerH - 4} fontSize="10" fill="#3f6a3f" opacity={0.85} textAnchor="end">
            主流 · 自由
          </text>

          <line x1={padL} x2={padL + innerW} y1={midY} y2={midY} stroke="#cbb796" strokeDasharray="3 4" opacity={0.65} />

          {xTicks.map((t) => {
            const x = xPos(t.v)
            return (
              <g key={t.v}>
                <line x1={x} x2={x} y1={padT} y2={padT + innerH} stroke="#e8dfd0" strokeDasharray="2 3" opacity={0.5} />
                <text x={x} y={padT + innerH + 14} fontSize="10" fill="currentColor" opacity={0.6} textAnchor="middle">{t.label}</text>
              </g>
            )
          })}
          {yTicks.map((t) => {
            const y = yPos(t)
            return (
              <g key={t}>
                <line x1={padL} x2={padL + innerW} y1={y} y2={y} stroke="#e8dfd0" strokeDasharray="2 3" opacity={0.4} />
                <text x={padL - 6} y={y + 3} fontSize="10" fill="currentColor" opacity={0.6} textAnchor="end">{t}</text>
              </g>
            )
          })}

          <line x1={padL} x2={padL + innerW} y1={padT + innerH} y2={padT + innerH} stroke="currentColor" opacity={0.4} />
          <line x1={padL} x2={padL} y1={padT} y2={padT + innerH} stroke="currentColor" opacity={0.4} />

          <text x={padL + innerW / 2} y={H - 8} fontSize="10" fill="currentColor" opacity={0.7} textAnchor="middle">
            框架 GitHub stars（对数刻度）
          </text>
          <text x={14} y={padT + innerH / 2} fontSize="10" fill="currentColor" opacity={0.7} textAnchor="middle"
            transform={`rotate(-90 14 ${padT + innerH / 2})`}>
            捆绑深度（主观 0–100）
          </text>

          {/* 气泡 */}
          {pairs.map((p) => {
            const stars = p.frameworkStars > 0 ? p.frameworkStars : 1
            const cx = xPos(stars)
            const cy = yPos(p.lockIn)
            const r = rPos(p.platformTier)
            const isFocused = focusIds.includes(p.id)
            const isHover = hoverId === p.id
            const isDimmed = hasFocus && !isFocused && !isHover
            const fill = STATUS_META[p.status].color

            return (
              <g
                key={p.id}
                style={{ cursor: 'pointer', transition: 'opacity 180ms ease' }}
                opacity={isDimmed ? 0.18 : 1}
                onMouseEnter={() => onHover(p.id)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onSelect(p.id)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={fill}
                  opacity={isFocused || isHover ? 0.92 : 0.6}
                  stroke={isFocused ? '#221f19' : isHover ? '#3f3527' : 'rgba(255,255,255,0.85)'}
                  strokeWidth={isFocused ? 2 : isHover ? 1.5 : 1}
                />
                <text
                  x={cx}
                  y={cy + r + 11}
                  fontSize={isFocused || isHover ? 11 : 10}
                  fontWeight={isFocused || isHover ? 600 : 500}
                  fill="#221f19"
                  textAnchor="middle"
                  style={{ pointerEvents: 'none' }}
                  className="dark:!fill-gray-100"
                >
                  {p.platform} × {p.framework.split(' ')[0]}
                </text>
              </g>
            )
          })}
        </svg>

        {hovered ? (
          <ChartTooltip entity={hovered} chartW={W} chartH={H} xPos={xPos} yPos={yPos} rPos={rPos} />
        ) : null}
      </div>
    </div>
  )
}

function ChartTooltip({ entity, chartW, chartH, xPos, yPos, rPos }) {
  const stars = entity.frameworkStars > 0 ? entity.frameworkStars : 1
  const cx = xPos(stars)
  const cy = yPos(entity.lockIn)
  const r = rPos(entity.platformTier)
  const leftPct = (cx / chartW) * 100
  const topPct = ((cy - r - 6) / chartH) * 100
  const flipRight = leftPct > 65
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-[#3f3527]/15 bg-white/95 px-3 py-2 text-[11px] leading-5 text-[#221f19] shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-950/95 dark:text-gray-100"
      style={{
        left: `${flipRight ? Math.min(leftPct, 88) : Math.max(leftPct, 12)}%`,
        top: `${Math.max(topPct, 4)}%`,
        minWidth: 220,
      }}
    >
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: STATUS_META[entity.status].color }} />
        <strong className="text-[12px]">
          {entity.platform} × {entity.framework}
        </strong>
        <VerifiedBadge verified={entity.verified} />
      </div>
      <table className="mt-1.5 w-full tabular-nums">
        <tbody>
          <tr>
            <td className="pr-2 text-[#8f8069] dark:text-gray-500">框架 stars</td>
            <td className="text-right">{formatStars(entity.frameworkStars)}</td>
          </tr>
          <tr>
            <td className="pr-2 text-[#8f8069] dark:text-gray-500">平台 tier</td>
            <td className="text-right">{entity.platformTier} · {tierLabel(entity.platformTier)}</td>
          </tr>
          <tr>
            <td className="pr-2 text-[#8f8069] dark:text-gray-500">捆绑深度</td>
            <td className="text-right">{entity.lockIn} <SubjectiveChip /></td>
          </tr>
          <tr>
            <td className="pr-2 text-[#8f8069] dark:text-gray-500">社区反弹</td>
            <td className="text-right">{entity.backlash} <SubjectiveChip /></td>
          </tr>
          <tr>
            <td className="pr-2 text-[#8f8069] dark:text-gray-500">AI 整合</td>
            <td className="text-right">{entity.aiIntegration} <SubjectiveChip /></td>
          </tr>
        </tbody>
      </table>
      <p className="mt-1.5 text-[10px] leading-4 text-[#8f8069] dark:text-gray-500">
        {entity.latestSignal}
      </p>
    </div>
  )
}

// -------- Ranking bars --------

function RankingList({ pairs, sortBy, focusIds, hoverId, onHover, onSelect, compareMode }) {
  if (!pairs.length) return null
  const accessor = SORT_OPTIONS.find((o) => o.id === sortBy).accessor
  const sortOpt = SORT_OPTIONS.find((o) => o.id === sortBy)
  const max = Math.max(...pairs.map(accessor), 1)
  const hasFocus = focusIds.length > 0

  return (
    <div className="divide-y divide-[#f0e8d6] dark:divide-gray-800">
      {pairs.map((p, i) => {
        const v = accessor(p)
        const pct = (v / max) * 100
        const isFocused = focusIds.includes(p.id)
        const isHover = hoverId === p.id
        const isDimmed = hasFocus && !isFocused && !isHover
        const statusMeta = STATUS_META[p.status]

        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(p.id)}
            onMouseEnter={() => onHover(p.id)}
            onMouseLeave={() => onHover(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(p.id)
              }
            }}
            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition sm:px-4 ${
              isFocused
                ? 'bg-[#fbf3e3] dark:bg-[#2a2115]'
                : isHover
                ? 'bg-[#fdfaf3] dark:bg-gray-900'
                : 'hover:bg-[#fdfaf3] dark:hover:bg-gray-900'
            } ${isDimmed ? 'opacity-45' : ''}`}
          >
            <span className="w-5 shrink-0 text-right font-mono text-[10px] tabular-nums text-[#8f8069] dark:text-gray-500">
              {i + 1}
            </span>
            <div className="flex w-[220px] shrink-0 items-center gap-2 sm:w-[260px]">
              <span aria-hidden="true" className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: statusMeta.color }} />
              <span className="min-w-0 truncate text-[13px] font-semibold text-[#221f19] dark:text-gray-100">
                {p.platform} <span className="text-[#9a8e76]">×</span> {p.framework}
              </span>
              <VerifiedBadge verified={p.verified} />
              {compareMode && isFocused ? (
                <span className="shrink-0 rounded-full bg-[#3f3527] px-1.5 py-px text-[9px] font-medium text-white dark:bg-gray-200 dark:text-[#111]">
                  ✓
                </span>
              ) : null}
            </div>
            <div className="relative h-4 flex-1 rounded-sm bg-[#f0e8d6] dark:bg-gray-800">
              <div
                className="h-full rounded-sm transition-[width]"
                style={{ width: `${pct}%`, backgroundColor: statusMeta.color, opacity: isFocused ? 1 : 0.78 }}
              />
            </div>
            <span className="w-14 shrink-0 text-right font-mono text-[12px] tabular-nums text-[#221f19] dark:text-gray-100">
              {sortBy === 'frameworkStars' ? formatStars(v) : sortBy === 'foundedPairing' ? v : v}
              {sortOpt.unit && sortBy !== 'frameworkStars' ? ` ${sortOpt.unit}` : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// -------- Compare table --------

function CompareTable({ entities, onRemove }) {
  const rows = [
    { key: 'platform', label: '平台', fmt: (e) => e.platform, kind: 'meta' },
    { key: 'framework', label: '框架', fmt: (e) => e.framework, kind: 'meta' },
    { key: 'status', label: '状态', fmt: (e) => STATUS_META[e.status].label, kind: 'status' },
    { key: 'foundedPairing', label: '关系建立', fmt: (e) => e.foundedPairing, kind: 'measured' },
    { key: 'frameworkStars', label: '框架 stars', fmt: (e) => formatStars(e.frameworkStars), kind: 'measured' },
    { key: 'platformTier', label: '平台 tier', fmt: (e) => `${e.platformTier} · ${tierLabel(e.platformTier)}`, kind: 'measured' },
    { key: 'lockIn', label: '捆绑深度', fmt: (e) => e.lockIn, kind: 'subjective', tone: (e) => (e.lockIn >= 70 ? 'bad' : e.lockIn <= 20 ? 'good' : '') },
    { key: 'backlash', label: '社区反弹', fmt: (e) => e.backlash, kind: 'subjective', tone: (e) => (e.backlash >= 60 ? 'bad' : e.backlash <= 15 ? 'good' : '') },
    { key: 'aiIntegration', label: 'AI 整合', fmt: (e) => e.aiIntegration, kind: 'subjective', tone: (e) => (e.aiIntegration >= 70 ? 'good' : '') },
    { key: 'primaryLockIn', label: '主要锁定机制', fmt: (e) => e.primaryLockIn, multi: true },
    { key: 'latestSignal', label: '最近信号', fmt: (e) => e.latestSignal, multi: true },
    { key: 'developerNote', label: '开发者建议', fmt: (e) => e.developerNote, multi: true },
    { key: 'competitorNote', label: '竞争者视角', fmt: (e) => e.competitorNote, multi: true },
  ]

  return (
    <section className="mt-5 rounded-xl border border-[#e8dfd0] bg-white/80 p-3 dark:border-gray-800 dark:bg-gray-900/70 sm:p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
          对比 · {entities.length} 组配对
        </h2>
        <p className="text-[11px] text-[#8f8069] dark:text-gray-500">在散点 / 排行中再点选可增减</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-28 sm:w-36" />
              {entities.map((e) => (
                <th key={e.id} className="border-b border-[#e8dfd0] px-2 py-2 text-left align-top dark:border-gray-800">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span aria-hidden="true" className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: STATUS_META[e.status].color }} />
                        <span className="font-serif text-[13px] font-semibold text-[#221f19] dark:text-gray-100">
                          {e.platform} × {e.framework}
                        </span>
                        <VerifiedBadge verified={e.verified} size="lg" />
                      </div>
                      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f8069] dark:text-gray-500">
                        since {e.foundedPairing} · {STATUS_META[e.status].label}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(e.id)}
                      className="shrink-0 rounded-md border border-[#e0d3b8] bg-white px-1.5 py-0.5 text-[10px] text-[#8f8069] hover:bg-[#f5efe2] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-500 dark:hover:bg-gray-800"
                      aria-label={`移除 ${e.platform} × ${e.framework}`}
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="border-b border-[#f0e8d6] px-2 py-2 align-top dark:border-gray-800">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8f8069] dark:text-gray-500">
                      {row.label}
                    </span>
                    {row.kind === 'subjective' ? <SubjectiveChip /> : null}
                  </div>
                </td>
                {entities.map((e) => {
                  const tone = row.tone?.(e) || ''
                  const toneCls = tone === 'good'
                    ? 'text-[#3f6a3f] dark:text-[#a3d4a3]'
                    : tone === 'bad'
                    ? 'text-[#a05a3c] dark:text-[#e2a07a]'
                    : 'text-[#221f19] dark:text-gray-100'
                  return (
                    <td
                      key={e.id}
                      className={`border-b border-[#f0e8d6] px-2 py-2 align-top text-[12px] tabular-nums dark:border-gray-800 ${toneCls} ${row.multi ? 'leading-5' : 'font-semibold'}`}
                    >
                      {row.fmt(e)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// -------- Single detail panel --------

function PairDetail({ entity, onClose }) {
  const statusMeta = STATUS_META[entity.status]
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
            详情 · since {entity.foundedPairing}
          </p>
          <h2 className="mt-1 flex flex-wrap items-baseline gap-2 font-serif text-[22px] font-semibold text-[#221f19] dark:text-gray-100">
            <span>{entity.platform}</span>
            <span className="text-[#9a8e76]">×</span>
            <span>{entity.framework}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: statusMeta.color }}
            >
              {statusMeta.label}
            </span>
            <VerifiedBadge verified={entity.verified} size="lg" />
          </h2>
          <p className="mt-1 text-[12px] leading-5 text-[#8f8069] dark:text-gray-500">
            最近信号：{entity.latestSignal}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-[#e0d3b8] bg-white px-2 py-0.5 text-[11px] text-[#6d614c] hover:bg-[#f5efe2] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          收起 ×
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KeyStat label="框架 stars" value={formatStars(entity.frameworkStars)} kind="measured" />
        <KeyStat label="平台 tier" value={`${entity.platformTier} / 5`} sub={tierLabel(entity.platformTier)} kind="measured" />
        <KeyStat label="捆绑深度" value={entity.lockIn} kind="subjective" tone={entity.lockIn >= 70 ? 'bad' : entity.lockIn <= 20 ? 'good' : ''} />
        <KeyStat label="社区反弹" value={entity.backlash} kind="subjective" tone={entity.backlash >= 60 ? 'bad' : entity.backlash <= 15 ? 'good' : ''} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8f8069] dark:text-[#8e9ab0]">
            主观打分对比
          </p>
          <ul className="mt-2 space-y-2">
            {[
              { key: 'lockIn', label: '捆绑深度', value: entity.lockIn, rubric: SCORING_RUBRIC.lockIn },
              { key: 'backlash', label: '社区反弹', value: entity.backlash, rubric: SCORING_RUBRIC.backlash },
              { key: 'aiIntegration', label: 'AI 整合度', value: entity.aiIntegration, rubric: SCORING_RUBRIC.aiIntegration },
            ].map((m) => (
              <li key={m.key}>
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="w-20 shrink-0 text-[#5d503f] dark:text-gray-300">{m.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f0e8d6] dark:bg-gray-800">
                    <div className="h-full" style={{ width: `${m.value}%`, backgroundColor: statusMeta.color }} />
                  </div>
                  <span className="w-9 shrink-0 text-right font-mono tabular-nums text-[#221f19] dark:text-gray-100">{m.value}</span>
                </div>
                <p className="mt-0.5 pl-[88px] text-[10.5px] leading-4 text-[#8f8069] dark:text-gray-500">
                  {m.rubric}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="rounded-lg border border-[#f5d6b8] bg-[#fff6e6]/60 p-3 dark:border-[#5a4128] dark:bg-[#2a1c10]/40">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a05a3c] dark:text-[#e2a07a]">
              主要锁定机制
            </p>
            <p className="mt-1.5 text-[12px] leading-5 text-[#5d503f] dark:text-gray-300">
              {entity.primaryLockIn}
            </p>
          </div>
          <div className="mt-3 rounded-lg border border-[#cfdfd0] bg-[#eef6ee]/50 p-3 dark:border-[#2c4030] dark:bg-[#152018]/40">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#3f6a3f] dark:text-[#a3d4a3]">
              对开发者
            </p>
            <p className="mt-1.5 text-[12px] leading-5 text-[#5d503f] dark:text-gray-300">
              {entity.developerNote}
            </p>
          </div>
          <div className="mt-3 rounded-lg border border-[#d6dee9] bg-[#eef2f7]/60 p-3 dark:border-[#2a3548] dark:bg-[#141a23]/60">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#3f4b5d] dark:text-[#9bb6df]">
              竞争者视角
            </p>
            <p className="mt-1.5 text-[12px] leading-5 text-[#5d503f] dark:text-gray-300">
              {entity.competitorNote}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] text-[#8f8069] dark:text-gray-500">
        <span>一手信源：</span>
        <a href={entity.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[#5d503f] dark:hover:text-gray-300">
          {entity.sourceUrl}
        </a>
      </div>
    </div>
  )
}

// =================== Research Framework =====================

function ResearchFramework() {
  return (
    <section className="mt-6">
      {/* Hero / thesis card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#cbb796] bg-gradient-to-br from-[#fbf3e3] via-[#f7ecd2] to-[#fbf3e3] p-5 dark:border-[#5a4f3a] dark:from-[#1f1a12] dark:via-[#1a1610] dark:to-[#1f1a12] sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.08]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 0% 0%, #b7791f 0%, transparent 38%), radial-gradient(circle at 100% 100%, #6b85a6 0%, transparent 40%)',
          }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a5a14] dark:text-[#e2bd75]">
              Featured Research · Framework
            </span>
            <span
              className="rounded-full bg-[#f4d4cf] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8b3a36] dark:bg-[#3a1d1c] dark:text-[#ed9d97]"
              title="官方公告已发布"
            >
              {FRAMEWORK_META.eventBadge}
            </span>
          </div>
          <h2 className="mt-2 font-serif text-[20px] font-semibold leading-snug text-[#221f19] dark:text-gray-100 sm:text-[24px]">
            {FRAMEWORK_META.title}
          </h2>
          <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
            {FRAMEWORK_META.subtitle}
          </p>
          <p className="mt-3 max-w-3xl border-l-2 border-[#b7791f] pl-3 text-[14px] leading-7 text-[#5d503f] dark:border-[#e2bd75] dark:text-gray-300">
            {FRAMEWORK_META.thesis}
          </p>

          {/* Primary sources */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#8f8069] dark:text-gray-500">
            <span className="font-mono uppercase tracking-[0.16em]">一手信源</span>
            {PRIMARY_SOURCES.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-[#5d503f] dark:hover:text-gray-300"
              >
                {s.label} ↗
              </a>
            ))}
          </div>

          {/* Signal timeline */}
          <div className="mt-4 -mb-1 overflow-x-auto">
            <ol className="flex min-w-max items-stretch gap-0">
              {SIGNAL_TIMELINE.map((s, i) => {
                const isLast = i === SIGNAL_TIMELINE.length - 1
                return (
                  <li key={`${s.year}-${i}`} className="flex items-start gap-2">
                    <div className="flex flex-col items-center pt-1">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          s.highlight ? 'bg-[#a05a3c] dark:bg-[#e2a07a]' : 'bg-[#b7791f] dark:bg-[#e2bd75]'
                        }`}
                      />
                      {!isLast ? (
                        <span aria-hidden="true" className="mt-1 h-8 w-px bg-[#cbb796] dark:bg-[#5a4f3a]" />
                      ) : null}
                    </div>
                    <div className="min-w-[160px] max-w-[200px] pb-2 pr-4">
                      <p
                        className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
                          s.highlight ? 'text-[#a05a3c] dark:text-[#e2a07a]' : 'text-[#8a5a14] dark:text-[#e2bd75]'
                        }`}
                      >
                        {s.year}
                      </p>
                      <p className="mt-0.5 text-[11.5px] leading-5 text-[#5d503f] dark:text-gray-300">
                        {s.label}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>

      {/* TOC quick-jump */}
      <nav
        aria-label="研报章节快速跳转"
        className="mt-4 -mx-1 flex flex-wrap gap-1"
      >
        {FRAMEWORK_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#fwk-${s.id}`}
            className="inline-flex items-center gap-1 rounded-md border border-[#e8dfd0] bg-white/70 px-2 py-1 text-[11px] text-[#6d614c] no-underline hover:border-[#b7791f] hover:text-[#221f19] dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-400 dark:hover:border-[#e2bd75] dark:hover:text-gray-100"
          >
            <span className="font-mono text-[9px] tracking-[0.12em] text-[#8a5a14] dark:text-[#e2bd75]">
              {s.number}
            </span>
            <span>{s.title.split('：')[0]}</span>
          </a>
        ))}
      </nav>

      {/* 10 sections —— 编辑式单栏，左侧数字 rail */}
      <ol className="mt-5 relative">
        {FRAMEWORK_SECTIONS.map((s, i) => (
          <FrameworkSection key={s.id} section={s} isLast={i === FRAMEWORK_SECTIONS.length - 1} />
        ))}
      </ol>

      <p className="mt-6 border-t border-dashed border-[#e8dfd0] pt-4 text-[12px] leading-6 text-[#8f8069] dark:border-gray-800 dark:text-gray-500">
        研报框架是<strong className="text-[#5d503f] dark:text-gray-300">判断层</strong>，下面的 10 组配对散点 + 排行 + 对比表是<strong className="text-[#5d503f] dark:text-gray-300">证据层</strong>。
        框架里第 02、04、05、07 节的论点，直接在数据视图上有对应可点的实体。
      </p>
    </section>
  )
}

function FrameworkSection({ section, isLast }) {
  const accent = section.accent
  const railColor =
    accent === 'highlight'
      ? 'bg-[#b7791f] dark:bg-[#e2bd75]'
      : accent === 'warning'
      ? 'bg-[#a05a3c] dark:bg-[#e2a07a]'
      : 'bg-[#cbb796] dark:bg-[#5a4f3a]'

  const numberColor =
    accent === 'highlight'
      ? 'text-[#8a5a14] dark:text-[#e2bd75]'
      : accent === 'warning'
      ? 'text-[#a05a3c] dark:text-[#e2a07a]'
      : 'text-[#a09176] dark:text-[#7f8aa0]'

  return (
    <li id={`fwk-${section.id}`} className="scroll-mt-20 relative pl-12 sm:pl-16">
      {/* 数字锚点 */}
      <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center sm:h-10 sm:w-10">
        <span className={`font-mono text-[18px] font-semibold tabular-nums sm:text-[20px] ${numberColor}`}>
          {section.number}
        </span>
      </div>
      {/* 垂直 rail（左对齐数字下方） */}
      {!isLast ? (
        <span
          aria-hidden="true"
          className={`absolute left-[18px] top-10 bottom-0 w-px sm:left-[20px] ${railColor} opacity-50`}
        />
      ) : null}

      <article className="pb-8">
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="font-serif text-[17px] font-semibold leading-snug text-[#221f19] dark:text-gray-100 sm:text-[19px]">
            {section.title}
          </h3>
          {section.needsFact ? (
            <span
              className="rounded-full bg-[#fde6c6] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8b5a1f] dark:bg-[#3a2c14] dark:text-[#f0c776]"
              title="该节包含未官方确认的事实"
            >
              待核实
            </span>
          ) : null}
        </div>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-7 text-[#5d503f] dark:text-gray-300">
          {section.body}
        </p>
      </article>
    </li>
  )
}

function KeyStat({ label, value, sub, tone, kind }) {
  const toneCls =
    tone === 'good'
      ? 'text-[#3f6a3f] dark:text-[#a3d4a3]'
      : tone === 'bad'
      ? 'text-[#a05a3c] dark:text-[#e2a07a]'
      : 'text-[#221f19] dark:text-gray-100'
  return (
    <div className="rounded-md bg-[#fdfaf3] px-3 py-2 dark:bg-gray-950/60">
      <div className="flex items-center gap-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#8f8069] dark:text-gray-500">
          {label}
        </span>
        {kind === 'subjective' ? <SubjectiveChip /> : null}
      </div>
      <div className={`mt-0.5 font-serif text-[18px] font-semibold tabular-nums ${toneCls}`}>{value}</div>
      {sub ? <div className="text-[10px] text-[#8f8069] dark:text-gray-500">{sub}</div> : null}
    </div>
  )
}

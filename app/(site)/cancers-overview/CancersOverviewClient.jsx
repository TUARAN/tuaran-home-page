'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

import SharePageButton from '../components/SharePageButton'

import {
  AGE_BUCKETS_DISPLAY,
  CANCERS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  GLOBAL_TOTAL,
} from './data'

const SHARE_URL = 'https://2aran.com/cancers-overview'

const SORT_OPTIONS = [
  { id: 'incidence', label: '发病率', accessor: (c) => c.incidence },
  { id: 'mortality', label: '死亡率', accessor: (c) => c.mortality },
  { id: 'survival', label: '5 年生存率', accessor: (c) => c.survival5y },
  { id: 'fatality', label: '致死率', accessor: (c) => Math.round((c.mortality / c.incidence) * 100) },
]

const GENDER_FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'male', label: '男性高发' },
  { id: 'female', label: '女性高发' },
]

const CATEGORIES = Object.keys(CATEGORY_LABELS)

function formatNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)} 万`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

function fatalityRate(c) {
  return Math.round((c.mortality / c.incidence) * 100)
}

function genderClass(c) {
  if (c.genderRatio.male >= 60) return 'male'
  if (c.genderRatio.female >= 60) return 'female'
  return 'mixed'
}

const GENDER_DOT_COLOR = {
  male: '#6b85a6',
  female: '#c98a96',
  mixed: '#a08773',
}

export default function CancersOverviewClient() {
  const [query, setQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState('all')
  const [sortBy, setSortBy] = useState('incidence')
  const [activeCategories, setActiveCategories] = useState([])
  const [openId, setOpenId] = useState(null)
  const [hoverId, setHoverId] = useState(null)

  // ---- URL state 同步（可分享筛选） ----
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    const g = params.get('gender')
    const s = params.get('sort')
    const c = params.get('cats')
    const o = params.get('open')
    if (q) setQuery(q)
    if (g && GENDER_FILTERS.some((f) => f.id === g)) setGenderFilter(g)
    if (s && SORT_OPTIONS.some((f) => f.id === s)) setSortBy(s)
    if (c) setActiveCategories(c.split(',').filter((cat) => CATEGORIES.includes(cat)))
    if (o && CANCERS.some((cancer) => cancer.id === o)) setOpenId(o)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (genderFilter !== 'all') params.set('gender', genderFilter)
    if (sortBy !== 'incidence') params.set('sort', sortBy)
    if (activeCategories.length) params.set('cats', activeCategories.join(','))
    if (openId) params.set('open', openId)
    const qs = params.toString()
    const next = qs ? `?${qs}` : window.location.pathname
    window.history.replaceState(null, '', next)
  }, [query, genderFilter, sortBy, activeCategories, openId])

  const toggleCategory = useCallback((cat) => {
    setActiveCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CANCERS.filter((c) => {
      if (q) {
        const hay = `${c.nameZh}${c.nameEn}${c.primaryFactor}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (genderFilter === 'male' && c.genderRatio.male < 60) return false
      if (genderFilter === 'female' && c.genderRatio.female < 60) return false
      if (activeCategories.length) {
        const hits = c.riskFactors.filter((r) => activeCategories.includes(r.category))
        if (!hits.length) return false
      }
      return true
    })
  }, [query, genderFilter, activeCategories])

  const sortAccessor = SORT_OPTIONS.find((o) => o.id === sortBy).accessor
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => sortAccessor(b) - sortAccessor(a))
  }, [filtered, sortAccessor])

  const filteredIncidence = useMemo(() => filtered.reduce((s, c) => s + c.incidence, 0), [filtered])
  const filteredMortality = useMemo(() => filtered.reduce((s, c) => s + c.mortality, 0), [filtered])

  const openCancer = openId ? CANCERS.find((c) => c.id === openId) : null

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
      {/* ---- Header ---- */}
      <header className="flex flex-col gap-4 border-b border-[#e8dfd0] pb-5 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
            Cancers · GLOBOCAN 2022
          </p>
          <h1 className="mt-2 font-serif text-[26px] font-semibold leading-tight text-[#221f19] dark:text-gray-100 sm:text-[30px]">
            癌症全景
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#5d554a] dark:text-gray-400">
            10 种主要癌症的发病、死亡、生存与风险因子可视化。数据来自{' '}
            <a
              href="https://gco.iarc.fr/today"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[#cbb796] underline-offset-2 hover:text-[#221f19] dark:hover:text-gray-200"
            >
              GLOBOCAN 2022
            </a>{' '}
            与{' '}
            <a
              href="https://seer.cancer.gov/statfacts/"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[#cbb796] underline-offset-2 hover:text-[#221f19] dark:hover:text-gray-200"
            >
              US SEER
            </a>
            。本页为科普整理，<strong className="text-[#a05a3c] dark:text-[#e2a07a]">不构成医学建议</strong>，
            个体风险需经专业医师评估。
          </p>
        </div>
        <SharePageButton
          title="癌症全景 · 发病 / 死亡 / 生存 / 风险因子"
          text="10 种主要癌症的关键数据与风险因子可视化"
          url={SHARE_URL}
          size="md"
        />
      </header>

      {/* ---- Filters ---- */}
      <section className="mt-5 rounded-xl border border-[#e8dfd0] bg-[#fdfaf3]/70 p-3 dark:border-gray-800 dark:bg-gray-900/60 sm:p-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索：肺癌 / breast / 吸烟…"
            className="min-w-[180px] flex-1 rounded-lg border border-[#e0d3b8] bg-white px-3 py-1.5 text-sm text-[#221f19] outline-none placeholder:text-[#bbae93] focus:border-[#b7791f] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-600"
          />
          <div className="flex items-center gap-1 rounded-lg border border-[#e0d3b8] bg-white p-0.5 text-xs dark:border-gray-700 dark:bg-gray-950">
            {GENDER_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setGenderFilter(f.id)}
                className={`rounded-md px-2.5 py-1 transition ${
                  genderFilter === f.id
                    ? 'bg-[#3f3527] text-white dark:bg-gray-200 dark:text-[#111]'
                    : 'text-[#6d614c] hover:bg-[#f5efe2] dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-[#e0d3b8] bg-white p-0.5 text-xs dark:border-gray-700 dark:bg-gray-950">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSortBy(opt.id)}
                className={`rounded-md px-2.5 py-1 transition ${
                  sortBy === opt.id
                    ? 'bg-[#3f3527] text-white dark:bg-gray-200 dark:text-[#111]'
                    : 'text-[#6d614c] hover:bg-[#f5efe2] dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.16em] text-[#8f8069] dark:text-[#8e9ab0]">
            风险因子
          </span>
          {CATEGORIES.map((cat) => {
            const active = activeCategories.includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] transition ${
                  active
                    ? 'text-white'
                    : 'border border-[#e0d3b8] bg-white text-[#6d614c] hover:border-[#b7791f] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400'
                }`}
                style={active ? { backgroundColor: CATEGORY_COLORS[cat] } : undefined}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            )
          })}
          {(activeCategories.length || genderFilter !== 'all' || sortBy !== 'incidence' || query) ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setGenderFilter('all')
                setSortBy('incidence')
                setActiveCategories([])
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
        <StatTile label="筛选后年新发" value={formatNumber(filteredIncidence)} sub={`全部癌症约 ${formatNumber(GLOBAL_TOTAL.incidence)}`} />
        <StatTile label="筛选后年死亡" value={formatNumber(filteredMortality)} sub={`全部癌症约 ${formatNumber(GLOBAL_TOTAL.mortality)}`} />
        <StatTile label="筛选后癌种" value={`${filtered.length} / ${CANCERS.length}`} sub="点击图中气泡或下方条目可展开" />
        <StatTile label="数据口径" value="GLOBOCAN 2022" sub="IARC / WHO 全球年度估算" />
      </section>

      {/* ---- Quadrant scatter ---- */}
      <section className="mt-5 rounded-xl border border-[#e8dfd0] bg-white/80 p-3 dark:border-gray-800 dark:bg-gray-900/70 sm:p-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
            散点 · 发病率 × 生存率
          </h2>
          <p className="text-[11px] text-[#8f8069] dark:text-gray-500">
            气泡大小 = 年死亡数 · 颜色 = 性别偏好
          </p>
        </div>
        <QuadrantChart
          cancers={filtered}
          selectedId={openId}
          hoverId={hoverId}
          onHover={setHoverId}
          onSelect={(id) => setOpenId(openId === id ? null : id)}
        />
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#8f8069] dark:text-gray-500">
          <LegendDot color={GENDER_DOT_COLOR.male} label="男性高发" />
          <LegendDot color={GENDER_DOT_COLOR.female} label="女性高发" />
          <LegendDot color={GENDER_DOT_COLOR.mixed} label="男女均见" />
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
          cancers={sorted}
          sortBy={sortBy}
          selectedId={openId}
          hoverId={hoverId}
          onHover={setHoverId}
          onSelect={(id) => setOpenId(openId === id ? null : id)}
        />
        {!sorted.length ? (
          <div className="py-12 text-center text-[13px] text-[#8f8069] dark:text-gray-500">
            没有匹配的癌症条目。试着放宽筛选或重置。
          </div>
        ) : null}
      </section>

      {/* ---- Detail panel ---- */}
      {openCancer ? (
        <section className="mt-5 rounded-xl border-l-4 bg-white/85 p-4 dark:bg-gray-900/80 sm:p-5"
          style={{ borderLeftColor: openCancer.color }}
        >
          <CancerDetail cancer={openCancer} onClose={() => setOpenId(null)} />
        </section>
      ) : null}

      {/* ---- Footer ---- */}
      <footer className="mt-10 border-t border-[#e8dfd0] pt-6 text-[12px] leading-6 text-[#7a6f5d] dark:border-gray-800 dark:text-gray-500">
        <p className="font-semibold text-[#5d503f] dark:text-gray-300">数据口径与免责声明</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            发病率 / 死亡率取自{' '}
            <a href="https://gco.iarc.fr/today" target="_blank" rel="noreferrer" className="underline underline-offset-2">
              GLOBOCAN 2022
            </a>
            （IARC），为全球年度新发 / 死亡估算。
          </li>
          <li>
            5 年相对生存率以{' '}
            <a href="https://seer.cancer.gov/statfacts/" target="_blank" rel="noreferrer" className="underline underline-offset-2">
              US SEER 2014–2020
            </a>{' '}
            全分期合计为锚点；中国与全球总体值通常较低（不同分期、不同医疗可及性差异巨大）。
          </li>
          <li>
            性别比与年龄分布为基于公开汇总的形状近似，非精准百分位；风险因子权重为示意性相对重要度，非 PAF（人群归因分数）。
          </li>
          <li>
            筛查建议（如 LDCT / 钼靶 / 肠镜 / 胃镜 / HPV 疫苗）参考各国主流指南；具体频率与起始年龄请以本人所在国家的最新指南为准。
          </li>
          <li>
            <strong>本页为公开数据的可视化整理，不构成临床诊断或治疗建议。</strong>个体风险评估、筛查方案、症状判断请咨询专业医师。
          </li>
        </ul>
        <p className="mt-4 text-[11px] text-[#8f8069] dark:text-gray-600">
          数据更新：2026-06 · 站点：
          <Link href="/" className="underline underline-offset-2">2aran.com</Link>
        </p>
      </footer>
    </main>
  )
}

// ============== 子组件 ==============

function StatTile({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-[#e8dfd0] bg-white/70 p-3 dark:border-gray-800 dark:bg-gray-900/70">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
        {label}
      </p>
      <p className="mt-1 font-serif text-[20px] font-semibold tabular-nums text-[#221f19] dark:text-gray-100">
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

// -------- Quadrant chart --------

function QuadrantChart({ cancers, selectedId, hoverId, onHover, onSelect }) {
  const W = 720
  const H = 360
  const padL = 50
  const padR = 24
  const padT = 28
  const padB = 40
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  // X = log10(incidence)
  const xMin = 5.4 // ~250k
  const xMax = 6.5 // ~3.16M
  // Y = survival rate, but invert (top = high survival)
  const yMin = 0
  const yMax = 100

  const xPos = (incidence) => {
    const x = Math.log10(incidence)
    return padL + ((x - xMin) / (xMax - xMin)) * innerW
  }
  const yPos = (survival) => padT + (1 - (survival - yMin) / (yMax - yMin)) * innerH

  const maxMortality = Math.max(...cancers.map((c) => c.mortality), 1)
  const rPos = (mortality) => 6 + (mortality / maxMortality) * 18

  // X ticks (incidence)
  const xTicks = [
    { v: 500_000, label: '50万' },
    { v: 1_000_000, label: '100万' },
    { v: 2_000_000, label: '200万' },
  ]
  const yTicks = [25, 50, 75]

  // Quadrant divider at survival = 50%
  const midY = yPos(50)

  // 用稳健 label 偏移规则：根据气泡半径推出 label 偏移
  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full min-w-[520px] text-[#5d503f] dark:text-gray-300"
        role="img"
        aria-label="癌症发病率 × 生存率 散点图"
      >
        {/* 背景四象限淡色 */}
        <rect x={padL} y={padT} width={innerW} height={midY - padT} fill="#f5efe2" opacity={0.35} />
        <rect x={padL} y={midY} width={innerW} height={padT + innerH - midY} fill="#e8d8d3" opacity={0.32} />

        {/* 象限标签 */}
        <text x={padL + 8} y={padT + 14} fontSize="10" fill="#7d9c7c" opacity={0.85}>
          少见 · 可控
        </text>
        <text x={padL + innerW - 8} y={padT + 14} fontSize="10" fill="#3f6a3f" opacity={0.85} textAnchor="end">
          常见 · 可控
        </text>
        <text x={padL + 8} y={padT + innerH - 4} fontSize="10" fill="#a05a3c" opacity={0.85}>
          少见 · 难治
        </text>
        <text x={padL + innerW - 8} y={padT + innerH - 4} fontSize="10" fill="#a05a3c" opacity={0.95} textAnchor="end" fontWeight="600">
          常见 · 难治（高负担区）
        </text>

        {/* 50% 生存率分隔线 */}
        <line x1={padL} x2={padL + innerW} y1={midY} y2={midY} stroke="#cbb796" strokeDasharray="3 4" opacity={0.65} />

        {/* X 网格 + ticks */}
        {xTicks.map((t) => {
          const x = xPos(t.v)
          return (
            <g key={t.v}>
              <line x1={x} x2={x} y1={padT} y2={padT + innerH} stroke="#e8dfd0" strokeDasharray="2 3" opacity={0.5} />
              <text x={x} y={padT + innerH + 14} fontSize="10" fill="currentColor" opacity={0.6} textAnchor="middle">
                {t.label}
              </text>
            </g>
          )
        })}
        {/* Y ticks */}
        {yTicks.map((t) => {
          const y = yPos(t)
          return (
            <g key={t}>
              <line x1={padL} x2={padL + innerW} y1={y} y2={y} stroke="#e8dfd0" strokeDasharray="2 3" opacity={0.4} />
              <text x={padL - 6} y={y + 3} fontSize="10" fill="currentColor" opacity={0.6} textAnchor="end">
                {t}%
              </text>
            </g>
          )
        })}

        {/* 轴线 */}
        <line x1={padL} x2={padL + innerW} y1={padT + innerH} y2={padT + innerH} stroke="currentColor" opacity={0.4} />
        <line x1={padL} x2={padL} y1={padT} y2={padT + innerH} stroke="currentColor" opacity={0.4} />

        {/* 轴标签 */}
        <text x={padL + innerW / 2} y={H - 8} fontSize="10" fill="currentColor" opacity={0.7} textAnchor="middle">
          年新发人数（对数刻度，log10）
        </text>
        <text
          x={14}
          y={padT + innerH / 2}
          fontSize="10"
          fill="currentColor"
          opacity={0.7}
          textAnchor="middle"
          transform={`rotate(-90 14 ${padT + innerH / 2})`}
        >
          5 年生存率（%）
        </text>

        {/* 气泡 + 标签 */}
        {cancers.map((c) => {
          const cx = xPos(c.incidence)
          const cy = yPos(c.survival5y)
          const r = rPos(c.mortality)
          const isSelected = selectedId === c.id
          const isHover = hoverId === c.id
          const gKey = genderClass(c)
          const fill = GENDER_DOT_COLOR[gKey]
          return (
            <g
              key={c.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => onHover(c.id)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(c.id)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={fill}
                opacity={isSelected || isHover ? 0.92 : 0.62}
                stroke={isSelected ? '#221f19' : isHover ? '#3f3527' : 'rgba(255,255,255,0.85)'}
                strokeWidth={isSelected ? 2 : isHover ? 1.5 : 1}
              />
              <text
                x={cx}
                y={cy + r + 11}
                fontSize={isSelected || isHover ? 11 : 10}
                fontWeight={isSelected || isHover ? 600 : 500}
                fill="#221f19"
                textAnchor="middle"
                style={{ pointerEvents: 'none' }}
                className="dark:!fill-gray-100"
              >
                {c.nameZh}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// -------- Ranking horizontal bars --------

function RankingList({ cancers, sortBy, selectedId, hoverId, onHover, onSelect }) {
  if (!cancers.length) return null
  const accessor = SORT_OPTIONS.find((o) => o.id === sortBy).accessor
  const max = Math.max(...cancers.map(accessor), 1)

  return (
    <div className="divide-y divide-[#f0e8d6] dark:divide-gray-800">
      {cancers.map((c, i) => {
        const v = accessor(c)
        const pct = (v / max) * 100
        const isSelected = selectedId === c.id
        const isHover = hoverId === c.id
        const fatality = fatalityRate(c)
        const gKey = genderClass(c)

        // 当排序为 incidence/mortality 时，叠一条次要指标条
        const secondary =
          sortBy === 'incidence'
            ? { v: c.mortality, max: c.incidence, label: '死亡', color: c.color, dim: true }
            : sortBy === 'mortality'
            ? { v: c.mortality, max: max, label: '死亡', color: c.color, dim: false }
            : null

        return (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(c.id)}
            onMouseEnter={() => onHover(c.id)}
            onMouseLeave={() => onHover(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(c.id)
              }
            }}
            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition sm:px-4 ${
              isSelected
                ? 'bg-[#fbf3e3] dark:bg-[#2a2115]'
                : isHover
                ? 'bg-[#fdfaf3] dark:bg-gray-900'
                : 'hover:bg-[#fdfaf3] dark:hover:bg-gray-900'
            }`}
          >
            {/* 排名 */}
            <span className="w-5 shrink-0 text-right font-mono text-[10px] tabular-nums text-[#8f8069] dark:text-gray-500">
              {i + 1}
            </span>

            {/* 色块 + 名字 */}
            <div className="flex w-[170px] shrink-0 items-center gap-2 sm:w-[200px]">
              <span aria-hidden="true" className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: c.color }} />
              <span className="truncate text-[13px] font-semibold text-[#221f19] dark:text-gray-100">
                {c.nameZh}
              </span>
              <span
                className={`shrink-0 rounded-full px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] ${
                  gKey === 'male'
                    ? 'bg-[#dee6f0] text-[#3f4b5d] dark:bg-[#1c2632] dark:text-[#b3c0d1]'
                    : gKey === 'female'
                    ? 'bg-[#f1dde3] text-[#83405a] dark:bg-[#2a1a22] dark:text-[#d9a3b8]'
                    : 'bg-[#ede5d2] text-[#6d614c] dark:bg-[#1f1a14] dark:text-[#bbae93]'
                }`}
              >
                {gKey === 'male' ? '♂' : gKey === 'female' ? '♀' : '⚥'}
              </span>
            </div>

            {/* 主条 */}
            <div className="relative h-4 flex-1 rounded-sm bg-[#f0e8d6] dark:bg-gray-800">
              <div
                className="h-full rounded-sm transition-[width]"
                style={{ width: `${pct}%`, backgroundColor: c.color, opacity: isSelected ? 1 : 0.78 }}
              />
              {secondary ? (
                <div
                  className="absolute left-0 top-0 h-full rounded-sm"
                  style={{
                    width: `${(secondary.v / secondary.max) * pct}%`,
                    backgroundColor: '#3f3527',
                    opacity: 0.35,
                  }}
                  title={`${secondary.label} ${formatNumber(secondary.v)}`}
                />
              ) : null}
            </div>

            {/* 主数值 */}
            <span className="w-16 shrink-0 text-right font-mono text-[12px] tabular-nums text-[#221f19] dark:text-gray-100">
              {sortBy === 'survival' || sortBy === 'fatality' ? `${v}%` : formatNumber(v)}
            </span>

            {/* 副指标小 chip 群 */}
            <div className="hidden shrink-0 items-center gap-1 text-[10px] sm:flex">
              <Chip label="生存" value={`${c.survival5y}%`} good={c.survival5y >= 60} bad={c.survival5y < 30} />
              <Chip label="致死" value={`${fatality}%`} good={fatality <= 30} bad={fatality >= 70} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Chip({ label, value, good = false, bad = false }) {
  const tone = good
    ? 'border-[#cfdfd0] bg-[#eef6ee] text-[#3f6a3f] dark:border-[#2c4030] dark:bg-[#152018] dark:text-[#a3d4a3]'
    : bad
    ? 'border-[#f5d6b8] bg-[#fff6e6] text-[#a05a3c] dark:border-[#5a4128] dark:bg-[#2a1c10] dark:text-[#e2a07a]'
    : 'border-[#e8dfd0] bg-[#fdfaf3] text-[#6d614c] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 tabular-nums ${tone}`}>
      <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] opacity-60">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  )
}

// -------- Detail panel --------

function CancerDetail({ cancer, onClose }) {
  const maxAge = Math.max(...cancer.ageDistribution, 1)
  const fatality = fatalityRate(cancer)
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8f8069] dark:text-[#8e9ab0]">
            详情 · {cancer.nameEn}
          </p>
          <h2 className="mt-1 font-serif text-[22px] font-semibold text-[#221f19] dark:text-gray-100">
            {cancer.nameZh}
            <span className="ml-2 text-[12px] font-normal text-[#8f8069] dark:text-gray-500">
              主因：{cancer.primaryFactor}
            </span>
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-[#e0d3b8] bg-white px-2 py-0.5 text-[11px] text-[#6d614c] hover:bg-[#f5efe2] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          收起 ×
        </button>
      </div>

      {/* 关键数据条 */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KeyStat label="年新发" value={formatNumber(cancer.incidence)} />
        <KeyStat label="年死亡" value={formatNumber(cancer.mortality)} />
        <KeyStat label="5 年生存" value={`${cancer.survival5y}%`} tone={cancer.survival5y >= 60 ? 'good' : cancer.survival5y < 30 ? 'bad' : ''} />
        <KeyStat label="致死率" value={`${fatality}%`} tone={fatality >= 70 ? 'bad' : fatality <= 30 ? 'good' : ''} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* 性别 + 年龄 */}
        <div className="lg:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8f8069] dark:text-[#8e9ab0]">
            性别分布
          </p>
          <div className="mt-1.5 flex h-5 overflow-hidden rounded-md text-[10px] font-medium text-white">
            {cancer.genderRatio.male > 0 ? (
              <div className="flex items-center justify-center bg-[#6b85a6]" style={{ width: `${cancer.genderRatio.male}%` }}>
                {cancer.genderRatio.male >= 10 ? `♂ ${cancer.genderRatio.male}%` : null}
              </div>
            ) : null}
            {cancer.genderRatio.female > 0 ? (
              <div className="flex items-center justify-center bg-[#c98a96]" style={{ width: `${cancer.genderRatio.female}%` }}>
                {cancer.genderRatio.female >= 10 ? `♀ ${cancer.genderRatio.female}%` : null}
              </div>
            ) : null}
          </div>

          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8f8069] dark:text-[#8e9ab0]">
            确诊年龄分布
          </p>
          <div className="mt-2 flex h-24 items-end gap-1.5">
            {cancer.ageDistribution.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="font-mono text-[9px] tabular-nums text-[#8f8069] dark:text-gray-500">
                  {v > 0 ? `${v}%` : ''}
                </span>
                <div
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${Math.max((v / maxAge) * 100, v > 0 ? 4 : 2)}%`,
                    backgroundColor: v > 0 ? cancer.color : '#eee5d3',
                    opacity: v > 0 ? 0.85 : 0.3,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1.5 text-[9px] text-[#8f8069] dark:text-gray-500">
            {AGE_BUCKETS_DISPLAY.map((b) => (
              <span key={b} className="flex-1 text-center">{b}</span>
            ))}
          </div>
        </div>

        {/* 风险因子 */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8f8069] dark:text-[#8e9ab0]">
            关键风险因子（示意权重）
          </p>
          <ul className="mt-2 space-y-1.5">
            {cancer.riskFactors.map((rf) => (
              <li key={rf.name} className="flex items-center gap-2 text-[11px]">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[rf.category] }}
                  title={CATEGORY_LABELS[rf.category]}
                />
                <span className="min-w-0 flex-1 truncate text-[#5d503f] dark:text-gray-300">{rf.name}</span>
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#f0e8d6] dark:bg-gray-800">
                  <div
                    className="h-full"
                    style={{ width: `${Math.min(rf.weight * 1.4, 100)}%`, backgroundColor: CATEGORY_COLORS[rf.category] }}
                  />
                </div>
                <span className="w-7 shrink-0 text-right font-mono tabular-nums text-[#8f8069] dark:text-gray-500">
                  {rf.weight}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 预警 + 筛查 */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[#f5d6b8] bg-[#fff6e6]/60 p-3 dark:border-[#5a4128] dark:bg-[#2a1c10]/40">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a05a3c] dark:text-[#e2a07a]">
            预警信号
          </p>
          <ul className="mt-1.5 space-y-1 text-[12px] leading-5 text-[#5d503f] dark:text-gray-300">
            {cancer.warnings.map((w) => (
              <li key={w} className="flex gap-1.5">
                <span aria-hidden="true">·</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-[#cfdfd0] bg-[#eef6ee]/50 p-3 dark:border-[#2c4030] dark:bg-[#152018]/40">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#3f6a3f] dark:text-[#a3d4a3]">
            筛查建议
          </p>
          <p className="mt-1.5 text-[12px] leading-5 text-[#5d503f] dark:text-gray-300">
            {cancer.screening}
          </p>
        </div>
      </div>
    </div>
  )
}

function KeyStat({ label, value, tone }) {
  const toneCls =
    tone === 'good'
      ? 'text-[#3f6a3f] dark:text-[#a3d4a3]'
      : tone === 'bad'
      ? 'text-[#a05a3c] dark:text-[#e2a07a]'
      : 'text-[#221f19] dark:text-gray-100'
  return (
    <div className="rounded-md bg-[#fdfaf3] px-3 py-2 dark:bg-gray-950/60">
      <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#8f8069] dark:text-gray-500">
        {label}
      </div>
      <div className={`mt-0.5 font-serif text-[18px] font-semibold tabular-nums ${toneCls}`}>
        {value}
      </div>
    </div>
  )
}

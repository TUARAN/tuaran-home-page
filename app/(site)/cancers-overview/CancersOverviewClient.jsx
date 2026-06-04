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
  { id: 'incidence', label: '发病率' },
  { id: 'mortality', label: '死亡率' },
  { id: 'survival', label: '5 年生存率（高→低）' },
  { id: 'fatality', label: '致死率（死亡 / 发病）' },
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

export default function CancersOverviewClient() {
  const [query, setQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState('all')
  const [sortBy, setSortBy] = useState('incidence')
  const [activeCategories, setActiveCategories] = useState([])
  const [openId, setOpenId] = useState(null)

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
    let list = CANCERS.filter((c) => {
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
    list = [...list].sort((a, b) => {
      if (sortBy === 'mortality') return b.mortality - a.mortality
      if (sortBy === 'survival') return b.survival5y - a.survival5y
      if (sortBy === 'fatality') return fatalityRate(b) - fatalityRate(a)
      return b.incidence - a.incidence
    })
    return list
  }, [query, genderFilter, sortBy, activeCategories])

  const maxIncidence = useMemo(() => Math.max(...CANCERS.map((c) => c.incidence)), [])
  const filteredIncidence = useMemo(() => filtered.reduce((s, c) => s + c.incidence, 0), [filtered])
  const filteredMortality = useMemo(() => filtered.reduce((s, c) => s + c.mortality, 0), [filtered])

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
      {/* ---- 顶部头 ---- */}
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

      {/* ---- 筛选条 ---- */}
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
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-[#e0d3b8] bg-white px-2 py-1.5 text-xs text-[#221f19] outline-none focus:border-[#b7791f] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                按 {opt.label} 排序
              </option>
            ))}
          </select>
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

      {/* ---- 总览数字 ---- */}
      <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatTile label="全球年新发（10 种合计）" value={formatNumber(filteredIncidence)} sub={`全部癌症约 ${formatNumber(GLOBAL_TOTAL.incidence)}`} />
        <StatTile label="全球年死亡（10 种合计）" value={formatNumber(filteredMortality)} sub={`全部癌症约 ${formatNumber(GLOBAL_TOTAL.mortality)}`} />
        <StatTile label="筛选后展示" value={`${filtered.length} / ${CANCERS.length}`} sub="当前筛选条件" />
        <StatTile label="数据口径" value="GLOBOCAN 2022" sub="IARC / WHO 全球年度估算" />
      </section>

      {/* ---- 卡片网格 ---- */}
      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <CancerCard
            key={c.id}
            cancer={c}
            maxIncidence={maxIncidence}
            isOpen={openId === c.id}
            onToggle={() => setOpenId(openId === c.id ? null : c.id)}
          />
        ))}
        {!filtered.length ? (
          <div className="col-span-full rounded-lg border border-dashed border-[#e0d3b8] py-12 text-center text-[13px] text-[#8f8069] dark:border-gray-700 dark:text-gray-500">
            没有匹配的癌症条目。试着放宽筛选或重置。
          </div>
        ) : null}
      </section>

      {/* ---- 底部说明 ---- */}
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

// ---------- 子组件 ----------

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

function CancerCard({ cancer, maxIncidence, isOpen, onToggle }) {
  const incidencePct = (cancer.incidence / maxIncidence) * 100
  const mortalityPct = (cancer.mortality / maxIncidence) * 100
  const fatality = fatalityRate(cancer)
  const gClass = genderClass(cancer)

  return (
    <article
      className={`group flex flex-col rounded-xl border bg-white/80 p-4 transition dark:bg-gray-900/70 ${
        isOpen
          ? 'border-[#3f3527] shadow-[0_6px_24px_rgba(63,53,39,0.12)] dark:border-gray-200'
          : 'border-[#e8dfd0] hover:border-[#cbb796] dark:border-gray-800 dark:hover:border-gray-600'
      }`}
    >
      <button type="button" onClick={onToggle} className="text-left">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: cancer.color }}
          />
          <h3 className="text-[15px] font-semibold text-[#221f19] dark:text-gray-100">
            {cancer.nameZh}
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8f8069] dark:text-[#8e9ab0]">
            {cancer.nameEn}
          </span>
          <span
            className={`ml-auto rounded-full px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.12em] ${
              gClass === 'male'
                ? 'bg-[#dee6f0] text-[#3f4b5d] dark:bg-[#1c2632] dark:text-[#b3c0d1]'
                : gClass === 'female'
                ? 'bg-[#f1dde3] text-[#83405a] dark:bg-[#2a1a22] dark:text-[#d9a3b8]'
                : 'bg-[#ede5d2] text-[#6d614c] dark:bg-[#1f1a14] dark:text-[#bbae93]'
            }`}
          >
            {gClass === 'male' ? '♂ 高发' : gClass === 'female' ? '♀ 高发' : '男女均见'}
          </span>
        </div>

        {/* 双横条 */}
        <div className="mt-3 space-y-1.5">
          <Bar label="发病" value={cancer.incidence} pct={incidencePct} color={cancer.color} />
          <Bar label="死亡" value={cancer.mortality} pct={mortalityPct} color={cancer.color} dim />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
          <MiniStat label="5 年生存" value={`${cancer.survival5y}%`} good={cancer.survival5y >= 60} bad={cancer.survival5y < 30} />
          <MiniStat label="致死率" value={`${fatality}%`} good={fatality <= 30} bad={fatality >= 70} />
          <MiniStat label="主因" value={cancer.primaryFactor} small />
        </div>
      </button>

      {/* 展开详情 */}
      {isOpen ? <CancerDetail cancer={cancer} onClose={onToggle} /> : (
        <button
          type="button"
          onClick={onToggle}
          className="mt-3 text-[11px] text-[#8f8069] underline underline-offset-2 hover:text-[#5d503f] dark:text-gray-500 dark:hover:text-gray-300"
        >
          展开详情 → 年龄分布 / 风险因子 / 预警信号 / 筛查
        </button>
      )}
    </article>
  )
}

function Bar({ label, value, pct, color, dim = false }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-7 shrink-0 text-[#8f8069] dark:text-gray-500">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded bg-[#f0e8d6] dark:bg-gray-800">
        <div
          className="h-full"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            opacity: dim ? 0.55 : 1,
          }}
        />
      </div>
      <span className="w-14 shrink-0 text-right font-mono tabular-nums text-[#5d503f] dark:text-gray-300">
        {formatNumber(value)}
      </span>
    </div>
  )
}

function MiniStat({ label, value, good = false, bad = false, small = false }) {
  const tone = good
    ? 'text-[#3f6a3f] dark:text-[#a3d4a3]'
    : bad
    ? 'text-[#a05a3c] dark:text-[#e2a07a]'
    : 'text-[#221f19] dark:text-gray-200'
  return (
    <div className="rounded-md bg-[#fdfaf3] px-2 py-1 dark:bg-gray-950/60">
      <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#8f8069] dark:text-gray-500">
        {label}
      </div>
      <div className={`mt-0.5 font-semibold tabular-nums ${tone} ${small ? 'text-[11px]' : 'text-[13px]'}`}>
        {value}
      </div>
    </div>
  )
}

function CancerDetail({ cancer, onClose }) {
  const maxAge = Math.max(...cancer.ageDistribution, 1)
  return (
    <div className="mt-4 border-t border-dashed border-[#e0d3b8] pt-4 dark:border-gray-700">
      {/* 性别分布条 */}
      <div className="mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8f8069] dark:text-[#8e9ab0]">
          性别分布
        </p>
        <div className="mt-1.5 flex h-4 overflow-hidden rounded-md text-[10px] font-medium text-white">
          {cancer.genderRatio.male > 0 ? (
            <div
              className="flex items-center justify-center bg-[#6b85a6] dark:bg-[#4a6fa5]"
              style={{ width: `${cancer.genderRatio.male}%` }}
            >
              {cancer.genderRatio.male >= 10 ? `♂ ${cancer.genderRatio.male}%` : null}
            </div>
          ) : null}
          {cancer.genderRatio.female > 0 ? (
            <div
              className="flex items-center justify-center bg-[#c98a96] dark:bg-[#b8889d]"
              style={{ width: `${cancer.genderRatio.female}%` }}
            >
              {cancer.genderRatio.female >= 10 ? `♀ ${cancer.genderRatio.female}%` : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* 年龄分布柱图 */}
      <div className="mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8f8069] dark:text-[#8e9ab0]">
          年龄分布（确诊年龄 · 百分比）
        </p>
        <div className="mt-2 flex h-20 items-end gap-1">
          {cancer.ageDistribution.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end">
              <div
                className="w-full rounded-t-sm transition"
                style={{
                  height: `${Math.max((v / maxAge) * 100, 3)}%`,
                  backgroundColor: v > 0 ? cancer.color : '#eee5d3',
                  opacity: v > 0 ? 1 : 0.3,
                }}
                title={`${AGE_BUCKETS_DISPLAY[i]}：${v}%`}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1 text-[8.5px] text-[#8f8069] dark:text-gray-500">
          {AGE_BUCKETS_DISPLAY.map((b) => (
            <span key={b} className="flex-1 text-center">
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* 风险因子加权条 */}
      <div className="mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8f8069] dark:text-[#8e9ab0]">
          关键风险因子（相对重要度示意）
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
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#f0e8d6] dark:bg-gray-800">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.min(rf.weight * 1.4, 100)}%`,
                    backgroundColor: CATEGORY_COLORS[rf.category],
                  }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-mono tabular-nums text-[#8f8069] dark:text-gray-500">
                {rf.weight}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 预警信号 + 筛查 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[#f5d6b8] bg-[#fff6e6]/60 p-3 dark:border-[#5a4128] dark:bg-[#2a1c10]/40">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a05a3c] dark:text-[#e2a07a]">
            预警信号
          </p>
          <ul className="mt-1.5 space-y-1 text-[11px] leading-5 text-[#5d503f] dark:text-gray-300">
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
          <p className="mt-1.5 text-[11px] leading-5 text-[#5d503f] dark:text-gray-300">
            {cancer.screening}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-4 text-[11px] text-[#8f8069] underline underline-offset-2 hover:text-[#5d503f] dark:text-gray-500 dark:hover:text-gray-300"
      >
        收起详情
      </button>
    </div>
  )
}

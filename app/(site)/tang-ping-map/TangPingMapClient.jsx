'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import ArticleActionsDropdown from '../components/ArticleActionsDropdown'
import DistributeContentButton from '../components/DistributeContentButton'
import SharePageButton from '../components/SharePageButton'
import { TANG_PING_MAP_POINTS } from '../../../lib/tangPingMapData'

const LON_MIN = 72
const LON_MAX = 136
const LAT_MIN = 18
const LAT_MAX = 54

const PRICE_TIERS = [
  { label: '<= 3 万', max: 3, color: '#1f766d' },
  { label: '3-6 万', max: 6, color: '#4f8a5b' },
  { label: '6-10 万', max: 10, color: '#c58b29' },
  { label: '10-15 万', max: 15, color: '#b55b3b' },
  { label: '> 15 万', max: Infinity, color: '#8f3f46' },
]

const SORT_OPTIONS = [
  { key: 'priceAsc', label: '总价最低' },
  { key: 'yieldDesc', label: '租金回报高' },
  { key: 'paybackAsc', label: '回本更快' },
  { key: 'areaDesc', label: '面积更大' },
]

function getTier(point) {
  return PRICE_TIERS.find((tier) => point.priceWan <= tier.max) || PRICE_TIERS[PRICE_TIERS.length - 1]
}

function enrich(point) {
  const total = point.priceWan * 10000
  const annualRent = point.rent * 12
  return {
    ...point,
    pricePerSqm: total / point.area,
    annualYield: annualRent / total,
    paybackYears: annualRent > 0 ? total / annualRent : null,
    tier: getTier(point),
  }
}

const POINTS = TANG_PING_MAP_POINTS.map(enrich)
const PROVINCES = [...new Set(POINTS.map((point) => point.province))].sort((a, b) => a.localeCompare(b, 'zh-CN'))

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function project(point) {
  const x = ((point.lng - LON_MIN) / (LON_MAX - LON_MIN)) * 100
  const y = (1 - (point.lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * 100
  return [clamp(x, 2, 98), clamp(y, 2, 98)]
}

function formatWan(value) {
  return `${Number(value).toFixed(value < 10 ? 1 : 0)} 万`
}

function formatCurrency(value) {
  return `¥${Math.round(value).toLocaleString('zh-CN')}`
}

function metricAvg(rows, key) {
  if (!rows.length) return 0
  return rows.reduce((sum, row) => sum + row[key], 0) / rows.length
}

function sortRows(rows, sortKey) {
  return [...rows].sort((a, b) => {
    if (sortKey === 'yieldDesc') return b.annualYield - a.annualYield
    if (sortKey === 'paybackAsc') return (a.paybackYears || 999) - (b.paybackYears || 999)
    if (sortKey === 'areaDesc') return b.area - a.area
    return a.priceWan - b.priceWan
  })
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-[#d9d2c2] bg-white/72 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <p className="mb-1 font-mono text-[10px] uppercase text-[#7b735f] dark:text-white/45">{label}</p>
      <p className="mb-0 text-2xl font-bold text-[#1b1b16] dark:text-white">{value}</p>
      {hint ? <p className="mb-0 mt-1 text-xs text-[#766f62] dark:text-white/48">{hint}</p> : null}
    </div>
  )
}

function NumberInput({ label, value, onChange, placeholder, suffix }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase text-[#7f7768] dark:text-white/45">{label}</span>
      <div className="flex items-center rounded-lg border border-[#d7d0c2] bg-white/72 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#aaa08f] dark:text-white dark:placeholder:text-white/25"
        />
        {suffix ? <span className="ml-2 text-xs text-[#8a8171] dark:text-white/40">{suffix}</span> : null}
      </div>
    </label>
  )
}

function PointDetail({ point }) {
  if (!point) {
    return (
      <div className="rounded-lg border border-dashed border-[#d7d0c2] bg-[#f7f1e4]/70 p-4 text-sm leading-7 text-[#786f5e] dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
        点击地图上的点位，查看城市、小区、总价、面积、租金和回本周期。
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[#cfc5af] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111419]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase text-[#7c735f] dark:text-white/45">
            No. {String(point.id).padStart(3, '0')} · {point.date}
          </p>
          <h3 className="mb-1 text-lg font-bold text-[#1b1b16] dark:text-white">{point.location}</h3>
          <p className="mb-0 text-sm text-[#6d6658] dark:text-white/55">
            {point.province} · {point.city} · {point.district}
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold text-white"
          style={{ backgroundColor: point.tier.color }}
        >
          {point.tier.label}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div className="rounded-md bg-[#f5efe3] p-3 dark:bg-white/[0.05]">
          <p className="mb-1 text-xs text-[#7c735f] dark:text-white/45">总价</p>
          <p className="mb-0 font-bold">{formatWan(point.priceWan)}</p>
        </div>
        <div className="rounded-md bg-[#f5efe3] p-3 dark:bg-white/[0.05]">
          <p className="mb-1 text-xs text-[#7c735f] dark:text-white/45">面积</p>
          <p className="mb-0 font-bold">{point.area} 平</p>
        </div>
        <div className="rounded-md bg-[#f5efe3] p-3 dark:bg-white/[0.05]">
          <p className="mb-1 text-xs text-[#7c735f] dark:text-white/45">租金</p>
          <p className="mb-0 font-bold">¥{point.rent}/月</p>
        </div>
        <div className="rounded-md bg-[#f5efe3] p-3 dark:bg-white/[0.05]">
          <p className="mb-1 text-xs text-[#7c735f] dark:text-white/45">回本</p>
          <p className="mb-0 font-bold">{point.paybackYears?.toFixed(1)} 年</p>
        </div>
      </div>
    </div>
  )
}

function Distribution({ rows }) {
  const counts = PRICE_TIERS.map((tier) => ({
    ...tier,
    count: rows.filter((row) => getTier(row).label === tier.label).length,
  }))
  const max = Math.max(...counts.map((item) => item.count), 1)

  return (
    <div className="rounded-xl border border-[#d9d2c2] bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <h2 className="mb-3 text-base font-bold">价格分布</h2>
      <div className="space-y-3">
        {counts.map((item) => (
          <div key={item.label} className="grid grid-cols-[64px_minmax(0,1fr)_36px] items-center gap-3 text-sm">
            <span className="text-[#5e584d] dark:text-white/55">{item.label}</span>
            <div className="h-3 overflow-hidden rounded-full bg-[#e9dfcd] dark:bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${(item.count / max) * 100}%`, backgroundColor: item.color }} />
            </div>
            <span className="text-right font-mono text-xs text-[#5e584d] dark:text-white/55">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TangPingMapClient() {
  const [query, setQuery] = useState('')
  const [province, setProvince] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [areaMin, setAreaMin] = useState('')
  const [rentMax, setRentMax] = useState('')
  const [sortKey, setSortKey] = useState('priceAsc')
  const [selectedId, setSelectedId] = useState(POINTS[0]?.id)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return POINTS.filter((point) => {
      if (province && point.province !== province) return false
      if (q) {
        const blob = `${point.province}${point.city}${point.district}${point.location}`.toLowerCase()
        if (!blob.includes(q)) return false
      }
      if (priceMax && point.priceWan > Number(priceMax)) return false
      if (areaMin && point.area < Number(areaMin)) return false
      if (rentMax && point.rent > Number(rentMax)) return false
      return true
    })
  }, [areaMin, priceMax, province, query, rentMax])

  const ranked = useMemo(() => sortRows(filtered, sortKey), [filtered, sortKey])
  const selected = filtered.find((point) => point.id === selectedId) || ranked[0] || null
  const avgPrice = metricAvg(filtered, 'priceWan')
  const avgArea = metricAvg(filtered, 'area')
  const avgYield = metricAvg(filtered, 'annualYield')
  const fastest = sortRows(filtered, 'paybackAsc')[0]

  return (
    <main className="min-h-screen bg-[#eee7da] text-[#1b1b16] dark:bg-[#0d1014] dark:text-white">
      <section className="mx-auto max-w-[1240px] px-4 pb-8 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#746c5e] dark:text-white/45">
          <Link href="/works" className="underline underline-offset-4 hover:text-[#1b1b16] dark:hover:text-white">
            多维页面
          </Link>
          <span>·</span>
          <span>低总价房源观察</span>
          <span>·</span>
          <a
            href="https://tpmap.ritmex.one"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-[#1b1b16] dark:hover:text-white"
          >
            数据源：Tang Ping Map
          </a>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <div>
            <p className="mb-2 font-mono text-[11px] font-bold uppercase text-[#7c6f52] dark:text-[#d7c08a]">
              Tang Ping Map · 2026
            </p>
            <h1 className="mb-3 font-serif text-4xl font-bold leading-tight sm:text-5xl">躺平地图</h1>
            <p className="mb-0 max-w-3xl text-[15px] leading-7 text-[#665f52] dark:text-white/58">
              这不是购房建议，而是一个观察低总价房源分布的多维页面：把总价、面积、租金、回本周期和地理位置放到同一张图里，
              看哪些地方“便宜”，哪些地方只是“总价小”，以及租金回报是否真的说得过去。
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <SharePageButton
              title="躺平地图 · 低总价房源多维观察"
              text="121 个低总价房源点位的地图、筛选、排行和回本周期观察。"
              url="https://2aran.com/tang-ping-map"
              size="md"
            />
            <ArticleActionsDropdown label="更多">
              <DistributeContentButton
                title="躺平地图 · 低总价房源多维观察"
                summary="121 个低总价房源点位的地图、筛选、排行和回本周期观察。数据源自 Tang Ping Map 公开页面。"
                url="/tang-ping-map"
                category="works"
                slug="tang-ping-map"
                tags={['多维页面', '地图', '房价', '租金']}
                kindLabel="多维页面"
              />
            </ArticleActionsDropdown>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="点位数" value={filtered.length} hint={`总样本 ${POINTS.length} 个`} />
          <StatCard label="平均总价" value={formatWan(avgPrice || 0)} hint="按当前筛选计算" />
          <StatCard label="平均面积" value={`${avgArea.toFixed(1)} 平`} hint={`均价约 ${formatCurrency(metricAvg(filtered, 'pricePerSqm'))}/平`} />
          <StatCard label="平均年租金回报" value={`${(avgYield * 100).toFixed(1)}%`} hint={fastest ? `最快回本：${fastest.city}` : '暂无样本'} />
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-4">
          <div className="rounded-xl border border-[#d5cbb9] bg-[#fbf8ef]/88 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="mb-4 text-base font-bold">筛选</h2>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block font-mono text-[10px] uppercase text-[#7f7768] dark:text-white/45">关键词</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="城市 / 小区 / 区县"
                  className="w-full rounded-lg border border-[#d7d0c2] bg-white/72 px-3 py-2 text-sm outline-none placeholder:text-[#aaa08f] dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/25"
                />
              </label>

              <label className="block">
                <span className="mb-1 block font-mono text-[10px] uppercase text-[#7f7768] dark:text-white/45">省份</span>
                <select
                  value={province}
                  onChange={(event) => setProvince(event.target.value)}
                  className="w-full rounded-lg border border-[#d7d0c2] bg-white/72 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-[#141820] dark:text-white"
                >
                  <option value="">全部省份</option>
                  {PROVINCES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="总价上限" value={priceMax} onChange={setPriceMax} placeholder="10" suffix="万" />
                <NumberInput label="面积下限" value={areaMin} onChange={setAreaMin} placeholder="40" suffix="平" />
              </div>
              <NumberInput label="租金上限" value={rentMax} onChange={setRentMax} placeholder="800" suffix="元/月" />

              <label className="block">
                <span className="mb-1 block font-mono text-[10px] uppercase text-[#7f7768] dark:text-white/45">排行口径</span>
                <select
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value)}
                  className="w-full rounded-lg border border-[#d7d0c2] bg-white/72 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-[#141820] dark:text-white"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setProvince('')
                  setPriceMax('')
                  setAreaMin('')
                  setRentMax('')
                  setSortKey('priceAsc')
                }}
                className="w-full rounded-lg border border-[#1f1d18] bg-[#1f1d18] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#385c4b] dark:border-white/15 dark:bg-white dark:text-[#101318] dark:hover:bg-[#d7c08a]"
              >
                重置筛选
              </button>
            </div>
          </div>

          <Distribution rows={filtered} />
        </aside>

        <div className="space-y-5">
          <section className="overflow-hidden rounded-xl border border-[#d5cbb9] bg-[#f8f1e2] shadow-sm dark:border-white/10 dark:bg-[#10141a]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ded4c1] px-4 py-3 dark:border-white/10">
              <div>
                <h2 className="mb-0 text-base font-bold">地理分布</h2>
                <p className="mb-0 text-xs text-[#766f62] dark:text-white/45">经纬度近似投影，点位越靠右越东，越靠上越北。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRICE_TIERS.map((tier) => (
                  <span key={tier.label} className="inline-flex items-center gap-1.5 text-xs text-[#5f574a] dark:text-white/55">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                    {tier.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="relative min-h-[420px] p-4">
                <svg viewBox="0 0 100 100" role="img" aria-label="低总价房源点位地图" className="h-[420px] w-full rounded-lg bg-[#e7dcc8] dark:bg-[#0b1116]">
                  <defs>
                    <pattern id="tp-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(78,70,54,0.14)" strokeWidth="0.35" />
                    </pattern>
                  </defs>
                  <rect x="0" y="0" width="100" height="100" fill="url(#tp-grid)" />
                  <path
                    d="M19 22 C31 8 54 5 73 15 C88 23 96 43 87 59 C80 73 62 86 42 82 C25 79 12 66 9 50 C7 39 11 29 19 22 Z"
                    fill="rgba(255,255,255,0.42)"
                    stroke="rgba(74,68,56,0.30)"
                    strokeWidth="0.55"
                  />
                  {[80, 90, 100, 110, 120, 130].map((lon) => (
                    <text key={lon} x={((lon - LON_MIN) / (LON_MAX - LON_MIN)) * 100} y="98" textAnchor="middle" className="fill-[#817769] text-[2.5px] dark:fill-white/35">
                      {lon}E
                    </text>
                  ))}
                  {[20, 30, 40, 50].map((lat) => (
                    <text key={lat} x="2" y={(1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * 100} className="fill-[#817769] text-[2.5px] dark:fill-white/35">
                      {lat}N
                    </text>
                  ))}
                  {filtered.map((point) => {
                    const [x, y] = project(point)
                    const active = selected?.id === point.id
                    return (
                      <g
                        key={point.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedId(point.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setSelectedId(point.id)
                          }
                        }}
                        aria-label={`${point.city} ${point.location}`}
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={active ? 1.7 : 1.15}
                          fill={point.tier.color}
                          stroke={active ? '#111111' : '#fff7e6'}
                          strokeWidth={active ? 0.55 : 0.35}
                          className="cursor-pointer transition hover:opacity-80"
                        />
                      </g>
                    )
                  })}
                </svg>
              </div>
              <div className="border-t border-[#ded4c1] p-4 dark:border-white/10 lg:border-l lg:border-t-0">
                <PointDetail point={selected} />
                <div className="mt-4 rounded-lg bg-[#fffaf0] p-4 text-xs leading-6 text-[#6e6556] dark:bg-white/[0.04] dark:text-white/48">
                  <p className="mb-1 font-semibold text-[#1b1b16] dark:text-white">口径说明</p>
                  <p className="mb-0">
                    点位来自公开页面内嵌数据，可能是样本集合而非完整市场；价格、租金和坐标适合作观察，不构成投资、居住或交易建议。
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#d5cbb9] bg-[#fbf8ef]/88 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="mb-1 text-base font-bold">样本排行</h2>
                <p className="mb-0 text-xs text-[#766f62] dark:text-white/45">按当前筛选与排行口径展示前 12 个点位。</p>
              </div>
              <span className="font-mono text-xs text-[#766f62] dark:text-white/45">{ranked.length} rows</span>
            </div>
            <div className="divide-y divide-[#e1d8c8] overflow-hidden rounded-lg border border-[#e1d8c8] bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-[#10141a]">
              {ranked.slice(0, 12).map((point, index) => (
                <button
                  key={point.id}
                  type="button"
                  onClick={() => setSelectedId(point.id)}
                  className="grid w-full gap-2 px-3 py-3 text-left transition hover:bg-[#fffaf0] dark:hover:bg-white/[0.05] sm:grid-cols-[36px_minmax(0,1fr)_96px_96px_96px] sm:items-center"
                >
                  <span className="font-mono text-xs text-[#8a8171] dark:text-white/35">#{index + 1}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{point.city} · {point.location}</span>
                    <span className="block truncate text-xs text-[#766f62] dark:text-white/45">{point.province} / {point.district}</span>
                  </span>
                  <span className="text-sm font-semibold">{formatWan(point.priceWan)}</span>
                  <span className="text-sm text-[#5f574a] dark:text-white/62">{point.area} 平</span>
                  <span className="text-sm text-[#5f574a] dark:text-white/62">{point.paybackYears?.toFixed(1)} 年</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

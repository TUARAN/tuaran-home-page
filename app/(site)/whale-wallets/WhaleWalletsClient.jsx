'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import SharePageButton from '../components/SharePageButton'
import {
  CATEGORY_META,
  DATA_CAPABILITIES,
  FOLK_STANCE_META,
  SATOSHI_CLUSTER_NOTE,
  WHALE_WALLETS,
  attachLiveSnapshot,
  folkHaystack,
  formatNative,
  formatPct,
  formatUsd,
  shortAddress,
} from '../../../lib/whaleWallets'

const SHARE_URL = 'https://2aran.com/whale-wallets'
const MAX_COMPARE = 3

const SORT_OPTIONS = [
  { id: 'usd', label: '折合美元', accessor: (row) => row.usd || 0 },
  { id: 'changeUsd', label: '24h 变动', accessor: (row) => Math.abs(row.changeUsd || 0) },
  { id: 'changePct', label: '24h 幅度', accessor: (row) => Math.abs(row.changePct || 0) },
  { id: 'txCount', label: '交易次数', accessor: (row) => row.txCount || 0 },
]

const CHAIN_FILTERS = [
  { id: 'all', label: '全部链' },
  { id: 'bitcoin', label: 'Bitcoin' },
  { id: 'ethereum', label: 'Ethereum' },
]

const CATEGORIES = Object.keys(CATEGORY_META)
const FOLK_PEOPLE = [...new Set(WHALE_WALLETS.map((wallet) => wallet.folk?.person).filter(Boolean))]

function toneClass(value) {
  if (value == null || Number.isNaN(value) || value === 0) return 'text-[#51514a] dark:text-gray-400'
  return value > 0 ? 'text-[#3f6a3f] dark:text-emerald-400' : 'text-[#a05a3c] dark:text-rose-300'
}

export default function WhaleWalletsClient() {
  const [live, setLive] = useState(null)
  const [loadState, setLoadState] = useState('loading')
  const [reloadToken, setReloadToken] = useState(0)
  const [query, setQuery] = useState('')
  const [chainFilter, setChainFilter] = useState('all')
  const [sortBy, setSortBy] = useState('usd')
  const [activeCategories, setActiveCategories] = useState([])
  const [folkPerson, setFolkPerson] = useState('')
  const [openId, setOpenId] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareIds, setCompareIds] = useState([])
  const [hoverId, setHoverId] = useState(null)
  const [urlReady, setUrlReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    const chain = params.get('chain')
    const s = params.get('sort')
    const c = params.get('cats')
    const person = params.get('person')
    const o = params.get('open')
    const m = params.get('mode')
    const cmp = params.get('compare')
    if (q) setQuery(q)
    if (chain && CHAIN_FILTERS.some((item) => item.id === chain)) setChainFilter(chain)
    if (s && SORT_OPTIONS.some((item) => item.id === s)) setSortBy(s)
    if (c) setActiveCategories(c.split(',').filter((cat) => CATEGORIES.includes(cat)))
    if (person && FOLK_PEOPLE.includes(person)) setFolkPerson(person)
    if (o && WHALE_WALLETS.some((wallet) => wallet.id === o)) setOpenId(o)
    if (m === 'compare') setCompareMode(true)
    if (cmp) {
      const ids = cmp.split(',').filter((id) => WHALE_WALLETS.some((wallet) => wallet.id === id)).slice(0, MAX_COMPARE)
      if (ids.length) setCompareIds(ids)
    }
    setUrlReady(true)
  }, [])

  useEffect(() => {
    if (!urlReady || typeof window === 'undefined') return
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (chainFilter !== 'all') params.set('chain', chainFilter)
    if (sortBy !== 'usd') params.set('sort', sortBy)
    if (activeCategories.length) params.set('cats', activeCategories.join(','))
    if (folkPerson) params.set('person', folkPerson)
    if (compareMode) params.set('mode', 'compare')
    if (compareMode && compareIds.length) params.set('compare', compareIds.join(','))
    if (!compareMode && openId) params.set('open', openId)
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [urlReady, query, chainFilter, sortBy, activeCategories, folkPerson, openId, compareMode, compareIds])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadState('loading')
      try {
        const path = reloadToken ? `/api/whale-wallets?refresh=1&t=${reloadToken}` : '/api/whale-wallets'
        const response = await fetch(path)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const payload = await response.json()
        if (!cancelled) {
          setLive(payload)
          setLoadState('ok')
        }
      } catch {
        if (!cancelled) setLoadState('error')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const liveById = useMemo(
    () => Object.fromEntries((live?.wallets || []).map((row) => [row.id, row])),
    [live],
  )
  const rows = useMemo(
    () => attachLiveSnapshot(WHALE_WALLETS, liveById, live?.prices || {}),
    [liveById, live],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (chainFilter !== 'all' && row.chain !== chainFilter) return false
      if (activeCategories.length && !activeCategories.includes(row.category)) return false
      if (folkPerson && row.folk?.person !== folkPerson) return false
      if (q) {
        const hay = `${row.nameZh} ${row.nameEn} ${row.address} ${row.note} ${folkHaystack(row)}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [rows, query, chainFilter, activeCategories, folkPerson])

  const sortAccessor = SORT_OPTIONS.find((item) => item.id === sortBy).accessor
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => sortAccessor(b) - sortAccessor(a)),
    [filtered, sortAccessor],
  )

  const totals = useMemo(() => {
    const usd = filtered.reduce((sum, row) => sum + (row.usd || 0), 0)
    const changeUsd = filtered.reduce((sum, row) => sum + (row.changeUsd || 0), 0)
    const liveCount = filtered.filter((row) => row.liveStatus === 'ok').length
    return { usd, changeUsd, liveCount, total: filtered.length }
  }, [filtered])

  const focusIds = compareMode ? compareIds : openId ? [openId] : []
  const openWallet = !compareMode && openId ? filtered.find((row) => row.id === openId) : null
  const compareWallets = compareIds.map((id) => rows.find((row) => row.id === id)).filter(Boolean)
  const filtersActive = query || chainFilter !== 'all' || activeCategories.length || folkPerson || sortBy !== 'usd'

  const toggleCategory = useCallback((cat) => {
    setActiveCategories((prev) => (prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]))
  }, [])

  const handleSelect = useCallback((id) => {
    if (compareMode) {
      setCompareIds((prev) => {
        if (prev.includes(id)) return prev.filter((item) => item !== id)
        if (prev.length >= MAX_COMPARE) return prev
        return [...prev, id]
      })
    } else {
      setOpenId((prev) => (prev === id ? null : id))
    }
  }, [compareMode])

  return (
    <main className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:py-10">
      <header className="flex flex-col gap-4 border-b border-[#dee0db] pb-5 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#767869] dark:text-[#8e9ab0]">
            Whale wallets · 公开链上读数
          </p>
          <h1 className="mt-2 font-serif text-[26px] font-semibold leading-tight text-[#15140f] dark:text-gray-100 sm:text-[30px]">
            公开巨鲸钱包
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#51514a] dark:text-gray-400">
            {WHALE_WALLETS.length} 个 Bitcoin / Ethereum 大额地址，每条附带浏览器标签和公众看法：中本聪、赵长鹏、罗斯·乌布利希特、钱志敏、Vitalik 等。当前余额来自{' '}
            <a href="https://mempool.space/docs/api/rest" target="_blank" rel="noreferrer" className="underline decoration-[#a9ab96] underline-offset-2 hover:text-[#15140f] dark:hover:text-gray-200">
              mempool.space
            </a>
            {' '}与公共 ETH RPC；近 24 小时变动由最近一页交易估算。
            <strong className="ml-1 text-[#a05a3c] dark:text-[#9e937a]">不构成投资建议。公开标签和传闻都不是密钥控制权证明。</strong>
          </p>
        </div>
        <SharePageButton
          title="公开巨鲸钱包：余额、24 小时变动与公众归因"
          text="BTC / ETH 大额地址的链上余额，以及中本聪、赵长鹏、Vitalik 等公众看法标记。"
          url={SHARE_URL}
          size="md"
        />
      </header>

      <section className="mt-5 grid gap-3 sm:grid-cols-4">
        <StatCard label="可见地址" value={`${totals.liveCount}/${totals.total}`} hint={loadState === 'loading' ? '正在读链' : '实时余额已返回'} />
        <StatCard label="合计估值" value={formatUsd(totals.usd)} hint={live?.prices?.BTC ? `BTC $${Math.round(live.prices.BTC).toLocaleString('en-US')}` : '等待行情'} />
        <StatCard label="24h 净变动" value={formatUsd(totals.changeUsd)} hint="冷钱包通常完整，热钱包可能被截断" tone={totals.changeUsd} />
        <StatCard label="行情来源" value={live?.priceSource || '—'} hint={live?.generatedAt ? new Date(live.generatedAt).toLocaleString('zh-CN', { hour12: false }) : '尚未刷新'} />
      </section>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#767869] dark:text-[#8e9ab0]">链</span>
        <PillGroup
          items={CHAIN_FILTERS}
          value={chainFilter}
          onChange={setChainFilter}
        />
        <span className="mx-2 hidden h-4 w-px bg-[#c6cab8] dark:bg-gray-700 sm:inline-block" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#767869] dark:text-[#8e9ab0]">模式</span>
        <div className="flex items-center gap-1 rounded-lg border border-[#c6cab8] bg-white p-0.5 text-xs dark:border-gray-700 dark:bg-gray-950">
          <button type="button" onClick={() => setCompareMode(false)} className={modeClass(!compareMode)}>单选详情</button>
          <button type="button" onClick={() => setCompareMode(true)} className={modeClass(compareMode)}>对比（最多 {MAX_COMPARE}）</button>
        </div>
        {compareMode && compareIds.length ? (
          <button type="button" onClick={() => setCompareIds([])} className="text-[11px] text-[#767869] underline underline-offset-2 hover:text-[#333431] dark:text-gray-500">
            清空已选（{compareIds.length}）
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setReloadToken((n) => n + 1)}
          className="ml-auto rounded-md border border-[#c6cab8] px-2.5 py-1 text-[11px] text-[#585a4c] hover:bg-[#e9eae2] dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          {loadState === 'loading' ? '读取中…' : '重新读链'}
        </button>
      </div>

      <section className="mt-3 rounded-xl border border-[#dee0db] bg-[#f6f8f3]/70 p-3 dark:border-gray-800 dark:bg-gray-900/60 sm:p-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索名称 / 地址 / 中本聪 / 赵长鹏"
            className="h-8 w-full min-w-[180px] flex-1 rounded-md border border-[#c6cab8] bg-white px-2.5 text-[13px] outline-none focus:border-[#767869] dark:border-gray-700 dark:bg-gray-950 sm:max-w-xs"
          />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`rounded-full border px-2.5 py-1 text-[11px] ${
                activeCategories.includes(cat)
                  ? 'border-[#2f3027] bg-[#2f3027] text-white dark:border-gray-200 dark:bg-gray-200 dark:text-[#111]'
                  : 'border-[#c6cab8] text-[#585a4c] hover:bg-white dark:border-gray-700 dark:text-gray-400'
              }`}
            >
              {CATEGORY_META[cat].label}
            </button>
          ))}
          {FOLK_PEOPLE.map((person) => (
            <button
              key={person}
              type="button"
              onClick={() => setFolkPerson((prev) => (prev === person ? '' : person))}
              className={`rounded-full border px-2.5 py-1 text-[11px] ${
                folkPerson === person
                  ? 'border-[#a05a3c] bg-[#a05a3c] text-white dark:border-[#9e937a] dark:bg-[#9e937a] dark:text-[#111]'
                  : 'border-dashed border-[#c6cab8] text-[#585a4c] hover:bg-white dark:border-gray-700 dark:text-gray-400'
              }`}
            >
              {person}
            </button>
          ))}
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSortBy(option.id)}
              className={`rounded-full px-2.5 py-1 text-[11px] ${
                sortBy === option.id
                  ? 'bg-[#eceee6] text-[#15140f] dark:bg-gray-800 dark:text-gray-100'
                  : 'text-[#767869] hover:bg-[#eceee6] dark:hover:bg-gray-800'
              }`}
            >
              {option.label}
            </button>
          ))}
          {filtersActive ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setChainFilter('all')
                setActiveCategories([])
                setFolkPerson('')
                setSortBy('usd')
              }}
              className="text-[11px] text-[#767869] underline underline-offset-2"
            >
              重置
            </button>
          ) : null}
        </div>
        {loadState === 'error' ? (
          <p className="mt-2 text-[12px] text-[#a05a3c]">链上接口暂时失败，目录仍可浏览，数字需要重试后才会更新。</p>
        ) : null}
      </section>

      <section className="mt-5 rounded-xl border border-[#dee0db] bg-white p-3 dark:border-gray-800 dark:bg-gray-950 sm:p-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-[#15140f] dark:text-gray-100">估值 × 24 小时变动</h2>
          <p className="text-[11px] text-[#767869] dark:text-gray-500">横轴对数美元，纵轴 24h 幅度，半径为交易次数</p>
        </div>
        <ScatterChart
          wallets={sorted}
          focusIds={focusIds}
          hoverId={hoverId}
          onHover={setHoverId}
          onSelect={handleSelect}
        />
      </section>

      <section className="mt-5 rounded-xl border border-[#dee0db] bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-baseline justify-between gap-3 border-b border-[#dee0db] px-3 py-3 dark:border-gray-800 sm:px-4">
          <h2 className="text-[15px] font-semibold text-[#15140f] dark:text-gray-100">排行</h2>
          <p className="text-[11px] text-[#767869] dark:text-gray-500">{sorted.length} 个地址</p>
        </div>
        <RankingList
          wallets={sorted}
          sortBy={sortBy}
          focusIds={focusIds}
          hoverId={hoverId}
          onHover={setHoverId}
          onSelect={handleSelect}
          compareMode={compareMode}
        />
      </section>

      {compareMode ? (
        <CompareTable wallets={compareWallets} onRemove={(id) => setCompareIds((prev) => prev.filter((item) => item !== id))} />
      ) : openWallet ? (
        <DetailPanel wallet={openWallet} onClose={() => setOpenId(null)} />
      ) : null}

      <CapabilityPanel />

      <footer className="mt-8 border-t border-[#dee0db] pt-4 text-[12px] leading-6 text-[#5c5d55] dark:border-gray-800 dark:text-gray-500">
        <p>
          交易所冷钱包是客户托管，政府地址是扣押或追回资产，公司储备是发行商或基金会运营地址。同一主体通常拆成许多地址，这里按单地址展示，不等于实体总持仓。
        </p>
        <p className="mt-2">{SATOSHI_CLUSTER_NOTE}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Bitcoin 余额与交易：
            <a className="ml-1 underline" href="https://mempool.space/docs/api/rest" target="_blank" rel="noreferrer">mempool.space REST</a>
          </li>
          <li>
            Ethereum 余额：公共 eth_getBalance（publicnode / Cloudflare / Ankr）。热钱包 24 小时流水需要 Etherscan / Blockscout 历史接口，这里暂不估算 ETH 日变动。
          </li>
          <li>
            标签交叉核验：
            <a className="ml-1 underline" href="https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html" target="_blank" rel="noreferrer">BitInfoCharts</a>
            、
            <a className="underline" href="https://etherscan.io/accounts" target="_blank" rel="noreferrer">Etherscan Accounts</a>
            、
            <a className="underline" href="https://info.arkm.com/research/who-owns-the-most-bitcoin-top-btc-holders-2026" target="_blank" rel="noreferrer">Arkham 2026 持仓研究</a>
            。
          </li>
        </ul>
      </footer>
    </main>
  )
}

function modeClass(active) {
  return `rounded-md px-3 py-1 transition ${
    active
      ? 'bg-[#2f3027] text-white dark:bg-gray-200 dark:text-[#111]'
      : 'text-[#585a4c] hover:bg-[#e9eae2] dark:text-gray-400 dark:hover:bg-gray-800'
  }`
}

function PillGroup({ items, value, onChange }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[#c6cab8] bg-white p-0.5 text-xs dark:border-gray-700 dark:bg-gray-950">
      {items.map((item) => (
        <button key={item.id} type="button" onClick={() => onChange(item.id)} className={modeClass(value === item.id)}>
          {item.label}
        </button>
      ))}
    </div>
  )
}

function FolkBadge({ wallet }) {
  const folk = wallet?.folk
  if (!folk?.label) return null
  const stance = FOLK_STANCE_META[folk.stance] || FOLK_STANCE_META.rumor
  return (
    <span
      className="rounded-full px-1.5 py-0.5 text-[10px] text-white"
      style={{ backgroundColor: stance.color }}
      title={folk.detail || folk.label}
    >
      {folk.label}
    </span>
  )
}

function StatCard({ label, value, hint, tone }) {
  return (
    <div className="rounded-xl border border-[#dee0db] bg-white px-3 py-3 dark:border-gray-800 dark:bg-gray-950">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#767869]">{label}</p>
      <p className={`mt-1 text-[18px] font-semibold tabular-nums ${toneClass(tone)}`}>{value}</p>
      <p className="mt-1 text-[11px] text-[#767869] dark:text-gray-500">{hint}</p>
    </div>
  )
}

function ScatterChart({ wallets, focusIds, hoverId, onHover, onSelect }) {
  const W = 920
  const H = 420
  const padL = 58
  const padR = 24
  const padT = 28
  const padB = 42
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const usdValues = wallets.map((row) => row.usd || 0).filter((value) => value > 0)
  const minUsd = usdValues.length ? Math.max(10_000, Math.min(...usdValues) / 2) : 10_000
  const maxUsd = usdValues.length ? Math.max(...usdValues) * 1.2 : 1_000_000_000
  const xMin = Math.log10(minUsd)
  const xMax = Math.log10(maxUsd)
  const yMin = -8
  const yMax = 8
  const maxTx = Math.max(...wallets.map((row) => row.txCount || 1), 1)
  const xPos = (usd) => padL + ((Math.log10(Math.max(usd || minUsd, minUsd)) - xMin) / (xMax - xMin)) * innerW
  const yPos = (pct) => {
    const clamped = Math.max(yMin, Math.min(yMax, pct == null ? 0 : pct))
    return padT + (1 - (clamped - yMin) / (yMax - yMin)) * innerH
  }
  const rPos = (txCount) => 7 + (Math.log10((txCount || 1) + 1) / Math.log10(maxTx + 1)) * 14
  const midY = yPos(0)
  const hovered = hoverId ? wallets.find((row) => row.id === hoverId) : null
  const hasFocus = focusIds.length > 0
  const xTicks = [1e8, 1e9, 1e10, 1e11].filter((value) => value >= minUsd && value <= maxUsd)

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block w-full text-[#333431] dark:text-gray-300" role="img" aria-label="巨鲸估值与 24 小时变动散点图">
        <rect x={padL} y={padT} width={innerW} height={midY - padT} fill="#e9eae2" opacity={0.35} />
        <rect x={padL} y={midY} width={innerW} height={padT + innerH - midY} fill="#dad6d3" opacity={0.32} />
        <text x={padL + 8} y={padT + 14} fontSize="10" fill="#7c917c" opacity={0.85}>较小 · 流入</text>
        <text x={padL + innerW - 8} y={padT + 14} fontSize="10" fill="#3f6a3f" opacity={0.85} textAnchor="end">大额 · 流入</text>
        <text x={padL + 8} y={padT + innerH - 4} fontSize="10" fill="#a05a3c" opacity={0.85}>较小 · 流出</text>
        <text x={padL + innerW - 8} y={padT + innerH - 4} fontSize="10" fill="#a05a3c" opacity={0.95} textAnchor="end">大额 · 流出</text>
        <line x1={padL} x2={padL + innerW} y1={midY} y2={midY} stroke="#a9ab96" strokeDasharray="3 4" opacity={0.65} />
        {xTicks.map((tick) => {
          const x = xPos(tick)
          return (
            <g key={tick}>
              <line x1={x} x2={x} y1={padT} y2={padT + innerH} stroke="#dee0db" strokeDasharray="2 3" opacity={0.5} />
              <text x={x} y={padT + innerH + 14} fontSize="10" fill="currentColor" opacity={0.6} textAnchor="middle">{formatUsd(tick, 0)}</text>
            </g>
          )
        })}
        {[-5, 0, 5].map((tick) => {
          const y = yPos(tick)
          return (
            <g key={tick}>
              <line x1={padL} x2={padL + innerW} y1={y} y2={y} stroke="#dee0db" strokeDasharray="2 3" opacity={0.4} />
              <text x={padL - 6} y={y + 3} fontSize="10" fill="currentColor" opacity={0.6} textAnchor="end">{tick}%</text>
            </g>
          )
        })}
        <line x1={padL} x2={padL + innerW} y1={padT + innerH} y2={padT + innerH} stroke="currentColor" opacity={0.4} />
        <line x1={padL} x2={padL} y1={padT} y2={padT + innerH} stroke="currentColor" opacity={0.4} />
        <text x={padL + innerW / 2} y={H - 8} fontSize="10" fill="currentColor" opacity={0.7} textAnchor="middle">当前估值（对数美元）</text>
        <text x={14} y={padT + innerH / 2} fontSize="10" fill="currentColor" opacity={0.7} textAnchor="middle" transform={`rotate(-90 14 ${padT + innerH / 2})`}>
          24 小时变动（%）
        </text>
        {wallets.map((wallet) => {
          const cx = xPos(wallet.usd)
          const cy = yPos(wallet.changePct)
          const r = rPos(wallet.txCount)
          const isFocused = focusIds.includes(wallet.id)
          const isHover = hoverId === wallet.id
          const isDimmed = hasFocus && !isFocused && !isHover
          return (
            <g
              key={wallet.id}
              style={{ cursor: 'pointer', transition: 'opacity 180ms ease' }}
              opacity={isDimmed ? 0.18 : 1}
              onMouseEnter={() => onHover(wallet.id)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(wallet.id)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={CATEGORY_META[wallet.category].color}
                opacity={isFocused || isHover ? 0.92 : 0.62}
                stroke={isFocused ? '#15140f' : isHover ? '#2f3027' : 'rgba(255,255,255,0.85)'}
                strokeWidth={isFocused ? 2 : isHover ? 1.5 : 1}
                strokeDasharray={wallet.changeComplete === false ? '3 2' : undefined}
              />
              <text
                x={cx}
                y={cy + r + 11}
                fontSize={11}
                fontWeight={600}
                fill="currentColor"
                textAnchor="middle"
                style={{ pointerEvents: 'none' }}
              >
                {isFocused || isHover ? wallet.nameZh : ''}
              </text>
            </g>
          )
        })}
      </svg>
      {hovered ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-[#2f3027]/15 bg-white/95 px-3 py-2 text-[11px] leading-5 text-[#15140f] shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-950/95 dark:text-gray-100"
          style={{
            left: `${Math.max(12, Math.min(88, (xPos(hovered.usd) / W) * 100))}%`,
            top: `${Math.max(8, ((yPos(hovered.changePct) - rPos(hovered.txCount) - 6) / H) * 100)}%`,
            minWidth: 210,
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CATEGORY_META[hovered.category].color }} />
            <strong className="text-[12px]">{hovered.nameZh}</strong>
          </div>
          {hovered.folk?.label ? <p className="text-[11px] text-[#5c5d55] dark:text-gray-400">{hovered.folk.label}</p> : null}
          <p className="font-mono text-[10px] text-[#767869]">{shortAddress(hovered.address)}</p>
          <table className="mt-1 w-full tabular-nums">
            <tbody>
              <tr><td className="pr-2 text-[#767869]">估值</td><td className="text-right">{formatUsd(hovered.usd)}</td></tr>
              <tr><td className="pr-2 text-[#767869]">数量</td><td className="text-right">{formatNative(hovered.amount, hovered.asset)}</td></tr>
              <tr><td className="pr-2 text-[#767869]">24h</td><td className={`text-right ${toneClass(hovered.changeUsd)}`}>{formatUsd(hovered.changeUsd)}</td></tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

function RankingList({ wallets, sortBy, focusIds, hoverId, onHover, onSelect, compareMode }) {
  if (!wallets.length) return <p className="px-4 py-6 text-[13px] text-[#767869]">没有符合筛选的地址。</p>
  const accessor = SORT_OPTIONS.find((item) => item.id === sortBy).accessor
  const max = Math.max(...wallets.map(accessor), 1)
  const hasFocus = focusIds.length > 0

  return (
    <div className="divide-y divide-[#dfe2d6] dark:divide-gray-800">
      {wallets.map((wallet, index) => {
        const value = accessor(wallet)
        const pct = Math.max(2, (value / max) * 100)
        const isFocused = focusIds.includes(wallet.id)
        const isHover = hoverId === wallet.id
        const dimmed = hasFocus && !isFocused && !isHover
        return (
          <button
            key={wallet.id}
            type="button"
            onClick={() => onSelect(wallet.id)}
            onMouseEnter={() => onHover(wallet.id)}
            onMouseLeave={() => onHover(null)}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition sm:px-4 ${dimmed ? 'opacity-45' : 'opacity-100'} ${isFocused ? 'bg-[#f6f8f3] dark:bg-gray-900' : 'hover:bg-[#f6f8f3]/80 dark:hover:bg-gray-900/80'}`}
          >
            <span className="w-6 font-mono text-[11px] text-[#767869]">{index + 1}</span>
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: CATEGORY_META[wallet.category].color }} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-medium text-[#15140f] dark:text-gray-100">{wallet.nameZh}</span>
                <span className="rounded-full bg-[#eceee6] px-1.5 py-0.5 text-[10px] text-[#5c5d55] dark:bg-gray-800 dark:text-gray-400">{CATEGORY_META[wallet.category].label}</span>
                <FolkBadge wallet={wallet} />
                <span className="font-mono text-[10px] text-[#767869]">{wallet.asset}</span>
                {wallet.changeComplete === false ? <span className="text-[10px] text-[#a05a3c]">24h 不完整</span> : null}
                {compareMode && isFocused ? <span className="text-[10px] text-[#3f6a3f]">已选</span> : null}
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#eceee6] dark:bg-gray-800">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CATEGORY_META[wallet.category].color }} />
              </div>
            </div>
            <div className="w-[118px] shrink-0 text-right tabular-nums">
              <div className="text-[13px] font-medium text-[#15140f] dark:text-gray-100">{formatUsd(wallet.usd)}</div>
              <div className={`text-[11px] ${toneClass(wallet.changeUsd)}`}>{formatUsd(wallet.changeUsd)} · {formatPct(wallet.changePct)}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function DetailPanel({ wallet, onClose }) {
  return (
    <section className="mt-5 rounded-xl border border-[#dee0db] bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#767869]">{wallet.nameEn}</p>
          <h2 className="mt-1 text-[18px] font-semibold text-[#15140f] dark:text-gray-100">{wallet.nameZh}</h2>
          <p className="mt-1 break-all font-mono text-[11px] text-[#767869]">{wallet.address}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#eceee6] px-1.5 py-0.5 text-[10px] text-[#5c5d55] dark:bg-gray-800 dark:text-gray-400">{CATEGORY_META[wallet.category].label}</span>
            <FolkBadge wallet={wallet} />
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-[12px] text-[#767869] underline">关闭</button>
      </div>
      {wallet.folk?.detail ? (
        <div className="mt-3 rounded-lg border border-[#eceee6] bg-[#f6f8f3]/80 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/60">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#767869]">
            公众看法 · {FOLK_STANCE_META[wallet.folk.stance]?.label || '传闻'}
          </p>
          <p className="mt-1 text-[13px] leading-6 text-[#333431] dark:text-gray-300">{wallet.folk.detail}</p>
        </div>
      ) : null}
      <p className="mt-2 text-[13px] leading-6 text-[#51514a] dark:text-gray-400">{wallet.latestSignal}</p>
      <p className="mt-1 text-[12px] leading-6 text-[#767869]">{wallet.note}</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-4">
        <Metric label="当前数量" value={formatNative(wallet.amount, wallet.asset)} />
        <Metric label="折合美元" value={formatUsd(wallet.usd)} />
        <Metric label="24h 净变动" value={`${formatUsd(wallet.changeUsd)} · ${formatPct(wallet.changePct)}`} tone={wallet.changeUsd} />
        <Metric label="链上交易次数" value={wallet.txCount == null ? '—' : wallet.txCount.toLocaleString('en-US')} />
      </dl>
      {wallet.changeComplete === false ? (
        <p className="mt-3 text-[12px] text-[#a05a3c]">最近一页交易全部落在 24 小时内，净变动可能少计。</p>
      ) : null}
      {wallet.chain === 'ethereum' ? (
        <p className="mt-3 text-[12px] text-[#767869]">Ethereum 公共 RPC 只返回当前余额。24 小时流水需要交易历史接口。</p>
      ) : null}
      <Sparkline days={wallet.daily} />
      <div className="mt-4 flex flex-wrap gap-3 text-[12px]">
        <a href={wallet.explorerUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">打开区块浏览器</a>
        {wallet.sources.map((source) => (
          <a key={source.href} href={source.href} target="_blank" rel="noreferrer" className="underline underline-offset-2">{source.label}</a>
        ))}
      </div>
    </section>
  )
}

function Metric({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-[#eceee6] px-3 py-2 dark:border-gray-800">
      <dt className="text-[10px] uppercase tracking-[0.14em] text-[#767869]">{label}</dt>
      <dd className={`mt-1 text-[14px] font-medium tabular-nums ${toneClass(tone)}`}>{value}</dd>
    </div>
  )
}

function Sparkline({ days }) {
  if (!days?.length) return null
  const max = Math.max(...days.map((day) => Math.abs(day.net)), 0.01)
  const W = 520
  const H = 86
  const step = W / Math.max(days.length - 1, 1)
  const points = days.map((day, index) => {
    const x = index * step
    const y = H / 2 - (day.net / max) * (H / 2 - 8)
    return `${x},${y}`
  }).join(' ')
  return (
    <div className="mt-4">
      <p className="text-[12px] text-[#767869]">近 7 日净流入（由最近交易估算，单位为原生资产）</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-20 w-full text-[#6b85a6]" preserveAspectRatio="none">
        <line x1="0" x2={W} y1={H / 2} y2={H / 2} stroke="currentColor" opacity="0.25" />
        <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
      </svg>
      <div className="flex justify-between text-[10px] text-[#767869]">
        <span>{days[0]?.date}</span>
        <span>{days.at(-1)?.date}</span>
      </div>
    </div>
  )
}

function CompareTable({ wallets, onRemove }) {
  if (!wallets.length) {
    return (
      <section className="mt-5 rounded-xl border border-dashed border-[#c6cab8] p-4 text-[13px] text-[#767869]">
        点选排行或散点，最多加入 3 个地址对比。
      </section>
    )
  }
  const rows = [
    { label: '类别', render: (wallet) => CATEGORY_META[wallet.category].label },
    { label: '公众看法', render: (wallet) => wallet.folk?.label || '—' },
    { label: '链', render: (wallet) => wallet.asset },
    { label: '当前数量', render: (wallet) => formatNative(wallet.amount, wallet.asset) },
    { label: '折合美元', render: (wallet) => formatUsd(wallet.usd) },
    { label: '24h 变动', render: (wallet) => formatUsd(wallet.changeUsd), tone: (wallet) => wallet.changeUsd },
    { label: '24h 幅度', render: (wallet) => formatPct(wallet.changePct), tone: (wallet) => wallet.changePct },
    { label: '交易次数', render: (wallet) => wallet.txCount == null ? '—' : wallet.txCount.toLocaleString('en-US') },
    { label: '最近信号', render: (wallet) => wallet.latestSignal },
  ]
  return (
    <section className="mt-5 overflow-x-auto rounded-xl border border-[#dee0db] bg-white dark:border-gray-800 dark:bg-gray-950">
      <table className="min-w-[640px] w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-[#dee0db] dark:border-gray-800">
            <th className="px-3 py-3 font-medium text-[#767869]">指标</th>
            {wallets.map((wallet) => (
              <th key={wallet.id} className="px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span>{wallet.nameZh}</span>
                  <button type="button" onClick={() => onRemove(wallet.id)} className="text-[11px] text-[#767869]">×</button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-[#eceee6] dark:border-gray-800">
              <th className="px-3 py-2 font-medium text-[#767869]">{row.label}</th>
              {wallets.map((wallet) => (
                <td key={wallet.id} className={`px-3 py-2 ${row.tone ? toneClass(row.tone(wallet)) : ''}`}>{row.render(wallet)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function CapabilityPanel() {
  return (
    <section className="mt-8 rounded-xl border border-[#dee0db] bg-[#f6f8f3]/70 p-4 dark:border-gray-800 dark:bg-gray-900/60 sm:p-5">
      <h2 className="text-[15px] font-semibold text-[#15140f] dark:text-gray-100">公开接口能拿到什么</h2>
      <p className="mt-1 text-[12px] leading-6 text-[#5c5d55] dark:text-gray-500">
        链上余额可以现读。每天一条完整余额曲线，需要付费索引，或自己按日做快照。
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-[640px] w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#dfe2d6] dark:border-gray-800">
              <th className="py-2 pr-3 font-medium">需求</th>
              <th className="py-2 pr-3 font-medium">免费公开接口</th>
              <th className="py-2 font-medium">付费 / 实体索引</th>
            </tr>
          </thead>
          <tbody>
            {DATA_CAPABILITIES.map((item) => (
              <tr key={item.id} className="border-b border-[#eceee6] align-top dark:border-gray-800">
                <td className="py-2 pr-3 font-medium text-[#15140f] dark:text-gray-100">{item.need}</td>
                <td className="py-2 pr-3 text-[#51514a] dark:text-gray-400">{item.free}</td>
                <td className="py-2 text-[#51514a] dark:text-gray-400">{item.paid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  IconArrowUpRight,
  IconChartBar,
  IconCheck,
  IconChevronRight,
  IconCurrencyDollar,
  IconInfoCircle,
  IconLayersIntersect,
  IconScale,
  IconSearch,
  IconTopologyStar3,
  IconX,
} from '@tabler/icons-react'

import SharePageButton from '../components/SharePageButton'
import {
  BASIS_META,
  MARKETS,
  MARKET_GROUPS,
  MARKET_TYPES,
  PRODUCT_CONCEPTS,
  SOURCES,
  STOCK_MARKETS,
  sourceFor,
} from './data'

const PAGE_URL = 'https://2aran.com/global-market-map'
const MAX_COMPARE = 3
const USD_CNY = 7.1

const BASIS_CLASSES = {
  cash: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
  notional: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
  premium: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300',
  mixed: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
}

const BAR_CLASSES = {
  rates: 'bg-[#345d82] dark:bg-[#7199bb]',
  fx: 'bg-[#3d7a68] dark:bg-[#68a48f]',
  equity: 'bg-[#b45f45] dark:bg-[#d4866e]',
  'fixed-income': 'bg-[#88703c] dark:bg-[#b69a5e]',
  crypto: 'bg-[#76578b] dark:bg-[#9b7eb0]',
  options: 'bg-[#a04f6c] dark:bg-[#c87c97]',
}

const SEGMENT_CLASSES = [
  'bg-[#315d8a]',
  'bg-[#3b7b6d]',
  'bg-[#b45f45]',
  'bg-[#8a6a35]',
  'bg-[#76578b]',
]

function formatUsd(valueBn) {
  if (valueBn >= 1000) {
    const value = valueBn / 1000
    return `${value >= 10 ? value.toFixed(1) : value.toFixed(2)} 万亿美元`
  }
  const hundredMillion = valueBn * 10
  if (hundredMillion >= 10) return `${Math.round(hundredMillion).toLocaleString('zh-CN')} 亿美元`
  return `${hundredMillion.toFixed(1)} 亿美元`
}

function formatValue(valueBn, currency) {
  if (currency === 'cny') {
    const trillionCny = (valueBn * USD_CNY) / 1000
    return `¥${trillionCny >= 10 ? trillionCny.toFixed(1) : trillionCny.toFixed(2)} 万亿`
  }
  return formatUsd(valueBn)
}

function marketPercent(value, max, scale) {
  if (scale === 'linear') return Math.max(0.7, (value / max) * 100)
  const floor = 1
  const numerator = Math.log10(value + floor)
  const denominator = Math.log10(max + floor)
  return Math.max(2, (numerator / denominator) * 100)
}

function BasisBadge({ basis }) {
  const meta = BASIS_META[basis]
  return <span className={`inline-flex border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] ${BASIS_CLASSES[basis]}`}>{meta.label}</span>
}

function Composition({ market }) {
  if (market.compositionKind === 'qualitative') {
    return (
      <div className="grid gap-2 sm:grid-cols-3">
        {market.composition.map((item) => (
          <div key={item.name} className="border-l-2 border-[#c9c3b6] pl-3 dark:border-[#444b55]">
            <strong className="block text-sm text-[#222b37] dark:text-gray-200">{item.name}</strong>
            <span className="mt-1 block text-xs leading-5 text-[#77736b] dark:text-gray-500">{item.note}</span>
          </div>
        ))}
      </div>
    )
  }

  const total = market.composition.reduce((sum, item) => sum + item.value, 0)
  return (
    <div>
      <div className="flex h-5 w-full overflow-hidden bg-[#ebe7de] dark:bg-[#252a31]" aria-label={`${market.name}构成`}>
        {market.composition.map((item, index) => (
          <div
            key={item.name}
            className={`${SEGMENT_CLASSES[index % SEGMENT_CLASSES.length]} transition-all`}
            style={{ width: `${(item.value / total) * 100}%` }}
            title={`${item.name} ${(item.value / total * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {market.composition.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-[#686760] dark:text-gray-400">
              <span className={`h-2.5 w-2.5 shrink-0 ${SEGMENT_CLASSES[index % SEGMENT_CLASSES.length]}`} />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="shrink-0 font-mono text-[#222b37] dark:text-gray-200">
              {market.compositionKind === 'value' ? formatUsd(item.value) : `${item.value}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MarketDetail({ market, compareIds, onCompare }) {
  const source = sourceFor(market)
  const selected = compareIds.includes(market.id)

  return (
    <section className="border border-[#d6d1c6] bg-[#fffdf8] p-5 dark:border-[#363c45] dark:bg-[#14191f] sm:p-7" aria-live="polite">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <BasisBadge basis={market.basis} />
            <span className="font-mono text-[10px] text-[#8b867c] dark:text-gray-500">{market.period}</span>
          </div>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-[#19283b] dark:text-white">{market.name}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#62615b] dark:text-gray-400">{market.definition}</p>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="font-mono text-2xl font-semibold text-[#17243b] dark:text-white">{formatUsd(market.dailyUsdBn)}</p>
          <p className="mt-1 text-[10px] text-[#8b867c] dark:text-gray-500">日均成交规模</p>
          <button
            type="button"
            onClick={() => onCompare(market.id)}
            className={`mt-3 inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs transition ${selected ? 'border-[#b45f45] bg-[#b45f45] text-white' : 'border-[#bbb5a8] text-[#5f5d56] hover:border-[#315d8a] hover:text-[#315d8a] dark:border-[#505762] dark:text-gray-400'}`}
          >
            {selected ? <IconCheck size={14} /> : <IconScale size={14} />}{selected ? '已加入对比' : '加入对比'}
          </button>
        </div>
      </div>

      <div className="mt-6 border-y border-[#e3ded3] py-5 dark:border-[#30363f]">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#908a7f] dark:text-gray-500">主要构成</p>
        <Composition market={market} />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="border-l-2 border-[#3b7b6d] pl-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#3b7b6d] dark:text-[#78a999]">看懂它</p>
          <p className="mt-2 text-sm leading-6 text-[#454b50] dark:text-gray-300">{market.takeaway}</p>
        </div>
        <div className="border-l-2 border-[#b45f45] pl-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#b45f45] dark:text-[#d4866e]">比较边界</p>
          <p className="mt-2 text-sm leading-6 text-[#454b50] dark:text-gray-300">{market.caveat}</p>
        </div>
      </div>

      {source ? (
        <a href={source.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-[#315d8a] underline decoration-[#9fb0c0] underline-offset-4 hover:text-[#b45f45] dark:text-[#9bb7d2]">
          {source.label}<IconArrowUpRight size={14} />
        </a>
      ) : null}
    </section>
  )
}

function ComparePanel({ items, onRemove, onClear }) {
  if (!items.length) return null
  const base = Math.min(...items.map((item) => item.dailyUsdBn))

  return (
    <section className="mt-7 border-t-2 border-[#263445] pt-5 dark:border-gray-300">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8c5b42] dark:text-[#cf8c72]">Compare</p>
          <h2 className="mt-1 font-serif text-xl font-semibold text-[#17243b] dark:text-white">已选市场对比</h2>
        </div>
        <button type="button" onClick={onClear} className="text-xs text-[#77736b] underline underline-offset-4 hover:text-[#b45f45] dark:text-gray-500">清空</button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#d8d3c8] dark:border-[#363c45]">
              <th className="py-3 pr-4 text-xs font-medium text-[#8a857b]">指标</th>
              {items.map((item) => (
                <th key={item.id} className="px-3 py-3 align-top">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium text-[#202a38] dark:text-gray-200">{item.shortName}</span>
                    <button type="button" onClick={() => onRemove(item.id)} aria-label={`移除${item.name}`} className="text-[#99948a] hover:text-[#b45f45]"><IconX size={15} /></button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e1d8] dark:divide-[#30363e]">
            <tr><th className="py-3 pr-4 text-xs font-normal text-[#8a857b]">日均规模</th>{items.map((item) => <td key={item.id} className="px-3 py-3 font-mono font-semibold text-[#1e2938] dark:text-white">{formatUsd(item.dailyUsdBn)}</td>)}</tr>
            <tr><th className="py-3 pr-4 text-xs font-normal text-[#8a857b]">相对最小项</th>{items.map((item) => <td key={item.id} className="px-3 py-3 font-mono text-[#5d625f] dark:text-gray-400">{(item.dailyUsdBn / base).toFixed(item.dailyUsdBn / base >= 10 ? 0 : 1)}×</td>)}</tr>
            <tr><th className="py-3 pr-4 text-xs font-normal text-[#8a857b]">产品性质</th>{items.map((item) => <td key={item.id} className="px-3 py-3"><BasisBadge basis={item.basis} /></td>)}</tr>
            <tr><th className="py-3 pr-4 text-xs font-normal text-[#8a857b]">时间口径</th>{items.map((item) => <td key={item.id} className="px-3 py-3 text-xs text-[#686760] dark:text-gray-400">{item.period}</td>)}</tr>
            <tr><th className="py-3 pr-4 text-xs font-normal text-[#8a857b]">不能忽略</th>{items.map((item) => <td key={item.id} className="px-3 py-3 text-xs leading-5 text-[#686760] dark:text-gray-400">{item.caveat}</td>)}</tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ScaleExplorer() {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const [type, setType] = useState('all')
  const [scale, setScale] = useState('log')
  const [currency, setCurrency] = useState('usd')
  const [selectedId, setSelectedId] = useState('global-fx')
  const [compareIds, setCompareIds] = useState([])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MARKETS.filter((market) => {
      if (group !== 'all' && market.group !== group) return false
      if (type !== 'all' && market.type !== type) return false
      if (q && !`${market.name}${market.shortName}${market.definition}`.toLowerCase().includes(q)) return false
      return true
    }).sort((a, b) => b.dailyUsdBn - a.dailyUsdBn)
  }, [group, query, type])

  const max = Math.max(...filtered.map((market) => market.dailyUsdBn), 1)
  const selected = MARKETS.find((market) => market.id === selectedId) || filtered[0] || MARKETS[0]
  const compareItems = compareIds.map((id) => MARKETS.find((market) => market.id === id)).filter(Boolean)

  useEffect(() => {
    if (filtered.length && !filtered.some((market) => market.id === selectedId)) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered, selectedId])

  function toggleCompare(id) {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= MAX_COMPARE) return [...current.slice(1), id]
      return [...current, id]
    })
  }

  return (
    <>
      <section className="border-b border-[#d9d4c9] pb-8 dark:border-[#30353d]">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <label htmlFor="market-search" className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#837f75] dark:text-gray-500">搜索市场或产品</label>
            <div className="relative mt-2 max-w-md">
              <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#99948b]" />
              <input id="market-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：股票、永续、外汇、期权" className="w-full border border-[#cbc5b9] bg-[#fffdf8] py-2.5 pl-9 pr-3 text-sm text-[#263142] outline-none transition placeholder:text-[#aaa59b] focus:border-[#315d8a] dark:border-[#404650] dark:bg-[#14191f] dark:text-gray-200" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex border border-[#cbc5b9] bg-[#fffdf8] p-0.5 text-xs dark:border-[#404650] dark:bg-[#14191f]">
              {[['log', '对数视图'], ['linear', '真实比例']].map(([id, label]) => <button key={id} type="button" onClick={() => setScale(id)} className={`px-3 py-1.5 transition ${scale === id ? 'bg-[#263445] text-white dark:bg-gray-200 dark:text-gray-950' : 'text-[#696760] hover:text-[#263445] dark:text-gray-400'}`}>{label}</button>)}
            </div>
            <div className="flex border border-[#cbc5b9] bg-[#fffdf8] p-0.5 text-xs dark:border-[#404650] dark:bg-[#14191f]">
              {[['usd', '美元'], ['cny', '人民币']].map(([id, label]) => <button key={id} type="button" onClick={() => setCurrency(id)} className={`px-3 py-1.5 transition ${currency === id ? 'bg-[#263445] text-white dark:bg-gray-200 dark:text-gray-950' : 'text-[#696760] hover:text-[#263445] dark:text-gray-400'}`}>{label}</button>)}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {MARKET_TYPES.map((item) => <button key={item.id} type="button" onClick={() => setType(item.id)} className={`border px-3 py-1.5 text-xs transition ${type === item.id ? 'border-[#315d8a] bg-[#315d8a] text-white' : 'border-[#d1cbbf] text-[#65635d] hover:border-[#8e8a80] dark:border-[#414750] dark:text-gray-400'}`}>{item.label}</button>)}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {MARKET_GROUPS.map((item) => <button key={item.id} type="button" onClick={() => setGroup(item.id)} className={`px-2.5 py-1 text-xs transition ${group === item.id ? 'bg-[#ece5d9] font-medium text-[#8c4e37] dark:bg-[#2a211d] dark:text-[#dc9277]' : 'text-[#77736a] hover:text-[#263445] dark:text-gray-500'}`}>{item.label}</button>)}
        </div>
      </section>

      <div className="mt-7 grid gap-7 xl:grid-cols-[1.05fr_.95fr]">
        <section aria-label="市场日成交额排行">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8c5b42] dark:text-[#cf8c72]">Daily turnover</p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-[#17243b] dark:text-white">日成交额数量级</h2>
            </div>
            <span className="text-[10px] text-[#8b867c] dark:text-gray-500">{scale === 'log' ? '对数长度 · 便于看全局' : '线性长度 · 保留真实差距'}</span>
          </div>
          <div className="space-y-1.5">
            {filtered.length ? filtered.map((market) => {
              const active = selected.id === market.id
              return (
                <button key={market.id} type="button" onClick={() => setSelectedId(market.id)} className={`group w-full px-3 py-3 text-left transition ${active ? 'bg-[#eee8dc] dark:bg-[#242a31]' : 'hover:bg-[#f4f0e8] dark:hover:bg-[#1b2027]'}`}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium text-[#263142] dark:text-gray-200">{market.shortName}</span>
                      <span className="hidden sm:inline"><BasisBadge basis={market.basis} /></span>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-semibold text-[#263142] dark:text-gray-200">{formatValue(market.dailyUsdBn, currency)}</span>
                  </div>
                  <div className="h-2 bg-[#e6e1d7] dark:bg-[#292f36]">
                    <div className={`h-full transition-all duration-300 ${BAR_CLASSES[market.group]}`} style={{ width: `${marketPercent(market.dailyUsdBn, max, scale)}%` }} />
                  </div>
                </button>
              )
            }) : <p className="border border-dashed border-[#cbc5b9] px-4 py-10 text-center text-sm text-[#77736b] dark:border-[#444a53] dark:text-gray-500">没有符合条件的市场。</p>}
          </div>
        </section>
        <MarketDetail market={selected} compareIds={compareIds} onCompare={toggleCompare} />
      </div>

      <ComparePanel items={compareItems} onRemove={toggleCompare} onClear={() => setCompareIds([])} />

      <div className="mt-8 flex gap-3 border-l-2 border-[#8a6a35] bg-[#f6f2e9] px-4 py-3 text-xs leading-6 text-[#69645b] dark:bg-[#12171d] dark:text-gray-400">
        <IconInfoCircle size={17} className="mt-1 shrink-0" />
        <p><strong className="text-[#393c3c] dark:text-gray-200">不要把所有行相加。</strong>“全球外汇”已经包含外汇现货；“全球加密衍生品”已经包含永续；“全球股票公开订单簿”与美国股票全部场所也有重叠。这里比较的是数量级，不是构造一张全球资金流水总账。</p>
      </div>
    </>
  )
}

function StockVenueExplorer() {
  const [selectedId, setSelectedId] = useState('us')
  const [compareIds, setCompareIds] = useState(['us', 'china', 'japan'])
  const selected = STOCK_MARKETS.find((market) => market.id === selectedId) || STOCK_MARKETS[0]
  const max = STOCK_MARKETS[0].dailyUsdBn

  function toggle(id) {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= MAX_COMPARE) return [...current.slice(1), id]
      return [...current, id]
    })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
      <section>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8c5b42] dark:text-[#cf8c72]">Stock venues</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-[#17243b] dark:text-white">股票在哪里真正成交</h2>
        <p className="mt-3 text-sm leading-7 text-[#686760] dark:text-gray-400">点击市场查看内部场所。条形采用统一线性比例，美国的场外成交也包含在总额内。</p>

        <div className="mt-6 space-y-2">
          {STOCK_MARKETS.map((market) => (
            <div key={market.id} className={`border px-4 py-3 transition ${selected.id === market.id ? 'border-[#315d8a] bg-[#f3efe6] dark:border-[#7199bb] dark:bg-[#1d242c]' : 'border-[#ddd7cc] bg-[#fffdf8] dark:border-[#353b44] dark:bg-[#14191f]'}`}>
              <button type="button" onClick={() => setSelectedId(market.id)} className="w-full text-left">
                <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-[#273244] dark:text-gray-200">{market.name}</span><span className="font-mono text-xs font-semibold text-[#273244] dark:text-white">{formatUsd(market.dailyUsdBn)}</span></div>
                <div className="mt-2 h-1.5 bg-[#e5e0d6] dark:bg-[#2b3138]"><div className="h-full bg-[#b45f45] dark:bg-[#d4866e]" style={{ width: `${Math.max(1.2, market.dailyUsdBn / max * 100)}%` }} /></div>
              </button>
              <button type="button" onClick={() => toggle(market.id)} className={`mt-2 inline-flex items-center gap-1 text-[10px] ${compareIds.includes(market.id) ? 'font-medium text-[#b45f45] dark:text-[#d4866e]' : 'text-[#89847a] hover:text-[#315d8a] dark:text-gray-500'}`}>{compareIds.includes(market.id) ? <IconCheck size={12} /> : <IconScale size={12} />}{compareIds.includes(market.id) ? '已对比' : '加入对比'}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-[#d6d1c6] bg-[#fffdf8] p-5 dark:border-[#363c45] dark:bg-[#14191f] sm:p-7" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="font-mono text-[10px] text-[#8b867c] dark:text-gray-500">{selected.period}</p><h3 className="mt-2 font-serif text-2xl font-semibold text-[#19283b] dark:text-white">{selected.name}</h3></div>
          <div className="text-right"><strong className="font-mono text-2xl text-[#19283b] dark:text-white">{formatUsd(selected.dailyUsdBn)}</strong><span className="block text-[10px] text-[#8b867c] dark:text-gray-500">日均</span></div>
        </div>
        <p className="mt-4 text-sm leading-7 text-[#66635c] dark:text-gray-400">{selected.note}</p>

        <div className="mt-6 space-y-5">
          {selected.segments.map((segment, index) => (
            <div key={segment.name}>
              <div className="flex items-end justify-between gap-4"><div><span className="text-sm font-medium text-[#283343] dark:text-gray-200">{segment.name}</span><p className="mt-1 text-xs leading-5 text-[#858078] dark:text-gray-500">{segment.detail}</p></div><strong className="font-mono text-sm text-[#283343] dark:text-white">{segment.share}%</strong></div>
              <div className="mt-2 h-2 bg-[#e9e4da] dark:bg-[#292f36]"><div className={`h-full ${SEGMENT_CLASSES[index % SEGMENT_CLASSES.length]}`} style={{ width: `${Math.min(100, segment.share)}%` }} /></div>
            </div>
          ))}
        </div>

        {sourceFor(selected) ? <a href={sourceFor(selected).url} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-1 text-xs font-medium text-[#315d8a] underline underline-offset-4 dark:text-[#9bb7d2]">{sourceFor(selected).label}<IconArrowUpRight size={14} /></a> : null}
      </section>

      <section className="lg:col-span-2">
        <h3 className="font-serif text-xl font-semibold text-[#17243b] dark:text-white">所选市场横向比较</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {compareIds.map((id) => STOCK_MARKETS.find((market) => market.id === id)).filter(Boolean).map((market) => (
            <article key={market.id} className="border-t-2 border-[#315d8a] bg-[#f7f3eb] px-4 py-4 dark:border-[#7199bb] dark:bg-[#151a20]">
              <div className="flex items-start justify-between gap-2"><h4 className="text-sm font-medium text-[#293443] dark:text-gray-200">{market.name}</h4><button type="button" onClick={() => toggle(market.id)} aria-label={`移除${market.name}`} className="text-[#989288] hover:text-[#b45f45]"><IconX size={14} /></button></div>
              <p className="mt-3 font-mono text-xl font-semibold text-[#182638] dark:text-white">{formatUsd(market.dailyUsdBn)}</p>
              <p className="mt-1 text-[10px] text-[#8b867c] dark:text-gray-500">{(market.dailyUsdBn / STOCK_MARKETS.find((item) => item.id === compareIds[0]).dailyUsdBn).toFixed(2)}× 首项</p>
            </article>
          ))}
        </div>
      </section>

      <div className="lg:col-span-2 flex gap-3 border-l-2 border-[#b45f45] bg-[#f6f2e9] px-4 py-3 text-xs leading-6 text-[#69645b] dark:bg-[#12171d] dark:text-gray-400">
        <IconInfoCircle size={17} className="mt-1 shrink-0" />
        <p><strong className="text-[#393c3c] dark:text-gray-200">上市地不等于成交地。</strong>苹果在 Nasdaq 上市，但一笔苹果股票订单可以在 Nasdaq、NYSE Arca、Cboe、IEX、暗池或做市商系统成交。</p>
      </div>
    </div>
  )
}

function ConceptExplorer() {
  const [selectedId, setSelectedId] = useState('spot')
  const selected = PRODUCT_CONCEPTS.find((item) => item.id === selectedId) || PRODUCT_CONCEPTS[0]
  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PRODUCT_CONCEPTS.map((item, index) => (
          <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`border p-5 text-left transition ${selected.id === item.id ? 'border-[#315d8a] bg-[#315d8a] text-white shadow-[4px_4px_0_#b45f45]' : 'border-[#d7d1c6] bg-[#fffdf8] text-[#253041] hover:border-[#8d897f] dark:border-[#363c45] dark:bg-[#14191f] dark:text-gray-200'}`}>
            <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${selected.id === item.id ? 'text-white/65' : 'text-[#9a6a55] dark:text-[#cf8c72]'}`}>0{index + 1}</span>
            <h2 className="mt-3 font-serif text-2xl font-semibold">{item.name}</h2>
            <p className={`mt-2 text-xs ${selected.id === item.id ? 'text-white/75' : 'text-[#77736b] dark:text-gray-500'}`}>{item.answer}</p>
          </button>
        ))}
      </section>

      <section className="mt-6 grid border border-[#d6d1c6] bg-[#fffdf8] dark:border-[#363c45] dark:bg-[#14191f] md:grid-cols-[.8fr_1.2fr]">
        <div className="border-b border-[#ded8cd] p-6 dark:border-[#343a43] md:border-b-0 md:border-r sm:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8c5b42] dark:text-[#cf8c72]">{selected.question}</p>
          <h3 className="mt-3 font-serif text-3xl font-semibold text-[#17243b] dark:text-white">{selected.answer}</h3>
          <p className="mt-5 border-l-2 border-[#3b7b6d] pl-4 text-sm leading-7 text-[#5e625f] dark:text-gray-400">{selected.example}</p>
        </div>
        <dl className="grid gap-px bg-[#ddd7cc] dark:bg-[#343a43] sm:grid-cols-2">
          {[['底层所有权', selected.ownership], ['到期机制', selected.expiry], ['杠杆', selected.leverage], ['主要损失边界', selected.maxLoss]].map(([label, value]) => (
            <div key={label} className="bg-[#fffdf8] p-5 dark:bg-[#14191f] sm:p-6"><dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8b867c] dark:text-gray-500">{label}</dt><dd className="mt-2 text-sm leading-6 text-[#2e3742] dark:text-gray-300">{value}</dd></div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8c5b42] dark:text-[#cf8c72]">Market anatomy</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-[#17243b] dark:text-white">看懂任何成交额，先问四层</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[['资产', '交易的是股票、债券、货币还是加密资产？'], ['产品', '现货、期货、永续、期权还是掉期？'], ['场所', '交易所订单簿、场外做市商、暗池还是链上 DEX？'], ['统计口径', '现金、名义本金、权利金、张数还是持仓量？']].map(([title, text], index) => (
            <div key={title} className="relative border-t-2 border-[#2f3d4d] bg-[#f5f1e8] p-5 dark:border-[#8298ac] dark:bg-[#151a20]">
              <span className="font-mono text-[10px] text-[#9b765e] dark:text-[#c69275]">{index + 1} / 4</span><h3 className="mt-2 font-serif text-xl font-semibold text-[#202c3c] dark:text-white">{title}</h3><p className="mt-2 text-xs leading-6 text-[#6f6b63] dark:text-gray-400">{text}</p>
              {index < 3 ? <IconChevronRight size={16} className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 bg-[#f7f3eb] text-[#8c5b42] dark:bg-[#10151a] md:block" /> : null}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default function GlobalMarketMapClient() {
  const [view, setView] = useState('scale')
  const views = [
    { id: 'scale', label: '规模地图', icon: IconChartBar },
    { id: 'stocks', label: '股票交易场所', icon: IconTopologyStar3 },
    { id: 'concepts', label: '产品概念', icon: IconLayersIntersect },
  ]

  return (
    <main className="mx-auto w-full max-w-[1160px] px-4 py-7 sm:py-11">
      <header className="border-b-2 border-[#273546] pb-7 dark:border-gray-300">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8c5b42] dark:text-[#cf8c72]"><IconCurrencyDollar size={15} /> Global market atlas · 2025–2026</div>
        <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="max-w-4xl font-serif text-3xl font-semibold leading-tight text-[#142239] dark:text-white sm:text-5xl">一天之内，全球市场有多少钱在转手？</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5f625e] dark:text-gray-400 sm:text-base">把外汇、利率、股票、国债、加密现货、永续、期货和期权放进同一张数量级地图。筛选市场、切换线性与对数比例、钻取股票交易场所，并直接比较不同统计口径。</p>
          </div>
          <SharePageButton title="全球交易市场数量级地图" text="外汇、股票、国债、期货、永续和期权的日成交额交互比较。" url={PAGE_URL} size="md" />
        </div>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#837f76] dark:text-gray-500"><span>基准：美元日均</span><span>资料期：2025–2026</span><span>汇率展示：1 USD ≈ 7.1 CNY</span><span>仅作市场结构教育，不构成投资建议</span></div>
      </header>

      <nav className="sticky top-0 z-20 -mx-4 border-b border-[#d9d4c9] bg-[#faf8f2]/95 px-4 py-3 backdrop-blur dark:border-[#30353d] dark:bg-[#0d1116]/95" aria-label="市场地图视图">
        <div className="flex gap-1 overflow-x-auto">
          {views.map((item) => {
            const Icon = item.icon
            return <button key={item.id} type="button" onClick={() => setView(item.id)} className={`inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs font-medium transition ${view === item.id ? 'bg-[#263445] text-white dark:bg-gray-200 dark:text-gray-950' : 'text-[#6d6a63] hover:bg-[#ede8de] dark:text-gray-400 dark:hover:bg-[#1c2229]'}`}><Icon size={15} />{item.label}</button>
          })}
        </div>
      </nav>

      <div className="py-8 sm:py-10">
        {view === 'scale' ? <ScaleExplorer /> : null}
        {view === 'stocks' ? <StockVenueExplorer /> : null}
        {view === 'concepts' ? <ConceptExplorer /> : null}
      </div>

      <section className="border-t border-[#d9d4c9] pt-8 dark:border-[#30353d]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8c5b42] dark:text-[#cf8c72]">Sources & method</p><h2 className="mt-2 font-serif text-2xl font-semibold text-[#17243b] dark:text-white">数据来源与口径</h2></div><span className="text-[10px] text-[#8b867c] dark:text-gray-500">最后整理：2026-10-03</span></div>
        <div className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {SOURCES.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="group flex items-start justify-between gap-3 border-t border-[#ddd7cc] py-3 text-xs leading-5 text-[#64645f] hover:text-[#315d8a] dark:border-[#343a43] dark:text-gray-400 dark:hover:text-[#9bb7d2]"><span>{source.label}</span><IconArrowUpRight size={14} className="mt-0.5 shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>)}
        </div>
        <p className="mt-6 max-w-4xl text-xs leading-6 text-[#807b72] dark:text-gray-500">年度总额使用对应市场交易日或自然日折算；“现货成交额”更接近资产实际换手，“名义金额”表示合约代表的底层本金，“权利金”表示期权买方实际支付的价格。不同口径可比较数量级，不能据此判断哪个市场拥有更多真实资金。</p>
      </section>
    </main>
  )
}

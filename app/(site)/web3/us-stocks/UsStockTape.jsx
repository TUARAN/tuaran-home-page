'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'

import {
  US_STOCK_BASKET,
  US_STOCK_BASKET_ID,
  US_STOCK_RANGES,
  formatShareVolume,
  formatSignedPercentPoints,
  formatSignedRatio,
  formatUsd,
  rangeReturn,
  sliceBars,
} from '../../../../lib/usStockBasket.js'
import UsStockBook from './UsStockBook'
import UsStockReview from './UsStockReview'

const UP = '#d94a4a'
const DOWN = '#1c8c5e'

function toneClass(value) {
  if (!Number.isFinite(value) || value === 0) return 'text-[var(--site-ink)]'
  return value > 0 ? 'text-[#d94a4a]' : 'text-[#1c8c5e]'
}

function candleLegend(bar) {
  if (!bar) return '移动十字线查看开高低收'
  return `开 ${formatUsd(bar.open)}   高 ${formatUsd(bar.high)}   低 ${formatUsd(bar.low)}   收 ${formatUsd(bar.close)}   量 ${formatShareVolume(bar.volume)}`
}

function indexLegend(point) {
  if (!point) return '组合指数起点为 100'
  return `${point.time}   组合 ${point.value.toFixed(2)}`
}

export default function UsStockTape() {
  const { resolvedTheme } = useTheme()
  const [payload, setPayload] = useState(null)
  const [status, setStatus] = useState('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const [range, setRange] = useState('6mo')
  const [activeId, setActiveId] = useState('AAPL')
  const containerRef = useRef(null)
  const legendRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    fetch('/api/markets/us-stocks', { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body.error || '行情暂时不可用')
        setPayload(body)
        setStatus('ready')
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setPayload(null)
        setStatus('error')
      })
    return () => controller.abort()
  }, [reloadKey])

  const quotes = payload?.quotes || []
  const activeQuote = quotes.find((quote) => quote.symbol === activeId) || null
  const basketMode = activeId === US_STOCK_BASKET_ID
  const visibleBars = useMemo(
    () => sliceBars(activeQuote?.bars || [], range),
    [activeQuote, range],
  )
  const visibleIndex = useMemo(
    () => sliceBars(payload?.index || [], range),
    [payload, range],
  )
  const windowReturn = basketMode ? rangeReturn(visibleIndex.map((point) => ({
    open: point.value,
    close: point.value,
  }))) : rangeReturn(visibleBars)

  useEffect(() => {
    const container = containerRef.current
    const series = basketMode ? visibleIndex : visibleBars
    if (!container || status !== 'ready' || !series.length) return undefined
    let chart
    let cancelled = false
    const dark = resolvedTheme === 'dark'
    const text = dark ? '#d7d5cc' : '#333333'
    const grid = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    const border = dark ? '#27303a' : '#e2e2e2'
    const background = dark ? '#10151d' : '#ffffff'

    async function mount() {
      const {
        CandlestickSeries,
        ColorType,
        CrosshairMode,
        HistogramSeries,
        LineSeries,
        createChart,
      } = await import('lightweight-charts')
      if (cancelled || !containerRef.current) return
      chart = createChart(containerRef.current, {
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: background },
          textColor: text,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        },
        grid: {
          vertLines: { color: grid },
          horzLines: { color: grid },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: border },
        timeScale: { borderColor: border, fixLeftEdge: true },
        localization: { locale: 'zh-CN' },
      })
      if (cancelled) {
        chart.remove()
        chart = null
        return
      }

      if (basketMode) {
        const line = chart.addSeries(LineSeries, {
          color: '#5b8fa3',
          lineWidth: 2,
          priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
        })
        line.setData(visibleIndex.map((point) => ({ time: point.time, value: point.value })))
        chart.subscribeCrosshairMove((param) => {
          if (!legendRef.current) return
          const hovered = visibleIndex.find((point) => point.time === param.time) || visibleIndex.at(-1)
          legendRef.current.textContent = indexLegend(hovered)
        })
        if (legendRef.current) legendRef.current.textContent = indexLegend(visibleIndex.at(-1))
      } else {
        const candles = chart.addSeries(CandlestickSeries, {
          upColor: UP,
          downColor: DOWN,
          borderUpColor: UP,
          borderDownColor: DOWN,
          wickUpColor: UP,
          wickDownColor: DOWN,
        }, 0)
        candles.setData(visibleBars.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })))
        const volume = chart.addSeries(HistogramSeries, {
          priceFormat: { type: 'volume' },
        }, 1)
        volume.setData(visibleBars.map((bar) => ({
          time: bar.time,
          value: bar.volume,
          color: bar.close >= bar.open ? 'rgba(217, 74, 74, 0.55)' : 'rgba(28, 140, 94, 0.55)',
        })))
        const panes = chart.panes()
        panes[0]?.setStretchFactor(3.2)
        panes[1]?.setStretchFactor(1)
        chart.subscribeCrosshairMove((param) => {
          if (!legendRef.current) return
          const hovered = visibleBars.find((bar) => bar.time === param.time) || visibleBars.at(-1)
          legendRef.current.textContent = candleLegend(hovered)
        })
        if (legendRef.current) legendRef.current.textContent = candleLegend(visibleBars.at(-1))
      }
      chart.timeScale().fitContent()
    }

    mount()
    return () => {
      cancelled = true
      chart?.remove()
    }
  }, [basketMode, resolvedTheme, status, visibleBars, visibleIndex])

  const latestIndex = payload?.index?.at(-1)
  const previousIndex = payload?.index?.at(-2)
  const indexDayReturn = latestIndex && previousIndex
    ? (latestIndex.value - previousIndex.value) / previousIndex.value
    : null

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-8">
      <header className="border-b border-[var(--site-line)] pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--site-accent)]">Nasdaq · Daily</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-[var(--site-ink)]">五只美股走势</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--site-muted)]">
              日 K 与成交量按最近一个已收盘交易日绘制，涨为红色，跌为绿色。组合指数按 2026-09-26 仓位的毛名义加权，Twilio 空头权重为负。
            </p>
          </div>
          <Link href="/web3#us-stocks" className="text-xs font-semibold text-[var(--site-ink)] no-underline hover:underline">返回市场与 Web3</Link>
        </div>
        <div className="mt-5">
          <UsStockBook detail />
          <UsStockReview />
        </div>
      </header>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        <QuoteButton
          active={basketMode}
          title="组合"
          meta="9/26 仓位"
          price={latestIndex ? latestIndex.value.toFixed(2) : '--'}
          changeLabel={formatSignedRatio(indexDayReturn)}
          changeValue={indexDayReturn}
          onClick={() => setActiveId(US_STOCK_BASKET_ID)}
        />
        {US_STOCK_BASKET.map((item) => {
          const quote = quotes.find((entry) => entry.symbol === item.symbol)
          return (
            <QuoteButton
              key={item.symbol}
              active={activeId === item.symbol}
              title={`${item.name} ${item.symbol}`}
              meta={item.exchange}
              price={formatUsd(quote?.price)}
              changeLabel={formatSignedPercentPoints(quote?.changePercent)}
              changeValue={quote?.changePercent}
              onClick={() => setActiveId(item.symbol)}
            />
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="走势区间">
          {US_STOCK_RANGES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={range === item.id}
              onClick={() => setRange(item.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${range === item.id ? 'bg-[var(--site-ink)] text-[var(--site-panel)]' : 'text-[var(--site-muted)] hover:bg-[var(--site-panel)] hover:text-[var(--site-ink)]'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className={`font-mono text-xs ${toneClass(windowReturn)}`}>
          区间 {formatSignedRatio(windowReturn)}
        </p>
      </div>
      <p ref={legendRef} className="mt-3 min-h-5 font-mono text-[11px] text-[var(--site-muted)]">
        {status === 'loading' ? '正在读取 Nasdaq 日线' : '移动十字线查看开高低收'}
      </p>

      <section className="relative mt-2 overflow-hidden rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)]">
        <div ref={containerRef} className="h-[460px] w-full sm:h-[520px]" aria-label="股票日线走势图" />
        {status === 'error' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--site-panel)] text-sm text-[var(--site-muted)]">
            <p>行情暂时不可用</p>
            <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="rounded-full border border-[var(--site-line)] px-3 py-1 text-xs font-semibold text-[var(--site-ink)]">重新获取</button>
          </div>
        ) : null}
        {status === 'ready' && !basketMode && activeQuote?.error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--site-panel)] text-sm text-[var(--site-muted)]">
            {activeQuote.name} {activeQuote.error}
          </div>
        ) : null}
      </section>

      <p className="mt-4 text-xs leading-6 text-[var(--site-faint)]">
        日线来自 Nasdaq 公开行情。组合指数起点为 100，权重用 2026-09-26 仓位的毛名义，Twilio 按空头记负权重；某只还没有前一交易日收盘时，该笔当日不计入。SpaceX 使用纳斯达克代码 SPCX。K 线由 TradingView Lightweight Charts 绘制。仓位数字按当日逐仓账户抄录。公开记录不构成开户、下单或投资建议。
      </p>
    </main>
  )
}

function QuoteButton({ active, title, meta, price, changeLabel, changeValue, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[168px] shrink-0 rounded-2xl border px-3 py-3 text-left ${active ? 'border-[var(--site-ink)] bg-[var(--site-panel)]' : 'border-[var(--site-line)] bg-[var(--site-panel)] hover:border-[var(--site-line-strong)]'}`}
      aria-pressed={active}
    >
      <span className="block text-sm font-semibold text-[var(--site-ink)]">{title}</span>
      <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--site-faint)]">{meta}</span>
      <span className="mt-2 block font-mono text-lg text-[var(--site-ink)]">{price}</span>
      <span className={`mt-0.5 block font-mono text-xs ${toneClass(changeValue)}`}>{changeLabel}</span>
    </button>
  )
}

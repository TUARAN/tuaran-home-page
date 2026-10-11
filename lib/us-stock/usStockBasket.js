/**
 * 五只美股的名义占比与 Nasdaq 日线解析。
 * 占比是名义敞口份额：苹果 30%，SpaceX 25%，特斯拉、Cloudflare、Twilio 各 15%。
 */

export const US_STOCK_BASKET = [
  { symbol: 'AAPL', name: '苹果', company: 'Apple', weight: 0.3, exchange: 'NASDAQ' },
  { symbol: 'SPCX', name: 'SpaceX', company: 'SpaceX', weight: 0.25, exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: '特斯拉', company: 'Tesla', weight: 0.15, exchange: 'NASDAQ' },
  { symbol: 'NET', name: 'Cloudflare', company: 'Cloudflare', weight: 0.15, exchange: 'NYSE' },
  { symbol: 'TWLO', name: 'Twilio', company: 'Twilio', weight: 0.15, exchange: 'NYSE' },
]

export const US_STOCK_BASKET_ID = 'basket'

export const US_STOCK_RANGES = [
  { id: '5d', label: '5日' },
  { id: '1mo', label: '1月' },
  { id: '3mo', label: '3月' },
  { id: '6mo', label: '6月' },
  { id: 'ytd', label: '今年' },
  { id: '1y', label: '1年' },
]

export function weightLabel(weight) {
  return `${Math.round(Number(weight) * 100)}%`
}

export function parseNasdaqNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/[$,%\s]/g, '').replace(/,/g, '')
  if (!cleaned || cleaned === '--' || cleaned === 'N/A') return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

export function parseNasdaqDate(value) {
  const match = String(value || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`
}

export function parseNasdaqQuote(symbol, payload) {
  const meta = US_STOCK_BASKET.find((item) => item.symbol === symbol)
  const data = payload?.data
  const bars = []
  for (const point of data?.chart || []) {
    const candle = point?.z || {}
    const time = parseNasdaqDate(candle.dateTime)
    const open = parseNasdaqNumber(candle.open)
    const high = parseNasdaqNumber(candle.high)
    const low = parseNasdaqNumber(candle.low)
    const close = parseNasdaqNumber(candle.close ?? point?.y)
    const volume = parseNasdaqNumber(candle.volume)
    if (!time || open == null || high == null || low == null || close == null) continue
    bars.push({ time, open, high, low, close, volume: volume ?? 0 })
  }
  bars.sort((a, b) => a.time.localeCompare(b.time))
  const deduped = []
  for (const bar of bars) {
    if (deduped.at(-1)?.time === bar.time) deduped[deduped.length - 1] = bar
    else deduped.push(bar)
  }
  return {
    symbol,
    name: meta?.name || symbol,
    company: meta?.company || data?.company || symbol,
    exchange: meta?.exchange || 'US',
    weight: meta?.weight ?? null,
    currency: 'USD',
    asOf: data?.timeAsOf || null,
    price: parseNasdaqNumber(data?.lastSalePrice),
    previousClose: parseNasdaqNumber(data?.previousClose),
    change: parseNasdaqNumber(data?.netChange),
    changePercent: parseNasdaqNumber(data?.percentageChange),
    bars: deduped,
    error: deduped.length ? null : '行情源没有返回可用的日线',
  }
}

export function chartWindow(now = new Date()) {
  const to = now.toISOString().slice(0, 10)
  const fromDate = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate() - 5))
  return { from: fromDate.toISOString().slice(0, 10), to }
}

export function sliceBars(bars, range) {
  if (!bars?.length) return []
  if (range === '5d') return bars.slice(-5)
  const last = bars[bars.length - 1].time
  const end = new Date(`${last}T00:00:00Z`)
  let start
  if (range === 'ytd') {
    start = `${end.getUTCFullYear()}-01-01`
  } else {
    const cursor = new Date(end)
    if (range === '1mo') cursor.setUTCMonth(cursor.getUTCMonth() - 1)
    else if (range === '3mo') cursor.setUTCMonth(cursor.getUTCMonth() - 3)
    else if (range === '6mo') cursor.setUTCMonth(cursor.getUTCMonth() - 6)
    else cursor.setUTCFullYear(cursor.getUTCFullYear() - 1)
    start = cursor.toISOString().slice(0, 10)
  }
  const sliced = bars.filter((bar) => bar.time >= start)
  return sliced.length ? sliced : bars.slice(-1)
}

export function rangeReturn(bars) {
  if (!bars || bars.length < 2) return null
  const base = bars[0].open || bars[0].close
  const last = bars[bars.length - 1].close
  if (!base || !Number.isFinite(last)) return null
  return (last - base) / base
}

export function buildBasketIndex(quotes) {
  const ready = (quotes || []).filter((quote) => quote?.bars?.length && Number.isFinite(Number(quote.weight)) && Number(quote.weight) !== 0)
  const byDate = new Map()
  for (const quote of ready) {
    for (const bar of quote.bars) {
      if (!byDate.has(bar.time)) byDate.set(bar.time, new Map())
      byDate.get(bar.time).set(quote.symbol, bar.close)
    }
  }
  const dates = [...byDate.keys()].sort()
  let index = 100
  let previous = null
  const points = []
  for (const date of dates) {
    const closes = byDate.get(date)
    if (!previous) {
      previous = closes
      points.push({ time: date, value: 100 })
      continue
    }
    let weighted = 0
    let invested = 0
    for (const quote of ready) {
      const current = closes.get(quote.symbol)
      const before = previous.get(quote.symbol)
      if (!Number.isFinite(current) || !Number.isFinite(before) || before === 0) continue
      weighted += quote.weight * (current / before - 1)
      invested += Math.abs(quote.weight)
    }
    if (invested > 0) {
      index *= 1 + weighted
      points.push({ time: date, value: Math.round(index * 10000) / 10000 })
    }
    previous = closes
  }
  return points
}

export function formatUsd(value) {
  if (!Number.isFinite(value)) return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatSignedPercentPoints(value) {
  if (!Number.isFinite(value)) return '--'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatSignedRatio(value) {
  if (!Number.isFinite(value)) return '--'
  return formatSignedPercentPoints(value * 100)
}

export function formatShareVolume(value) {
  if (!Number.isFinite(value)) return '--'
  if (value >= 1e8) return `${(value / 1e8).toFixed(2)} 亿股`
  if (value >= 1e4) return `${(value / 1e4).toLocaleString('zh-CN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} 万股`
  return `${new Intl.NumberFormat('zh-CN').format(value)} 股`
}

import { US_STOCK_BASKET, chartWindow, parseNasdaqQuote } from './usStockBasket.js'

const NASDAQ_CHART = 'https://api.nasdaq.com/api/quote'

export async function fetchNasdaqChart(symbol, { from, to, timeout = 8000 } = {}) {
  const url = new URL(`${NASDAQ_CHART}/${encodeURIComponent(symbol)}/chart`)
  url.searchParams.set('assetclass', 'stocks')
  if (from) url.searchParams.set('fromdate', from)
  if (to) url.searchParams.set('todate', to)
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'Mozilla/5.0',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(timeout),
  })
  if (!response.ok) throw new Error(`${symbol} ${response.status}`)
  return response.json()
}

export async function fetchUsStockBasket(now = new Date()) {
  const { from, to } = chartWindow(now)
  return Promise.all(US_STOCK_BASKET.map(async (item) => {
    try {
      const payload = await fetchNasdaqChart(item.symbol, { from, to })
      return parseNasdaqQuote(item.symbol, payload)
    } catch {
      return {
        symbol: item.symbol,
        name: item.name,
        company: item.company,
        exchange: item.exchange,
        weight: item.weight,
        currency: 'USD',
        asOf: null,
        price: null,
        previousClose: null,
        change: null,
        changePercent: null,
        bars: [],
        error: '行情暂时没有返回',
      }
    }
  }))
}

import {
  DEFAULT_CHANGE_WINDOW_SEC,
  WHALE_WALLETS,
  dailyNetFromMempoolTxs,
  netFlowFromMempoolTxs,
  parseMempoolAddress,
  weiHexToEth,
  whaleAsset,
} from '../../../lib/whaleWallets'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const CACHE_TTL_SEC = 600
const FETCH_TIMEOUT_MS = 8000
const MEMPOOL_BASE = 'https://mempool.space/api'
const ETH_RPCS = [
  'https://ethereum.publicnode.com',
  'https://cloudflare-eth.com',
  'https://rpc.ankr.com/eth',
]

function jsonResponse(body, { status = 200, cacheSec = CACHE_TTL_SEC } = {}) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': `public, s-maxage=${cacheSec}, stale-while-revalidate=300`,
    },
  })
}

async function fetchJson(url, { method = 'GET', body, timeout = FETCH_TIMEOUT_MS } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      accept: 'application/json',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body,
    signal: AbortSignal.timeout(timeout),
  })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response.json()
}

async function readPriceCandidate(loader) {
  try {
    return await loader()
  } catch {
    return null
  }
}

async function fetchPrices() {
  const candidates = await Promise.all([
    readPriceCandidate(async () => {
      const [btc, eth] = await Promise.all([
        fetchJson('https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT', { timeout: 5000 }),
        fetchJson('https://data-api.binance.vision/api/v3/ticker/price?symbol=ETHUSDT', { timeout: 5000 }),
      ])
      return { BTC: Number(btc?.price), ETH: Number(eth?.price), source: 'binance' }
    }),
    readPriceCandidate(async () => {
      const ticker = await fetchJson('https://blockchain.info/ticker', { timeout: 5000 })
      return { BTC: Number(ticker?.USD?.last || ticker?.USD?.['15m']), source: 'blockchain.info' }
    }),
    readPriceCandidate(async () => {
      const data = await fetchJson('https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH&tsyms=USD', { timeout: 4000 })
      return { BTC: Number(data?.BTC?.USD), ETH: Number(data?.ETH?.USD), source: 'cryptocompare' }
    }),
    readPriceCandidate(async () => {
      const data = await fetchJson('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd', { timeout: 4000 })
      return { BTC: Number(data?.bitcoin?.usd), ETH: Number(data?.ethereum?.usd), source: 'coingecko' }
    }),
  ])

  const prices = {}
  const sources = []
  for (const row of candidates) {
    if (!row) continue
    if (row.BTC > 0 && !prices.BTC) {
      prices.BTC = row.BTC
      sources.push(`${row.source}:BTC`)
    }
    if (row.ETH > 0 && !prices.ETH) {
      prices.ETH = row.ETH
      sources.push(`${row.source}:ETH`)
    }
  }
  if (!prices.BTC && !prices.ETH) throw new Error('price feed unavailable')
  return { prices, priceSource: sources.join('+') }
}

async function fetchBitcoinWallet(wallet, nowSec) {
  const load = async () => {
    const [addressPayload, txs] = await Promise.all([
      fetchJson(`${MEMPOOL_BASE}/address/${wallet.address}`),
      fetchJson(`${MEMPOOL_BASE}/address/${wallet.address}/txs`).catch(() => []),
    ])
    const parsed = parseMempoolAddress(addressPayload)
    const sinceSec = nowSec - DEFAULT_CHANGE_WINDOW_SEC
    const flow = netFlowFromMempoolTxs(wallet.address, txs, sinceSec, nowSec)
    return {
      amount: parsed.amount,
      txCount: parsed.txCount,
      changeNative: flow.changeNative,
      changeComplete: flow.complete,
      changeWindow: '24h',
      daily: dailyNetFromMempoolTxs(wallet.address, txs, 7, nowSec),
    }
  }
  try {
    return await load()
  } catch {
    return load()
  }
}

async function fetchEthereumBalances(wallets) {
  const body = JSON.stringify(
    wallets.map((wallet, index) => ({
      jsonrpc: '2.0',
      id: index + 1,
      method: 'eth_getBalance',
      params: [wallet.address, 'latest'],
    })),
  )

  let lastError = null
  for (const rpc of ETH_RPCS) {
    try {
      const payload = await fetchJson(rpc, { method: 'POST', body, timeout: 8000 })
      const rows = Array.isArray(payload) ? payload : [payload]
      const byId = {}
      for (const row of rows) {
        const wallet = wallets[Number(row?.id) - 1]
        if (!wallet) continue
        if (row?.error || row?.result == null) {
          byId[wallet.id] = { error: row?.error?.message || 'eth_getBalance failed' }
          continue
        }
        byId[wallet.id] = {
          amount: weiHexToEth(row.result),
          txCount: null,
          changeNative: null,
          changeComplete: null,
          changeWindow: '24h',
          daily: [],
        }
      }
      return byId
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || new Error('ethereum rpc unavailable')
}

async function buildPayload() {
  const nowSec = Math.floor(Date.now() / 1000)
  const bitcoinWallets = WHALE_WALLETS.filter((wallet) => wallet.chain === 'bitcoin')
  const ethereumWallets = WHALE_WALLETS.filter((wallet) => wallet.chain === 'ethereum')

  const [priceResult, bitcoinRows, ethereumOutcome] = await Promise.all([
    fetchPrices().catch((error) => ({
      prices: {},
      priceSource: '',
      priceError: error.message,
    })),
    Promise.all(
      bitcoinWallets.map(async (wallet) => {
        try {
          return [wallet.id, await fetchBitcoinWallet(wallet, nowSec)]
        } catch (error) {
          return [wallet.id, { error: error.message || 'mempool unavailable' }]
        }
      }),
    ),
    fetchEthereumBalances(ethereumWallets).then(
      (ethereumById) => ({ ethereumById, ethereumError: '' }),
      (error) => ({
        ethereumById: Object.fromEntries(
          ethereumWallets.map((wallet) => [wallet.id, { error: error.message || 'ethereum rpc unavailable' }]),
        ),
        ethereumError: error.message || 'ethereum rpc unavailable',
      }),
    ),
  ])

  const { ethereumById, ethereumError } = ethereumOutcome

  const liveById = {
    ...Object.fromEntries(bitcoinRows),
    ...ethereumById,
  }

  return {
    generatedAt: new Date(nowSec * 1000).toISOString(),
    cacheTtlSec: CACHE_TTL_SEC,
    prices: priceResult.prices,
    priceSource: priceResult.priceSource,
    priceError: priceResult.priceError || '',
    ethereumError,
    wallets: WHALE_WALLETS.map((wallet) => ({
      id: wallet.id,
      asset: whaleAsset(wallet),
      ...(liveById[wallet.id] || { error: 'missing' }),
    })),
  }
}

export async function GET(request) {
  const cache = globalThis.caches?.default
  const cacheKey = new Request(new URL('/api/whale-wallets', request.url), { method: 'GET' })
  const bypassCache = new URL(request.url).searchParams.has('refresh')

  if (cache && !bypassCache) {
    const hit = await cache.match(cacheKey)
    if (hit) return hit
  }

  const response = jsonResponse(await buildPayload())
  if (cache) {
    try {
      await cache.put(cacheKey, response.clone())
    } catch {
      // Local Next.js has no Cache API.
    }
  }
  return response
}

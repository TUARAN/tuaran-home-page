/**
 * Edge live-balance queries only need id / chain / address.
 * Keep notes, folk labels and sources in whaleWallets.js so they stay out of the public Worker.
 */

export const BTC_UNIT = 1e8
export const DEFAULT_CHANGE_WINDOW_SEC = 24 * 60 * 60
export const MEMPOOL_TX_PAGE = 25

const ASSET_BY_CHAIN = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
}

export const WHALE_WALLET_LIVE_TARGETS = [
  { id: 'binance-cold-1', chain: 'bitcoin', address: '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo' },
  { id: 'binance-cold-2', chain: 'bitcoin', address: '3M219KR5vEneNb47ewrPfWyb5jQ2DjxRP6' },
  { id: 'robinhood-btc', chain: 'bitcoin', address: 'bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2' },
  { id: 'bitfinex-cold', chain: 'bitcoin', address: 'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97' },
  { id: 'tether-btc', chain: 'bitcoin', address: 'bc1qjasf9z3h7w3jspkhtgatgpyvvzgpa2wwd2lr0eh5tx44reyn2k7sfc27a4' },
  { id: 'us-gov-bitfinex', chain: 'bitcoin', address: 'bc1qazcm763858nkj2dj986etajv6wquslv8uxwczt' },
  { id: 'mtgox-hack', chain: 'bitcoin', address: '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF' },
  { id: 'early-12ib7', chain: 'bitcoin', address: '12ib7dApVFvg82TXKycWBNpN8kFyiAN1dr' },
  { id: 'us-gov-silkroad', chain: 'bitcoin', address: 'bc1qa5wkgaew2dkv56kfvj49j0av5nml45x9ek9hz6' },
  { id: 'binance-btcb', chain: 'bitcoin', address: '3LYJfcfHPXYJreMsASk2jkn69LWEYKzexb' },
  { id: 'okx-btc', chain: 'bitcoin', address: '3MgEAFWu1HKSnZ5ZsC8qf61ZW18xrP5pgd' },
  { id: 'upbit-mr100', chain: 'bitcoin', address: '1Ay8vMC7R1UbyCCZRVULMV7iQpHSAbguJP' },
  { id: 'uk-gov', chain: 'bitcoin', address: 'bc1q7ydrtdn8z62xhslqyqtyt38mm4e2c4h3mxjkug' },
  { id: 'binance-cold-3', chain: 'bitcoin', address: '3LQUu4v9z6KNch71j7kbj8GPeAGUo1FW6a' },
  { id: 'binance-7-eth', chain: 'ethereum', address: '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8' },
  { id: 'robinhood-eth', chain: 'ethereum', address: '0x40B38765696e3d5d8d9d834D8AaD4bB6e418E489' },
  { id: 'binance-hot-20', chain: 'ethereum', address: '0xF977814e90dA44bFA03b6295A0616a897441aceC' },
  { id: 'bitfinex-2-eth', chain: 'ethereum', address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' },
  { id: 'vitalik', chain: 'ethereum', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
  { id: 'satoshi-genesis', chain: 'bitcoin', address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
  { id: 'ethereum-foundation', chain: 'ethereum', address: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe' },
]

export function whaleAsset(wallet) {
  return ASSET_BY_CHAIN[wallet?.chain] || ''
}

export function parseMempoolAddress(payload) {
  const chain = payload?.chain_stats || {}
  const mempool = payload?.mempool_stats || {}
  const funded = Number(chain.funded_txo_sum || 0) + Number(mempool.funded_txo_sum || 0)
  const spent = Number(chain.spent_txo_sum || 0) + Number(mempool.spent_txo_sum || 0)
  return {
    amount: (funded - spent) / BTC_UNIT,
    txCount: Number(chain.tx_count || 0) + Number(mempool.tx_count || 0),
  }
}

export function weiHexToEth(hex) {
  const wei = BigInt(hex)
  const whole = wei / 1000000000000000000n
  const frac = wei % 1000000000000000000n
  return Number(whole) + Number(frac) / 1e18
}

function txTimeSec(tx, fallbackSec = 0) {
  if (tx?.status?.block_time) return Number(tx.status.block_time)
  if (tx?.status && tx.status.confirmed === false) return fallbackSec
  return 0
}

export function netFlowFromMempoolTxs(address, txs, sinceSec, nowSec = Math.floor(Date.now() / 1000)) {
  const list = Array.isArray(txs) ? txs : []
  let inflow = 0
  let outflow = 0
  let txInWindow = 0
  let oldestFetched = Infinity

  for (const tx of list) {
    const time = txTimeSec(tx, nowSec)
    if (time) oldestFetched = Math.min(oldestFetched, time)
    if (!time || time < sinceSec) continue
    txInWindow += 1
    for (const output of tx.vout || []) {
      if (output.scriptpubkey_address === address) inflow += Number(output.value || 0)
    }
    for (const input of tx.vin || []) {
      if (input.prevout?.scriptpubkey_address === address) outflow += Number(input.prevout.value || 0)
    }
  }

  const coveredWindow = list.length === 0 || oldestFetched <= sinceSec
  return {
    changeNative: (inflow - outflow) / BTC_UNIT,
    inflowNative: inflow / BTC_UNIT,
    outflowNative: outflow / BTC_UNIT,
    txInWindow,
    complete: coveredWindow,
  }
}

export function dailyNetFromMempoolTxs(address, txs, days = 7, nowSec = Math.floor(Date.now() / 1000)) {
  const buckets = []
  const today = Math.floor(nowSec / 86400)
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    buckets.push({ day: today - offset, net: 0, txCount: 0 })
  }
  const index = new Map(buckets.map((bucket, i) => [bucket.day, i]))

  for (const tx of txs || []) {
    const time = txTimeSec(tx, nowSec)
    if (!time) continue
    const day = Math.floor(time / 86400)
    const slot = index.get(day)
    if (slot == null) continue
    let inflow = 0
    let outflow = 0
    for (const output of tx.vout || []) {
      if (output.scriptpubkey_address === address) inflow += Number(output.value || 0)
    }
    for (const input of tx.vin || []) {
      if (input.prevout?.scriptpubkey_address === address) outflow += Number(input.prevout.value || 0)
    }
    buckets[slot].net += (inflow - outflow) / BTC_UNIT
    buckets[slot].txCount += 1
  }

  return buckets.map((bucket) => ({
    date: new Date(bucket.day * 86400 * 1000).toISOString().slice(0, 10),
    net: bucket.net,
    txCount: bucket.txCount,
  }))
}

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CATEGORY_META,
  DATA_CAPABILITIES,
  WHALE_WALLETS,
  attachLiveSnapshot,
  dailyNetFromMempoolTxs,
  formatNative,
  formatUsd,
  isBitcoinAddress,
  isEthereumAddress,
  netFlowFromMempoolTxs,
  parseMempoolAddress,
  weiHexToEth,
} from '../../lib/whaleWallets.js'

test('catalog keeps 5–20 labeled wallets with unique addresses and sources', () => {
  assert.ok(WHALE_WALLETS.length >= 5 && WHALE_WALLETS.length <= 20)
  const ids = WHALE_WALLETS.map((wallet) => wallet.id)
  const addresses = WHALE_WALLETS.map((wallet) => wallet.address)
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(new Set(addresses).size, addresses.length)

  for (const wallet of WHALE_WALLETS) {
    assert.ok(CATEGORY_META[wallet.category], wallet.id)
    assert.ok(wallet.sources.length >= 1, wallet.id)
    assert.match(wallet.sources[0].href, /^https:\/\//)
    if (wallet.chain === 'bitcoin') assert.equal(isBitcoinAddress(wallet.address), true, wallet.id)
    if (wallet.chain === 'ethereum') assert.equal(isEthereumAddress(wallet.address), true, wallet.id)
  }
})

test('public APIs can read current balance and estimate 24h flow, not a free daily series', () => {
  const ids = DATA_CAPABILITIES.map((item) => item.id)
  assert.deepEqual(ids, ['current-balance', 'usd-value', 'change-24h', 'daily-series', 'labels'])
  assert.match(DATA_CAPABILITIES.find((item) => item.id === 'current-balance').free, /可以/)
  assert.match(DATA_CAPABILITIES.find((item) => item.id === 'daily-series').free, /没有稳定的免费批量接口/)
})

test('mempool address payload converts to BTC balance', () => {
  const parsed = parseMempoolAddress({
    chain_stats: {
      funded_txo_sum: 119037530175224,
      spent_txo_sum: 94177770926608,
      tx_count: 5583,
    },
    mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0, tx_count: 0 },
  })
  assert.equal(parsed.txCount, 5583)
  assert.ok(Math.abs(parsed.amount - 248597.59248616) < 1e-6)
})

test('24h net flow uses only transactions inside the window and flags truncated pages', () => {
  const address = 'bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2'
  const nowSec = 1_800_000_000
  const txs = [
    {
      status: { block_time: nowSec - 3600 },
      vout: [{ scriptpubkey_address: address, value: 2e8 }],
      vin: [],
    },
    {
      status: { block_time: nowSec - 2 * 24 * 3600 },
      vout: [{ scriptpubkey_address: address, value: 9e8 }],
      vin: [],
    },
    {
      status: { block_time: nowSec - 7200 },
      vout: [],
      vin: [{ prevout: { scriptpubkey_address: address, value: 0.5e8 } }],
    },
  ]

  const flow = netFlowFromMempoolTxs(address, txs, nowSec - 24 * 3600, nowSec)
  assert.equal(flow.changeNative, 1.5)
  assert.equal(flow.txInWindow, 2)
  assert.equal(flow.complete, true)

  const truncated = Array.from({ length: 25 }, () => ({
    status: { block_time: nowSec - 60 },
    vout: [{ scriptpubkey_address: address, value: 1e8 }],
    vin: [],
  }))
  const incomplete = netFlowFromMempoolTxs(address, truncated, nowSec - 24 * 3600, nowSec)
  assert.equal(incomplete.complete, false)
  assert.equal(incomplete.txInWindow, 25)
})

test('daily buckets group mempool flows by UTC day', () => {
  const address = '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo'
  const nowSec = 1_800_000_000
  const txs = [
    {
      status: { block_time: nowSec - 100 },
      vout: [{ scriptpubkey_address: address, value: 3e8 }],
      vin: [],
    },
    {
      status: { block_time: nowSec - 86400 - 100 },
      vout: [],
      vin: [{ prevout: { scriptpubkey_address: address, value: 1e8 } }],
    },
  ]
  const days = dailyNetFromMempoolTxs(address, txs, 3, nowSec)
  assert.equal(days.length, 3)
  assert.equal(days.at(-1).net, 3)
  assert.equal(days.at(-2).net, -1)
})

test('interactive page is registered as a rich-page work', async () => {
  const { ENGINEERING_WORKS } = await import('../../lib/engineeringWorks.js')
  const work = ENGINEERING_WORKS.find((item) => item.id === 'whale-wallets')
  assert.equal(work.href, '/whale-wallets')
  assert.deepEqual(work.subjects, ['business_market'])
})

test('live snapshot converts native units into USD and percent change', () => {
  const [binance] = attachLiveSnapshot(
    [WHALE_WALLETS[0]],
    { [WHALE_WALLETS[0].id]: { amount: 100, changeNative: 2, changeComplete: true, txCount: 10 } },
    { BTC: 80_000, ETH: 2_500 },
  )
  assert.equal(binance.usd, 8_000_000)
  assert.equal(binance.changeUsd, 160_000)
  assert.equal(binance.changePct, 2)
  assert.equal(formatUsd(8_000_000_000), '$8.00B')
  assert.equal(formatNative(248597.59, 'BTC', 0), '248,598 BTC')
  assert.ok(Math.abs(weiHexToEth('0xde0b6b3a7640000') - 1) < 1e-12)
})

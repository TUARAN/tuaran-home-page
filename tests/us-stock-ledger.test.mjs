import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assetTier,
  progressToward,
  reviewLedger,
  tierBounds,
} from '../lib/usStockLedger.js'

test('asset tiers follow decimal digits from A4 to A6', () => {
  assert.equal(assetTier(999.99), 'A3')
  assert.equal(assetTier(1000), 'A4')
  assert.equal(assetTier(9999.99), 'A4')
  assert.equal(assetTier(10000), 'A5')
  assert.equal(assetTier(99999.99), 'A5')
  assert.equal(assetTier(100000), 'A6')
  assert.equal(assetTier(999999.99), 'A6')
  assert.equal(assetTier(0.4), null)
  assert.equal(tierBounds('A4').floor, 1000)
  assert.equal(tierBounds('A6').floor, 100000)
})

test('the first public snapshot sits in A4 and measures the distance to A6', () => {
  const review = reviewLedger()
  assert.equal(review.books.length, 1)
  assert.equal(review.latest.tier, 'A4')
  assert.equal(review.latest.assetBase, 'gross')
  assert.equal(review.changes.length, 0)
  assert.ok(review.progress.multiple > 31 && review.progress.multiple < 32)
  assert.ok(review.progress.ratio > 0.2 && review.progress.ratio < 0.3)
  assert.equal(progressToward(100000).ratio, 1)
  assert.equal(progressToward(1000).ratio, 0)
})

test('a later snapshot is diffed against the previous book', () => {
  const [first] = reviewLedger().books
  const second = {
    id: '2026-10-09',
    asOf: '2026-10-09',
    time: '16:00',
    venueLabel: '币安',
    marginMode: '逐仓',
    assetBase: 'equity',
    equity: 12000,
    positions: [
      { ...first.snapshot.positions.find((row) => row.underlying === 'AAPL'), qty: 4 },
      { ...first.snapshot.positions.find((row) => row.underlying === 'TWLO'), side: 'long', qty: 0.2 },
    ],
  }
  const review = reviewLedger([first.snapshot, second])
  assert.equal(review.latest.tier, 'A5')
  assert.equal(review.latest.assetBase, 'equity')
  const byName = Object.fromEntries(review.changes.map((row) => [row.underlying, row]))
  assert.equal(byName.AAPL.change, 'held')
  assert.equal(byName.AAPL.previousQty, 3)
  assert.equal(byName.AAPL.nextQty, 4)
  assert.equal(byName.TWLO.change, 'flipped')
  assert.equal(byName.TSLA.change, 'closed')
  assert.equal(byName.NET.change, 'closed')
  assert.equal(byName.SPCX.change, 'closed')
})

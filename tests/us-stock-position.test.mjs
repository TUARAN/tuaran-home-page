import assert from 'node:assert/strict'
import test from 'node:test'

import { latestSnapshot } from '../lib/usStockLedger.js'
import { applyPositionWeights, positionBook } from '../lib/usStockPosition.js'

test('2026-09-26 Binance book matches the position screen', () => {
  const book = positionBook(latestSnapshot())
  const bySymbol = Object.fromEntries(book.rows.map((row) => [row.underlying, row]))

  assert.equal(book.asOf, '2026-09-26')
  assert.equal(bySymbol.TWLO.side, 'short')
  assert.equal(bySymbol.AAPL.side, 'long')
  assert.equal(bySymbol.AAPL.leverage, 5)
  assert.equal(bySymbol.NET.leverage, 3)
  assert.ok(Math.abs(book.gross - 3129.7957) < 0.001)
  assert.ok(Math.abs(book.margin - 810.77) < 0.001)
  assert.ok(Math.abs(book.pnl - (-1.7)) < 0.001)
  assert.ok(Math.abs(bySymbol.AAPL.notional / bySymbol.AAPL.margin - 5) < 0.01)
  assert.ok(bySymbol.NET.weight > bySymbol.AAPL.weight)
  assert.ok(bySymbol.AAPL.weight > bySymbol.SPCX.weight)
  assert.ok(bySymbol.TSLA.weight < 0.06)
  const absWeight = book.rows.reduce((sum, row) => sum + row.weight, 0)
  const signedWeight = book.rows.reduce((sum, row) => sum + row.signedWeight, 0)
  assert.ok(Math.abs(absWeight - 1) < 1e-9)
  assert.ok(signedWeight < 1)
  assert.ok(bySymbol.TWLO.signedWeight < 0)
})

test('position weights replace the target sleeve and keep the Twilio short', () => {
  const weighted = applyPositionWeights([
    { symbol: 'AAPL', weight: 0.3 },
    { symbol: 'TWLO', weight: 0.15 },
  ], latestSnapshot())
  assert.ok(weighted[0].weight > 0.3)
  assert.ok(weighted[1].weight < 0)
})

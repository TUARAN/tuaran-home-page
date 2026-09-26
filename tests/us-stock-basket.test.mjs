import assert from 'node:assert/strict'
import test from 'node:test'

import {
  US_STOCK_BASKET,
  buildBasketIndex,
  chartWindow,
  parseNasdaqDate,
  parseNasdaqNumber,
  parseNasdaqQuote,
  rangeReturn,
  sliceBars,
} from '../lib/usStockBasket.js'

test('five US stock weights add up to the full notional book', () => {
  assert.deepEqual(US_STOCK_BASKET.map((item) => item.symbol), ['AAPL', 'SPCX', 'TSLA', 'NET', 'TWLO'])
  const total = US_STOCK_BASKET.reduce((sum, item) => sum + item.weight, 0)
  assert.equal(Math.round(total * 100), 100)
})

test('Nasdaq quote text parses into daily candles', () => {
  assert.equal(parseNasdaqNumber('$341.07'), 341.07)
  assert.equal(parseNasdaqNumber('+1.53%'), 1.53)
  assert.equal(parseNasdaqNumber('-7.96%'), -7.96)
  assert.equal(parseNasdaqNumber('30,002,510'), 30002510)
  assert.equal(parseNasdaqDate('9/1/2026'), '2026-09-01')

  const quote = parseNasdaqQuote('AAPL', {
    data: {
      symbol: 'AAPL',
      timeAsOf: 'Sep 25, 2026',
      lastSalePrice: '$341.07',
      netChange: '+5.15',
      percentageChange: '+1.53%',
      previousClose: '$335.92',
      chart: [
        { y: 325.13, z: { dateTime: '9/2/2026', open: '326.865', high: '328.4', low: '323.53', close: '324.96', volume: '33,776,370' } },
        { y: 325.13, z: { dateTime: '9/1/2026', open: '316.98', high: '327.3', low: '314.73', close: '325.13', volume: '53,167,390' } },
        { y: 325.13, z: { dateTime: '9/1/2026', open: '316.98', high: '327.3', low: '314.73', close: '325.13', volume: '53,167,390' } },
      ],
    },
  })

  assert.equal(quote.name, '苹果')
  assert.equal(quote.weight, 0.3)
  assert.equal(quote.price, 341.07)
  assert.equal(quote.changePercent, 1.53)
  assert.deepEqual(quote.bars.map((bar) => bar.time), ['2026-09-01', '2026-09-02'])
  assert.equal(quote.bars[0].volume, 53167390)
  assert.equal(quote.error, null)
})

test('basket index rebases to 100 and joins a name only after it has a prior close', () => {
  const index = buildBasketIndex([
    {
      symbol: 'AAPL',
      weight: 0.3,
      bars: [
        { time: '2026-09-01', close: 100 },
        { time: '2026-09-02', close: 110 },
        { time: '2026-09-03', close: 110 },
      ],
    },
    {
      symbol: 'SPCX',
      weight: 0.7,
      bars: [
        { time: '2026-09-02', close: 50 },
        { time: '2026-09-03', close: 55 },
      ],
    },
  ])

  assert.equal(index[0].value, 100)
  assert.equal(index[1].value, 103)
  assert.equal(index[2].value, 110.21)
})

test('range slices follow the last close and the visible window return', () => {
  const bars = [
    { time: '2025-12-31', open: 80, close: 90 },
    { time: '2026-01-02', open: 100, close: 110 },
    { time: '2026-09-25', open: 120, close: 130 },
  ]
  assert.deepEqual(sliceBars(bars, '5d').map((bar) => bar.time), bars.map((bar) => bar.time))
  assert.deepEqual(sliceBars(bars, 'ytd').map((bar) => bar.time), ['2026-01-02', '2026-09-25'])
  assert.equal(rangeReturn(sliceBars(bars, 'ytd')), 0.3)
  assert.deepEqual(chartWindow(new Date('2026-09-26T00:00:00Z')), {
    from: '2025-09-21',
    to: '2026-09-26',
  })
})

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  detectTrafficSpike,
  equalComparisonWindow,
  normalizeUmamiStats,
  normalizeDailyUniqueIps,
  shanghaiSeriesDate,
  summarizeCloudflareGroups,
} from '../../lib/analyticsSources.mjs'

test('daily visitor labels respect Shanghai midnight for offset-bearing API timestamps', () => {
  assert.equal(shanghaiSeriesDate('2026-09-03T16:00:00Z'), '2026-09-04')
  assert.equal(shanghaiSeriesDate('2026-09-04T00:00:00+08:00'), '2026-09-04')
  assert.equal(shanghaiSeriesDate('2026-09-04'), '2026-09-04')
  assert.equal(shanghaiSeriesDate('2026-09-04 00:00:00'), '2026-09-04')
})

test('daily unique IPs preserve missing values and never become a summed period UV', () => {
  const result = normalizeDailyUniqueIps([
    { dimensions: { date: '2026-09-04' }, uniq: { uniques: 12 } },
    { dimensions: { date: '2026-09-02' }, uniq: { uniques: 0 } },
    { dimensions: { date: '2026-09-03' }, uniq: {} },
  ])
  assert.deepEqual(result, [
    { date: '2026-09-02', uniqueIps: 0 },
    { date: '2026-09-03', uniqueIps: null },
    { date: '2026-09-04', uniqueIps: 12 },
  ])
})

test('comparison windows use the same elapsed duration', () => {
  const now = Date.UTC(2026, 8, 1, 4, 0, 0)
  const window = equalComparisonWindow(7, now)

  assert.equal(window.currentEnd - window.currentStart, window.previousEnd - window.previousStart)
  assert.equal(window.currentStart, Date.UTC(2026, 7, 25, 16, 0, 0))
  assert.equal(window.previousEnd, window.currentStart)
})

test('Cloudflare daily groups reconcile requests, visits and bytes', () => {
  const summary = summarizeCloudflareGroups([
    { count: 100, sum: { visits: 20, edgeResponseBytes: 1000 }, dimensions: { date: '2026-08-31' } },
    { count: 250, sum: { visits: 35, edgeResponseBytes: 4000 }, dimensions: { date: '2026-09-01' } },
  ])

  assert.deepEqual(summary, {
    requests: 350,
    visits: 55,
    bytes: 5000,
    series: [
      { date: '2026-08-31', requests: 100, visits: 20, bytes: 1000 },
      { date: '2026-09-01', requests: 250, visits: 35, bytes: 4000 },
    ],
  })
})

test('Umami stats expose calculated rates without changing source counts', () => {
  assert.deepEqual(normalizeUmamiStats({
    pageviews: 220,
    visitors: 93,
    visits: 133,
    bounces: 9,
    totaltime: 11704,
  }), {
    views: 220,
    visitors: 93,
    visits: 133,
    bounces: 9,
    totalTimeSeconds: 11704,
    bounceRate: 9 / 133,
    averageVisitSeconds: 11704 / 133,
  })
})

test('traffic spike detection needs both a meaningful base and a large multiple', () => {
  assert.deepEqual(
    detectTrafficSpike([
      { date: '2026-08-26', requests: 5000 },
      { date: '2026-08-27', requests: 4500 },
      { date: '2026-08-28', requests: 5200 },
      { date: '2026-08-29', requests: 320000 },
    ]),
    { date: '2026-08-29', requests: 320000, baseline: 5000, multiple: 64 },
  )
  assert.equal(detectTrafficSpike([{ date: '2026-08-29', requests: 30 }]), null)
})

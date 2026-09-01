import assert from 'node:assert/strict'
import test from 'node:test'

import {
  detectTrafficSpike,
  equalComparisonWindow,
  normalizeUmamiStats,
  summarizeCloudflareGroups,
} from '../../lib/analyticsSources.mjs'

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

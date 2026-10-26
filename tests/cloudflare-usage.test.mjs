import assert from 'node:assert/strict'
import test from 'node:test'

import { collectCloudflareUsage, normalizeUsageData, readUsageHistory, usageObjectKey, utcDate, writeUsageDay } from '../lib/site/cloudflareUsage.js'

test('daily report keeps Workers invocations separate from zone path traffic', async () => {
  const report = normalizeUsageData({ viewer: {
    accounts: [{
      workersOverviewRequestsAdaptiveGroups: [
        { count: 80, dimensions: { scriptName: 'pages-public' } },
        { count: 20, dimensions: { scriptName: 'pages-admin' } },
      ],
      d1AnalyticsAdaptiveGroups: [{ dimensions: { databaseId: 'db-1' }, sum: { readQueries: 55, writeQueries: 3, rowsRead: 5000, rowsWritten: 8 } }],
    }],
    zones: [{ httpRequestsAdaptiveGroups: [
      { count: 200, dimensions: { clientRequestPath: '/api/community-actions/report', edgeResponseStatus: 200 } },
      { count: 100, dimensions: { clientRequestPath: '/api/community-actions/report', edgeResponseStatus: 405 } },
    ] }],
  } }, { date: '2026-10-26', databaseId: 'db-1', collectedAt: 123 })
  assert.equal(report.workers.total, 100)
  assert.equal(report.topPaths[0].requests, 300)
  assert.equal(report.topPaths[0].statuses['405'], 100)
  assert.equal(report.d1.rowsRead, 5000)
  assert.equal(report.collectedAt, 123)
})

test('collector queries a UTC calendar day with account and zone scope', async () => {
  let body
  const report = await collectCloudflareUsage({ CLOUDFLARE_ANALYTICS_TOKEN: 'test-token', CLOUDFLARE_ZONE_ID: 'zone' }, '2026-10-26', async (_, options) => {
    body = JSON.parse(options.body)
    return { ok: true, json: async () => ({ data: { viewer: { accounts: [{ workersOverviewRequestsAdaptiveGroups: [], d1AnalyticsAdaptiveGroups: [] }], zones: [{ httpRequestsAdaptiveGroups: [] }] } } }) }
  })
  assert.equal(body.variables.start, '2026-10-26T00:00:00Z')
  assert.equal(body.variables.end, '2026-10-27T00:00:00.000Z')
  assert.equal(body.variables.zoneTag, 'zone')
  assert.equal(report.workers.total, 0)
  assert.equal(utcDate(Date.parse('2026-10-26T23:59:59Z')), '2026-10-26')
})

test('daily snapshot persists without D1 and history is newest first', async () => {
  const objects = new Map()
  const bucket = {
    async get(key) { return objects.has(key) ? { json: async () => objects.get(key) } : null },
    async put(key, value) { objects.set(key, JSON.parse(value)) },
  }
  await writeUsageDay(bucket, { date: '2026-10-25', workers: { total: 5 } })
  await writeUsageDay(bucket, { date: '2026-10-26', workers: { total: 6 } })
  assert.deepEqual((await readUsageHistory(bucket, Date.parse('2026-10-26T12:00:00Z'), 2)).map((row) => row.date), ['2026-10-26', '2026-10-25'])
  assert.throws(() => usageObjectKey('../bad'), /INVALID_USAGE_DATE/)
})

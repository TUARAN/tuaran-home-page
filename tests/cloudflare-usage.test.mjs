import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildCloudflareUsageAlertExcerpt,
  cloudflareUsageAlertKey,
  collectCloudflareUsage,
  evaluateUsageAlerts,
  normalizeUsageData,
  readUsageHistory,
  usageAlertPressureDays,
  usageObjectKey,
  utcDate,
  writeUsageDay,
  WORKERS_FREE_DAILY_REQUESTS,
  D1_FREE_DAILY_ROWS_READ,
  D1_FREE_DAILY_ROWS_WRITTEN,
} from '../lib/site/cloudflareUsage.js'
import { notificationDestinationLabel, notificationHref, notificationTitle } from '../lib/site/siteNotificationsDisplay.js'

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
  assert.equal(body.variables.accountTag, '4c0eea1ce5d93ebf856f6d5ee1d58bfb')
  assert.equal(utcDate(Date.parse('2026-10-26T23:59:59Z')), '2026-10-26')
})

function jsonResponse(payload, { ok = true, status = ok ? 200 : 403 } = {}) {
  return { ok, status, text: async () => JSON.stringify(payload) }
}

const emptyUsage = { data: { viewer: { accounts: [{ workersOverviewRequestsAdaptiveGroups: [], d1AnalyticsAdaptiveGroups: [] }], zones: [{ httpRequestsAdaptiveGroups: [] }] } } }

test('html error pages stay http errors instead of json parse failures', async () => {
  await assert.rejects(
    collectCloudflareUsage({ CLOUDFLARE_ANALYTICS_TOKEN: 'test-token', CLOUDFLARE_ZONE_ID: 'zone' }, '2026-10-26', async () => ({
      ok: false, status: 403, text: async () => '<!DOCTYPE html><html><title>Error</title>',
    })),
    /CLOUDFLARE_USAGE_HTTP_403/,
  )
})

test('graphql authorization errors are read from a non-200 json body', async () => {
  await assert.rejects(
    collectCloudflareUsage({ CLOUDFLARE_ANALYTICS_TOKEN: 'test-token', CLOUDFLARE_ZONE_ID: 'zone' }, '2026-10-26', async (url) => {
      if (String(url).includes('/graphql')) return jsonResponse({ errors: [{ message: 'not authorized for that account' }] }, { ok: false, status: 403 })
      return jsonResponse({ success: false, errors: [{ message: 'no access' }] }, { ok: false, status: 403 })
    }),
    /CLOUDFLARE_USAGE_GRAPHQL:not authorized for that account/,
  )
})

test('account authorization failure retries with the zone account id', async () => {
  const accounts = []
  const report = await collectCloudflareUsage({ CLOUDFLARE_ANALYTICS_TOKEN: 'test-token', CLOUDFLARE_ZONE_ID: 'zone-1' }, '2026-10-26', async (url, options) => {
    const target = String(url)
    if (target.endsWith('/graphql')) {
      const accountTag = JSON.parse(options.body).variables.accountTag
      accounts.push(accountTag)
      if (accountTag === 'acct-real') return jsonResponse(emptyUsage)
      return jsonResponse({ data: null, errors: [{ message: 'not authorized for that account' }] })
    }
    if (target.endsWith('/zones/zone-1')) return jsonResponse({ success: true, result: { account: { id: 'acct-real' } } })
    throw new Error(`unexpected ${target}`)
  })
  assert.deepEqual(accounts, ['4c0eea1ce5d93ebf856f6d5ee1d58bfb', 'acct-real'])
  assert.equal(report.date, '2026-10-26')
  assert.equal(report.workers.total, 0)
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

test('usage alerts escalate at 80%, 95% and 100% with stable keys', () => {
  const report = {
    date: '2026-10-28',
    workers: { total: Math.round(WORKERS_FREE_DAILY_REQUESTS * 0.81) },
    d1: { rowsRead: Math.round(D1_FREE_DAILY_ROWS_READ * 0.96), rowsWritten: D1_FREE_DAILY_ROWS_WRITTEN },
    limits: {
      workersRequests: WORKERS_FREE_DAILY_REQUESTS,
      d1RowsRead: D1_FREE_DAILY_ROWS_READ,
      d1RowsWritten: D1_FREE_DAILY_ROWS_WRITTEN,
    },
    topPaths: [{ path: '/api/community-actions/report' }],
  }
  const alerts = evaluateUsageAlerts(report)
  assert.deepEqual(alerts.map((row) => `${row.metric}:${row.level}`), [
    'workers:warn',
    'd1-read:warn',
    'd1-read:critical',
    'd1-write:warn',
    'd1-write:critical',
    'd1-write:exhausted',
  ])
  assert.equal(cloudflareUsageAlertKey('2026-10-28', 'd1-read', 'critical'), 'cloudflare-usage:2026-10-28:d1-read:critical')
  assert.match(buildCloudflareUsageAlertExcerpt(alerts[1]), /D1 读取行数/)
  assert.deepEqual(usageAlertPressureDays([report, { date: '2026-10-27', workers: { total: 1 }, d1: { rowsRead: 1, rowsWritten: 1 }, limits: report.limits }]), ['2026-10-28'])
})

test('usage alert notifications open the usage monitor', () => {
  const key = 'cloudflare-usage:2026-10-28:d1-read:warn'
  assert.equal(notificationHref({ type: 'automation_monitor', articleKey: key }), '/admin/site-health?tab=usage')
  assert.equal(notificationDestinationLabel('automation_monitor', 'Cloudflare', key), '查看用量监控')
  assert.equal(notificationTitle('automation_monitor', 'Cloudflare 用量 · D1 读取行数 达 80%', key), 'Cloudflare 用量 · D1 读取行数 达 80%')
})

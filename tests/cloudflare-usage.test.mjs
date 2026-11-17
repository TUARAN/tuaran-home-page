import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildCloudflareUsageAlertExcerpt,
  cloudflareUsageAlertKey,
  collectCloudflareUsage,
  evaluateUsageAlerts,
  normalizeUsageData,
  usageCollectFailureStatus,
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

test('invocations fallback rows use sum.requests and stay separate from path traffic', () => {
  const report = normalizeUsageData({ viewer: {
    accounts: [{
      workersInvocationsAdaptive: [
        { sum: { requests: 80 }, dimensions: { scriptName: 'pages-public' } },
        { sum: { requests: 20 }, dimensions: { scriptName: 'pages-admin' } },
      ],
      d1AnalyticsAdaptiveGroups: [],
    }],
    zones: [{ httpRequestsAdaptiveGroups: [
      { count: 300, dimensions: { clientRequestPath: '/api/community-actions/report', edgeResponseStatus: 200 } },
    ] }],
  } }, { date: '2026-10-26', databaseId: 'db-1', collectedAt: 123 })
  assert.equal(report.workers.total, 100)
  assert.equal(report.topPaths[0].requests, 300)
})

function queryName(body) {
  if (/workersOverviewRequestsAdaptiveGroups/.test(body.query)) return 'workers-overview'
  if (/workersInvocationsAdaptive/.test(body.query)) return 'workers-invocations'
  if (/d1AnalyticsAdaptiveGroups/.test(body.query)) return 'd1'
  if (/httpRequestsAdaptiveGroups/.test(body.query)) return 'http'
  return 'unknown'
}

test('collector splits GraphQL by dataset for a UTC calendar day', async () => {
  const bodies = []
  const report = await collectCloudflareUsage({ CLOUDFLARE_ANALYTICS_TOKEN: 'test-token', CLOUDFLARE_ZONE_ID: 'zone' }, '2026-10-26', async (_, options) => {
    bodies.push(JSON.parse(options.body))
    return { ok: true, json: async () => ({ data: { viewer: { accounts: [{ workersOverviewRequestsAdaptiveGroups: [], d1AnalyticsAdaptiveGroups: [] }], zones: [{ httpRequestsAdaptiveGroups: [] }] } } }) }
  })
  assert.deepEqual(bodies.map(queryName).sort(), ['d1', 'http', 'workers-overview'])
  assert.equal(bodies.some((body) => queryName(body) === 'workers-invocations'), false)
  for (const body of bodies) {
    if (body.variables.start) {
      assert.equal(body.variables.start, '2026-10-26T00:00:00Z')
      assert.equal(body.variables.end, '2026-10-27T00:00:00.000Z')
    }
    if (body.variables.date) assert.equal(body.variables.date, '2026-10-26')
    if (body.variables.zoneTag) assert.equal(body.variables.zoneTag, 'zone')
    if (body.variables.accountTag) assert.equal(body.variables.accountTag, '4c0eea1ce5d93ebf856f6d5ee1d58bfb')
  }
  assert.equal(report.workers.total, 0)
  assert.equal(report.workersSource, 'workersOverviewRequestsAdaptiveGroups')
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
      if (accountTag) accounts.push(accountTag)
      if (!accountTag || accountTag === 'acct-real') return jsonResponse(emptyUsage)
      return jsonResponse({ data: null, errors: [{ message: 'not authorized for that account' }] })
    }
    if (target.endsWith('/zones/zone-1')) return jsonResponse({ success: true, result: { account: { id: 'acct-real' } } })
    throw new Error(`unexpected ${target}`)
  })
  assert.deepEqual(accounts, ['4c0eea1ce5d93ebf856f6d5ee1d58bfb', 'acct-real', 'acct-real'])
  assert.equal(report.date, '2026-10-26')
  assert.equal(report.workers.total, 0)
  assert.equal(report.workersSource, 'workersOverviewRequestsAdaptiveGroups')
})

test('overview workers query falls back to aggregated invocations by script', async () => {
  const names = []
  const report = await collectCloudflareUsage({ CLOUDFLARE_ANALYTICS_TOKEN: 'test-token', CLOUDFLARE_ZONE_ID: 'zone' }, '2026-10-26', async (_, options) => {
    const body = JSON.parse(options.body)
    const name = queryName(body)
    names.push(name)
    if (name === 'workers-overview') {
      return jsonResponse({ errors: [{ message: 'workersOverviewRequestsAdaptiveGroups is not available for this account' }] }, { ok: false, status: 400 })
    }
    if (name === 'workers-invocations') {
      assert.match(body.query, /sum \{ requests \}/)
      assert.doesNotMatch(body.query, /dimensions \{[^}]*datetime/)
      return jsonResponse({
        data: {
          viewer: {
            accounts: [{
              workersInvocationsAdaptive: [
                { sum: { requests: 80 }, dimensions: { scriptName: 'pages-public' } },
                { sum: { requests: 20 }, dimensions: { scriptName: 'pages-admin' } },
              ],
            }],
          },
        },
      })
    }
    return jsonResponse(emptyUsage)
  })
  assert.equal(names.includes('workers-overview'), true)
  assert.equal(names.includes('workers-invocations'), true)
  assert.equal(report.workers.total, 100)
  assert.deepEqual(report.workers.scripts.map((row) => row.name), ['pages-public', 'pages-admin'])
  assert.equal(report.workersSource, 'workersInvocationsAdaptive')
})

test('collect fails when both workers datasets are unavailable', async () => {
  await assert.rejects(
    collectCloudflareUsage({ CLOUDFLARE_ANALYTICS_TOKEN: 'test-token', CLOUDFLARE_ZONE_ID: 'zone' }, '2026-10-26', async (_, options) => {
      const name = queryName(JSON.parse(options.body))
      if (name === 'workers-overview' || name === 'workers-invocations') {
        return jsonResponse({ errors: [{ message: `${name} unavailable` }] }, { ok: false, status: 400 })
      }
      return jsonResponse(emptyUsage)
    }),
    /CLOUDFLARE_USAGE_WORKERS_UNAVAILABLE/,
  )
})

test('a failed d1 query fails the whole collect instead of writing a partial report', async () => {
  const names = []
  await assert.rejects(
    collectCloudflareUsage({ CLOUDFLARE_ANALYTICS_TOKEN: 'test-token', CLOUDFLARE_ZONE_ID: 'zone' }, '2026-10-26', async (_, options) => {
      const name = queryName(JSON.parse(options.body))
      names.push(name)
      if (name === 'd1') return jsonResponse({ errors: [{ message: 'd1 analytics unauthorized' }] }, { ok: false, status: 403 })
      return jsonResponse(emptyUsage)
    }),
    /CLOUDFLARE_USAGE_GRAPHQL:d1 analytics unauthorized/,
  )
  assert.equal(names.includes('workers-overview'), true)
  assert.equal(names.includes('d1'), true)
})

test('collect failure status maps config errors to 503 and business errors to 500', () => {
  assert.equal(usageCollectFailureStatus(new Error('CLOUDFLARE_USAGE_CONFIG_MISSING:CLOUDFLARE_ANALYTICS_TOKEN')), 503)
  assert.equal(usageCollectFailureStatus(new Error('CLOUDFLARE_USAGE_STORAGE_UNAVAILABLE')), 503)
  assert.equal(usageCollectFailureStatus(new Error('CONTENT_FEED_NOT_CONFIGURED')), 503)
  assert.equal(usageCollectFailureStatus(new Error('MONITOR_SECRET_NOT_CONFIGURED')), 503)
  assert.equal(usageCollectFailureStatus(new Error('CLOUDFLARE_USAGE_GRAPHQL:not authorized for that account')), 500)
  assert.equal(usageCollectFailureStatus(new Error('CLOUDFLARE_USAGE_WORKERS_UNAVAILABLE:overview failed')), 500)
  assert.equal(usageCollectFailureStatus(new Error('CLOUDFLARE_USAGE_HTTP_403')), 500)
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

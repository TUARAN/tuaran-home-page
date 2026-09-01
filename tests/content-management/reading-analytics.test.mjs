import assert from 'node:assert/strict'
import test from 'node:test'

import { readingVisitorName } from '../../lib/readingVisitorIdentity.mjs'
import { readFile } from 'node:fs/promises'

const beaconSource = await readFile(
  new URL('../../app/(site)/components/ContentPvBeacon.jsx', import.meta.url),
  'utf8',
)
const analyticsDashboardSource = await readFile(
  new URL('../../app/(admin)/admin/content-weekly/ContentWeeklyClient.jsx', import.meta.url),
  'utf8',
)
const analyticsRouteSource = await readFile(
  new URL('../../app/api/admin/analytics-sources/route.js', import.meta.url),
  'utf8',
)

test('anonymous readers receive a privacy-safe marker from their visitor hash', () => {
  assert.equal(readingVisitorName({
    visitorType: 'anonymous',
    visitorKey: 'A1B2C3D4E5F6',
    userName: '匿名访客',
  }), '匿名访客 · a1b2c3')
})

test('named guest and account identities keep their recorded display name', () => {
  assert.equal(readingVisitorName({
    visitorType: 'guest',
    visitorKey: 'guest-id',
    userName: '🦫 机智的水豚 123456',
  }), '🦫 机智的水豚 123456')

  assert.equal(readingVisitorName({
    visitorType: 'user',
    visitorKey: 'github:123',
    userName: 'TUARAN',
  }), 'TUARAN')
})

test('content reads wait for a visible engagement signal before writing', () => {
  assert.match(beaconSource, /MIN_QUALIFIED_READING_MS/)
  assert.match(beaconSource, /document\.visibilityState !== 'visible'/)
  assert.match(beaconSource, /signal: 'content_read_v2'/)
  assert.doesNotMatch(beaconSource, /挂载时给 \/api\/research-pv 记一次访问/)
})

test('admin analytics centralizes source roles and live integrations', () => {
  assert.match(analyticsDashboardSource, /title="统一统计总览"/)
  assert.match(analyticsDashboardSource, /主口径 · 站点访问/)
  assert.match(analyticsDashboardSource, /主口径 · 内容消费/)
  assert.match(analyticsDashboardSource, /诊断口径 · 边缘流量/)
  assert.match(analyticsDashboardSource, /指标字典与差异说明/)
  assert.match(analyticsRouteSource, /UMAMI_API_KEY/)
  assert.match(analyticsRouteSource, /CLOUDFLARE_ANALYTICS_TOKEN/)
  assert.match(analyticsRouteSource, /requestSource: 'eyeball'/)
})

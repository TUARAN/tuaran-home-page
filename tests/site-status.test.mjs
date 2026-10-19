import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applySiteHealthProbe,
  createManualSiteStatus,
  operationalSiteStatus,
  publicSiteStatus,
} from '../lib/site/siteStatusCore.js'
import { checkSiteHealth } from '../lib/site/siteHealth.js'

test('public status only becomes active for a real incident', () => {
  assert.equal(publicSiteStatus(operationalSiteStatus(100), 100).active, false)
  assert.equal(publicSiteStatus({ status: 'maintenance', message: '计划维护' }, 100).active, true)
})

test('three consecutive failures open an automatic incident', () => {
  let current = operationalSiteStatus(100)
  let monitor = null
  for (const now of [200, 300, 400]) {
    const result = applySiteHealthProbe({ current, monitor, healthy: false, now })
    current = result.status
    monitor = result.monitor
  }
  assert.equal(current.status, 'degraded')
  assert.equal(current.source, 'automatic')
  assert.equal(monitor.consecutiveFailures, 3)
})

test('automatic incident uses visitor-facing copy without exposing internal failures', () => {
  const startedAt = Date.parse('2026-10-19T01:00:00Z')
  const incident = {
    status: 'degraded',
    source: 'automatic',
    message: '数据库服务异常，登录、评论等功能可能暂时不可用。',
    detail: '系统已自动检测到连续异常，恢复后公告会自动解除。',
    startedAt,
  }
  const initial = publicSiteStatus(incident, startedAt + 60_000)
  const beforeDeadline = publicSiteStatus(incident, startedAt + 2 * 60 * 60_000 - 1)
  const renewed = publicSiteStatus(incident, startedAt + 2 * 60 * 60_000)
  const renewedAgain = publicSiteStatus(incident, startedAt + 4 * 60 * 60_000)

  assert.equal(initial.message, '系统正在扩容升级，部分功能可能暂时不可用。')
  assert.equal(initial.detail, '如遇登录或互动失败，请稍后重试。')
  assert.deepEqual(initial.affectedServices, ['登录', '评论与互动'])
  for (const status of [beforeDeadline, renewed, renewedAgain]) {
    assert.equal(status.message, initial.message)
    assert.equal(status.detail, initial.detail)
    assert.deepEqual(status.affectedServices, initial.affectedServices)
    assert.doesNotMatch(`${status.message}${status.detail}${status.affectedServices.join('')}`, /数据库|预计修复/)
  }
})

test('three consecutive successes resolve an automatic incident', () => {
  let current = { status: 'degraded', source: 'automatic', startedAt: 100, updatedAt: 100 }
  let monitor = { consecutiveFailures: 3, consecutiveSuccesses: 0 }
  for (const now of [200, 300, 400]) {
    const result = applySiteHealthProbe({ current, monitor, healthy: true, now })
    current = result.status
    monitor = result.monitor
  }
  assert.equal(current.status, 'operational')
  assert.equal(monitor.consecutiveSuccesses, 3)
})

test('automatic checks never overwrite an active manual announcement', () => {
  const manual = createManualSiteStatus(
    { status: 'maintenance', message: '今晚维护', affectedServices: ['登录'] },
    operationalSiteStatus(100),
    200,
  )
  const result = applySiteHealthProbe({ current: manual, monitor: null, healthy: true, now: 300 })
  assert.equal(result.status.status, 'maintenance')
  assert.equal(result.status.message, '今晚维护')
  assert.equal(result.status.source, 'manual')
})

test('manual status fields are bounded before publication', () => {
  const result = createManualSiteStatus(
    {
      status: 'outage',
      message: 'x'.repeat(300),
      detail: 'y'.repeat(800),
      affectedServices: Array.from({ length: 20 }, (_, index) => `服务-${index}`),
    },
    null,
    100,
  )
  assert.equal(result.message.length, 160)
  assert.equal(result.detail.length, 500)
  assert.equal(result.affectedServices.length, 8)
})

function healthEnv(tableCount) {
  return {
    CONTENT_FEED: {},
    DB: {
      prepare() {
        return { first: async () => ({ value: tableCount }) }
      },
    },
  }
}

test('health check accepts a connected populated D1 and rejects an empty binding', async () => {
  const healthy = await checkSiteHealth(healthEnv(80), 100)
  const empty = await checkSiteHealth(healthEnv(0), 100)
  assert.equal(healthy.healthy, true)
  assert.equal(healthy.components.database.tableCount, 80)
  assert.equal(empty.healthy, false)
  assert.equal(empty.components.database.status, 'error')
})

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applySiteHealthProbe,
  createManualSiteStatus,
  operationalSiteStatus,
  publicSiteStatus,
} from '../lib/siteStatusCore.js'
import { checkSiteHealth } from '../lib/siteHealth.js'

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

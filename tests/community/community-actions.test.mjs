import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

import {
  COMMUNITY_ACTION_SECRET_HEADER,
  COMMUNITY_ACTION_TASKS,
  communityActionAuthorized,
  normalizeCommunityActionReport,
  presentCommunityActionCenter,
  recordCommunityActionReport,
  shanghaiDayStart,
} from '../../lib/community/communityActions.js'

const require = createRequire(import.meta.url)
const xReceipt = require('../../tools/x-reply-clipboard-extension/receipt.js')
const xhsReceipt = require('../../tools/xhs-interaction-extension/receipt.js')

const NOW = Date.parse('2026-10-12T02:00:00.000Z')

test('report validation keeps confirmed task results and drops unknown items', () => {
  const report = normalizeCommunityActionReport({
    deviceId: 'device-x-001',
    platform: 'x',
    extensionVersion: '3.6.40',
    accountHandle: '@Tuaran',
    events: [
      { id: 'event-success-1', task: 'timeline-reply', result: 'success', targetId: '123', accountHandle: '@Tuaran', errorCode: '', occurredAt: NOW },
      { id: 'event-bad-task', task: 'unknown', result: 'success', occurredAt: NOW },
      { id: 'short', task: 'tweet-post', result: 'success', occurredAt: NOW },
      { id: 'event-limited-1', task: 'timeline-reply', result: 'limited', errorCode: 'Risk Blocked', occurredAt: NOW - 1000 },
    ],
  }, NOW)

  assert.equal(report.ok, true)
  assert.equal(report.accountHandle, 'Tuaran')
  assert.deepEqual(report.events.map((event) => event.id), ['event-success-1', 'event-limited-1'])
  assert.equal(report.events[1].errorCode, '')
  assert.equal(normalizeCommunityActionReport({ deviceId: 'short', platform: 'x' }, NOW).ok, false)
})

test('authorization requires the stored report secret', () => {
  assert.deepEqual(communityActionAuthorized('', ''), { ok: false, status: 503, error: 'SECRET_NOT_CONFIGURED' })
  assert.deepEqual(communityActionAuthorized('nope', 'secret-value'), { ok: false, status: 401, error: 'UNAUTHORIZED' })
  assert.deepEqual(communityActionAuthorized('secret-value', 'secret-value'), { ok: true })
  assert.equal(COMMUNITY_ACTION_SECRET_HEADER, 'x-community-action-secret')
})

test('center summary counts today by task and marks a fresh device online', () => {
  const summary = presentCommunityActionCenter({
    now: NOW,
    devices: [
      { id: 'device-x-001', platform: 'x', extension_version: '3.6.40', account_handle: 'Tuaran', last_seen_at: NOW - 60 * 1000, created_at: NOW },
      { id: 'device-xhs-1', platform: 'xhs', extension_version: '0.2.3', account_handle: '', last_seen_at: NOW - 10 * 60 * 1000, created_at: NOW },
    ],
    counts: [
      { platform: 'x', task: 'timeline-reply', result: 'success', count: 2 },
      { platform: 'xhs', task: 'note-post', result: 'limited', count: 1 },
    ],
    recent: [
      { id: 'event-success-1', device_id: 'device-x-001', platform: 'x', task: 'timeline-reply', result: 'success', target_id: '123', account_handle: 'Tuaran', error_code: '', extension_version: '3.6.40', occurred_at: NOW },
    ],
  })

  assert.equal(summary.todaySuccess, 2)
  assert.equal(summary.tasks.find((task) => task.task === 'timeline-reply').success, 2)
  assert.equal(summary.tasks.find((task) => task.task === 'note-post').limited, 1)
  assert.equal(summary.tasks.length, COMMUNITY_ACTION_TASKS.length)
  assert.deepEqual(summary.devices.map((device) => device.online), [true, false])
  assert.equal(summary.recent[0].taskLabel, '时间线回复')
  assert.equal(shanghaiDayStart(NOW), Date.parse('2026-10-12T00:00:00+08:00'))
})

test('recording upserts the device and ignores a duplicate event id', async () => {
  const calls = []
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              calls.push({ sql, args })
              const duplicate = sql.includes('INSERT OR IGNORE') && calls.filter((call) => call.args[0] === args[0]).length > 1
              return { meta: { changes: duplicate ? 0 : 1 } }
            },
          }
        },
      }
    },
  }
  const body = {
    deviceId: 'device-x-001',
    platform: 'x',
    extensionVersion: '3.6.40',
    accountHandle: 'Tuaran',
    events: [{ id: 'event-success-1', task: 'tweet-post', result: 'success', targetId: 'src-1', occurredAt: NOW }],
  }

  const first = await recordCommunityActionReport(db, body, NOW)
  const second = await recordCommunityActionReport(db, body, NOW)
  assert.equal(first.accepted, 1)
  assert.equal(second.accepted, 0)
  assert.match(calls[0].sql, /community_action_devices/)
  assert.equal(calls[0].args[1], 'x')
  assert.match(calls[1].sql, /INSERT OR IGNORE/)
  assert.equal(calls[1].args[3], 'tweet-post')
})

test('extension receipt posts a normalized event and keeps the queue when the secret is missing', async () => {
  const store = {}
  const requests = []
  globalThis.chrome = {
    storage: {
      local: {
        async get(key) { return { [key]: store[key] } },
        async set(payload) { Object.assign(store, payload) },
      },
    },
    runtime: {
      getManifest() { return { version: '3.6.40' } },
    },
  }
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options })
    return { ok: true }
  }

  try {
    const skipped = await xReceipt.accept({ task: 'timeline-reply', result: 'success', targetId: '99', accountHandle: '@Tuaran' })
    assert.equal(skipped.skipped, true)
    assert.equal(requests.length, 0)
    assert.equal(store.xrcCommunityReport.queue.length, 1)

    await xReceipt.saveSecret('secret-value')
    assert.equal(requests.length, 1)
    assert.equal(requests[0].url, xReceipt.REPORT_URL)
    assert.equal(requests[0].options.headers['x-community-action-secret'], 'secret-value')
    const body = JSON.parse(requests[0].options.body)
    assert.equal(body.platform, 'x')
    assert.equal(body.events[0].task, 'timeline-reply')
    assert.equal(body.events[0].accountHandle, 'Tuaran')
    assert.deepEqual(store.xrcCommunityReport.queue, [])

    assert.equal(xhsReceipt.normalizeEvent({ task: 'note-post', result: 'success', targetId: 'qbitai:title' }).task, 'note-post')
    assert.equal(xhsReceipt.normalizeEvent({ task: 'timeline-reply', result: 'success' }), null)
  } finally {
    delete globalThis.chrome
    delete globalThis.fetch
  }
})

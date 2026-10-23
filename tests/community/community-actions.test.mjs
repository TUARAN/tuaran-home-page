import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

import {
  COMMUNITY_ACTION_SECRET_HEADER,
  COMMUNITY_ACTION_TASKS,
  communityActionAuthorized,
  normalizeCommunityActionReport,
  normalizeXDailyReport,
  presentCommunityActionCenter,
  recordCommunityActionReport,
  shanghaiDayStart,
} from '../../lib/community/communityActions.js'

const require = createRequire(import.meta.url)
const xReceipt = require('../../tools/x-reply-clipboard-extension/receipt.js')
const xhsReceipt = require('../../tools/xhs-interaction-extension/receipt.js')
const juejinReceipt = require('../../tools/juejin-interaction-extension/receipt.js')

const NOW = Date.parse('2026-10-12T02:00:00.000Z')

test('X daily report validates post counts and accepts older reports without posts', async () => {
  const dailyReport = { date: '2026-10-12', accountHandle: '@Tuaran', counts: { comments: 3, likes: 5, follows: 2, unfollows: 1, followBacks: 4 } }
  assert.equal(normalizeXDailyReport(dailyReport, NOW).accountHandle, 'Tuaran')
  assert.equal(normalizeXDailyReport(dailyReport, NOW).counts.posts, 0)
  assert.equal(normalizeXDailyReport({ ...dailyReport, counts: { ...dailyReport.counts, posts: 7 } }, NOW).counts.posts, 7)
  for (const posts of [-1, 1.5, 100001, NaN, Infinity, '7', null]) {
    assert.equal(normalizeXDailyReport({ ...dailyReport, counts: { ...dailyReport.counts, posts } }, NOW), null)
  }
  assert.equal(normalizeXDailyReport({ ...dailyReport, counts: { ...dailyReport.counts, likes: -1 } }, NOW), null)
  assert.equal(normalizeXDailyReport({ ...dailyReport, date: '2026-02-30' }, NOW), null)
  const writes = []
  const db = { prepare(sql) { return { bind(...values) { return { async run() { writes.push({ sql, values }); return { meta: { changes: 1 } } } } } } } }
  const result = await recordCommunityActionReport(db, { deviceId: 'device-x-daily', platform: 'x', extensionVersion: '3.16.0', dailyReport }, NOW)
  assert.equal(result.dailyReportSaved, true)
  assert.equal(writes.length, 2)
  assert.match(writes[1].sql, /ON CONFLICT\(device_id, report_date, account_handle\) DO UPDATE/)
  assert.deepEqual(writes[1].values.slice(0, 9), ['device-x-daily', '2026-10-12', 'Tuaran', 3, 5, 2, 1, 4, 0])
  const rejected = await recordCommunityActionReport(db, { deviceId: 'device-x-daily', platform: 'x', dailyReport: { ...dailyReport, counts: { ...dailyReport.counts, posts: -1 } } }, NOW)
  assert.deepEqual(rejected, { ok: false, error: 'INVALID_DAILY_REPORT' })
  assert.equal(writes.length, 2)
})

test('local daily report counts successful actions once and refuses a false upload acknowledgement', async () => {
  const saved = { xrcCommunityReport: { secret: 'secret-value', deviceId: 'device-x-daily', queue: [] } }
  const previousChrome = globalThis.chrome
  const previousFetch = globalThis.fetch
  globalThis.chrome = { storage: { local: {
    async get(key) { return { [key]: saved[key] } },
    async set(value) { Object.assign(saved, value) },
  } }, runtime: { getManifest: () => ({ version: '3.16.0' }) } }
  globalThis.fetch = async () => ({ ok: true, async json() { return { ok: true } } })
  try {
    const event = { id: 'event-like-001', task: 'post-like', result: 'success', occurredAt: NOW }
    await xReceipt.recordDailySuccess(event, 'Tuaran')
    await xReceipt.recordDailySuccess(event, 'Tuaran')
    await xReceipt.recordDailySuccess({ id: 'event-follow-001', task: 'mutual-target-follow', result: 'success', occurredAt: NOW }, 'Tuaran')
    assert.deepEqual(saved.xrcDailyReports[0].counts, { comments: 0, likes: 1, follows: 1, unfollows: 0, followBacks: 0, posts: 0 })
    const uploaded = await xReceipt.uploadDaily('2026-10-12', 'tuaran')
    assert.equal(uploaded.ok, false)
    assert.equal(saved.xrcDailyReports[0].uploadedAt, 0)
    globalThis.fetch = async () => ({ ok: true, async json() { return { dailyReportSaved: true } } })
    assert.equal((await xReceipt.uploadDaily('2026-10-12', 'tuaran')).ok, true)
    assert.ok(saved.xrcDailyReports[0].uploadedAt > 0)
  } finally {
    globalThis.chrome = previousChrome
    globalThis.fetch = previousFetch
  }
})

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

test('Juejin reports and devices retain their platform in the center', () => {
  const report = normalizeCommunityActionReport({
    deviceId: 'device-juejin-001',
    platform: 'juejin',
    events: [{ id: 'event-juejin-001', task: 'daily-checkin', result: 'success', occurredAt: NOW }],
  }, NOW)
  assert.equal(report.ok, true)
  assert.equal(report.events[0].task, 'daily-checkin')
  assert.equal(juejinReceipt.normalizeEvent({ task: 'article-post', result: 'success' }).task, 'article-post')
  const center = presentCommunityActionCenter({
    now: NOW,
    devices: [{ id: 'device-juejin-001', platform: 'juejin', last_seen_at: NOW }],
    counts: [{ platform: 'juejin', task: 'daily-checkin', result: 'success', count: 1 }],
  })
  assert.equal(center.devices[0].platform, 'juejin')
  assert.equal(center.tasks.find((task) => task.task === 'daily-checkin').success, 1)
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
              return { meta: { changes: duplicate ? 0 : sql.includes('INSERT OR IGNORE') ? 2 : 1 } }
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

import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { buildXMonitorTrend, enqueueXRemoteCommand, normalizeCommunityActionReport, normalizeXRuntime, presentXExtensionMonitor, presentXRuntimeGroups, readExtensionLive, readExtensionMonitor, readXExtensionLive, readXExtensionMonitor, recordCommunityActionReport, xMonitorDateRange } from '../../lib/community/communityActions.js'

const require = createRequire(import.meta.url)
const receipt = require('../../tools/x-reply-clipboard-extension/receipt.js')

const NOW = Date.parse('2026-10-18T08:00:00Z')

test('X task snapshot validates phases and does not accept arbitrary task names', () => {
  assert.equal(normalizeXRuntime({ phase: 'broken', tasks: [] }), null)
  const runtime = normalizeXRuntime({
    phase: 'running',
    tasks: [
      { mode: 'timeline', phase: 'running', startedAt: NOW },
      { mode: 'notifications', phase: 'idle' },
      { mode: 'likes-posts', phase: 'waiting', updatedAt: NOW },
      { mode: 'invalid', phase: 'running' },
    ],
  })
  assert.deepEqual(runtime.tasks.map((task) => [task.mode, task.phase]), [
    ['timeline', 'running'],
    ['notifications', 'idle'],
    ['likes-posts', 'paused'],
  ])
  const report = normalizeCommunityActionReport({ deviceId: 'device-x-monitor', platform: 'x', runtime: { phase: 'paused', tasks: [] } }, NOW)
  assert.equal(report.runtime.phase, 'paused')
})

test('runtime groups expose the four feature boards with idle fill-ins', () => {
  const groups = presentXRuntimeGroups([
    { mode: 'timeline', phase: 'running', updatedAt: NOW, detail: '正在回复' },
    { mode: 'mutual-unfollow', phase: 'paused', updatedAt: NOW, detail: '风控等待中', waitUntil: NOW + 600000 },
  ])
  assert.deepEqual(groups.map((group) => [group.id, group.phase]), [
    ['reply', 'running'],
    ['likes', 'idle'],
    ['mutual', 'waiting'],
    ['poster', 'idle'],
  ])
  assert.deepEqual(groups[0].tasks.map((task) => [task.mode, task.phase]), [
    ['timeline', 'running'],
    ['notifications', 'idle'],
  ])
  assert.equal(groups[2].tasks[0].detail, '风控等待中')
  assert.equal(groups[2].tasks[0].waitUntil, NOW + 600000)
})

test('remote commands enqueue and return on the next heartbeat report', async () => {
  const calls = []
  const rows = new Map()
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async run() {
              calls.push({ sql, values })
              if (sql.includes('INSERT INTO x_extension_commands')) {
                rows.set(values[0], { id: values[0], device_id: values[1], command: values[2], mode: values[3], status: 'pending', created_at: values[4] })
              }
              if (sql.includes("status = 'claimed'")) {
                const row = rows.get(values[1])
                if (row) row.status = 'claimed'
              }
              if (sql.includes("status = ?") && sql.includes('finished_at')) {
                const row = rows.get(values[3])
                if (row) { row.status = values[0]; row.result = values[1] }
              }
              return { meta: { changes: 1 } }
            },
            async all() {
              calls.push({ sql, values })
              if (sql.includes("status = 'pending'")) {
                return { results: [...rows.values()].filter((row) => row.status === 'pending' && row.device_id === values[0]) }
              }
              return { results: [] }
            },
          }
        },
      }
    },
  }
  const queued = await enqueueXRemoteCommand(db, { deviceId: 'device-x-monitor', command: 'flow-pause' }, NOW)
  assert.equal(queued.ok, true)
  const recorded = await recordCommunityActionReport(db, {
    deviceId: 'device-x-monitor', platform: 'x',
    runtime: { phase: 'paused', tasks: [{ mode: 'timeline', phase: 'paused', detail: '站长后台已暂停全流程', waitUntil: 0 }] },
  }, NOW)
  assert.equal(recorded.commands[0].command, 'flow-pause')
  const finished = await recordCommunityActionReport(db, {
    deviceId: 'device-x-monitor', platform: 'x',
    commandResults: [{ id: queued.id, status: 'done', result: '已暂停全流程' }],
    runtime: { phase: 'paused', tasks: [] },
  }, NOW + 1000)
  assert.equal(finished.commandsFinished, 1)
})

test('monitor separates a fresh heartbeat from actual task state', () => {
  const devices = [
    { id: 'fresh-old', last_seen_at: NOW - 1000 },
    { id: 'fresh-idle', last_seen_at: NOW - 1000 },
    { id: 'fresh-run', last_seen_at: NOW - 1000 },
    { id: 'fresh-paused', last_seen_at: NOW - 1000 },
    { id: 'fresh-stale-snapshot', last_seen_at: NOW - 1000 },
    { id: 'stale', last_seen_at: NOW - 10 * 60 * 1000 },
  ]
  const runtimes = [
    { device_id: 'fresh-idle', flow_phase: 'idle', tasks_json: '[]', reported_at: NOW - 1000 },
    { device_id: 'fresh-run', flow_phase: 'running', tasks_json: '[{"mode":"timeline","phase":"running"}]', reported_at: NOW - 1000 },
    { device_id: 'fresh-paused', flow_phase: 'paused', tasks_json: '[]', reported_at: NOW - 1000 },
    { device_id: 'fresh-stale-snapshot', flow_phase: 'running', tasks_json: '[{"mode":"timeline","phase":"running"}]', reported_at: NOW - 10 * 60 * 1000 },
    { device_id: 'stale', flow_phase: 'running', tasks_json: '[{"mode":"timeline","phase":"running"}]', reported_at: NOW - 10 * 60 * 1000 },
  ]
  const result = presentXExtensionMonitor({ devices, runtimes, now: NOW, dateRange: xMonitorDateRange('2026-10-18', NOW), taskCounts: [{ task: 'timeline-reply', result: 'success', count: 431 }] })
  assert.deepEqual(result.devices.map((device) => device.phase), ['unknown', 'idle', 'running', 'paused', 'unknown', 'offline'])
  assert.equal(result.devices.find((device) => device.id === 'fresh-run').groups[0].phase, 'running')
  assert.equal(result.devices.find((device) => device.id === 'fresh-idle').groups.every((group) => group.phase === 'idle'), true)
  assert.equal(result.devices.find((device) => device.id === 'fresh-old').groups.length, 0)
  assert.equal(result.tasks.find((task) => task.task === 'timeline-reply').success, 431)
})

test('monitor date range uses Beijing midnight and rejects invalid or future dates', () => {
  assert.deepEqual(xMonitorDateRange('2026-10-18', NOW), {
    selectedDate: '2026-10-18', minDate: '2025-10-18', maxDate: '2026-10-18',
    start: Date.parse('2026-10-18T00:00:00+08:00'), end: Date.parse('2026-10-19T00:00:00+08:00'),
  })
  assert.equal(xMonitorDateRange('2026-02-30', NOW), null)
  assert.equal(xMonitorDateRange('2026-10-19', NOW), null)
})

test('monitor trend fills 14 Beijing dates and separates task outcomes', () => {
  const days = buildXMonitorTrend([
    { date: '2026-10-17', task: 'timeline-reply', result: 'success', count: 4 },
    { date: '2026-10-17', task: 'timeline-reply', result: 'limited', count: 1 },
    { date: '2026-10-17', task: 'post-like', result: 'success', count: 3 },
    { date: '2026-10-18', task: 'post-like', result: 'failed', count: 2 },
  ], '2026-10-18')
  assert.equal(days.length, 14)
  assert.equal(days[0].date, '2026-10-05')
  assert.equal(days.at(-1).date, '2026-10-18')
  assert.deepEqual([days.at(-2).success, days.at(-2).limited, days.at(-1).failed], [7, 1, 2])
  assert.deepEqual([days.at(-2).tasks['timeline-reply'].success, days.at(-2).tasks['post-like'].success], [4, 3])
  assert.equal(days[0].success, 0)
})

test('monitor queries selected day for details and the latest 14 days for trends', async () => {
  const calls = []
  const db = { prepare(sql) { return {
    bind(...values) { calls.push({ sql, values }); return this },
    async all() {
      if (sql.includes('community_action_daily_counts') && sql.includes('report_date = ?')) return { results: [{ task: 'timeline-reply', result: 'success', count: 3 }] }
      if (sql.includes('community_action_daily_counts')) return { results: [{ date: '2026-10-17', task: 'timeline-reply', result: 'success', count: 3 }] }
      return { results: [] }
    },
    async first() { return { total: 0 } },
  } } }
  const result = await readXExtensionMonitor(db, { date: '2026-10-17', offset: 20, reportOffset: 20, now: NOW })
  const start = Date.parse('2026-10-17T00:00:00+08:00')
  assert.equal(result.selectedDate, '2026-10-17')
  assert.equal(result.offset, 20)
  assert.equal(result.limit, 20)
  assert.deepEqual(calls.find((call) => call.sql.includes('LIMIT ? OFFSET ?')).values, ['x', start, start + 86400000, 20, 20])
  assert.deepEqual(calls.find((call) => call.sql.includes('community_action_daily_counts') && call.sql.includes('report_date = ?')).values, ['x', '2026-10-17'])
  assert.deepEqual(calls.find((call) => call.sql.includes('community_action_daily_counts') && call.sql.includes('report_date >= ?')).values, ['x', '2026-10-05', '2026-10-18'])
  assert.equal(calls.some((call) => call.sql.includes('GROUP BY')), false)
  assert.equal(result.eventTotal, 3)
  assert.equal(result.tasks.find((task) => task.task === 'timeline-reply').success, 3)
  assert.equal(result.trend.length, 14)
  assert.equal(result.trend.at(-1).date, '2026-10-18')
  assert.equal(result.trend.at(-2).success, 3)
  assert.deepEqual(calls.find((call) => call.sql.includes('x_extension_daily_reports') && call.sql.includes('LIMIT ? OFFSET ?')).values, ['2026-10-17', 20, 20])
  assert.equal(result.reportOffset, 20)
})

test('live monitor refresh avoids trend and daily aggregate queries', async () => {
  const calls = []
  const db = { prepare(sql) { calls.push(sql); return {
    bind() { return this },
    async all() { return { results: [] } },
  } } }
  const result = await readXExtensionLive(db, { now: NOW })
  assert.deepEqual(result.devices, [])
  assert.equal(result.now, NOW)
  assert.equal(calls.length, 3)
  assert.equal(calls.some((sql) => /GROUP BY|COUNT\(\*\)|x_extension_daily_reports/.test(sql)), false)
})

test('monitor scopes Juejin devices, receipts and trend to one platform', async () => {
  const calls = []
  const db = { prepare(sql) { return {
    bind(...values) { calls.push({ sql, values }); return this },
    async all() {
      if (sql.includes('community_action_devices')) return { results: [{ id: 'juejin-device', last_seen_at: NOW - 1000 }] }
      if (sql.includes('community_action_daily_counts') && sql.includes('report_date = ?')) return { results: [{ task: 'article-post', result: 'failed', count: 2 }] }
      if (sql.includes('community_action_daily_counts')) return { results: [{ date: '2026-10-17', task: 'article-post', result: 'failed', count: 2 }] }
      if (sql.includes('ORDER BY occurred_at DESC LIMIT ? OFFSET ?')) return { results: [{ id: 'juejin-event', task: 'article-post', result: 'failed', target_id: 'draft-1', occurred_at: NOW - 86400000 }] }
      return { results: [] }
    },
    async first() { return sql.includes('sqlite_master') ? { sql: "WHEN NEW.platform IN ('x', 'xhs', 'juejin')" } : { total: 0 } },
  } } }
  const result = await readExtensionMonitor(db, { platform: 'juejin', date: '2026-10-17', now: NOW })
  assert.equal(result.platform, 'juejin')
  assert.equal(result.devices[0].phase, 'online')
  assert.deepEqual(result.tasks.map((task) => task.task), ['daily-checkin', 'pin-post', 'article-post'])
  assert.equal(result.tasks.find((task) => task.task === 'article-post').failed, 2)
  assert.equal(result.trend.at(-2).failed, 2)
  assert.equal(result.events[0].targetId, 'draft-1')
  assert.equal(result.reportTotal, 0)
  assert.equal(calls.some((call) => call.sql.includes('x_extension_daily_reports') || call.sql.includes('x_extension_runtime')), false)
  assert.ok(calls.filter((call) => call.sql.includes('community_action_events')).every((call) => call.values[0] === 'juejin'))
  assert.equal((await readExtensionLive(db, { platform: 'juejin', now: NOW })).devices[0].phase, 'online')
  await assert.rejects(readExtensionMonitor(db, { platform: 'unknown', now: NOW }), /INVALID_PLATFORM/)
})

test('Xiaohongshu keeps paged receipts visible before all-platform count migration', async () => {
  const calls = []
  const db = { prepare(sql) { return {
    bind(...values) { calls.push({ sql, values }); return this },
    async all() {
      if (sql.includes('ORDER BY occurred_at DESC LIMIT ? OFFSET ?')) return { results: [{ id: 'xhs-event', task: 'recommend-comment', result: 'success', occurred_at: NOW - 86400000 }] }
      return { results: [] }
    },
    async first() { return sql.includes('sqlite_master') ? { sql: "WHEN NEW.platform = 'x'" } : { total: 25 } },
  } } }
  const result = await readExtensionMonitor(db, { platform: 'xhs', date: '2026-10-17', now: NOW })
  assert.equal(result.countsMigrationRequired, true)
  assert.equal(result.events[0].taskLabel, '推荐评论')
  assert.equal(result.eventTotal, 25)
  assert.equal(result.trend.at(-1).success, 0)
  assert.equal(calls.some((call) => call.sql.includes('community_action_daily_counts')), false)
})

test('monitor does not fall back to scanning receipts before count migration', async () => {
  const calls = []
  const db = { prepare(sql) { calls.push(sql); return {
    bind() { return this },
    async all() {
      if (sql.includes('community_action_daily_counts')) throw new Error('no such table: community_action_daily_counts')
      return { results: [] }
    },
    async first() { return { total: 0 } },
  } } }
  const result = await readXExtensionMonitor(db, { date: '2026-10-17', now: NOW })
  assert.equal(result.countsMigrationRequired, true)
  assert.equal(calls.some((sql) => sql.includes('GROUP BY')), false)
})

test('runtime heartbeat stores snapshot separately from action counts', async () => {
  const calls = []
  const db = { prepare(sql) { return { bind(...values) { return { async run() { calls.push({ sql, values }); return { meta: { changes: 1 } } } } } } } }
  const result = await recordCommunityActionReport(db, {
    deviceId: 'device-x-monitor', platform: 'x', accountHandle: '@Tuaran',
    runtime: { phase: 'running', tasks: [{ mode: 'timeline', phase: 'running', startedAt: NOW }] },
  }, NOW)
  assert.equal(result.accepted, 0)
  const runtimeCall = calls.find((call) => /x_extension_runtime/.test(call.sql))
  assert.ok(runtimeCall)
  assert.equal(runtimeCall.values[2], 'running')
})

test('extension heartbeat includes a task snapshot in the authenticated request', async () => {
  const previousChrome = globalThis.chrome
  const previousFetch = globalThis.fetch
  const store = {}
  let body
  globalThis.chrome = { storage: { local: {
    async get(key) { return { [key]: store[key] } },
    async set(value) { Object.assign(store, value) },
  } }, runtime: { getManifest: () => ({ version: '3.27.20' }) } }
  globalThis.fetch = async (_, options) => { body = JSON.parse(options.body); return { ok: true } }
  try {
    receipt.setRuntimeProvider(async () => ({ phase: 'running', tasks: [{ mode: 'timeline', phase: 'running' }] }))
    await receipt.saveSecret('test-secret')
    assert.equal(body.runtime.phase, 'running')
    assert.equal(body.runtime.tasks[0].mode, 'timeline')
  } finally {
    receipt.setRuntimeProvider(null)
    globalThis.chrome = previousChrome
    globalThis.fetch = previousFetch
  }
})

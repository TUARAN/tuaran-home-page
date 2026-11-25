import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { publicMonitorPayload, summarizeReports } from '../../lib/x/workbench/monitorPublic.js'

const source = (rel) => readFile(new URL(`../../${rel}`, import.meta.url), 'utf8')

const sample = {
  now: 1764000000000,
  selectedDate: '2026-11-25',
  minDate: '2025-11-25',
  maxDate: '2026-11-25',
  latestExtensionVersion: '1.9.3',
  accounts: ['TarsixSevenEig'],
  countsMigrationRequired: false,
  migrationRequired: false,
  devices: [{
    id: 'device-secret-0001',
    accountHandle: 'TarsixSevenEig',
    online: true,
    telemetry: true,
    phase: 'running',
    extensionVersion: '1.9.3',
    updateAvailable: true,
    lastSeenAt: 1763999000000,
    schedule: { enabled: true, current: 'day', rules: { day: {} } },
    commands: [{ id: 'c1', command: 'flow-start' }],
    lastAction: { task: 'timeline-reply', taskLabel: '评论首页', result: 'success', occurredAt: 1763998800000, targetId: '1899999', errorCode: 'x-1' },
    lastFailure: { task: 'kol-reply', taskLabel: '评论大V', result: 'limited', occurredAt: 1763990000000, targetId: '1898888', errorCode: 'rate-limit' },
  }],
  tasks: [{ task: 'timeline-reply', label: '评论首页', success: 12, failed: 1, skipped: 0, limited: 2 }],
  trend: [{ date: '2026-11-25', success: 12, failed: 1, skipped: 0, limited: 2, tasks: { 'timeline-reply': { success: 12 } } }],
  dailyReports: [{ deviceId: 'device-secret-0001', accountHandle: 'TarsixSevenEig', posts: 3, comments: 12, likes: 5, follows: 2, followBacks: 1, unfollows: 0, timelineComments: 8, notificationComments: 2, kolComments: 2, uploadedAt: 1763990000000 }],
}

test('公开投影剥离设备 ID、目标 ID 与错误码', () => {
  const payload = publicMonitorPayload(sample)
  const device = payload.devices[0]
  assert.equal(payload.owner, false)
  assert.equal(device.id, undefined)
  assert.equal(device.commands, undefined)
  assert.equal(device.lastAction.targetId, undefined)
  assert.equal(device.lastAction.errorCode, undefined)
  assert.equal(device.lastAction.taskLabel, '评论首页')
  assert.deepEqual(device.schedule, { enabled: true, current: 'day' })
  assert.equal(payload.reports[0].deviceId, undefined)
  assert.equal(payload.reports[0].accountHandle, 'TarsixSevenEig')
  assert.equal(payload.trend[0].tasks, undefined)
})

test('站长登录时附带 device_id 用于下发指令', () => {
  const payload = publicMonitorPayload(sample, { owner: true })
  assert.equal(payload.owner, true)
  assert.equal(payload.devices[0].id, 'device-secret-0001')
  assert.equal(payload.devices[0].lastAction.errorCode, undefined)
})

test('日报汇总按六类累加，缺失字段按 0', () => {
  assert.deepEqual(summarizeReports([
    { posts: 3, comments: 12, likes: 5, follows: 2, followBacks: 1, unfollows: 4 },
    { posts: 1, comments: 2 },
    null,
  ]), { posts: 4, comments: 14, likes: 5, follows: 2, followBacks: 1, unfollows: 4 })
  assert.deepEqual(summarizeReports(null), { posts: 0, comments: 0, likes: 0, follows: 0, followBacks: 0, unfollows: 0 })
})

test('公开监控路由允许匿名读取，并挂在 x-workbench 路由表上', async () => {
  const [route, dispatch] = await Promise.all([
    source('lib/x/workbench/routes/monitor.js'),
    source('app/api/x-workbench/[...path]/route.js'),
  ])
  assert.match(route, /allowAnonymousGet: true/)
  assert.match(route, /platform: 'x'/)
  assert.match(route, /isOwnerUser\(user\)/)
  assert.match(dispatch, /import \* as monitor from/)
  assert.match(dispatch, /leaderboard, monitor, observe/)
})

test('首页在智能体卡片之后渲染插件现场，日历默认收起', async () => {
  const [home, section] = await Promise.all([
    source('app/(x)/x-workbench/WorkbenchClient.jsx'),
    source('app/(x)/x-workbench/MonitorSection.jsx'),
  ])
  assert.match(home, /<MonitorSection \/>/)
  assert.ok(home.indexOf('<MonitorSection />') > home.indexOf('id="agents"'))
  assert.match(section, /useState\(false\)/) // calendarOpen 默认收起
  assert.match(section, /aria-expanded=\{calendarOpen\}/)
  assert.match(section, /data\?\.owner/)
  assert.doesNotMatch(section, /s\[`/)
})

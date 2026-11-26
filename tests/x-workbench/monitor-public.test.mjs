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

test('站长控制台数据：排班规则、指令回执与动作明细只给站长', () => {
  const rich = {
    ...sample,
    devices: [{
      ...sample.devices[0],
      schedule: {
        enabled: true,
        current: 'timeline',
        rules: [{ mode: 'timeline', enabled: true, priority: 8, window: 'all' }],
        facing: { running: 1, waiting: 2, needs: 0, stopped: 3 },
      },
      commands: [{ id: 'c1', command: 'schedule-set', status: 'pending', mode: '', modeLabel: '排班', createdAt: 1763990000000, result: '' }],
      groups: [{ id: 'reply', label: '评论', tasks: [{ mode: 'timeline', label: '评论首页', phase: 'running', priority: 8, detail: '正在评论', waitUntil: 0 }] }],
    }],
    events: [{ id: 'e1', task: 'timeline-reply', taskLabel: '评论首页', result: 'success', accountHandle: 'TarsixSevenEig', occurredAt: 1763990000000, errorCode: 'x-1', targetId: '1899' }],
  }
  const owner = publicMonitorPayload(rich, { owner: true })
  assert.deepEqual(owner.devices[0].schedule.rules, [{ mode: 'timeline', enabled: true, priority: 8, window: 'all' }])
  assert.equal(owner.devices[0].commands[0].command, 'schedule-set')
  assert.equal(owner.devices[0].groups[0].tasks[0].label, '评论首页')
  assert.equal(owner.events[0].errorCode, 'x-1')
  assert.equal(owner.events[0].targetId, '1899')

  const guest = publicMonitorPayload(rich)
  assert.equal(guest.events, undefined)
  assert.equal(guest.devices[0].commands, undefined)
  assert.equal(guest.devices[0].groups, undefined)
  assert.deepEqual(guest.devices[0].schedule, { enabled: true, current: 'timeline' })
})

test('日报汇总八类，与插件日报面板同一套；关注并入回关，缺失字段按 0', () => {
  assert.deepEqual(summarizeReports([
    { posts: 3, comments: 12, likes: 5, follows: 2, followBacks: 1, unfollows: 4, communityShares: 2, prunes: 1, replyPrunes: 3 },
    { posts: 1, comments: 2 },
    null,
  ]), { comments: 14, likes: 5, follows: 3, unfollows: 4, posts: 4, communityShares: 2, prunes: 1, replyPrunes: 3 })
  assert.deepEqual(summarizeReports(null), {
    comments: 0, likes: 0, follows: 0, unfollows: 0, posts: 0, communityShares: 0, prunes: 0, replyPrunes: 0,
  })
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

test('X 监控与排班搬到 X 站后台，后台只剩 AI 分发大师监控', async () => {
  const [client, ops, consoleSrc, picker] = await Promise.all([
    source('app/(admin)/admin/community-actions/monitor/PluginMonitorClient.jsx'),
    source('app/(x)/x-workbench/OperatorClient.jsx'),
    source('app/(x)/x-workbench/ops/PluginConsole.jsx'),
    source('app/(admin)/admin/community-actions/monitor/PluginPicker.jsx'),
  ])
  assert.match(client, /DistributionMonitor/)
  assert.doesNotMatch(client, /XPluginStatusDeck/)
  assert.match(client, /x-workbench\/ops/)
  assert.match(ops, /<PluginConsole \/>/)
  assert.match(consoleSrc, /schedule-set/)
  assert.match(consoleSrc, /task-start/)
  assert.match(consoleSrc, /动作明细/)
  assert.match(picker, /x-workbench\/ops/)
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
  assert.doesNotMatch(section, /data\?\.owner/) // 站长指令只在 /x-workbench/ops
  assert.doesNotMatch(section, /s\[`/)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const alert = require('../../tools/x-reply-clipboard-extension/idleTaskWindowAlert.js')

function atShanghai(iso) {
  const ms = Date.parse(iso)
  assert.ok(Number.isFinite(ms), iso)
  return ms
}

const morning = atShanghai('2026-11-18T09:30:00+08:00')
const morningEarly = atShanghai('2026-11-18T00:20:00+08:00')
const afternoon = atShanghai('2026-11-18T15:30:00+08:00')
const afternoonEarly = atShanghai('2026-11-18T12:20:00+08:00')
const beforeForward = atShanghai('2026-11-18T13:00:00+08:00')

const queued = (extra = {}) => ({ enabled: true, minGapMs: 5 * 60 * 1000, ...extra })

function baseInput(now, extra = {}) {
  return {
    now,
    scheduleEnabled: true,
    rules: { notifications: queued() },
    items: {},
    confirmedTimesByTask: {},
    dailyCountsByTask: {},
    dismissed: {},
    ...extra
  }
}

test('splits Beijing time into fixed morning and afternoon windows, not a rolling 12 hours', () => {
  const am = alert.halfDayWindow(morning)
  const pm = alert.halfDayWindow(afternoon)
  assert.equal(am.id, '2026-11-18-am')
  assert.equal(am.period, 'am')
  assert.equal(am.start, atShanghai('2026-11-18T00:00:00+08:00'))
  assert.equal(am.end, atShanghai('2026-11-18T12:00:00+08:00'))
  assert.equal(pm.id, '2026-11-18-pm')
  assert.equal(pm.start, atShanghai('2026-11-18T12:00:00+08:00'))
  assert.equal(pm.end, atShanghai('2026-11-19T00:00:00+08:00'))
  const rolled = alert.halfDayWindow(atShanghai('2026-11-18T11:30:00+08:00'))
  assert.equal(rolled.period, 'am')
  assert.notEqual(rolled.start, atShanghai('2026-11-18T11:30:00+08:00') - 12 * 60 * 60 * 1000)
})

test('only inspects currently queued non-cleanup tasks, and excludes default-off posting or community tasks', () => {
  const alerts = alert.listAlerts(baseInput(afternoon, {
    rules: {
      notifications: queued(),
      'prune-posts': queued(),
      'mutual-unfollowNonSc': queued(),
      poster: { enabled: false, minGapMs: 0 },
      'site-forward': { enabled: false, minGapMs: 15 * 60 * 1000 },
      'community-share': { enabled: false, minGapMs: 0 }
    },
    items: { notifications: { blocked: true, reason: '执行页没有回报启动结果' } }
  }))
  assert.deepEqual(alerts.map((item) => item.mode), ['notifications'])
})

test('treats confirmed receipt times as a run, and does not treat lastRunAt as success', () => {
  const blocked = { blocked: true, reason: '执行页没有回报启动结果', lastRunAt: morning }
  assert.equal(alert.listAlerts(baseInput(afternoon, {
    rules: { notifications: queued() },
    items: { notifications: blocked },
    confirmedTimesByTask: { notifications: [atShanghai('2026-11-18T14:10:00+08:00')] }
  })).length, 0)
  const pending = alert.listAlerts(baseInput(afternoon, {
    rules: { notifications: queued() },
    items: { notifications: blocked }
  }))
  assert.equal(pending.length, 1)
  assert.match(pending[0].reason, /blocked|启动未确认/)
})

test('morning can fall back to a date-level count when timestamps are missing; afternoon cannot', () => {
  const am = alert.listAlerts(baseInput(morning, {
    items: { notifications: { blocked: true, lastStartError: '执行页没有回报启动结果' } },
    dailyCountsByTask: { notifications: 2 }
  }))
  assert.equal(am.length, 0)
  const pm = alert.listAlerts(baseInput(afternoon, {
    items: { notifications: { blocked: true, lastStartError: '执行页没有回报启动结果' } },
    dailyCountsByTask: { notifications: 2 }
  }))
  assert.equal(pm.length, 1)
  const pmWithTime = alert.listAlerts(baseInput(afternoon, {
    items: { notifications: { blocked: true } },
    dailyCountsByTask: { notifications: 2 },
    confirmedTimesByTask: { notifications: [atShanghai('2026-11-18T10:00:00+08:00')] }
  }))
  assert.equal(pmWithTime.length, 1)
})

test('does not warn at the start of a window unless the task is stuck, then warns after the grace period', () => {
  assert.equal(alert.listAlerts(baseInput(morningEarly)).length, 0)
  assert.equal(alert.listAlerts(baseInput(afternoonEarly)).length, 0)
  assert.equal(alert.listAlerts(baseInput(morning)).length, 1)
  const stuck = alert.listAlerts(baseInput(morningEarly, {
    items: { notifications: { blocked: true, lastStartError: '执行页没有回报启动结果' } }
  }))
  assert.equal(stuck.length, 1)
})

test('relaxes site-forward to its daily 14:00 window instead of warning every half day', () => {
  const rule = { enabled: true, minGapMs: 15 * 60 * 1000 }
  assert.equal(alert.listAlerts(baseInput(morning, {
    rules: { 'site-forward': rule }
  })).length, 0)
  assert.equal(alert.listAlerts(baseInput(beforeForward, {
    rules: { 'site-forward': rule }
  })).length, 0)
  const late = alert.listAlerts(baseInput(afternoon, {
    rules: { 'site-forward': rule }
  }))
  assert.equal(late.length, 1)
  assert.equal(late[0].mode, 'site-forward')
  assert.equal(alert.listAlerts(baseInput(afternoon, {
    rules: { 'site-forward': rule },
    confirmedTimesByTask: { 'site-forward': [atShanghai('2026-11-18T14:20:00+08:00')] }
  })).length, 0)
})

test('long-period tasks wait for their own gap and only warn when stuck if they have never confirmed', () => {
  const weekly = { enabled: true, minGapMs: 7 * 24 * 60 * 60 * 1000 }
  assert.equal(alert.listAlerts(baseInput(afternoon, {
    rules: { 'mutual-targetFollow': weekly }
  })).length, 0)
  const recent = atShanghai('2026-11-18T08:00:00+08:00')
  assert.equal(alert.listAlerts(baseInput(afternoon, {
    rules: { 'mutual-targetFollow': weekly },
    confirmedTimesByTask: { 'mutual-targetFollow': [recent] }
  })).length, 0)
  const stale = atShanghai('2026-11-01T08:00:00+08:00')
  assert.equal(alert.listAlerts(baseInput(afternoon, {
    rules: { 'mutual-targetFollow': weekly },
    confirmedTimesByTask: { 'mutual-targetFollow': [stale] }
  })).length, 1)
})

test('closing a warning hides that task for the rest of this window and shows it again in the next window', () => {
  const window = alert.halfDayWindow(morning)
  const dismissed = alert.rememberDismiss({}, window.id, 'notifications')
  assert.equal(alert.isDismissed(dismissed, window.id, 'notifications'), true)
  const hidden = alert.listAlerts(baseInput(morning, {
    items: { notifications: { blocked: true, reason: '执行页没有回报启动结果' } },
    dismissed
  }))
  assert.equal(hidden.length, 0)
  const nextWindow = alert.listAlerts(baseInput(afternoon, {
    items: { notifications: { blocked: true, reason: '执行页没有回报启动结果' } },
    dismissed
  }))
  assert.equal(nextWindow.length, 1)
  const pruned = alert.pruneDismissMap(dismissed, afternoon)
  assert.equal(alert.isDismissed(pruned, window.id, 'notifications'), false)
})

test('banner copy names the task, includes a reason, and states that blocked is not cleared automatically', () => {
  const alerts = alert.listAlerts(baseInput(afternoon, {
    items: { notifications: { blocked: true, lastStartError: '执行页没有回报启动结果' } }
  }))
  const html = alert.bannerInnerHtml(alerts)
  assert.match(html, /评论回复/)
  assert.match(html, /blocked|启动未确认/)
  assert.match(html, /不自动替用户清掉 blocked/)
  assert.match(html, /data-xrc-idle-open="notifications"/)
  assert.match(html, /data-xrc-idle-dismiss="notifications"/)
})

test('does not list alerts when scheduling is off', () => {
  assert.equal(alert.listAlerts(baseInput(afternoon, { scheduleEnabled: false, items: { notifications: { blocked: true } } })).length, 0)
})

test('wires the banner into homepage 01, content scripts, and styles', async () => {
  const { readFile } = await import('node:fs/promises')
  const extensionDir = new URL('../../tools/x-reply-clipboard-extension/', import.meta.url)
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  const manifest = JSON.parse(await readFile(new URL('manifest.json', extensionDir), 'utf8'))
  const scripts = manifest.content_scripts[3].js
  assert.ok(scripts.includes('idleTaskWindowAlert.js'))
  assert.ok(scripts.indexOf('idleTaskWindowAlert.js') < scripts.indexOf('content.js'))
  assert.match(content, /data-xrc-idle-window-alert/)
  assert.match(content, /function renderIdleTaskWindowAlert\(/)
  assert.match(content, /syncHomeTodayTabs\(panel, homeTodayCategory\);\s*renderIdleTaskWindowAlert\(panel\);/)
  assert.match(content, /data-xrc-idle-open[\s\S]{0,200}openTaskSubpage/)
  assert.match(css, /#x-reply-clipboard-panel \.xrc-idle-window-alert\s*\{/)
})

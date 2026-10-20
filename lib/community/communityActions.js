import { shanghaiDateKey } from '../automation/dailyGreeting.js'

export const COMMUNITY_ACTION_SECRET_KEY = 'community_action.report_secret'
export const COMMUNITY_ACTION_SECRET_HEADER = 'x-community-action-secret'
export const COMMUNITY_ACTION_REPORT_URL = 'https://2aran.com/api/community-actions/report'
export const COMMUNITY_ACTION_ONLINE_MS = 5 * 60 * 1000
export const COMMUNITY_ACTION_EVENT_LIMIT = 20
export const COMMUNITY_ACTION_RECENT_LIMIT = 40

export const COMMUNITY_ACTION_TASKS = Object.freeze([
  { platform: 'x', task: 'timeline-reply', label: '时间线回复' },
  { platform: 'x', task: 'notification-reply', label: '通知回复' },
  { platform: 'x', task: 'mutual-unfollow', label: '清理未回关' },
  { platform: 'x', task: 'mutual-follow-back', label: '回关粉丝' },
  { platform: 'x', task: 'mutual-target-follow', label: '关注候选' },
  { platform: 'x', task: 'tweet-post', label: '推文浇给' },
  { platform: 'x', task: 'post-like', label: '首页帖子点赞' },
  { platform: 'x', task: 'reply-like', label: '评论点赞' },
  { platform: 'xhs', task: 'recommend-comment', label: '推荐评论' },
  { platform: 'xhs', task: 'note-post', label: '笔记浇给' },
  { platform: 'juejin', task: 'daily-checkin', label: '每日签到' },
  { platform: 'juejin', task: 'pin-post', label: '发布沸点' },
  { platform: 'juejin', task: 'article-post', label: '文章 / 草稿' },
])

export const COMMUNITY_ACTION_RESULTS = Object.freeze(['success', 'failed', 'skipped', 'limited'])
export const COMMUNITY_ACTION_PLATFORMS = Object.freeze(['x', 'xhs', 'juejin'])

export const COMMUNITY_ACTION_LINKS = Object.freeze([
  { href: '/admin/community-actions?tab=extension', label: '浏览器插件', note: '管理 X、小红书和掘金插件及共用密钥。' },
  { href: '/admin/community-actions/monitor', label: '插件监控', note: '按平台查看在线状态、日期统计、趋势与确认回执。' },
  { href: '/admin/community-actions?tab=x-publish', label: '纯云端 · X 发布', note: '不依赖插件常开；网站侧 X API 定时发布。' },
  { href: '/admin/community-actions?tab=x-reply', label: '纯云端 · X 回复', note: '不依赖插件常开；人工确认后走 X API。' },
  { href: '/admin/article-distribution', label: '文章分发插件', note: '跨平台草稿写入入口。' },
])

const ID_RE = /^[A-Za-z0-9_-]{8,80}$/
const ERROR_CODE_RE = /^[a-z0-9-]{1,40}$/

function cleanText(value, limit) {
  return String(value || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, limit)
}

function cleanHandle(value) {
  return cleanText(value, 40).replace(/^@+/u, '').replace(/\s+/g, '')
}

function taskFor(platform, task) {
  return COMMUNITY_ACTION_TASKS.find((item) => item.platform === platform && item.task === task) || null
}

export function communityActionTaskLabel(platform, task) {
  return taskFor(platform, task)?.label || String(task || '')
}

export function shanghaiDayStart(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now)
  return Date.parse(`${shanghaiDateKey(date.getTime())}T00:00:00+08:00`)
}

export function createCommunityActionSecret() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function communityActionAuthorized(headerValue, secret) {
  const expected = String(secret || '')
  if (!expected) return { ok: false, status: 503, error: 'SECRET_NOT_CONFIGURED' }
  if (String(headerValue || '') !== expected) return { ok: false, status: 401, error: 'UNAUTHORIZED' }
  return { ok: true }
}

export function normalizeCommunityActionEvent(raw, { platform, now = Date.now() } = {}) {
  const task = taskFor(platform, String(raw?.task || ''))
  const result = String(raw?.result || '')
  const id = String(raw?.id || '')
  if (!task || !COMMUNITY_ACTION_RESULTS.includes(result) || !ID_RE.test(id)) return null
  const occurredAt = Number(raw?.occurredAt)
  const fresh = Number.isFinite(occurredAt) && occurredAt >= now - 2 * 24 * 60 * 60 * 1000 && occurredAt <= now + 5 * 60 * 1000
  const errorCode = String(raw?.errorCode || '')
  return {
    id,
    platform,
    task: task.task,
    result,
    targetId: cleanText(raw?.targetId, 80),
    accountHandle: cleanHandle(raw?.accountHandle),
    errorCode: ERROR_CODE_RE.test(errorCode) ? errorCode : '',
    occurredAt: fresh ? Math.floor(occurredAt) : now,
  }
}

export function normalizeCommunityActionReport(body, now = Date.now()) {
  const deviceId = String(body?.deviceId || '')
  const platform = ['x', 'xhs', 'juejin'].includes(body?.platform) ? body.platform : ''
  if (!ID_RE.test(deviceId) || !platform) return { ok: false, error: 'INVALID_REPORT' }
  const rawEvents = Array.isArray(body?.events) ? body.events.slice(0, COMMUNITY_ACTION_EVENT_LIMIT) : []
  return {
    ok: true,
    deviceId,
    platform,
    extensionVersion: cleanText(body?.extensionVersion, 32),
    accountHandle: cleanHandle(body?.accountHandle),
    events: rawEvents.map((event) => normalizeCommunityActionEvent(event, { platform, now })).filter(Boolean),
    dailyReport: platform === 'x' && body?.dailyReport ? normalizeXDailyReport(body.dailyReport, now) : null,
    runtime: platform === 'x' && body?.runtime ? normalizeXRuntime(body.runtime) : null,
  }
}

const X_RUNTIME_MODES = new Set(['timeline', 'notifications', 'likes-posts', 'likes-replies', 'poster', 'mutual-unfollow', 'mutual-followBack', 'mutual-targetFollow'])
const X_RUNTIME_PHASES = new Set(['running', 'paused', 'stopping', 'stopped', 'idle'])

export function normalizeXRuntime(raw) {
  if (!raw || typeof raw !== 'object' || !X_RUNTIME_PHASES.has(raw.phase) || !Array.isArray(raw.tasks)) return null
  const tasks = raw.tasks.slice(0, 8).filter((task) => X_RUNTIME_MODES.has(task?.mode) && ['running', 'paused', 'stopping'].includes(task?.phase))
    .map((task) => ({ mode: task.mode, phase: task.phase, startedAt: Number(task.startedAt) || 0, updatedAt: Number(task.updatedAt) || 0 }))
  return { phase: raw.phase, tasks }
}

export function normalizeXDailyReport(raw, now = Date.now()) {
  const date = String(raw?.date || '')
  const today = shanghaiDateKey(now)
  const oldest = shanghaiDateKey(now - 365 * 24 * 60 * 60 * 1000)
  const parsedDate = Date.parse(`${date}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < oldest || date > today || !Number.isFinite(parsedDate) || new Date(parsedDate).toISOString().slice(0, 10) !== date) return null
  const fields = ['comments', 'likes', 'follows', 'unfollows', 'followBacks']
  const counts = {}
  for (const field of fields) {
    if (typeof raw?.counts?.[field] !== 'number') return null
    const value = Number(raw?.counts?.[field])
    if (!Number.isSafeInteger(value) || value < 0 || value > 100000) return null
    counts[field] = value
  }
  return { date, accountHandle: cleanHandle(raw.accountHandle), counts }
}

export function presentCommunityActionCenter({ devices = [], counts = [], recent = [], now = Date.now() } = {}) {
  const countMap = new Map()
  for (const row of counts) {
    countMap.set(`${row.platform}:${row.task}:${row.result}`, Number(row.count) || 0)
  }
  const tasks = COMMUNITY_ACTION_TASKS.map((task) => {
    const success = countMap.get(`${task.platform}:${task.task}:success`) || 0
    const failed = countMap.get(`${task.platform}:${task.task}:failed`) || 0
    const skipped = countMap.get(`${task.platform}:${task.task}:skipped`) || 0
    const limited = countMap.get(`${task.platform}:${task.task}:limited`) || 0
    return { ...task, success, failed, skipped, limited }
  })
  const onlineCutoff = now - COMMUNITY_ACTION_ONLINE_MS
  return {
    tasks,
    todaySuccess: tasks.reduce((sum, task) => sum + task.success, 0),
    devices: devices.map((row) => {
      const lastSeenAt = Number(row.last_seen_at || row.lastSeenAt) || 0
      return {
        id: String(row.id || ''),
        platform: ['x', 'xhs', 'juejin'].includes(row.platform) ? row.platform : 'x',
        extensionVersion: String(row.extension_version || row.extensionVersion || ''),
        accountHandle: String(row.account_handle || row.accountHandle || ''),
        lastSeenAt,
        createdAt: Number(row.created_at || row.createdAt) || 0,
        online: lastSeenAt >= onlineCutoff,
      }
    }),
    recent: recent.map((row) => ({
      id: String(row.id || ''),
      deviceId: String(row.device_id || row.deviceId || ''),
      platform: ['x', 'xhs', 'juejin'].includes(row.platform) ? row.platform : 'x',
      task: String(row.task || ''),
      taskLabel: communityActionTaskLabel(row.platform, row.task),
      result: String(row.result || ''),
      targetId: String(row.target_id || row.targetId || ''),
      accountHandle: String(row.account_handle || row.accountHandle || ''),
      errorCode: String(row.error_code || row.errorCode || ''),
      extensionVersion: String(row.extension_version || row.extensionVersion || ''),
      occurredAt: Number(row.occurred_at || row.occurredAt) || 0,
    })),
    links: COMMUNITY_ACTION_LINKS,
  }
}

export async function recordCommunityActionReport(db, report, now = Date.now()) {
  const normalized = normalizeCommunityActionReport(report, now)
  if (!normalized.ok) return normalized
  if (report?.dailyReport && !normalized.dailyReport) return { ok: false, error: 'INVALID_DAILY_REPORT' }
  if (report?.runtime && !normalized.runtime) return { ok: false, error: 'INVALID_RUNTIME' }
  await db.prepare(
    `INSERT INTO community_action_devices
      (id, platform, extension_version, account_handle, last_seen_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       platform = excluded.platform,
       extension_version = excluded.extension_version,
       account_handle = CASE
         WHEN excluded.account_handle != '' THEN excluded.account_handle
         ELSE community_action_devices.account_handle
       END,
       last_seen_at = excluded.last_seen_at`,
  ).bind(
    normalized.deviceId,
    normalized.platform,
    normalized.extensionVersion,
    normalized.accountHandle,
    now,
    now,
  ).run()

  if (normalized.runtime) {
    try {
      await db.prepare(
        `INSERT INTO x_extension_runtime (device_id, account_handle, flow_phase, tasks_json, reported_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(device_id) DO UPDATE SET
           account_handle = CASE WHEN excluded.account_handle != '' THEN excluded.account_handle ELSE x_extension_runtime.account_handle END,
           flow_phase = excluded.flow_phase, tasks_json = excluded.tasks_json, reported_at = excluded.reported_at`,
      ).bind(normalized.deviceId, normalized.accountHandle, normalized.runtime.phase, JSON.stringify(normalized.runtime.tasks), now).run()
    } catch (error) {
      if (!/no such table/i.test(String(error?.message || error))) throw error
    }
  }

  let accepted = 0
  for (const event of normalized.events) {
    const result = await db.prepare(
      `INSERT OR IGNORE INTO community_action_events
        (id, device_id, platform, task, result, target_id, account_handle, error_code, extension_version, occurred_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      event.id,
      normalized.deviceId,
      event.platform,
      event.task,
      event.result,
      event.targetId,
      event.accountHandle || normalized.accountHandle,
      event.errorCode,
      normalized.extensionVersion,
      event.occurredAt,
      now,
    ).run()
    // D1 的 changes 可能计入触发器更新的汇总行，每条回执最多确认一次。
    accepted += Number(result?.meta?.changes || 0) > 0 ? 1 : 0
  }
  if (normalized.dailyReport) {
    const daily = normalized.dailyReport
    await db.prepare(
      `INSERT INTO x_extension_daily_reports
       (device_id, report_date, account_handle, comments, likes, follows, unfollows, follow_backs, extension_version, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(device_id, report_date, account_handle) DO UPDATE SET
         comments = excluded.comments, likes = excluded.likes, follows = excluded.follows,
         unfollows = excluded.unfollows, follow_backs = excluded.follow_backs,
         extension_version = excluded.extension_version, uploaded_at = excluded.uploaded_at`,
    ).bind(
      normalized.deviceId, daily.date, daily.accountHandle,
      daily.counts.comments, daily.counts.likes, daily.counts.follows,
      daily.counts.unfollows, daily.counts.followBacks, normalized.extensionVersion, now,
    ).run()
  }
  return { ok: true, accepted, dailyReportSaved: Boolean(normalized.dailyReport) }
}

export async function readCommunityActionCenter(db, now = Date.now()) {
  const [devicesResult, recentResult] = await Promise.all([
    db.prepare(
      `SELECT id, platform, extension_version, account_handle, last_seen_at, created_at
       FROM community_action_devices
       WHERE platform != 'x'
       ORDER BY last_seen_at DESC
       LIMIT 20`,
    ).all(),
    db.prepare(
      `SELECT id, device_id, platform, task, result, target_id, account_handle, error_code, extension_version, occurred_at
       FROM community_action_events
       WHERE platform != 'x'
       ORDER BY occurred_at DESC
       LIMIT ?`,
    ).bind(COMMUNITY_ACTION_RECENT_LIMIT).all(),
  ])
  return presentCommunityActionCenter({
    devices: devicesResult?.results || [],
    recent: recentResult?.results || [],
    now,
  })
}

export async function readCommunityActionHistory(db, { accountHandle = '', now = Date.now() } = {}) {
  const handle = cleanHandle(accountHandle)
  if (!handle) return { ok: false, error: 'ACCOUNT_REQUIRED' }
  const oldest = now - 365 * 24 * 60 * 60 * 1000
  const daily = await db.prepare(
    `SELECT report_date, account_handle, comments, likes, follows, unfollows, follow_backs, uploaded_at
     FROM x_extension_daily_reports
     WHERE account_handle = ?
     ORDER BY report_date DESC, uploaded_at DESC
     LIMIT 400`,
  ).bind(handle).all()
  const events = await db.prepare(
    `SELECT id, task, result, target_id, account_handle, error_code, occurred_at
     FROM community_action_events
     WHERE platform = 'x' AND account_handle = ? AND occurred_at >= ?
     ORDER BY occurred_at DESC
     LIMIT ?`,
  ).bind(handle, oldest, COMMUNITY_ACTION_EVENT_LIMIT * 300).all()
  return {
    ok: true,
    accountHandle: handle,
    dailyReports: (daily?.results || []).map((row) => ({
      date: String(row.report_date || ''), accountHandle: String(row.account_handle || handle),
      counts: { comments: Number(row.comments) || 0, likes: Number(row.likes) || 0, follows: Number(row.follows) || 0, unfollows: Number(row.unfollows) || 0, followBacks: Number(row.follow_backs) || 0 },
      eventIds: [], updatedAt: Number(row.uploaded_at) || 0, uploadedAt: Number(row.uploaded_at) || 0,
    })),
    events: (events?.results || []).map((row) => ({
      id: String(row.id || ''), task: String(row.task || ''), result: String(row.result || ''),
      targetId: String(row.target_id || ''), accountHandle: String(row.account_handle || handle),
      errorCode: String(row.error_code || ''), occurredAt: Number(row.occurred_at) || 0,
    })),
  }
}

export const X_MONITOR_EVENT_PAGE_SIZE = 20
export const X_MONITOR_REPORT_PAGE_SIZE = 20
export const X_MONITOR_TREND_DAYS = 14

export function buildXMonitorTrend(rows, endDate, platform = 'x') {
  const end = Date.parse(`${endDate}T00:00:00Z`)
  const days = Array.from({ length: X_MONITOR_TREND_DAYS }, (_, index) => {
    const date = new Date(end - (X_MONITOR_TREND_DAYS - 1 - index) * 86400000).toISOString().slice(0, 10)
    return { date, success: 0, failed: 0, skipped: 0, limited: 0, tasks: {} }
  })
  const byDate = new Map(days.map((day) => [day.date, day]))
  for (const row of rows) {
    const day = byDate.get(String(row.date || ''))
    if (!day || !COMMUNITY_ACTION_RESULTS.includes(row.result) || !taskFor(platform, row.task)) continue
    const count = Number(row.count) || 0
    day[row.result] += count
    if (!day.tasks[row.task]) day.tasks[row.task] = { success: 0, failed: 0, skipped: 0, limited: 0 }
    day.tasks[row.task][row.result] += count
  }
  return days
}

export function xMonitorDateRange(date, now = Date.now()) {
  const selectedDate = String(date || shanghaiDateKey(now))
  const minDate = shanghaiDateKey(now - 365 * 24 * 60 * 60 * 1000)
  const maxDate = shanghaiDateKey(now)
  const parsed = Date.parse(`${selectedDate}T00:00:00+08:00`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate) || !Number.isFinite(parsed) ||
    shanghaiDateKey(parsed) !== selectedDate ||
    selectedDate < minDate || selectedDate > maxDate) return null
  return { selectedDate, minDate, maxDate, start: parsed, end: parsed + 24 * 60 * 60 * 1000 }
}

export function presentExtensionMonitor({ platform = 'x', devices = [], runtimes = [], recentEvents = [], events = [], taskCounts = [], trendRows = [], dailyReports = [], eventTotal = 0, reportTotal = 0, dateRange, offset = 0, reportOffset = 0, now = Date.now(), migrationRequired = false, dailyMigrationRequired = false, countsMigrationRequired = false } = {}) {
  const runtimeByDevice = new Map(runtimes.map((row) => [row.device_id, row]))
  const countsByTask = new Map()
  for (const row of taskCounts) {
    if (!countsByTask.has(row.task)) countsByTask.set(row.task, { success: 0, failed: 0, skipped: 0, limited: 0 })
    if (COMMUNITY_ACTION_RESULTS.includes(row.result)) countsByTask.get(row.task)[row.result] = Number(row.count) || 0
  }
  const recentByDevice = new Map()
  for (const row of recentEvents) {
    if (!recentByDevice.has(row.device_id)) recentByDevice.set(row.device_id, [])
    recentByDevice.get(row.device_id).push(row)
  }
  const items = devices.map((row) => {
    const runtime = runtimeByDevice.get(row.id)
    const lastSeenAt = Number(row.last_seen_at) || 0
    const online = lastSeenAt >= now - COMMUNITY_ACTION_ONLINE_MS
    const recent = recentByDevice.get(row.id) || []
    let tasks = []
    try { tasks = JSON.parse(runtime?.tasks_json || '[]') } catch {}
    if (!Array.isArray(tasks)) tasks = []
    const telemetry = Boolean(runtime && Number(runtime.reported_at) >= now - COMMUNITY_ACTION_ONLINE_MS)
    const phase = !online ? 'offline' : platform !== 'x' ? 'online' : !telemetry ? 'unknown' : tasks.some((task) => task.phase === 'running') ? 'running' : runtime.flow_phase === 'paused' || tasks.some((task) => task.phase === 'paused') ? 'paused' : runtime.flow_phase === 'stopping' ? 'stopping' : 'idle'
    const withLabel = (event) => event ? { ...event, taskLabel: communityActionTaskLabel(platform, event.task) } : null
    const lastAction = withLabel(recent[0])
    const lastFailure = withLabel(recent.find((event) => event.result === 'failed' || event.result === 'limited'))
    return {
      id: row.id, accountHandle: row.account_handle || runtime?.account_handle || '', extensionVersion: row.extension_version || '',
      lastSeenAt, online, telemetry, phase, tasks, lastAction, lastFailure,
    }
  })
  return { now, platform, migrationRequired, dailyMigrationRequired, countsMigrationRequired, devices: items,
    selectedDate: dateRange?.selectedDate || shanghaiDateKey(now), minDate: dateRange?.minDate || shanghaiDateKey(now - 365 * 24 * 60 * 60 * 1000), maxDate: dateRange?.maxDate || shanghaiDateKey(now),
    tasks: COMMUNITY_ACTION_TASKS.filter((task) => task.platform === platform).map((task) => ({ ...task, ...(countsByTask.get(task.task) || { success: 0, failed: 0, skipped: 0, limited: 0 }) })),
    trend: buildXMonitorTrend(trendRows, shanghaiDateKey(now), platform),
    dailyReports: dailyReports.map((row) => ({
      deviceId: String(row.device_id || ''), accountHandle: String(row.account_handle || ''),
      comments: Number(row.comments) || 0, likes: Number(row.likes) || 0,
      follows: Number(row.follows) || 0, unfollows: Number(row.unfollows) || 0,
      followBacks: Number(row.follow_backs) || 0, uploadedAt: Number(row.uploaded_at) || 0,
    })),
    eventTotal, offset, limit: X_MONITOR_EVENT_PAGE_SIZE, reportTotal, reportOffset, reportLimit: X_MONITOR_REPORT_PAGE_SIZE,
    events: events.map((row) => ({
    id: row.id, deviceId: row.device_id, task: row.task, taskLabel: communityActionTaskLabel(platform, row.task),
    result: row.result, errorCode: row.error_code || '', targetId: row.target_id || '', accountHandle: row.account_handle || '', occurredAt: Number(row.occurred_at) || 0,
  })) }
}

export const presentXExtensionMonitor = presentExtensionMonitor

async function readExtensionMonitorLiveRows(db, platform, now) {
  const [devicesResult, recentResult] = await Promise.all([
    db.prepare(`SELECT id, account_handle, extension_version, last_seen_at FROM community_action_devices WHERE platform = ? ORDER BY last_seen_at DESC LIMIT 30`).bind(platform).all(),
    db.prepare(`SELECT id, device_id, task, result, error_code, account_handle, occurred_at FROM community_action_events WHERE platform = ? AND occurred_at >= ? ORDER BY occurred_at DESC LIMIT 300`).bind(platform, now - 7 * 24 * 60 * 60 * 1000).all(),
  ])
  let runtimes = []
  let migrationRequired = false
  if (platform === 'x') try {
    const result = await db.prepare('SELECT device_id, account_handle, flow_phase, tasks_json, reported_at FROM x_extension_runtime ORDER BY reported_at DESC LIMIT 30').all()
    runtimes = result?.results || []
  } catch (error) {
    if (!/no such table/i.test(String(error?.message || error))) throw error
    migrationRequired = true
  }
  return { devices: devicesResult?.results || [], recentEvents: recentResult?.results || [], runtimes, migrationRequired }
}

export async function readXExtensionLive(db, { now = Date.now() } = {}) {
  return readExtensionLive(db, { platform: 'x', now })
}

export async function readExtensionLive(db, { platform = 'x', now = Date.now() } = {}) {
  if (!COMMUNITY_ACTION_PLATFORMS.includes(platform)) throw new RangeError('INVALID_PLATFORM')
  const live = await readExtensionMonitorLiveRows(db, platform, now)
  const { devices } = presentExtensionMonitor({ ...live, platform, now })
  return { now, platform, devices, migrationRequired: live.migrationRequired }
}

export async function readExtensionMonitor(db, { platform = 'x', date, offset = 0, reportOffset = 0, now = Date.now() } = {}) {
  if (!COMMUNITY_ACTION_PLATFORMS.includes(platform)) throw new RangeError('INVALID_PLATFORM')
  const dateRange = xMonitorDateRange(date, now)
  if (!dateRange) throw new RangeError('INVALID_DATE')
  const safeOffset = Number.isSafeInteger(offset) && offset >= 0 ? offset : 0
  const safeReportOffset = Number.isSafeInteger(reportOffset) && reportOffset >= 0 ? reportOffset : 0
  const [live, eventsResult] = await Promise.all([
    readExtensionMonitorLiveRows(db, platform, now),
    db.prepare(`SELECT id, device_id, task, result, target_id, error_code, account_handle, occurred_at FROM community_action_events WHERE platform = ? AND occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at DESC LIMIT ? OFFSET ?`).bind(platform, dateRange.start, dateRange.end, X_MONITOR_EVENT_PAGE_SIZE, safeOffset).all(),
  ])
  let taskCounts = []
  let trendRows = []
  let countsMigrationRequired = false
  try {
    if (platform !== 'x') {
      const trigger = await db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'trigger' AND name = 'trg_community_action_daily_counts_insert'`).first()
      if (!/NEW\.platform\s+IN\s*\('x',\s*'xhs',\s*'juejin'\)/i.test(String(trigger?.sql || ''))) countsMigrationRequired = true
    }
    const trendEnd = shanghaiDateKey(now)
    const trendStart = new Date(Date.parse(`${trendEnd}T00:00:00Z`) - (X_MONITOR_TREND_DAYS - 1) * 86400000).toISOString().slice(0, 10)
    if (!countsMigrationRequired) {
      const [countsResult, trendResult] = await Promise.all([
        db.prepare(`SELECT task, result, count FROM community_action_daily_counts WHERE platform = ? AND report_date = ?`).bind(platform, dateRange.selectedDate).all(),
        db.prepare(`SELECT report_date AS date, task, result, count FROM community_action_daily_counts WHERE platform = ? AND report_date >= ? AND report_date <= ?`).bind(platform, trendStart, trendEnd).all(),
      ])
      taskCounts = countsResult?.results || []
      trendRows = trendResult?.results || []
    }
  } catch (error) {
    if (!/no such table: community_action_daily_counts/i.test(String(error?.message || error))) throw error
    countsMigrationRequired = true
  }
  let dailyReports = []
  let reportTotal = 0
  let dailyMigrationRequired = false
  if (platform === 'x') try {
    const [result, total] = await Promise.all([
      db.prepare(`SELECT device_id, account_handle, comments, likes, follows, unfollows, follow_backs, uploaded_at FROM x_extension_daily_reports WHERE report_date = ? ORDER BY uploaded_at DESC LIMIT ? OFFSET ?`).bind(dateRange.selectedDate, X_MONITOR_REPORT_PAGE_SIZE, safeReportOffset).all(),
      db.prepare(`SELECT COUNT(*) AS total FROM x_extension_daily_reports WHERE report_date = ?`).bind(dateRange.selectedDate).first(),
    ])
    dailyReports = result?.results || []
    reportTotal = Number(total?.total) || 0
  } catch (error) {
    if (!/no such table/i.test(String(error?.message || error))) throw error
    dailyMigrationRequired = true
  }
  let eventTotal = taskCounts.reduce((sum, row) => sum + (Number(row.count) || 0), 0)
  if (countsMigrationRequired) {
    const total = await db.prepare(`SELECT COUNT(*) AS total FROM community_action_events WHERE platform = ? AND occurred_at >= ? AND occurred_at < ?`).bind(platform, dateRange.start, dateRange.end).first()
    eventTotal = Number(total?.total) || 0
  }
  return presentExtensionMonitor({ ...live, platform, events: eventsResult?.results || [], taskCounts, trendRows, dailyReports, eventTotal, reportTotal, dateRange, offset: safeOffset, reportOffset: safeReportOffset, now, dailyMigrationRequired, countsMigrationRequired })
}

export async function readXExtensionMonitor(db, options = {}) {
  return readExtensionMonitor(db, { ...options, platform: 'x' })
}

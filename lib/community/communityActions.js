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
  { platform: 'xhs', task: 'recommend-comment', label: '推荐评论' },
  { platform: 'xhs', task: 'note-post', label: '笔记浇给' },
  { platform: 'juejin', task: 'daily-checkin', label: '每日签到' },
  { platform: 'juejin', task: 'pin-post', label: '发布沸点' },
  { platform: 'juejin', task: 'article-post', label: '文章 / 草稿' },
])

export const COMMUNITY_ACTION_RESULTS = Object.freeze(['success', 'failed', 'skipped', 'limited'])

export const COMMUNITY_ACTION_LINKS = Object.freeze([
  { href: '/admin/community-actions?tab=extension', label: '浏览器插件', note: '依赖本机登录态；收密钥、心跳和确认回执。' },
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
  }
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
    accepted += Number(result?.meta?.changes || 0)
  }
  return { ok: true, accepted }
}

export async function readCommunityActionCenter(db, now = Date.now()) {
  const since = shanghaiDayStart(now)
  const [devicesResult, countsResult, recentResult] = await Promise.all([
    db.prepare(
      `SELECT id, platform, extension_version, account_handle, last_seen_at, created_at
       FROM community_action_devices
       ORDER BY last_seen_at DESC
       LIMIT 20`,
    ).all(),
    db.prepare(
      `SELECT platform, task, result, COUNT(*) AS count
       FROM community_action_events
       WHERE occurred_at >= ?
       GROUP BY platform, task, result`,
    ).bind(since).all(),
    db.prepare(
      `SELECT id, device_id, platform, task, result, target_id, account_handle, error_code, extension_version, occurred_at
       FROM community_action_events
       ORDER BY occurred_at DESC
       LIMIT ?`,
    ).bind(COMMUNITY_ACTION_RECENT_LIMIT).all(),
  ])
  return presentCommunityActionCenter({
    devices: devicesResult?.results || [],
    counts: countsResult?.results || [],
    recent: recentResult?.results || [],
    now,
  })
}

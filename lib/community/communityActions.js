import { shanghaiDateKey } from '../automation/dailyGreeting.js'
import { X_EXTENSION_LATEST_VERSION, isExtensionVersionOutdated } from './xExtensionVersion.js'

export { X_EXTENSION_LATEST_VERSION, compareExtensionVersions, isExtensionVersionOutdated } from './xExtensionVersion.js'

export const COMMUNITY_ACTION_SECRET_KEY = 'community_action.report_secret'
export const COMMUNITY_ACTION_SECRET_HEADER = 'x-community-action-secret'
export const COMMUNITY_ACTION_REPORT_URL = 'https://2aran.com/api/community-actions/report'
/** 监控心跳约每分钟；在线窗口略宽于心跳间隔。次数统计另走小时级同步。 */
export const COMMUNITY_ACTION_ONLINE_MS = 5 * 60 * 1000
export const COMMUNITY_ACTION_HEARTBEAT_WRITE_MS = 2 * 60 * 1000
export const COMMUNITY_ACTION_EVENT_LIMIT = 20
export const COMMUNITY_ACTION_RECENT_LIMIT = 40
/** 插件从云端拉回执时的上限；过大且无账号索引时会一次扫几千到上万行。 */
export const COMMUNITY_ACTION_HISTORY_EVENT_LIMIT = 500
export const COMMUNITY_ACTION_HISTORY_DAILY_LIMIT = 120
export const COMMUNITY_ACTION_HISTORY_DAYS = 90

export const COMMUNITY_ACTION_TASKS = Object.freeze([
  { platform: 'x', task: 'timeline-reply', label: '评论帖子' },
  { platform: 'x', task: 'notification-reply', label: '回复评论' },
  { platform: 'x', task: 'mutual-unfollow', label: '清理未回关' },
  { platform: 'x', task: 'mutual-follow-back', label: '回关粉丝' },
  { platform: 'x', task: 'mutual-target-follow', label: '关注候选' },
  { platform: 'x', task: 'tweet-post', label: '定时发帖' },
  { platform: 'x', task: 'post-like', label: '点赞帖子' },
  { platform: 'x', task: 'reply-like', label: '点赞评论' },
  { platform: 'xhs', task: 'recommend-comment', label: '推荐评论' },
  { platform: 'xhs', task: 'note-post', label: '笔记浇给' },
  { platform: 'juejin', task: 'daily-checkin', label: '每日签到' },
  { platform: 'juejin', task: 'pin-post', label: '发布沸点' },
  { platform: 'juejin', task: 'article-post', label: '文章 / 草稿' },
])

export const COMMUNITY_ACTION_RESULTS = Object.freeze(['success', 'failed', 'skipped', 'limited'])
export const COMMUNITY_ACTION_PLATFORMS = Object.freeze(['x', 'xhs', 'juejin'])
export const DEFAULT_X_MONITOR_ACCOUNT = 'tarsixseveneig1'
export const X_MONITOR_ACCOUNT_ORDER = Object.freeze([DEFAULT_X_MONITOR_ACCOUNT, 'tuaranx'])

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
  const handle = cleanText(value, 40).replace(/^@+/u, '').replace(/\s+/g, '')
  return handle.toLowerCase() === 'default' ? '' : handle
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
    runtime: platform === 'x' && body?.runtime ? normalizeXRuntime(body.runtime, now) : null,
    commandResults: platform === 'x' ? normalizeXCommandResults(body?.commandResults, now) : [],
  }
}

const X_RUNTIME_MODES = new Set(['timeline', 'notifications', 'likes-posts', 'likes-replies', 'poster', 'poster-premium', 'mutual-unfollow', 'mutual-followBack', 'mutual-targetFollow'])
const X_RUNTIME_PHASES = new Set(['running', 'paused', 'stopping', 'stopped', 'idle'])
const X_TASK_PHASES = new Set(['running', 'paused', 'waiting', 'stopping', 'idle', 'unknown'])
const X_RUNTIME_MODE_LABELS = Object.freeze({
  timeline: '评论帖子',
  notifications: '回复评论',
  'likes-posts': '点赞帖子',
  'likes-replies': '点赞评论',
  poster: '普通发帖',
  'poster-premium': '精品发帖',
  'mutual-unfollow': '清理未回关',
  'mutual-followBack': '回关粉丝',
  'mutual-targetFollow': '关注候选',
})

/** Align with extension defaultTaskPriority (回复评论 > … > 取消未回关). */
export const X_DEFAULT_TASK_PRIORITY = Object.freeze({
  notifications: 9,
  timeline: 8,
  'poster-premium': 7,
  poster: 6,
  'likes-posts': 5,
  'likes-replies': 5,
  'mutual-followBack': 4,
  'mutual-targetFollow': 3,
  'mutual-unfollow': 2,
})

export const X_SCHEDULE_PRIORITY_HINT = '优先级 1～10 分，分值越大越重要'

export const X_PRIORITY_LABELS = Object.freeze(Object.fromEntries(
  Array.from({ length: 10 }, (_, index) => {
    const score = index + 1
    return [score, `${score}分`]
  })
))

export function xPriorityLabel(priority) {
  const rank = Math.max(1, Math.min(10, Number(priority) || 1))
  return X_PRIORITY_LABELS[rank] || `${rank}分`
}

export const X_RUNTIME_GROUPS = Object.freeze([
  { id: 'reply', label: '评论 · 默认 8～9 分', modes: ['notifications', 'timeline'] },
  { id: 'poster', label: '发帖 · 默认 6～7 分', modes: ['poster-premium', 'poster'] },
  { id: 'likes', label: '点赞 · 默认 5 分（短轮约 3 分钟）', modes: ['likes-posts', 'likes-replies'] },
  { id: 'mutual', label: '关注 · 默认 2～4 分', modes: ['mutual-followBack', 'mutual-targetFollow', 'mutual-unfollow'] },
])

export function defaultXTaskPriority(mode) {
  return Number(X_DEFAULT_TASK_PRIORITY[mode]) || 1
}

function normalizeXScheduleSnapshot(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object') return null
  const labelOf = (mode) => X_RUNTIME_MODE_LABELS[mode] || String(mode || '')
  const past = raw.past && X_RUNTIME_MODES.has(raw.past.mode) ? {
    mode: raw.past.mode,
    label: cleanText(raw.past.label, 32) || labelOf(raw.past.mode),
    actions: Math.max(0, Number(raw.past.actions) || 0),
    reason: cleanText(raw.past.reason, 100),
    endedAt: Number(raw.past.endedAt) || 0,
  } : null
  const currentMode = X_RUNTIME_MODES.has(raw.current) ? raw.current : (raw.now?.mode && X_RUNTIME_MODES.has(raw.now.mode) ? raw.now.mode : '')
  const nowCard = currentMode ? {
    mode: currentMode,
    label: cleanText(raw.now?.label, 32) || labelOf(currentMode),
    actions: Math.max(0, Number(raw.now?.actions) || 0),
  } : null
  const next = raw.next && X_RUNTIME_MODES.has(raw.next.mode) ? {
    mode: raw.next.mode,
    label: cleanText(raw.next.label, 32) || labelOf(raw.next.mode),
    status: ['ready', 'scheduled'].includes(raw.next.status) ? raw.next.status : 'scheduled',
    readyAt: Number(raw.next.readyAt) || 0,
    reason: cleanText(raw.next.reason, 100),
  } : null
  const facingRaw = raw.facing && typeof raw.facing === 'object' ? raw.facing : {}
  return {
    enabled: Boolean(raw.enabled),
    current: currentMode,
    startedAt: Number(raw.startedAt) || 0,
    sliceSeconds: [20, 30, 45].includes(Number(raw.sliceSeconds)) ? Number(raw.sliceSeconds) : 30,
    priorityHint: cleanText(raw.priorityHint, 120) || X_SCHEDULE_PRIORITY_HINT,
    past,
    now: nowCard,
    next,
    facing: {
      running: Math.max(0, Number(facingRaw.running) || 0),
      waiting: Math.max(0, Number(facingRaw.waiting) || 0),
      needs: Math.max(0, Number(facingRaw.needs) || 0),
      stopped: Math.max(0, Number(facingRaw.stopped) || 0),
    },
    reportedAt: now,
  }
}

export function normalizeXRuntime(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object' || !X_RUNTIME_PHASES.has(raw.phase) || !Array.isArray(raw.tasks)) return null
  const seen = new Set()
  const tasks = []
  for (const task of raw.tasks.slice(0, 12)) {
    if (!X_RUNTIME_MODES.has(task?.mode) || !X_TASK_PHASES.has(task?.phase) || seen.has(task.mode)) continue
    seen.add(task.mode)
    const phase = task.phase === 'waiting' ? 'paused' : task.phase
    const waitUntil = Number(task.waitUntil) || 0
    const freshWait = waitUntil >= now - 60 * 1000 && waitUntil <= now + 48 * 60 * 60 * 1000
    const priority = Math.max(1, Math.min(10, Number(task.priority) || defaultXTaskPriority(task.mode)))
    tasks.push({
      mode: task.mode,
      phase,
      priority,
      startedAt: Number(task.startedAt) || 0,
      updatedAt: Number(task.updatedAt) || 0,
      detail: cleanText(task.detail, 160),
      waitUntil: freshWait ? Math.floor(waitUntil) : 0,
    })
  }
  return { phase: raw.phase, tasks, schedule: normalizeXScheduleSnapshot(raw.schedule, now) }
}

export function parseXRuntimeTasksJson(value) {
  try {
    const parsed = JSON.parse(value || '[]')
    if (Array.isArray(parsed)) return { tasks: parsed, schedule: null }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.tasks)) {
      return { tasks: parsed.tasks, schedule: parsed.schedule && typeof parsed.schedule === 'object' ? parsed.schedule : null }
    }
  } catch {}
  return { tasks: [], schedule: null }
}

export function presentXTaskFace(phase) {
  if (phase === 'running') return { key: 'running', label: '运行中', tone: 'info' }
  if (phase === 'waiting' || phase === 'paused' || phase === 'stopping') return { key: 'waiting', label: '等待中', tone: 'warning' }
  if (phase === 'blocked' || phase === 'unknown') return { key: 'needs', label: '需处理', tone: 'warning' }
  return { key: 'stopped', label: '已停止', tone: 'neutral' }
}

function runtimeStateKey(tasks) {
  return (Array.isArray(tasks) ? tasks : [])
    .map((task) => `${task.mode}:${task.phase}:${Number(task.waitUntil) || 0}`)
    .sort()
    .join('|')
}

export function presentXRuntimeGroups(tasks = []) {
  const byMode = new Map((Array.isArray(tasks) ? tasks : []).map((task) => [task.mode, task]))
  return X_RUNTIME_GROUPS.map((group) => {
    const items = group.modes.map((mode) => {
      const task = byMode.get(mode)
      const phase = task?.phase === 'paused' ? 'waiting' : (task?.phase || 'idle')
      return {
        mode,
        phase,
        priority: Math.max(1, Math.min(10, Number(task?.priority) || defaultXTaskPriority(mode))),
        label: X_RUNTIME_MODE_LABELS[mode] || mode,
        updatedAt: Number(task?.updatedAt) || 0,
        detail: String(task?.detail || ''),
        waitUntil: Number(task?.waitUntil) || 0,
      }
    })
    const phase = items.some((item) => item.phase === 'running') ? 'running'
      : items.some((item) => item.phase === 'waiting') ? 'waiting'
        : items.some((item) => item.phase === 'stopping') ? 'stopping'
          : items.some((item) => item.phase === 'unknown') ? 'unknown'
            : 'idle'
    return { id: group.id, label: group.label, phase, tasks: items }
  })
}

export const X_REMOTE_COMMANDS = Object.freeze(['flow-start', 'flow-pause', 'task-start', 'task-stop', 'ext-update'])
export const X_REMOTE_COMMAND_MODES = Object.freeze([...X_RUNTIME_MODES])
const X_COMMAND_STATUSES = new Set(['pending', 'claimed', 'done', 'failed', 'expired'])
const X_COMMAND_EXPIRE_MS = 30 * 60 * 1000

export function createXRemoteCommandId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `cmd-${Date.now()}-${Math.random().toString(16).slice(2, 12)}`
}

export function normalizeXRemoteCommand(raw) {
  const command = String(raw?.command || '')
  const mode = String(raw?.mode || '')
  if (!X_REMOTE_COMMANDS.includes(command)) return null
  if ((command === 'task-start' || command === 'task-stop') && !X_RUNTIME_MODES.has(mode)) return null
  if ((command === 'flow-start' || command === 'flow-pause' || command === 'ext-update') && mode) return null
  return { command, mode: command.startsWith('task-') ? mode : '' }
}

export function normalizeXCommandResults(raw, now = Date.now()) {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 20).map((item) => {
    const id = String(item?.id || '')
    const status = String(item?.status || '')
    if (!ID_RE.test(id) || !['done', 'failed'].includes(status)) return null
    return { id, status, result: cleanText(item?.result, 160), finishedAt: now }
  }).filter(Boolean)
}

export async function enqueueXRemoteCommand(db, { deviceId, command, mode = '' }, now = Date.now()) {
  const device = String(deviceId || '')
  const normalized = normalizeXRemoteCommand({ command, mode })
  if (!ID_RE.test(device) || !normalized) return { ok: false, error: 'INVALID_COMMAND' }
  const id = createXRemoteCommandId()
  await db.prepare(
    `INSERT INTO x_extension_commands (id, device_id, command, mode, status, result, created_at)
     VALUES (?, ?, ?, ?, 'pending', '', ?)`,
  ).bind(id, device, normalized.command, normalized.mode, now).run()
  return { ok: true, id, command: normalized.command, mode: normalized.mode, createdAt: now }
}

export async function claimPendingXCommands(db, deviceId, now = Date.now()) {
  const device = String(deviceId || '')
  if (!ID_RE.test(device)) return []
  const cutoff = now - X_COMMAND_EXPIRE_MS
  try {
    await db.prepare(
      `UPDATE x_extension_commands SET status = 'expired', finished_at = ?
       WHERE device_id = ? AND status = 'pending' AND created_at < ?`,
    ).bind(now, device, cutoff).run()
    const pending = await db.prepare(
      `SELECT id, command, mode, created_at FROM x_extension_commands
       WHERE device_id = ? AND status = 'pending'
       ORDER BY created_at ASC LIMIT 8`,
    ).bind(device).all()
    const rows = pending?.results || []
    for (const row of rows) {
      await db.prepare(
        `UPDATE x_extension_commands SET status = 'claimed', claimed_at = ? WHERE id = ? AND status = 'pending'`,
      ).bind(now, row.id).run()
    }
    return rows.map((row) => ({
      id: String(row.id || ''),
      command: String(row.command || ''),
      mode: String(row.mode || ''),
      createdAt: Number(row.created_at) || 0,
    }))
  } catch (error) {
    if (/no such table/i.test(String(error?.message || error))) return []
    throw error
  }
}

export async function finishXCommandResults(db, deviceId, results, now = Date.now()) {
  const device = String(deviceId || '')
  if (!ID_RE.test(device) || !results.length) return 0
  let finished = 0
  for (const item of results) {
    const result = await db.prepare(
      `UPDATE x_extension_commands
       SET status = ?, result = ?, finished_at = ?
       WHERE id = ? AND device_id = ? AND status IN ('pending', 'claimed')`,
    ).bind(item.status, item.result, item.finishedAt || now, item.id, device).run()
    if (Number(result?.meta?.changes || 0) > 0) finished += 1
  }
  return finished
}

export async function readRecentXCommands(db, deviceIds = [], now = Date.now()) {
  const ids = [...new Set((deviceIds || []).map((id) => String(id || '')).filter((id) => ID_RE.test(id)))].slice(0, 30)
  if (!ids.length) return []
  try {
    const placeholders = ids.map(() => '?').join(',')
    const result = await db.prepare(
      `SELECT id, device_id, command, mode, status, result, created_at, claimed_at, finished_at
       FROM x_extension_commands
       WHERE device_id IN (${placeholders}) AND created_at >= ?
       ORDER BY created_at DESC LIMIT 120`,
    ).bind(...ids, now - 24 * 60 * 60 * 1000).all()
    return (result?.results || []).map((row) => ({
      id: String(row.id || ''),
      deviceId: String(row.device_id || ''),
      command: String(row.command || ''),
      mode: String(row.mode || ''),
      modeLabel: X_RUNTIME_MODE_LABELS[row.mode] || '',
      status: X_COMMAND_STATUSES.has(row.status) ? row.status : 'pending',
      result: String(row.result || ''),
      createdAt: Number(row.created_at) || 0,
      claimedAt: Number(row.claimed_at) || 0,
      finishedAt: Number(row.finished_at) || 0,
    }))
  } catch (error) {
    if (/no such table/i.test(String(error?.message || error))) return []
    throw error
  }
}

export function normalizeXDailyReport(raw, now = Date.now()) {
  const date = String(raw?.date || '')
  const today = shanghaiDateKey(now)
  const oldest = shanghaiDateKey(now - 365 * 24 * 60 * 60 * 1000)
  const parsedDate = Date.parse(`${date}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < oldest || date > today || !Number.isFinite(parsedDate) || new Date(parsedDate).toISOString().slice(0, 10) !== date) return null
  const fields = ['comments', 'likes', 'follows', 'unfollows', 'followBacks', 'posts']
  const counts = {}
  for (const field of fields) {
    const value = field === 'posts' && raw?.counts?.posts === undefined ? 0 : raw?.counts?.[field]
    if (typeof value !== 'number') return null
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
       last_seen_at = excluded.last_seen_at
     WHERE community_action_devices.last_seen_at <= ?
        OR community_action_devices.platform != excluded.platform
        OR community_action_devices.extension_version != excluded.extension_version
        OR (excluded.account_handle != '' AND community_action_devices.account_handle != excluded.account_handle)`,
  ).bind(
    normalized.deviceId,
    normalized.platform,
    normalized.extensionVersion,
    normalized.accountHandle,
    now,
    now,
    now - COMMUNITY_ACTION_HEARTBEAT_WRITE_MS,
  ).run()

  if (normalized.runtime) {
    try {
      const previous = await db.prepare(
        'SELECT flow_phase, tasks_json, reported_at FROM x_extension_runtime WHERE device_id = ?',
      ).bind(normalized.deviceId).first()
      let previousTasks = []
      let previousSchedule = null
      let malformedSnapshot = false
      try {
        const parsed = parseXRuntimeTasksJson(previous?.tasks_json || '[]')
        previousTasks = parsed.tasks
        previousSchedule = parsed.schedule
      } catch { malformedSnapshot = true }
      const nextSnapshot = {
        tasks: normalized.runtime.tasks,
        schedule: normalized.runtime.schedule || null,
      }
      const scheduleKey = (snapshot) => snapshot ? `${Boolean(snapshot.enabled)}:${snapshot.current || ''}:${snapshot.next?.mode || ''}:${Number(snapshot.next?.readyAt) || 0}` : ''
      const stateChanged = malformedSnapshot || previous?.flow_phase !== normalized.runtime.phase
        || runtimeStateKey(previousTasks) !== runtimeStateKey(normalized.runtime.tasks)
        || scheduleKey(previousSchedule) !== scheduleKey(normalized.runtime.schedule)
      if (!previous || stateChanged || Number(previous.reported_at) <= now - COMMUNITY_ACTION_HEARTBEAT_WRITE_MS) await db.prepare(
        `INSERT INTO x_extension_runtime (device_id, account_handle, flow_phase, tasks_json, reported_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(device_id) DO UPDATE SET
           account_handle = CASE WHEN excluded.account_handle != '' THEN excluded.account_handle ELSE x_extension_runtime.account_handle END,
           flow_phase = excluded.flow_phase, tasks_json = excluded.tasks_json, reported_at = excluded.reported_at`,
      ).bind(normalized.deviceId, normalized.accountHandle, normalized.runtime.phase, JSON.stringify(nextSnapshot), now).run()
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
       (device_id, report_date, account_handle, comments, likes, follows, unfollows, follow_backs, posts, extension_version, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(device_id, report_date, account_handle) DO UPDATE SET
         comments = excluded.comments, likes = excluded.likes, follows = excluded.follows,
         unfollows = excluded.unfollows, follow_backs = excluded.follow_backs, posts = excluded.posts,
         extension_version = excluded.extension_version, uploaded_at = excluded.uploaded_at`,
    ).bind(
      normalized.deviceId, daily.date, daily.accountHandle,
      daily.counts.comments, daily.counts.likes, daily.counts.follows,
      daily.counts.unfollows, daily.counts.followBacks, daily.counts.posts, normalized.extensionVersion, now,
    ).run()
  }
  let commandsFinished = 0
  try {
    commandsFinished = await finishXCommandResults(db, normalized.deviceId, normalized.commandResults, now)
  } catch (error) {
    if (!/no such table|is not a function/i.test(String(error?.message || error))) throw error
  }
  let commands = []
  try {
    commands = await claimPendingXCommands(db, normalized.deviceId, now)
  } catch (error) {
    if (!/no such table|is not a function/i.test(String(error?.message || error))) throw error
  }
  return {
    ok: true,
    accepted,
    dailyReportSaved: Boolean(normalized.dailyReport),
    commandsFinished,
    commands,
  }
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
  const oldest = now - COMMUNITY_ACTION_HISTORY_DAYS * 24 * 60 * 60 * 1000
  const daily = await db.prepare(
    `SELECT report_date, account_handle, comments, likes, follows, unfollows, follow_backs, posts, uploaded_at
     FROM x_extension_daily_reports
     WHERE account_handle = ?
     ORDER BY report_date DESC, uploaded_at DESC
     LIMIT ?`,
  ).bind(handle, COMMUNITY_ACTION_HISTORY_DAILY_LIMIT).all()
  const events = await db.prepare(
    `SELECT id, task, result, target_id, account_handle, error_code, occurred_at
     FROM community_action_events
     WHERE platform = 'x' AND account_handle = ? AND occurred_at >= ?
     ORDER BY occurred_at DESC
     LIMIT ?`,
  ).bind(handle, oldest, COMMUNITY_ACTION_HISTORY_EVENT_LIMIT).all()
  return {
    ok: true,
    accountHandle: handle,
    dailyReports: (daily?.results || []).map((row) => ({
      date: String(row.report_date || ''), accountHandle: String(row.account_handle || handle),
      counts: { comments: Number(row.comments) || 0, likes: Number(row.likes) || 0, follows: Number(row.follows) || 0, unfollows: Number(row.unfollows) || 0, followBacks: Number(row.follow_backs) || 0, posts: Number(row.posts) || 0 },
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
/** 按账号看趋势时只能扫 events；比全站 daily_counts 更贵，窗口收短。 */
export const X_MONITOR_ACCOUNT_TREND_DAYS = 7

export function buildXMonitorTrend(rows, endDate, platform = 'x', dayCount = X_MONITOR_TREND_DAYS) {
  const daysWanted = Math.max(1, Math.min(31, Number(dayCount) || X_MONITOR_TREND_DAYS))
  const end = Date.parse(`${endDate}T00:00:00Z`)
  const days = Array.from({ length: daysWanted }, (_, index) => {
    const date = new Date(end - (daysWanted - 1 - index) * 86400000).toISOString().slice(0, 10)
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

export function resolveMonitorAccountHandle(platform, accountHandle = '') {
  const handle = cleanHandle(accountHandle)
  if (handle === '__all__') return ''
  if (platform === 'x') return handle || DEFAULT_X_MONITOR_ACCOUNT
  return handle
}

export function compareMonitorAccountHandles(left, right) {
  const a = cleanHandle(left).toLowerCase()
  const b = cleanHandle(right).toLowerCase()
  const rank = (handle) => {
    const index = X_MONITOR_ACCOUNT_ORDER.findIndex((item) => item.toLowerCase() === handle)
    return index === -1 ? X_MONITOR_ACCOUNT_ORDER.length : index
  }
  return rank(a) - rank(b) || a.localeCompare(b)
}

export function sortMonitorDevices(devices = []) {
  return [...devices].sort((left, right) => {
    const byAccount = compareMonitorAccountHandles(left?.accountHandle, right?.accountHandle)
    if (byAccount) return byAccount
    return String(left?.id || '').localeCompare(String(right?.id || ''))
  })
}

export function presentExtensionMonitor({ platform = 'x', devices = [], runtimes = [], recentEvents = [], events = [], taskCounts = [], trendRows = [], dailyReports = [], eventTotal = 0, reportTotal = 0, dateRange, offset = 0, reportOffset = 0, now = Date.now(), migrationRequired = false, dailyMigrationRequired = false, countsMigrationRequired = false, accountHandle = '', accounts = [], trendDays = X_MONITOR_TREND_DAYS } = {}) {
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
    const parsedRuntime = parseXRuntimeTasksJson(runtime?.tasks_json || '[]')
    const tasks = Array.isArray(parsedRuntime.tasks) ? parsedRuntime.tasks : []
    const schedule = platform === 'x' ? normalizeXScheduleSnapshot(parsedRuntime.schedule, now) : null
    const telemetry = Boolean(runtime && Number(runtime.reported_at) >= now - COMMUNITY_ACTION_ONLINE_MS)
    const activeTasks = tasks.filter((task) => ['running', 'paused', 'stopping'].includes(task.phase))
    const phase = !online ? 'offline' : platform !== 'x' ? 'online' : !telemetry ? 'unknown' : activeTasks.some((task) => task.phase === 'running') || (schedule?.enabled && schedule.current) ? 'running' : runtime.flow_phase === 'paused' || activeTasks.some((task) => task.phase === 'paused') ? 'paused' : runtime.flow_phase === 'stopping' ? 'stopping' : 'idle'
    const withLabel = (event) => event ? { ...event, taskLabel: communityActionTaskLabel(platform, event.task) } : null
    const lastAction = withLabel(recent[0])
    const lastFailure = withLabel(recent.find((event) => event.result === 'failed' || event.result === 'limited'))
    const groups = platform === 'x' && telemetry ? presentXRuntimeGroups(tasks) : []
    const face = presentXTaskFace(phase === 'offline' ? 'idle' : phase === 'unknown' && !telemetry ? 'unknown' : phase)
    const facing = schedule?.facing || groups.reduce((counts, group) => {
      for (const task of group.tasks) {
        const taskFace = presentXTaskFace(task.phase)
        counts[taskFace.key] += 1
      }
      return counts
    }, { running: 0, waiting: 0, needs: 0, stopped: 0 })
    const extensionVersion = row.extension_version || ''
    return {
      id: row.id, accountHandle: row.account_handle || runtime?.account_handle || '', extensionVersion,
      updateAvailable: platform === 'x' && isExtensionVersionOutdated(extensionVersion),
      lastSeenAt, online, telemetry, phase, face, facing, schedule, tasks, groups, commands: [], lastAction, lastFailure,
    }
  })
  const selectedAccount = cleanHandle(accountHandle)
  // Keep every live instance visible; only trends / day details stay account-scoped.
  // Sort by fixed account order so heartbeats cannot reshuffle the list.
  const scopedDevices = sortMonitorDevices(items)
  const accountOptions = [...new Set([
    ...accounts.map((item) => cleanHandle(item)).filter(Boolean),
    ...items.map((device) => cleanHandle(device.accountHandle)).filter(Boolean),
    ...(selectedAccount ? [selectedAccount] : []),
  ])].filter((item) => item.toLowerCase() !== 'default').sort(compareMonitorAccountHandles)
  return { now, platform, migrationRequired, dailyMigrationRequired, countsMigrationRequired, devices: scopedDevices,
    latestExtensionVersion: platform === 'x' ? X_EXTENSION_LATEST_VERSION : '',
    accountHandle: selectedAccount, accounts: accountOptions,
    selectedDate: dateRange?.selectedDate || shanghaiDateKey(now), minDate: dateRange?.minDate || shanghaiDateKey(now - 365 * 24 * 60 * 60 * 1000), maxDate: dateRange?.maxDate || shanghaiDateKey(now),
    tasks: COMMUNITY_ACTION_TASKS.filter((task) => task.platform === platform).map((task) => ({ ...task, ...(countsByTask.get(task.task) || { success: 0, failed: 0, skipped: 0, limited: 0 }) })),
    trend: buildXMonitorTrend(trendRows, shanghaiDateKey(now), platform, trendDays),
    dailyReports: dailyReports.map((row) => ({
      deviceId: String(row.device_id || ''), accountHandle: String(row.account_handle || ''),
      comments: Number(row.comments) || 0, likes: Number(row.likes) || 0,
      follows: Number(row.follows) || 0, unfollows: Number(row.unfollows) || 0,
      followBacks: Number(row.follow_backs) || 0, posts: Number(row.posts) || 0, uploadedAt: Number(row.uploaded_at) || 0,
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

function attachDeviceCommands(devices, commands) {
  const byDevice = new Map()
  for (const item of commands) {
    if (!byDevice.has(item.deviceId)) byDevice.set(item.deviceId, [])
    byDevice.get(item.deviceId).push(item)
  }
  return devices.map((device) => ({ ...device, commands: (byDevice.get(device.id) || []).slice(0, 8) }))
}

export async function readExtensionLive(db, { platform = 'x', accountHandle = '', now = Date.now() } = {}) {
  if (!COMMUNITY_ACTION_PLATFORMS.includes(platform)) throw new RangeError('INVALID_PLATFORM')
  const selectedAccount = resolveMonitorAccountHandle(platform, accountHandle)
  const live = await readExtensionMonitorLiveRows(db, platform, now)
  const presented = presentExtensionMonitor({ ...live, platform, accountHandle: selectedAccount, now })
  const commands = platform === 'x' ? await readRecentXCommands(db, presented.devices.map((device) => device.id), now) : []
  return {
    now,
    platform,
    accountHandle: presented.accountHandle,
    accounts: presented.accounts,
    latestExtensionVersion: presented.latestExtensionVersion,
    devices: attachDeviceCommands(presented.devices, commands),
    migrationRequired: live.migrationRequired,
  }
}

export async function readExtensionMonitor(db, { platform = 'x', date, accountHandle = '', offset = 0, reportOffset = 0, now = Date.now() } = {}) {
  if (!COMMUNITY_ACTION_PLATFORMS.includes(platform)) throw new RangeError('INVALID_PLATFORM')
  const dateRange = xMonitorDateRange(date, now)
  if (!dateRange) throw new RangeError('INVALID_DATE')
  const selectedAccount = resolveMonitorAccountHandle(platform, accountHandle)
  const safeOffset = Number.isSafeInteger(offset) && offset >= 0 ? offset : 0
  const safeReportOffset = Number.isSafeInteger(reportOffset) && reportOffset >= 0 ? reportOffset : 0
  const eventSql = selectedAccount
    ? `SELECT id, device_id, task, result, target_id, error_code, account_handle, occurred_at FROM community_action_events WHERE platform = ? AND account_handle = ? AND occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at DESC LIMIT ? OFFSET ?`
    : `SELECT id, device_id, task, result, target_id, error_code, account_handle, occurred_at FROM community_action_events WHERE platform = ? AND occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at DESC LIMIT ? OFFSET ?`
  const eventBind = selectedAccount
    ? [platform, selectedAccount, dateRange.start, dateRange.end, X_MONITOR_EVENT_PAGE_SIZE, safeOffset]
    : [platform, dateRange.start, dateRange.end, X_MONITOR_EVENT_PAGE_SIZE, safeOffset]
  const [live, eventsResult, accountsResult] = await Promise.all([
    readExtensionMonitorLiveRows(db, platform, now),
    db.prepare(eventSql).bind(...eventBind).all(),
    db.prepare(`SELECT DISTINCT account_handle FROM community_action_devices WHERE platform = ? AND account_handle != '' ORDER BY account_handle LIMIT 40`).bind(platform).all(),
  ])
  let taskCounts = []
  let trendRows = []
  let countsMigrationRequired = false
  const trendDays = selectedAccount ? X_MONITOR_ACCOUNT_TREND_DAYS : X_MONITOR_TREND_DAYS
  const trendEnd = shanghaiDateKey(now)
  const trendStart = new Date(Date.parse(`${trendEnd}T00:00:00Z`) - (trendDays - 1) * 86400000).toISOString().slice(0, 10)
  const trendStartAt = Date.parse(`${trendStart}T00:00:00+08:00`)
  const trendEndAt = Date.parse(`${trendEnd}T00:00:00+08:00`) + 24 * 60 * 60 * 1000
  try {
    if (selectedAccount) {
      const [countsResult, trendResult] = await Promise.all([
        db.prepare(`SELECT task, result, COUNT(*) AS count FROM community_action_events WHERE platform = ? AND account_handle = ? AND occurred_at >= ? AND occurred_at < ? GROUP BY task, result`).bind(platform, selectedAccount, dateRange.start, dateRange.end).all(),
        db.prepare(`SELECT date(occurred_at / 1000, 'unixepoch', '+8 hours') AS date, task, result, COUNT(*) AS count FROM community_action_events WHERE platform = ? AND account_handle = ? AND occurred_at >= ? AND occurred_at < ? GROUP BY date, task, result`).bind(platform, selectedAccount, trendStartAt, trendEndAt).all(),
      ])
      taskCounts = countsResult?.results || []
      trendRows = trendResult?.results || []
    } else {
      if (platform !== 'x') {
        const trigger = await db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'trigger' AND name = 'trg_community_action_daily_counts_insert'`).first()
        if (!/NEW\.platform\s+IN\s*\('x',\s*'xhs',\s*'juejin'\)/i.test(String(trigger?.sql || ''))) countsMigrationRequired = true
      }
      if (!countsMigrationRequired) {
        const [countsResult, trendResult] = await Promise.all([
          db.prepare(`SELECT task, result, count FROM community_action_daily_counts WHERE platform = ? AND report_date = ?`).bind(platform, dateRange.selectedDate).all(),
          db.prepare(`SELECT report_date AS date, task, result, count FROM community_action_daily_counts WHERE platform = ? AND report_date >= ? AND report_date <= ?`).bind(platform, trendStart, trendEnd).all(),
        ])
        taskCounts = countsResult?.results || []
        trendRows = trendResult?.results || []
      }
    }
  } catch (error) {
    if (!/no such table: community_action_daily_counts/i.test(String(error?.message || error))) throw error
    countsMigrationRequired = true
  }
  let dailyReports = []
  let reportTotal = 0
  let dailyMigrationRequired = false
  if (platform === 'x') try {
    const reportSql = selectedAccount
      ? `SELECT device_id, account_handle, comments, likes, follows, unfollows, follow_backs, posts, uploaded_at FROM x_extension_daily_reports WHERE report_date = ? AND account_handle = ? ORDER BY uploaded_at DESC LIMIT ? OFFSET ?`
      : `SELECT device_id, account_handle, comments, likes, follows, unfollows, follow_backs, posts, uploaded_at FROM x_extension_daily_reports WHERE report_date = ? ORDER BY uploaded_at DESC LIMIT ? OFFSET ?`
    const reportCountSql = selectedAccount
      ? `SELECT COUNT(*) AS total FROM x_extension_daily_reports WHERE report_date = ? AND account_handle = ?`
      : `SELECT COUNT(*) AS total FROM x_extension_daily_reports WHERE report_date = ?`
    const reportBind = selectedAccount ? [dateRange.selectedDate, selectedAccount, X_MONITOR_REPORT_PAGE_SIZE, safeReportOffset] : [dateRange.selectedDate, X_MONITOR_REPORT_PAGE_SIZE, safeReportOffset]
    const reportCountBind = selectedAccount ? [dateRange.selectedDate, selectedAccount] : [dateRange.selectedDate]
    const [result, total] = await Promise.all([
      db.prepare(reportSql).bind(...reportBind).all(),
      db.prepare(reportCountSql).bind(...reportCountBind).first(),
    ])
    dailyReports = result?.results || []
    reportTotal = Number(total?.total) || 0
  } catch (error) {
    const message = String(error?.message || error)
    if (/no such column: posts/i.test(message)) {
      // Migration 0119 may lag behind a Pages deployment. Keep older reports readable.
      const reportSql = selectedAccount
        ? `SELECT device_id, account_handle, comments, likes, follows, unfollows, follow_backs, 0 AS posts, uploaded_at FROM x_extension_daily_reports WHERE report_date = ? AND account_handle = ? ORDER BY uploaded_at DESC LIMIT ? OFFSET ?`
        : `SELECT device_id, account_handle, comments, likes, follows, unfollows, follow_backs, 0 AS posts, uploaded_at FROM x_extension_daily_reports WHERE report_date = ? ORDER BY uploaded_at DESC LIMIT ? OFFSET ?`
      const reportCountSql = selectedAccount
        ? `SELECT COUNT(*) AS total FROM x_extension_daily_reports WHERE report_date = ? AND account_handle = ?`
        : `SELECT COUNT(*) AS total FROM x_extension_daily_reports WHERE report_date = ?`
      const reportBind = selectedAccount ? [dateRange.selectedDate, selectedAccount, X_MONITOR_REPORT_PAGE_SIZE, safeReportOffset] : [dateRange.selectedDate, X_MONITOR_REPORT_PAGE_SIZE, safeReportOffset]
      const reportCountBind = selectedAccount ? [dateRange.selectedDate, selectedAccount] : [dateRange.selectedDate]
      const [result, total] = await Promise.all([
        db.prepare(reportSql).bind(...reportBind).all(),
        db.prepare(reportCountSql).bind(...reportCountBind).first(),
      ])
      dailyReports = result?.results || []
      reportTotal = Number(total?.total) || 0
      dailyMigrationRequired = true
    } else if (/no such table/i.test(message)) {
      dailyMigrationRequired = true
    } else {
      throw error
    }
  }
  let eventTotal = taskCounts.reduce((sum, row) => sum + (Number(row.count) || 0), 0)
  if (countsMigrationRequired) {
    const totalSql = selectedAccount
      ? `SELECT COUNT(*) AS total FROM community_action_events WHERE platform = ? AND account_handle = ? AND occurred_at >= ? AND occurred_at < ?`
      : `SELECT COUNT(*) AS total FROM community_action_events WHERE platform = ? AND occurred_at >= ? AND occurred_at < ?`
    const totalBind = selectedAccount
      ? [platform, selectedAccount, dateRange.start, dateRange.end]
      : [platform, dateRange.start, dateRange.end]
    const total = await db.prepare(totalSql).bind(...totalBind).first()
    eventTotal = Number(total?.total) || 0
  }
  const presented = presentExtensionMonitor({
    ...live,
    platform,
    accountHandle: selectedAccount,
    accounts: (accountsResult?.results || []).map((row) => row.account_handle),
    events: eventsResult?.results || [],
    taskCounts,
    trendRows,
    dailyReports,
    eventTotal,
    reportTotal,
    dateRange,
    offset: safeOffset,
    reportOffset: safeReportOffset,
    now,
    dailyMigrationRequired,
    countsMigrationRequired,
    trendDays,
  })
  if (platform !== 'x') return presented
  const commands = await readRecentXCommands(db, presented.devices.map((device) => device.id), now)
  return { ...presented, devices: attachDeviceCommands(presented.devices, commands) }
}

export async function readXExtensionMonitor(db, options = {}) {
  return readExtensionMonitor(db, { ...options, platform: 'x' })
}

// 插件监控的公开投影：首页要给访客看状态与日历，但不下发设备 ID、目标 ID 与错误码。
// 站长登录时才附带 device_id，用于下发远程指令。
const EVENT_FIELDS = ['task', 'taskLabel', 'result', 'occurredAt']
const REPORT_FIELDS = ['accountHandle', 'comments', 'likes', 'follows', 'followBacks', 'unfollows', 'posts', 'timelineComments', 'notificationComments', 'kolComments', 'uploadedAt']
const PHASES = new Set(['offline', 'unknown', 'running', 'paused', 'stopping', 'idle'])

function pick(source, fields) {
  if (!source) return null
  return Object.fromEntries(fields.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]))
}

function publicDevice(device, owner) {
  const schedule = device.schedule
    ? { enabled: Boolean(device.schedule.enabled), current: device.schedule.current || null }
    : null
  return {
    ...(owner ? { id: device.id } : {}),
    accountHandle: device.accountHandle || '',
    online: Boolean(device.online),
    telemetry: Boolean(device.telemetry),
    phase: PHASES.has(device.phase) ? device.phase : 'unknown',
    extensionVersion: device.extensionVersion || '',
    updateAvailable: Boolean(device.updateAvailable),
    lastSeenAt: Number(device.lastSeenAt) || 0,
    schedule,
    lastAction: pick(device.lastAction, EVENT_FIELDS),
    lastFailure: pick(device.lastFailure, EVENT_FIELDS),
  }
}

const FRAME_FIELDS = ['running', 'waiting', 'needs', 'stopped']
const RULE_FIELDS = ['mode', 'enabled', 'priority', 'window']
const COMMAND_FIELDS = ['id', 'command', 'mode', 'modeLabel', 'status', 'result', 'createdAt', 'claimedAt', 'finishedAt']

// 站长控制台：排班规则、任务现场与指令回执只在登录态下发。
function ownerDevice(device) {
  const schedule = device.schedule ? {
    enabled: Boolean(device.schedule.enabled),
    current: device.schedule.current || null,
    startedAt: Number(device.schedule.startedAt) || 0,
    past: device.schedule.past || null,
    now: device.schedule.now || null,
    next: device.schedule.next || null,
    facing: pick(device.schedule.facing, FRAME_FIELDS),
    rules: (Array.isArray(device.schedule.rules) ? device.schedule.rules : []).map((rule) => pick(rule, RULE_FIELDS)),
  } : null
  return {
    ...publicDevice(device, true),
    schedule,
    commands: (device.commands || []).map((item) => pick(item, COMMAND_FIELDS)),
    groups: (device.groups || []).map((group) => ({
      id: group.id,
      label: group.label,
      tasks: (group.tasks || []).map((task) => ({
        mode: task.mode,
        label: task.label || '',
        phase: task.phase || '',
        priority: Number(task.priority) || 0,
        detail: String(task.detail || '').slice(0, 120),
        waitUntil: Number(task.waitUntil) || 0,
      })),
    })),
  }
}

const EVENT_PUBLIC_FIELDS = ['id', 'task', 'taskLabel', 'result', 'accountHandle', 'occurredAt']
const EVENT_OWNER_FIELDS = [...EVENT_PUBLIC_FIELDS, 'errorCode', 'targetId']

function publicTask(task) {
  return {
    task: task.task,
    label: task.label,
    success: Number(task.success) || 0,
    failed: Number(task.failed) || 0,
    skipped: Number(task.skipped) || 0,
    limited: Number(task.limited) || 0,
  }
}

function publicTrendDay(day) {
  return {
    date: String(day?.date || ''),
    success: Number(day?.success) || 0,
    failed: Number(day?.failed) || 0,
    skipped: Number(day?.skipped) || 0,
    limited: Number(day?.limited) || 0,
  }
}

export function publicMonitorPayload(data, { owner = false } = {}) {
  if (!data || typeof data !== 'object') return null
  const devices = (data.devices || []).map((device) => (owner ? ownerDevice(device) : publicDevice(device, false)))
  return {
    now: Number(data.now) || Date.now(),
    selectedDate: String(data.selectedDate || ''),
    minDate: String(data.minDate || ''),
    maxDate: String(data.maxDate || ''),
    latestExtensionVersion: String(data.latestExtensionVersion || ''),
    accounts: Array.isArray(data.accounts) ? data.accounts.slice(0, 40) : [],
    migrationRequired: Boolean(data.migrationRequired),
    countsMigrationRequired: Boolean(data.countsMigrationRequired),
    owner,
    devices,
    tasks: (data.tasks || []).map(publicTask),
    trend: (data.trend || []).map(publicTrendDay),
    reports: (data.dailyReports || []).map((report) => pick(report, REPORT_FIELDS)),
    ...(owner ? { events: (data.events || []).slice(0, 40).map((event) => pick(event, EVENT_OWNER_FIELDS)) } : {}),
  }
}

// 任务回执的状态文案，后台控制台与首页共用。
export const COMMAND_STATUS_LABELS = Object.freeze({
  pending: '排队中',
  claimed: '已下发',
  done: '已完成',
  failed: '失败',
  expired: '已过期',
})

// 五类动作的公开汇总：与本地面板「今日大互动」同一口径，关注并入回关。
// 日报入库仍是 follows / followBacks 分开的原始字段，只在汇总时相加。
export function summarizeReports(reports) {
  const total = { posts: 0, comments: 0, likes: 0, follows: 0, unfollows: 0 }
  for (const report of Array.isArray(reports) ? reports : []) {
    total.posts += Number(report?.posts) || 0
    total.comments += Number(report?.comments) || 0
    total.likes += Number(report?.likes) || 0
    total.follows += (Number(report?.follows) || 0) + (Number(report?.followBacks) || 0)
    total.unfollows += Number(report?.unfollows) || 0
  }
  return total
}

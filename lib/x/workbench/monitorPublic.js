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
    devices: (data.devices || []).map((device) => publicDevice(device, owner)),
    tasks: (data.tasks || []).map(publicTask),
    trend: (data.trend || []).map(publicTrendDay),
    reports: (data.dailyReports || []).map((report) => pick(report, REPORT_FIELDS)),
  }
}

// 六类动作的公开汇总：直接累加所选日期的插件日报，与首页账号卡同一数据源，
// 不另建任务 ID → 类别映射。
export function summarizeReports(reports) {
  const total = { posts: 0, comments: 0, likes: 0, follows: 0, followBacks: 0, unfollows: 0 }
  for (const report of Array.isArray(reports) ? reports : []) {
    for (const key of Object.keys(total)) total[key] += Number(report?.[key]) || 0
  }
  return total
}

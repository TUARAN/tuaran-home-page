export const SITE_STATUS_VALUES = ['operational', 'degraded', 'outage', 'maintenance']
export const SITE_STATUS_SEVERITIES = ['info', 'warning', 'critical']
export const SITE_STATUS_FAILURE_THRESHOLD = 3
export const SITE_STATUS_RECOVERY_THRESHOLD = 3

const DEFAULT_MESSAGES = {
  operational: '所有服务运行正常',
  degraded: '部分站点功能暂时不可用，正在检查。',
  outage: '站点服务出现异常，正在处理。',
  maintenance: '站点正在维护，部分功能可能暂时不可用。',
}

export function operationalSiteStatus(now = Date.now()) {
  return {
    status: 'operational',
    severity: 'info',
    message: DEFAULT_MESSAGES.operational,
    detail: '',
    affectedServices: [],
    source: 'system',
    startedAt: null,
    updatedAt: now,
  }
}

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
}

function cleanServices(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((item) => cleanText(item, 40)).filter(Boolean))].slice(0, 8)
}

export function normalizeSiteStatus(value, now = Date.now()) {
  const input = value && typeof value === 'object' ? value : {}
  const status = SITE_STATUS_VALUES.includes(input.status) ? input.status : 'operational'
  const defaultSeverity = status === 'outage' ? 'critical' : status === 'operational' ? 'info' : 'warning'
  return {
    status,
    severity: SITE_STATUS_SEVERITIES.includes(input.severity) ? input.severity : defaultSeverity,
    message: cleanText(input.message, 160) || DEFAULT_MESSAGES[status],
    detail: cleanText(input.detail, 500),
    affectedServices: cleanServices(input.affectedServices),
    source: ['automatic', 'manual', 'system'].includes(input.source) ? input.source : 'system',
    startedAt: status === 'operational' ? null : Number(input.startedAt) || now,
    updatedAt: Number(input.updatedAt) || now,
  }
}

export function publicSiteStatus(value, now = Date.now()) {
  const status = normalizeSiteStatus(value, now)
  return { ...status, active: status.status !== 'operational' }
}

export function createManualSiteStatus(input, current, now = Date.now()) {
  const status = SITE_STATUS_VALUES.includes(input?.status) ? input.status : null
  if (!status) throw new Error('INVALID_STATUS')
  if (status === 'operational') return operationalSiteStatus(now)

  const previous = normalizeSiteStatus(current, now)
  return normalizeSiteStatus(
    {
      ...input,
      status,
      source: 'manual',
      startedAt: previous.status === status && previous.source === 'manual' ? previous.startedAt : now,
      updatedAt: now,
    },
    now,
  )
}

export function normalizeMonitorState(value) {
  const input = value && typeof value === 'object' ? value : {}
  return {
    consecutiveFailures: Math.max(0, Number(input.consecutiveFailures) || 0),
    consecutiveSuccesses: Math.max(0, Number(input.consecutiveSuccesses) || 0),
    lastCheckedAt: Number(input.lastCheckedAt) || null,
    lastHealthyAt: Number(input.lastHealthyAt) || null,
    lastUnhealthyAt: Number(input.lastUnhealthyAt) || null,
  }
}

export function applySiteHealthProbe({ current, monitor, healthy, now = Date.now() }) {
  const previous = normalizeSiteStatus(current, now)
  const state = normalizeMonitorState(monitor)
  const nextMonitor = {
    ...state,
    consecutiveFailures: healthy ? 0 : state.consecutiveFailures + 1,
    consecutiveSuccesses: healthy ? state.consecutiveSuccesses + 1 : 0,
    lastCheckedAt: now,
    lastHealthyAt: healthy ? now : state.lastHealthyAt,
    lastUnhealthyAt: healthy ? state.lastUnhealthyAt : now,
  }

  // 人工公告拥有最高优先级，自动探测只更新计数，不覆盖站长正在发布的内容。
  if (previous.source === 'manual' && previous.status !== 'operational') {
    return { status: previous, monitor: nextMonitor, changed: false }
  }

  if (!healthy && nextMonitor.consecutiveFailures >= SITE_STATUS_FAILURE_THRESHOLD) {
    const nextStatus = normalizeSiteStatus(
      {
        status: 'degraded',
        severity: 'warning',
        message: '数据库服务异常，登录、评论等功能可能暂时不可用。',
        detail: '系统已自动检测到连续异常，恢复后公告会自动解除。',
        affectedServices: ['数据库', '登录', '评论与互动'],
        source: 'automatic',
        startedAt: previous.source === 'automatic' && previous.status !== 'operational' ? previous.startedAt : now,
        updatedAt: now,
      },
      now,
    )
    return { status: nextStatus, monitor: nextMonitor, changed: previous.status === 'operational' }
  }

  if (
    healthy
    && previous.source === 'automatic'
    && previous.status !== 'operational'
    && nextMonitor.consecutiveSuccesses >= SITE_STATUS_RECOVERY_THRESHOLD
  ) {
    return { status: operationalSiteStatus(now), monitor: nextMonitor, changed: true }
  }

  return { status: previous, monitor: nextMonitor, changed: false }
}

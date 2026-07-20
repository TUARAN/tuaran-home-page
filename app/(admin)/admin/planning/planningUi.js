export const PLANNING_STATUS_META = {
  planned: { label: '待规划', tone: 'slate' },
  active: { label: '进行中', tone: 'blue' },
  paused: { label: '已暂停', tone: 'amber' },
  completed: { label: '已完成', tone: 'emerald' },
  archived: { label: '已归档', tone: 'zinc' },
  blocked: { label: '受阻', tone: 'rose' },
  cancelled: { label: '已取消', tone: 'zinc' },
  doing: { label: '处理中', tone: 'blue' },
  done: { label: '已完成', tone: 'emerald' },
  open: { label: '待决策', tone: 'amber' },
  decided: { label: '已决策', tone: 'emerald' },
  superseded: { label: '已替代', tone: 'zinc' },
}

export const PLANNING_TABS = [
  { id: 'overview', label: '三时态总览' },
  { id: 'roadmap', label: '组合路线图' },
  { id: 'tree', label: '规划树' },
  { id: 'history', label: '历史与决策' },
]

export const PLANNING_WINDOWS = [
  { id: 'week', label: '本周' },
  { id: 'month', label: '本月' },
  { id: 'quarter', label: '本季度' },
]

export function formatPlanningDate(value) {
  if (value == null || value === '') return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(date)
}

async function parseResponseJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function planningRequest(path, options = {}) {
  const response = await fetch(path, {
    cache: 'no-store',
    ...options,
    headers: { Accept: 'application/json', ...(options.headers || {}) },
  })
  const payload = await parseResponseJson(response)

  if (!response.ok || payload?.error) {
    const error = new Error(payload?.message || payload?.error || `请求失败（${response.status}）`)
    error.code = payload?.error || 'PLANNING_REQUEST_FAILED'
    throw error
  }
  if (payload == null) {
    const error = new Error('规划中心返回了无法识别的数据。')
    error.code = 'PLANNING_INVALID_RESPONSE'
    throw error
  }
  return payload
}

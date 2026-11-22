export const API = '/api/x-workbench'

const ERRORS = {
  UNAUTHENTICATED: '请先登录',
  INVALID_HANDLE: '账号名只能是 1–15 位字母、数字或下划线',
  ACCOUNT_LIMIT: '已达到账号数量上限',
  ACCOUNT_NOT_BOUND: '请先在「智能体」里绑定这个 X 账号',
  PRINCIPLE_CONFLICT: '内容与智能体原则冲突，请换一种写法',
  MEMORY_FULL: '记忆已满',
  QUOTA_EXCEEDED: '本月额度已用完',
  SOURCE_REQUIRED: '请先填入至少 5 个字的素材',
  LLM_NOT_CONFIGURED: '改写服务暂未开通',
  LLM_FAILED: '模型暂时没有返回结果，额度已退回，请稍后再试',
  TEXT_REQUIRED: '内容不能为空',
  TEXT_TOO_LONG: '超过单条帖子长度',
  RUN_AT_TOO_SOON: '发布时间至少要晚于现在 1 分钟',
  QUEUE_FULL: '排期队列已满（50 条）',
  DRAFT_LIMIT: '草稿已满',
  WATCH_LIMIT: '监控账号已满（50 个）',
}

export async function call(path, init) {
  try {
    const res = await fetch(`${API}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  } catch {
    return { ok: false, status: 0, data: { error: 'NETWORK' } }
  }
}

export const post = (path, body, method = 'POST') => call(path, { method, body: JSON.stringify(body) })

export function message(data) {
  const base = ERRORS[data?.error] || (data?.error === 'NETWORK' ? '网络不通，请稍后再试' : '操作失败，请稍后再试')
  return data?.reason ? `${base}（${data.reason}）` : base
}

export function compact(n) {
  const v = Number(n) || 0
  if (v >= 1e8) return `${(v / 1e8).toFixed(1)}亿`
  if (v >= 1e4) return `${(v / 1e4).toFixed(1)}万`
  return String(v)
}

export function ago(ms) {
  const m = Math.max(0, Math.round((Date.now() - ms) / 60000))
  if (m < 60) return `${m} 分钟前`
  if (m < 1440) return `${Math.round(m / 60)} 小时前`
  return `${Math.round(m / 1440)} 天前`
}

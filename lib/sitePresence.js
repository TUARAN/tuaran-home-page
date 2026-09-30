// 在线人数只是首页的装饰性近似值。高频 D1 心跳会挤占内容发布等核心任务的写额度。
export const SITE_PRESENCE_HEARTBEAT_MS = 10 * 60 * 1000
export const SITE_PRESENCE_WINDOW_MS = 25 * 60 * 1000
export const SITE_PRESENCE_MIN_WRITE_INTERVAL_MS = 8 * 60 * 1000

export function normalizePresenceVisitorKey(value) {
  const key = typeof value === 'string' ? value.trim() : ''
  return /^[a-zA-Z0-9_-]{20,80}$/.test(key) ? key : ''
}

export function normalizeOnlineCount(value) {
  const count = Number(value)
  if (!Number.isFinite(count)) return 0
  return Math.max(0, Math.floor(count))
}

export function presenceCutoff(now = Date.now()) {
  return now - SITE_PRESENCE_WINDOW_MS
}

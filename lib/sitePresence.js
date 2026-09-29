export const SITE_PRESENCE_HEARTBEAT_MS = 60 * 1000
export const SITE_PRESENCE_WINDOW_MS = 150 * 1000
export const SITE_PRESENCE_RETENTION_MS = 24 * 60 * 60 * 1000

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

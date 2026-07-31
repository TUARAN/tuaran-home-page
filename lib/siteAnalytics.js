const SESSION_STAGE_KEY = 'tuaran_visitor_stage'
const FIRST_SEEN_KEY = 'tuaran_first_seen_at'
const LANDING_AT_KEY = 'tuaran_landing_at'
const QUALIFIED_START_KEY = 'tuaran_qualified_start'
const QUEUE_KEY = '__tuaranAnalyticsQueue'

function safeStorage(storage, operation, key, value) {
  try {
    if (!storage) return null
    if (operation === 'get') return storage.getItem(key)
    storage.setItem(key, value)
    return value
  } catch {
    return null
  }
}

export function getVisitorStage() {
  if (typeof window === 'undefined') return 'unknown'
  const sessionStage = safeStorage(window.sessionStorage, 'get', SESSION_STAGE_KEY)
  if (sessionStage === 'new' || sessionStage === 'returning') return sessionStage

  const firstSeen = safeStorage(window.localStorage, 'get', FIRST_SEEN_KEY)
  const stage = firstSeen ? 'returning' : 'new'
  const now = String(Date.now())
  if (!firstSeen) safeStorage(window.localStorage, 'set', FIRST_SEEN_KEY, now)
  safeStorage(window.sessionStorage, 'set', SESSION_STAGE_KEY, stage)
  safeStorage(window.sessionStorage, 'set', LANDING_AT_KEY, now)
  return stage
}

export function getTimeToValueSeconds() {
  if (typeof window === 'undefined') return 0
  const landingAt = Number(safeStorage(window.sessionStorage, 'get', LANDING_AT_KEY)) || Date.now()
  return Math.max(0, Math.round((Date.now() - landingAt) / 1000))
}

function sanitizeProperties(properties = {}) {
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([, value]) => value !== '' && value !== null && typeof value !== 'undefined')
      .map(([key, value]) => [
        key,
        typeof value === 'string' ? value.slice(0, 120) : value,
      ]),
  )
}

export function trackSiteEvent(name, properties = {}) {
  if (typeof window === 'undefined' || !name) return false
  const payload = sanitizeProperties({
    ...properties,
    visitor_stage: getVisitorStage(),
  })
  if (typeof window.umami?.track !== 'function') {
    const queue = Array.isArray(window[QUEUE_KEY]) ? window[QUEUE_KEY] : []
    queue.push({ name, payload })
    window[QUEUE_KEY] = queue.slice(-30)
    return false
  }
  window.umami.track(name, payload)
  return true
}

export function flushSiteEvents() {
  if (typeof window === 'undefined' || typeof window.umami?.track !== 'function') return 0
  const queue = Array.isArray(window[QUEUE_KEY]) ? window[QUEUE_KEY] : []
  window[QUEUE_KEY] = []
  for (const event of queue) {
    if (event?.name) window.umami.track(event.name, event.payload || {})
  }
  return queue.length
}

export function markQualifiedStart(method, properties = {}) {
  if (typeof window === 'undefined') return false
  const alreadyMarked = safeStorage(window.sessionStorage, 'get', QUALIFIED_START_KEY)
  if (alreadyMarked) return false
  safeStorage(window.sessionStorage, 'set', QUALIFIED_START_KEY, method || 'unknown')
  return trackSiteEvent('qualified_start', {
    method: method || 'unknown',
    time_to_value_seconds: getTimeToValueSeconds(),
    ...properties,
  })
}

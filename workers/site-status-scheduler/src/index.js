const DEFAULT_TARGET_ORIGIN = 'https://2aran.com'
const INTERNAL_ROUTE_PREFIX = '/_internal/site-status'
const SCHEDULER_STATE_KEY = 'site-status/scheduler-state.json'
const USER_AGENT = '2aran-site-status-scheduler/1.0'
const MAX_ERROR_LENGTH = 500
const PROBE_TIMEOUT_MS = 15_000
const RETRY_COUNT = 2
const RETRY_DELAY_MS = 2_000
export const SITE_STATUS_FAILURE_THRESHOLD = 3
export const SITE_STATUS_RECOVERY_THRESHOLD = 3
export const SITE_STATUS_PROBE_CRON = '*/5 * * * *'
export const SITE_STATUS_PROBE_PATHS = [
  { id: 'home', path: '/' },
  { id: 'site-health', path: '/api/site-health' },
]

function json(data, init = {}) {
  const headers = new Headers(init.headers || {})
  headers.set('content-type', 'application/json; charset=utf-8')
  headers.set('cache-control', 'no-store')
  headers.set('x-content-type-options', 'nosniff')
  return new Response(JSON.stringify(data), { ...init, headers })
}

function errorText(error) {
  return String(error?.message || error || 'unknown error').slice(0, MAX_ERROR_LENGTH)
}

export async function defaultSleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function tokenMatches(actual, expected) {
  if (!actual || !expected) return false
  const encoder = new TextEncoder()
  const [actualHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(actual)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ])
  const left = new Uint8Array(actualHash)
  const right = new Uint8Array(expectedHash)
  let difference = left.length ^ right.length
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    difference |= left[index] ^ right[index]
  }
  return difference === 0
}

async function manualRunAuthorized(request, env) {
  const authorization = request.headers.get('authorization') || ''
  const prefix = 'Bearer '
  if (!authorization.startsWith(prefix)) return false
  return tokenMatches(authorization.slice(prefix.length), String(env.SITE_STATUS_MANUAL_SECRET || ''))
}

export function targetOrigin(value = DEFAULT_TARGET_ORIGIN) {
  try {
    const url = new URL(String(value || DEFAULT_TARGET_ORIGIN))
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '')
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) {
      throw new Error('invalid')
    }
    if (hostname !== '2aran.com' && !hostname.endsWith('.2aran.com')) {
      throw new Error(`目标域名 ${hostname} 不在站点探活授权范围`)
    }
    return `https://${hostname}`
  } catch (error) {
    if (String(error?.message || error).includes('不在站点探活授权范围')) throw error
    throw new Error('SITE_STATUS_TARGET_ORIGIN 必须是 2aran.com 的公网 HTTPS 源')
  }
}

export function monitorUrl(value, origin) {
  const fallback = `${origin}/api/site-status/monitor`
  const raw = String(value || fallback)
  let url
  try {
    url = new URL(raw)
  } catch {
    throw new Error('SITE_STATUS_MONITOR_URL 必须是公网 HTTPS 地址')
  }
  const allowedOrigin = targetOrigin(url.origin)
  if (url.pathname !== '/api/site-status/monitor' || url.protocol !== 'https:') {
    throw new Error('SITE_STATUS_MONITOR_URL 必须指向 /api/site-status/monitor')
  }
  if (url.origin !== allowedOrigin) {
    throw new Error('SITE_STATUS_MONITOR_URL 必须与探活目标同源')
  }
  return url.toString()
}

export function isHttpSuccess(status) {
  return Number(status) >= 200 && Number(status) < 300
}

export function evaluateCheck(id, response, bodyText = '') {
  const status = Number(response?.status) || 0
  if (id === 'site-health') {
    let payload = null
    try {
      payload = bodyText ? JSON.parse(bodyText) : null
    } catch {
      return { ok: false, status, error: 'SITE_HEALTH_INVALID_JSON' }
    }
    if (!isHttpSuccess(status) || payload?.healthy === false) {
      return { ok: false, status, healthy: payload?.healthy === true ? true : false, error: 'SITE_HEALTH_UNHEALTHY' }
    }
    return { ok: true, status, healthy: payload?.healthy !== false }
  }
  if (!isHttpSuccess(status)) {
    return { ok: false, status, error: `HTTP_${status || 'ERROR'}` }
  }
  return { ok: true, status }
}

export function normalizeSchedulerState(value) {
  const input = value && typeof value === 'object' ? value : {}
  const lastKnownState = input.lastKnownState === 'up' || input.lastKnownState === 'down' ? input.lastKnownState : null
  return {
    consecutiveFailures: Math.max(0, Number(input.consecutiveFailures) || 0),
    consecutiveSuccesses: Math.max(0, Number(input.consecutiveSuccesses) || 0),
    lastCheckedAt: Number(input.lastCheckedAt) || null,
    lastHealthyAt: Number(input.lastHealthyAt) || null,
    lastUnhealthyAt: Number(input.lastUnhealthyAt) || null,
    lastKnownState,
    lastAlertAt: Number(input.lastAlertAt) || null,
    lastAlertKind: input.lastAlertKind === 'down' || input.lastAlertKind === 'recovered' ? input.lastAlertKind : null,
  }
}

export function nextMonitorState({ previous, healthy, now = Date.now() }) {
  const state = normalizeSchedulerState(previous)
  const next = {
    ...state,
    consecutiveFailures: healthy ? 0 : state.consecutiveFailures + 1,
    consecutiveSuccesses: healthy ? state.consecutiveSuccesses + 1 : 0,
    lastCheckedAt: now,
    lastHealthyAt: healthy ? now : state.lastHealthyAt,
    lastUnhealthyAt: healthy ? state.lastUnhealthyAt : now,
  }
  let alert = null
  if (!healthy && next.consecutiveFailures >= SITE_STATUS_FAILURE_THRESHOLD && state.lastKnownState !== 'down') {
    next.lastKnownState = 'down'
    next.lastAlertAt = now
    next.lastAlertKind = 'down'
    alert = { kind: 'down' }
  } else if (healthy && next.consecutiveSuccesses >= SITE_STATUS_RECOVERY_THRESHOLD && state.lastKnownState === 'down') {
    next.lastKnownState = 'up'
    next.lastAlertAt = now
    next.lastAlertKind = 'recovered'
    alert = { kind: 'recovered' }
  } else if (healthy && next.consecutiveSuccesses >= SITE_STATUS_RECOVERY_THRESHOLD && state.lastKnownState == null) {
    next.lastKnownState = 'up'
  }
  return { state: next, alert }
}

async function readJson(bucket, key) {
  if (!bucket) return null
  const object = await bucket.get(key)
  if (!object) return null
  try {
    return await object.json()
  } catch {
    return JSON.parse(await object.text())
  }
}

export async function readSchedulerState(bucket) {
  return normalizeSchedulerState(await readJson(bucket, SCHEDULER_STATE_KEY))
}

export async function writeSchedulerState(bucket, value) {
  if (!bucket) throw new Error('SITE_STATUS_STORAGE_UNAVAILABLE')
  const normalized = normalizeSchedulerState(value)
  await bucket.put(SCHEDULER_STATE_KEY, JSON.stringify(normalized), {
    httpMetadata: { contentType: 'application/json; charset=utf-8' },
  })
  return normalized
}

export async function probeOnce({ url, fetchImpl = fetch, timeoutMs = PROBE_TIMEOUT_MS }) {
  const response = await fetchImpl(url, {
    method: 'GET',
    redirect: 'follow',
    headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/json;q=0.9,*/*;q=0.8' },
    signal: AbortSignal.timeout(timeoutMs),
  })
  const bodyText = await response.text()
  return { response, bodyText }
}

export async function probeCheck({
  id,
  url,
  fetchImpl = fetch,
  retries = RETRY_COUNT,
  delayMs = RETRY_DELAY_MS,
  sleep = defaultSleep,
  timeoutMs = PROBE_TIMEOUT_MS,
} = {}) {
  const attempts = []
  const maxAttempts = Math.max(1, Number(retries) + 1)
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const { response, bodyText } = await probeOnce({ url, fetchImpl, timeoutMs })
      const result = evaluateCheck(id, response, bodyText)
      attempts.push({ attempt, ok: result.ok, status: result.status, error: result.error || null })
      if (result.ok) return { ...result, url, attempts }
    } catch (error) {
      attempts.push({ attempt, ok: false, status: 0, error: errorText(error) })
    }
    if (attempt < maxAttempts) await sleep(delayMs)
  }
  const last = attempts[attempts.length - 1] || { ok: false, status: 0, error: 'PROBE_FAILED' }
  return { ok: false, status: last.status, error: last.error || 'PROBE_FAILED', url, attempts }
}

export async function runIndependentProbes({
  origin,
  fetchImpl = fetch,
  retries = RETRY_COUNT,
  delayMs = RETRY_DELAY_MS,
  sleep = defaultSleep,
  paths = SITE_STATUS_PROBE_PATHS,
} = {}) {
  const checks = []
  for (const item of paths) {
    const url = new URL(item.path, `${origin}/`).toString()
    const result = await probeCheck({
      id: item.id,
      url,
      fetchImpl,
      retries,
      delayMs,
      sleep,
    })
    checks.push({ id: item.id, ...result })
  }
  return {
    healthy: checks.every((item) => item.ok),
    checks,
  }
}

export async function syncMonitorApi({
  url,
  secret,
  fetchImpl = fetch,
  timeoutMs = PROBE_TIMEOUT_MS,
} = {}) {
  if (!secret) {
    return { ok: false, skipped: true, error: 'MONITOR_SECRET_NOT_CONFIGURED' }
  }
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'user-agent': USER_AGENT,
        'x-site-status-secret': secret,
        accept: 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs),
    })
    const bodyText = await response.text()
    let payload = null
    try {
      payload = bodyText ? JSON.parse(bodyText) : null
    } catch {
      payload = null
    }
    return {
      ok: isHttpSuccess(response.status) && payload?.ok !== false,
      status: response.status,
      changed: payload?.changed === true,
      payload,
    }
  } catch (error) {
    return { ok: false, status: 0, error: errorText(error) }
  }
}

export async function runSiteStatusSchedule(env, {
  fetchImpl = fetch,
  now = Date.now(),
  sleep = defaultSleep,
  trigger = 'cron',
} = {}) {
  const origin = targetOrigin(env.SITE_STATUS_TARGET_ORIGIN)
  const probe = await runIndependentProbes({ origin, fetchImpl, sleep })
  const bucket = env.CONTENT_FEED || null
  const previous = bucket ? await readSchedulerState(bucket) : normalizeSchedulerState(null)
  const { state, alert } = nextMonitorState({ previous, healthy: probe.healthy, now })
  if (bucket) {
    await writeSchedulerState(bucket, state)
  }
  const monitorSync = await syncMonitorApi({
    url: monitorUrl(env.SITE_STATUS_MONITOR_URL, origin),
    secret: String(env.SITE_STATUS_MONITOR_SECRET || env.AUTOMATION_ALERT_SECRET || '').trim(),
    fetchImpl,
  })
  if (alert) {
    console.log(JSON.stringify({
      type: 'site-status-state-change',
      kind: alert.kind,
      trigger,
      healthy: probe.healthy,
      consecutiveFailures: state.consecutiveFailures,
      consecutiveSuccesses: state.consecutiveSuccesses,
      monitorSyncOk: monitorSync.ok,
    }))
  }
  return {
    ok: true,
    trigger,
    healthy: probe.healthy,
    changed: Boolean(alert),
    alert,
    probe,
    monitor: state,
    monitorSync,
    persisted: Boolean(bucket),
  }
}

export default {
  async scheduled(controller, env) {
    await runSiteStatusSchedule(env, { trigger: 'cron' })
  },

  async fetch(request, env) {
    const url = new URL(request.url)
    const healthPath = url.pathname === '/health' || url.pathname === `${INTERNAL_ROUTE_PREFIX}/health`
    const runPath = url.pathname === '/run' || url.pathname === `${INTERNAL_ROUTE_PREFIX}/run`
    if (request.method === 'GET' && healthPath) {
      const origin = targetOrigin(env.SITE_STATUS_TARGET_ORIGIN)
      return json({
        ok: true,
        service: 'site-status-scheduler',
        schedule: 'every-5-minutes',
        target: origin,
        checks: SITE_STATUS_PROBE_PATHS.map((item) => item.path),
        failureThreshold: SITE_STATUS_FAILURE_THRESHOLD,
        recoveryThreshold: SITE_STATUS_RECOVERY_THRESHOLD,
        storageReady: Boolean(env.CONTENT_FEED),
        monitorSyncReady: Boolean(env.SITE_STATUS_MONITOR_SECRET || env.AUTOMATION_ALERT_SECRET),
        manualRunReady: Boolean(env.SITE_STATUS_MANUAL_SECRET),
      })
    }

    if (request.method === 'POST' && runPath) {
      if (!(await manualRunAuthorized(request, env))) {
        return json({ ok: false, error: 'unauthorized' }, { status: 401 })
      }
      try {
        const run = await runSiteStatusSchedule(env, { trigger: 'manual' })
        return json({ ok: true, run })
      } catch (error) {
        return json({ ok: false, error: errorText(error) }, { status: 502 })
      }
    }

    return json({ ok: false, error: 'not found' }, { status: 404 })
  },
}

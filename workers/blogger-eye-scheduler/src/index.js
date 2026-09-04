import { checkViaGlobalping, GLOBALPING_REGIONS } from './globalping.js'

const DEFAULT_TARGET_URL = 'https://2aran.com'
const FIXED_CROSS_ZONE_WORKER_IP = '2a06:98c0:3600::103'
const INTERNAL_ROUTE_PREFIX = '/_internal/blogger-eye'
const MAX_ERROR_LENGTH = 500
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])

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
  return tokenMatches(authorization.slice(prefix.length), String(env.BLOGGER_EYE_MANUAL_SECRET || ''))
}

function safePublicHttpsUrl(value) {
  try {
    const url = new URL(String(value || ''))
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '')
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) return ''
    if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) return ''
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':')) return ''
    url.hostname = hostname
    return url.toString()
  } catch {
    return ''
  }
}

function targetUrl(value) {
  const normalized = safePublicHttpsUrl(value || DEFAULT_TARGET_URL)
  if (!normalized) throw new Error('BLOGGER_EYE_TARGET_URL 必须是公网 HTTPS 地址')
  const hostname = new URL(normalized).hostname
  if (hostname !== '2aran.com' && !hostname.endsWith('.2aran.com')) {
    throw new Error(`目标域名 ${hostname} 不在小眼睛授权范围`)
  }
  return normalized
}

export function parseRunnerConfig(value = '') {
  let parsed
  try {
    parsed = JSON.parse(String(value || '[]'))
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  const seen = new Set()
  const runners = []
  for (const item of parsed) {
    const id = String(item?.id || '').trim().toLowerCase()
    const label = String(item?.label || id).trim().slice(0, 40)
    const url = safePublicHttpsUrl(item?.url)
    if (!/^[a-z0-9][a-z0-9_-]{0,31}$/.test(id) || !url || seen.has(id)) continue
    seen.add(id)
    runners.push({ id, label: label || id, url })
    if (runners.length >= 8) break
  }
  return runners
}

export function selectRunner(runners, nextRunnerIndex = 0) {
  if (!Array.isArray(runners) || runners.length === 0) return { runner: null, nextRunnerIndex: 0 }
  const index = Math.abs(Number(nextRunnerIndex) || 0) % runners.length
  return { runner: runners[index], nextRunnerIndex: (index + 1) % runners.length }
}

export function runnerIndexForTime(scheduledAt, runnerCount) {
  const count = Math.max(0, Number(runnerCount) || 0)
  if (count === 0) return 0
  const twentyMinuteSlot = Math.floor(Math.max(0, Number(scheduledAt) || 0) / (20 * 60 * 1000))
  return twentyMinuteSlot % count
}

async function readLimitedJson(response, maxBytes = 16 * 1024) {
  if (!response.body) return {}
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  try {
    while (size < maxBytes) {
      const { done, value } = await reader.read()
      if (done) break
      const remaining = maxBytes - size
      const chunk = value.byteLength > remaining ? value.slice(0, remaining) : value
      chunks.push(chunk)
      size += chunk.byteLength
      if (chunk.byteLength < value.byteLength) break
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    throw new Error('上游返回了无效 JSON')
  }
}

async function cancelBody(response) {
  await response.body?.cancel().catch(() => {})
}

async function checkViaRunner({ runner, secret, target, fetchImpl }) {
  const startedAt = Date.now()
  const response = await fetchImpl(runner.url, {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(20_000),
    headers: {
      authorization: `Bearer ${secret}`,
      'content-type': 'application/json',
      accept: 'application/json',
      'user-agent': 'blogger-eye-scheduler/1.0',
    },
    body: JSON.stringify({ url: target }),
  })
  const data = await readLimitedJson(response)
  if (!response.ok || data?.ok === false) throw new Error(data?.error || `Runner HTTP ${response.status}`)
  return {
    mode: 'regional-runner',
    runnerId: runner.id,
    runnerLabel: runner.label,
    exitIp: String(data?.ip || ''),
    httpStatus: Number(data?.status) || 0,
    durationMs: Number(data?.durationMs) || Date.now() - startedAt,
    effectiveUrl: String(data?.effectiveUrl || target),
  }
}

async function checkDirect({ target, fetchImpl }) {
  const startedAt = Date.now()
  let current = target
  let response
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    response = await fetchImpl(current, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
      headers: {
        accept: 'text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.1',
        'user-agent': 'blogger-eye-scheduler/1.0',
      },
    })
    const location = response.headers.get('location')
    if (!REDIRECT_STATUSES.has(response.status) || !location) break
    if (redirects === 4) throw new Error('目标重定向超过 4 次')
    const redirected = new URL(location, current).toString()
    await cancelBody(response)
    current = targetUrl(redirected)
  }
  if (!response) throw new Error('目标没有返回响应')
  const status = response.status
  await cancelBody(response)

  let exitIp = ''
  try {
    const ipResponse = await fetchImpl('https://api.ipify.org?format=json', {
      headers: { accept: 'application/json', 'user-agent': 'blogger-eye-scheduler/1.0' },
      signal: AbortSignal.timeout(10_000),
    })
    if (ipResponse.ok) exitIp = String((await readLimitedJson(ipResponse, 2048))?.ip || '')
    else await cancelBody(ipResponse)
  } catch {}

  return {
    mode: exitIp === FIXED_CROSS_ZONE_WORKER_IP ? 'cloudflare-fixed-egress' : 'cloudflare-edge',
    runnerId: '',
    runnerLabel: 'Cloudflare Edge',
    exitIp,
    httpStatus: status,
    durationMs: Date.now() - startedAt,
    effectiveUrl: current,
  }
}

export async function performCheck({ target, runners, runnerIndex, runnerSecret, globalping = false, fetchImpl = fetch, sleep }) {
  const selection = selectRunner(runners, runnerIndex)
  if (selection.runner && runnerSecret) {
    return {
      result: await checkViaRunner({ runner: selection.runner, secret: runnerSecret, target, fetchImpl }),
      nextRunnerIndex: selection.nextRunnerIndex,
    }
  }
  if (globalping) {
    const selected = selectRunner(GLOBALPING_REGIONS, runnerIndex)
    return {
      result: await checkViaGlobalping({ target, region: selected.runner, fetchImpl, sleep }),
      nextRunnerIndex: selected.nextRunnerIndex,
    }
  }
  return {
    result: await checkDirect({ target, fetchImpl }),
    nextRunnerIndex: selection.nextRunnerIndex,
  }
}

async function loadState(db) {
  return (await db.prepare(
    `SELECT next_runner_index, last_runner_id, last_exit_ip
     FROM blogger_eye_scheduler_state WHERE id = 1`,
  ).first()) || { next_runner_index: 0, last_runner_id: '', last_exit_ip: '' }
}

async function advanceRunner(db, nextRunnerIndex, now) {
  await db.prepare(
    `UPDATE blogger_eye_scheduler_state
     SET next_runner_index = ?1, updated_at = ?2
     WHERE id = 1`,
  ).bind(nextRunnerIndex, now).run()
}

async function saveSuccessState(db, result, now) {
  await db.prepare(
    `UPDATE blogger_eye_scheduler_state
     SET last_runner_id = ?1, last_exit_ip = ?2, updated_at = ?3
     WHERE id = 1`,
  ).bind(result.runnerId, result.exitIp, now).run()
}

async function saveRun(db, run) {
  await db.prepare(
    `INSERT INTO blogger_eye_runs (
       id, trigger_type, scheduled_at, started_at, completed_at, mode, target_url,
       runner_id, runner_label, exit_ip, previous_exit_ip, ip_changed,
       http_status, duration_ms, effective_url, error, created_at
     ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)`,
  ).bind(
    run.id,
    run.triggerType,
    run.scheduledAt,
    run.startedAt,
    run.completedAt,
    run.mode,
    run.targetUrl,
    run.runnerId,
    run.runnerLabel,
    run.exitIp,
    run.previousExitIp,
    run.ipChanged,
    run.httpStatus,
    run.durationMs,
    run.effectiveUrl,
    run.error,
    run.completedAt,
  ).run()
}

export async function runBloggerEyeSchedule(env, controller = {}) {
  const startedAt = Date.now()
  const scheduledAt = Number(controller.scheduledTime) || startedAt
  const target = targetUrl(env.BLOGGER_EYE_TARGET_URL)
  const runners = parseRunnerConfig(env.BLOGGER_EYE_RUNNERS)
  const globalping = env.BLOGGER_EYE_FREE_PROBES === 'globalping'
    && !(runners.length && env.BLOGGER_EYE_RUNNER_SECRET)
  const nodes = globalping ? GLOBALPING_REGIONS : runners
  let stateReadable = true
  let stateWarning = ''
  let state
  try {
    state = await loadState(env.DB)
  } catch (error) {
    stateReadable = false
    stateWarning = errorText(error)
    state = {
      next_runner_index: runnerIndexForTime(scheduledAt, nodes.length),
      last_runner_id: '',
      last_exit_ip: '',
    }
    console.warn(JSON.stringify({
      event: 'blogger_eye_state_read_skipped',
      scheduledAt,
      fallbackRunnerIndex: state.next_runner_index,
      error: stateWarning,
    }))
  }
  const selection = selectRunner(nodes, state.next_runner_index)
  const runnerMode = Boolean(selection.runner && env.BLOGGER_EYE_RUNNER_SECRET)
  if (stateReadable) {
    try {
      await advanceRunner(env.DB, selection.nextRunnerIndex, startedAt)
    } catch (error) {
      stateReadable = false
      stateWarning = errorText(error)
      console.warn(JSON.stringify({ event: 'blogger_eye_state_advance_skipped', error: stateWarning }))
    }
  }

  const base = {
    id: crypto.randomUUID(),
    triggerType: controller.cron ? 'cron' : 'manual',
    scheduledAt,
    startedAt,
    targetUrl: target,
    previousExitIp: String(state.last_exit_ip || ''),
  }

  try {
    const { result } = await performCheck({
      target,
      runners,
      runnerIndex: state.next_runner_index,
      runnerSecret: String(env.BLOGGER_EYE_RUNNER_SECRET || ''),
      globalping,
    })
    const completedAt = Date.now()
    const ipChanged = result.exitIp && base.previousExitIp
      ? Number(result.exitIp !== base.previousExitIp)
      : null
    const run = { ...base, ...result, completedAt, ipChanged, error: '' }
    await saveRun(env.DB, run)
    if (stateReadable) {
      try {
        await saveSuccessState(env.DB, result, completedAt)
      } catch (error) {
        stateWarning = errorText(error)
        console.warn(JSON.stringify({ event: 'blogger_eye_success_state_skipped', error: stateWarning }))
      }
    }
    console.log(JSON.stringify({ event: 'blogger_eye_run_completed', ...run }))
    return stateWarning ? { ...run, stateWarning } : run
  } catch (error) {
    const completedAt = Date.now()
    const run = {
      ...base,
      completedAt,
      mode: globalping ? 'globalping' : runnerMode ? 'regional-runner' : 'cloudflare-edge',
      runnerId: selection.runner?.id || '',
      runnerLabel: globalping ? `Globalping · ${selection.runner.label}` : selection.runner?.label || 'Cloudflare Edge',
      exitIp: '',
      ipChanged: null,
      httpStatus: 0,
      durationMs: completedAt - startedAt,
      effectiveUrl: '',
      error: errorText(error),
    }
    await saveRun(env.DB, run)
    console.error(JSON.stringify({ event: 'blogger_eye_run_failed', ...run }))
    throw error
  }
}

export default {
  async scheduled(controller, env) {
    await runBloggerEyeSchedule(env, controller)
  },

  async fetch(request, env) {
    const url = new URL(request.url)
    const healthPath = url.pathname === '/health' || url.pathname === `${INTERNAL_ROUTE_PREFIX}/health`
    const runPath = url.pathname === '/run' || url.pathname === `${INTERNAL_ROUTE_PREFIX}/run`
    if (request.method === 'GET' && healthPath) {
      const runners = parseRunnerConfig(env.BLOGGER_EYE_RUNNERS)
      const privateReady = runners.length > 0 && Boolean(env.BLOGGER_EYE_RUNNER_SECRET)
      const freeProbes = env.BLOGGER_EYE_FREE_PROBES === 'globalping' && !privateReady
      return json({
        ok: true,
        service: 'blogger-eye-scheduler',
        schedule: 'every-20-minutes',
        target: targetUrl(env.BLOGGER_EYE_TARGET_URL),
        runnerCount: runners.length,
        rotationReady: freeProbes || (runners.length > 1 && privateReady),
        freeProbeProvider: freeProbes ? 'globalping' : null,
        freeProbeRegions: freeProbes ? GLOBALPING_REGIONS.map(({ label, country }) => ({ label, country })) : [],
        manualRunReady: Boolean(env.BLOGGER_EYE_MANUAL_SECRET),
      })
    }

    if (request.method === 'POST' && runPath) {
      if (!(await manualRunAuthorized(request, env))) {
        return json({ ok: false, error: 'unauthorized' }, { status: 401 })
      }
      try {
        const run = await runBloggerEyeSchedule(env)
        return json({ ok: true, run })
      } catch (error) {
        return json({ ok: false, error: errorText(error) }, { status: 502 })
      }
    }

    return json({ ok: false, error: 'not found' }, { status: 404 })
  },
}

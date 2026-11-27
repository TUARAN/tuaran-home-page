import {
  cumulativeAnalyticsWindow,
  equalComparisonWindow,
  normalizeUmamiStats,
} from './analyticsSources.mjs'

const DEFAULT_UMAMI_WEBSITE_ID = '8bb48b09-3e10-4ec1-9bbe-c55c87418fa9'
const DEFAULT_UMAMI_SHARE_SLUG = '3mOsBgzrmb9wY8bI'
const UMAMI_API_BASE = 'https://api.umami.is/api'
const UMAMI_SHARE_API_BASE = 'https://cloud.umami.is/analytics/us/api'

async function readJson(response, source) {
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(`${source}_HTTP_${response.status}`)
  return payload
}

async function resolveUmamiClient(env) {
  const apiKey = String(env?.UMAMI_API_KEY || '').trim()
  let websiteId = String(env?.UMAMI_WEBSITE_ID || DEFAULT_UMAMI_WEBSITE_ID).trim()
  let apiBase = UMAMI_API_BASE
  let headers = { Accept: 'application/json', Authorization: `Bearer ${apiKey}` }

  if (!apiKey) {
    const shareSlug = String(env?.UMAMI_SHARE_SLUG || DEFAULT_UMAMI_SHARE_SLUG).trim()
    apiBase = String(env?.UMAMI_SHARE_API_BASE || UMAMI_SHARE_API_BASE).replace(/\/+$/, '')
    const share = await fetch(`${apiBase}/share/${encodeURIComponent(shareSlug)}`, {
      cf: { cacheTtl: 300 },
      signal: AbortSignal.timeout(15_000),
    }).then((response) => readJson(response, 'UMAMI_SHARE'))
    const shareToken = String(share?.token || '').trim()
    websiteId = String(share?.websiteId || websiteId).trim()
    if (!shareToken || !websiteId) throw new Error('UMAMI_SHARE_INVALID')
    headers = {
      Accept: 'application/json',
      'x-umami-share-token': shareToken,
      'x-umami-share-context': '1',
    }
  } else if (!websiteId) {
    throw new Error('UMAMI_WEBSITE_ID_MISSING')
  }

  return { apiBase, websiteId, headers }
}

export async function fetchUmamiWindowStats(env, window) {
  try {
    const client = await resolveUmamiClient(env)
    const url = `${client.apiBase}/websites/${encodeURIComponent(client.websiteId)}/stats`
      + `?startAt=${window.currentStart}&endAt=${window.currentEnd}`
    const raw = await fetch(url, {
      headers: client.headers,
      cf: { cacheTtl: 120 },
      signal: AbortSignal.timeout(15_000),
    }).then((response) => readJson(response, 'UMAMI'))
    return { status: 'ok', stats: normalizeUmamiStats(raw) }
  } catch (error) {
    return { status: 'error', message: String(error?.message || 'UMAMI_FETCH_FAILED') }
  }
}

export async function fetchPublicSiteTrafficSummary(env, now = Date.now()) {
  const totalWindow = cumulativeAnalyticsWindow(now)
  const weekWindow = equalComparisonWindow(7, now)
  const [total, week] = await Promise.all([
    fetchUmamiWindowStats(env, totalWindow),
    fetchUmamiWindowStats(env, weekWindow),
  ])

  const ok = total.status === 'ok' && week.status === 'ok'
  return {
    status: ok ? 'ok' : 'unavailable',
    generatedAt: now,
    totalPv: ok ? total.stats.views : null,
    weekPv: ok ? week.stats.views : null,
    weekUv: ok ? week.stats.visitors : null,
    source: 'umami',
  }
}
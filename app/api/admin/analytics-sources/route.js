import { getOwnerOrReject } from '../../../../lib/adminAuth'
import {
  ANALYTICS_METRIC_DEFINITIONS,
  detectTrafficSpike,
  equalComparisonWindow,
  normalizeUmamiStats,
  normalizeDailyUniqueIps,
  shanghaiSeriesDate,
  summarizeCloudflareGroups,
  VIBECAFE_ANALYTICS,
} from '../../../../lib/analyticsSources.mjs'
import { getIntegrationEnv } from '../../../../lib/integrationKeys'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const ALLOWED_DAYS = new Set([1, 7, 30, 90])
const DEFAULT_UMAMI_WEBSITE_ID = '8bb48b09-3e10-4ec1-9bbe-c55c87418fa9'
const UMAMI_API_BASE = 'https://api.umami.is/api'
const CLOUDFLARE_GRAPHQL_URL = 'https://api.cloudflare.com/client/v4/graphql'

function sourceUnavailable(source, required, message = '') {
  return { source, status: 'unconfigured', required, message }
}

function sourceError(source, message) {
  return { source, status: 'error', message }
}

async function readJson(response, source) {
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(`${source}_HTTP_${response.status}`)
  return payload
}

async function loadDailyUniqueIps(env, window) {
  const token = String(env.CLOUDFLARE_ANALYTICS_TOKEN || '').trim()
  const zoneId = String(env.CLOUDFLARE_ZONE_ID || '').trim()
  if (!token || !zoneId) return sourceUnavailable('cloudflare-ips', ['CLOUDFLARE_ANALYTICS_TOKEN', 'CLOUDFLARE_ZONE_ID'], '尚未接通独立 IP 统计，不能用 Umami UV 或阅读指纹替代。')
  const endDate = new Date(window.currentEnd).toISOString().slice(0, 10)
  const startDate = new Date(Date.parse(`${endDate}T00:00:00Z`) - (window.days - 1) * 86400000).toISOString().slice(0, 10)
  try {
    const response = await fetch(CLOUDFLARE_GRAPHQL_URL, {
      method: 'POST', signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query DailyIps($zoneTag: string, $start: Date, $end: Date) {
          viewer { zones(filter: {zoneTag: $zoneTag}) {
            httpRequests1dGroups(limit: 100, filter: {date_geq: $start, date_leq: $end}) {
              dimensions { date } uniq { uniques }
            }
          } }
        }`,
        variables: { zoneTag: zoneId, start: startDate, end: endDate },
      }),
    })
    const payload = await readJson(response, 'CLOUDFLARE_IPS')
    if (payload?.errors?.length) throw new Error('独立 IP 查询不可用：请检查 Analytics 权限、套餐和历史保留期，或缩短日期范围。')
    const groups = payload?.data?.viewer?.zones?.[0]?.httpRequests1dGroups
    if (!Array.isArray(groups)) throw new Error('Cloudflare 未返回独立 IP 数据')
    const series = normalizeDailyUniqueIps(groups)
    return { source: 'cloudflare-ips', status: 'ok', timezone: 'UTC', currentDate: endDate,
      currentDayUniqueIps: series.find(row => row.date === endDate)?.uniqueIps ?? null, series }
  } catch (error) { return sourceError('cloudflare-ips', String(error?.message || error)) }
}

async function loadUmami(env, window) {
  const apiKey = String(env.UMAMI_API_KEY || '').trim()
  const websiteId = String(env.UMAMI_WEBSITE_ID || DEFAULT_UMAMI_WEBSITE_ID).trim()
  if (!apiKey) {
    return sourceUnavailable('umami', ['UMAMI_API_KEY'], '配置 Umami Cloud API Key 后显示实时站点访问。')
  }

  const headers = { Accept: 'application/json', Authorization: `Bearer ${apiKey}` }
  const endpoint = (path, startAt, endAt, extra = '') => (
    `${UMAMI_API_BASE}/websites/${encodeURIComponent(websiteId)}/${path}`
      + `?startAt=${startAt}&endAt=${endAt}${extra}`
  )

  try {
    const [currentRaw, previousRaw, seriesRaw] = await Promise.all([
      fetch(endpoint('stats', window.currentStart, window.currentEnd), { headers, cf: { cacheTtl: 60 } })
        .then((response) => readJson(response, 'UMAMI')),
      fetch(endpoint('stats', window.previousStart, window.previousEnd), { headers, cf: { cacheTtl: 60 } })
        .then((response) => readJson(response, 'UMAMI')),
      fetch(endpoint('pageviews', window.currentStart, window.currentEnd, '&unit=day&timezone=Asia%2FShanghai'), { headers, cf: { cacheTtl: 60 } })
        .then((response) => readJson(response, 'UMAMI')),
    ])
    const current = normalizeUmamiStats(currentRaw)
    const previous = normalizeUmamiStats(previousRaw)
    const pageviews = Array.isArray(seriesRaw?.pageviews) ? seriesRaw.pageviews : []
    const sessions = Array.isArray(seriesRaw?.sessions) ? seriesRaw.sessions : []
    const sessionByTime = new Map(sessions.map((row) => [String(row.x), Number(row.y) || 0]))
    return {
      source: 'umami',
      status: 'ok',
      websiteId,
      current,
      previous,
      series: pageviews.map((row) => ({
        date: shanghaiSeriesDate(row.x),
        views: Math.max(0, Number(row.y) || 0),
        visitors: Math.max(0, sessionByTime.get(String(row.x)) || 0),
      })),
    }
  } catch (error) {
    return sourceError('umami', String(error?.message || 'UMAMI_FETCH_FAILED'))
  }
}

const CLOUDFLARE_QUERY = `
  query TrafficComparison(
    $zoneTag: string,
    $current: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject,
    $previous: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject
  ) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        current: httpRequestsAdaptiveGroups(limit: 1000, filter: $current) {
          count
          sum { visits edgeResponseBytes }
          dimensions { date }
        }
        previous: httpRequestsAdaptiveGroups(limit: 1000, filter: $previous) {
          count
          sum { visits edgeResponseBytes }
          dimensions { date }
        }
      }
    }
  }
`

async function loadCloudflare(env, window) {
  const token = String(env.CLOUDFLARE_ANALYTICS_TOKEN || '').trim()
  const zoneId = String(env.CLOUDFLARE_ZONE_ID || '').trim()
  const required = [
    ...(token ? [] : ['CLOUDFLARE_ANALYTICS_TOKEN']),
    ...(zoneId ? [] : ['CLOUDFLARE_ZONE_ID']),
  ]
  if (required.length) {
    return sourceUnavailable('cloudflare', required, '配置只读 Analytics Token 与 Zone ID 后显示边缘诊断数据。')
  }

  const filter = (start, end) => ({
    datetime_geq: new Date(start).toISOString(),
    datetime_lt: new Date(end).toISOString(),
    requestSource: 'eyeball',
  })
  try {
    const response = await fetch(CLOUDFLARE_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: CLOUDFLARE_QUERY,
        variables: {
          zoneTag: zoneId,
          current: filter(window.currentStart, window.currentEnd),
          previous: filter(window.previousStart, window.previousEnd),
        },
      }),
    })
    const payload = await readJson(response, 'CLOUDFLARE')
    if (payload?.errors?.length) throw new Error('CLOUDFLARE_GRAPHQL_ERROR')
    const zone = payload?.data?.viewer?.zones?.[0]
    if (!zone) throw new Error('CLOUDFLARE_ZONE_NOT_FOUND')
    const current = summarizeCloudflareGroups(zone.current)
    const previous = summarizeCloudflareGroups(zone.previous)
    return {
      source: 'cloudflare',
      status: 'ok',
      current,
      previous,
      spike: detectTrafficSpike(current.series),
      note: '按 Cloudflare UTC 自然日返回分组；周期总数严格使用北京时间起止边界。',
    }
  } catch (error) {
    return sourceError('cloudflare', String(error?.message || 'CLOUDFLARE_FETCH_FAILED'))
  }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const requestedDays = Number(new URL(req.url).searchParams.get('days'))
  const days = ALLOWED_DAYS.has(requestedDays) ? requestedDays : 7
  const generatedAt = Date.now()
  const window = equalComparisonWindow(days, generatedAt)
  const env = getIntegrationEnv()
  const [umami, cloudflare, cloudflareIps] = await Promise.all([
    loadUmami(env, window),
    loadCloudflare(env, window),
    loadDailyUniqueIps(env, window),
  ])

  return Response.json({
    status: 'ok',
    generatedAt,
    window,
    sources: { umami, cloudflare, cloudflareIps, vibecafe: VIBECAFE_ANALYTICS },
    definitions: ANALYTICS_METRIC_DEFINITIONS,
  }, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

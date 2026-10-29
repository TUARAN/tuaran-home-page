const API_URL = 'https://api.cloudflare.com/client/v4'
const GRAPHQL_URL = `${API_URL}/graphql`
const DEFAULT_ACCOUNT_ID = '4c0eea1ce5d93ebf856f6d5ee1d58bfb'
const DEFAULT_DATABASE_ID = '9dd9a699-a708-46ca-8243-85fd12ff8d63'
const DAY_MS = 86_400_000

export const WORKERS_FREE_DAILY_REQUESTS = 100_000
export const D1_FREE_DAILY_ROWS_READ = 5_000_000
export const D1_FREE_DAILY_ROWS_WRITTEN = 100_000
/** Free 套餐日额度预警阈值：站长消息中心按 metric+level 幂等去重。 */
export const USAGE_ALERT_WARN_RATIO = 0.8
export const USAGE_ALERT_CRITICAL_RATIO = 0.95

export function utcDate(at = Date.now()) {
  return new Date(at).toISOString().slice(0, 10)
}

/**
 * 评估当日用量是否越过预警线。同一 metric 可同时跨过 warn / critical / exhausted，
 * 由通知层按 articleKey 去重，避免同一阈值重复打扰。
 */
export function evaluateUsageAlerts(report, {
  warnRatio = USAGE_ALERT_WARN_RATIO,
  criticalRatio = USAGE_ALERT_CRITICAL_RATIO,
} = {}) {
  const limits = report?.limits || {}
  const checks = [
    { metric: 'workers', label: 'Workers 调用', value: report?.workers?.total, limit: limits.workersRequests },
    { metric: 'd1-read', label: 'D1 读取行数', value: report?.d1?.rowsRead, limit: limits.d1RowsRead },
    { metric: 'd1-write', label: 'D1 写入行数', value: report?.d1?.rowsWritten, limit: limits.d1RowsWritten },
  ]
  const alerts = []
  for (const check of checks) {
    const limit = Number(check.limit) || 0
    const value = Math.max(0, Number(check.value) || 0)
    if (!limit) continue
    const ratio = value / limit
    if (ratio < warnRatio) continue
    const levels = []
    if (ratio >= warnRatio) levels.push('warn')
    if (ratio >= criticalRatio) levels.push('critical')
    if (ratio >= 1) levels.push('exhausted')
    for (const level of levels) {
      alerts.push({
        date: String(report?.date || ''),
        metric: check.metric,
        label: check.label,
        value,
        limit,
        ratio,
        level,
        topPath: String(report?.topPaths?.[0]?.path || ''),
      })
    }
  }
  return alerts
}

export function usageAlertPressureDays(history = [], warnRatio = USAGE_ALERT_WARN_RATIO) {
  return (Array.isArray(history) ? history : [])
    .filter((row) => evaluateUsageAlerts(row, { warnRatio }).some((alert) => alert.level === 'warn' || alert.level === 'critical' || alert.level === 'exhausted'))
    .map((row) => row.date)
}

export function cloudflareUsageAlertKey(date, metric, level) {
  const day = String(date || '').replace(/[^0-9-]/g, '').slice(0, 10)
  const metricId = String(metric || 'unknown').replace(/[^a-z0-9-]/g, '').slice(0, 24) || 'unknown'
  const levelId = String(level || 'warn').replace(/[^a-z]/g, '').slice(0, 16) || 'warn'
  return `cloudflare-usage:${day || 'unknown'}:${metricId}:${levelId}`
}

export function buildCloudflareUsageAlertExcerpt(alert = {}) {
  const pct = `${((Number(alert.ratio) || 0) * 100).toFixed(1)}%`
  const levelLabel = alert.level === 'exhausted' ? '已耗尽' : alert.level === 'critical' ? '接近耗尽' : '超过 80%'
  const head = `${alert.label || '用量'} ${levelLabel}（${pct}）`
  const body = `${new Intl.NumberFormat('zh-CN').format(Number(alert.value) || 0)} / ${new Intl.NumberFormat('zh-CN').format(Number(alert.limit) || 0)} · UTC ${alert.date || ''}`
  const path = alert.topPath ? `最高入口 ${String(alert.topPath).slice(0, 60)}` : ''
  return [head, body, path].filter(Boolean).join('\n').slice(0, 160)
}

export function previousUtcDate(at = Date.now()) {
  return utcDate(at - DAY_MS)
}

export function usageObjectKey(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('INVALID_USAGE_DATE')
  return `cloudflare-usage/${date}.json`
}

export async function readUsageDay(bucket, date) {
  if (!bucket) return null
  const object = await bucket.get(usageObjectKey(date))
  return object ? object.json() : null
}

export async function writeUsageDay(bucket, report) {
  if (!bucket) throw new Error('CLOUDFLARE_USAGE_STORAGE_UNAVAILABLE')
  await bucket.put(usageObjectKey(report.date), JSON.stringify(report), {
    httpMetadata: { contentType: 'application/json; charset=utf-8' },
  })
  return report
}

export async function readUsageHistory(bucket, now = Date.now(), days = 14) {
  const dates = Array.from({ length: days }, (_, index) => utcDate(now - index * DAY_MS))
  return (await Promise.all(dates.map((date) => readUsageDay(bucket, date)))).filter(Boolean)
}

const QUERY = `query CloudflareUsage($accountTag: string!, $zoneTag: string!, $start: Time!, $end: Time!, $date: Date!) {
  viewer {
    accounts(filter: {accountTag: $accountTag}) {
      workersOverviewRequestsAdaptiveGroups(limit: 100, filter: {datetime_geq: $start, datetime_lt: $end}, orderBy: [count_DESC]) {
        count dimensions { scriptName }
      }
      d1AnalyticsAdaptiveGroups(limit: 100, filter: {date_geq: $date, date_leq: $date}) {
        dimensions { databaseId }
        sum { readQueries writeQueries rowsRead rowsWritten }
      }
    }
    zones(filter: {zoneTag: $zoneTag}) {
      httpRequestsAdaptiveGroups(limit: 100, filter: {datetime_geq: $start, datetime_lt: $end, requestSource: "eyeball"}, orderBy: [count_DESC]) {
        count dimensions { clientRequestPath edgeResponseStatus }
      }
    }
  }
}`

function count(value) { return Math.max(0, Number(value) || 0) }

export function normalizeUsageData(data, { date, databaseId, collectedAt = Date.now() }) {
  const account = data?.viewer?.accounts?.[0]
  const zone = data?.viewer?.zones?.[0]
  if (!account || !zone) throw new Error('CLOUDFLARE_USAGE_ACCOUNT_OR_ZONE_MISSING')
  const scripts = (account.workersOverviewRequestsAdaptiveGroups || [])
    .map((row) => ({ name: String(row.dimensions?.scriptName || '(unknown)'), requests: count(row.count) }))
    .sort((a, b) => b.requests - a.requests)
  const databases = (account.d1AnalyticsAdaptiveGroups || [])
    .map((row) => ({
      id: String(row.dimensions?.databaseId || ''),
      readQueries: count(row.sum?.readQueries), writeQueries: count(row.sum?.writeQueries),
      rowsRead: count(row.sum?.rowsRead), rowsWritten: count(row.sum?.rowsWritten),
    }))
  const d1 = databases.find((row) => row.id === databaseId) || { id: databaseId, readQueries: 0, writeQueries: 0, rowsRead: 0, rowsWritten: 0 }
  const pathsByName = new Map()
  for (const row of zone.httpRequestsAdaptiveGroups || []) {
    const path = String(row.dimensions?.clientRequestPath || '(unknown)')
    const value = count(row.count)
    const entry = pathsByName.get(path) || { path, requests: 0, statuses: {} }
    entry.requests += value
    const status = String(row.dimensions?.edgeResponseStatus || '')
    if (status) entry.statuses[status] = (entry.statuses[status] || 0) + value
    pathsByName.set(path, entry)
  }
  const paths = [...pathsByName.values()].sort((a, b) => b.requests - a.requests)
  return {
    date, collectedAt, timezone: 'UTC',
    workers: { total: scripts.reduce((sum, row) => sum + row.requests, 0), scripts },
    d1, topPaths: paths.slice(0, 20),
    limits: { workersRequests: WORKERS_FREE_DAILY_REQUESTS, d1RowsRead: D1_FREE_DAILY_ROWS_READ, d1RowsWritten: D1_FREE_DAILY_ROWS_WRITTEN },
  }
}

function apiHeaders(token, { json = false } = {}) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  }
}

async function responseBodyText(response) {
  if (typeof response?.text === 'function') return response.text()
  if (typeof response?.json === 'function') return JSON.stringify(await response.json())
  throw new Error(`CLOUDFLARE_USAGE_HTTP_${response?.status || 'INVALID'}`)
}

async function readJsonBody(response) {
  const text = String(await responseBodyText(response) || '').trim()
  // Cloudflare 在未声明 Accept: application/json 时，403/5xx 默认返回 HTML 错误页。
  if (!text || text.startsWith('<')) throw new Error(`CLOUDFLARE_USAGE_HTTP_${response?.status || 'HTML'}`)
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`CLOUDFLARE_USAGE_HTTP_${response?.status || 'INVALID'}`)
  }
}

function graphqlFailure(payload, ok, status) {
  const message = Array.isArray(payload?.errors)
    ? payload.errors.map((item) => item?.message).filter(Boolean).join('; ').slice(0, 300)
    : ''
  if (message) return new Error(`CLOUDFLARE_USAGE_GRAPHQL:${message}`)
  if (!ok) return new Error(`CLOUDFLARE_USAGE_HTTP_${status || 'ERROR'}`)
  return null
}

function isAccountAuthError(error) {
  return /not authorized for that account/i.test(String(error?.message || error))
}

function usageVariables(accountTag, zoneTag, date) {
  return {
    accountTag, zoneTag, date, start: `${date}T00:00:00Z`,
    end: new Date(Date.parse(`${date}T00:00:00Z`) + DAY_MS).toISOString(),
  }
}

async function queryUsage(fetcher, token, variables) {
  const response = await fetcher(GRAPHQL_URL, {
    method: 'POST', signal: AbortSignal.timeout(20_000),
    headers: apiHeaders(token, { json: true }),
    body: JSON.stringify({ query: QUERY, variables }),
  })
  const payload = await readJsonBody(response)
  const failure = graphqlFailure(payload, response.ok, response.status)
  if (failure) throw failure
  return payload
}

async function discoverAccountTag(fetcher, token, zoneTag) {
  try {
    const zoneResponse = await fetcher(`${API_URL}/zones/${encodeURIComponent(zoneTag)}`, {
      headers: apiHeaders(token), signal: AbortSignal.timeout(10_000),
    })
    const zonePayload = await readJsonBody(zoneResponse)
    const fromZone = String(zonePayload?.result?.account?.id || '').trim()
    if (fromZone) return fromZone
  } catch { /* Zone Read 不是 Analytics Token 的必要权限 */ }
  try {
    const accountsResponse = await fetcher(`${API_URL}/accounts?per_page=20`, {
      headers: apiHeaders(token), signal: AbortSignal.timeout(10_000),
    })
    const accountsPayload = await readJsonBody(accountsResponse)
    const ids = (Array.isArray(accountsPayload?.result) ? accountsPayload.result : [])
      .map((row) => String(row?.id || '').trim())
      .filter(Boolean)
    if (ids.length === 1) return ids[0]
  } catch { /* 列举账号失败时保留原查询错误 */ }
  return ''
}

export async function collectCloudflareUsage(env, date, fetcher = fetch) {
  usageObjectKey(date)
  const token = String(env?.CLOUDFLARE_ANALYTICS_TOKEN || '').trim()
  const zoneTag = String(env?.CLOUDFLARE_ZONE_ID || '').trim()
  const configuredAccount = String(env?.CLOUDFLARE_ACCOUNT_ID || DEFAULT_ACCOUNT_ID).trim()
  const databaseId = String(env?.CLOUDFLARE_D1_DATABASE_ID || DEFAULT_DATABASE_ID).trim()
  if (!token || !zoneTag) throw new Error(`CLOUDFLARE_USAGE_CONFIG_MISSING:${[!token && 'CLOUDFLARE_ANALYTICS_TOKEN', !zoneTag && 'CLOUDFLARE_ZONE_ID'].filter(Boolean).join(',')}`)
  try {
    const payload = await queryUsage(fetcher, token, usageVariables(configuredAccount, zoneTag, date))
    return normalizeUsageData(payload?.data, { date, databaseId })
  } catch (error) {
    if (!isAccountAuthError(error)) throw error
    const discovered = await discoverAccountTag(fetcher, token, zoneTag)
    if (!discovered || discovered === configuredAccount) throw error
    const payload = await queryUsage(fetcher, token, usageVariables(discovered, zoneTag, date))
    return normalizeUsageData(payload?.data, { date, databaseId })
  }
}

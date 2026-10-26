const GRAPHQL_URL = 'https://api.cloudflare.com/client/v4/graphql'
const DEFAULT_ACCOUNT_ID = '4c0eea1ce5d93ebf856f6d5ee1d58bfb'
const DEFAULT_DATABASE_ID = '9dd9a699-a708-46ca-8243-85fd12ff8d63'
const DAY_MS = 86_400_000

export const WORKERS_FREE_DAILY_REQUESTS = 100_000
export const D1_FREE_DAILY_ROWS_READ = 5_000_000
export const D1_FREE_DAILY_ROWS_WRITTEN = 100_000

export function utcDate(at = Date.now()) {
  return new Date(at).toISOString().slice(0, 10)
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

export async function collectCloudflareUsage(env, date, fetcher = fetch) {
  usageObjectKey(date)
  const token = String(env?.CLOUDFLARE_ANALYTICS_TOKEN || '').trim()
  const zoneTag = String(env?.CLOUDFLARE_ZONE_ID || '').trim()
  const accountTag = String(env?.CLOUDFLARE_ACCOUNT_ID || DEFAULT_ACCOUNT_ID).trim()
  const databaseId = String(env?.CLOUDFLARE_D1_DATABASE_ID || DEFAULT_DATABASE_ID).trim()
  if (!token || !zoneTag) throw new Error(`CLOUDFLARE_USAGE_CONFIG_MISSING:${[!token && 'CLOUDFLARE_ANALYTICS_TOKEN', !zoneTag && 'CLOUDFLARE_ZONE_ID'].filter(Boolean).join(',')}`)
  const response = await fetcher(GRAPHQL_URL, {
    method: 'POST', signal: AbortSignal.timeout(20_000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: {
      accountTag, zoneTag, date, start: `${date}T00:00:00Z`,
      end: new Date(Date.parse(`${date}T00:00:00Z`) + DAY_MS).toISOString(),
    } }),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(`CLOUDFLARE_USAGE_HTTP_${response.status}`)
  if (payload?.errors?.length) throw new Error(`CLOUDFLARE_USAGE_GRAPHQL:${payload.errors.map((item) => item.message).join('; ').slice(0, 300)}`)
  return normalizeUsageData(payload?.data, { date, databaseId })
}

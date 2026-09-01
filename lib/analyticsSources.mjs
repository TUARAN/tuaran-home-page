const DAY_MS = 24 * 60 * 60 * 1000
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000

function nonNegativeNumber(value) {
  return Math.max(0, Number(value) || 0)
}

function shanghaiDayStart(now) {
  const local = new Date(now + SHANGHAI_OFFSET_MS)
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - SHANGHAI_OFFSET_MS
}

export function equalComparisonWindow(days, now = Date.now()) {
  const currentEnd = now
  const currentStart = shanghaiDayStart(now) - (days - 1) * DAY_MS
  const elapsed = currentEnd - currentStart
  const previousEnd = currentStart
  const previousStart = previousEnd - elapsed
  return {
    days,
    timezone: 'Asia/Shanghai',
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  }
}

export function summarizeCloudflareGroups(groups = []) {
  const series = groups
    .map((row) => ({
      date: String(row?.dimensions?.date || ''),
      requests: nonNegativeNumber(row?.count),
      visits: nonNegativeNumber(row?.sum?.visits),
      bytes: nonNegativeNumber(row?.sum?.edgeResponseBytes),
    }))
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date))

  return series.reduce((summary, row) => ({
    requests: summary.requests + row.requests,
    visits: summary.visits + row.visits,
    bytes: summary.bytes + row.bytes,
    series: summary.series.concat(row),
  }), { requests: 0, visits: 0, bytes: 0, series: [] })
}

export function normalizeUmamiStats(stats = {}) {
  const views = nonNegativeNumber(stats.pageviews)
  const visitors = nonNegativeNumber(stats.visitors)
  const visits = nonNegativeNumber(stats.visits)
  const bounces = nonNegativeNumber(stats.bounces)
  const totalTimeSeconds = nonNegativeNumber(stats.totaltime)
  return {
    views,
    visitors,
    visits,
    bounces,
    totalTimeSeconds,
    bounceRate: visits ? bounces / visits : 0,
    averageVisitSeconds: visits ? totalTimeSeconds / visits : 0,
  }
}

function median(values) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function detectTrafficSpike(series = []) {
  if (series.length < 2) return null
  const peak = [...series].sort((a, b) => nonNegativeNumber(b.requests) - nonNegativeNumber(a.requests))[0]
  const baselineValues = series
    .filter((row) => row !== peak)
    .map((row) => nonNegativeNumber(row.requests))
    .filter((value) => value > 0)
  const baseline = median(baselineValues)
  const requests = nonNegativeNumber(peak?.requests)
  if (requests < 1000 || baseline <= 0 || requests < baseline * 5) return null
  return {
    date: String(peak.date || ''),
    requests,
    baseline,
    multiple: requests / baseline,
  }
}

export const ANALYTICS_METRIC_DEFINITIONS = [
  {
    id: 'site-visitors',
    source: 'Umami',
    label: '站点访客',
    role: '主指标',
    definition: '执行 Umami 浏览器脚本并在所选周期内形成唯一会话标识的访客数。月初轮换盐值，不能跨月当作永久用户 ID。',
    caveat: '广告拦截、禁用 JavaScript 或脚本加载失败会漏记。',
  },
  {
    id: 'site-visits',
    source: 'Umami',
    label: '访问次数',
    role: '主指标',
    definition: 'Umami 按访问标识去重的会话次数；访问标识基于会话并使用按小时轮换的盐值。',
    caveat: '用于站点访问趋势，不等同于人数或内容阅读次数。',
  },
  {
    id: 'qualified-content-reads',
    source: '自建 D1',
    label: '有效内容阅读',
    role: '主指标',
    definition: '白名单内容页在前台可见且累计活跃至少 8 秒后上报；同一身份、同一内容、同一小时最多计 1 次。',
    caveat: '只覆盖装有 ContentPvBeacon 的内容页，不覆盖首页、目录、后台及普通工具页。',
  },
  {
    id: 'edge-requests',
    source: 'Cloudflare',
    label: '边缘请求',
    role: '诊断指标',
    definition: 'Cloudflare 边缘收到并返回给客户端的 eyeball HTTP 请求数；一次页面打开通常产生多条 HTML、JS、CSS、图片和 API 请求。',
    caveat: '包含合法用户、爬虫和威胁流量，不能解释为访客或阅读量。',
  },
  {
    id: 'edge-visits',
    source: 'Cloudflare',
    label: '边缘访问入口',
    role: '诊断指标',
    definition: 'Cloudflare 识别为从外站或直接链接进入的 HTML 页面入口；一个 Visit 可包含多个页面浏览。',
    caveat: '基于边缘 Referer 规则，含爬虫且与 Umami 浏览器会话定义不同。',
  },
]

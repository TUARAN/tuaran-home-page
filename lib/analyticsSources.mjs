const DAY_MS = 24 * 60 * 60 * 1000
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000

export function shanghaiSeriesDate(value) {
  const raw = String(value || '')
  if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)) return raw.slice(0, 10)
  const timestamp = Date.parse(raw)
  return Number.isFinite(timestamp) ? new Date(timestamp + SHANGHAI_OFFSET_MS).toISOString().slice(0, 10) : ''
}

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

export function normalizeDailyUniqueIps(groups = []) {
  // Daily uniques must never be added up into a period-wide unique count.
  return groups.map(row => ({
    date: String(row?.dimensions?.date || ''),
    uniqueIps: row?.uniq?.uniques == null ? null : nonNegativeNumber(row.uniq.uniques),
  })).filter(row => row.date).sort((a, b) => a.date.localeCompare(b.date))
}

export const VIBECAFE_ANALYTICS = {
  source: 'vibecafe', status: 'report-unavailable',
  productUrl: 'https://vibecafe.ai/products/cmtdnddxq00000bjnah8p87ji',
  scriptUrl: 'https://vibecafe.ai/telemetry/v1.js',
  verifiedAt: '2026-09-04',
  message: '已安装浏览器采集脚本，尚未接入报表读取接口；这里没有实时 UV/PV 数值。',
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
    caveat: '估算浏览器访客，不等于自然人数或独立 IP。广告拦截、禁用 JavaScript 或脚本加载失败会漏记；Globalping 不执行脚本，不计入。',
  },
  {
    id: 'visit-duration', source: 'Umami', label: '平均访问时长', role: '参考指标',
    definition: '接口 totaltime / visits，单位秒。按访问中的统计记录计算时间跨度；不是页面可见计时。',
    caveat: '单页访问通常缺少后续时间点，末页停留也可能漏计；0 秒不代表没有阅读。不能用自建 8 秒门槛推算实际停留。',
  },
  {
    id: 'daily-unique-ips', source: 'Cloudflare', label: '每日独立 IP', role: '诊断指标',
    definition: 'httpRequests1dGroups 的 uniq.uniques，按 UTC 自然日对来源 IP 去重。只逐日展示，不把每日去重值相加冒充周期去重。',
    caveat: '含自动请求；多人可共用一个 IP，一个人也可使用多个 IP。UTC 日期从北京时间当日 08:00 开始，和浏览器统计日界线不同。',
  },
  {
    id: 'vibecafe-visitor', source: 'VibeCafé', label: 'VibeCafé 采集', role: '补充来源',
    definition: '已核对 v1 脚本：localStorage 为每个产品保存随机 visitorId；首次加载及网址变化时发送 pageview，无 8 秒门槛。',
    caveat: '换 IP 不会直接重建本地 ID；清除存储、换浏览器可能产生新 ID。尊重 DNT/GPC。脚本不发送停留时长；服务端去重周期和过滤规则待报表文档确认。',
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
    definition: '白名单内容页在前台累计可见至少 8 秒后上报；同一请求指纹、同一内容、同一小时最多计 1 次。UV 优先按账号/游客 ID 去重，缺失时使用请求指纹。',
    caveat: '只覆盖装有 ContentPvBeacon 的内容页，不覆盖全站。指纹包含 IP、User-Agent 和语言，不是纯 IP。8 秒是上报门槛，不是实际平均停留时长；可见也不能证明人在阅读。',
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

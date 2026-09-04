import { isIP } from 'node:net'

// Public network measurements: no account, proxy credentials, or paid credits.
export const GLOBALPING_REGIONS = [
  { id: 'gp-sg', label: '新加坡', country: 'SG' },
  { id: 'gp-jp', label: '日本', country: 'JP' },
  { id: 'gp-us', label: '美国', country: 'US' },
  { id: 'gp-de', label: '德国', country: 'DE' },
  { id: 'gp-au', label: '澳大利亚', country: 'AU' },
  { id: 'gp-hk', label: '香港', country: 'HK' },
]

const API = 'https://api.globalping.io/v1/measurements'
const HEADERS = {
  accept: 'application/json',
  'accept-encoding': 'gzip',
  'content-type': 'application/json',
  'user-agent': 'blogger-eye-scheduler/1.0 (+https://2aran.com)',
}
const REDIRECTS = new Set([301, 302, 303, 307, 308])

function authorizedUrl(value) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash
    || (url.hostname !== '2aran.com' && !url.hostname.endsWith('.2aran.com'))) {
    throw new Error('Globalping 仅检查已授权的 2aran.com HTTPS 域名')
  }
  return url
}

async function readJson(response) {
  // A single probe includes bounded body/headers, raw output, and TLS metadata.
  if (!response.body) throw new Error('Globalping 返回空响应')
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 128 * 1024) throw new Error('Globalping 响应超过限制')
      chunks.push(value)
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return JSON.parse(new TextDecoder().decode(bytes))
}

async function measurement({ url, locations, fetchImpl, sleep, signal }) {
  const created = await fetchImpl(API, {
    method: 'POST', headers: HEADERS, redirect: 'error', signal,
    body: JSON.stringify({
      type: 'http', target: url.hostname, limit: 1, locations,
      measurementOptions: {
        protocol: 'HTTPS', port: 443, ipVersion: 4,
        request: { method: 'GET', path: url.pathname, ...(url.search ? { query: url.search.slice(1) } : {}) },
      },
    }),
  })
  if (!created.ok) {
    const detail = await readJson(created).catch(() => ({}))
    const reason = created.status === 429 ? '免费额度暂时受限，等待下轮'
      : JSON.stringify(detail.error?.params || detail.error?.message || '').slice(0, 300)
    throw new Error(`Globalping HTTP ${created.status}：${reason}`)
  }
  const data = await readJson(created)
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(data.id || '') || data.probesCount !== 1) {
    throw new Error('Globalping 没有可用的单个地区节点')
  }
  let etag = ''
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (attempt) await sleep(1000)
    const response = await fetchImpl(`${API}/${data.id}`, {
      headers: { ...HEADERS, ...(etag ? { 'if-none-match': etag } : {}) },
      redirect: 'error', signal,
    })
    if (response.status === 304) { await response.body?.cancel().catch(() => {}); continue }
    if (!response.ok) {
      await response.body?.cancel().catch(() => {})
      throw new Error(`Globalping 查询 HTTP ${response.status}`)
    }
    etag = response.headers.get('etag') || ''
    const result = await readJson(response)
    if (result.status === 'in-progress') continue
    const item = result.results?.[0]
    if (result.results?.length !== 1 || item?.result?.status !== 'finished' || !item.result.statusCode) {
      throw new Error('Globalping 节点离线或目标请求失败，等待下轮地区轮换')
    }
    return { id: data.id, ...item }
  }
  throw new Error('Globalping 测试等待超时')
}

export async function checkViaGlobalping({ target, region, fetchImpl = fetch, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  let url = authorizedUrl(target)
  let locations = [{ country: region.country }]
  const signal = AbortSignal.timeout(60_000)
  let measured
  let durationMs = 0
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    measured = await measurement({ url, locations, fetchImpl, sleep, signal })
    locations = measured.id // Reuse the actual probe, not a new random probe in the country.
    durationMs += Number(measured.result.timings?.total) || 0
    const location = measured.result.headers?.location
    if (!REDIRECTS.has(measured.result.statusCode) || !location) break
    if (redirects === 4) throw new Error('目标重定向超过 4 次')
    url = authorizedUrl(new URL(location, url).href)
  }
  // resolvedAddress is the destination IP. Read the source IP from the same
  // probe's request to the target origin's Cloudflare trace endpoint instead.
  const trace = await measurement({
    url: new URL('/cdn-cgi/trace', url), locations, fetchImpl, sleep, signal,
  })
  const exitIp = String(trace.result.rawBody || '').match(/^ip=([^\r\n]+)$/m)?.[1]?.trim() || ''
  if (trace.result.statusCode !== 200 || !isIP(exitIp) || exitIp === '2a06:98c0:3600::103') {
    throw new Error('目标站未回显可验证的节点 IP')
  }
  return {
    mode: 'globalping', runnerId: region.id,
    runnerLabel: `Globalping · ${region.label} · ${measured.probe.city}`,
    exitIp, httpStatus: measured.result.statusCode, durationMs, effectiveUrl: url.href,
  }
}

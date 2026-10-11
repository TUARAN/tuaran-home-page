const PROXY_PATTERN = /(?:(?:https?|socks4|socks5):\/\/)?(?:[^:@\s]+:[^@\s]+@)?(?:\[[0-9a-f:.]+\]|[a-z0-9.-]+):\d{2,5}/gi

export function normalizeBloggerEyeProxy(value) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed
  return `http://${trimmed}`
}

export function isValidBloggerEyeTarget(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
export function build91HttpUrl(config = {}) {
  if (typeof config.apiUrl === 'string' && config.apiUrl.trim()) {
    const url = new URL(config.apiUrl.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('91HTTP API 链接必须以 http 或 https 开头')
    }
    const hostname = url.hostname.toLowerCase()
    if (hostname !== '91http.com' && !hostname.endsWith('.91http.com')) {
      throw new Error('只允许请求 91http.com 的 API 链接')
    }
    if (config.num) url.searchParams.set('num', String(config.num).trim())
    if (config.protocol) url.searchParams.set('protocol', String(config.protocol).trim())
    return url.toString()
  }

  if (!config.tradeNo || !config.secret) {
    throw new Error('请填写 91HTTP 的 trade_no 和 secret，或提供完整 API 链接')
  }

  const params = new URLSearchParams()
  const entries = {
    trade_no: config.tradeNo,
    secret: config.secret,
    num: config.num || '1',
    protocol: config.protocol || '1',
    format: config.format || 'json',
    province: config.province,
    city: config.city,
    area: config.area,
    isp: config.isp,
    filter: config.filter,
    split: config.split,
    type: config.type,
  }
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined && value !== null && String(value).trim()) {
      params.set(key, String(value).trim())
    }
  }
  return `http://api.91http.com/v1/get-ip?${params.toString()}`
}

function collectProxyStrings(value, found = []) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(PROXY_PATTERN)) found.push(match[0])
    return found
  }
  if (Array.isArray(value)) {
    for (const item of value) collectProxyStrings(item, found)
    return found
  }
  if (value && typeof value === 'object') {
    const host = value.ip || value.host || value.proxy_ip || value.server
    const port = value.port || value.proxy_port
    const user = value.user || value.username || value.account
    const pass = value.pass || value.password
    if (host && port) found.push(`${user && pass ? `${user}:${pass}@` : ''}${host}:${port}`)
    for (const item of Object.values(value)) collectProxyStrings(item, found)
  }
  return found
}

export function parse91HttpResponse(rawValue) {
  const raw = String(rawValue || '').trim()
  let parsed = null
  if (raw.startsWith('{') || raw.startsWith('[')) {
    try {
      parsed = JSON.parse(raw)
    } catch {}
  }
  const candidates = collectProxyStrings(parsed || raw)
  const proxies = [...new Set(candidates.map(normalizeBloggerEyeProxy).filter(Boolean))]
  const code = parsed?.code ?? parsed?.status ?? null
  const message = parsed?.msg || parsed?.message || parsed?.error || ''
  return {
    ok: proxies.length > 0 && !/^(0|false)$/i.test(String(code ?? '')),
    code,
    message,
    proxies,
    raw: raw.slice(0, 3000),
  }
}

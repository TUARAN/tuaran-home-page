export const DEFAULT_BLOGGER_EYE_ALLOWED_HOSTS = Object.freeze(['2aran.com', '*.2aran.com'])

const HOST_PATTERN = /^(?:\*\.)?[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const TEXT_CONTENT_TYPES = [
  'text/',
  'application/json',
  'application/ld+json',
  'application/javascript',
  'application/xml',
  'application/xhtml+xml',
]

function normalizedHostPattern(value) {
  const pattern = String(value || '').trim().toLowerCase().replace(/\.$/, '')
  if (!HOST_PATTERN.test(pattern) || pattern === '*' || pattern === 'localhost') return ''
  if (pattern.includes('..')) return ''
  return pattern
}

export function parseBloggerEyeAllowedHosts(value = '') {
  const configured = String(value || '')
    .split(',')
    .map(normalizedHostPattern)
    .filter(Boolean)
  return [...new Set([...DEFAULT_BLOGGER_EYE_ALLOWED_HOSTS, ...configured])]
}

export function parseBloggerEyeRunnerConfig(value = '') {
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
    if (!/^[a-z0-9][a-z0-9_-]{0,31}$/.test(id) || seen.has(id)) continue
    try {
      const url = new URL(String(item?.url || '').trim())
      const hostname = url.hostname.toLowerCase().replace(/\.$/, '')
      if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash || isLocalHostname(hostname)) continue
      seen.add(id)
      runners.push({ id, label: label || id, url: url.toString() })
      if (runners.length >= 8) break
    } catch {}
  }
  return runners
}

function isIpLiteral(hostname) {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return true
  return hostname.includes(':')
}

function isLocalHostname(hostname) {
  return hostname === 'localhost'
    || hostname.endsWith('.localhost')
    || hostname.endsWith('.local')
    || isIpLiteral(hostname)
}

function hostMatchesPattern(hostname, pattern) {
  if (pattern.startsWith('*.')) {
    const base = pattern.slice(2)
    return hostname !== base && hostname.endsWith(`.${base}`)
  }
  return hostname === pattern
}

export function validateBloggerEyeCloudTarget(value, allowedHosts = DEFAULT_BLOGGER_EYE_ALLOWED_HOSTS) {
  let url
  try {
    url = new URL(String(value || '').trim())
  } catch {
    throw new Error('请输入完整的 HTTPS 目标链接')
  }

  if (url.protocol !== 'https:') throw new Error('云端访问目标必须使用 HTTPS')
  if (url.username || url.password) throw new Error('目标链接不能包含账号密码')
  if (url.port && url.port !== '443') throw new Error('目标链接不能指定自定义端口')

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '')
  if (isLocalHostname(hostname)) throw new Error('云端访问不能使用本地或 IP 地址')
  const normalizedAllowedHosts = [...new Set((allowedHosts || []).map(normalizedHostPattern).filter(Boolean))]
  if (!normalizedAllowedHosts.some((pattern) => hostMatchesPattern(hostname, pattern))) {
    throw new Error(`目标域名 ${hostname} 不在授权域名范围`)
  }

  url.hostname = hostname
  url.hash = ''
  return { url: url.toString(), hostname }
}

async function readLimitedText(response, maxBytes) {
  if (!response.body) return { text: '', truncated: false }
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  let truncated = false

  try {
    while (size < maxBytes) {
      const { done, value } = await reader.read()
      if (done) break
      const remaining = maxBytes - size
      if (value.byteLength > remaining) {
        chunks.push(value.slice(0, remaining))
        size += remaining
        truncated = true
        break
      }
      chunks.push(value)
      size += value.byteLength
    }
    if (size >= maxBytes && !truncated) {
      const next = await reader.read()
      truncated = !next.done
    }
  } finally {
    if (truncated) await reader.cancel().catch(() => {})
  }

  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return { text: new TextDecoder().decode(bytes), truncated }
}

function isTextResponse(response) {
  const contentType = String(response.headers.get('content-type') || '').toLowerCase()
  return !contentType || TEXT_CONTENT_TYPES.some((prefix) => contentType.startsWith(prefix))
}

export async function visitBloggerEyeTarget({
  targetUrl,
  allowedHosts = DEFAULT_BLOGGER_EYE_ALLOWED_HOSTS,
  fetchImpl = fetch,
  maxRedirects = 4,
  maxPreviewBytes = 64 * 1024,
} = {}) {
  const startedAt = Date.now()
  let current = validateBloggerEyeCloudTarget(targetUrl, allowedHosts).url
  let redirects = 0

  while (true) {
    const response = await fetchImpl(current, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
      headers: {
        accept: 'text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.1',
        'user-agent': 'blogger-eye-cloud/2.0',
      },
    })

    const location = response.headers.get('location')
    if (REDIRECT_STATUSES.has(response.status) && location) {
      if (redirects >= maxRedirects) throw new Error(`目标重定向超过 ${maxRedirects} 次`)
      current = validateBloggerEyeCloudTarget(new URL(location, current).toString(), allowedHosts).url
      await response.body?.cancel().catch(() => {})
      redirects += 1
      continue
    }

    const contentType = response.headers.get('content-type') || ''
    const previewResult = isTextResponse(response)
      ? await readLimitedText(response, maxPreviewBytes)
      : { text: `无法预览 ${contentType || '未知类型'} 响应。`, truncated: false }
    if (!isTextResponse(response)) await response.body?.cancel().catch(() => {})

    return {
      ok: true,
      status: response.status,
      effectiveUrl: current,
      durationMs: Date.now() - startedAt,
      redirects,
      contentType,
      contentLength: response.headers.get('content-length') || '',
      cfRay: response.headers.get('cf-ray') || '',
      server: response.headers.get('server') || '',
      preview: previewResult.text.replace(/\s+/g, ' ').trim(),
      previewTruncated: previewResult.truncated,
    }
  }
}

export async function detectBloggerEyeCloudIp(fetchImpl = fetch) {
  const startedAt = Date.now()
  const response = await fetchImpl('https://api.ipify.org?format=json', {
    headers: { accept: 'application/json', 'user-agent': 'blogger-eye-cloud/2.0' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`云端出口检测失败：HTTP ${response.status}`)
  const { text } = await readLimitedText(response, 2048)
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('云端出口检测返回了无效响应')
  }
  const ip = String(data?.ip || '').trim()
  if (!ip) throw new Error('云端出口检测没有返回 IP')
  return { ip, durationMs: Date.now() - startedAt, service: 'api.ipify.org' }
}

export async function runBloggerEyeRegionalChecks({
  targetUrl,
  allowedHosts = DEFAULT_BLOGGER_EYE_ALLOWED_HOSTS,
  runners = [],
  secret,
  fetchImpl = fetch,
} = {}) {
  const target = validateBloggerEyeCloudTarget(targetUrl, allowedHosts).url
  if (!runners.length) throw new Error('尚未配置地区 Runner')
  if (!secret) throw new Error('地区 Runner 共享密钥未配置')

  return Promise.all(runners.map(async (runner) => {
    const startedAt = Date.now()
    try {
      const response = await fetchImpl(runner.url, {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(20_000),
        headers: {
          authorization: `Bearer ${secret}`,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({ url: target }),
      })
      const { text } = await readLimitedText(response, 16 * 1024)
      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error('Runner 返回了无效响应')
      }
      if (!response.ok || data?.ok === false) throw new Error(data?.error || `Runner HTTP ${response.status}`)
      return {
        id: runner.id,
        label: runner.label,
        ok: true,
        ip: String(data?.ip || ''),
        status: Number(data?.status) || 0,
        durationMs: Number(data?.durationMs) || Date.now() - startedAt,
        effectiveUrl: String(data?.effectiveUrl || target),
      }
    } catch (error) {
      return {
        id: runner.id,
        label: runner.label,
        ok: false,
        durationMs: Date.now() - startedAt,
        error: error?.message || String(error),
      }
    }
  }))
}

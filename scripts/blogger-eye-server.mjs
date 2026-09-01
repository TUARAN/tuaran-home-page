import { createServer } from 'node:http'
import { spawn } from 'node:child_process'

import {
  build91HttpUrl,
  isValidBloggerEyeTarget,
  normalizeBloggerEyeProxy,
  parse91HttpResponse,
} from '../lib/bloggerEyeCore.mjs'

const host = '127.0.0.1'
const port = Number(process.env.BLOGGER_EYE_PORT || 5177)
const configuredOrigins = String(process.env.BLOGGER_EYE_ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
const allowedOrigins = new Set([
  'https://admin.2aran.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...configuredOrigins,
])
const ipServices = [
  'https://api.ipify.org?format=json',
  'https://ifconfig.me/ip',
  'https://icanhazip.com',
]

function responseHeaders(req) {
  const origin = req.headers.origin || ''
  const headers = {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  }
  if (allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers.Vary = 'Origin'
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'Content-Type'
    headers['Access-Control-Allow-Private-Network'] = 'true'
  }
  return headers
}

function sendJson(req, res, status, payload) {
  res.writeHead(status, responseHeaders(req))
  res.end(JSON.stringify(payload))
}

function requestIsAllowed(req) {
  const requestHost = String(req.headers.host || '').split(':')[0].toLowerCase()
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(requestHost)) return false
  if (!req.headers.origin) return req.method === 'GET'
  return allowedOrigins.has(req.headers.origin)
}

async function readJson(req) {
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 128 * 1024) throw new Error('请求体太大')
  }
  if (!raw.trim()) return {}
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error('请求体不是有效 JSON')
  }
}

function runCurl(args, timeoutMs = 30_000) {
  return new Promise((resolve) => {
    const startedAt = Date.now()
    const child = spawn('curl', args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
    }, timeoutMs)
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8')
      if (stdout.length > 512 * 1024) stdout = stdout.slice(-512 * 1024)
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8')
      if (stderr.length > 64 * 1024) stderr = stderr.slice(-64 * 1024)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ ok: code === 0 && !timedOut, code, stdout, stderr, timedOut, durationMs: Date.now() - startedAt })
    })
    child.on('error', (error) => {
      clearTimeout(timer)
      resolve({ ok: false, code: -1, stdout, stderr: error.message, timedOut: false, durationMs: Date.now() - startedAt })
    })
  })
}

async function detectIp(proxy = '') {
  const normalizedProxy = normalizeBloggerEyeProxy(proxy)
  const errors = []
  for (const service of ipServices) {
    const args = [
      '--silent', '--show-error', '--location', '--max-time', '12', '--connect-timeout', '8',
      '--user-agent', 'blogger-eye/1.0',
    ]
    if (normalizedProxy) args.push('--proxy', normalizedProxy)
    args.push(service)
    const result = await runCurl(args, 15_000)
    if (result.ok) {
      const raw = result.stdout.trim()
      let detected = raw.split(/\s+/)[0]
      if (raw.startsWith('{')) {
        try { detected = JSON.parse(raw).ip } catch {}
      }
      if (detected) return { ip: detected, service, proxy: normalizedProxy, durationMs: result.durationMs }
    }
    errors.push(`${service}: ${result.stderr || result.stdout || `curl exit ${result.code}`}`)
  }
  throw new Error(errors.join('\n'))
}

async function visitUrl(targetUrl, proxy = '') {
  const normalizedProxy = normalizeBloggerEyeProxy(proxy)
  const args = [
    '--silent', '--show-error', '--location', '--max-redirs', '5', '--max-time', '25',
    '--connect-timeout', '10', '--compressed',
    '--write-out', '\n__BLOGGER_EYE_META__%{http_code}|%{url_effective}|%{remote_ip}|%{time_total}',
    '--user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome Safari/537.36',
  ]
  if (normalizedProxy) args.push('--proxy', normalizedProxy)
  args.push(targetUrl)
  const result = await runCurl(args)
  const marker = result.stdout.lastIndexOf('\n__BLOGGER_EYE_META__')
  const body = marker >= 0 ? result.stdout.slice(0, marker) : result.stdout
  const meta = marker >= 0 ? result.stdout.slice(marker + '\n__BLOGGER_EYE_META__'.length) : ''
  const [status = '0', effectiveUrl = targetUrl, remoteIp = '', timeTotal = '0'] = meta.trim().split('|')
  return {
    ok: result.ok,
    status: Number(status) || 0,
    effectiveUrl,
    remoteIp,
    timeTotal: Number(timeTotal) || 0,
    proxy: normalizedProxy,
    timedOut: result.timedOut,
    error: result.ok ? '' : result.stderr || `curl exit ${result.code}`,
    preview: body.replace(/\s+/g, ' ').trim().slice(0, 1200),
  }
}

async function extract91Http(config = {}) {
  const apiUrl = build91HttpUrl({ ...config, apiUrl: config.apiUrl || process.env.HTTP91_API_URL || '' })
  const result = await runCurl([
    '--silent', '--show-error', '--location', '--max-time', '20', '--connect-timeout', '10',
    '--user-agent', 'blogger-eye/1.0', apiUrl,
  ], 25_000)
  if (!result.ok) throw new Error(result.stderr || result.stdout || `91HTTP 请求失败，curl exit ${result.code}`)
  const parsed = parse91HttpResponse(result.stdout)
  if (!parsed.proxies.length) throw new Error(parsed.message || `91HTTP 没有返回可识别代理：${parsed.raw}`)
  return { ...parsed, durationMs: result.durationMs }
}

async function extractAndVisit(targetUrl, config, maxAttempts) {
  const attempts = []
  for (let index = 1; index <= maxAttempts; index += 1) {
    try {
      const extracted = await extract91Http({ ...config, num: '1' })
      const proxy = extracted.proxies[0]
      const ip = await detectIp(proxy).catch((error) => ({ ip: '', error: error.message }))
      const visit = await visitUrl(targetUrl, proxy)
      attempts.push({ index, ok: visit.ok, proxy, ip, visit })
      if (visit.ok) return { ok: true, attempts, proxy, ip, visit }
    } catch (error) {
      attempts.push({ index, ok: false, error: error.message })
    }
  }
  const last = attempts.at(-1)
  return { ok: false, attempts, error: last?.visit?.error || last?.error || '代理访问失败' }
}

const server = createServer(async (req, res) => {
  if (!requestIsAllowed(req)) {
    sendJson(req, res, 403, { ok: false, error: '来源未授权' })
    return
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, responseHeaders(req))
    res.end()
    return
  }
  try {
    const pathname = new URL(req.url || '/', `http://${req.headers.host}`).pathname
    if (req.method === 'GET' && pathname === '/api/health') {
      sendJson(req, res, 200, { ok: true, service: 'blogger-eye', host, port })
      return
    }
    if (req.method !== 'POST') {
      sendJson(req, res, 404, { ok: false, error: '接口不存在' })
      return
    }
    const body = await readJson(req)
    if (pathname === '/api/ip') {
      sendJson(req, res, 200, { ok: true, ...(await detectIp(body.proxy)) })
      return
    }
    if (pathname === '/api/visit') {
      if (!isValidBloggerEyeTarget(body.url)) throw new Error('请输入 http 或 https 开头的有效链接')
      const ip = await detectIp(body.proxy).catch((error) => ({ ip: '', error: error.message }))
      const visit = await visitUrl(body.url, body.proxy)
      sendJson(req, res, 200, { ok: visit.ok, ip, visit })
      return
    }
    if (pathname === '/api/91http/extract') {
      sendJson(req, res, 200, { ok: true, ...(await extract91Http(body)) })
      return
    }
    if (pathname === '/api/91http/extract-visit') {
      if (!isValidBloggerEyeTarget(body.url)) throw new Error('请输入 http 或 https 开头的有效链接')
      const maxAttempts = Math.min(50, Math.max(1, Number(body.maxAttempts) || 5))
      sendJson(req, res, 200, await extractAndVisit(body.url, body.config || body, maxAttempts))
      return
    }
    sendJson(req, res, 404, { ok: false, error: '接口不存在' })
  } catch (error) {
    sendJson(req, res, 400, { ok: false, error: error.message || String(error) })
  }
})

server.listen(port, host, () => {
  console.log(`博主联盟小眼睛本机服务：http://${host}:${port}`)
  console.log('保持此终端运行，然后打开后台“小眼睛”页面。')
})

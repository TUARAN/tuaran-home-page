import {
  ARTICLE_MCP_TOOLS,
  MCP_SUPPORTED_PROTOCOL_VERSIONS,
  callArticleMcpTool,
  mcpInitializeResult,
} from '../../../../lib/mcpArticles'
import { cleanupRateLimits, enforceRateLimits, getClientIp } from '../../../../lib/abuseControls'
import { listContentIndex } from '../../../../lib/contentIndex'
import { listAllContent } from '../../../../lib/contentPipeline'
import { getD1 } from '../../../../lib/d1'
import {
  MCP_ARTICLES_SCOPE,
  oauthBaseUrl,
  protectedResourceMetadataUrl,
  validateMcpAccessToken,
} from '../../../../lib/oauthServer'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 32 * 1024
const MINUTE_MS = 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const ALLOWED_ORIGINS = new Set([
  'https://2aran.com',
  'https://www.2aran.com',
  'https://admin.2aran.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
])

function jsonRpcResult(id, result) {
  return { jsonrpc: '2.0', id, result }
}

function jsonRpcError(id, code, message, data) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: { code, message, ...(data === undefined ? {} : { data }) },
  }
}

function corsHeaders(origin) {
  return origin && ALLOWED_ORIGINS.has(origin)
    ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
    : {}
}

function responseJson(body, { status = 200, origin = '', headers = {} } = {}) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders(origin),
      ...headers,
    },
  })
}

function validateOrigin(req) {
  const origin = req.headers.get('origin') || ''
  return { origin, ok: !origin || ALLOWED_ORIGINS.has(origin) }
}

function authorizationChallenge(req, auth, origin) {
  const metadata = protectedResourceMetadataUrl(oauthBaseUrl(req))
  if (auth.status === 503) {
    return responseJson(jsonRpcError(null, -32003, 'Authorization service unavailable'), { status: 503, origin })
  }
  const insufficient = auth.status === 403
  const value = insufficient
    ? `Bearer error="insufficient_scope", scope="${MCP_ARTICLES_SCOPE}", resource_metadata="${metadata}"`
    : auth.error === 'missing_token'
      ? `Bearer scope="${MCP_ARTICLES_SCOPE}", resource_metadata="${metadata}"`
      : `Bearer error="invalid_token", scope="${MCP_ARTICLES_SCOPE}", resource_metadata="${metadata}"`
  return responseJson(jsonRpcError(null, -32001, insufficient ? 'Insufficient scope' : 'Unauthorized'), {
    status: auth.status,
    origin,
    headers: { 'WWW-Authenticate': value },
  })
}

async function enforceMcpRateLimit(req) {
  let db
  try {
    db = getD1()
  } catch {
    return { ok: true, skipped: true }
  }
  const ip = getClientIp(req)
  try {
    const result = await enforceRateLimits(db, [
      { scope: 'mcp:articles:ip:minute', subject: ip, limit: 60, windowMs: MINUTE_MS },
      { scope: 'mcp:articles:ip:day', subject: ip, limit: 1000, windowMs: DAY_MS },
    ])
    await cleanupRateLimits(db).catch(() => {})
    return result
  } catch {
    // 内容查询仍可在 D1 短暂不可用时降级；生产环境还应在 Cloudflare WAF 配置边缘限流。
    return { ok: true, skipped: true }
  }
}

async function publicEntries() {
  try {
    const indexed = await listContentIndex({ status: 'published', limit: 1000 })
    if (indexed.length) {
      const byKey = new Map(listAllContent().map((entry) => [entry.contentKey, entry]))
      indexed.forEach((entry) => byKey.set(entry.contentKey, entry))
      return [...byKey.values()]
    }
  } catch {
    // Fall through to the build-time catalog.
  }
  return listAllContent()
}

export async function OPTIONS(req) {
  const { origin, ok } = validateOrigin(req)
  if (!ok) return responseJson(jsonRpcError(null, -32000, 'Origin not allowed'), { status: 403 })
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, MCP-Protocol-Version',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export async function GET(req) {
  const { origin, ok } = validateOrigin(req)
  if (!ok) return responseJson(jsonRpcError(null, -32000, 'Origin not allowed'), { status: 403 })
  const auth = await validateMcpAccessToken(req)
  if (!auth.ok) return authorizationChallenge(req, auth, origin)
  return responseJson(jsonRpcError(null, -32000, 'This stateless server does not provide an SSE stream'), {
    status: 405,
    origin,
    headers: { Allow: 'POST, OPTIONS' },
  })
}

export async function POST(req) {
  const { origin, ok: originAllowed } = validateOrigin(req)
  if (!originAllowed) {
    return responseJson(jsonRpcError(null, -32000, 'Origin not allowed'), { status: 403 })
  }

  // 鉴权失败也计入限流，避免 Access Token 被无限暴力猜测。
  const limit = await enforceMcpRateLimit(req)
  if (!limit.ok) {
    return responseJson(jsonRpcError(null, -32002, 'Rate limit exceeded', { retryAfter: limit.retryAfter }), {
      status: 429,
      origin,
      headers: { 'Retry-After': String(limit.retryAfter || 60) },
    })
  }
  const auth = await validateMcpAccessToken(req)
  if (!auth.ok) return authorizationChallenge(req, auth, origin)

  const contentType = req.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return responseJson(jsonRpcError(null, -32600, 'Content-Type must be application/json'), { status: 415, origin })
  }
  const contentLength = Number(req.headers.get('content-length') || 0)
  if (contentLength > MAX_BODY_BYTES) {
    return responseJson(jsonRpcError(null, -32600, 'Request body too large'), { status: 413, origin })
  }

  let raw
  let message
  try {
    raw = await req.text()
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE')
    message = JSON.parse(raw)
  } catch (error) {
    const tooLarge = error?.message === 'BODY_TOO_LARGE'
    return responseJson(jsonRpcError(null, -32700, tooLarge ? 'Request body too large' : 'Parse error'), {
      status: tooLarge ? 413 : 400,
      origin,
    })
  }

  if (!message || typeof message !== 'object' || Array.isArray(message) || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    return responseJson(jsonRpcError(message?.id, -32600, 'Invalid JSON-RPC request'), { status: 400, origin })
  }

  if (message.method.startsWith('notifications/')) {
    return new Response(null, { status: 202, headers: { ...corsHeaders(origin), 'X-Content-Type-Options': 'nosniff' } })
  }

  const versionHeader = req.headers.get('mcp-protocol-version')
  if (message.method !== 'initialize' && versionHeader && !MCP_SUPPORTED_PROTOCOL_VERSIONS.has(versionHeader)) {
    return responseJson(jsonRpcError(message.id, -32600, 'Unsupported MCP protocol version'), { status: 400, origin })
  }

  if (message.method === 'initialize') {
    return responseJson(jsonRpcResult(message.id, mcpInitializeResult(message.params?.protocolVersion)), { origin })
  }
  if (message.method === 'ping') return responseJson(jsonRpcResult(message.id, {}), { origin })
  if (message.method === 'tools/list') return responseJson(jsonRpcResult(message.id, { tools: ARTICLE_MCP_TOOLS }), { origin })
  if (message.method === 'tools/call') {
    const toolName = String(message.params?.name || '')
    const toolResult = callArticleMcpTool(toolName, message.params?.arguments, await publicEntries())
    if (!toolResult) {
      return responseJson(jsonRpcError(message.id, -32602, `Unknown tool: ${toolName}`), { origin })
    }
    return responseJson(jsonRpcResult(message.id, toolResult), { origin })
  }

  return responseJson(jsonRpcError(message.id, -32601, `Method not found: ${message.method}`), { origin })
}

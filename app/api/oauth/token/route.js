import { cleanupRateLimits, enforceRateLimits, getClientIp } from '../../../../lib/abuseControls'
import { getD1 } from '../../../../lib/d1'
import { exchangeAuthorizationCode, oauthBaseUrl, rotateRefreshToken } from '../../../../lib/oauthServer'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const FIVE_MINUTES_MS = 5 * 60 * 1000

function tokenJson(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
  })
}

export async function POST(req) {
  if (!(req.headers.get('content-type') || '').includes('application/x-www-form-urlencoded')) {
    return tokenJson({ error: 'invalid_request' }, 415)
  }
  let db
  try {
    db = getD1()
  } catch {
    return tokenJson({ error: 'temporarily_unavailable' }, 503)
  }
  const limited = await enforceRateLimits(db, [
    { scope: 'oauth:token:ip:5m', subject: getClientIp(req), limit: 60, windowMs: FIVE_MINUTES_MS },
  ]).catch(() => ({ ok: false }))
  if (!limited.ok) return tokenJson({ error: 'temporarily_unavailable' }, 429)

  let params
  try {
    const raw = await req.text()
    if (new TextEncoder().encode(raw).byteLength > 16 * 1024) return tokenJson({ error: 'invalid_request' }, 413)
    params = Object.fromEntries(new URLSearchParams(raw))
  } catch {
    return tokenJson({ error: 'invalid_request' }, 400)
  }
  try {
    const grantType = String(params.grant_type || '')
    const result = grantType === 'authorization_code'
      ? await exchangeAuthorizationCode(params, oauthBaseUrl(req))
      : grantType === 'refresh_token'
        ? await rotateRefreshToken(params, oauthBaseUrl(req))
        : { ok: false, error: 'unsupported_grant_type' }
    await cleanupRateLimits(db).catch(() => {})
    return result.ok ? tokenJson(result.tokens) : tokenJson({ error: result.error }, 400)
  } catch {
    return tokenJson({ error: 'temporarily_unavailable' }, 503)
  }
}

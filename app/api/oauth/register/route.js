import { cleanupRateLimits, enforceRateLimits, getClientIp } from '../../../../lib/abuseControls'
import { getD1 } from '../../../../lib/d1'
import { registerOAuthClient } from '../../../../lib/oauthServer'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const HOUR_MS = 60 * 60 * 1000

function oauthJson(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
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
  if (!(req.headers.get('content-type') || '').includes('application/json')) {
    return oauthJson({ error: 'invalid_client_metadata' }, 415)
  }
  let db
  try {
    db = getD1()
  } catch {
    return oauthJson({ error: 'temporarily_unavailable' }, 503)
  }
  const limited = await enforceRateLimits(db, [
    { scope: 'oauth:dcr:ip:hour', subject: getClientIp(req), limit: 20, windowMs: HOUR_MS },
  ]).catch(() => ({ ok: false, retryAfter: 60 }))
  if (!limited.ok) return oauthJson({ error: 'temporarily_unavailable' }, 429)

  let body
  try {
    const raw = await req.text()
    if (new TextEncoder().encode(raw).byteLength > 16 * 1024) return oauthJson({ error: 'invalid_client_metadata' }, 413)
    body = JSON.parse(raw)
  } catch {
    return oauthJson({ error: 'invalid_client_metadata' }, 400)
  }
  try {
    const result = await registerOAuthClient(body)
    await cleanupRateLimits(db).catch(() => {})
    return result.ok ? oauthJson(result.client, 201) : oauthJson({ error: result.error }, result.status)
  } catch {
    return oauthJson({ error: 'temporarily_unavailable' }, 503)
  }
}

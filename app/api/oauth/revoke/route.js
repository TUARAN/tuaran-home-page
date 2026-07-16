import { oauthBaseUrl, revokeOAuthToken } from '../../../../lib/oauthServer'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
  })
}

export async function POST(req) {
  if (!(req.headers.get('content-type') || '').includes('application/x-www-form-urlencoded')) {
    return Response.json({ error: 'invalid_request' }, { status: 415 })
  }
  try {
    const params = Object.fromEntries(new URLSearchParams(await req.text()))
    if (params.token && params.client_id) await revokeOAuthToken(params.token, params.client_id, oauthBaseUrl(req))
  } catch {
    // RFC 7009 does not disclose whether the token existed; malformed storage state is also opaque.
  }
  return new Response(null, {
    status: 200,
    headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' },
  })
}

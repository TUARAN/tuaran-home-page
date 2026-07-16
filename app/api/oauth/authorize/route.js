import { getUserFromRequest } from '../../../../lib/edgeSession'
import {
  authorizationErrorRedirect,
  createAuthorizationCode,
  oauthBaseUrl,
  validateAuthorizationRequest,
} from '../../../../lib/oauthServer'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function sameOrigin(req, baseUrl) {
  const origin = req.headers.get('origin')
  return origin && origin === new URL(baseUrl).origin
}

export async function POST(req) {
  const baseUrl = oauthBaseUrl(req)
  if (!sameOrigin(req, baseUrl)) return Response.json({ error: 'invalid_request' }, { status: 403 })
  const user = await getUserFromRequest(req).catch(() => null)
  if (!user?.id) return Response.json({ error: 'login_required' }, { status: 401 })

  let params
  try {
    params = Object.fromEntries(await req.formData())
  } catch {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }
  let checked
  try {
    checked = await validateAuthorizationRequest(params, baseUrl)
  } catch {
    return Response.json({ error: 'temporarily_unavailable' }, { status: 503 })
  }
  if (!checked.ok) return Response.json({ error: checked.error }, { status: 400 })
  if (params.decision !== 'approve') {
    return Response.redirect(authorizationErrorRedirect(checked.redirectUri, 'access_denied', checked.state), 303)
  }
  try {
    const target = await createAuthorizationCode({ request: checked, userId: String(user.id) })
    return Response.redirect(target, 303)
  } catch {
    return Response.json({ error: 'temporarily_unavailable' }, { status: 503 })
  }
}

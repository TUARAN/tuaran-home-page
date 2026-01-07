import { cookieNames, cookiesConfig, getSecrets, parseCookies, verifySession } from '../../../lib/edgeSession'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const { sessionSecret } = getSecrets()
    if (!sessionSecret) {
      return Response.json({ user: null, secureCookie: cookiesConfig().secure })
    }
    const cookies = parseCookies(req)
    const token = cookies[cookieNames.session]
    const payload = await verifySession(token, sessionSecret)
    const user = payload?.user || null
    return Response.json({ user, secureCookie: cookiesConfig().secure })
  } catch {
    return Response.json({ user: null, secureCookie: cookiesConfig().secure })
  }
}

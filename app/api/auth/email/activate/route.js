import { activateEmailUser } from '../../../../../lib/emailAuth'
import {
  cookieNames,
  cookiesConfig,
  getSecrets,
  serializeLastLoginMethodCookie,
  serializeCookie,
  signSession,
} from '../../../../../lib/edgeSession'
import { recordUserLogin } from '../../../../../lib/userDirectory'
import { awardRegisterOnLogin } from '../../../../../lib/points'
import { resolveEmailLogin } from '../../../../../lib/accountIdentities'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const { sessionSecret } = getSecrets()
    if (!sessionSecret) {
      return Response.json({ error: 'MISSING_AUTH_CONFIG', missing: ['NEXTAUTH_SECRET'] }, { status: 500 })
    }

    let body
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
    }

    const result = await activateEmailUser({
      rawEmail: body?.email,
      rawCode: body?.code,
    })
    if (!result.ok) return Response.json(result, { status: result.status || 400 })

    const account = await resolveEmailLogin(result.user)
    if (!account.ok) return Response.json({ error: account.error }, { status: account.status || 500 })
    const user = account.user
    await recordUserLogin(user)
    await awardRegisterOnLogin(user)

    const nowSeconds = Math.floor(Date.now() / 1000)
    const token = await signSession(
      { user, iat: nowSeconds, exp: nowSeconds + 7 * 24 * 60 * 60 },
      sessionSecret
    )
    const { secure } = cookiesConfig()
    const headers = new Headers()
    headers.append(
      'Set-Cookie',
      serializeCookie(cookieNames.session, token, { maxAge: 7 * 24 * 60 * 60, secure })
    )
    headers.append('Set-Cookie', serializeLastLoginMethodCookie('email', { secure }))

    return Response.json({ ok: true, user }, { headers })
  } catch (error) {
    console.error('email activation failed', error)
    return Response.json({ error: 'ACTIVATE_FAILED' }, { status: 500 })
  }
}

import { registerEmailUser } from '../../../../lib/emailAuth'
import { cookieNames, cookiesConfig, getSecrets, serializeCookie, signSession } from '../../../../lib/edgeSession'
import { recordUserLogin } from '../../../../lib/userDirectory'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const { sessionSecret } = getSecrets()
    if (!sessionSecret) {
      return Response.json({ error: 'MISSING_AUTH_CONFIG', missing: ['NEXTAUTH_SECRET'] }, { status: 500 })
    }

    const body = await req.json()
    const result = await registerEmailUser({
      rawEmail: body?.email,
      password: body?.password,
      rawCode: body?.code,
      rawName: body?.name,
    })
    if (!result.ok) return Response.json(result, { status: result.status || 400 })

    await recordUserLogin(result.user)

    const nowSeconds = Math.floor(Date.now() / 1000)
    const token = await signSession(
      { user: result.user, iat: nowSeconds, exp: nowSeconds + 7 * 24 * 60 * 60 },
      sessionSecret
    )
    const { secure } = cookiesConfig()
    const headers = new Headers()
    headers.append(
      'Set-Cookie',
      serializeCookie(cookieNames.session, token, { maxAge: 7 * 24 * 60 * 60, secure })
    )

    return Response.json({ ok: true, user: result.user }, { headers })
  } catch (error) {
    console.error('email registration failed', error)
    const message = String(error?.message || '')
    if (message.includes('UNIQUE constraint failed')) {
      return Response.json({ error: 'EMAIL_ALREADY_REGISTERED' }, { status: 409 })
    }
    return Response.json({ error: 'REGISTER_FAILED' }, { status: 500 })
  }
}

import {
  cookieNames,
  cookiesConfig,
  getSecrets,
  parseCookies,
  randomState,
  serializeCookie,
} from '../../../../lib/edgeSession'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const { githubId, appUrl } = getSecrets()
  if (!githubId) {
    return Response.json(
      { error: 'MISSING_GITHUB_OAUTH_CONFIG', missing: ['GITHUB_ID'] },
      { status: 500 }
    )
  }

  const url = new URL(req.url)
  const returnTo = url.searchParams.get('returnTo') || '/'
  const state = randomState()

  const origin = (appUrl || new URL(req.url).origin).replace(/\/$/, '')
  const redirectUri = `${origin}/api/auth/callback/github`
  const githubAuth = new URL('https://github.com/login/oauth/authorize')
  githubAuth.searchParams.set('client_id', githubId)
  githubAuth.searchParams.set('redirect_uri', redirectUri)
  githubAuth.searchParams.set('scope', 'read:user user:email')
  githubAuth.searchParams.set('state', state)

  const { secure } = cookiesConfig()
  const headers = new Headers()
  headers.append(
    'Set-Cookie',
    serializeCookie(cookieNames.oauthState, state, { maxAge: 10 * 60, secure })
  )
  headers.append(
    'Set-Cookie',
    serializeCookie(cookieNames.returnTo, returnTo, { maxAge: 10 * 60, secure, httpOnly: true })
  )
  headers.set('Location', githubAuth.toString())

  return new Response(null, { status: 302, headers })
}

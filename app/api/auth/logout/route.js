import { cookieNames, cookiesConfig, serializeCookie } from '../../../../lib/edgeSession'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const url = new URL(req.url)
  const returnTo = url.searchParams.get('returnTo') || '/'
  const { secure } = cookiesConfig()

  const headers = new Headers()
  headers.append('Set-Cookie', serializeCookie(cookieNames.session, '', { maxAge: 0, secure }))
  headers.set('Location', returnTo.startsWith('/') ? returnTo : '/')
  return new Response(null, { status: 302, headers })
}

import { handleShortLinkRedirect } from '../../../lib/content/shortLinkRedirect'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const RESERVED_CODES = new Set(['poetry', 'x'])

export async function GET(request, { params }) {
  const { code } = await params
  if (code === 'x') {
    return Response.redirect(new URL('/resources/big-interaction-whitepaper', request.url), 308)
  }
  return handleShortLinkRedirect(request, params, { reservedCodes: RESERVED_CODES })
}

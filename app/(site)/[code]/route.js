import { handleShortLinkRedirect } from '../../../lib/content/shortLinkRedirect'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const RESERVED_CODES = new Set(['poetry', 'x'])

export async function GET(request, { params }) {
  const { code } = await params
  if (code === 'x') {
    return new Response(null, {
      status: 308,
      headers: { location: new URL('/resources/big-interaction-whitepaper', request.url).toString() },
    })
  }
  return handleShortLinkRedirect(request, params, { reservedCodes: RESERVED_CODES })
}

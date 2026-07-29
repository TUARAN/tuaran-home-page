import { handleShortLinkRedirect } from '../../../lib/shortLinkRedirect'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const RESERVED_CODES = new Set(['poetry'])

export function GET(request, { params }) {
  return handleShortLinkRedirect(request, params, { reservedCodes: RESERVED_CODES })
}

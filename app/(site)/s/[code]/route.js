import { handleShortLinkRedirect } from '../../../../lib/shortLinkRedirect'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export function GET(request, { params }) {
  return handleShortLinkRedirect(request, params)
}

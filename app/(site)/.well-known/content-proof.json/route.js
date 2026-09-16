import { getContentProofDiscoveryDocument } from '../../../../lib/contentProofDiscovery.js'

export const dynamic = 'force-static'

export function GET() {
  return Response.json(getContentProofDiscoveryDocument(), {
    headers: {
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

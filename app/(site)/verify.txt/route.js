import { renderContentProofAgentGuide } from '../../../lib/contentProofDiscovery.js'

export const dynamic = 'force-static'

export function GET() {
  return new Response(renderContentProofAgentGuide(), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

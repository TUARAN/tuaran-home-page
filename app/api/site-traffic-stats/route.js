import { getIntegrationEnv } from '../../../lib/site/integrationKeys'
import { fetchPublicSiteTrafficSummary } from '../../../lib/site/umamiShareStats.mjs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await fetchPublicSiteTrafficSummary(getIntegrationEnv())
  return Response.json(payload, {
    headers: {
      'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
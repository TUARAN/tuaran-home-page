import { getRuntimeHomeRecommendationCatalog } from '../../../../lib/home/homeRecommendationRuntime'
import { getHomeRecommendationSettings } from '../../../../lib/site/recommendationSettings'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const [settings, catalog] = await Promise.all([getHomeRecommendationSettings(), getRuntimeHomeRecommendationCatalog()])
  return Response.json({ settings, catalog }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

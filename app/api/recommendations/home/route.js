import { getHomeRecommendationSettings } from '../../../../lib/recommendationSettings'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = await getHomeRecommendationSettings()
  return Response.json({ settings }, {
    headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' },
  })
}

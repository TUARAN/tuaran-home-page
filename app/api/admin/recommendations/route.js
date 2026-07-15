import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getHomeRecommendationCatalog } from '../../../../lib/homeRecommendationCatalog'
import {
  getHomeRecommendationSettings,
  setHomeRecommendationSettings,
} from '../../../../lib/recommendationSettings'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  const [settings, catalog] = await Promise.all([
    getHomeRecommendationSettings(),
    Promise.resolve(getHomeRecommendationCatalog()),
  ])
  return Response.json({ settings, catalog })
}

export async function POST(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }
  const result = await setHomeRecommendationSettings(body?.settings, auth.user)
  return Response.json(result, { status: result.ok ? 200 : result.status || 500 })
}

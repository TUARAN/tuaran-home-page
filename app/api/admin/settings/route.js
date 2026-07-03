import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getSiteSettings, setAdsEnabled } from '../../../../lib/siteSettings'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const settings = await getSiteSettings()
  return Response.json({ settings })
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let body = null
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const result = await setAdsEnabled(body?.ads?.enabled, guard.user)
  if (!result.ok) return Response.json(result, { status: result.status || 400 })
  return Response.json(result)
}

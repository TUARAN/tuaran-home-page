import { getOwnerOrReject } from '../../../../lib/adminAuth'
import {
  VALID_AUDIENCES,
  deleteNavOverride,
  getNavOverrides,
  setNavOverride,
} from '../../../../lib/navOverrides'
import { flattenChannelRoutesRaw } from '../../../../lib/siteNav'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const overrides = await getNavOverrides()
  const items = flattenChannelRoutesRaw(overrides)
  return Response.json({
    items,
    overrides,
    audiences: VALID_AUDIENCES,
  })
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
  const result = await setNavOverride(body?.href, body?.audience)
  if (!result.ok) return Response.json(result, { status: result.status || 400 })
  return Response.json(result)
}

export async function DELETE(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const url = new URL(req.url)
  const href = url.searchParams.get('href')
  const result = await deleteNavOverride(href)
  if (!result.ok) return Response.json(result, { status: result.status || 400 })
  return Response.json(result)
}

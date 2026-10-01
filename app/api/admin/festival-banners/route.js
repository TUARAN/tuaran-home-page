import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { deleteFestivalBanner, listFestivalBanners, saveFestivalBanner } from '../../../../lib/festivalBanners'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  return Response.json({ banners: await listFestivalBanners() })
}

export async function POST(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  let body
  try { body = await req.json() } catch { return Response.json({ error: 'INVALID_JSON' }, { status: 400 }) }
  const result = await saveFestivalBanner(body?.banner, auth.user)
  return Response.json(result, { status: result.ok ? 200 : 400 })
}

export async function DELETE(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return Response.json({ error: 'MISSING_ID' }, { status: 400 })
  return Response.json(await deleteFestivalBanner(id))
}

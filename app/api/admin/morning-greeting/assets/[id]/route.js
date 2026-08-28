import { getOwnerOrReject } from '../../../../../../lib/adminAuth'
import { getD1 } from '../../../../../../lib/d1'
import { getR2 } from '../../../../../../lib/r2'
import { X_IMAGE_PREFIX } from '../../../../../../lib/xPostAssets'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const { id } = await params
  try {
    const fromPool = new URL(req.url).searchParams.get('pool') === '1'
    const row = await getD1().prepare(fromPool
      ? 'SELECT object_key, mime_type FROM x_image_pool WHERE id = ? AND enabled = 1'
      : 'SELECT object_key, mime_type FROM x_post_assets WHERE id = ?').bind(id).first()
    if (!row?.object_key?.startsWith(X_IMAGE_PREFIX)) return new Response('Not found', { status: 404 })
    const object = await getR2().get(row.object_key)
    if (!object) return new Response('Not found', { status: 404 })
    const download = new URL(req.url).searchParams.get('download') === '1'
    return new Response(object.body, { headers: {
      'Content-Type': row.mime_type,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(download ? { 'Content-Disposition': `attachment; filename="x-post.${row.mime_type === 'image/png' ? 'png' : 'jpg'}"` } : {}),
    } })
  } catch {
    return Response.json({ error: 'X_ASSET_STORAGE_UNAVAILABLE' }, { status: 503 })
  }
}

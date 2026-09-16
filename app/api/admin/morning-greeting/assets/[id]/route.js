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
    const url = new URL(req.url)
    const fromPool = url.searchParams.get('pool') === '1'
    const wantsThumb = fromPool && url.searchParams.get('thumb') === '1'
    const row = await getD1().prepare(fromPool
      ? 'SELECT object_key, thumbnail_object_key, mime_type FROM x_image_pool WHERE id = ? AND enabled = 1'
      : 'SELECT object_key, mime_type FROM x_post_assets WHERE id = ?').bind(id).first()
    const objectKey = wantsThumb ? row?.thumbnail_object_key : row?.object_key
    if (!objectKey?.startsWith(X_IMAGE_PREFIX)) return new Response('Not found', { status: 404 })
    const object = await getR2().get(objectKey)
    if (!object) return new Response('Not found', { status: 404 })
    const download = url.searchParams.get('download') === '1'
    const headers = new Headers({
      'Content-Type': wantsThumb ? 'image/webp' : row.mime_type,
      'Cache-Control': download ? 'private, no-store' : 'private, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
      ...(download ? { 'Content-Disposition': `attachment; filename="x-post.${row.mime_type === 'image/png' ? 'png' : 'jpg'}"` } : {}),
    })
    if (object.size != null) headers.set('Content-Length', String(object.size))
    if (object.httpEtag) headers.set('ETag', object.httpEtag)
    return new Response(object.body, { headers })
  } catch {
    return Response.json({ error: 'X_ASSET_STORAGE_UNAVAILABLE' }, { status: 503 })
  }
}

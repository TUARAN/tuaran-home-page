import { getOptionalRequestContext } from '@cloudflare/next-on-pages'
import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { getD1 } from '../../../../../lib/d1'
import { listXAssets, listXImagePool, X_ASSET_TYPES } from '../../../../../lib/xPostAssets'
import { X_COMMUNITY_VARIANTS } from '../../../../../lib/xCommunityPosts'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const params = new URL(req.url).searchParams
  const type = params.get('type') || ''
  const status = params.get('status') || ''
  if ((type && !X_ASSET_TYPES.includes(type)) || (status && !['pending', 'generating', 'ready', 'failed', 'publishing', 'publish-unknown', 'published'].includes(status))) {
    return Response.json({ error: 'INVALID_FILTER' }, { status: 400 })
  }
  const env = getOptionalRequestContext()?.env || {}
  const legacy = X_COMMUNITY_VARIANTS.map((item) => ({ id: item.id, label: item.label, imageUrl: item.imagePath, storage: '仓库 · public/images/x-community' }))
  const config = { strategy: 'pool-only', storageConfigured: Boolean(env.MEDIA), bucket: 'tuaran-media', prefix: 'images/x-posts/' }
  try {
    const db = getD1()
    const [page, pool] = await Promise.all([
      listXAssets(db, { type, status, before: params.get('before') || '' }),
      listXImagePool(db, { type }),
    ])
    return Response.json({ ...page, pool, legacy, config, available: true }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return Response.json({ items: [], pool: [], nextCursor: '', legacy, config, available: false, error: '素材记录暂不可用，请检查 D1 绑定及 0082 迁移。' }, { headers: { 'Cache-Control': 'private, no-store' } })
  }
}

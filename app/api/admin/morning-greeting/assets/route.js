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
  const scope = params.get('scope') || 'all'
  const type = params.get('type') || ''
  const status = params.get('status') || ''
  const from = params.get('from') || ''
  const to = params.get('to') || ''
  const keyword = (params.get('keyword') || '').trim()
  const validDate = (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value)
  if (!['all', 'pool', 'runs'].includes(scope)
    || (type && !X_ASSET_TYPES.includes(type))
    || (status && !['pending', 'generating', 'ready', 'failed', 'publishing', 'publish-unknown', 'published'].includes(status))
    || !validDate(from) || !validDate(to) || (from && to && from > to) || keyword.length > 100) {
    return Response.json({ error: 'INVALID_FILTER' }, { status: 400 })
  }
  const env = getOptionalRequestContext()?.env || {}
  const legacy = X_COMMUNITY_VARIANTS.map((item) => ({ id: item.id, label: item.label, imageUrl: item.imagePath, storage: '仓库 · public/images/x-community' }))
  const config = { strategy: 'pool-only', storageConfigured: Boolean(env.MEDIA), bucket: 'tuaran-media', prefix: 'images/x-posts/' }
  try {
    const db = getD1()
    const [page, pool] = await Promise.all([
      scope === 'pool'
        ? Promise.resolve({ items: [], nextCursor: '' })
        : listXAssets(db, { type, status, from, to, keyword, before: params.get('before') || '' }),
      scope === 'runs' ? Promise.resolve([]) : listXImagePool(db, { type }),
    ])
    return Response.json({ ...page, pool, legacy, config, available: true }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return Response.json({ items: [], pool: [], nextCursor: '', legacy, config, available: false, error: '素材记录暂不可用，请检查 D1 绑定及 0082 迁移。' }, { headers: { 'Cache-Control': 'private, no-store' } })
  }
}

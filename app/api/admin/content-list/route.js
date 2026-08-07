import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { rowToArticlePost } from '../../../../lib/articlePosts'
import {
  countAdminContentItems,
  filterAdminContentItems,
  mergeAdminContentItems,
  normalizeContentListParams,
  paginateAdminContentItems,
  sortAdminContentItems,
} from '../../../../lib/adminContentList'
import { getD1 } from '../../../../lib/d1'
import { listAllContent } from '../../../../lib/contentPipeline'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * 后台内容管理统一列表：?q=&type=&status=&offset=&limit=
 * 数据源 = 构建期全站内容管线 + 在线文章(article_posts) + 手工登记(content_index source=manual)。
 * 服务端筛选/排序/分页，响应含 total 与 counts，客户端不再一次性拉全量。
 */
export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const params = normalizeContentListParams(Object.fromEntries(new URL(req.url).searchParams))

  let posts = []
  let manualEntries = []
  try {
    const db = getD1()
    const [postResult, manualResult] = await Promise.all([
      db.prepare('SELECT * FROM article_posts ORDER BY updated_at DESC').all().catch(() => ({ results: [] })),
      db
        .prepare("SELECT * FROM content_index WHERE source = 'manual' ORDER BY updated_at DESC")
        .all()
        .catch(() => ({ results: [] })),
    ])
    posts = (postResult?.results || []).map(rowToArticlePost).filter(Boolean)
    manualEntries = manualResult?.results || []
  } catch {
    // D1 不可用时仍展示构建期内容
  }

  const merged = sortAdminContentItems(mergeAdminContentItems({
    buildEntries: listAllContent(),
    posts,
    manualEntries,
  }))
  const filtered = filterAdminContentItems(merged, params)
  const page = paginateAdminContentItems(filtered, params.offset, params.limit)
  const counts = countAdminContentItems(merged)

  return Response.json({
    status: 'ok',
    items: page,
    total: filtered.length,
    counts,
    offset: params.offset,
    limit: params.limit,
  })
}

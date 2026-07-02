import { listContentIndex } from '../../../lib/contentIndex'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * 公开内容索引（D1 content_index，只读 published）。
 *
 * ?source=manual 只取后台手工登记的条目——/articles 索引客户端用它合并
 * 「构建之后新登记」的内容，实现 metadata 发布不依赖构建。
 * 表不存在（迁移未跑）或无 binding 时返回空列表，前端静默降级到构建期数据。
 */
export async function GET(req) {
  const url = new URL(req.url)
  const source = url.searchParams.get('source') === 'manual' ? 'manual' : null
  let entries = []
  try {
    entries = await listContentIndex({ status: 'published', source, limit: 500 })
  } catch {
    entries = []
  }
  return Response.json(
    { entries },
    { headers: { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' } }
  )
}

import { listContentIndex } from '../../../lib/contentIndex'
import { readRuntimeKnowledgeItems } from '../../../lib/knowledgeRuntime'

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
  if (url.searchParams.get('view') === 'knowledge') {
    try { return Response.json({ items: await readRuntimeKnowledgeItems() }, { headers: { 'Cache-Control': 'no-store' } }) }
    catch { return Response.json({ error: 'CONTENT_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }) }
  }
  const source = url.searchParams.get('source') === 'manual' ? 'manual' : null
  let entries = []
  try {
    for (let offset = 0; ; offset += 1000) {
      const page = await listContentIndex({ status: 'published', source, limit: 1000, offset })
      entries.push(...page)
      if (page.length < 1000) break
    }
  } catch {
    entries = []
  }
  return Response.json(
    { entries },
    { headers: { 'cache-control': 'no-store' } }
  )
}

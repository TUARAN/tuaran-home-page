import { articlePostToKnowledgeItem } from '../../../lib/article/articlePosts'
import { listDiscoverablePosts } from '../../../lib/article/articleDiscovery'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const posts = await listDiscoverablePosts()
  return Response.json({ articles: posts.map(articlePostToKnowledgeItem) }, {
    headers: { 'cache-control': 'no-store' },
  })
}

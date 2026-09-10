import { articlePostToKnowledgeItem } from '../../../lib/articlePosts'
import { listDiscoverablePosts } from '../../../lib/articleDiscovery'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const posts = await listDiscoverablePosts()
  return Response.json({ articles: posts.map(articlePostToKnowledgeItem) }, {
    headers: { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' },
  })
}

import { articlePostToKnowledgeItem, listPublishedArticlePosts } from '../../../lib/articlePosts'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const posts = await listPublishedArticlePosts()
  return Response.json({ articles: posts.map(articlePostToKnowledgeItem) }, {
    headers: { 'cache-control': 'public, max-age=60, stale-while-revalidate=300' },
  })
}

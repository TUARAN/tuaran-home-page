import { readRuntimeKnowledgeItems } from '../../../lib/content/knowledgeRuntime'
import { searchPublicEntries } from '../../../lib/site/publicSearch'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  const query = new URL(request.url).searchParams.get('q') || ''
  if (!query.trim()) return Response.json({ results: [] })
  try {
    const items = await readRuntimeKnowledgeItems()
    return Response.json({ results: searchPublicEntries(query, items, 7) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ results: searchPublicEntries(query, [], 7) }, { headers: { 'Cache-Control': 'no-store' } })
  }
}

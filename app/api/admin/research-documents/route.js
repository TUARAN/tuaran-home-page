import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { normalizeResearchSnapshot } from '../../../../lib/researchDocument.mjs'
import { publishResearchSnapshot } from '../../../../lib/researchPublication'
import { resolveReservedArticleSlug } from '../../../../lib/articleReservedSlugs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const key = new URL(req.url).searchParams.get('key')
  if (!/^research:(companies|topics|people):[a-z0-9-]+$/.test(key || '')) return Response.json({ error: 'INVALID_KEY' }, { status: 400, headers })
  try {
    const row = await getD1().prepare('SELECT revision, status, source_path, source_hash, updated_at FROM content_documents WHERE content_key = ?').bind(key).first()
    return Response.json({ document: row || null }, { headers })
  } catch {
    return Response.json({ error: 'RESEARCH_STORE_UNAVAILABLE' }, { status: 503, headers })
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  let body
  try { body = await req.json() } catch { return Response.json({ error: 'INVALID_JSON' }, { status: 400, headers }) }
  const normalized = normalizeResearchSnapshot(body?.snapshot)
  if (normalized.error) return Response.json({ error: normalized.error }, { status: 400, headers })
  const { document } = normalized
  try {
    for (const pathname of document.routes.filter((route) => /^\/articles\/[^/]+$/.test(route))) {
      const reserved = await resolveReservedArticleSlug(pathname.split('/').pop())
      if (reserved.reserved && reserved.redirectHref !== document.routes[0]) return Response.json({ error: 'ROUTE_CONFLICT' }, { status: 409, headers })
    }
    const result = await publishResearchSnapshot(getD1(), body.snapshot, { expectedRevision: body.expectedRevision })
    return Response.json(result, { status: result.ok ? 200 : result.status, headers })
  } catch {
    return Response.json({ error: 'RESEARCH_PUBLICATION_FAILED' }, { status: 503, headers })
  }
}

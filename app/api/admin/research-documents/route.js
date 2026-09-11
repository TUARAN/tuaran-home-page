import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { resolveReservedArticleSlug } from '../../../../lib/articleReservedSlugs'
import { getD1 } from '../../../../lib/d1'
import { normalizeResearchSnapshot } from '../../../../lib/researchDocument.mjs'
import { ResearchGitHubError, buildResearchApprovalQueue, fetchGitHubResearchFile, parseResearchSourcePath, publicationStatus } from '../../../../lib/researchGitHubQueue'
import { publishResearchSnapshot } from '../../../../lib/researchPublication'
import { prepareResearchSourcePublication } from '../../../../lib/researchSourcePublication'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

function requestEnv() {
  return getOptionalRequestContext()?.env || process.env || {}
}

function fail(error, fallbackStatus = 503) {
  if (error instanceof ResearchGitHubError) {
    return Response.json({ error: error.code, message: error.message }, { status: error.status, headers })
  }
  return Response.json({ error: 'RESEARCH_PUBLICATION_FAILED', message: String(error?.message || error) }, { status: fallbackStatus, headers })
}

async function listStoredResearch(db) {
  const rows = []
  for (let offset = 0; ; offset += 500) {
    const result = await db.prepare(
      "SELECT content_key, source_path, source_hash, status, revision, json_extract(metadata_json, '$.title') AS title FROM content_documents ORDER BY content_key LIMIT 500 OFFSET ?",
    ).bind(offset).all()
    rows.push(...(result.results || []))
    if ((result.results || []).length < 500) break
  }
  return rows
}

async function assertRoutesAvailable(document) {
  for (const pathname of document.routes.filter((route) => /^\/articles\/[^/]+$/.test(route))) {
    const reserved = await resolveReservedArticleSlug(pathname.split('/').pop())
    if (reserved.reserved && reserved.redirectHref !== document.routes[0]) {
      return Response.json({ error: 'ROUTE_CONFLICT' }, { status: 409, headers })
    }
  }
  return null
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  const url = new URL(req.url)
  const sourcePath = url.searchParams.get('sourcePath')
  const key = url.searchParams.get('key')
  try {
    if (url.searchParams.get('queue') === '1') {
      const queue = await buildResearchApprovalQueue(requestEnv(), await listStoredResearch(getD1()))
      return Response.json(queue, { headers })
    }
    if (sourcePath) {
      const parsed = parseResearchSourcePath(sourcePath)
      if (!parsed) return Response.json({ error: 'INVALID_SOURCE_PATH' }, { status: 400, headers })
      const file = await fetchGitHubResearchFile(requestEnv(), parsed.sourcePath)
      const prepared = await prepareResearchSourcePublication(getD1(), {
        category: file.category,
        filename: file.filename,
        raw: file.raw,
        status: 'published',
      })
      const current = await getD1().prepare(
        'SELECT revision, status, source_path, source_hash, updated_at FROM content_documents WHERE content_key = ?',
      ).bind(`research:${file.category}:${file.slug}`).first()
      return Response.json({
        snapshot: { ...prepared.snapshot, entry: (({ raw, ...entry }) => entry)(prepared.snapshot.entry) },
        document: current || null,
        unchanged: Boolean(current?.source_hash === prepared.snapshot.sourceHash && current?.status === 'published'),
      }, { headers })
    }
    if (!/^research:(companies|topics|people):[a-z0-9-]+$/.test(key || '')) {
      return Response.json({ error: 'INVALID_KEY' }, { status: 400, headers })
    }
    const row = await getD1().prepare(
      'SELECT revision, status, source_path, source_hash, updated_at FROM content_documents WHERE content_key = ?',
    ).bind(key).first()
    return Response.json({ document: row || null }, { headers })
  } catch (error) {
    if (error instanceof ResearchGitHubError) return fail(error)
    return Response.json({ error: 'RESEARCH_STORE_UNAVAILABLE' }, { status: 503, headers })
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  let body
  try { body = await req.json() } catch { return Response.json({ error: 'INVALID_JSON' }, { status: 400, headers }) }
  try {
    let snapshot = body?.snapshot
    let expectedRevision = body?.expectedRevision
    if (body?.sourcePath) {
      const file = await fetchGitHubResearchFile(requestEnv(), body.sourcePath)
      const prepared = await prepareResearchSourcePublication(getD1(), {
        category: file.category,
        filename: file.filename,
        raw: file.raw,
        status: publicationStatus(body.status),
      })
      if (Number.isInteger(expectedRevision) && expectedRevision !== prepared.expectedRevision) {
        return Response.json({ error: 'REVISION_CONFLICT' }, { status: 409, headers })
      }
      if (prepared.unchanged) {
        return Response.json({ ok: true, revision: prepared.expectedRevision, status: prepared.snapshot.status, unchanged: true }, { headers })
      }
      snapshot = prepared.snapshot
      expectedRevision = prepared.expectedRevision
    }
    const normalized = normalizeResearchSnapshot(snapshot)
    if (normalized.error) return Response.json({ error: normalized.error }, { status: 400, headers })
    const conflict = await assertRoutesAvailable(normalized.document)
    if (conflict) return conflict
    const result = await publishResearchSnapshot(getD1(), snapshot, { expectedRevision })
    return Response.json(result, { status: result.ok ? 200 : result.status, headers })
  } catch (error) {
    if (error instanceof ResearchGitHubError) return fail(error)
    return Response.json({ error: 'RESEARCH_PUBLICATION_FAILED', message: String(error?.message || error) }, { status: 503, headers })
  }
}

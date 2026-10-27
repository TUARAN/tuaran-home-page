import { buildResearchApprovalQueue, fetchGitHubResearchFile, fetchGitHubResearchLastCommitAt } from './researchGitHubQueue.js'
import { normalizeResearchSnapshot } from './researchDocument.mjs'
import { publishResearchSnapshot } from './researchPublication.js'
import { prepareResearchSourcePublication } from './researchSourcePublication.js'
import { resolveReservedArticleSlug } from '../article/articleReservedSlugs.js'
import { autoPublishCandidates, researchReviewDue } from './researchAutoPublicationCore.mjs'

const AUTO_PUBLISH_BATCH_LIMIT = 20

async function storedResearch(db) {
  const rows = []
  for (let offset = 0; ; offset += 500) {
    const result = await db.prepare('SELECT content_key, source_path, source_hash, status, revision FROM content_documents ORDER BY content_key LIMIT 500 OFFSET ?').bind(offset).all()
    rows.push(...(result.results || []))
    if ((result.results || []).length < 500) break
  }
  return rows
}

async function routesAvailable(document) {
  for (const pathname of document.routes.filter((route) => /^\/articles\/[^/]+$/.test(route))) {
    const reserved = await resolveReservedArticleSlug(pathname.split('/').pop())
    if (reserved.reserved && reserved.redirectHref !== document.routes[0]) return false
  }
  return true
}

export async function runResearchAutoPublication(db, env, { now = Date.now() } = {}) {
  // Refresh the GitHub index so a stale in-memory queue cannot publish an old revision.
  const queue = await buildResearchApprovalQueue(env, await storedResearch(db), { refresh: true })
  const candidates = await Promise.all(autoPublishCandidates(queue.pending).map(async (item) => ({
    ...item,
    commitAt: await fetchGitHubResearchLastCommitAt(env, item.sourcePath),
  })))
  const due = candidates
    .filter((item) => researchReviewDue(item.commitAt, now))
    .sort((left, right) => left.commitAt - right.commitAt)
    .slice(0, AUTO_PUBLISH_BATCH_LIMIT)
  const results = []

  for (const item of due) {
    try {
      const file = await fetchGitHubResearchFile(env, item.sourcePath, { refresh: true })
      if (file.gitSha !== item.gitSha) continue
      // If GitHub changed since the queue scan, re-check the commit date on the next run.
      const prepared = await prepareResearchSourcePublication(db, {
        category: file.category, filename: file.filename, raw: file.raw, status: 'published',
      })
      if (prepared.unchanged) {
        continue
      }
      // A saved draft or retirement is an explicit review decision, even if it happened after queue loading.
      const current = await db.prepare('SELECT status FROM content_documents WHERE content_key = ?')
        .bind(`research:${file.category}:${file.slug}`).first()
      if (current && current.status !== 'published') continue
      const normalized = normalizeResearchSnapshot(prepared.snapshot)
      if (normalized.error) throw new Error(normalized.error)
      if (!await routesAvailable(normalized.document)) throw new Error('ROUTE_CONFLICT')
      const result = await publishResearchSnapshot(db, prepared.snapshot, { expectedRevision: prepared.expectedRevision })
      if (!result.ok) throw new Error(result.error)
      results.push({ sourcePath: item.sourcePath, ok: true, revision: result.revision })
    } catch (error) {
      results.push({ sourcePath: item.sourcePath, ok: false, error: String(error?.message || error) })
    }
  }

  return { ok: results.every((item) => item.ok), pendingCount: candidates.length, dueCount: due.length, publishedCount: results.filter((item) => item.ok).length, results }
}

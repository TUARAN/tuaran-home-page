import { buildResearchApprovalQueue, deleteGitHubResearchDraft, fetchGitHubResearchFile, fetchGitHubResearchLastCommitAt } from './researchGitHubQueue.js'
import { normalizeResearchSnapshot } from './researchDocument.mjs'
import { publishResearchSnapshot } from './researchPublication.js'
import { prepareResearchSourcePublication } from './researchSourcePublication.js'
import { resolveReservedArticleSlug } from '../article/articleReservedSlugs.js'
import { autoPublishCandidates, researchDraftCleanupDue, researchReviewDue } from './researchAutoPublicationCore.mjs'

const AUTO_PUBLISH_BATCH_LIMIT = 20
const DRAFT_CLEANUP_BATCH_LIMIT = 20

async function storedResearch(db) {
  const rows = []
  for (let offset = 0; ; offset += 500) {
    const result = await db.prepare('SELECT content_key, source_path, source_hash, status, revision, updated_at FROM content_documents ORDER BY content_key LIMIT 500 OFFSET ?').bind(offset).all()
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
  const stored = await storedResearch(db)
  const queue = await buildResearchApprovalQueue(env, stored, { refresh: true })
  const storedByPath = new Map(stored.map((row) => [row.source_path, row]))
  const draftCandidates = queue.pending
    .filter((item) => item.reason === 'draft' && item.d1Status === 'draft' && item.gitSha)
    .slice(0, DRAFT_CLEANUP_BATCH_LIMIT)
  const cleanupResults = []
  for (const item of draftCandidates) {
    try {
      const row = storedByPath.get(item.sourcePath)
      const commitAt = await fetchGitHubResearchLastCommitAt(env, item.sourcePath)
      if (!researchDraftCleanupDue(commitAt, row?.updated_at, now)) continue
      const current = await db.prepare('SELECT status, source_path, revision, updated_at FROM content_documents WHERE content_key = ?')
        .bind(item.contentKey).first()
      if (current?.status !== 'draft' || current.source_path !== item.sourcePath || current.revision !== row.revision || !researchDraftCleanupDue(commitAt, current.updated_at, now)) continue
      const file = await fetchGitHubResearchFile(env, item.sourcePath, { refresh: true })
      if (file.gitSha !== item.gitSha) continue
      await deleteGitHubResearchDraft(env, item.sourcePath, file.gitSha)
      // The source is gone; remove its unpublished D1 projection and route reservations.
      await db.batch([
        db.prepare("DELETE FROM content_index WHERE content_key = ? AND source = 'git' AND status = 'draft' AND EXISTS (SELECT 1 FROM content_documents WHERE content_key = ? AND status = 'draft' AND revision = ?)").bind(item.contentKey, item.contentKey, current.revision),
        db.prepare("DELETE FROM content_routes WHERE content_key = ? AND EXISTS (SELECT 1 FROM content_documents WHERE content_key = ? AND status = 'draft' AND revision = ?)").bind(item.contentKey, item.contentKey, current.revision),
        db.prepare("DELETE FROM content_documents WHERE content_key = ? AND status = 'draft' AND revision = ?").bind(item.contentKey, current.revision),
      ])
      cleanupResults.push({ sourcePath: item.sourcePath, ok: true })
    } catch (error) {
      cleanupResults.push({ sourcePath: item.sourcePath, ok: false, error: String(error?.message || error) })
    }
  }
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

  return { ok: results.every((item) => item.ok) && cleanupResults.every((item) => item.ok), pendingCount: candidates.length, dueCount: due.length, publishedCount: results.filter((item) => item.ok).length, results, cleanedDraftCount: cleanupResults.filter((item) => item.ok).length, cleanupResults }
}

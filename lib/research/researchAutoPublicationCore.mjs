export const RESEARCH_AUTO_PUBLISH_DELAY_MS = 3 * 24 * 60 * 60 * 1000
export const RESEARCH_DRAFT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000

export function autoPublishCandidates(pending = []) {
  return pending.filter((item) => (item.reason === 'new' || item.reason === 'updated') && item.gitSha)
}

export function researchReviewDue(commitAt, now = Date.now()) {
  return Number.isFinite(commitAt) && commitAt > 0 && commitAt <= now - RESEARCH_AUTO_PUBLISH_DELAY_MS
}

export function researchDraftCleanupDue(commitAt, updatedAt, now = Date.now()) {
  const latest = Math.max(Number(commitAt) || 0, Number(updatedAt) || 0)
  return latest > 0 && latest <= now - RESEARCH_DRAFT_RETENTION_MS
}

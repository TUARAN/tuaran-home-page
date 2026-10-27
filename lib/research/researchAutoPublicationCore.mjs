export const RESEARCH_AUTO_PUBLISH_DELAY_MS = 3 * 24 * 60 * 60 * 1000

export function autoPublishCandidates(pending = []) {
  return pending.filter((item) => (item.reason === 'new' || item.reason === 'updated') && item.gitSha)
}

export function researchReviewDue(commitAt, now = Date.now()) {
  return Number.isFinite(commitAt) && commitAt > 0 && commitAt <= now - RESEARCH_AUTO_PUBLISH_DELAY_MS
}

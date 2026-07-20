import assert from 'node:assert/strict'
import {
  createRepositoryIndex,
  getEvidenceBundle,
  validateRepository,
} from '../app/(site)/x-platform-intelligence/model.mjs'

const fixture = {
  platforms: [{ id: 'x', name: 'X', group: 'focus' }],
  metrics: [{ id: 'mau', label: 'MAU', allowedUnits: ['people'] }],
  sources: [{
    id: 'x-dsa-2025-h2',
    title: 'X DSA Transparency Report H2 2025',
    publisher: 'X',
    url: 'https://transparency.x.com/en/reports/dsa-transparency-report',
    publishedAt: '2026-02-01',
    accessedAt: '2026-07-20',
    sourceClass: 'primary',
    methodologySummary: 'EU DSA active-recipient disclosure',
    archiveStatus: 'live',
  }],
  snapshots: [{ id: '2026-q2', label: '2026 Q2', periodStart: '2026-04-01', periodEnd: '2026-06-30', verifiedAt: '2026-07-20' }],
  observations: [{
    id: 'x-eu-mau-2025-h2', platformId: 'x', metricId: 'mau', valueType: 'exact', value: 100,
    unit: 'people', periodStart: '2025-07-01', periodEnd: '2025-12-31', publishedAt: '2026-02-01',
    geography: 'eu', segments: [], methodology: 'DSA active recipients', sourceId: 'x-dsa-2025-h2',
    confidence: 'high', comparability: 'same-metric-only', conflictGroupId: null, status: 'current',
    snapshotId: '2026-q2', editorNote: 'EU only',
  }],
  insights: [{
    id: 'x-real-time', title: '实时公共讨论强', summary: '适合热点、科技发布和人物关系连接。',
    audienceGoal: ['technology-creator'], geographies: ['global'], segmentFilters: [],
    evidenceObservationIds: ['x-eu-mau-2025-h2'], evidenceSourceIds: [], confidence: 'reference',
    validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2',
  }],
  comparisons: [{
    id: 'x-realtime', platformId: 'x', dimensionId: 'realtime', rating: 'high',
    quantitativeObservationIds: [], evidenceSourceIds: ['x-dsa-2025-h2'],
    rationale: '事件驱动的信息流与公开关系链。', confidence: 'reference', snapshotId: '2026-q2',
  }],
  coverageGaps: [],
}

assert.deepEqual(validateRepository(fixture).errors, [])

const badCalendarDate = structuredClone(fixture)
badCalendarDate.sources[0].publishedAt = '2026-02-30'
assert.ok(validateRepository(badCalendarDate).errors.some((error) => error.includes('invalid dates')))

const badSource = structuredClone(fixture)
badSource.observations[0].sourceId = 'missing-source'
assert.ok(validateRepository(badSource).errors.some((error) => error.includes('missing-source')))

const badUnit = structuredClone(fixture)
badUnit.observations[0].unit = 'accounts'
assert.ok(validateRepository(badUnit).errors.some((error) => error.includes('accounts')))

const badDates = structuredClone(fixture)
badDates.observations[0].periodStart = '2026-01-02'
badDates.observations[0].periodEnd = '2026-01-01'
assert.ok(validateRepository(badDates).errors.some((error) => error.includes('periodStart')))

const index = createRepositoryIndex(fixture)
assert.equal(index.sourceById.get('x-dsa-2025-h2').publisher, 'X')

const bundle = getEvidenceBundle(fixture, { kind: 'insight', id: 'x-real-time' })
assert.equal(bundle.subject.id, 'x-real-time')
assert.deepEqual(bundle.sources.map((source) => source.id), ['x-dsa-2025-h2'])
assert.deepEqual(bundle.observations.map((row) => row.id), ['x-eu-mau-2025-h2'])

assert.deepEqual(getEvidenceBundle(fixture, null), {
  subject: null, sources: [], observations: [], conflicts: [],
})

const { X_INTELLIGENCE_REPOSITORY } = await import('../app/(site)/x-platform-intelligence/data.mjs')
const result = validateRepository(X_INTELLIGENCE_REPOSITORY)
assert.deepEqual(result.errors, [], result.errors.join('\n'))
assert.deepEqual(X_INTELLIGENCE_REPOSITORY.platforms.map((item) => item.id).sort(), [
  'facebook', 'instagram', 'jike', 'linkedin', 'reddit', 'threads', 'wechat-oa', 'weibo', 'xiaohongshu', 'x', 'zhihu', 'tiktok',
].sort())
assert.ok(X_INTELLIGENCE_REPOSITORY.sources.length >= 30)
assert.ok(X_INTELLIGENCE_REPOSITORY.observations.length >= 60)
assert.ok(X_INTELLIGENCE_REPOSITORY.insights.length >= 12)
assert.equal(X_INTELLIGENCE_REPOSITORY.comparisons.length, 12 * 16)
assert.ok(X_INTELLIGENCE_REPOSITORY.observations.some((row) => row.platformId === 'x' && row.metricId === 'mau' && row.conflictGroupId === 'x-global-mau-2025'))
assert.ok(X_INTELLIGENCE_REPOSITORY.coverageGaps.some((gap) => gap.platformId === 'jike'))

for (const metricId of ['country-share', 'internet-penetration', 'news-use-rate']) {
  const observations = X_INTELLIGENCE_REPOSITORY.observations.filter((row) => row.platformId === 'x' && row.metricId === metricId)
  const gaps = X_INTELLIGENCE_REPOSITORY.coverageGaps.filter((gap) => gap.platformId === 'x' && gap.metricId === metricId)
  assert.ok(observations.length > 0 || gaps.length > 0, `${metricId} must have production observations or a precise coverage gap`)
  assert.ok(observations.every((row) => X_INTELLIGENCE_REPOSITORY.sources.some((source) => source.id === row.sourceId)))
}

assert.ok(X_INTELLIGENCE_REPOSITORY.observations.filter((row) => row.platformId === 'x' && row.metricId === 'internet-penetration').length >= 3)
assert.ok(X_INTELLIGENCE_REPOSITORY.observations.some((row) => row.platformId === 'x' && row.metricId === 'news-use-rate' && row.geography === 'us'))
assert.ok(X_INTELLIGENCE_REPOSITORY.coverageGaps.some((gap) => (
  gap.platformId === 'x' && gap.metricId === 'country-share' && gap.reason && gap.attemptedSourceUrl && gap.impact
)))

assert.ok(X_INTELLIGENCE_REPOSITORY.coverageGaps.some((gap) => (
  gap.platformId === 'x' && gap.profileDimensionId === 'occupation-industry'
  && gap.reason && gap.attemptedSourceUrl && gap.checkedAt && gap.impact
)))
for (const profileDimensionId of ['city-tier', 'political-orientation', 'general-use-motivation']) {
  assert.ok(!X_INTELLIGENCE_REPOSITORY.coverageGaps.some((gap) => gap.profileDimensionId === profileDimensionId), `${profileDimensionId} must not remain a false gap`)
}
for (const geoDimensionId of ['country-availability', 'country-restrictions', 'primary-languages']) {
  assert.ok(X_INTELLIGENCE_REPOSITORY.coverageGaps.some((gap) => (
    gap.platformId === 'x' && gap.geoDimensionId === geoDimensionId
    && gap.reason && gap.attemptedSourceUrl && gap.checkedAt && gap.impact
  )), `${geoDimensionId} must have a precise coverage gap`)
}

const xCommunityUse = X_INTELLIGENCE_REPOSITORY.observations.filter((row) => row.platformId === 'x' && row.metricId === 'community-use-rate')
assert.deepEqual(Object.fromEntries(xCommunityUse.map((row) => [row.segments.at(-1), row.value])), {
  'community-urban': 23, 'community-suburban': 22, 'community-rural': 17,
})
assert.ok(xCommunityUse.every((row) => row.comparability === 'us-adult-cohort-use-rate' && row.editorNote.includes('not the community share')))

const xPartyUse = X_INTELLIGENCE_REPOSITORY.observations.filter((row) => row.platformId === 'x' && row.metricId === 'party-use-rate')
assert.deepEqual(Object.fromEntries(xPartyUse.map((row) => [row.segments.at(-1), row.value])), {
  'rep-lean-rep': 24, 'dem-lean-dem': 19,
})
assert.ok(xPartyUse.every((row) => row.comparability === 'us-adult-cohort-use-rate' && row.editorNote.includes('not the party composition')))

const xUseReasons = X_INTELLIGENCE_REPOSITORY.observations.filter((row) => row.platformId === 'x' && row.metricId === 'use-reason-rate')
assert.deepEqual(Object.fromEntries(xUseReasons.map((row) => [row.segments.at(-1), row.value])), {
  'reason-entertainment': 81,
  'reason-shared-interests': 62,
  'reason-sports-pop-culture': 59,
  'reason-politics': 59,
  'reason-friends-family': 33,
  'reason-product-reviews': 29,
})
assert.ok(xUseReasons.every((row) => row.periodStart === '2024-03-18' && row.periodEnd === '2024-03-24' && row.sourceId === 'pew-x-experience-2024'))
const xNewsReason = X_INTELLIGENCE_REPOSITORY.observations.filter((row) => row.id === 'x-us-news-reason-2024')
assert.equal(xNewsReason.length, 1, 'news reason must reuse the existing evidence row rather than duplicate 65%')
assert.equal(xNewsReason[0].value, 65)
assert.ok(!xUseReasons.some((row) => row.segments.includes('reason-news')))
const xExperienceSource = X_INTELLIGENCE_REPOSITORY.sources.find((source) => source.id === 'pew-x-experience-2024')
assert.equal(xExperienceSource.sampleSize, 2565)
assert.equal(xExperienceSource.totalSampleSize, 10287)

for (const comparison of X_INTELLIGENCE_REPOSITORY.comparisons) {
  const comparisonBundle = getEvidenceBundle(X_INTELLIGENCE_REPOSITORY, { kind: 'comparison', id: comparison.id })
  assert.ok(comparisonBundle.subject)
  assert.ok(comparisonBundle.sources.length > 0 || comparisonBundle.observations.length > 0)
}

const reviewerFailures = []
const repositorySourceById = new Map(X_INTELLIGENCE_REPOSITORY.sources.map((source) => [source.id, source]))
const knownComparisons = X_INTELLIGENCE_REPOSITORY.comparisons.filter((comparison) => comparison.rating !== 'unknown')
const nonTraceableComparisons = knownComparisons.filter((comparison) => (
  !comparison.evidenceSourceIds.length
  || comparison.evidenceSourceIds.some((sourceId) => !repositorySourceById.get(sourceId)?.supportedDimensionIds?.includes(comparison.dimensionId))
))
if (nonTraceableComparisons.length) reviewerFailures.push(`${nonTraceableComparisons.length} non-unknown comparisons lack dimension-specific source evidence`)

const rationaleCounts = knownComparisons.reduce((counts, comparison) => counts.set(comparison.rationale, (counts.get(comparison.rationale) || 0) + 1), new Map())
const genericComparisons = knownComparisons.filter((comparison) => comparison.rationale.length < 24 || rationaleCounts.get(comparison.rationale) !== 1)
if (genericComparisons.length) reviewerFailures.push(`${genericComparisons.length} non-unknown comparisons have generic or repeated rationales`)

for (const [platformId, dimensionId] of [
  ['tiktok', 'native-monetization'],
  ['linkedin', 'brand-safety'],
  ['threads', 'production-cost'],
]) {
  const comparison = X_INTELLIGENCE_REPOSITORY.comparisons.find((item) => item.platformId === platformId && item.dimensionId === dimensionId)
  if (comparison?.rating !== 'unknown') reviewerFailures.push(`${platformId}/${dimensionId} must remain unknown without direct evidence`)
}

const metricById = new Map(X_INTELLIGENCE_REPOSITORY.metrics.map((metric) => [metric.id, metric]))
for (const [metricId, expectedLabel] of [
  ['adult-use-rate', '成年人口使用率'],
  ['age-use-rate', '年龄人群使用率'],
  ['gender-use-rate', '性别人群使用率'],
  ['registered-members', '注册会员数'],
  ['device-count', '设备数'],
]) {
  if (metricById.get(metricId)?.label !== expectedLabel) reviewerFailures.push(`missing semantic metric ${metricId}`)
}

const pewObservations = X_INTELLIGENCE_REPOSITORY.observations.filter((row) => row.sourceId === 'pew-social-2025')
if (pewObservations.some((row) => ['age-share', 'gender-share', 'internet-penetration'].includes(row.metricId))) reviewerFailures.push('Pew cohort use rates still use composition or penetration metric IDs')
if (!pewObservations.some((row) => row.metricId === 'adult-use-rate') || !pewObservations.some((row) => row.metricId === 'age-use-rate') || !pewObservations.some((row) => row.metricId === 'gender-use-rate')) reviewerFailures.push('Pew semantic use-rate observations are incomplete')

const linkedInObservations = X_INTELLIGENCE_REPOSITORY.observations.filter((row) => row.platformId === 'linkedin')
if (linkedInObservations.some((row) => row.metricId === 'mau')) reviewerFailures.push('LinkedIn members are mislabeled as MAU')
if (!linkedInObservations.some((row) => row.metricId === 'registered-members' && row.value === 1200000000)) reviewerFailures.push('LinkedIn 1.2B registered-members observation is missing')
if (!X_INTELLIGENCE_REPOSITORY.coverageGaps.some((gap) => gap.metricId === 'device-count')) reviewerFailures.push('device-count limitation gap is missing')

const xiaohongshuObservations = X_INTELLIGENCE_REPOSITORY.observations.filter((row) => row.platformId === 'xiaohongshu')
if (xiaohongshuObservations.some((row) => row.sourceId === 'xiaohongshu-commercial' || row.geography === 'global' || (row.periodStart === '2025-01-01' && row.periodEnd === '2025-12-31'))) reviewerFailures.push('Xiaohongshu observation invents official global or annual MAU scope')
const independentXiaohongshuMau = xiaohongshuObservations.find((row) => row.id === 'xiaohongshu-mobile-mau-quest-2025-05')
if (independentXiaohongshuMau?.geography !== 'china' || independentXiaohongshuMau?.periodStart !== '2025-05-01' || independentXiaohongshuMau?.periodEnd !== '2025-05-31' || independentXiaohongshuMau?.conflictGroupId) reviewerFailures.push('Independent Xiaohongshu MAU scope or conflict marker is incorrect')

const coverageGapIds = X_INTELLIGENCE_REPOSITORY.coverageGaps.map((gap) => gap.id)
if (new Set(coverageGapIds).size !== coverageGapIds.length) reviewerFailures.push('coverage gap IDs are not unique')
const unknownWithoutGap = X_INTELLIGENCE_REPOSITORY.comparisons.filter((comparison) => comparison.rating === 'unknown' && !X_INTELLIGENCE_REPOSITORY.coverageGaps.some((gap) => gap.platformId === comparison.platformId && gap.dimensionId === comparison.dimensionId))
if (unknownWithoutGap.length) reviewerFailures.push(`${unknownWithoutGap.length} unknown comparisons lack coverage gaps`)

assert.deepEqual(reviewerFailures, [], reviewerFailures.join('\n'))

console.log('[x-intelligence:model] all assertions passed')

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { X_INTELLIGENCE_REPOSITORY as repository } from '../app/(site)/x-platform-intelligence/data.mjs'
import { DEFAULT_FILTERS } from '../app/(site)/x-platform-intelligence/filters.mjs'
import {
  groupComparisonRows, selectAudienceCoverageGaps, selectGeoCoverageGaps,
  selectAudienceGroups, selectComparisonMatrix, selectEvidenceRows, selectGeoRows,
  selectOperationalInsights, selectOverview, selectScaleTrends,
} from '../app/(site)/x-platform-intelligence/selectors.mjs'

const overview = selectOverview(repository, DEFAULT_FILTERS)
assert.ok(overview.insights.length >= 3)
assert.ok(overview.insights.every((item) => item.confidence !== 'lead-only'))
assert.ok(overview.headlineMetrics.every((row) => row.platformName), 'overview scale rows must name their platform')

const insightFixture = structuredClone(repository)
insightFixture.insights.push(
  {
    id: 'lead-only-overview-regression', title: 'Lead-only regression', summary: 'Must not enter overview.',
    audienceGoal: ['technology-creator'], geographies: ['global'], segmentFilters: [], evidenceObservationIds: [],
    evidenceSourceIds: [], confidence: 'lead-only', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2',
  },
  {
    id: 'matching-segment-overview-regression', title: 'Matching segment regression', summary: 'Must enter matching segment.',
    audienceGoal: ['technology-creator'], geographies: ['global'], segmentFilters: ['technology-creators'], evidenceObservationIds: [],
    evidenceSourceIds: [], confidence: 'reference', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2',
  },
  {
    id: 'mismatched-segment-overview-regression', title: 'Mismatched segment regression', summary: 'Must not enter another segment.',
    audienceGoal: ['technology-creator'], geographies: ['global'], segmentFilters: ['enterprise-buyers'], evidenceObservationIds: [],
    evidenceSourceIds: [], confidence: 'reference', validFrom: '2026-04-01', validTo: null, snapshotId: '2026-q2',
  },
)
const permissiveOverview = selectOverview(insightFixture, { ...DEFAULT_FILTERS, confidences: [...DEFAULT_FILTERS.confidences, 'lead-only'] })
assert.ok(!permissiveOverview.insights.some((item) => item.id === 'lead-only-overview-regression'))
const allSegmentOverview = selectOverview(insightFixture, DEFAULT_FILTERS)
assert.ok(!allSegmentOverview.insights.some((item) => item.id === 'matching-segment-overview-regression'))
const matchingSegmentOverview = selectOverview(insightFixture, { ...DEFAULT_FILTERS, segment: 'technology-creators' })
assert.ok(matchingSegmentOverview.insights.some((item) => item.id === 'matching-segment-overview-regression'))
assert.ok(!matchingSegmentOverview.insights.some((item) => item.id === 'mismatched-segment-overview-regression'))

const scale = selectScaleTrends(repository, DEFAULT_FILTERS)
assert.ok(scale.groups.some((group) => group.platformId === 'x' && group.metricId === 'mau' && group.conflict))

const multiPlatformFilters = { ...DEFAULT_FILTERS, platformIds: ['x', 'threads'] }
const multiPlatformOverview = selectOverview(repository, multiPlatformFilters)
assert.deepEqual(new Set(multiPlatformOverview.headlineMetrics.map((row) => row.platformName)), new Set(['X', 'Threads']))
const multiPlatformScale = selectScaleTrends(repository, multiPlatformFilters)
const multiPlatformMauGroups = multiPlatformScale.groups.filter((group) => group.metricId === 'mau')
assert.deepEqual(new Set(multiPlatformMauGroups.map((group) => group.platformId)), new Set(['x', 'threads']))
assert.equal(multiPlatformMauGroups.find((group) => group.platformId === 'threads').conflict, false)
assert.ok(multiPlatformMauGroups.find((group) => group.platformId === 'x').conflictGroups.every((conflictGroup) => (
  conflictGroup.rows.every((row) => row.platformId === 'x' && row.conflictGroupId === conflictGroup.id)
)))

const postVolumeRepository = structuredClone(repository)
postVolumeRepository.observations.push({
  ...postVolumeRepository.observations.find((row) => row.id === 'x-global-ad-reach-2025-01'),
  id: 'x-global-post-volume-test', metricId: 'post-volume', value: 1000, unit: 'posts',
  valueType: 'exact', comparability: 'public-post-corpus', conflictGroupId: null,
})
assert.ok(selectScaleTrends(postVolumeRepository, DEFAULT_FILTERS).groups.some((group) => group.metricId === 'post-volume'))
for (const series of scale.comparableSeries) {
  assert.equal(new Set(series.rows.map((row) => `${row.platformId}:${row.metricId}:${row.unit}:${row.geography}`)).size, 1)
  assert.equal(new Set(series.rows.map((row) => `${row.comparability}:${row.methodology}`)).size, 1)
  assert.deepEqual(series.rows.map((row) => `${row.periodStart}:${row.periodEnd}`), [...series.rows]
    .sort((left, right) => left.periodStart.localeCompare(right.periodStart) || left.periodEnd.localeCompare(right.periodEnd))
    .map((row) => `${row.periodStart}:${row.periodEnd}`))
}

const chronologicalRepository = structuredClone(repository)
const chronologicalBase = chronologicalRepository.observations.find((row) => row.id === 'x-global-ad-reach-2025-01')
chronologicalRepository.observations.push({
  ...chronologicalBase,
  id: 'x-global-ad-reach-2024-10', periodStart: '2024-10-01', periodEnd: '2024-10-31', value: 580000000,
})
const chronologicalSeries = selectScaleTrends(chronologicalRepository, DEFAULT_FILTERS).comparableSeries
  .find((series) => series.rows.some((row) => row.id === 'x-global-ad-reach-2024-10'))
assert.deepEqual(chronologicalSeries.rows.map((row) => row.id), ['x-global-ad-reach-2024-10', 'x-global-ad-reach-2025-01'])

const incompatibleMethodologyRepository = structuredClone(repository)
const adReach = incompatibleMethodologyRepository.observations.find((row) => row.id === 'x-global-ad-reach-2025-01')
incompatibleMethodologyRepository.observations.push({
  ...adReach,
  id: 'x-global-ad-reach-incompatible-methodology',
  methodology: 'A deliberately incompatible methodology for regression coverage.',
})
const incompatibleScale = selectScaleTrends(incompatibleMethodologyRepository, DEFAULT_FILTERS)
const incompatibleSeries = incompatibleScale.comparableSeries.filter((series) => (
  series.rows.some((row) => row.id === adReach.id || row.id === 'x-global-ad-reach-incompatible-methodology')
))
assert.equal(incompatibleSeries.length, 2)
assert.ok(incompatibleSeries.every((series) => series.rows.length === 1))

assert.ok(selectGeoRows(repository, DEFAULT_FILTERS).every((row) => ['country-share', 'internet-penetration', 'ad-reach'].includes(row.metricId)))
const productionGeoRows = selectGeoRows(repository, DEFAULT_FILTERS)
const productionCountryAdReach = productionGeoRows.filter((row) => row.metricId === 'ad-reach')
assert.equal(productionCountryAdReach.length, 3)
assert.deepEqual(new Set(productionCountryAdReach.map((row) => row.country)), new Set(['us', 'japan', 'uk']))
assert.ok(productionCountryAdReach.every((row) => row.platformId === 'x' && row.platformName === 'X'))
assert.ok(productionGeoRows.length >= 6)
assert.deepEqual(new Set(productionGeoRows.map((row) => row.country)), new Set(['us', 'japan', 'uk']))
assert.ok(productionGeoRows.every((row) => row.country !== 'global'))
assert.ok(productionGeoRows.every((row) => typeof row.editorNote === 'string' && row.editorNote.includes('MAU')))
const geoRepository = structuredClone(repository)
geoRepository.observations.push({
  ...geoRepository.observations.find((row) => row.id === 'x-us-ad-reach-2025-01'),
  id: 'x-us-country-share-test', metricId: 'country-share', value: 17.7, valueType: 'percentage',
  unit: 'percent', comparability: 'country-share-only', conflictGroupId: null,
})
const geoRow = selectGeoRows(geoRepository, { ...DEFAULT_FILTERS, geography: 'us' })
  .find((row) => row.observationId === 'x-us-country-share-test')
assert.equal(geoRow.periodStart, '2025-01-01')
assert.equal(geoRow.periodEnd, '2025-01-31')
assert.equal(geoRow.sourceUrl, 'https://datareportal.com/essential-x-stats')

assert.deepEqual(
  new Set(selectAudienceCoverageGaps(repository, DEFAULT_FILTERS).map((gap) => gap.profileDimensionId)),
  new Set(['occupation-industry', 'city-tier', 'political-orientation', 'general-use-motivation']),
)
assert.deepEqual(
  new Set(selectGeoCoverageGaps(repository, DEFAULT_FILTERS).map((gap) => gap.geoDimensionId)),
  new Set(['country-availability', 'country-restrictions', 'primary-languages', 'country-share']),
)

assert.ok(selectAudienceGroups(repository, { ...DEFAULT_FILTERS, geography: 'us' }).every((group) => group.geography === 'us'))
assert.ok(selectAudienceGroups(repository, { ...DEFAULT_FILTERS, geography: 'us' })
  .some((group) => group.metricId === 'news-use-rate'))
const audienceRepository = structuredClone(repository)
const audienceBase = audienceRepository.observations.find((row) => row.id === 'x-us-age-18-29-use-2025')
audienceRepository.observations.push({
  ...audienceBase,
  id: 'x-us-age-18-29-use-other-method-test',
  methodology: 'A different US adult survey methodology.',
})
const ageGroups = selectAudienceGroups(audienceRepository, { ...DEFAULT_FILTERS, geography: 'us' })
  .filter((group) => group.metricId === 'age-use-rate' && group.rows.some((row) => row.segments.includes('age-18-29')))
assert.equal(ageGroups.length, 2)
assert.ok(ageGroups.every((group) => group.sources.every((source) => source.url.startsWith('https://'))))
assert.ok(ageGroups.every((group) => group.methodology.length > 0))

const newsUseRepository = structuredClone(repository)
newsUseRepository.observations.push({
  ...audienceBase,
  id: 'x-us-news-use-test', metricId: 'news-use-rate', segments: ['adults-18-plus', 'news-users'],
})
assert.ok(selectAudienceGroups(newsUseRepository, { ...DEFAULT_FILTERS, geography: 'us' })
  .some((group) => group.metricId === 'news-use-rate'))
assert.ok(selectOperationalInsights(repository, DEFAULT_FILTERS).some((item) => item.audienceGoal.includes('technology-creator')))

const operational = selectOperationalInsights(repository, DEFAULT_FILTERS)
for (const category of ['content', 'distribution', 'creator-fit', 'monetization', 'platform-risk', 'creator-risk']) {
  assert.ok(operational.some((item) => item.category === category), `missing ${category}`)
}
assert.deepEqual(
  new Set(operational.filter((item) => item.mechanicId).map((item) => item.mechanicId)),
  new Set(['formats', 'discovery-surfaces', 'relationship-propagation', 'content-lifespan', 'search-value', 'external-links']),
)
assert.deepEqual(
  new Set(operational.filter((item) => item.verdict).map((item) => item.verdict)),
  new Set(['fit', 'complement', 'avoid-only']),
)
assert.deepEqual(
  new Set(operational.filter((item) => item.playbookArea).map((item) => item.playbookArea)),
  new Set(['eligibility', 'payout-geography', 'subscriptions', 'revenue-stability', 'external-conversion']),
)
const operationalCategories = new Set(['content', 'distribution', 'creator-fit', 'monetization', 'platform-risk', 'creator-risk'])
const evidenceTypes = new Set(['当前产品规则', '监管材料', '历史开源代码', '独立研究', '编辑推断'])
for (const item of operational.filter((insight) => operationalCategories.has(insight.category))) {
  assert.ok(evidenceTypes.has(item.evidenceType), `${item.id} missing evidence type`)
  assert.ok(item.evidenceObservationIds.length + item.evidenceSourceIds.length > 0, `${item.id} missing evidence`)
  assert.match(item.lastVerifiedAt, /^\d{4}-\d{2}-\d{2}$/)
}
for (const item of operational.filter((insight) => insight.category === 'platform-risk' || insight.category === 'creator-risk')) {
  assert.ok(['high', 'medium', 'low'].includes(item.severity), `${item.id} missing severity`)
  assert.ok(['current', 'changed'].includes(item.status), `${item.id} missing status`)
}
const spacesSource = repository.sources.find((source) => source.id === 'x-spaces')
assert.ok(!spacesSource.methodologySummary.toLowerCase().includes('subscriber'), 'Spaces source must not claim subscription features')
assert.ok(!spacesSource.supportedDimensionIds.includes('native-monetization'), 'Spaces source must not support monetization')

const matrix = selectComparisonMatrix(repository, { ...DEFAULT_FILTERS, platformIds: repository.platforms.map((item) => item.id) })
assert.equal(matrix.rows.length, 12)
assert.ok(matrix.rows.every((row) => row.cells.length === 16))
assert.ok(matrix.dimensions.every((dimension) => !dimension.label.includes('-')))
const matrixGroups = groupComparisonRows(matrix.rows)
assert.equal(matrixGroups.global.length, 7)
assert.equal(matrixGroups.china.length, 6)
assert.equal(matrixGroups.global[0].platform.id, 'x')
assert.equal(matrixGroups.china[0].platform.id, 'x')

const filteredMatrixGroups = groupComparisonRows(selectComparisonMatrix(repository, {
  ...DEFAULT_FILTERS,
  platformIds: ['weibo'],
}).rows)
assert.deepEqual(filteredMatrixGroups.global.map((row) => row.platform.id), ['x'])
assert.deepEqual(filteredMatrixGroups.china.map((row) => row.platform.id), ['x', 'weibo'])

const evidenceRows = selectEvidenceRows(repository, DEFAULT_FILTERS)
assert.ok(evidenceRows.every((row) => row.sourceUrl.startsWith('https://')))

const evidenceDrawerSource = readFileSync(new URL('../app/(site)/x-platform-intelligence/components/EvidenceDrawer.jsx', import.meta.url), 'utf8')
assert.ok(evidenceDrawerSource.includes('>来源发布日期<'))
assert.ok(evidenceDrawerSource.includes('>统计期<'))
assert.ok(evidenceDrawerSource.includes('未绑定定量观测 / 不适用'))
assert.ok(!evidenceDrawerSource.includes('发布日期 / 统计期'))

const platformMatrixSource = readFileSync(new URL('../app/(site)/x-platform-intelligence/components/PlatformMatrix.jsx', import.meta.url), 'utf8')
assert.ok(platformMatrixSource.includes('role="group"'))
assert.ok(platformMatrixSource.includes('aria-pressed={activeGroup === id}'))
assert.ok(!platformMatrixSource.includes('role="tablist"'))
assert.ok(!platformMatrixSource.includes('role="tab"'))
assert.ok(!platformMatrixSource.includes('role="tabpanel"'))

console.log('[x-intelligence:selectors] all assertions passed')

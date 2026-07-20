import assert from 'node:assert/strict'
import { X_INTELLIGENCE_REPOSITORY as repository } from '../app/(site)/x-platform-intelligence/data.mjs'
import { DEFAULT_FILTERS } from '../app/(site)/x-platform-intelligence/filters.mjs'
import {
  selectAudienceGroups, selectComparisonMatrix, selectEvidenceRows, selectGeoRows,
  selectOperationalInsights, selectOverview, selectScaleTrends,
} from '../app/(site)/x-platform-intelligence/selectors.mjs'

const overview = selectOverview(repository, DEFAULT_FILTERS)
assert.ok(overview.insights.length >= 3)
assert.ok(overview.insights.every((item) => item.confidence !== 'lead-only'))

const scale = selectScaleTrends(repository, DEFAULT_FILTERS)
assert.ok(scale.groups.some((group) => group.metricId === 'mau' && group.conflict))
for (const series of scale.comparableSeries) {
  assert.equal(new Set(series.rows.map((row) => `${row.metricId}:${row.unit}:${row.geography}`)).size, 1)
  assert.equal(new Set(series.rows.map((row) => `${row.periodStart}:${row.periodEnd}:${row.comparability}:${row.methodology}`)).size, 1)
}

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

assert.ok(selectGeoRows(repository, DEFAULT_FILTERS).every((row) => row.metricId === 'country-share' || row.metricId === 'internet-penetration'))
assert.ok(selectAudienceGroups(repository, { ...DEFAULT_FILTERS, geography: 'us' }).every((group) => group.geography === 'us'))
assert.ok(selectOperationalInsights(repository, DEFAULT_FILTERS).some((item) => item.audienceGoal.includes('technology-creator')))

const matrix = selectComparisonMatrix(repository, { ...DEFAULT_FILTERS, platformIds: repository.platforms.map((item) => item.id) })
assert.equal(matrix.rows.length, 12)
assert.ok(matrix.rows.every((row) => row.cells.length === 16))

const evidenceRows = selectEvidenceRows(repository, DEFAULT_FILTERS)
assert.ok(evidenceRows.every((row) => row.sourceUrl.startsWith('https://')))

console.log('[x-intelligence:selectors] all assertions passed')

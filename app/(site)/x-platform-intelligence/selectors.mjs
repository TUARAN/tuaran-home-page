import { filterObservations } from './filters.mjs'

const SCALE_METRIC_IDS = new Set([
  'dau', 'mau', 'ad-reach', 'registered-members', 'device-count', 'monthly-visitors', 'daily-minutes',
])

const AUDIENCE_METRIC_IDS = new Set([
  'adult-use-rate', 'age-use-rate', 'gender-use-rate', 'income-use-rate', 'education-use-rate',
  'age-share', 'gender-share',
])

const CONFIDENCE_ORDER = new Map([['high', 0], ['reference', 1], ['disputed', 2]])

function selectedInsights(repository, filters, { includeAllGoals = false } = {}) {
  return repository.insights.filter((item) => (
    item.snapshotId === filters.snapshotId
    && filters.confidences.includes(item.confidence)
    && (filters.geography === 'global' ? item.geographies.includes('global') : item.geographies.includes(filters.geography))
    && (includeAllGoals || item.audienceGoal.includes(filters.goal))
  ))
}

function metricLabel(repository, metricId) {
  return repository.metrics.find((metric) => metric.id === metricId)?.label || metricId
}

function sortByRepositoryOrder(items, source) {
  const position = new Map(source.map((item, index) => [item.id, index]))
  return [...items].sort((left, right) => position.get(left.id) - position.get(right.id))
}

function groupBy(items, keyFor) {
  const groups = new Map()
  for (const item of items) {
    const key = keyFor(item)
    const group = groups.get(key)
    if (group) group.push(item)
    else groups.set(key, [item])
  }
  return groups
}

function methodologyKey(row) {
  return [
    row.metricId, row.unit, row.geography, row.periodStart, row.periodEnd,
    row.comparability, row.methodology, row.segments.join('|'),
  ].join('\u0000')
}

export function selectOverview(repository, filters) {
  const observations = filterObservations(repository, filters)
  const insights = selectedInsights(repository, filters, { includeAllGoals: true })
  const conflictRows = observations.filter((row) => row.conflictGroupId)
  const snapshot = repository.snapshots.find((item) => item.id === filters.snapshotId) || null

  return {
    snapshot,
    headlineMetrics: observations.filter((row) => SCALE_METRIC_IDS.has(row.metricId)),
    insights,
    changeNotes: conflictRows.map((row) => ({
      observationId: row.id,
      conflictGroupId: row.conflictGroupId,
      note: row.editorNote || row.methodology,
    })),
    transparencyNote: {
      sourceCount: repository.sources.length,
      observationCount: observations.length,
      coverageGapCount: repository.coverageGaps.length,
      conflictCount: new Set(conflictRows.map((row) => row.conflictGroupId)).size,
    },
  }
}

export function selectScaleTrends(repository, filters) {
  const rows = filterObservations(repository, filters).filter((row) => (
    SCALE_METRIC_IDS.has(row.metricId) && typeof row.value === 'number'
  ))
  const groups = [...groupBy(rows, (row) => row.metricId)].map(([metricId, groupRows]) => ({
    metricId,
    label: metricLabel(repository, metricId),
    rows: groupRows,
    conflict: groupRows.some((row) => row.conflictGroupId),
  }))

  const comparableSeries = [...groupBy(rows.filter((row) => !row.conflictGroupId), methodologyKey)].map(([key, seriesRows]) => ({
    key,
    rows: seriesRows,
  }))

  return { groups, comparableSeries }
}

export function selectGeoRows(repository, filters) {
  return filterObservations(repository, filters)
    .filter((row) => row.metricId === 'country-share' || row.metricId === 'internet-penetration')
    .map((row) => ({
      observationId: row.id,
      country: row.geography,
      metricId: row.metricId,
      value: row.value,
      unit: row.unit,
      confidence: row.confidence,
      sourceId: row.sourceId,
    }))
}

export function selectAudienceGroups(repository, filters) {
  const rows = filterObservations(repository, filters).filter((row) => (
    AUDIENCE_METRIC_IDS.has(row.metricId)
    && (filters.geography === 'global' ? row.geography === 'global' : row.geography === filters.geography)
  ))

  return [...groupBy(rows, (row) => [row.metricId, row.geography, row.segments.join('|')].join('\u0000'))]
    .map(([key, groupRows]) => ({
      key,
      metricId: groupRows[0].metricId,
      geography: groupRows[0].geography,
      segmentLabel: groupRows[0].segments.at(-1) || 'all',
      rows: groupRows,
    }))
}

export function selectOperationalInsights(repository, filters) {
  return selectedInsights(repository, filters)
    .sort((left, right) => CONFIDENCE_ORDER.get(left.confidence) - CONFIDENCE_ORDER.get(right.confidence))
}

export function selectComparisonMatrix(repository, filters) {
  const comparisons = repository.comparisons.filter((item) => (
    item.snapshotId === filters.snapshotId && filters.platformIds.includes(item.platformId)
  ))
  const dimensions = [...new Set(repository.comparisons
    .filter((item) => item.snapshotId === filters.snapshotId)
    .map((item) => item.dimensionId))]
    .map((id) => ({ id, label: id }))

  const comparisonByPlatformDimension = new Map(comparisons.map((item) => [`${item.platformId}\u0000${item.dimensionId}`, item]))
  const platforms = sortByRepositoryOrder(
    repository.platforms.filter((platform) => filters.platformIds.includes(platform.id)),
    repository.platforms,
  )

  return {
    dimensions,
    rows: platforms.map((platform) => ({
      platform,
      cells: dimensions.map((dimension) => {
        const comparison = comparisonByPlatformDimension.get(`${platform.id}\u0000${dimension.id}`)
        return {
          comparisonId: comparison?.id || null,
          dimensionId: dimension.id,
          rating: comparison?.rating || 'unknown',
          confidence: comparison?.confidence || 'lead-only',
        }
      }),
    })),
  }
}

export function selectEvidenceRows(repository, filters) {
  const sourceById = new Map(repository.sources.map((item) => [item.id, item]))
  return filterObservations(repository, filters).map((row) => {
    const source = sourceById.get(row.sourceId)
    return {
      observationId: row.id,
      platformId: row.platformId,
      metricId: row.metricId,
      value: row.value,
      unit: row.unit,
      confidence: row.confidence,
      sourceId: row.sourceId,
      sourceTitle: source?.title || '',
      sourceUrl: source?.url || '',
      period: `${row.periodStart}/${row.periodEnd}`,
      geography: row.geography,
      methodology: row.methodology,
      conflictGroupId: row.conflictGroupId,
    }
  })
}

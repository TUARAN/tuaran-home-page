import { filterObservations } from './filters.mjs'

const SCALE_METRIC_IDS = new Set([
  'dau', 'mau', 'ad-reach', 'registered-members', 'device-count', 'monthly-visitors', 'daily-minutes',
  'post-volume',
])

const AUDIENCE_METRIC_IDS = new Set([
  'adult-use-rate', 'age-use-rate', 'gender-use-rate', 'income-use-rate', 'education-use-rate',
  'age-share', 'gender-share', 'news-use-rate',
])

const CONFIDENCE_ORDER = new Map([['high', 0], ['reference', 1], ['disputed', 2]])

const COMPARISON_DIMENSION_LABELS = {
  reach: '总体触达',
  realtime: '实时性',
  'content-longevity': '内容寿命',
  'search-value': '搜索价值',
  'professional-relationships': '专业关系密度',
  'public-conversation': '公共讨论能力',
  'external-links': '外链友好度',
  'algorithmic-distribution': '算法分发强度',
  'follow-graph': '关注关系价值',
  'chinese-reach': '中文覆盖',
  internationalization: '国际化',
  'production-cost': '内容制作成本',
  'native-monetization': '原生商业化',
  'private-audience': '私域沉淀',
  'brand-safety': '品牌安全',
  'data-transparency': '数据透明度',
}

export function comparisonDimensionLabel(dimensionId) {
  return COMPARISON_DIMENSION_LABELS[dimensionId] || dimensionId
}

function selectedInsights(repository, filters, { includeAllGoals = false } = {}) {
  return repository.insights.filter((item) => (
    item.snapshotId === filters.snapshotId
    && item.confidence !== 'lead-only'
    && filters.confidences.includes(item.confidence)
    && (filters.geography === 'global' ? item.geographies.includes('global') : item.geographies.includes(filters.geography))
    && (filters.segment === 'all'
      ? item.segmentFilters.length === 0
      : item.segmentFilters.length === 0 || item.segmentFilters.includes(filters.segment))
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
  const sourceById = new Map(repository.sources.map((item) => [item.id, item]))
  return repository.observations
    .filter((row) => (
      row.snapshotId === filters.snapshotId
      && filters.platformIds.includes(row.platformId)
      && filters.confidences.includes(row.confidence)
      && (row.metricId === 'country-share' || row.metricId === 'internet-penetration')
      && (filters.geography === 'global' ? row.geography !== 'global' : row.geography === filters.geography)
      && (filters.segment === 'all' || row.segments.includes(filters.segment))
    ))
    .map((row) => {
      const source = sourceById.get(row.sourceId)
      return {
        observationId: row.id,
        country: row.geography,
        metricId: row.metricId,
        value: row.value,
        unit: row.unit,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        confidence: row.confidence,
        sourceId: row.sourceId,
        sourceTitle: source?.title || '',
        sourceUrl: source?.url || '',
        editorNote: row.editorNote,
      }
    })
}

export function selectAudienceGroups(repository, filters) {
  const sourceById = new Map(repository.sources.map((item) => [item.id, item]))
  const rows = filterObservations(repository, filters).filter((row) => (
    AUDIENCE_METRIC_IDS.has(row.metricId)
    && (filters.geography === 'global' ? row.geography === 'global' : row.geography === filters.geography)
  ))

  return [...groupBy(rows, (row) => [
    row.metricId, row.platformId, row.geography, row.methodology, row.sourceId, row.comparability,
  ].join('\u0000'))]
    .map(([key, groupRows]) => ({
      key,
      metricId: groupRows[0].metricId,
      platformId: groupRows[0].platformId,
      geography: groupRows[0].geography,
      segmentLabel: groupRows[0].segments[0] || 'all',
      methodology: groupRows[0].methodology,
      sources: [...new Set(groupRows.map((row) => row.sourceId))].map((sourceId) => {
        const source = sourceById.get(sourceId)
        return {
          id: sourceId,
          title: source?.title || sourceId,
          url: source?.url || '',
          sampleSize: source?.sampleSize || null,
          methodologySummary: source?.methodologySummary || '',
        }
      }),
      rows: groupRows,
    }))
}

export function selectOperationalInsights(repository, filters) {
  return selectedInsights(repository, filters)
    .sort((left, right) => CONFIDENCE_ORDER.get(left.confidence) - CONFIDENCE_ORDER.get(right.confidence))
}

export function selectComparisonMatrix(repository, filters) {
  const platformIds = new Set(['x', ...filters.platformIds])
  const comparisons = repository.comparisons.filter((item) => (
    item.snapshotId === filters.snapshotId && platformIds.has(item.platformId)
  ))
  const dimensions = [...new Set(repository.comparisons
    .filter((item) => item.snapshotId === filters.snapshotId)
    .map((item) => item.dimensionId))]
    .map((id) => ({ id, label: comparisonDimensionLabel(id) }))

  const comparisonByPlatformDimension = new Map(comparisons.map((item) => [`${item.platformId}\u0000${item.dimensionId}`, item]))
  const platforms = sortByRepositoryOrder(
    repository.platforms.filter((platform) => platformIds.has(platform.id)),
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

export function groupComparisonRows(rows) {
  const focusRow = rows.find((row) => row.platform.id === 'x')
  const rowsFor = (group) => [
    ...(focusRow ? [focusRow] : []),
    ...rows.filter((row) => row.platform.group === group),
  ]
  return { global: rowsFor('global'), china: rowsFor('china') }
}

export function selectEvidenceRows(repository, filters) {
  const sourceById = new Map(repository.sources.map((item) => [item.id, item]))
  return filterObservations(repository, filters).map((row) => {
    const source = sourceById.get(row.sourceId)
    return {
      observationId: row.id,
      platformId: row.platformId,
      metricId: row.metricId,
      valueType: row.valueType,
      value: row.value,
      valueMin: row.valueMin,
      valueMax: row.valueMax,
      unit: row.unit,
      confidence: row.confidence,
      sourceId: row.sourceId,
      sourceTitle: source?.title || '',
      sourceUrl: source?.url || '',
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      period: `${row.periodStart}/${row.periodEnd}`,
      geography: row.geography,
      segments: row.segments,
      methodology: row.methodology,
      conflictGroupId: row.conflictGroupId,
    }
  })
}

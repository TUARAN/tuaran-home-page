const VALUE_TYPES = new Set(['exact', 'range', 'percentage', 'index', 'qualitative'])
const CONFIDENCE = new Set(['high', 'reference', 'disputed', 'lead-only'])
const RATINGS = new Set(['high', 'medium', 'low', 'unknown'])

function duplicateIds(items) {
  const seen = new Set()
  return items.map((item) => item.id).filter((id) => seen.has(id) || !seen.add(id))
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function createRepositoryIndex(repository) {
  return {
    sourceById: new Map(repository.sources.map((item) => [item.id, item])),
    observationById: new Map(repository.observations.map((item) => [item.id, item])),
    insightById: new Map(repository.insights.map((item) => [item.id, item])),
    comparisonById: new Map(repository.comparisons.map((item) => [item.id, item])),
  }
}

export function validateRepository(repository) {
  const errors = []
  const warnings = []
  const collections = ['platforms', 'metrics', 'sources', 'snapshots', 'observations', 'insights', 'comparisons', 'coverageGaps']
  for (const name of collections) if (!Array.isArray(repository[name])) errors.push(`${name} must be an array`)
  if (errors.length) return { errors, warnings }

  for (const name of collections.filter((name) => name !== 'coverageGaps')) {
    for (const id of duplicateIds(repository[name])) errors.push(`${name} duplicate id: ${id}`)
  }

  const platformIds = new Set(repository.platforms.map((item) => item.id))
  const metricById = new Map(repository.metrics.map((item) => [item.id, item]))
  const sourceIds = new Set(repository.sources.map((item) => item.id))
  const snapshotIds = new Set(repository.snapshots.map((item) => item.id))
  const observationIds = new Set(repository.observations.map((item) => item.id))

  for (const source of repository.sources) {
    if (!validDate(source.publishedAt) || !validDate(source.accessedAt)) errors.push(`source ${source.id} has invalid dates`)
    if (!/^https:\/\//.test(source.url)) errors.push(`source ${source.id} must use https`)
  }

  for (const row of repository.observations) {
    const metric = metricById.get(row.metricId)
    if (!platformIds.has(row.platformId)) errors.push(`observation ${row.id} missing platform ${row.platformId}`)
    if (!metric) errors.push(`observation ${row.id} missing metric ${row.metricId}`)
    if (!sourceIds.has(row.sourceId)) errors.push(`observation ${row.id} missing source ${row.sourceId}`)
    if (!snapshotIds.has(row.snapshotId)) errors.push(`observation ${row.id} missing snapshot ${row.snapshotId}`)
    if (!VALUE_TYPES.has(row.valueType)) errors.push(`observation ${row.id} invalid valueType ${row.valueType}`)
    if (!CONFIDENCE.has(row.confidence)) errors.push(`observation ${row.id} invalid confidence ${row.confidence}`)
    if (metric && !metric.allowedUnits.includes(row.unit)) errors.push(`observation ${row.id} unit ${row.unit} not allowed`)
    if (!validDate(row.periodStart) || !validDate(row.periodEnd) || row.periodStart > row.periodEnd) errors.push(`observation ${row.id} periodStart must not exceed periodEnd`)
    if (row.valueType === 'percentage' && (row.value < 0 || row.value > 100)) errors.push(`observation ${row.id} percentage outside 0..100`)
    if (row.valueType === 'range' && !(row.valueMin <= row.valueMax)) errors.push(`observation ${row.id} invalid range`)
  }

  const conflictCounts = repository.observations.reduce((counts, row) => {
    if (row.conflictGroupId) counts.set(row.conflictGroupId, (counts.get(row.conflictGroupId) || 0) + 1)
    return counts
  }, new Map())
  for (const [groupId, count] of conflictCounts) if (count < 2) errors.push(`conflict group ${groupId} must contain at least two observations`)

  for (const insight of repository.insights) {
    if (!snapshotIds.has(insight.snapshotId)) errors.push(`insight ${insight.id} missing snapshot ${insight.snapshotId}`)
    for (const id of insight.evidenceObservationIds) if (!observationIds.has(id)) errors.push(`insight ${insight.id} missing observation ${id}`)
    for (const id of insight.evidenceSourceIds) if (!sourceIds.has(id)) errors.push(`insight ${insight.id} missing source ${id}`)
    if (insight.confidence === 'lead-only') warnings.push(`insight ${insight.id} is lead-only and must not enter overview`)
  }

  for (const comparison of repository.comparisons) {
    if (!platformIds.has(comparison.platformId)) errors.push(`comparison ${comparison.id} missing platform ${comparison.platformId}`)
    if (!snapshotIds.has(comparison.snapshotId)) errors.push(`comparison ${comparison.id} missing snapshot ${comparison.snapshotId}`)
    if (!RATINGS.has(comparison.rating)) errors.push(`comparison ${comparison.id} invalid rating ${comparison.rating}`)
    if (!comparison.quantitativeObservationIds.length && !comparison.evidenceSourceIds.length) errors.push(`comparison ${comparison.id} has no evidence`)
    for (const id of comparison.quantitativeObservationIds) if (!observationIds.has(id)) errors.push(`comparison ${comparison.id} missing observation ${id}`)
    for (const id of comparison.evidenceSourceIds) if (!sourceIds.has(id)) errors.push(`comparison ${comparison.id} missing source ${id}`)
  }

  return { errors, warnings }
}

export function getEvidenceBundle(repository, evidenceRef) {
  if (!evidenceRef || !['observation', 'insight', 'comparison'].includes(evidenceRef.kind)) {
    return { subject: null, sources: [], observations: [], conflicts: [] }
  }
  const index = createRepositoryIndex(repository)
  const map = evidenceRef.kind === 'observation' ? index.observationById : evidenceRef.kind === 'insight' ? index.insightById : index.comparisonById
  const subject = map.get(evidenceRef.id)
  if (!subject) return { subject: null, sources: [], observations: [], conflicts: [] }
  const observationIds = evidenceRef.kind === 'observation' ? [subject.id] : subject.evidenceObservationIds || subject.quantitativeObservationIds || []
  const observations = observationIds.map((id) => index.observationById.get(id)).filter(Boolean)
  const sourceIds = new Set([...(subject.evidenceSourceIds || []), ...observations.map((row) => row.sourceId)])
  const conflicts = observations.filter((row) => row.conflictGroupId).flatMap((row) => repository.observations.filter((candidate) => candidate.conflictGroupId === row.conflictGroupId))
  return { subject, observations, sources: [...sourceIds].map((id) => index.sourceById.get(id)).filter(Boolean), conflicts: [...new Map(conflicts.map((row) => [row.id, row])).values()] }
}

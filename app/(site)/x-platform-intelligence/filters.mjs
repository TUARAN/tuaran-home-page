export const DEFAULT_FILTERS = Object.freeze({
  snapshotId: '2026-q2', geography: 'global', segment: 'all', goal: 'technology-creator',
  platformIds: ['x'], confidences: ['high', 'reference', 'disputed'],
})

const DEFAULT_CONFIDENCES = new Set(DEFAULT_FILTERS.confidences)

function parseList(value, allowed) {
  return value.split(',').filter((item) => allowed.has(item))
}

function hasSameValues(value, defaults) {
  return value.length === defaults.length && value.every((item, index) => item === defaults[index])
}

export function parseFilterParams(params, repository) {
  const snapshotIds = new Set(repository.snapshots.map((snapshot) => snapshot.id))
  const platformIds = new Set(repository.platforms.map((platform) => platform.id))
  const snapshotId = params.get('snapshot')
  const platforms = params.get('platforms')
  const confidence = params.get('confidence')

  return {
    snapshotId: snapshotIds.has(snapshotId) ? snapshotId : DEFAULT_FILTERS.snapshotId,
    geography: params.get('geo') || DEFAULT_FILTERS.geography,
    segment: params.get('segment') || DEFAULT_FILTERS.segment,
    goal: params.get('goal') || DEFAULT_FILTERS.goal,
    platformIds: platforms === null ? [...DEFAULT_FILTERS.platformIds] : parseList(platforms, platformIds),
    confidences: confidence === null ? [...DEFAULT_FILTERS.confidences] : parseList(confidence, DEFAULT_CONFIDENCES),
  }
}

export function serializeFilterParams(filters) {
  const params = new URLSearchParams()
  const orderedValues = [
    ['snapshot', filters.snapshotId, DEFAULT_FILTERS.snapshotId],
    ['geo', filters.geography, DEFAULT_FILTERS.geography],
    ['segment', filters.segment, DEFAULT_FILTERS.segment],
    ['goal', filters.goal, DEFAULT_FILTERS.goal],
  ]

  for (const [key, value, defaultValue] of orderedValues) if (value !== defaultValue) params.set(key, value)
  if (!hasSameValues(filters.platformIds, DEFAULT_FILTERS.platformIds)) params.set('platforms', filters.platformIds.join(','))
  if (!hasSameValues(filters.confidences, DEFAULT_FILTERS.confidences)) params.set('confidence', filters.confidences.join(','))
  return params
}

export function filterObservations(repository, filters) {
  return repository.observations.filter((row) => (
    row.snapshotId === filters.snapshotId
    && filters.platformIds.includes(row.platformId)
    && filters.confidences.includes(row.confidence)
    && (filters.geography === 'global' ? row.geography === 'global' : row.geography === filters.geography || row.geography === 'global')
    && (filters.segment === 'all' || row.segments.includes(filters.segment))
  ))
}

function escapeCsvValue(value) {
  const text = String(value ?? '')
  const needsQuotes = /[,"]|\r|\n|[“”]/.test(text)
  return needsQuotes ? `"${text.replaceAll('"', '""')}"` : text
}

export function buildEvidenceCsv(rows) {
  const columns = Object.keys(rows[0] || {})
  const lines = [columns.join(',')]
  for (const row of rows) lines.push(columns.map((column) => escapeCsvValue(row[column])).join(','))
  return `\uFEFF${lines.join('\r\n')}\r\n`
}

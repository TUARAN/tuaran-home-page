import { confidenceLabel, formatMetricValue, formatPeriod, geographyLabel, segmentLabel } from './presentation.mjs'

const CONFIDENCE_ORDER = new Map([
  ['high', 0],
  ['reference', 1],
  ['disputed', 2],
  ['lead-only', 3],
])

function platformName(repository, platformId) {
  return repository.platforms.find((item) => item.id === platformId)?.name || platformId
}

function metricLabel(repository, metricId) {
  return repository.metrics.find((item) => item.id === metricId)?.label || metricId
}

export function evidenceAudienceLabel(row) {
  const segments = row.segments?.length ? row.segments.map(segmentLabel).join('、') : '全部人群'
  return `${geographyLabel(row.geography)} · ${segments}`
}

function conflictLabel(conflictGroupId) {
  return conflictGroupId ? `冲突组：${conflictGroupId}` : '无'
}

function sourceLabel(row) {
  return row.sourceUrl ? `${row.sourceTitle} (${row.sourceUrl})` : row.sourceTitle
}

export function buildEvidenceExportRows(rows, repository) {
  return rows.map((row) => ({
    平台: platformName(repository, row.platformId),
    指标: metricLabel(repository, row.metricId),
    数值: formatMetricValue(row),
    统计期: formatPeriod(row.periodStart, row.periodEnd),
    '地区/人群': evidenceAudienceLabel(row),
    来源: sourceLabel(row),
    口径: row.methodology || '未注明',
    可信度: confidenceLabel(row.confidence),
    冲突状态: conflictLabel(row.conflictGroupId),
  }))
}

function normalized(value) {
  return String(value || '').trim().toLocaleLowerCase('zh-CN')
}

function rowSearchText(row) {
  return [
    row.platformId, row.metricId, row.value, row.valueMin, row.valueMax, row.unit,
    row.confidence, row.sourceTitle, row.sourceUrl, row.periodStart, row.periodEnd,
    row.geography, ...(row.segments || []), row.methodology, row.conflictGroupId,
  ].map(normalized).join('\u0000')
}

export function filterEvidenceRowsForSearch(rows, query) {
  const needle = normalized(query)
  return needle ? rows.filter((row) => rowSearchText(row).includes(needle)) : rows
}

function sortValue(row, key) {
  if (key === 'platform') return normalized(row.platformName || row.platformId)
  if (key === 'metric') return normalized(row.metricLabel || row.metricId)
  if (key === 'period') return `${row.periodStart}\u0000${row.periodEnd}`
  if (key === 'confidence') return CONFIDENCE_ORDER.get(row.confidence) ?? Number.MAX_SAFE_INTEGER
  return ''
}

export function sortEvidenceRows(rows, { key, direction }) {
  if (!key || !direction) return [...rows]
  const factor = direction === 'descending' ? -1 : 1
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const a = sortValue(left.row, key)
      const b = sortValue(right.row, key)
      const result = typeof a === 'number' && typeof b === 'number'
        ? a - b
        : String(a).localeCompare(String(b), 'zh-CN')
      return result ? result * factor : left.index - right.index
    })
    .map(({ row }) => row)
}

export function enrichEvidenceRows(rows, repository) {
  return rows.map((row) => ({
    ...row,
    platformName: platformName(repository, row.platformId),
    metricLabel: metricLabel(repository, row.metricId),
  }))
}

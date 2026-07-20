import assert from 'node:assert/strict'

import { X_INTELLIGENCE_REPOSITORY as repository } from '../app/(site)/x-platform-intelligence/data.mjs'
import { buildEvidenceCsv } from '../app/(site)/x-platform-intelligence/filters.mjs'
import { selectEvidenceRows } from '../app/(site)/x-platform-intelligence/selectors.mjs'
import {
  buildEvidenceExportRows,
  filterEvidenceRowsForSearch,
  sortEvidenceRows,
} from '../app/(site)/x-platform-intelligence/evidenceLedger.mjs'

const globalRows = selectEvidenceRows(repository, {
  snapshotId: '2026-q2',
  geography: 'global',
  segment: 'all',
  goal: 'technology-creator',
  platformIds: ['x'],
  confidences: ['high', 'reference', 'disputed'],
})

assert.ok(globalRows.length > 1, 'fixture needs multiple globally filtered rows')

const searchedRows = filterEvidenceRowsForSearch(globalRows, 'consumer spending')
assert.ok(searchedRows.length > 0)
assert.ok(searchedRows.length < globalRows.length, 'local search narrows the already global-filtered rows')
assert.ok(searchedRows.every((row) => globalRows.includes(row)))

const sortedRows = sortEvidenceRows(globalRows, { key: 'confidence', direction: 'ascending' })
assert.ok(sortedRows.findIndex((row) => row.confidence === 'high') < sortedRows.findIndex((row) => row.confidence === 'reference'))

const exportRows = buildEvidenceExportRows(globalRows, repository)
assert.equal(exportRows.length, globalRows.length, 'CSV exports global filter results, not the local search subset')
assert.deepEqual(Object.keys(exportRows[0]), ['平台', '指标', '数值', '统计期', '地区/人群', '来源', '口径', '可信度', '冲突状态'])

const csv = buildEvidenceCsv([{
  ...exportRows[0],
  来源: '含,逗号与"引号"的中文来源',
  口径: '第一行\n第二行',
}])
assert.ok(csv.startsWith('\uFEFF平台,指标,数值,统计期,地区/人群,来源,口径,可信度,冲突状态\r\n'))
assert.ok(csv.includes('"含,逗号与""引号""的中文来源"'))
assert.ok(csv.includes('"第一行\n第二行"'))
assert.ok(csv.endsWith('\r\n'))

console.log('[x-intelligence:evidence-ledger] all assertions passed')

import assert from 'node:assert/strict'
import { X_INTELLIGENCE_REPOSITORY as repository } from '../app/(site)/x-platform-intelligence/data.mjs'
import {
  DEFAULT_FILTERS, buildEvidenceCsv, filterObservations, parseFilterParams, serializeFilterParams,
} from '../app/(site)/x-platform-intelligence/filters.mjs'

assert.deepEqual(parseFilterParams(new URLSearchParams(), repository), DEFAULT_FILTERS)

const parsed = parseFilterParams(new URLSearchParams('snapshot=bad&geo=us&goal=technology-creator&platforms=x,weibo,bad&confidence=high,disputed'), repository)
assert.equal(parsed.snapshotId, '2026-q2')
assert.equal(parsed.geography, 'us')
assert.deepEqual(parsed.platformIds, ['x', 'weibo'])
assert.deepEqual(parsed.confidences, ['high', 'disputed'])

const invalidDimensions = parseFilterParams(new URLSearchParams('geo=invalid&segment=invalid&goal=invalid'), repository)
assert.equal(invalidDimensions.geography, DEFAULT_FILTERS.geography)
assert.equal(invalidDimensions.segment, DEFAULT_FILTERS.segment)
assert.equal(invalidDimensions.goal, DEFAULT_FILTERS.goal)

const serialized = serializeFilterParams({ ...DEFAULT_FILTERS, geography: 'us', platformIds: ['x', 'reddit'] })
assert.equal(serialized.toString(), 'geo=us&platforms=x%2Creddit')

const rows = filterObservations(repository, { ...DEFAULT_FILTERS, geography: 'us', platformIds: ['x'] })
assert.ok(rows.length > 0)
assert.ok(rows.every((row) => row.platformId === 'x' && (row.geography === 'us' || row.geography === 'global')))

const csv = buildEvidenceCsv([{ metric: 'MAU', value: '区间', source: 'X, Inc.', note: '含“冲突”' }])
assert.equal(csv, '\uFEFFmetric,value,source,note\r\nMAU,区间,"X, Inc.","含“冲突”"\r\n')

const formulaCsv = buildEvidenceCsv([{
  equals: '=HYPERLINK("https://example.com", "打开")',
  plus: '+SUM(1,2)',
  minus: '-1+2',
  at: '@SUM(1,2)',
  whitespace: '\t \r =SUM(1,2)',
  safeNumber: -42,
}])
assert.ok(formulaCsv.includes("'=HYPERLINK"))
assert.ok(formulaCsv.includes("'+SUM(1,2)"))
assert.ok(formulaCsv.includes("'-1+2"))
assert.ok(formulaCsv.includes("'@SUM(1,2)"))
assert.ok(formulaCsv.includes("'\t \r =SUM(1,2)"))
assert.ok(formulaCsv.includes(',-42\r\n'))

console.log('[x-intelligence:filters] all assertions passed')

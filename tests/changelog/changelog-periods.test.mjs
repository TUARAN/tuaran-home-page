import assert from 'node:assert/strict'
import test from 'node:test'

import { CHANGELOG } from '../../lib/changelogData.js'
import { buildChangelogPeriods } from '../../lib/changelogPeriods.js'
import { getChangelogPeriodSummary } from '../../lib/changelogPeriodSummaries.js'

const ENTRIES = [
  { version: 'a', week: '2026-W27', range: '2026-06-29 至 2026-06-30', commits: 4 },
  { version: 'b', week: '2026-W27', range: '2026-07-02', commits: 6 },
  { version: 'c', week: '2026-W26', range: '2026-06-25 起', commits: 2 },
  { version: 'd', week: '2025-W31', range: '2025-07-29 至 2025-07-31', commits: 3 },
]

test('week view merges entries with the same ISO week', () => {
  const periods = buildChangelogPeriods(ENTRIES, 'week')

  assert.equal(periods.length, 3)
  assert.equal(periods[0].key, '2026-W27')
  assert.equal(periods[0].label, '2026 年第 27 周')
  assert.equal(periods[0].entries.length, 2)
  assert.equal(periods[0].commits, 10)
  assert.equal(periods[0].range, '2026-06-29 至 2026-07-02')
})

test('month, quarter and year views derive from entry dates', () => {
  assert.deepEqual(
    buildChangelogPeriods(ENTRIES, 'month').map((period) => period.key),
    ['2026-06', '2026-07', '2025-07'],
  )
  assert.deepEqual(
    buildChangelogPeriods(ENTRIES, 'quarter').map((period) => period.key),
    ['2026-Q2', '2026-Q3', '2025-Q3'],
  )
  assert.deepEqual(
    buildChangelogPeriods(ENTRIES, 'year').map((period) => period.key),
    ['2026', '2025'],
  )
})

test('all existing month, quarter and year periods have curated synthesis', () => {
  for (const view of ['month', 'quarter', 'year']) {
    for (const period of buildChangelogPeriods(CHANGELOG, view)) {
      const summary = getChangelogPeriodSummary(period, view)
      assert.ok(summary.title, `${view}/${period.key} should have a title`)
      assert.ok(summary.summary.length >= 30, `${view}/${period.key} should have an abstract summary`)
      assert.ok(summary.highlights.length >= 3, `${view}/${period.key} should have highlights`)
      assert.doesNotMatch(summary.signal, /尚未补充人工阶段判断/, `${view}/${period.key} should be curated`)
    }
  }
})

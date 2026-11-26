import assert from 'node:assert/strict'
import test from 'node:test'

import { CHANGELOG } from '../../lib/automation/changelogData.js'
import {
  averageChangelogRatings,
  CHANGELOG_RATING_DIMENSIONS,
  CHANGELOG_RATING_META,
  CHANGELOG_RATINGS,
  getChangelogRating,
} from '../../lib/automation/changelogRatings.js'

test('ratings are signed by Claude Opus 5.5', () => {
  assert.equal(CHANGELOG_RATING_META.rater, 'Claude Opus 5.5')
  assert.match(CHANGELOG_RATING_META.ratedAt, /^\d{4}-\d{2}-\d{2}$/)
})

test('every changelog week has a rating except weeks added after the rating date', () => {
  const missing = [...new Set(CHANGELOG.map((entry) => entry.week))].filter((week) => {
    if (getChangelogRating(week)) return false
    const firstDate = CHANGELOG.find((entry) => entry.week === week).range.match(/\d{4}-\d{2}-\d{2}/)?.[0]
    return !firstDate || firstDate <= CHANGELOG_RATING_META.ratedAt
  })
  assert.deepEqual(missing, [])
})

test('scores cover all seven dimensions within 1 to 10 and carry a note', () => {
  const ids = CHANGELOG_RATING_DIMENSIONS.map(({ id }) => id)
  assert.deepEqual(ids, ['feature', 'content', 'experience', 'engineering', 'focus', 'market', 'personal'])
  for (const [week, rating] of Object.entries(CHANGELOG_RATINGS)) {
    assert.deepEqual(Object.keys(rating.scores), ids, week)
    assert.equal('overall' in rating, false, week)
    for (const [id, value] of Object.entries(rating.scores)) {
      if (id === 'market' && value === null) continue
      assert.ok(Number.isInteger(value) && value >= 1 && value <= 10, `${week} ${id} ${value}`)
    }
    assert.ok(rating.note.length >= 6, week)
    assert.doesNotMatch(rating.note, /不是.{1,20}而是/, week)
  }
})

test('market is blank before D1 has records and scored from 2026-W24 on', () => {
  assert.equal(getChangelogRating('2026-W23').scores.market, null)
  assert.equal(getChangelogRating('2025-W28').scores.market, null)
  for (const [week, rating] of Object.entries(CHANGELOG_RATINGS)) {
    if (week >= '2026-W24') assert.notEqual(rating.scores.market, null, week)
  }
})

test('period average ignores unrated weeks, dedupes and skips blank market', () => {
  const average = averageChangelogRatings(['2026-W48', '2026-W48', '2026-W47', '2099-W01'])
  assert.equal(average.weeks, 2)
  assert.equal(average.scores.market, 4)
  assert.equal(averageChangelogRatings(['2026-W24', '2026-W23']).scores.market, 1)
  assert.equal(averageChangelogRatings(['2026-W23', '2026-W22']).scores.market, null)
  assert.equal(averageChangelogRatings(['2099-W01']), null)
})

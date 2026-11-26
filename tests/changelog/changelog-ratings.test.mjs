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

test('scores cover all six dimensions within 1 to 10 and carry a note', () => {
  const ids = CHANGELOG_RATING_DIMENSIONS.map(({ id }) => id)
  assert.equal(ids.length, 6)
  for (const [week, rating] of Object.entries(CHANGELOG_RATINGS)) {
    assert.deepEqual(Object.keys(rating.scores), ids, week)
    for (const value of Object.values(rating.scores)) {
      assert.ok(Number.isInteger(value) && value >= 1 && value <= 10, `${week} score ${value}`)
    }
    assert.ok(rating.note.length >= 6, week)
    assert.doesNotMatch(rating.note, /不是.{1,20}而是/, week)
  }
})

test('period average ignores unrated weeks and dedupes', () => {
  const average = averageChangelogRatings(['2026-W48', '2026-W48', '2026-W47', '2099-W01'])
  assert.equal(average.weeks, 2)
  assert.equal(average.scores.market, 7)
  assert.equal(averageChangelogRatings(['2099-W01']), null)
})

import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

import {
  getOpenClawAchievements,
  OPENCLAW_ACHIEVEMENT_CATEGORIES,
  OPENCLAW_ACHIEVEMENT_COUNT,
  OPENCLAW_ACHIEVEMENTS,
} from '../../lib/site/openClawAchievements.js'

test('merged OpenClaw PRs have a category and a local screenshot', () => {
  const categories = new Set(OPENCLAW_ACHIEVEMENT_CATEGORIES.map(({ id }) => id))

  assert.equal(OPENCLAW_ACHIEVEMENT_COUNT, 10)
  assert.equal(new Set(OPENCLAW_ACHIEVEMENTS.map(({ number }) => number)).size, 10)
  assert.ok(OPENCLAW_ACHIEVEMENTS.every(({ category, image }) => categories.has(category) && existsSync(`public${image}`)))
  assert.equal(OPENCLAW_ACHIEVEMENTS.find(({ number }) => number === '169537')?.issue.number, '169492')
})

test('category filtering and merge order produce the expected visible PRs', () => {
  assert.deepEqual(getOpenClawAchievements(OPENCLAW_ACHIEVEMENTS).slice(0, 2).map(({ number }) => number), ['169537', '170527'])
  assert.deepEqual(getOpenClawAchievements(OPENCLAW_ACHIEVEMENTS, 'models', 'oldest').map(({ number }) => number), ['102537', '170527', '169537'])
  assert.equal(getOpenClawAchievements(OPENCLAW_ACHIEVEMENTS, 'channels').length, 2)
  assert.equal(getOpenClawAchievements(OPENCLAW_ACHIEVEMENTS, 'interfaces').length, 2)
  assert.equal(getOpenClawAchievements(OPENCLAW_ACHIEVEMENTS, 'gateway').length, 3)
})

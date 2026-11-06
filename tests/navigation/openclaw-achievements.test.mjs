import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

import {
  getOpenClawContributionLabel,
  getOpenClawAchievements,
  OPENCLAW_ACHIEVEMENT_CATEGORIES,
  OPENCLAW_ACHIEVEMENT_COUNT,
  OPENCLAW_ACHIEVEMENTS,
} from '../../lib/site/openClawAchievements.js'

test('merged OpenClaw PRs have a category and a local screenshot', () => {
  const categories = new Set(OPENCLAW_ACHIEVEMENT_CATEGORIES.map(({ id }) => id))

  assert.equal(OPENCLAW_ACHIEVEMENT_COUNT, 12)
  assert.equal(new Set(OPENCLAW_ACHIEVEMENTS.map(({ number }) => number)).size, 12)
  assert.ok(OPENCLAW_ACHIEVEMENTS.every(({ category, image }) => categories.has(category) && existsSync(`public${image}`)))
  assert.equal(OPENCLAW_ACHIEVEMENTS.find(({ number }) => number === '179000')?.issue.number, '178997')
  assert.equal(OPENCLAW_ACHIEVEMENTS.find(({ number }) => number === '167581')?.issue.number, '167365')
  assert.equal(OPENCLAW_ACHIEVEMENTS.find(({ number }) => number === '169537')?.issue.number, '169492')
})

test('contribution labels distinguish reports from submitted fixes', () => {
  const reportedAndFixed = OPENCLAW_ACHIEVEMENTS
    .filter((item) => getOpenClawContributionLabel(item) === '我提出我修复')
    .map((item) => item.number)
    .sort()
  assert.deepEqual(reportedAndFixed, ['164357', '179000'])
  assert.equal(OPENCLAW_ACHIEVEMENTS.filter((item) => getOpenClawContributionLabel(item) === '我修复').length, 10)
  assert.equal(OPENCLAW_ACHIEVEMENTS.some((item) => item.number === '181298'), false)
})

test('category filtering and merge order produce the expected visible PRs', () => {
  assert.deepEqual(getOpenClawAchievements(OPENCLAW_ACHIEVEMENTS).slice(0, 2).map(({ number }) => number), ['179000', '167581'])
  assert.deepEqual(getOpenClawAchievements(OPENCLAW_ACHIEVEMENTS, 'models', 'oldest').map(({ number }) => number), ['102537', '170527', '169537'])
  assert.equal(getOpenClawAchievements(OPENCLAW_ACHIEVEMENTS, 'channels').length, 2)
  assert.equal(getOpenClawAchievements(OPENCLAW_ACHIEVEMENTS, 'interfaces').length, 3)
  assert.equal(getOpenClawAchievements(OPENCLAW_ACHIEVEMENTS, 'gateway').length, 4)
})

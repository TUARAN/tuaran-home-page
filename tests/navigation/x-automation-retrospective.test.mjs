import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { ENGINEERING_WORKS } from '../../lib/engineeringWorks.js'
import { STATIC_PAGE_REGISTRY } from '../../lib/staticPageRegistry.mjs'
import {
  X_AUTOMATION_DAILY_POSTS,
  X_AUTOMATION_PHASES,
  X_AUTOMATION_SCALE_MILESTONES,
  X_AUTOMATION_SCHEDULE_SNAPSHOTS,
  X_AUTOMATION_SUMMARY,
  buildScheduleSlot,
  maxDailyPosts,
  sumDailyPosts,
} from '../../lib/xAutomationRetrospective.js'

test('x automation retrospective page is registered and noindexed', async () => {
  const entry = STATIC_PAGE_REGISTRY.find((item) => item.path === '/x-automation-retrospective')
  assert.ok(entry)
  assert.equal(entry.indexable, false)
  assert.equal(entry.sitemap, false)

  const work = ENGINEERING_WORKS.find((item) => item.id === 'x-automation-retrospective')
  assert.ok(work)
  assert.equal(work.href, '/x-automation-retrospective')

  const pageSource = await readFile(new URL('../../app/(site)/x-automation-retrospective/page.jsx', import.meta.url), 'utf8')
  const clientSource = await readFile(new URL('../../app/(site)/x-automation-retrospective/XAutomationRetrospectiveClient.jsx', import.meta.url), 'utf8')
  assert.match(pageSource, /x-automation-retrospective/)
  assert.match(clientSource, /X_AUTOMATION_VIEWS/)
})

test('x automation retrospective data covers full run window', () => {
  assert.equal(X_AUTOMATION_PHASES.at(-1).id, 'paused')
  assert.equal(X_AUTOMATION_PHASES[0].date, X_AUTOMATION_SUMMARY.startDate)
  assert.ok(X_AUTOMATION_DAILY_POSTS.length >= 20)
  assert.equal(maxDailyPosts(), 14)
  assert.equal(sumDailyPosts(), X_AUTOMATION_SUMMARY.trackedPosts)
  assert.equal(X_AUTOMATION_SCALE_MILESTONES.length, 5)
})

test('schedule snapshots reuse live slot times', () => {
  assert.equal(buildScheduleSlot('culture_morning').time, '10:00')
  assert.equal(buildScheduleSlot('us_morning').time, '23:00')
  assert.equal(buildScheduleSlot('us_midday').time, '03:00')
  assert.equal(buildScheduleSlot('us_evening').time, '07:00')

  const focusTen = X_AUTOMATION_SCHEDULE_SNAPSHOTS.find((item) => item.phaseId === 'focus-ten')
  assert.equal(focusTen.slots.length, 10)
  assert.deepEqual(
    focusTen.slots.map((slot) => slot.id),
    [
      'morning',
      'culture_morning',
      'culture_evening',
      'community_friends',
      'community_learning',
      'crypto_knowledge',
      'crypto_market',
      'us_morning',
      'us_midday',
      'us_evening',
    ],
  )
})

import assert from 'node:assert/strict'
import test from 'node:test'

import { gitDailyTopDays } from '../../lib/interaction/dailyTop/gitCatalog.js'
import { loadCombinedDailyTopDays } from '../../lib/interaction/dailyTop/store.js'
import { aggregateInteractionCounts, sortRoundtablePeople } from '../../lib/interaction/roundtable/rank.js'
import { handleRoundtableGet } from '../../lib/interaction/roundtable/http.js'
import { ROUNDTABLE_LEGACY_OBJECT_KEY } from '../../lib/interaction/roundtable/store.js'

function memoryMedia(objects = {}) {
  const store = new Map(Object.entries(objects))
  return {
    async get(key) {
      const text = store.get(key)
      return text == null ? null : { text: async () => text }
    },
  }
}

const snapshot = {
  owner: 'tarsixseveneig1',
  count: 3,
  people: [
    { handle: 'quietUser', name: '安静' },
    { handle: 'loudUser', name: '热闹' },
    { handle: 'midUser', name: '居中' },
  ],
}

test('aggregates daily top counts and sorts roundtable people by interaction total', async () => {
  const days = await loadCombinedDailyTopDays(null)
  const sampleDay = gitDailyTopDays().find((day) => day.subject === 'tarsixseveneig1')
  const top = sampleDay.top.slice(0, 3).map((row, index) => ({
    ...row,
    handle: ['loudUser', 'midUser', 'quietUser'][index],
    count: [90, 40, 5][index],
  }))
  const patched = [{ ...sampleDay, top }, ...days.filter((day) => day.date !== sampleDay.date)]
  const totals = aggregateInteractionCounts(patched, 'tarsixseveneig1')
  const sorted = sortRoundtablePeople(snapshot.people, totals)
  assert.deepEqual(sorted.map((person) => person.handle), ['loudUser', 'midUser', 'quietUser'])
  assert.deepEqual(sorted.map((person) => person.interactionCount), [90, 40, 5])
})

test('GET roundtable respects account query, legacy key, and invalid accounts', async () => {
  const media = memoryMedia({
    [ROUNDTABLE_LEGACY_OBJECT_KEY]: JSON.stringify(snapshot),
  })
  const days = await loadCombinedDailyTopDays(null)
  const request = new Request('https://x.2aran.com/api/interaction/roundtable?account=tarsixseveneig1')
  const ok = await handleRoundtableGet(request, { media, contentFeed: null })
  assert.equal(ok.status, 200)
  const body = await ok.json()
  assert.equal(body.subject, 'tarsixseveneig1')
  assert.equal(body.people.length, 3)
  assert.equal(body.sort, 'interaction_total_from_daily_top')

  const missing = await handleRoundtableGet(
    new Request('https://x.2aran.com/api/interaction/roundtable?account=TuaranX'),
    { media, contentFeed: null },
  )
  assert.equal(missing.status, 404)
  const missingBody = await missing.json()
  assert.match(missingBody.message, /矿长阿富/)

  const bad = await handleRoundtableGet(
    new Request('https://x.2aran.com/api/interaction/roundtable?account=not-in-pool'),
    { media, contentFeed: null },
  )
  assert.equal(bad.status, 400)

  const topFromGit = gitDailyTopDays()[0]
  if (topFromGit?.top?.length) {
    const withOverlap = {
      ...snapshot,
      people: [
        { handle: topFromGit.top[0].handle, name: topFromGit.top[0].displayName },
        ...snapshot.people,
      ],
    }
    const overlapMedia = memoryMedia({
      [ROUNDTABLE_LEGACY_OBJECT_KEY]: JSON.stringify(withOverlap),
    })
    const ranked = await handleRoundtableGet(
      new Request('https://x.2aran.com/api/interaction/roundtable?account=tarsixseveneig1'),
      { media: overlapMedia, contentFeed: null },
    )
    const rankedBody = await ranked.json()
    assert.equal(rankedBody.people[0].handle, topFromGit.top[0].handle)
    assert.ok(rankedBody.people[0].interactionCount > 0)
  }

  assert.ok(days.length >= 0)
})
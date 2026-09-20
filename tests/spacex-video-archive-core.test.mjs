import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildArchiveDraft,
  chooseNearestLaunch,
  timelineEntryFromDraft,
  validateArchiveDraft,
} from '../scripts/spacex-video-archive-core.mjs'

const detail = {
  id: 'launch-id',
  url: 'https://ll.thespacedevs.com/2.3.0/launches/launch-id/',
  name: 'Falcon 9 Block 5 | Starlink Group 15-27',
  net: '2026-09-20T01:47:00Z',
  status: { name: 'Launch Successful' },
  pad: {
    name: 'Space Launch Complex 4E',
    location: { name: 'Vandenberg SFB, CA, USA', timezone_name: 'America/Los_Angeles' },
  },
  rocket: {
    configuration: { name: 'Falcon 9' },
    launcher_stage: [{
      launcher_flight_number: 17,
      launcher: { serial_number: 'B1093' },
      landing: { attempt: true, success: true, landing_location: { name: 'Of Course I Still Love You' } },
    }],
  },
  mission: {
    name: 'Starlink Group 15-27',
    type: 'Communications',
    description: 'A batch of 27 satellites for the Starlink mega-constellation.',
    orbit: { name: 'Low Earth Orbit' },
  },
  info_urls: [{ title: 'SpaceX mission page', url: 'https://www.spacex.com/launches/starlink' }],
}

test('matches a downloaded clip to the nearest launch by embedded creation time', () => {
  const match = chooseNearestLaunch([
    { id: 'old', net: '2026-09-19T00:00:00Z' },
    detail,
  ], '2026-09-20T01:52:00Z')
  assert.equal(match.launch.id, 'launch-id')
  assert.equal(match.deltaMs, 5 * 60 * 1000)
})

test('builds a source-backed archive draft from detailed LL2 data', () => {
  const draft = buildArchiveDraft(detail, {
    creationTime: '2026-09-20T01:52:00Z',
    postUrl: 'https://x.com/SpaceX/status/2101489521615385011',
    videoDescription: '整流罩分离后的在轨画面',
  })
  assert.equal(draft.rocket.booster, 'B1093')
  assert.equal(draft.rocket.flightNumber, 17)
  assert.equal(draft.payload.count, 27)
  assert.equal(draft.outcome.boosterLanding, 'success')
  assert.equal(draft.launchedAtLocal.timezone, 'America/Los_Angeles')
  assert.equal(draft.launchedAtLocal.utcOffset, '-07:00')
  assert.match(draft.timelineDraft.summaryZh, /B1093.*第 17 次飞行/)
  assert.deepEqual(validateArchiveDraft(draft), [])

  const entry = timelineEntryFromDraft(draft, '/videos/test.mp4')
  assert.equal(entry.video.postUrl, draft.video.postUrl)
  assert.equal(entry.publishedAt, detail.net)
})

test('blocks unverified or non-official video records', () => {
  const draft = buildArchiveDraft(detail, { creationTime: '2026-09-20T01:52:00Z' })
  assert.ok(validateArchiveDraft(draft).some((error) => error.includes('SpaceX 官方 X')))
  assert.ok(validateArchiveDraft(draft).some((error) => error.includes('待核验')))
})

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  FRONTEND_WEEKLY_KEYS,
  dailyObjectKey,
  mergeDailyManifest,
  readR2Json,
  sanitizeDailyPayload,
  sanitizeLivePayload,
  writeR2Json,
} from '../../lib/frontendWeeklyData.js'
import { validateGitHubActionsClaims } from '../../lib/githubActionsOidc.js'

class FakeBucket {
  constructor() {
    this.objects = new Map()
  }

  async get(key) {
    const value = this.objects.get(key)
    return value == null ? null : { text: async () => value.body }
  }

  async put(key, body, options) {
    this.objects.set(key, { body, options })
  }
}

test('live payload drops invalid rows and unsafe URLs', () => {
  const live = sanitizeLivePayload({
    updatedAt: '2026-07-31T01:00:00.000Z',
    items: [
      { title: 'Valid', href: 'https://example.com/post', topic: 'Agent' },
      { title: 'Unsafe', href: 'javascript:alert(1)' },
      { title: '', href: 'https://example.com/empty' },
    ],
  })
  assert.equal(live.items.length, 1)
  assert.equal(live.items[0].title, 'Valid')
})
test('daily manifest replaces the same date and keeps descending order', () => {
  const daily = sanitizeDailyPayload({
    date: '2026-07-31',
    displayDate: 'Jul 31',
    items: [{ title: 'Today', href: 'https://example.com/today' }],
  })
  const manifest = mergeDailyManifest({
    latest: '2026-07-30',
    list: [
      { date: '2026-07-30', count: 2 },
      { date: '2026-07-31', count: 9 },
    ],
  }, daily)
  assert.equal(manifest.latest, '2026-07-31')
  assert.deepEqual(manifest.list.map((item) => item.date), ['2026-07-31', '2026-07-30'])
  assert.equal(manifest.list[0].count, 1)
})

test('R2 JSON helpers preserve content type and cache policy', async () => {
  const bucket = new FakeBucket()
  const live = { updatedAt: null, items: [] }
  await writeR2Json(bucket, FRONTEND_WEEKLY_KEYS.live, live, 'public, max-age=300')
  assert.deepEqual(await readR2Json(bucket, FRONTEND_WEEKLY_KEYS.live), live)
  assert.equal(
    bucket.objects.get(FRONTEND_WEEKLY_KEYS.live).options.httpMetadata.contentType,
    'application/json; charset=utf-8',
  )
  assert.equal(dailyObjectKey('2026-07-31'), 'frontend-weekly/daily/2026-07-31.json')
  assert.throws(() => dailyObjectKey('../secret'))
})

test('GitHub Actions claims are restricted to the production workflow repository and branch', () => {
  const now = Math.floor(Date.now() / 1000)
  const options = {
    audience: 'https://2aran.com/api/frontend-weekly/ingest',
    repository: 'TUARAN/frontend-weekly-digest-cn',
    ref: 'refs/heads/main',
  }
  const claims = {
    iss: 'https://token.actions.githubusercontent.com',
    aud: options.audience,
    exp: now + 300,
    nbf: now - 10,
    repository: options.repository,
    ref: options.ref,
    workflow_ref: `${options.repository}/.github/workflows/ai-hot-feed.yml@${options.ref}`,
  }
  assert.equal(validateGitHubActionsClaims(claims, options), claims)
  assert.throws(() => validateGitHubActionsClaims({ ...claims, repository: 'attacker/repo' }, options))
  assert.throws(() => validateGitHubActionsClaims({ ...claims, ref: 'refs/heads/feature' }, options))
  assert.throws(() => validateGitHubActionsClaims({ ...claims, exp: now - 120 }, options))
})

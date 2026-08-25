import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { RANK_ITEMS, RANK_TIERS } from '../lib/rankData.js'

test('rank site exposes a complete five-tier AI list', () => {
  assert.deepEqual(RANK_TIERS.map((tier) => tier.label), ['夯', '顶级', '人上人', 'NPC', '拉完了'])
  assert.ok(RANK_ITEMS.length >= 12)
  assert.ok(RANK_ITEMS.every((item) => RANK_TIERS.some((tier) => tier.id === item.tier)))
  assert.equal(new Set(RANK_ITEMS.map((item) => item.id)).size, RANK_ITEMS.length)
})

test('rank subdomain rewrites its root to the isolated rank route', async () => {
  const middleware = await readFile(new URL('../middleware.js', import.meta.url), 'utf8')
  assert.match(middleware, /RANK_HOST = 'rank\.2aran\.com'/)
  assert.match(middleware, /host === RANK_HOST && pathname === '\/'/)
  assert.match(middleware, /url\.pathname = '\/rank'/)
  assert.match(middleware, /NextResponse\.rewrite\(url\)/)
})

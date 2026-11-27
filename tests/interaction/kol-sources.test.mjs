import assert from 'node:assert/strict'
import test from 'node:test'

import { builtinPoolsForMarket, KOL_LEADERBOARD_BOARDS, leaderboardBoardsForMarket } from '../../lib/interaction/kolSources.js'

test('english kol boards do not use xbangdan', () => {
  const boards = leaderboardBoardsForMarket('en')
  assert.equal(boards.length, 0)
  assert.deepEqual(KOL_LEADERBOARD_BOARDS.zh[0].url, 'https://xbangdan.com/accounts/')
})

test('english builtin pool is disjoint from chinese pool', () => {
  const zh = new Set(builtinPoolsForMarket('zh').flat().map((h) => h.toLowerCase()))
  const en = builtinPoolsForMarket('en').flat().map((h) => h.toLowerCase())
  assert.equal(en.length, 10)
  for (const handle of en) {
    assert.ok(!zh.has(handle), handle)
    assert.match(handle, /^[a-z0-9_]+$/i)
  }
})
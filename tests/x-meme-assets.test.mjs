import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { X_MEME_ASSETS, X_MEME_GROUPS, X_MEME_SLOT_THEMES, pickXMemeAsset } from '../lib/xMemeAssets.js'

test('five styles contain exactly three unique, uploadable PNG templates each', async () => {
  assert.equal(X_MEME_GROUPS.length, 5)
  assert.equal(X_MEME_ASSETS.length, 15)
  assert.equal(new Set(X_MEME_ASSETS.map((asset) => asset.path)).size, 15)
  assert.equal(new Set(X_MEME_ASSETS.map((asset) => asset.id)).size, 15)
  for (const group of X_MEME_GROUPS) {
    assert.deepEqual(group.assets.map((asset) => asset.theme), ['morning', 'noon', 'friends'])
    for (const asset of group.assets) {
      const bytes = await readFile(new URL(`../public${asset.path}`, import.meta.url))
      assert.equal(bytes.subarray(0, 8).join(','), '137,80,78,71,13,10,26,10')
      assert.ok(bytes.length <= 5 * 1024 * 1024)
    }
  }
})

test('five-day rotation covers all 15 templates while matching every slot and keeping retries stable', () => {
  const used = new Set()
  const perSlot = new Map()
  for (let day = 9; day < 14; day++) {
    const date = `2026-09-${String(day).padStart(2, '0')}`
    const dailyGroups = new Set()
    for (const [slot, theme] of Object.entries(X_MEME_SLOT_THEMES)) {
      const asset = pickXMemeAsset({ slot, date })
      assert.equal(asset.theme, theme)
      assert.deepEqual(pickXMemeAsset({ slot, date }), asset)
      used.add(asset.id)
      dailyGroups.add(asset.groupId)
      if (!perSlot.has(slot)) perSlot.set(slot, new Set())
      perSlot.get(slot).add(asset.groupId)
    }
    assert.equal(dailyGroups.size, 5)
  }
  assert.equal(used.size, 15)
  for (const groups of perSlot.values()) assert.equal(groups.size, 5)
  assert.equal(pickXMemeAsset({ slot: 'crypto_market', date: '2026-09-09' }), null)
  for (const date of ['', 'bad', '2026-02-30']) {
    assert.throws(() => pickXMemeAsset({ slot: 'morning', date }), /X_MEME_INVALID_DATE/)
  }
})

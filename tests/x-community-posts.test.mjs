import assert from 'node:assert/strict'
import { access, stat } from 'node:fs/promises'
import test from 'node:test'

import {
  X_COMMUNITY_SLOTS,
  buildXCommunityMessages,
  normalizeXCommunitySlot,
  normalizeXCommunityText,
  xCommunityLastRunKey,
} from '../lib/xCommunityPosts.js'

test('three community image slots cover friends, learning, and growth', async () => {
  assert.deepEqual(Object.keys(X_COMMUNITY_SLOTS), [
    'community_friends',
    'community_learning',
    'community_growth',
  ])
  assert.deepEqual(Object.values(X_COMMUNITY_SLOTS).map((item) => item.time), ['09:00', '15:00', '19:00'])
  assert.equal(normalizeXCommunitySlot('community_learning'), 'community_learning')
  assert.equal(normalizeXCommunitySlot('unknown'), '')
  assert.notEqual(xCommunityLastRunKey('community_friends'), xCommunityLastRunKey('community_growth'))

  for (const item of Object.values(X_COMMUNITY_SLOTS)) {
    const asset = new URL(`../public${item.imagePath}`, import.meta.url)
    await access(asset)
    assert.ok((await stat(asset)).size > 50_000)
  }
})

test('community copy keeps only the two configured tags and remains X-safe', () => {
  const text = normalizeXCommunityText(
    `${'欢迎分享你最近在学习和实践的一件小事，我们可以交换经验，认识彼此。'.repeat(10)}#互相学习 #随便写的标签`,
    'community_learning',
  )
  assert.match(text, /#互相学习 #共同进步$/)
  assert.doesNotMatch(text, /#随便写的标签/)
  assert.equal(text.match(/#互相学习/g)?.length, 1)
  assert.ok([...text].reduce((weight, character) => weight + (character.codePointAt(0) <= 0x7f ? 1 : 2), 0) <= 280)
})

test('community copy prompt requires a concrete invitation and exact theme tags', () => {
  for (const item of Object.values(X_COMMUNITY_SLOTS)) {
    const messages = buildXCommunityMessages({
      slot: item.id,
      now: new Date('2026-08-26T01:00:00.000Z'),
    })
    assert.equal(messages.length, 2)
    assert.match(messages[0].content, /互相关注/)
    assert.match(messages[0].content, /不要只写“互关”“求关注”/)
    assert.match(messages[0].content, new RegExp(item.tags.join(' ')))
    assert.match(messages[1].content, new RegExp(item.label))
  }
})

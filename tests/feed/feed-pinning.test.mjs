import assert from 'node:assert/strict'
import { access, stat } from 'node:fs/promises'
import test from 'node:test'

import {
  getAllFeedItems,
  getFeedItemsWithPinned,
} from '../../app/(site)/feed/data.js'

test('homepage feed selection puts configured inspirations first without duplicates', () => {
  const pinnedId = 'gemma-4-agent-vllm-challenge'
  const items = getFeedItemsWithPinned([pinnedId, pinnedId, 'missing-item'], 10)

  assert.equal(items.length, 10)
  assert.equal(items[0].id, pinnedId)
  assert.equal(items.filter((item) => item.id === pinnedId).length, 1)
})

test('pinning does not change the chronological all-feed order', () => {
  assert.notEqual(getAllFeedItems()[0].id, 'gemma-4-agent-vllm-challenge')
})

test('image inspirations keep a local screenshot and an outbound source', async () => {
  const images = getAllFeedItems().filter((item) => item.type === 'image')
  assert.ok(images.length >= 1)

  for (const item of images) {
    assert.match(item.src, /^\/feed\//)
    const asset = new URL(`../../public${item.src}`, import.meta.url)
    await access(asset)
    assert.ok((await stat(asset)).size > 10_000)
  }

  const stonkfly = images.find((item) => item.id === 'stonkfly-fruit-fly-crypto')
  assert.equal(stonkfly.source.href, 'https://stonkfly-three.vercel.app/')
  assert.match(stonkfly.summary, /16\.67 万个神经元/)
})

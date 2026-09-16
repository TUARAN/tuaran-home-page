import assert from 'node:assert/strict'
import { access, readFile, stat } from 'node:fs/promises'
import test from 'node:test'

import {
  FEED_CATEGORY_KEYS,
  FEED_ITEMS,
  filterFeedItemsByCategory,
  getAllFeedItems,
  getFeedItemsWithPinned,
} from '../../app/(site)/feed/data.js'
import { HOME_RECOMMENDATION_MAX_BATCH_SIZE } from '../../lib/homeRecommendationEngine.js'

test('homepage feed selection puts configured inspirations first without duplicates', () => {
  const pinnedId = 'gemma-4-agent-vllm-challenge'
  const items = getFeedItemsWithPinned([pinnedId, pinnedId, 'missing-item'], 10)

  assert.equal(items.length, 10)
  assert.equal(items[0].id, pinnedId)
  assert.equal(items.filter((item) => item.id === pinnedId).length, 1)
})

test('homepage asks for enough inspirations to fill the article column', async () => {
  const page = await readFile(new URL('../../app/(site)/page.jsx', import.meta.url), 'utf8')
  assert.match(page, /HOME_RECOMMENDATION_MAX_BATCH_SIZE/)
  assert.doesNotMatch(page, /getFeedItemsWithPinned\([^)]+,\s*10\)/)
  assert.ok(HOME_RECOMMENDATION_MAX_BATCH_SIZE >= getAllFeedItems().length)
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

test('every inspiration is classified as AI or Web3', () => {
  assert.ok(FEED_ITEMS.length > 0)
  for (const item of FEED_ITEMS) {
    assert.ok(FEED_CATEGORY_KEYS.includes(item.category), `${item.id} missing AI/Web3 category`)
  }
})

test('inspiration category filter keeps Web3 items out of the AI tab', () => {
  const aiItems = filterFeedItemsByCategory(getAllFeedItems(), 'ai')
  const web3Items = filterFeedItemsByCategory(getAllFeedItems(), 'web3')

  assert.ok(aiItems.length >= 1)
  assert.ok(web3Items.length >= 1)
  assert.equal(aiItems.length + web3Items.length, getAllFeedItems().length)
  assert.ok(aiItems.every((item) => item.category === 'ai'))
  assert.ok(web3Items.every((item) => item.category === 'web3'))
  assert.ok(web3Items.some((item) => item.id === 'stonkfly-fruit-fly-crypto'))
  assert.ok(aiItems.some((item) => item.id === 'gemma-4-agent-vllm-challenge'))
})

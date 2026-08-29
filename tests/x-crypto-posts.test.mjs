import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  X_CRYPTO_POST_SLOTS,
  buildXCryptoMessages,
  normalizeXCryptoSlot,
  pickXCryptoTopic,
  xCryptoLastRunKey,
} from '../lib/xCryptoPosts.js'

test('three crypto slots fill separate gaps in the Beijing timeline', () => {
  assert.deepEqual(Object.keys(X_CRYPTO_POST_SLOTS), ['crypto_knowledge', 'crypto_market', 'crypto_people'])
  assert.deepEqual(Object.values(X_CRYPTO_POST_SLOTS).map((item) => item.time), ['11:00', '17:00', '21:00'])
  assert.equal(normalizeXCryptoSlot('crypto_market'), 'crypto_market')
  assert.equal(normalizeXCryptoSlot('unknown'), '')
  assert.notEqual(xCryptoLastRunKey('crypto_knowledge'), xCryptoLastRunKey('crypto_people'))
})

test('crypto topics rotate and prompts enforce grounded investment boundaries', () => {
  const topics = Array.from({ length: 6 }, (_, index) => {
    const now = new Date('2026-08-27T03:00:00Z')
    now.setUTCDate(now.getUTCDate() + index)
    return pickXCryptoTopic({ slot: 'crypto_knowledge', now })
  })
  assert.equal(new Set(topics).size, 6)

  for (const slot of Object.keys(X_CRYPTO_POST_SLOTS)) {
    const messages = buildXCryptoMessages({ slot, now: new Date('2026-08-27T03:00:00Z') })
    assert.equal(messages.length, 2)
    assert.match(messages[0].content, /不要编造实时价格/)
    assert.match(messages[0].content, /不给具体买卖指令/)
    assert.match(messages[0].content, /仅供信息交流，不构成投资建议/)
    assert.match(messages[1].content, new RegExp(X_CRYPTO_POST_SLOTS[slot].time))
  }
})

test('workflow and distribution route support all three crypto tasks', async () => {
  const [workflow, route] = await Promise.all([
    readFile(new URL('../.github/workflows/morning-greeting.yml', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/distribution/x/greeting/route.js', import.meta.url), 'utf8'),
  ])
  assert.match(workflow, /node scripts\/run-x-auto-posts.mjs/)
  assert.match(route, /buildXCryptoMessages/)
  assert.match(route, /contentType = .*'crypto-insight'/)
})

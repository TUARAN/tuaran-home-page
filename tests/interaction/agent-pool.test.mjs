import assert from 'node:assert/strict'
import test from 'node:test'

import { createRequire } from 'node:module'

import {
  INTERACTION_MARKET_ZH,
  X_INTERACTION_AGENT_POOL,
  findInteractionAgent,
  interactionAgentCatalog,
  interactionAgentHandles,
} from '../../lib/interaction/agentPool.js'

const require = createRequire(import.meta.url)
const extensionPool = require('../../tools/x-reply-clipboard-extension/interactionAgentPool.js')

test('shared agent pool lists all handles and scales by editing one file', () => {
  assert.equal(X_INTERACTION_AGENT_POOL.length, 5)
  assert.deepEqual(interactionAgentHandles('zh'), [
    'tarsixseveneig1',
    'TuaranX',
    'tuaran003',
    'DrBenjamin81269',
    'DrBenjamin5102',
  ])
  assert.deepEqual(interactionAgentHandles('en'), ['mHCncHeboklldif'])
  assert.equal(interactionAgentHandles().length, 6)
  assert.equal(findInteractionAgent('@TuaranX')?.name, '矿长阿富')
  assert.equal(findInteractionAgent('tuaran003')?.name, '矿工小十三')
  assert.equal(findInteractionAgent('drbenjamin81269')?.name, '矿工阿柒')
  assert.equal(findInteractionAgent('DrBenjamin5102')?.name, '灯下掘行者')
  for (const agent of X_INTERACTION_AGENT_POOL) assert.equal(agent.market, INTERACTION_MARKET_ZH)
  assert.equal(findInteractionAgent('mHCncHeboklldif')?.market, 'en')
  assert.equal(findInteractionAgent('mHCncHeboklldif')?.name, 'Lantern Vale')
})

test('extension agent pool file stays in sync with agentPool.js', () => {
  assert.deepEqual(
    extensionPool.CATALOG.map((entry) => `${entry.handle.toLowerCase()}:${entry.market}`).sort(),
    interactionAgentCatalog().map((entry) => `${entry.handle.toLowerCase()}:${entry.market}`).sort(),
  )
})
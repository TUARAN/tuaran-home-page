import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'

import {
  INTERACTION_MARKET_EN,
  INTERACTION_MARKET_ZH,
  findInteractionAgent,
  interactionAgentCatalog,
  interactionMarketForHandle,
  X_INTERACTION_AGENT_POOL,
} from '../../lib/interaction/agentPool.js'
import {
  profileMatchesChineseMarket,
  profileMatchesEnglishMarket,
  textMatchesEnglishMarket,
} from '../../lib/interaction/marketProfile.js'

const require = createRequire(import.meta.url)
const extensionPool = require('../../tools/x-reply-clipboard-extension/interactionAgentPool.js')
const extensionProfile = require('../../tools/x-reply-clipboard-extension/marketProfile.js')

test('existing shared agents are tagged for the Chinese market', () => {
  assert.equal(X_INTERACTION_AGENT_POOL.length, 5)
  for (const agent of X_INTERACTION_AGENT_POOL) {
    assert.equal(agent.market, INTERACTION_MARKET_ZH)
  }
  assert.equal(interactionMarketForHandle('TuaranX'), INTERACTION_MARKET_ZH)
  assert.equal(interactionMarketForHandle('random'), null)
})

test('english market gates profiles and post text', () => {
  assert.equal(profileMatchesChineseMarket('矿工', ''), true)
  assert.equal(profileMatchesEnglishMarket('Alice', 'Builder in SF'), true)
  assert.equal(profileMatchesEnglishMarket('Alice', '也在中文'), false)
  assert.equal(textMatchesEnglishMarket('Ship fast and learn in public.'), true)
  assert.equal(textMatchesEnglishMarket('今晚见'), false)
})

test('generated extension pool mirrors site catalog', () => {
  assert.equal(extensionPool.CATALOG.length, 6)
  for (const agent of interactionAgentCatalog()) {
    const copy = extensionPool.findAgent(agent.handle)
    assert.equal(copy?.market, agent.market)
  }
  assert.equal(interactionMarketForHandle('mHCncHeboklldif'), INTERACTION_MARKET_EN)
  assert.equal(extensionPool.isEnglishMarket('mHCncHeboklldif'), true)
  assert.equal(extensionPool.resolveMarket('TuaranX'), INTERACTION_MARKET_ZH)
  assert.equal(extensionPool.resolveMarket('not-enlisted'), INTERACTION_MARKET_ZH)
  assert.equal(extensionPool.marketForHandle('not-enlisted'), null)
  assert.equal(extensionProfile.profileMatchesEnglishMarket('Bob', 'Open source'), true)
})

test('findInteractionAgent returns market on catalog entries', () => {
  assert.equal(findInteractionAgent('tarsixseveneig1')?.market, INTERACTION_MARKET_ZH)
})
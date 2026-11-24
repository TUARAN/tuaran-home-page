import assert from 'node:assert/strict'
import test from 'node:test'

import {
  X_INTERACTION_AGENT_POOL,
  findInteractionAgent,
  interactionAgentHandles,
} from '../../lib/interaction/agentPool.js'

test('shared agent pool lists all handles and scales by editing one file', () => {
  assert.equal(X_INTERACTION_AGENT_POOL.length, 5)
  assert.deepEqual(interactionAgentHandles(), [
    'tarsixseveneig1',
    'TuaranX',
    'tuaran003',
    'DrBenjamin81269',
    'DrBenjamin5102',
  ])
  assert.equal(findInteractionAgent('@TuaranX')?.name, '矿长阿富')
  assert.equal(findInteractionAgent('tuaran003')?.name, '矿工小十三')
  assert.equal(findInteractionAgent('drbenjamin81269')?.name, '矿工阿柒')
  assert.equal(findInteractionAgent('DrBenjamin5102')?.name, '灯下掘行者')
})
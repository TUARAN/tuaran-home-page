import assert from 'node:assert/strict'
import test from 'node:test'

import {
  X_INTERACTION_AGENT_POOL,
  findInteractionAgent,
  interactionAgentHandles,
} from '../../lib/interaction/agentPool.js'

test('shared agent pool lists three handles and scales by editing one file', () => {
  assert.equal(X_INTERACTION_AGENT_POOL.length, 3)
  assert.deepEqual(interactionAgentHandles(), ['tarsixseveneig1', 'TuaranX', 'tuaran003'])
  assert.equal(findInteractionAgent('@TuaranX')?.name, '矿长阿富')
  assert.equal(findInteractionAgent('tuaran003')?.name, '矿工小十三')
})
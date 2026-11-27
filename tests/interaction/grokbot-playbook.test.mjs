import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  grokbotLayers,
  grokbotQualityChecks,
  grokbotRetainRules,
  grokbotUnfollowRules,
} from '../../lib/interaction/grokbotPlaybook.js'

test('grokbot playbook covers layers, rules, and quality checks', () => {
  assert.equal(grokbotLayers.length, 5)
  assert.ok(grokbotUnfollowRules.length >= 5)
  assert.ok(grokbotRetainRules.length >= 5)
  assert.ok(grokbotQualityChecks.length >= 6)
  const ufIds = new Set(grokbotUnfollowRules.map((row) => row.id))
  assert.equal(ufIds.size, grokbotUnfollowRules.length)
})

test('grokbot page renders strategy tables', async () => {
  const source = await readFile(
    new URL('../../app/(site)/resources/big-interaction-whitepaper/grokbot/page.jsx', import.meta.url),
    'utf8',
  )
  assert.match(source, /策略层级（L0–L4）/)
  assert.match(source, /取关规则（UF）/)
  assert.match(source, /质量管理（QC）/)
  assert.match(source, /grokbotPlaybook/)
})
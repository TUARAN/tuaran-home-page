import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  grokbotLayers,
  grokbotQualityChecks,
  grokbotRetainRules,
  grokbotUnfollowRules,
} from '../../lib/interaction/grokbotPlaybook.js'
import {
  buildGrokbotFollowingPrompt,
  GROKBOT_DEFAULT_SELECTION,
} from '../../lib/interaction/grokbotPromptBuilder.js'

test('grokbot playbook covers layers, rules, and quality checks', () => {
  assert.equal(grokbotLayers.length, 5)
  assert.ok(grokbotUnfollowRules.length >= 5)
  assert.ok(grokbotRetainRules.length >= 5)
  assert.ok(grokbotQualityChecks.length >= 6)
  const ufIds = new Set(grokbotUnfollowRules.map((row) => row.id))
  assert.equal(ufIds.size, grokbotUnfollowRules.length)
})

test('default prompt includes checked UF/RT and updates when selection shrinks', () => {
  const full = buildGrokbotFollowingPrompt({ selection: GROKBOT_DEFAULT_SELECTION })
  assert.match(full, /@grokbot/)
  assert.match(full, /UF-01/)
  assert.match(full, /RT-01/)
  assert.match(full, /确认前不要执行取关/)
  const minimal = buildGrokbotFollowingPrompt({
    selection: { uf: ['UF-03'], rt: ['RT-01'], gz: [], qc: [] },
  })
  assert.doesNotMatch(minimal, /UF-01/)
  assert.match(minimal, /UF-03/)
})

test('grokbot page mounts interactive playbook', async () => {
  const [page, client] = await Promise.all([
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/grokbot/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/grokbot/GrokbotPlaybook.jsx', import.meta.url), 'utf8'),
  ])
  assert.match(page, /GrokbotPlaybook/)
  assert.match(client, /复制提示词/)
  assert.match(client, /SelectableTable/)
  assert.match(client, /buildGrokbotFollowingPrompt/)
})
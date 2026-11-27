import assert from 'node:assert/strict'
import test from 'node:test'

import {
  agentMcpResourceKey,
  agentPromptResourceKey,
  agentSkillResourceKey,
  agentWorkbuddyResourceKey,
  isAgentResourceKey,
} from '../lib/agentCenters/accessKeys.mjs'

test('agent resource keys follow the agent:<kind>:<id> convention', () => {
  assert.equal(agentSkillResourceKey('ruanyifeng-weekly-style'), 'agent:skill:ruanyifeng-weekly-style')
  assert.equal(agentMcpResourceKey('tuaran-articles'), 'agent:mcp:tuaran-articles')
  assert.equal(agentPromptResourceKey('task-brief'), 'agent:prompt:task-brief')
  assert.equal(agentWorkbuddyResourceKey('renwei-writing'), 'agent:workbuddy:renwei-writing')
  assert.ok(isAgentResourceKey('agent:skill:foo'))
  assert.ok(!isAgentResourceKey('research:topics:foo'))
})

test('agent access UI wires resource keys into catalogs', async () => {
  const root = new URL('../', import.meta.url)
  const [gate, skillSection, mcp, prompt, workbuddy] = await Promise.all([
    import('node:fs/promises').then((fs) => fs.readFile(new URL('app/(site)/components/AgentAccessGate.jsx', root), 'utf8')),
    import('node:fs/promises').then((fs) => fs.readFile(new URL('app/(site)/skill-center/SkillCodexAccessSection.jsx', root), 'utf8')),
    import('node:fs/promises').then((fs) => fs.readFile(new URL('app/(site)/mcp-center/McpConfigActions.jsx', root), 'utf8')),
    import('node:fs/promises').then((fs) => fs.readFile(new URL('app/(site)/prompt-center/PromptCopyButton.jsx', root), 'utf8')),
    import('node:fs/promises').then((fs) => fs.readFile(new URL('app/(site)/workbuddy-publish-center/WorkBuddyCatalog.jsx', root), 'utf8')),
  ])
  assert.match(gate, /PayUnlockPanel/)
  assert.match(skillSection, /agentSkillResourceKey/)
  assert.match(mcp, /agentMcpResourceKey/)
  assert.match(prompt, /agentPromptResourceKey/)
  assert.match(workbuddy, /agentWorkbuddyResourceKey/)
})
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'

import { renderMarkdown } from '../../lib/research/markdown.js'
import { RESEARCH_ENTRY_META } from '../../lib/research/catalog.js'

// Next resolves extensionless research imports; give Node's test runner the same resolution.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.includes('/lib/research/') && /^\.\/[\w-]+$/.test(specifier)) {
      return nextResolve(`${specifier}.js`, context)
    }
    return nextResolve(specifier, context)
  },
})
const { getResearchEntry } = await import('../../lib/research/loader.js')
hooks.deregister()
const entry = getResearchEntry('topics', 'agent-memory-mechanisms')

test('memory research is one public version and stays out of the ad-review whitelist', () => {
  assert.ok(entry)
  assert.equal(entry.title, '编码与办公智能体的记忆机制')
  assert.equal(entry.slug, 'agent-memory-mechanisms')
  assert.deepEqual(entry.variants.map(({ id }) => id), ['cursor'])
  assert.equal(entry.showAssistance, false)
  assert.equal(entry.reviewReady, false)
  assert.equal(entry.adEligible, false)
  assert.equal(entry.assistance, 'cursor')
  const meta = RESEARCH_ENTRY_META['topics/agent-memory-mechanisms']
  assert.equal(meta.title, entry.title)
  assert.equal(meta.slug, 'agent-memory-mechanisms')
  assert.equal(meta.reviewReady, undefined)
})

test('public body keeps product evidence and drops the dual-version split', () => {
  assert.doesNotMatch(entry.content, /<!--\s*variant:/i)
  assert.doesNotMatch(entry.content, /WorkBuddy 版来自所提供的纯文本报告/)
  assert.match(entry.content, /https:\/\/code\.claude\.com\/docs\/en\/memory/)
  assert.match(entry.content, /## 持续验证/)
  const html = renderMarkdown(entry.content)
  assert.match(html, /<table>/)
  assert.match(html, /href="https:\/\/code\.claude\.com\/docs\/en\/memory"/)
})

test('public research excludes private machine state and conversation-specific projects', () => {
  assert.doesNotMatch(entry.content, /与你本机的关系|memories=false|\/Users\/tuaran|前端周刊 8 步|Agent 世界杯/)
})

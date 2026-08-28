import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'

import { extractToc, renderMarkdown } from '../../lib/research/markdown.js'
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

test('memory research loads two separately labelled versions with Codex first', () => {
  assert.ok(entry)
  assert.deepEqual(entry.variants.map(({ id, label }) => ({ id, label })), [
    { id: 'codex', label: 'Codex 协助' },
    { id: 'workbuddy', label: 'WorkBuddy 协助' },
  ])
  assert.ok(RESEARCH_ENTRY_META['topics/agent-memory-mechanisms'])
  assert.equal(entry.showAssistance, true)
  assert.equal(entry.reviewReady, false)
  assert.equal(entry.adEligible, false)
})

test('Codex keeps 31 unique sources, evaluation cases and structured examples', () => {
  const { content } = entry.variants[0]
  const urls = [...content.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((match) => match[1])
  assert.equal(new Set(urls).size, 31)
  assert.match(content, /### 12\.1 建议的最小测试集/)
  assert.match(content, /"sync_policy": "local_only"/)
  const html = renderMarkdown(content)
  assert.match(html, /<table>/)
  assert.match(html, /language-json/)
  assert.match(html, /href="https:\/\/code\.claude\.com\/docs\/en\/memory"/)
  assert.doesNotMatch(html, /WorkBuddy 版来自所提供的纯文本报告/)
})

test('WorkBuddy restores tables and code blocks, with its own TOC and evidence warning', () => {
  const { content } = entry.variants[1]
  const html = renderMarkdown(content)
  assert.match(content, /原始来源超链接缺失/)
  assert.match(content, /所列收益未附实验出处，待核验/)
  assert.match(content, /先执行组织权限与安全约束/)
  assert.ok((html.match(/<table>/g) || []).length >= 10)
  assert.match(html, /language-text/)
  assert.match(html, /&lt;repo-hash&gt;/)
  assert.ok(extractToc(content).some(({ text }) => text === '4. 横向对比总表'))
  assert.ok(!extractToc(content).some(({ text }) => text === '一、核心结论'))
})

test('public research excludes private machine state and conversation-specific projects', () => {
  assert.doesNotMatch(entry.content, /与你本机的关系|memories=false|\/Users\/tuaran|前端周刊 8 步|Agent 世界杯/)
})

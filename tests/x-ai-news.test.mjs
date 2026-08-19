import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  X_AI_NEWS_MAX_WEIGHT,
  buildXAiNewsMessages,
  normalizeGeneratedXAiNews,
  validateXAiNewsDraft,
} from '../lib/xAiNews.js'

test('AI 资讯提示词限制模型只能整理已核实素材', () => {
  const messages = buildXAiNewsMessages({ brief: '某模型发布了新版本。来源：https://example.com/news' })
  assert.equal(messages.length, 2)
  assert.match(messages[0].content, /不得补写素材中没有/)
  assert.match(messages[0].content, /不超过 280/)
  assert.match(messages[1].content, /https:\/\/example\.com\/news/)
})

test('清理模型包裹并验证 X 加权长度', () => {
  assert.equal(normalizeGeneratedXAiNews('```text\n最终帖子：AI 工具更新。\n```'), 'AI 工具更新。')
  assert.deepEqual(validateXAiNewsDraft('AI update'), { ok: true, text: 'AI update', weight: 9 })
  const tooLong = validateXAiNewsDraft('中'.repeat(X_AI_NEWS_MAX_WEIGHT / 2 + 1))
  assert.equal(tooLong.ok, false)
  assert.equal(tooLong.error, 'X_AI_NEWS_TOO_LONG')
  assert.equal(tooLong.weight, X_AI_NEWS_MAX_WEIGHT + 2)
})

test('后台任务将 NAS 生成与 X 发布拆成两次手动操作', async () => {
  const [routeSource, panelSource] = await Promise.all([
    readFile(new URL('../app/api/admin/x-ai-news/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../app/(admin)/admin/morning-greeting/XAiNewsPanel.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(routeSource, /action === 'generate'/)
  assert.match(routeSource, /callOllama\(/)
  assert.match(routeSource, /reasoningEffort: 'none'/)
  assert.match(routeSource, /action === 'publish'/)
  assert.match(routeSource, /publishXPost\(/)
  assert.match(panelSource, /window\.confirm\(/)
})

import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeResponsesUsage, parseResponsesOutput } from '../lib/deepseekResponsesCore.js'

test('parseResponsesOutput 抽取正文、引用与检索结果', () => {
  const raw = {
    status: 'completed',
    output: [
      {
        type: 'web_search_call',
        id: 'ws_1',
        search_results: [
          { title: '浦发银行 2025 年报', url: 'https://example.com/report' },
          { title: '浦发银行官网', url: 'https://example.com/official' },
        ],
      },
      {
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'output_text',
            text: '## 一、先给结论\n浦发银行…',
            annotations: [
              { type: 'url_citation', title: '浦发银行 2025 年报', url: 'https://example.com/report' },
            ],
          },
        ],
      },
      {
        type: 'reasoning',
        summary: [],
        content: [],
      },
    ],
  }
  const parsed = parseResponsesOutput(raw)
  assert.equal(parsed.webSearchCalls, 1)
  assert.equal(parsed.searchResults.length, 2)
  assert.equal(parsed.searchResults[0].url, 'https://example.com/report')
  assert.match(parsed.content, /先给结论/)
  assert.match(parsed.content, /浦发银行/)
  assert.equal(parsed.citations.length, 1)
  assert.equal(parsed.citations[0].title, '浦发银行 2025 年报')
})

test('parseResponsesOutput 兼容多段正文、多消息取最终回答与空响应', () => {
  const raw = {
    status: 'completed',
    output: [
      { type: 'message', content: [{ type: 'output_text', text: '我先检索一下。' }] },
      {
        type: 'message',
        content: [
          { type: 'output_text', text: '## 一、先给结论' },
          { type: 'output_text', text: '\n最终回答正文。', annotations: [] },
        ],
      },
    ],
  }
  assert.equal(parseResponsesOutput(raw).content, '## 一、先给结论\n\n最终回答正文。')
  assert.deepEqual(parseResponsesOutput({}).content, '')
  assert.deepEqual(parseResponsesOutput({}).citations, [])
  assert.equal(parseResponsesOutput({}).webSearchCalls, 0)
})

test('normalizeResponsesUsage 映射到台账字段', () => {
  const normalized = normalizeResponsesUsage({
    input_tokens: 1200,
    input_tokens_details: { cached_tokens: 300 },
    output_tokens: 800,
    output_tokens_details: { reasoning_tokens: 0 },
    total_tokens: 2000,
  })
  assert.equal(normalized.prompt_tokens, 1200)
  assert.equal(normalized.completion_tokens, 800)
  assert.equal(normalized.total_tokens, 2000)
  assert.equal(normalizeResponsesUsage(null), null)
})

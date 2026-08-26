import assert from 'node:assert/strict'
import test from 'node:test'

import {
  QUOTE_GENERATION_MODELS,
  buildAutomatedQuotePrompt,
  buildQuoteGenerationMessages,
  parseGeneratedQuotes,
} from '../lib/quoteGeneration.js'

test('quote prompt passes the requested direction to the model without a stock template pool', () => {
  const messages = buildQuoteGenerationMessages({
    prompt: '长期学习中的耐心',
  })
  const prompt = messages.map((message) => message.content).join('\n')
  assert.match(prompt, /作者固定为 TUARAN/)
  assert.match(prompt, /不要引用、仿写已有名言/)
  assert.match(prompt, /严格 JSON/)
  assert.match(prompt, /长期学习中的耐心/)
  assert.doesNotMatch(prompt, /自由选择|已有短句|不是 X 而是 Y/)
  assert.deepEqual(QUOTE_GENERATION_MODELS, {
    primary: 'qwen3.8-27b',
    secondary: 'qwen3.5:9b',
    fallback: 'deepseek-v4-flash',
  })
})

test('automated quote prompt uses the date and excludes recent pool entries', () => {
  const prompt = buildAutomatedQuotePrompt({
    dateKey: '2026-08-26',
    recentQuotes: ['耐心会把模糊的问题磨出清楚的边界'],
  })
  assert.match(prompt, /2026-08-26/)
  assert.match(prompt, /自行选择一个具体角度/)
  assert.match(prompt, /不要重复或近似/)
  assert.match(prompt, /耐心会把模糊的问题磨出清楚的边界/)
})

test('quote parser returns only one valid generated result and owns attribution', () => {
  const result = parseGeneratedQuotes(JSON.stringify({
    quote: { text: '“耐心会把模糊的问题磨出清楚的边界。”', author: '孔子' },
  }))
  assert.equal(result.length, 1)
  assert.equal(result[0].text, '耐心会把模糊的问题磨出清楚的边界')
  assert.equal(result[0].author, 'TUARAN')
  assert.equal(result[0].source, '原创短句')
})

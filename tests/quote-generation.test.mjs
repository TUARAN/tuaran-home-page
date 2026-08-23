import assert from 'node:assert/strict'
import test from 'node:test'

import {
  QUOTE_GENERATION_MODELS,
  buildQuoteGenerationMessages,
  parseGeneratedQuotes,
} from '../lib/quoteGeneration.js'

test('quote prompt requests original JSON candidates and blocks fixed AI phrasing', () => {
  const messages = buildQuoteGenerationMessages({
    direction: '长期学习',
    existingQuotes: ['旧句子只用来去重'],
  })
  const prompt = messages.map((message) => message.content).join('\n')
  assert.match(prompt, /作者只能写 TUARAN/)
  assert.match(prompt, /不要引用、仿写或改写已有名言/)
  assert.match(prompt, /不是 X 而是 Y/)
  assert.match(prompt, /严格 JSON/)
  assert.match(prompt, /旧句子只用来去重/)
  assert.deepEqual(QUOTE_GENERATION_MODELS, {
    primary: 'qwen3.8-27b',
    secondary: 'qwen3.5:9b',
    fallback: 'deepseek-v4-flash',
  })
})

test('quote parser removes wrappers, enforces length and owns attribution', () => {
  const result = parseGeneratedQuotes(JSON.stringify({
    quotes: [
      { text: '“耐心会把模糊的问题磨出清楚的边界。”', author: '孔子' },
      { text: '太短', author: '某人' },
      { text: '每天留下一个能复查的判断，时间才会积成经验', author: '模型' },
    ],
  }))
  assert.equal(result.length, 2)
  assert.equal(result[0].text, '耐心会把模糊的问题磨出清楚的边界')
  assert.equal(result[0].author, 'TUARAN')
  assert.equal(result[0].source, '原创短句')
  assert.equal(result[1].author, 'TUARAN')
})

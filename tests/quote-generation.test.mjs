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

test('automated quote prompt omits the scheduling date and treats recent entries only as exclusions', () => {
  const prompt = buildAutomatedQuotePrompt({
    dateKey: '2026-08-26',
    recentQuotes: ['耐心会把模糊的问题磨出清楚的边界'],
  })
  assert.doesNotMatch(prompt, /2026-08-26/)
  assert.match(prompt, /不是风格范例/)
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

const rejectedDiaryQuotes = [
  '为九月八日的窗沿栽一株时间，让每片新叶拓印今日微光',
  '为九月七日的行囊备一缕秋风，吹散未竟路途的迟疑',
  '为九月六日的晨钟校准每段呼吸，让心跳成为前进的节拍',
  '为九月五日的窗台备两粒星子，一颗照旧路，一颗映新途',
  '为2026-09-08的自己留一点微光',
  '愿你每一天都能勇敢追逐心中的梦想',
]

test('date cards and generic blessings cannot enter the quote pool', () => {
  for (const text of rejectedDiaryQuotes) {
    assert.throws(() => parseGeneratedQuotes(JSON.stringify({ quote: { text } })), /NO_VALID_CANDIDATES/)
  }
})

test('bad recent date cards are not fed back as style examples', () => {
  const prompt = buildAutomatedQuotePrompt({ recentQuotes: rejectedDiaryQuotes })
  for (const text of rejectedDiaryQuotes) assert.ok(!prompt.includes(text))
})

test('concrete observations pass while duplicates differing only in punctuation fail', () => {
  const text = '准备越充分，越容易舍不得接受新的证据'
  const response = JSON.stringify({ quote: { text } })
  assert.equal(parseGeneratedQuotes(response)[0].text, text)
  assert.throws(() => parseGeneratedQuotes(response, {
    recentQuotes: ['准备越充分越容易舍不得接受新的证据。'],
  }), /NO_VALID_CANDIDATES/)
})

test('a general observation about time is not mistaken for a dated card', () => {
  const text = '每一天的选择都在缩小未来的选择范围'
  assert.equal(parseGeneratedQuotes(JSON.stringify({ quote: { text } }))[0].text, text)
})

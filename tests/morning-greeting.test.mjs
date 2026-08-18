import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DAILY_GREETING_TEMPLATES,
  buildDailyGreeting,
  greetingLastRunKey,
  greetingPeriodForDate,
  MORNING_GREETING_TEMPLATE,
  MORNING_GREETING_TEMPLATES,
  buildMorningGreeting,
  greetingDateLabel,
  greetingWithinLimit,
  isAutomationPaused,
  normalizeGreetingNewlines,
  pickDailyGreetingTemplate,
  pickMorningGreetingTemplate,
  shanghaiDateKey,
} from '../lib/morningGreeting.js'
import { rowToTemplate } from '../lib/morningGreetingTemplates.js'
import {
  DEFAULT_DAILY_GREETING_LLM_INTENT,
  buildGreetingLlmMessages,
  normalizeGeneratedGreeting,
  normalizeGreetingGenerationMode,
  normalizeGreetingLlmIntent,
} from '../lib/dailyGreetingLlm.js'

test('greeting date label uses Asia/Shanghai day of month', () => {
  const label = greetingDateLabel({ now: new Date('2026-08-05T00:30:00.000Z') })
  assert.equal(label, '8月5号')
})

test('shanghai date key uses Asia/Shanghai calendar day', () => {
  // 北京时间 8/5 08:30 = UTC 8/5 00:30
  assert.equal(shanghaiDateKey(new Date('2026-08-05T00:30:00.000Z')), '2026-08-05')
  // UTC 8/4 17:00 = 北京时间 8/5 01:00，应归属 8/5
  assert.equal(shanghaiDateKey(new Date('2026-08-04T17:00:00.000Z')), '2026-08-05')
  // UTC 8/5 15:59 = 北京时间 8/5 23:59，应归属 8/5
  assert.equal(shanghaiDateKey(new Date('2026-08-05T15:59:00.000Z')), '2026-08-05')
})

test('builds a morning greeting with today date injected', () => {
  const text = buildMorningGreeting({ now: new Date('2026-08-05T00:30:00.000Z') })
  assert.ok(text.includes('今天是8月5号'))
  assert.ok(!text.includes('{date}'))
  assert.ok(!text.toLowerCase().includes('chovy'))
  assert.match(text, /^(大家早上好|早上好|早安)！/)
  assert.ok(text.split('\n').length >= 2)
})

test('normalizeGreetingNewlines turns literal \\n into real newlines', () => {
  assert.equal(normalizeGreetingNewlines('早安！\\n今天也要保持好奇。\\n冷知识：～'), '早安！\n今天也要保持好奇。\n冷知识：～')
  assert.equal(normalizeGreetingNewlines(null), '')
})

test('buildMorningGreeting normalizes legacy literal \\n templates', () => {
  const legacy = '早安！今天是{date}。\\n今天也要保持好奇。\\n冷知识：那些看起来毫不费力的人，只是把练习藏在了别人看不到的地方～'
  const built = buildMorningGreeting({ now: new Date('2026-08-08T00:30:00.000Z'), template: legacy })
  assert.ok(built.includes('今天是8月8号'))
  assert.ok(!built.includes('\\n'))
  assert.equal(built.split('\n').length, 3)
})

test('rowToTemplate normalizes legacy literal \\n from D1 rows', () => {
  const row = rowToTemplate({ id: 1, text: '早安！\\n冷知识：～', enabled: 1, sort_order: 0, created_at: 0, updated_at: 0 })
  assert.equal(row.text, '早安！\n冷知识：～')
})

test('all 100 daily greeting templates cover three periods and fit X limit', () => {
  assert.equal(DAILY_GREETING_TEMPLATES.length, 100)
  assert.equal(MORNING_GREETING_TEMPLATES.length, 34)
  assert.equal(MORNING_GREETING_TEMPLATE, MORNING_GREETING_TEMPLATES[0])
  assert.deepEqual(
    Object.fromEntries(['morning', 'noon', 'evening'].map((period) => [period, DAILY_GREETING_TEMPLATES.filter((item) => item.period === period).length])),
    { morning: 34, noon: 33, evening: 33 },
  )
  for (const template of DAILY_GREETING_TEMPLATES) {
    assert.match(template.text, /^(早安|午安|晚安)！/)
    assert.ok(template.text.includes('{date}'))
    assert.ok(['quote', 'story', 'reflection'].includes(template.contentKind))
    assert.ok(greetingWithinLimit(template.text.replace('{date}', '12月31号')), `模板超重：${template.text.slice(0, 20)}…`)
  }
})

test('period is inferred in Asia/Shanghai and each period has its own idempotency key', () => {
  assert.equal(greetingPeriodForDate(new Date('2026-08-05T00:00:00Z')), 'morning')
  assert.equal(greetingPeriodForDate(new Date('2026-08-05T04:00:00Z')), 'noon')
  assert.equal(greetingPeriodForDate(new Date('2026-08-05T14:00:00Z')), 'evening')
  assert.notEqual(greetingLastRunKey('morning'), greetingLastRunKey('noon'))
})

test('builds the requested greeting period', () => {
  const now = new Date('2026-08-05T04:00:00Z')
  assert.match(buildDailyGreeting({ now, period: 'noon' }), /^午安！/)
  assert.match(buildDailyGreeting({ now, period: 'evening' }), /^晚安！/)
})

test('daily picker accepts a D1 text pool already filtered for noon or evening', () => {
  assert.equal(
    pickDailyGreetingTemplate(['午安！数据库自定义模板。'], { period: 'noon', now: new Date('2026-08-05T04:00:00Z') }),
    '午安！数据库自定义模板。',
  )
})

test('template pick is deterministic per shanghai day and varies across days', () => {
  const day1a = pickMorningGreetingTemplate(MORNING_GREETING_TEMPLATES, { now: new Date('2026-08-05T00:30:00.000Z') })
  const day1b = pickMorningGreetingTemplate(MORNING_GREETING_TEMPLATES, { now: new Date('2026-08-05T15:00:00.000Z') })
  const day2 = pickMorningGreetingTemplate(MORNING_GREETING_TEMPLATES, { now: new Date('2026-08-06T00:30:00.000Z') })
  assert.equal(day1a, day1b)
  assert.ok(MORNING_GREETING_TEMPLATES.includes(day1a))
  assert.ok(MORNING_GREETING_TEMPLATES.includes(day2))
  assert.notEqual(day1a, day2)
})

test('template pick falls back to defaults when pool is empty', () => {
  const picked = pickMorningGreetingTemplate([], { now: new Date('2026-08-05T00:30:00.000Z') })
  assert.ok(MORNING_GREETING_TEMPLATES.includes(picked))
})

test('pause state parsing treats only paused as paused', () => {
  assert.equal(isAutomationPaused('paused'), true)
  assert.equal(isAutomationPaused(' running '), false)
  assert.equal(isAutomationPaused(null), false)
  assert.equal(isAutomationPaused(''), false)
})

test('LLM generation mode is the default while saved template mode remains supported', () => {
  assert.equal(normalizeGreetingGenerationMode('llm'), 'llm')
  assert.equal(normalizeGreetingGenerationMode('template'), 'template')
  assert.equal(normalizeGreetingGenerationMode('unknown'), 'llm')
  assert.equal(normalizeGreetingLlmIntent('  写得轻松一点  '), '写得轻松一点')
  assert.equal(normalizeGreetingLlmIntent(''), DEFAULT_DAILY_GREETING_LLM_INTENT)
})

test('LLM prompt includes current period, date, and editable intent', () => {
  const messages = buildGreetingLlmMessages({
    intent: '围绕今天先完成一件小事来写。',
    period: 'noon',
    now: new Date('2026-08-18T04:00:00.000Z'),
  })
  assert.equal(messages.length, 2)
  assert.match(messages[0].content, /只输出最终文案/)
  assert.match(messages[1].content, /当前时段：午安/)
  assert.match(messages[1].content, /当前日期：8月18号/)
  assert.match(messages[1].content, /围绕今天先完成一件小事来写/)
})

test('generated greeting cleanup removes wrappers without rewriting copy', () => {
  assert.equal(normalizeGeneratedGreeting('```text\n午安！先好好吃饭。\n```'), '午安！先好好吃饭。')
  assert.equal(normalizeGeneratedGreeting('最终文案：晚安，今天辛苦了。'), '晚安，今天辛苦了。')
  assert.equal(normalizeGeneratedGreeting('“早安，慢慢开始。”'), '早安，慢慢开始。')
})

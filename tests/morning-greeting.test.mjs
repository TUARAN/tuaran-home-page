import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MORNING_GREETING_TEMPLATE,
  MORNING_GREETING_TEMPLATES,
  buildMorningGreeting,
  greetingDateLabel,
  greetingWithinLimit,
  isAutomationPaused,
  pickMorningGreetingTemplate,
  shanghaiDateKey,
} from '../lib/morningGreeting.js'

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

test('builds a morning greeting with today date injected and no chovy', () => {
  const text = buildMorningGreeting({ now: new Date('2026-08-05T00:30:00.000Z') })
  assert.ok(text.includes('今天是8月5号'))
  assert.ok(!text.includes('{date}'))
  assert.ok(!text.toLowerCase().includes('chovy'))
  assert.match(text, /^(大家早上好|早上好|早安)！/)
  assert.ok(text.includes('冷知识'))
})

test('all 10 greeting templates are well-formed and within X post weight limit', () => {
  assert.equal(MORNING_GREETING_TEMPLATES.length, 10)
  assert.equal(MORNING_GREETING_TEMPLATE, MORNING_GREETING_TEMPLATES[0])
  for (const template of MORNING_GREETING_TEMPLATES) {
    assert.match(template, /^(大家早上好|早上好|早安)！/)
    assert.ok(template.includes('{date}'))
    assert.ok(!template.toLowerCase().includes('chovy'))
    const filled = template.replace('{date}', '12月31号')
    assert.ok(greetingWithinLimit(filled), `模板超重：${template.slice(0, 20)}…`)
  }
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

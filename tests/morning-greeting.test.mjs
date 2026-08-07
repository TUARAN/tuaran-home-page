import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MORNING_GREETING_TEMPLATE,
  buildMorningGreeting,
  greetingDateLabel,
  greetingWithinLimit,
  isAutomationPaused,
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

test('builds the fixed morning greeting with today date injected', () => {
  const text = buildMorningGreeting({ now: new Date('2026-08-05T00:30:00.000Z') })
  assert.ok(text.startsWith('大家早上好！向各位领导问好！'))
  assert.ok(text.includes('今天是8月5号'))
  assert.ok(text.includes('chovy！\n新一天一起加油～\n冷知识：关注数多只能说明这人努力+实诚'))
  assert.ok(text.includes('冷知识：关注数多只能说明这人努力+实诚'))
  assert.ok(!text.includes('{date}'))
  assert.ok(!text.includes('xxx'))
})

test('greeting stays within X post weight limit', () => {
  const text = buildMorningGreeting({ now: new Date('2026-08-05T00:30:00.000Z') })
  assert.ok(greetingWithinLimit(text))
  assert.ok(greetingWithinLimit(MORNING_GREETING_TEMPLATE.replace('{date}', '12月31号')))
})

test('pause state parsing treats only paused as paused', () => {
  assert.equal(isAutomationPaused('paused'), true)
  assert.equal(isAutomationPaused(' running '), false)
  assert.equal(isAutomationPaused(null), false)
  assert.equal(isAutomationPaused(''), false)
})

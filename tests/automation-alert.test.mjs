import assert from 'node:assert/strict'
import test from 'node:test'

import {
  automationAlertKey,
  buildAutomationAlertExcerpt,
} from '../lib/siteNotificationsCore.js'

test('automation alert key is stable and namespaced by workflow + run id', () => {
  assert.equal(
    automationAlertKey('a-share-research', '31125496565'),
    'system:automation:a-share-research:31125496565'
  )
  assert.equal(
    automationAlertKey('morning-greeting', 'abc_123'),
    'system:automation:morning-greeting:abc_123'
  )
  // 特殊字符被归一化，避免 key 污染
  assert.equal(automationAlertKey('a/b c', 'x'), 'system:automation:a-b-c:x')
})

test('automation alert excerpt includes task, status and error', () => {
  const excerpt = buildAutomationAlertExcerpt({
    taskName: 'A 股研究自动化',
    status: 'failed',
    error: 'DeepSeek API 超时',
  })
  assert.ok(excerpt.includes('A 股研究自动化'))
  assert.ok(excerpt.includes('运行失败'))
  assert.ok(excerpt.includes('DeepSeek API 超时'))
  assert.ok(excerpt.length <= 160)
})

test('automation alert excerpt is bounded and falls back to defaults', () => {
  const long = buildAutomationAlertExcerpt({
    taskName: '任务',
    error: 'x'.repeat(500),
    runUrl: `https://github.com/example/repo/actions/runs/${'9'.repeat(200)}`,
  })
  assert.ok(long.length <= 160)

  const empty = buildAutomationAlertExcerpt({})
  assert.ok(empty.includes('自动化任务'))
  assert.ok(empty.includes('运行失败'))
})

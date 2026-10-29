import assert from 'node:assert/strict'
import test from 'node:test'

import {
  appendPromptFeedbackToLedger,
  normalizePromptFeedback,
  promptFeedbackMarkdown,
} from '../../lib/community/xExtensionPromptFeedback.js'

test('feedback accepts a concrete positive or negative example for one of four prompts', () => {
  const valid = normalizePromptFeedback({
    kind: 'bad', promptKey: 'replyCommentPrompt',
    content: '  这走势够硬气。  ', assessment: '  空赞，没有观点。  ',
    context: '原帖在讲长期持有。', sourceUrl: 'https://x.com/a/status/123',
  })
  assert.equal(valid.ok, true)
  assert.deepEqual(valid.value, {
    kind: 'bad', promptKey: 'replyCommentPrompt', content: '这走势够硬气。',
    assessment: '空赞，没有观点。', expected: '', context: '原帖在讲长期持有。',
    sourceUrl: 'https://x.com/a/status/123',
  })
  assert.equal(normalizePromptFeedback({ ...valid.value, kind: 'other' }).ok, false)
  assert.equal(normalizePromptFeedback({ ...valid.value, promptKey: 'unknown' }).ok, false)
  assert.equal(normalizePromptFeedback({ ...valid.value, assessment: ' ' }).ok, false)
  assert.equal(normalizePromptFeedback({ ...valid.value, sourceUrl: 'javascript:alert(1)' }).ok, false)
})

test('repository sync appends each feedback id once after an uncertain retry', () => {
  const row = {
    id: '01af-test', kind: 'good', promptKey: 'replyTimelinePrompt', createdAt: Date.UTC(2026, 9, 29),
    content: '这句挺自然。', assessment: '短，贴着原帖。', expected: '', context: '', sourceUrl: '',
  }
  const first = appendPromptFeedbackToLedger('# 台账\n', [row])
  assert.deepEqual(first.appended, [row.id])
  assert.match(first.content, /### 01af-test/)
  const second = appendPromptFeedbackToLedger(first.content, [row])
  assert.deepEqual(second.appended, [])
  assert.equal(second.content, first.content)
})

test('a feedback batch exports originals and reasons without changing any prompt', () => {
  const markdown = promptFeedbackMarkdown([{
    id: 'B-1', kind: 'bad', promptKey: 'postNormalPrompt', createdAt: Date.UTC(2026, 9, 29),
    content: '第一行\n第二行', assessment: '第二行是假对比', expected: '直接说观点',
    context: '原帖讨论股价', sourceUrl: 'https://x.com/a/status/123',
  }])
  assert.match(markdown, /反例 · 普通发帖 · B-1/)
  assert.match(markdown, /> 第一行\n> 第二行/)
  assert.match(markdown, /第二行是假对比/)
  assert.match(markdown, /单条反馈不触发默认提示词更新/)
})

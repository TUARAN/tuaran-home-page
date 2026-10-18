import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeXModelFallbackRequest, X_MODEL_FALLBACK_MAX_CALLS_PER_HOUR } from '../../lib/community/xModelFallback.js'

test('NAS reply fallback accepts only bounded reply context', () => {
  assert.equal(X_MODEL_FALLBACK_MAX_CALLS_PER_HOUR, 60)
  const input = normalizeXModelFallbackRequest({
    kind: 'reply',
    accountHandle: '@Tuaran',
    messages: [{ role: 'system', content: '自然回复' }, { role: 'user', content: '对方回复：生日快乐' }],
  })
  assert.equal(input.accountHandle, 'Tuaran')
  assert.equal(input.messages[1].content, '对方回复：生日快乐')
  assert.equal(normalizeXModelFallbackRequest({ ...input, kind: 'post' }), null)
  assert.equal(normalizeXModelFallbackRequest({ kind: 'reply', messages: [{ role: 'user', content: 'hi' }] }), null)
  assert.equal(normalizeXModelFallbackRequest({ kind: 'reply', messages: [{ role: 'system', content: 'a'.repeat(3501) }, { role: 'user', content: 'hi' }] }), null)
})

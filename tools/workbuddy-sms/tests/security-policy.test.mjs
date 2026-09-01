import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyInbound, normalizeText, summarizeForSms } from '../src/policy.mjs';
import { signRelayEvent, verifyRelayEvent } from '../src/security.mjs';

test('validates signed relay events with replay tolerance', () => {
  const secret = 'test-only-secret';
  const rawBody = '{"eventId":"event-1"}';
  const timestamp = '1800000000000';
  const signature = signRelayEvent(secret, timestamp, rawBody);
  assert.equal(verifyRelayEvent({ secret, timestamp, rawBody, signature, now: 1_800_000_000_100 }), true);
  assert.equal(verifyRelayEvent({ secret, timestamp, rawBody: `${rawBody} `, signature, now: 1_800_000_000_100 }), false);
  assert.equal(verifyRelayEvent({ secret, timestamp, rawBody, signature, now: 1_800_000_400_001 }), false);
});

test('normalizes control characters and truncates by Unicode code points', () => {
  assert.equal(normalizeText('  hello\n\u0000 world  '), 'hello world');
  assert.equal(summarizeForSms('你好世界', 3), '你好…');
});

test('classifies stop and new-session commands deterministically', () => {
  assert.equal(classifyInbound('stop', ['STOP']).type, 'stop');
  assert.deepEqual(classifyInbound('新对话 计划旅行', ['STOP']), { type: 'new_session', argument: '计划旅行', text: '新对话 计划旅行' });
});

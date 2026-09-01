import assert from 'node:assert/strict';
import test from 'node:test';
import { constantTimeEqual, decryptText, encryptText, sha256Base64Url, verifyTwilioSignature } from '../src/crypto.js';

test('encrypts queued text with AES-GCM and decrypts it only with the queue key', async () => {
  const key = Buffer.alloc(32, 7).toString('base64url');
  const encrypted = await encryptText('私人任务正文', key);
  assert.notEqual(encrypted.ciphertext, '私人任务正文');
  assert.equal(await decryptText(encrypted.ciphertext, encrypted.iv, key), '私人任务正文');
  await assert.rejects(() => decryptText(encrypted.ciphertext, encrypted.iv, Buffer.alloc(32, 8).toString('base64url')));
});

test('validates the Twilio HMAC-SHA1 signature over URL and sorted form fields', async () => {
  const params = new URLSearchParams({ Body: 'hello', From: '+15551234567', MessageSid: 'SM123' });
  const authToken = 'test-auth-token';
  const url = 'https://sms.example.com/webhooks/twilio/inbound';
  const payload = `${url}${[...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}${value}`).join('')}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(authToken), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const signature = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))).toString('base64');
  assert.equal(await verifyTwilioSignature({ authToken, url, params, signature }), true);
  params.set('Body', 'tampered');
  assert.equal(await verifyTwilioSignature({ authToken, url, params, signature }), false);
});

test('hashes phone numbers and compares opaque values without direct equality', async () => {
  assert.equal(await sha256Base64Url('+15551234567'), 'ill4C7jNK6Aiv6W6LqO24Hrxen2LMMH5szkONvaQGeQ');
  assert.equal(constantTimeEqual('same', 'same'), true);
  assert.equal(constantTimeEqual('same', 'different'), false);
});

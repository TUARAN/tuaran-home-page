import test from 'node:test';
import assert from 'node:assert/strict';
import { PetBridge, bridgeUrl, replyText } from '../bridge.mjs';

test('only a loopback HTTP bridge endpoint is accepted', () => {
  assert.equal(bridgeUrl('http://localhost:8080'), 'http://localhost:8080');
  for (const url of ['https://localhost:8080', 'http://evil.test:8080', 'http://127.0.0.1:8080/foo', 'http://localhost:8080/?a=1', 'http://user:pass@localhost:8080']) {
    assert.throws(() => bridgeUrl(url));
  }
});

test('pet sends only an explicit message through localassistant and polls by event ID', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith('/health')) return new Response(JSON.stringify({ ok: true, authorized: true, mode: 'real' }));
    if (url.includes('/jobs/')) return new Response(JSON.stringify({ status: 'completed', reply: { content: '完成' } }));
    const { eventId, deviceId, route, text } = JSON.parse(init.body);
    assert.equal(deviceId, 'desktop-pet'); assert.equal(route, 'localassistant'); assert.equal(text, '你好');
    return new Response(JSON.stringify({ accepted: true, eventId }), { status: 202 });
  };
  const bridge = new PetBridge({ fetchImpl });
  assert.deepEqual(await bridge.status(), { connected: true, authorized: true, mode: 'real' });
  const id = await bridge.send(' 你好 ');
  assert.equal(replyText((await bridge.job(id)).reply), '完成');
  assert.equal(replyText({ content: ['第一段', '第二段'] }), '第一段\n第二段');
  assert.equal(calls.length, 3);
  assert.equal(calls[1].url, 'http://127.0.0.1:8080/v1/ui/messages');
  assert.equal(calls[2].url, 'http://127.0.0.1:8080/v1/localassistant/jobs/' + id);
});

test('rejects empty or oversized messages and bridge failures', async () => {
  const bridge = new PetBridge({ fetchImpl: async () => new Response(JSON.stringify({ ok: false, error: '待授权' }), { status: 401 }) });
  await assert.rejects(bridge.send('   '), /请输入/);
  await assert.rejects(bridge.send('a'.repeat(2001)), /请输入/);
  await assert.rejects(bridge.send('你好'), /待授权/);
  await assert.rejects(bridge.job('../health'), /ID 无效/);
});

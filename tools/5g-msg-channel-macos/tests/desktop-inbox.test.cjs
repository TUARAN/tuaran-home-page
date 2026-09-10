'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const Inbox = require('../src/desktop-inbox.cjs');
function fixture(t, sendReply = async () => ({ status: 'ws_sent' })) {
  const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'desktop-inbox-'));
  t.after(() => fs.rmSync(workdir, { recursive: true, force: true }));
  return { maap: { sendReply }, config: { workdir, allowed: ['a'], dry: false } };
}
test('桌面收件持久化、白名单、去重和回复幂等', async t => {
  let sends = 0; const options = fixture(t, async () => { sends++; return { status: 'ws_sent' }; });
  const first = new Inbox(options);
  assert.throws(() => first.enqueue({ replyTarget: 'b', id: '1', text: 'hello' }), /白名单/);
  first.enqueue({ replyTarget: 'a', id: '1', text: 'hello' });
  const second = new Inbox(options);
  assert.equal(second.enqueue({ replyTarget: 'a', id: '1', text: 'hello' }), false);
  const msg = await second.receive(0); assert.equal(msg.text, 'hello');
  await second.reply(msg.messageId, 'world');
  assert.equal((await second.reply(msg.messageId, 'world')).status, 'already_replied');
  assert.equal(sends, 1); assert.equal(fs.statSync(second.file).mode & 0o777, 0o600);
});
test('断开接收任务释放等待，竞争任务不能领取或回复', async t => {
  const box = new Inbox(fixture(t)), a = new AbortController(), b = new AbortController();
  const pending = box.receive(1, a.signal);
  await assert.rejects(() => box.receive(0, b.signal), /另一个/);
  a.abort(); await assert.rejects(() => pending, /断开/);
  box.enqueue({ replyTarget: 'a', id: '2', text: 'hello' });
  const message = await box.receive(0, b.signal);
  await assert.rejects(() => box.reply(message.messageId, 'world', a.signal), /领取/);
  await box.reply(message.messageId, 'world', b.signal);
});
test('下发失败或崩溃后禁止自动重发；测试消息不会发送短信', async t => {
  let sends = 0; const options = fixture(t, async () => { sends++; throw new Error('disconnected'); });
  const box = new Inbox(options); box.enqueue({ replyTarget: 'a', id: '3', text: 'hello' });
  const msg = await box.receive(0);
  await assert.rejects(() => box.reply(msg.messageId, 'world'), /disconnected/);
  await assert.rejects(() => new Inbox(options).reply(msg.messageId, 'world'), /禁止自动重发/);
  box.enqueue({ replyTarget: 'a', id: 'test', text: 'test' });
  box.items.at(-1).testOnly = true; box.save();
  const testMsg = await box.receive(0);
  assert.equal((await box.reply(testMsg.messageId, 'ok')).status, 'test_recorded');
  assert.equal(sends, 1);
});

'use strict';
const fs = require('node:fs'), path = require('node:path'), { randomUUID } = require('node:crypto');
const { assertAllowed } = require('./policy.cjs');
class DesktopInbox {
  constructor({ maap, config, onEvent = () => {} }) {
    Object.assign(this, { maap, config, onEvent });
    this.file = path.join(config.workdir, 'desktop-inbox.json');
    this.items = fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file, 'utf8')) : [];
    if (!Array.isArray(this.items)) throw new Error('收件箱格式错误');
    this.waiter = null; this.stopped = false; this.clients = new Map();
  }
  save() {
    fs.writeFileSync(this.file + '.tmp', JSON.stringify(this.items), { mode: 0o600 });
    fs.renameSync(this.file + '.tmp', this.file);
  }
  enqueue(message) {
    assertAllowed(this.config.allowed, message.replyTarget);
    if (typeof message.text !== 'string' || !message.text.trim() || message.text.length > 4000) throw new Error('上行消息长度不合法');
    const key = message.replyTarget + ':' + message.id;
    if (this.items.some(x => x.key === key)) return false;
    if (this.items.filter(x => x.state !== 'replied').length >= 100) throw new Error('收件箱已满');
    this.items.push({ id: randomUUID(), key, from: message.replyTarget, text: message.text, state: 'pending', receivedAt: new Date().toISOString() });
    // Keep a bounded durable deduplication history.
    if (this.items.length > 1000) { const i = this.items.findIndex(x => x.state === 'replied'); if (i >= 0) this.items.splice(i, 1); }
    this.save(); this.onEvent({ type: 'desktop_message_received' }); this.waiter?.(); return true;
  }
  async receive(waitSeconds = 25, signal) {
    if (!Number.isInteger(waitSeconds) || waitSeconds < 0 || waitSeconds > 50) throw new Error('waitSeconds 必须为 0–50');
    if (this.owner && !this.owner.aborted && this.owner !== signal) throw new Error('收件箱已绑定另一个桌面任务');
    this.owner = signal;
    if (this.waiter) throw new Error('已有桌面任务正在收件，请勿启动第二个接收任务');
    let item = this.items.find(x => x.state === 'pending' || x.state === 'claimed');
    if (!item && waitSeconds && !signal?.aborted && !this.stopped) await new Promise(resolve => {
      const finish = () => { clearTimeout(timer); signal?.removeEventListener('abort', finish); this.waiter = null; resolve(); };
      const timer = setTimeout(finish, waitSeconds * 1000); this.waiter = finish;
      signal?.addEventListener('abort', finish, { once: true });
    });
    if (signal?.aborted || this.stopped) throw new Error('接收任务已断开');
    item = this.items.find(x => x.state === 'pending' || x.state === 'claimed');
    if (!item) return { status: 'waiting', instruction: '暂无消息；继续调用 receive_5g 等待。停止任务后不会自动唤醒。' };
    const resumed = item.state === 'claimed'; item.state = 'claimed'; this.save();
    return { status: 'message', messageId: item.id, from: item.from, text: item.text, receivedAt: item.receivedAt, resumed, testOnly: !!item.testOnly, instruction: '在本桌面任务中处理消息，用 reply_5g 回复。若 resumed=true，先检查本任务历史，避免重复执行已有副作用。' };
  }
  async send(to, text) {
    assertAllowed(this.config.allowed, to);
    if (typeof text !== 'string' || !text.trim() || text.length > 4000) throw new Error('消息必须为 1–4000 字符');
    return this.config.dry ? { status: 'dry_run' } : this.maap.sendReply(to, text);
  }
  async reply(id, text, signal) {
    if (this.owner && (this.owner.aborted || this.owner !== signal)) throw new Error('请由领取消息的桌面任务回复');
    const item = this.items.find(x => x.id === id);
    if (!item) throw new Error('消息不存在');
    if (item.state === 'replied') return { status: 'already_replied', messageId: id };
    if (item.state !== 'claimed') throw new Error('消息未领取，或上次下发结果不确定；禁止自动重发');
    if (typeof text !== 'string' || !text.trim() || text.length > 4000) throw new Error('回复必须为 1–4000 字符');
    item.state = 'sending'; item.reply = text; this.save();
    try {
      const result = item.testOnly ? { status: 'test_recorded', smsSent: false } : await this.send(item.from, text);
      item.state = 'replied'; item.result = result; item.finishedAt = new Date().toISOString(); this.save();
      this.onEvent({ type: 'desktop_reply_done', messageId: id, status: result.status }); return result;
    } catch (e) { item.state = 'delivery_unknown'; this.save(); throw e; }
  }
  status() {
    return { backend: 'workbuddy-desktop-mcp', sessionBinding: 'desktop-receiver-task', acpReady: null,
      desktopReceiverWaiting: !!this.waiter, queueLength: this.items.filter(x => x.state === 'pending').length,
      unresolved: this.items.filter(x => ['sending', 'delivery_unknown', 'claimed'].includes(x.state)).map(x => ({ messageId: x.id, state: x.state })),
      received: this.items.length, processed: this.items.filter(x => x.state === 'replied').length,
      active: !!this.waiter, sessions: [], historyStorage: 'desktop-task-tools-and-local-inbox',
      requiresRunningDesktopTask: true };
  }
  async close() { this.stopped = true; this.waiter?.(); }
}
module.exports = DesktopInbox;

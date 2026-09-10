'use strict';
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const AcpClient = require('./acp-client.cjs');
const { assertAllowed, senderDirectory } = require('./policy.cjs');

// 会话持久化：按发送者保存 sessionId，进程重启后经 session/load 恢复上下文
function sessionFile(dir) { return path.join(dir, 'session.json'); }
function readSessionId(dir) {
  try { const id = JSON.parse(fs.readFileSync(sessionFile(dir), 'utf8')).sessionId; return typeof id === 'string' && id ? id : null; }
  catch { return null; }
}
function writeSessionId(dir, sessionId) {
  if (!sessionId) return;
  try { fs.writeFileSync(sessionFile(dir), JSON.stringify({ sessionId, savedAt: new Date().toISOString() }), { mode: 0o600 }); } catch {}
}
class Bridge {
  constructor({ maap, config, port, makeClient, onEvent = () => {} }) {
    Object.assign(this, { maap, config, port, onEvent });
    this.makeClient = makeClient || (cwd => new AcpClient({ port, cwd, onEvent }));
    this.clients = new Map(); this.seen = new Map(); this.queue = [];
    this.lastTask = null; this.received = 0; this.active = null; this.processed = 0; this.failed = 0; this.stopped = false;
  }
  async send(target, text, origin = 'mcp-send', taskId = null) {
    assertAllowed(this.config.allowed, target);
    if (typeof text !== 'string' || !text.trim() || text.length > 4000) throw new Error('消息必须为 1–4000 字符');
    this.onEvent({ type: 'outbound_attempt', origin, taskId, characters: text.length, dry: this.config.dry });
    const result = this.config.dry ? { status: 'dry_run', delivered: false } : await this.maap.sendReply(target, text);
    this.onEvent({ type: 'outbound_result', origin, taskId, status: result.status });
    return result;
  }
  enqueue(msg) {
    assertAllowed(this.config.allowed, msg.replyTarget);
    if (this.stopped) throw new Error('服务正在停止');
    if (typeof msg.text !== 'string' || !msg.text.trim() || msg.text.length > 4000) throw new Error('上行消息长度不合法');
    const key = msg.replyTarget + ':' + msg.id;
    if (this.seen.has(key)) return false;
    if (this.queue.length >= 100) throw new Error('队列已满');
    this.seen.set(key, true); if (this.seen.size > 2000) this.seen.delete(this.seen.keys().next().value);
    this.received++; this.onEvent({ type: 'message_received' }); this.queue.push(msg); this.pump(); return true;
  }
  async pump() {
    if (this.active || this.stopped) return;
    const task = this.queue.shift(); if (!task) return;
    this.active = task;
    this.lastTask = { id: randomUUID(), backend: 'workbuddy-local-acp', state: 'processing', startedAt: new Date().toISOString(), error: null };
    let replyAttempted = false;
    try {
      let client = this.clients.get(task.replyTarget);
      if (!client) {
        const dir = senderDirectory(this.config.workdir, task.replyTarget);
        client = this.makeClient(dir, readSessionId(dir));
        this.clients.set(task.replyTarget, client);
      }
      const deniedBefore = client.permissionsDenied || 0;
      let reply = '';
      const result = await client.prompt(task.text, { timeoutMs: this.config.taskTimeoutMs, onText: text => { reply = (reply + text).slice(0, 4000); } });
      // 会话建立即回写 sessionId（含失败场景，会话仍可复用），重启后据此恢复上下文
      if (client.sessionId) writeSessionId(senderDirectory(this.config.workdir, task.replyTarget), client.sessionId);
      if (result.stopReason !== 'end_turn') { const error = new Error('ACP 任务未正常完成: ' + result.stopReason); error.permissionDenied = result._meta?.['codebuddy.ai/outcome'] === 'PERMISSION_DENIED' || client.permissionsDenied > deniedBefore; throw error; }
      if (!reply.trim()) throw new Error('ACP 未返回可下发正文');
      replyAttempted = true; await this.send(task.replyTarget, reply, 'acp-response', this.lastTask.id); this.processed++;
      this.lastTask.state = 'completed';
      this.onEvent({ type: 'task_done', taskId: this.lastTask.id });
    } catch (e) {
      this.failed++; this.lastTask.state = 'failed'; this.lastTask.error = e.message;
      this.onEvent({ type: 'task_failed', error: e.message });
      // A possibly delivered reply is never followed by an automatic duplicate.
      if (!replyAttempted && !this.stopped) {
        const notice = e.permissionDenied ? '操作未执行：本次电脑确认未获允许（已拒绝、超时或弹窗不可用）。请在 Mac 上准备好后重新发送；当前没有仍在等待的审批。' : /timeout|超时/i.test(e.message) ? '处理超时：尚未获得完整结果，请在电脑端检查任务状态；为避免重复执行，本次没有自动重试。' : '处理失败：WorkBuddy 暂时未能完成任务。请稍后重试，或在电脑端查看 bridge_status 的 lastTask。';
        try { await this.send(task.replyTarget, notice, 'failure-notice', this.lastTask.id); this.lastTask.failureNotice = 'ws_sent_or_dry'; }
        catch (sendError) { this.lastTask.failureNotice = 'failed'; this.onEvent({ type: 'failure_notice_failed', error: sendError.message }); }
      }
    }
    finally { this.lastTask.finishedAt = new Date().toISOString(); this.active = null; this.pump(); }
  }
  status() { return { received: this.received, lastTask: this.lastTask, queueLength: this.queue.length, active: !!this.active, processed: this.processed, failed: this.failed, sessions: [...this.clients.values()].map(c => c.status()) }; }
  async close() { this.stopped = true; this.queue = []; await Promise.all([...this.clients.values()].map(c => c.close())); }
}
module.exports = Bridge;

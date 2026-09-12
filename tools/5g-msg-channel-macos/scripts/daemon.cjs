'use strict';
/*
 * 5g-msg-channel-macos 外部守护进程（响应式收件 + 自动回复）
 *
 * 作用：连接 shared-daemon 的 Unix socket（~/.workbuddy/5g-macos.sock），
 *       长轮询 receive_5g，收到白名单手机消息后立即：
 *         1) 写日志
 *         2) 可选执行钩子命令（DAEMON_HOOK）
 *         3) 可选自动回复（DAEMON_REPLY=echo 时按模板回复）
 *       断线自动重连，SIGINT/SIGTERM 优雅退出。
 *
 * 配置（全部走环境变量，缺省即用）：
 *   DAEMON_SOCKET         socket 路径，默认 ~/.workbuddy/5g-macos.sock
 *   DAEMON_WAIT           receive 等待秒数 0–50，默认 50
 *   DAEMON_REPLY          echo | none，默认 echo
 *   DAEMON_REPLY_TEMPLATE 回复模板，{text} 为占位，默认 "已收到：{text}"
 *   DAEMON_FORWARD_WORKBUDDY  1=打开 workbuddy://task 把消息送进 WorkBuddy（会创建新会话）
 *   DAEMON_INBOX_FILE     本地收件队列文件，默认 ~/.workbuddy/5g-inbox.jsonl
 *                         当前 WorkBuddy 对话可读取此文件来展示未读短信
 *   DAEMON_NOTIFY         1=收到短信时发送 macOS 通知中心提醒
 *   DAEMON_HOOK           收到消息时执行的 shell 命令（可选），
 *                         {text}/{from}/{messageId} 会先被替换
 *   DAEMON_LOG            日志文件路径，默认 ./var/daemon.log
 *
 * 用法：
 *   node scripts/daemon.cjs                    # 前台运行
 *   DAEMON_REPLY=none node scripts/daemon.cjs # 只收不回复
 *   DAEMON_HOOK='./notify.sh "{text}"' node scripts/daemon.cjs
 */

const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const { execFile } = require('node:child_process');

const SOCKET = process.env.DAEMON_SOCKET || path.join(os.homedir(), '.workbuddy/5g-macos.sock');
const WAIT = clampInt(process.env.DAEMON_WAIT, 50, 0, 50);
const REPLY_MODE = (process.env.DAEMON_REPLY || 'echo').toLowerCase();
const REPLY_TEMPLATE = process.env.DAEMON_REPLY_TEMPLATE || '已收到：{text}';
const HOOK = process.env.DAEMON_HOOK || '';
const LOG_FILE = process.env.DAEMON_LOG || path.join(__dirname, '..', 'var', 'daemon.log');
const RECONNECT_MS = clampInt(process.env.DAEMON_RECONNECT_MS, 3000, 500, 60000);
const FORWARD_WORKBUDDY = process.env.DAEMON_FORWARD_WORKBUDDY === '1' || process.env.DAEMON_FORWARD_WORKBUDDY === 'true';
const INBOX_FILE = process.env.DAEMON_INBOX_FILE || path.join(os.homedir(), '.workbuddy', '5g-inbox.jsonl');
const NOTIFY = process.env.DAEMON_NOTIFY === '1' || process.env.DAEMON_NOTIFY === 'true';

function clampInt(v, dflt, min, max) {
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return dflt;
  return Math.max(min, Math.min(max, n));
}

fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
const log = (...args) => {
  const line = `[${new Date().toISOString()}] ${args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}`;
  console.log(line);
  logStream.write(line + '\n');
};

function fill(text, ctx) {
  return text.replace(/\{text\}/g, ctx.text).replace(/\{from\}/g, ctx.from).replace(/\{messageId\}/g, ctx.messageId);
}

// 转发到 WorkBuddy：打开 workbuddy://task?action=start&prompt=<短信>
function forwardToWorkbuddy(ctx) {
  const prompt = `[手机短信 from ${ctx.from}] ${ctx.text}`;
  const url = `workbuddy://task?action=start&prompt=${encodeURIComponent(prompt)}`;
  try {
    execFile('/usr/bin/open', [url], { timeout: 3000 }, (err) => {
      if (err) log('转发到 WorkBuddy 失败:', err.message);
      else log('已转发到 WorkBuddy:', url.slice(0, 80) + (url.length > 80 ? '…' : ''));
    });
  } catch (e) {
    log('转发到 WorkBuddy 异常:', e.message);
  }
}

// 写入本地收件队列（供当前 WorkBuddy 对话读取）
function appendToInbox(ctx, msg) {
  try {
    fs.mkdirSync(path.dirname(INBOX_FILE), { recursive: true });
    const record = {
      messageId: ctx.messageId,
      from: ctx.from,
      text: ctx.text,
      receivedAt: new Date().toISOString(),
      read: false
    };
    fs.appendFileSync(INBOX_FILE, JSON.stringify(record) + '\n');
    log('已写入收件队列:', INBOX_FILE);
  } catch (e) {
    log('写入收件队列失败:', e.message);
  }
}

// 发送 macOS 通知中心提醒
function sendNotification(ctx) {
  try {
    const title = '收到新短信';
    const body = ctx.text.slice(0, 80) + (ctx.text.length > 80 ? '…' : '');
    const script = `display notification "${body.replace(/"/g, '\\"')}" with title "${title.replace(/"/g, '\\"')}"`;
    execFile('/usr/bin/osascript', ['-e', script], { timeout: 3000 }, (err) => {
      if (err) log('发送通知失败:', err.message);
    });
  } catch (e) {
    log('发送通知异常:', e.message);
  }
}

// —— 极简 MCP JSON-RPC 客户端（走 Unix socket，单连接长活）——
class ChannelClient {
  constructor(socketPath) {
    this.path = socketPath;
    this.socket = null;
    this.buf = '';
    this.pending = new Map();
    this.seq = 0;
  }
  connect() {
    return new Promise((resolve, reject) => {
      const sock = net.connect(this.path);
      this.socket = sock;
      sock.setNoDelay(true);
      sock.once('connect', () => resolve());
      sock.once('error', reject);
      sock.on('data', chunk => this._onData(chunk));
      sock.on('close', () => this._failAll(new Error('socket closed')));
      sock.on('error', () => {});
    });
  }
  close() { try { this.socket?.destroy(); } catch {} }
  _onData(chunk) {
    this.buf += chunk.toString('utf8');
    let i;
    while ((i = this.buf.indexOf('\n')) >= 0) {
      const line = this.buf.slice(0, i).trim();
      this.buf = this.buf.slice(i + 1);
      if (!line) continue;
      let msg; try { msg = JSON.parse(line); } catch { continue; }
      const p = this.pending.get(msg.id);
      if (!p) continue;
      this.pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    }
  }
  _failAll(err) { for (const [, p] of this.pending) p.reject(err); this.pending.clear(); }
  async call(name, args = {}) {
    if (!this.socket || this.socket.destroyed) throw new Error('socket 未连接');
    const id = ++this.seq;
    const payload = { jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } };
    const result = await new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.write(JSON.stringify(payload) + '\n');
    });
    return this._unwrap(result);
  }
  _unwrap(result) {
    // MCP tools/call 返回 { content: [{ type:'text', text: JSON.stringify(value) }] }
    if (result?.isError) throw new Error((result.content?.[0]?.text) || '工具执行失败');
    const text = result?.content?.[0]?.text;
    if (text == null) return result;
    try { return JSON.parse(text); } catch { return text; }
  }
}

async function runHook(hook, ctx) {
  return new Promise(resolve => {
    // 用 sh -c 执行，支持引号与管道；5 秒超时兜底
    execFile('/bin/sh', ['-c', fill(hook, ctx)], { timeout: 5000 }, (err, stdout, stderr) => {
      if (err) log('hook 执行失败:', err.message, stderr.trim());
      else log('hook 完成:', stdout.trim() || '(无输出)');
      resolve();
    });
  });
}

let stopping = false;
process.on('SIGINT', () => { stopping = true; log('收到 SIGINT，退出'); process.exit(0); });
process.on('SIGTERM', () => { stopping = true; log('收到 SIGTERM，退出'); process.exit(0); });

async function main() {
  log('守护进程启动', JSON.stringify({ socket: SOCKET, wait: WAIT, reply: REPLY_MODE, hook: !!HOOK, forwardWorkbuddy: FORWARD_WORKBUDDY, inbox: INBOX_FILE, notify: NOTIFY, log: LOG_FILE }));
  let client = null;
  while (!stopping) {
    try {
      if (!client) { client = new ChannelClient(SOCKET); await client.connect(); log('已连接 shared-daemon socket'); }
      // 单连接长活：receive 与 reply 共用同一连接，保证 owner signal 一致
      const msg = await client.call('receive_5g', { waitSeconds: WAIT });
      if (!msg || msg.status === 'waiting') continue;
      if (msg.status !== 'message') { log('非预期返回:', msg); continue; }

      const ctx = { text: msg.text, from: msg.from, messageId: msg.messageId };
      log('收到消息', JSON.stringify({ messageId: msg.messageId, from: msg.from, text: msg.text, resumed: !!msg.resumed, testOnly: !!msg.testOnly }));

      if (HOOK) await runHook(HOOK, ctx);
      appendToInbox(ctx, msg);
      if (NOTIFY) sendNotification(ctx);
      if (FORWARD_WORKBUDDY) forwardToWorkbuddy(ctx);
      if (REPLY_MODE === 'echo' && !msg.testOnly) {
        const text = fill(REPLY_TEMPLATE, ctx);
        const res = await client.call('reply_5g', { messageId: msg.messageId, text });
        log('已回复', JSON.stringify({ messageId: msg.messageId, status: res?.status ?? res, text }));
      }
    } catch (e) {
      // 收件箱被其他接收者占用（非连接故障）：不重连，短暂等待后重试
      const busy = /绑定另一个桌面任务|正在收件/.test(e.message);
      log(busy ? '收件箱被占用，稍后重试' : '连接/调用出错:', e.message);
      if (!busy) { client?.close(); client = null; }
      if (stopping) break;
      await new Promise(r => setTimeout(r, busy ? 1000 : RECONNECT_MS));
    }
  }
  client?.close();
  logStream.end();
}

main().catch(e => { log('致命错误:', e.message); logStream.end(); process.exit(1); });

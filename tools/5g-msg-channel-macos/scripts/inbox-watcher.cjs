'use strict';
/*
 * 5G 短信队列 5 秒轮询 watcher（后台长跑）
 *
 * 每 5 秒读取 ~/.workbuddy/5g-inbox.jsonl，
 * 若发现比上次已处理位置更新的未读消息：
 *   1) 追加写入 var/inbox-watch.log
 *   2) 发送 macOS 通知中心提醒
 *
 * 用法：
 *   node scripts/inbox-watcher.cjs
 *
 * 环境变量：
 *   WATCHER_INBOX_FILE    队列文件路径，默认 ~/.workbuddy/5g-inbox.jsonl
 *   WATCHER_LOG_FILE      watcher 日志，默认 ./var/inbox-watch.log
 *   WATCHER_INTERVAL_MS   轮询间隔毫秒，默认 5000
 *   WATCHER_NOTIFY        1=发 macOS 通知，默认 1
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');

const INBOX_FILE = process.env.WATCHER_INBOX_FILE || path.join(os.homedir(), '.workbuddy', '5g-inbox.jsonl');
const LOG_FILE = process.env.WATCHER_LOG_FILE || path.join(__dirname, '..', 'var', 'inbox-watch.log');
const INTERVAL_MS = Number.parseInt(process.env.WATCHER_INTERVAL_MS, 10) || 5000;
const NOTIFY = process.env.WATCHER_NOTIFY !== '0';

fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
const log = (...args) => {
  const line = `[${new Date().toISOString()}] ${args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')}`;
  console.log(line);
  logStream.write(line + '\n');
};

let lastSeenIndex = 0;

function snapshotInbox() {
  if (!fs.existsSync(INBOX_FILE)) return [];
  const lines = fs.readFileSync(INBOX_FILE, 'utf8').split('\n').filter(Boolean);
  const out = [];
  for (const line of lines) {
    try { out.push(JSON.parse(line)); } catch {}
  }
  return out;
}

function sendNotification(text) {
  const title = '收到新短信';
  const body = (text || '').slice(0, 80) + ((text || '').length > 80 ? '…' : '');
  const script = 'display notification "' + String(body).replace(/"/g, '\\"') + '" with title "' + title + '"';
  try {
    execFile('/usr/bin/osascript', ['-e', script], { timeout: 3000 }, () => {});
  } catch {}
}

let timer = null;
function tick() {
  const msgs = snapshotInbox();
  if (lastSeenIndex === 0 && msgs.length > 0) {
    lastSeenIndex = msgs.length;
    log('启动：跳过已存在的 ' + msgs.length + ' 条历史消息');
    return;
  }
  const fresh = msgs.slice(lastSeenIndex);
  if (fresh.length === 0) return;
  for (const m of fresh) {
    log('新消息', JSON.stringify({ messageId: m.messageId, from: m.from, text: m.text, receivedAt: m.receivedAt }));
    if (NOTIFY) sendNotification(m.text);
  }
  lastSeenIndex = msgs.length;
}

log('watcher 启动', JSON.stringify({ inbox: INBOX_FILE, log: LOG_FILE, intervalMs: INTERVAL_MS, notify: NOTIFY }));
tick();
timer = setInterval(tick, INTERVAL_MS);

function shutdown() {
  if (timer) clearInterval(timer);
  log('退出');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

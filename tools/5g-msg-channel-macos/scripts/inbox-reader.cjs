'use strict';
/*
 * 读取 5G 短信守护进程的本地收件队列。
 *
 * 用法：
 *   node scripts/inbox-reader.cjs              # 列出所有未读消息
 *   node scripts/inbox-reader.cjs --mark-read  # 列出未读并全部标记为已读
 *
 * 队列文件：~/.workbuddy/5g-inbox.jsonl（每行一条 JSON）
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const INBOX_FILE = process.env.DAEMON_INBOX_FILE || path.join(os.homedir(), '.workbuddy', '5g-inbox.jsonl');
const MARK_READ = process.argv.includes('--mark-read');

function readInbox() {
  if (!fs.existsSync(INBOX_FILE)) return [];
  const lines = fs.readFileSync(INBOX_FILE, 'utf8').split('\n').filter(Boolean);
  const messages = [];
  for (const line of lines) {
    try { messages.push(JSON.parse(line)); } catch { /* skip bad line */ }
  }
  return messages;
}

function markRead() {
  const messages = readInbox();
  let changed = 0;
  for (const m of messages) {
    if (!m.read) { m.read = true; changed++; }
  }
  fs.writeFileSync(INBOX_FILE, messages.map(m => JSON.stringify(m)).join('\n') + (messages.length ? '\n' : ''));
  return changed;
}

const messages = readInbox();
const unread = messages.filter(m => !m.read);

console.log(JSON.stringify({
  total: messages.length,
  unreadCount: unread.length,
  unread: unread.slice(-20) // 最多返回最近 20 条未读
}, null, 2));

if (MARK_READ && unread.length) {
  const changed = markRead();
  console.log(`\n已将 ${changed} 条消息标记为已读。`);
}

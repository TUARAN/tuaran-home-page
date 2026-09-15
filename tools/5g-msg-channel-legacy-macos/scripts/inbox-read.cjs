#!/usr/bin/env node
'use strict';

/**
 * inbox-read.cjs — 读取 5G 收件箱（供 WorkBuddy 侧 agent 播报）
 *
 * 背景：连接器直连 ACP 注入的消息**不会进 UI 对话流**（架构限制），
 *       bridge.cjs 会把每条入站消息（原文 + AI 回复）追加到 var/inbox/inbox.jsonl，
 *       本脚本负责读取「上次播报之后」的新条目，供 agent 贴到对话里。
 *
 * 用法：
 *   node scripts/inbox-read.cjs              读未播报条目，读完后推进游标（默认）
 *   node scripts/inbox-read.cjs --peek       只读不推进游标
 *   node scripts/inbox-read.cjs --all        读全部（不推进游标）
 *   node scripts/inbox-read.cjs --json       机读格式
 *   node scripts/inbox-read.cjs --reset      游标归零（下次会读到全部历史）
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INBOX = process.env.BRIDGE_INBOX || path.join(ROOT, 'var', 'inbox', 'inbox.jsonl');
const CURSOR = path.join(path.dirname(INBOX), '.cursor');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const asJson = has('--json');
const peek = has('--peek') || has('--all') || has('--json');
const showAll = has('--all');

function readCursor() {
  try { return Number(fs.readFileSync(CURSOR, 'utf8').trim()) || 0; } catch (e) { return 0; }
}
function writeCursor(ts) {
  try { fs.writeFileSync(CURSOR, String(ts)); } catch (e) { /* ignore */ }
}
function loadEntries() {
  try {
    return fs.readFileSync(INBOX, 'utf8').split('\n').filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch (e) { return null; } })
      .filter(Boolean);
  } catch (e) { return []; }
}
function fmtTime(iso) {
  try {
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  } catch (e) { return iso; }
}

/** 通知播报栏重算（未读数写进 agent 每轮都会读到的地方）；失败不影响读取 */
function syncBadge() {
  try {
    const { refreshBadge } = require('../src/inbox-badge.cjs');
    const r = refreshBadge();
    if (r.ok) {
      const written = (r.targets || []).filter((t) => t.action === 'written').length;
      const where = (r.targets || []).map((t) => t.path.replace(process.env.HOME || '', '~')).join(' | ');
      console.log(`（播报栏已同步：未播报 ${r.unread} 条，刷新 ${written} 处 → ${where}）`);
    } else {
      console.log(`（播报栏未同步：${r.reason}）`);
    }
  } catch (e) {
    console.log(`（播报栏未同步：${e.message}）`);
  }
}

if (has('--reset')) {
  writeCursor(0);
  console.log('游标已归零（下次将读到全部历史）');
  syncBadge();
  process.exit(0);
}

const all = loadEntries();
const cursor = readCursor();
const picked = showAll ? all : all.filter((e) => (e.ts || 0) > cursor);

if (asJson) {
  console.log(JSON.stringify({ inbox: INBOX, cursor, total: all.length, count: picked.length, entries: picked }, null, 2));
  process.exit(0);
}

if (!picked.length) {
  console.log(`(无新消息) 收件箱共 ${all.length} 条，游标 ts=${cursor}`);
  process.exit(0);
}

console.log(`已收到 ${picked.length} 条 5G 消息：\n`);
picked.forEach((e, i) => {
  const tag = e.event === 'done' ? '已完成' : '处理失败';
  console.log(`${i + 1}. [${fmtTime(e.iso)}] ${tag}  (来自 ${e.sender || '?'})`);
  console.log(`   你发的：${JSON.stringify(e.text || '')}`);
  if (e.event === 'done') {
    console.log(`   AI 回复：${JSON.stringify(e.reply || '')}`);
    console.log(`   耗时：${e.elapsedMs != null ? e.elapsedMs + 'ms' : '?'}${e.session ? '  会话：' + e.session : ''}`);
  } else {
    console.log(`   失败原因：${e.error || '未知'}`);
  }
  console.log('');
});

if (!peek) {
  const maxTs = Math.max(...picked.map((e) => e.ts || 0));
  writeCursor(maxTs);
  console.log(`（游标已推进到 ${maxTs}）`);
  syncBadge();
} else {
  console.log('（--peek/--all/--json：游标未推进）');
}

#!/usr/bin/env node
'use strict';

/**
 * inbox-to-session.cjs — 把 5G 收件箱内容「写进」WorkBuddy 会话记录
 *
 * 原理：WorkBuddy 会话的持久化文件是
 *   ~/.workbuddy/projects/<cwdSlug>/<sessionId>.jsonl
 * 它是一个 append-only 的 JSONL 事件流，消息记录形如：
 *   {id, parentId, timestamp, type:"message", role:"user"|"assistant",
 *    content:[{type:"input_text"|"output_text", text}], providerData, sessionId, cwd}
 * 本脚本在文件尾部追加「用户消息 + 助手消息」成对记录，从而让 5G 消息
 * 出现在会话记录里（重启/切回对话后可见）。
 *
 * ⚠️ 局限（务必知晓）：
 *   1) 该文件由正在运行的 CLI host 独占写入，是严格单链（id → parentId）。
 *      在会话活跃时写入会形成「悬挂分支」，UI 可能不实时渲染；
 *      切走再切回（触发一次 resume）后才会归并到主链。
 *   2) 每次写入前都会自动备份 transcript。
 *
 * 用法：
 *   node scripts/inbox-to-session.cjs                 # 写未播报的收件箱条目
 *   node scripts/inbox-to-session.cjs --dry-run       # 只预览，不写、不推进游标
 *   node scripts/inbox-to-session.cjs --all           # 写全部历史条目
 *   node scripts/inbox-to-session.cjs --session <id>  # 指定会话（默认自动跟随当前 UI 会话）
 *   node scripts/inbox-to-session.cjs --list          # 只看将写入什么
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const INBOX = process.env.BRIDGE_INBOX || path.join(ROOT, 'var', 'inbox', 'inbox.jsonl');
const CURSOR = path.join(path.dirname(INBOX), '.cursor');
const JOURNAL = path.join(path.dirname(INBOX), 'injected.jsonl');
const PROJECTS_DIR = path.join(os.homedir(), '.workbuddy', 'projects');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const argVal = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : ''; };

const DRY = has('--dry-run') || has('--list');
const SHOW_ALL = has('--all');
const SESSION_ARG = argVal('--session');
const CWD_ARG = argVal('--cwd');

const pad = (n) => String(n).padStart(2, '0');
function fmtTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso || '');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function uuid() { return crypto.randomUUID(); }
function hex(n) { return crypto.randomBytes(n).toString('hex'); }

/** cwd → 项目目录名（/Users/foo/bar → Users-foo-bar） */
function cwdSlug(cwd) { return String(cwd).replace(/^\//, '').replace(/[\\/]/g, '-'); }

function transcriptPath(sessionId, cwd) {
  return path.join(PROJECTS_DIR, cwdSlug(cwd), `${sessionId}.jsonl`);
}

function readCursor() {
  try { return Number(fs.readFileSync(CURSOR, 'utf8').trim()) || 0; } catch (e) { return 0; }
}
function writeCursor(ts) {
  try { fs.writeFileSync(CURSOR, String(ts)); } catch (e) { /* ignore */ }
}
function loadInbox() {
  try {
    return fs.readFileSync(INBOX, 'utf8').split('\n').filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch (e) { return null; } })
      .filter(Boolean);
  } catch (e) { return []; }
}

/** 读取 transcript 尾部，返回 {tipId, tipTs, count, lastAssistantProvider} */
function inspectTranscript(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const lines = raw.split('\n');
  let tipId = null, tipTs = 0, count = 0, provider = null;
  for (const ln of lines) {
    if (!ln.trim()) continue;
    let j;
    try { j = JSON.parse(ln); } catch (e) { continue; }   // 半行 → 跳过
    count++;
    if (j.id) { tipId = j.id; if (j.timestamp) tipTs = j.timestamp; }
    if (j.type === 'message' && j.role === 'assistant' && j.providerData) provider = j.providerData;
  }
  return { tipId, tipTs, count, provider };
}

function buildPair(entry, tipId, sessionId, cwd, providerTemplate) {
  const now = Date.now();
  const uid = uuid();
  const text = entry.text || '';
  const prefix = entry.event === 'done' ? '【手机 · 5G】' : '【手机 · 5G · 处理失败】';

  const userRec = {
    id: uid,
    parentId: tipId,
    timestamp: now,
    type: 'message',
    role: 'user',
    content: [{ type: 'input_text', text: `${prefix}${text}` }],
    __codebuddyLocal: { sensitiveUserInputReviewed: true },
    providerData: { agent: 'cli', source: '5g-inbox-bridge' },
    sessionId,
    cwd,
  };

  const replyText = entry.event === 'done'
    ? (entry.reply || '(空回复)')
    : `处理失败：${entry.error || '未知原因'}`;
  const aid = uuid();
  const providerData = Object.assign(
    { agent: 'cli' },
    providerTemplate ? { model: providerTemplate.model, requestModelId: providerTemplate.requestModelId, requestModelName: providerTemplate.requestModelName } : {},
    { messageId: aid, traceId: hex(16), conversationRequestId: hex(16) }
  );

  const asstRec = {
    id: aid,
    parentId: uid,
    timestamp: now + 1,
    type: 'message',
    role: 'assistant',
    status: 'completed',
    content: [{ providerData: { annotations: [] }, type: 'output_text', text: replyText }],
    providerData,
    sessionId,
    cwd,
  };

  return [userRec, asstRec];
}

function main() {
  // ---- 1. 解析目标会话 ----
  let sessionId = SESSION_ARG;
  let cwd = CWD_ARG;
  if (!sessionId || !cwd) {
    try {
      const uiSession = require(path.join(ROOT, 'src', 'ui-session.cjs'));
      const found = sessionId
        ? (uiSession.discoverUiSession(sessionId) || null)
        : uiSession.discoverUiSession();
      if (found) { sessionId = sessionId || found.sessionId; cwd = cwd || found.cwd; }
    } catch (e) { /* ignore */ }
  }
  if (!sessionId || !cwd) {
    console.error('❌ 未能确定目标会话（daemon.log 无 UI 会话记录）；可用 --session <id> --cwd <path> 显式指定');
    process.exit(2);
  }

  const file = transcriptPath(sessionId, cwd);
  if (!fs.existsSync(file)) {
    console.error(`❌ transcript 不存在：${file}`);
    process.exit(2);
  }

  // ---- 2. 取待写入条目 ----
  const all = loadInbox();
  const cursor = readCursor();
  const picked = SHOW_ALL ? all : all.filter((e) => (e.ts || 0) > cursor);

  console.log(`目标会话：${sessionId}`);
  console.log(`工作目录：${cwd}`);
  console.log(`transcript：${file}`);
  console.log(`待写入条目：${picked.length} 条（收件箱共 ${all.length} 条，游标 ts=${cursor}）`);

  if (!picked.length) {
    console.log('\n(无新消息可写入)');
    return;
  }
  picked.forEach((e, i) => {
    console.log(`  ${i + 1}. [${fmtTime(e.iso)}] ${e.event === 'done' ? '完成' : '失败'} · ${JSON.stringify(e.text || '')}`);
  });

  if (DRY) {
    console.log('\n(--dry-run/--list：未写入、未推进游标)');
    return;
  }

  // ---- 3. 备份 ----
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 15);
  const bak = `${file}.bak-inject-${ts}`;
  fs.copyFileSync(file, bak);
  console.log(`\n已备份 transcript → ${path.basename(bak)}`);

  // ---- 4. 从当前文件尾取链尾，逐对追加 ----
  const info = inspectTranscript(file);
  if (!info.tipId) { console.error('❌ transcript 无有效记录，放弃写入'); process.exit(3); }
  console.log(`链尾 id=${info.tipId.slice(0, 12)} 记录数=${info.count}`);

  const records = [];
  let tip = info.tipId;
  for (const e of picked) {
    const pair = buildPair(e, tip, sessionId, cwd, info.provider);
    records.push(...pair);
    tip = pair[1].id;
  }

  const payload = records.map((r) => JSON.stringify(r)).join('\n') + '\n';
  fs.appendFileSync(file, payload, { encoding: 'utf8' });

  // ---- 5. 日志 + 推进游标 ----
  try {
    const journal = records.filter((r) => r.role === 'user').map((r, i) => JSON.stringify({
      at: new Date().toISOString(), file, sessionId, role: 'pair', ids: [records[i * 2].id, records[i * 2 + 1].id],
    })).join('\n');
    fs.appendFileSync(JOURNAL, journal + '\n');
  } catch (e) { /* ignore */ }

  const maxTs = Math.max(...picked.map((e) => (e.ts || 0)));
  writeCursor(maxTs);

  console.log(`\n✅ 已写入 ${records.length} 条记录（${picked.length} 对「用户+助手」），游标推进到 ${maxTs}`);
  console.log('   ⚠️ UI 不会实时刷新 —— 请切换到别的对话再切回本对话查看');
  console.log(`   回滚：cp "${bak}" "${file}"`);
}

main();

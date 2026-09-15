'use strict';

/**
 * inbox-badge.cjs — 把「5G 未读收件箱」硬写进 agent 每轮都会读到的地方
 *
 * 为什么需要它：
 *   播报原本只是一条写在记忆里的软约定（"每次用户发言先跑读取器"）。
 *   实测会漏 —— 2026-09-14 17:39 就漏过一次（17:35 查过是空的，17:38 新消息到达，
 *   17:39 那轮默认"刚查过还新鲜"，于是没重查）。
 *   软约定不可靠，所以改成**内容主动出现在 agent 眼前**：
 *
 *   连接器每次「收到消息落盘」或「游标被推进」后，都会重算未读数，
 *   写进记忆文件的 5G-INBOX 标记区块。
 *
 * ★ 写入位置（2026-09-14 17:45 实测修正）★
 *   1) `~/.workbuddy/MEMORY.md`（用户级）—— **实测每轮实时注入 agent 上下文** ✅ 主目标
 *   2) `<绑定会话 cwd>/.workbuddy/memory/MEMORY.md`（项目级）—— 实测**不**实时注入
 *      （agent 看到的是会话启动时的快照，17:41 写入的区块在 17:45 那轮仍未出现），
 *      保留写入仅作备用：某天平台改成实时读取即自动生效，而且它也是给人看的日志。
 *
 * 代价：用户级文件会出现在所有项目的对话里。区块自带「绑定会话 <sid>」与使用范围说明，
 *      非绑定对话里读一眼即可忽略。
 *
 * 失败绝不影响主流程：所有异常吞掉，返回 { ok:false, reason }。
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { discoverUiSession } = require('./ui-session.cjs');

const BEGIN = '<!-- 5G-INBOX:BEGIN 自动生成 · 勿手改 -->';
const END = '<!-- 5G-INBOX:END -->';
const MAX_PREVIEW = 3;          // 区块里最多预览几条
const PREVIEW_CHARS = 34;       // 每条预览截断字数
const READER = 'node ~/Documents/GitHub/tuaran-home-page/tools/5g-msg-channel-legacy-macos/scripts/inbox-read.cjs';

/** 收件箱文件路径（与 bridge.cjs / inbox-read.cjs 保持一致） */
function resolveInboxPath() {
  return process.env.BRIDGE_INBOX
    || path.join(__dirname, '..', 'var', 'inbox', 'inbox.jsonl');
}

function readCursor(inboxPath) {
  try {
    return Number(fs.readFileSync(path.join(path.dirname(inboxPath), '.cursor'), 'utf8').trim()) || 0;
  } catch (e) { return 0; }
}

function loadEntries(inboxPath) {
  try {
    return fs.readFileSync(inboxPath, 'utf8').split('\n').filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch (e) { return null; } })
      .filter(Boolean);
  } catch (e) { return []; }
}

function fmtTime(iso) {
  try {
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch (e) { return String(iso || '?'); }
}

/** 单行化 + 截断（区块是给 agent 读的，必须紧凑） */
function clip(s, n) {
  const one = String(s || '').replace(/\s+/g, ' ').trim();
  return one.length > n ? one.slice(0, n - 1) + '…' : one;
}

/**
 * 生成区块文本。
 * @param {Array} unread 未播报条目
 * @param {object} binding { sessionId, cwd, source }
 */
function buildBlock(unread, binding) {
  const stamp = fmtTime(new Date().toISOString());
  const sid = binding && binding.sessionId ? binding.sessionId.slice(0, 8) : '?';
  const out = [BEGIN, '## 📬 5G 收件箱（自动生成 · 每轮刷新）'];

  if (unread.length) {
    out.push(`**未播报 ${unread.length} 条** · 刷新 ${stamp} · 绑定会话 ${sid}`);
    out.push('');
    for (const e of unread.slice(-MAX_PREVIEW)) {
      const tag = e.event === 'failed' ? '⚠️' : '·';
      out.push(`- ${tag} [${fmtTime(e.iso)}] ${clip(e.text, PREVIEW_CHARS)}`);
    }
    if (unread.length > MAX_PREVIEW) out.push(`- …另有 ${unread.length - MAX_PREVIEW} 条`);
    out.push('');
    out.push(`> 当前对话若是绑定会话 ${sid}：本轮回复开头必须先播报（跑读取器，会推进游标并刷新本栏）`);
    out.push(`> \`${READER}\``);
    out.push('> 其他对话：不必播报，除非用户主动问起手机 / 5G / 新消息。');
  } else {
    out.push(`**无未播报** · 刷新 ${stamp} · 绑定会话 ${sid}`);
    out.push('');
    out.push('> 手机侧消息进来会自动更新本栏；显示「无未播报」即当时收件箱是空的。');
  }

  out.push(END);
  return out.join('\n');
}

/** 把区块幂等写进目标文件；返回 'written' | 'unchanged' */
function applyBlock(target, block) {
  let cur = '';
  try { cur = fs.readFileSync(target, 'utf8'); } catch (e) { cur = ''; }
  const bi = cur.indexOf(BEGIN);
  const ei = cur.indexOf(END);
  let next;
  if (bi !== -1 && ei !== -1 && ei > bi) {
    next = cur.slice(0, bi) + block + cur.slice(ei + END.length);   // 替换已有区块
  } else if (!cur.trim()) {
    next = '# 长期记忆\n\n' + block + '\n';                          // 空文件 → 建骨架
  } else {
    next = cur.replace(/\s*$/, '') + '\n\n' + block + '\n';          // 追加到末尾
  }
  if (next === cur) return 'unchanged';
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, next);
  return 'written';
}

/**
 * 刷新播报栏。幂等：同一状态重复调用不会改动文件。
 * @returns {{ok:boolean, unread?:number, targets?:Array, reason?:string}}
 */
function refreshBadge({ logger = null, inboxPath = '' } = {}) {
  try {
    const binding = discoverUiSession();
    if (!binding || !binding.cwd) return { ok: false, reason: 'no-ui-binding' };

    const ip = inboxPath || resolveInboxPath();
    const all = loadEntries(ip);
    const cursor = readCursor(ip);
    const unread = all.filter((e) => (e.ts || 0) > cursor);
    const block = buildBlock(unread, binding);

    const targets = [
      path.join(os.homedir(), '.workbuddy', 'MEMORY.md'),              // 用户级：每轮实时注入 ✅
      path.join(binding.cwd, '.workbuddy', 'memory', 'MEMORY.md'),     // 项目级：快照，备用
    ];

    const results = [];
    for (const t of targets) {
      try { results.push({ path: t, action: applyBlock(t, block) }); }
      catch (e) { results.push({ path: t, action: 'error', error: e.message }); }
    }

    const touched = results.filter((r) => r.action === 'written').length;
    if (logger && typeof logger.mark === 'function' && touched) {
      logger.mark('📬', 'inbox-badge', `unread=${unread.length} 已刷新 ${touched} 处`);
    }
    return { ok: true, unread: unread.length, targets: results };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

module.exports = { refreshBadge, buildBlock, applyBlock, resolveInboxPath, BLOCK_BEGIN: BEGIN, BLOCK_END: END };

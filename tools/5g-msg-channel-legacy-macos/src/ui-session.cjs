'use strict';

/**
 * ui-session.cjs — 「5G 消息复用当前 UI 对话上下文」的会话绑定器
 *
 * 背景：旧逻辑 bridge.makeAcp(target) 给每个发送者建独立隔离会话
 *       （cwd = var/workspace/<sha256(target)>/），5G 消息因此永远进不了 UI 对话的上下文。
 *
 * 绑定规则（优先级从高到低）：
 *   1) ACP_UI_SESSION_ID（兼容 ACP_SESSION_ID）显式指定 → 钉死该会话
 *      cwd 取 ACP_UI_CWD，未配则从 daemon.log 反查该 sessionId 对应的 cwd
 *   2) ACP_FOLLOW_UI=1（默认）→ 从 daemon.log 最新一条 launch-spec resolved 自动跟随当前 UI 会话
 *      （要求 cwd 在 ACP_UI_CWD_PREFIX 下，以过滤自动化/项目目录会话）
 *   3) ACP_BIND_UI_SESSION=0 → 关闭绑定，回退旧「按发送者隔离会话」行为
 *
 * daemon.log 依据：WorkBuddy 引擎每条会话启动都会写一行
 *   {"...","message":["[conversation-runtime] launch-spec resolved",{"sessionId":"...","cwd":"..."}]}
 * 最后一条即「当前 UI 会话」。
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const BIND_UI_SESSION = String(process.env.ACP_BIND_UI_SESSION ?? '1') !== '0';
const FOLLOW_UI = String(process.env.ACP_FOLLOW_UI ?? '1') !== '0';
const UI_CWD_PREFIX = process.env.ACP_UI_CWD_PREFIX || path.join(os.homedir(), 'WorkBuddy') + path.sep;
const UI_DISCOVER_TTL_MS = parseInt(process.env.ACP_UI_DISCOVER_TTL_MS || '5000', 10);
const EXPLICIT_UI_SESSION = process.env.ACP_UI_SESSION_ID || '';
const EXPLICIT_UI_CWD = process.env.ACP_UI_CWD || '';
const TAIL_BYTES = parseInt(process.env.ACP_UI_TAIL_BYTES || String(512 * 1024), 10);
// 候选会话数：daemon.log 里最近 N 个「不同」的 UI 会话，用 transcript 新鲜度仲裁
const UI_CANDIDATES = parseInt(process.env.ACP_UI_CANDIDATES || '8', 10);
const PROJECTS_DIR = path.join(os.homedir(), '.workbuddy', 'projects');

let _cache = { at: 0, value: null };

/** /Users/foo/bar → Users-foo-bar（WorkBuddy 会话目录命名规则） */
function cwdSlug(cwd) { return String(cwd).replace(/^\//, '').replace(/[\\/]/g, '-'); }

/** 该会话 transcript 的最后写入时间（ms）；不存在返回 0 */
function transcriptMtime(sessionId, cwd) {
  try {
    return fs.statSync(path.join(PROJECTS_DIR, cwdSlug(cwd), sessionId + '.jsonl')).mtimeMs;
  } catch (e) { return 0; }
}

/** 读取日志文件尾部并按行返回（避免整文件载入）；不可读返回 null */
function tailLines(file, maxBytes = TAIL_BYTES) {
  let fd = null;
  try {
    const size = fs.statSync(file).size;
    const readLen = Math.min(size, maxBytes);
    const buf = Buffer.alloc(readLen);
    fd = fs.openSync(file, 'r');
    fs.readSync(fd, buf, 0, readLen, size - readLen);
    return buf.toString('utf8').split('\n');
  } catch (e) {
    return null;
  } finally {
    if (fd !== null) { try { fs.closeSync(fd); } catch (e) { /* ignore */ } }
  }
}

/**
 * 从 daemon.log 解析会话记录。
 * @param {string} filterSessionId 为空 → 最新一条 UI 会话（cwd 需命中前缀）；有值 → 反查该会话的 cwd
 * @returns {{sessionId:string,cwd:string,source:string}|null}
 */
function discoverUiSession(filterSessionId = '') {
  const now = Date.now();
  if (!filterSessionId && now - _cache.at < UI_DISCOVER_TTL_MS) return _cache.value;

  // 收集最近的 UI 会话候选（按日志倒序去重）
  const cands = [];
  const seen = new Set();
  for (const logName of ['daemon.log', 'daemon.old.log']) {
    const lines = tailLines(path.join(os.homedir(), '.workbuddy', 'logs', logName));
    if (!lines) continue;
    for (let i = lines.length - 1; i >= 0 && cands.length < UI_CANDIDATES; i--) {
      const line = lines[i];
      if (!line || line.indexOf('launch-spec resolved') === -1) continue;
      let d = null;
      try {
        const j = JSON.parse(line);
        d = Array.isArray(j.message) ? j.message[1] : null;
      } catch (e) { continue; }                       // 半行/损坏行 → 继续往上找
      if (!d || !d.sessionId || !d.cwd) continue;
      if (filterSessionId) {
        if (d.sessionId === filterSessionId) return { sessionId: d.sessionId, cwd: d.cwd, source: 'env(log)' };
        continue;
      }
      if (!String(d.cwd).startsWith(UI_CWD_PREFIX)) continue;   // 过滤非 UI 会话
      if (seen.has(d.sessionId)) continue;
      seen.add(d.sessionId);
      cands.push({ sessionId: d.sessionId, cwd: d.cwd, source: 'auto-ui', mtime: transcriptMtime(d.sessionId, d.cwd) });
    }
    if (cands.length) break;
  }

  // 仲裁：优先「transcript 最近仍在写入」的那个（= 用户正在看的对话）；
  // 全部查不到 transcript 时，退回日志里最新的一条。
  let best = cands[0] || null;
  let bestMtime = best ? best.mtime : 0;
  for (const c of cands) {
    if (c.mtime > bestMtime) { best = c; bestMtime = c.mtime; }
  }
  const found = best ? { sessionId: best.sessionId, cwd: best.cwd, source: bestMtime ? 'auto-ui(mtime)' : 'auto-ui(log)' } : null;
  if (!filterSessionId) _cache = { at: now, value: found };
  return found;
}

/** 调试用：列出当前所有候选及其 transcript 新鲜度 */
function listUiCandidates() {
  const prev = _cache;
  _cache = { at: 0, value: null };
  const out = [];
  const seen = new Set();
  for (const logName of ['daemon.log', 'daemon.old.log']) {
    const lines = tailLines(path.join(os.homedir(), '.workbuddy', 'logs', logName));
    if (!lines) continue;
    for (let i = lines.length - 1; i >= 0 && out.length < UI_CANDIDATES; i--) {
      const line = lines[i];
      if (!line || line.indexOf('launch-spec resolved') === -1) continue;
      let d = null;
      try { const j = JSON.parse(line); d = Array.isArray(j.message) ? j.message[1] : null; } catch (e) { continue; }
      if (!d || !d.sessionId || !d.cwd) continue;
      if (!String(d.cwd).startsWith(UI_CWD_PREFIX)) continue;
      if (seen.has(d.sessionId)) continue;
      seen.add(d.sessionId);
      out.push({ sessionId: d.sessionId, cwd: d.cwd, mtime: transcriptMtime(d.sessionId, d.cwd) });
    }
    if (out.length) break;
  }
  _cache = prev;
  return out;
}

/** 日志用的模式描述（不依赖运行时状态） */
function describeMode() {
  if (!BIND_UI_SESSION) return '已关闭(ACP_BIND_UI_SESSION=0) → 按发送者隔离会话';
  if (EXPLICIT_UI_SESSION) return `绑定指定 UI 会话(${EXPLICIT_UI_SESSION.slice(0, 8)})`;
  if (FOLLOW_UI) return '自动跟随当前 UI 对话(ACP_FOLLOW_UI=1)';
  return '已关闭(FOLLOW_UI=0 且未指定会话) → 按发送者隔离会话';
}

/**
 * 创建绑定器实例。
 * @param {object} deps
 *   AcpClient   ACP 客户端类
 *   logger      日志器
 *   acpCwd      兜底 cwd（显式会话未给 cwd、且日志反查不到时用）
 *   explicitSessionId  显式会话（通常来自 ACP_SESSION_ID）
 *   getPort     () => number  当前 ACP 端口（0 = 未就绪）
 */
function createUiBinder({ AcpClient, logger, acpCwd = process.cwd(), explicitSessionId = '', getPort = () => 0 } = {}) {
  let client = null;
  let clientKey = '';

  /** 解析当前应绑定的 UI 会话；无可绑定目标返回 null */
  function resolveUiBinding() {
    const explicit = EXPLICIT_UI_SESSION || explicitSessionId || '';
    if (explicit) {
      const cwd = EXPLICIT_UI_CWD || (discoverUiSession(explicit) || {}).cwd || acpCwd;
      return { sessionId: explicit, cwd, source: 'env' };
    }
    if (!FOLLOW_UI) return null;
    return discoverUiSession();
  }

  /** 取（并按需重建）共享的 UI 会话客户端；UI 对话切换时自动改绑 */
  function makeUiBoundAcp() {
    const port = getPort();
    if (!port) return null;
    const b = resolveUiBinding();
    if (!b) return null;
    const key = b.sessionId + '|' + b.cwd;
    if (client && clientKey !== key) {
      logger.mark('🔀', 'ui-bind.switch', `${clientKey.split('|')[0].slice(0, 8)} → ${b.sessionId.slice(0, 8)}（跟随当前 UI 对话）`);
      try { client.disconnect(); } catch (e) { /* ignore */ }
      client = null;
    }
    if (!client) {
      client = new AcpClient({ port, cwd: b.cwd, sessionIdHint: b.sessionId, sessionHintSource: b.source, logger });
      clientKey = key;
      logger.mark('🎯', 'ui-bind.ready', `${b.sessionId.slice(0, 8)} (${b.source}) cwd=${b.cwd}`);
    }
    return client;
  }

  function disconnect() {
    if (client) { try { client.disconnect(); } catch (e) { /* ignore */ } }
  }

  return {
    makeUiBoundAcp,
    resolveUiBinding,
    disconnect,
    getClient: () => client,
    mode: describeMode,
    enabled: BIND_UI_SESSION,
  };
}

module.exports = {
  createUiBinder,
  discoverUiSession,
  listUiCandidates,
  describeMode,
  BIND_UI_SESSION,
  FOLLOW_UI,
  UI_CWD_PREFIX,
  EXPLICIT_UI_SESSION,
};

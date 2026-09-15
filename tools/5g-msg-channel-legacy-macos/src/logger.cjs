'use strict';

/**
 * logger.cjs — 5g-msg-channel 连接器日志模块 v2.0
 *
 * 变更 v2.0:
 *   - 日期切割：每天 0 点自动切换到 channel-YYYY-MM-DD.log（无需重启，
 *     旧 stream 正常关闭，避免句柄泄漏）。
 *   - 切换时额外切文件写（当每小时/跨月/跨日）时自动 append。
 *   - getStream() 始终返回当前日期对应文件的 writeStream。
 *   - 仍保持「stderr + 文件」双输出，不污染 stdout MCP 通道。
 *
 * 特性：
 *  - 分级日志：debug < info < warn < error（LOG_LEVEL 控制）
 *  - 会话级独立文件（LOG_FILE 可覆盖）
 *  - 关键节点打点：md() 输出带 [✔/✖] 的醒目标记，方便问题核查
 *  - 不污染 stdout（MCP stdio 协议独占 stdout）
 */

const fs = require('fs');
const path = require('path');

require('./config.cjs');

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (e) {}

const EXPLICIT_LOG_FILE = process.env.CHANNEL_LOG_FILE
  || (process.env.LOG_FILE && !/\.workbuddy/i.test(process.env.LOG_FILE) ? process.env.LOG_FILE : '');

function dateKey(ts) { return new Date(ts).toISOString().slice(0, 10); }
function buildLogFile(ts) {
  return EXPLICIT_LOG_FILE || path.join(LOG_DIR, `channel-${dateKey(ts)}.log`);
}

let _stream = null;
let _streamDateKey = dateKey(Date.now());
let _streamFile = buildLogFile(Date.now());

function getStream() {
  const now = Date.now();
  const k = dateKey(now);
  if (k !== _streamDateKey && !EXPLICIT_LOG_FILE) {
    // 日期切换：关闭旧 stream，新建当天文件（open flag a 兼容 append）
    try { if (_stream) { try { _stream.end(); } catch (e) {} } } catch (e) {}
    _stream = null;
    _streamDateKey = k;
    _streamFile = buildLogFile(now);
  }
  if (_stream) return _stream;
  try {
    _stream = fs.createWriteStream(_streamFile, { flags: 'a' });
    _stream.on('error', () => { _stream = null; });  // 失败时 fallback appendFileSync
  } catch (e) { _stream = null; }
  return _stream;
}

function ts() { return new Date().toISOString(); }
function fmtArg(a) { return typeof a === 'string' ? a : (a instanceof Error ? `Error: ${a.message}\n${a.stack || ''}` : JSON.stringify(a)); }

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const LEVEL = LEVELS[process.env.LOG_LEVEL || 'info'] ?? LEVELS.info;

function write(level, args) {
  const line = `[${ts()}] [${level.toUpperCase()}] ${args.map(fmtArg).join(' ')}\n`;
  try { console.error(line.replace(/\n$/, '')); } catch (e) {}
  const s = getStream();
  if (s) {
    try { s.write(line); }
    catch (e) {
      try { fs.appendFileSync(_streamFile || buildLogFile(Date.now()), line); } catch (_) {}
    }
  } else {
    try { fs.appendFileSync(_streamFile || buildLogFile(Date.now()), line); } catch (_) {}
  }
}

const logger = {
  get LOG_FILE() { return EXPLICIT_LOG_FILE || buildLogFile(Date.now()); },
  debug: (...a) => { if (LEVEL <= LEVELS.debug) write('debug', a); },
  info: (...a) => { if (LEVEL <= LEVELS.info) write('info', a); },
  warn: (...a) => { if (LEVEL <= LEVELS.warn) write('warn', a); },
  error: (...a) => { if (LEVEL <= LEVELS.error) write('error', a); },
  /** 醒目打点：logger.mark('✅','auth_ok','msg') → [MARK] ✅ auth_ok: msg */
  mark: (icon, tag, ...a) => write('mark', [`[${icon}] ${tag}`, ...a]),
};

module.exports = logger;

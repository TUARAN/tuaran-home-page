'use strict';

/**
 * session-store.cjs — sessionId 持久化存储 v1.0
 *
 * 作用：连接器重启后复用上次成功创建的 ACP sessionId，
 *       避免每次都 session/new 造成会话上下文丢失；失效自动回退。
 *
 * 文件：connector/.session.json
 * 结构：{ "version": 1, "sessionId": "...", "savedAt": "ISO", "cwd": "...", "source": "new|env|arg" }
 */

const fs = require('fs');
const path = require('path');

const STORE_FILE = process.env.ACP_SESSION_FILE || path.join(__dirname, '..', 'var', 'workspace', 'session.json');

function create(storeFile) {
  function loadFromFile() {
    try {
      const j = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
      return j && j.sessionId ? j : null;
    } catch (e) { return null; }
  }
  function saveToFile(sessionId, { cwd = '', source = 'new' } = {}) {
    fs.mkdirSync(path.dirname(storeFile), { recursive: true, mode: 0o700 });
    const tmp = storeFile + '.tmp-' + process.pid;
    fs.writeFileSync(tmp, JSON.stringify({ version: 1, sessionId, savedAt: new Date().toISOString(), cwd, source }, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, storeFile);
  }
  function clearFile() { try { fs.unlinkSync(storeFile); } catch (e) { if (e.code !== 'ENOENT') throw e; } }
  return { load: loadFromFile, save: saveToFile, clear: clearFile, STORE_FILE: storeFile };
}

function load() {
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const j = JSON.parse(raw);
    if (j && j.sessionId) return j;
  } catch (e) { /* 不存在或损坏 */ }
  return null;
}

function save(sessionId, { cwd = '', source = 'new' } = {}) {
  try {
    const data = { version: 1, sessionId, savedAt: new Date().toISOString(), cwd, source };
    const tmp = STORE_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, STORE_FILE);
    return data;
  } catch (e) {
    return null;
  }
}

function clear() {
  try { fs.unlinkSync(STORE_FILE); } catch (e) {}
}

module.exports = { load, save, clear, STORE_FILE, create };

'use strict';

/**
 * heartbeat.cjs — 连接器心跳文件读写 v1.0
 *
 * 用途：watchdog 守护进程与连接器之间的探活通道。
 *   - 连接器(daemon模式)每 5s 写一次 heartbeat.json（pid + ws 状态 + 时间戳）
 *   - watchdog 读心跳文件：文件过期(>HEARTBEAT_STALE_MS) → 判定进程死 → 自动拉起
 *   - 心跳文件里 wsConnected=false 持续超时 → watchdog 判定 WS 断 → 重启连接器
 *
 * 文件：connector/run/heartbeat.json（run/ 目录自动创建）
 */

const fs = require('fs');
const path = require('path');

const HEARTBEAT_FILE = process.env.HEARTBEAT_FILE
  || path.join(__dirname, '..', 'run', 'heartbeat.json');
const DEFAULT_INTERVAL_MS = 5000;

function writeHeartbeat({ pid = process.pid, wsConnected = false, wsAuthed = false, wsUrl = '', queueLength = 0, processed = 0, failed = 0, extra = {} }) {
  try {
    fs.mkdirSync(path.dirname(HEARTBEAT_FILE), { recursive: true });
    const data = {
      pid,
      ts: Date.now(),
      iso: new Date().toISOString(),
      wsConnected: !!wsConnected,
      wsAuthed: !!wsAuthed,
      wsUrl,
      queueLength,
      processed,
      failed,
      ...extra,
    };
    fs.writeFileSync(HEARTBEAT_FILE, JSON.stringify(data), 'utf-8');
    return data;
  } catch (e) { return null; }
}

/** 读心跳：返回对象；文件不存在/损坏返回 null */
function readHeartbeat() {
  try {
    const raw = fs.readFileSync(HEARTBEAT_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) { return null; }
}

/** 心跳是否新鲜（未过期） */
function isFresh(hb, staleMs = 15000) {
  return !!hb && typeof hb.ts === 'number' && (Date.now() - hb.ts) < staleMs;
}

/** 启动周期写心跳；返回 stop 函数 */
function startHeartbeatLoop(getState, intervalMs = DEFAULT_INTERVAL_MS) {
  const timer = setInterval(() => {
    const state = typeof getState === 'function' ? getState() : {};
    writeHeartbeat(state);
  }, intervalMs);
  if (typeof timer.unref === 'function') timer.unref();   // 不阻塞进程退出
  return () => clearInterval(timer);
}

/** 清理心跳文件（优雅退出时调用） */
function clearHeartbeat() {
  try { if (fs.existsSync(HEARTBEAT_FILE)) fs.unlinkSync(HEARTBEAT_FILE); } catch (e) {}
}

module.exports = {
  HEARTBEAT_FILE,
  writeHeartbeat,
  readHeartbeat,
  isFresh,
  startHeartbeatLoop,
  clearHeartbeat,
};

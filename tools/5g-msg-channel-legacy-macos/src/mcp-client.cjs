'use strict';
/**
 * mcp-client.cjs — WorkBuddy(stdio) ⇄ 常驻 daemon(unix socket) 桥
 *
 * hotfix：旧实现 socket 一断就 process.exit()，于是「daemon 重启（端口漂移修复 / 升级 /
 * watchdog 与 LaunchAgent 重拉）」会连带把 WorkBuddy 侧的 MCP 通道打死，且 WorkBuddy
 * 不会自动把工具重新挂上（表现为 bridge_status 报 Not connected），只能整应用重启。
 * 现在改为「断线自动重连 + 断线期间缓存 stdin 帧」，daemon 重启对使用者透明。
 */
const net = require('net');
const os = require('os');
const path = require('path');

const SOCKET_PATH = process.env.BRIDGE_SOCKET || path.join(os.homedir(), '.workbuddy', '5g-legacy-macos.sock');
const RETRY_MS = Math.max(200, parseInt(process.env.BRIDGE_SOCKET_RETRY_MS || '800', 10));
const MAX_BUFFER_BYTES = parseInt(process.env.BRIDGE_SOCKET_MAX_BUFFER || String(64 * 1024 * 1024), 10);

let socket = null;
let connected = false;
let pending = [];         // 断线期间缓存的 stdin 帧（daemon 回来即补发）
let pendingBytes = 0;

const debug = (msg) => { if (process.env.BRIDGE_DEBUG) process.stderr.write('[mcp-client] ' + msg + '\n'); };

function connect() {
  socket = net.connect(SOCKET_PATH);
  socket.setNoDelay(true);

  socket.on('connect', () => {
    connected = true;
    debug('socket 已连接: ' + SOCKET_PATH);
    if (pending.length) {
      const buf = pending;
      pending = [];
      pendingBytes = 0;
      for (const chunk of buf) { try { socket.write(chunk); } catch (e) {} }
      debug(`补发断线期间缓存帧 ${buf.length} 个`);
    }
  });

  socket.on('data', (chunk) => process.stdout.write(chunk));

  socket.on('error', (error) => {
    connected = false;
    debug('socket 错误: ' + error.message);
  });

  socket.on('close', () => {
    connected = false;
    debug(`socket 关闭 → ${RETRY_MS}ms 后重连（daemon 重启中，MCP 通道保持存活）`);
    setTimeout(connect, RETRY_MS);
  });
}

process.stdin.on('data', (chunk) => {
  if (connected && socket && socket.writable) { socket.write(chunk); return; }
  if (pendingBytes + chunk.length > MAX_BUFFER_BYTES) { debug('缓存超限，丢弃一帧'); return; }
  pending.push(chunk);
  pendingBytes += chunk.length;
});

// WorkBuddy 关闭 stdio（禁用连接器 / 退出应用）→ 本进程随之退出，不做无限重连
process.stdin.on('end', () => {
  debug('stdin 关闭 → 退出');
  try { if (socket) socket.destroy(); } catch (e) {}
  process.exit(process.exitCode || 0);
});
process.stdin.resume();

connect();

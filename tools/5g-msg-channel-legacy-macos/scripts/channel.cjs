'use strict';
const net = require('net');
const os = require('os');
const path = require('path');
const socket = net.connect(process.env.BRIDGE_SOCKET || path.join(os.homedir(), '.workbuddy', '5g-legacy-macos.sock'));
const timer = setTimeout(() => { console.error('状态查询超时'); socket.destroy(); process.exitCode = 1; }, 10000);
let buffer = '';
socket.on('connect', () => socket.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'bridge_status', arguments: {} } }) + '\n'));
socket.on('data', chunk => {
  buffer += chunk;
  const end = buffer.indexOf('\n');
  if (end < 0) return;
  console.log(JSON.stringify(JSON.parse(buffer.slice(0, end)), null, 2));
  clearTimeout(timer);
  socket.end();
});
socket.on('error', error => { clearTimeout(timer); console.error(error.message); process.exitCode = 1; });

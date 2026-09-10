'use strict';
// All WorkBuddy windows share one launchd-owned gateway connection.
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const socket = net.connect(process.env.BRIDGE_SOCKET || path.join(os.homedir(), '.workbuddy/5g-macos.sock'));
socket.on('connect', () => { process.stdin.pipe(socket); socket.pipe(process.stdout); });
socket.on('error', e => { console.error('5G 后台服务不可达，请运行 npm run service:install：' + e.message); process.exitCode = 1; });
socket.on('close', () => process.exit(process.exitCode || 0));

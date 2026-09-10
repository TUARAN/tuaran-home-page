'use strict';
const readline = require('node:readline');
const { WebSocketServer } = require('ws');
const server = new WebSocketServer({ host: '127.0.0.1', port: Number(process.env.MOCK_PORT || 8066) });
server.on('listening', () => console.log(`本地模拟网关 ws://127.0.0.1:${server.address().port}/ws。输入文本并回车可发送 test-sender 消息。`));
server.on('error', e => { console.error(e.message); process.exitCode = 1; });
server.on('connection', ws => {
 ws.send(JSON.stringify({ type: 'connected' }));
 ws.on('message', raw => {
  const frame = JSON.parse(raw);
  if (frame.type === 'auth') { ws.authed = frame.apiKey === 'test-api-key'; ws.send(JSON.stringify({ type: ws.authed ? 'auth_ok' : 'auth_failed' })); }
  else if (frame.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
  else if (frame.type === 'send' && ws.authed) console.log('模拟下行：', JSON.stringify({ to: frame.to, text: frame.content }));
 });
});
readline.createInterface({ input: process.stdin }).on('line', text => {
 for (const ws of server.clients) if (ws.authed) ws.send(JSON.stringify({ type: 'text_message', messageId: 'mock-' + Date.now(), from: 'test-sender', content: text }));
});
process.on('SIGINT', () => { for (const ws of server.clients) ws.terminate(); server.close(); process.exit(0); });

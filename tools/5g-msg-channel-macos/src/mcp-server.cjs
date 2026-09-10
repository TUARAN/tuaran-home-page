'use strict';
const readline = require('node:readline');
const VERSION = '3.0.0';
function attach({ status, send, receive, reply, shutdown, input = process.stdin, output = process.stdout }) {
  const write = value => output.write(JSON.stringify(value) + '\n');
  const controller = new AbortController();
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  const handle = async msg => {
    const { id, method, params } = msg;
    if (id === undefined) return;
    let result;
    try {
      if (method === 'initialize') result = { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: '5g-msg-channel-macos', version: VERSION } };
      else if (method === 'ping') result = {};
      else if (method === 'tools/list') result = { tools: [
        { name: 'bridge_status', description: '分别查看网关认证、本地 ACP 握手和发送模式；不代表手机送达', inputSchema: { type: 'object', properties: {} } },
        { name: 'bridge_version', description: '连接器版本', inputSchema: { type: 'object', properties: {} } },
        { name: 'receive_5g', description: '桌面接收任务收取白名单手机消息。等待0–50秒；需保持任务运行。返回内容在当前桌面任务历史可见。', inputSchema: { type: 'object', properties: { waitSeconds: { type: 'integer', minimum: 0, maximum: 50 } } } },
        { name: 'reply_5g', description: '回复 receive_5g 返回的 messageId；已回复消息不会重复下发。testOnly消息只本地记录。', inputSchema: { type: 'object', properties: { messageId: { type: 'string' }, text: { type: 'string', minLength: 1, maxLength: 4000 } }, required: ['messageId', 'text'] } },
        { name: 'send_5g', description: '向白名单目标下发消息；ws_sent 仅代表本地 WebSocket 写出，不代表送达', inputSchema: { type: 'object', properties: { to: { type: 'string', minLength: 1, maxLength: 64 }, text: { type: 'string', minLength: 1, maxLength: 4000 } }, required: ['to', 'text'] } },
      ] };
      else if (method === 'tools/call') {
        let value;
        if (params?.name === 'bridge_status') value = status();
        else if (params?.name === 'bridge_version') value = { version: VERSION };
        else if (params?.name === 'receive_5g') value = await receive(params.arguments?.waitSeconds ?? 25, controller.signal);
        else if (params?.name === 'reply_5g') value = await reply(params.arguments?.messageId, params.arguments?.text, controller.signal);
        else if (params?.name === 'send_5g') value = await send(params.arguments?.to, params.arguments?.text);
        else throw new Error('未知工具');
        result = { content: [{ type: 'text', text: JSON.stringify(value) }] };
      } else { write({ jsonrpc: '2.0', id, error: { code: -32601, message: '未知方法' } }); return; }
      write({ jsonrpc: '2.0', id, result });
    } catch (e) {
      if (method === 'tools/call') write({ jsonrpc: '2.0', id, result: { isError: true, content: [{ type: 'text', text: e.message }] } });
      else write({ jsonrpc: '2.0', id, error: { code: -32603, message: e.message } });
    }
  };
  lines.on('line', line => {
    if (line.length > 1024 * 1024) { lines.close(); shutdown(); return; }
    try { const msg = JSON.parse(line); if (!msg || typeof msg !== 'object') throw new Error(); void handle(msg); }
    catch { write({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Invalid JSON' } }); }
  });
  lines.on('close', () => { controller.abort(); shutdown(); });
  return { handle, close: () => lines.close() };
}
module.exports = { attach };

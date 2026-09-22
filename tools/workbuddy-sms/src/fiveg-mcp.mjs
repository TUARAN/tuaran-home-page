import { createConnection } from 'node:net';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const DEFAULT_FIVEG_SOCKET = join(homedir(), '.workbuddy', '5g-legacy-macos.sock');

function parseToolResult(response) {
  if (response?.error) {
    throw new Error(response.error.message || '5G MCP 调用失败');
  }
  const text = response?.result?.content?.[0]?.text;
  if (typeof text !== 'string') return response?.result ?? {};
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

export function callFiveGMcp({
  socketPath = DEFAULT_FIVEG_SOCKET,
  name,
  args = {},
  timeoutMs = 8_000,
} = {}) {
  return new Promise((resolve, reject) => {
    const socket = createConnection(socketPath);
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`5G MCP ${name} 超时`));
    }, timeoutMs);
    let buffer = '';
    const finish = (error, value) => {
      clearTimeout(timer);
      socket.destroy();
      if (error) reject(error);
      else resolve(value);
    };
    socket.on('connect', () => {
      socket.write(`${JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name, arguments: args },
      })}\n`);
    });
    socket.on('data', (chunk) => {
      buffer += chunk;
      const end = buffer.indexOf('\n');
      if (end < 0) return;
      try {
        finish(null, parseToolResult(JSON.parse(buffer.slice(0, end))));
      } catch (error) {
        finish(error);
      }
    });
    socket.on('error', (error) => finish(error));
  });
}

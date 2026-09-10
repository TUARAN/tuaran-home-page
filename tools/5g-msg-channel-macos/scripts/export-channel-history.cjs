'use strict';
// Read history only. Never create a replacement session or replay a prompt.
const fs = require('node:fs'), path = require('node:path');
const AcpClient = require('../src/acp-client.cjs');
async function exportHistory({ sessionFile, port, output }) {
  const { sessionId } = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
  if (!sessionId || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('需要已存在的会话和本地 ACP 端口');
  const client = new AcpClient({ port, cwd: path.dirname(sessionFile), timeoutMs: 15000 });
  const messages = [];
  try {
    await client.connect(); client.sessionId = sessionId;
    await client.request('session/load', { sessionId, cwd: path.dirname(sessionFile), mcpServers: [] }, { onHistory: message => {
      const last = messages.at(-1);
      if (last?.role === message.role) last.text += message.text;
      else messages.push({ ...message });
    } });
    if (!messages.length) throw new Error('ACP 没有返回可恢复的历史正文；未生成空白成功报告');
    fs.mkdirSync(path.dirname(output), { recursive: true, mode: 0o700 });
    fs.writeFileSync(output, '# 手机渠道会话备份\n\n此文件为 ACP 返回的可恢复历史，不代表已导入 WorkBuddy 桌面聊天列表；不包含内部思考或工具参数。\n\n' + messages.map(m => `## ${m.role === 'user' ? '手机消息' : '助理回复'}\n\n${m.text}\n`).join('\n'), { mode: 0o600 });
    return { output, recoveredMessageGroups: messages.length, desktopSynced: false };
  } finally { await client.close(); }
}
if (require.main === module) {
  const [sessionFile, port, output] = process.argv.slice(2);
  exportHistory({ sessionFile, port: Number(port), output }).then(r => console.log(JSON.stringify(r))).catch(e => { console.error(e.message); process.exitCode = 1; });
}
module.exports = { exportHistory };

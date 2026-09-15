'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const root = path.resolve(__dirname, '..');
const file = path.join(os.homedir(), '.workbuddy', 'mcp.json');
const before = fs.readFileSync(file, 'utf8');
const data = JSON.parse(before);
if (!data.mcpServers || typeof data.mcpServers !== 'object') throw new Error('mcp.json 缺少 mcpServers');
const current = data.mcpServers['5g-msg-channel-macos'];
if (!current) throw new Error('找不到当前 5g-msg-channel-macos 配置');
if (!current.env?.MAAP_API_KEY_FILE || !current.env?.ALLOWED_SENDERS) throw new Error('当前连接器缺少 Key 文件或白名单配置');
data.mcpServers['5g-msg-channel-macos'] = { ...current, disabled: true };
data.mcpServers['5g-msg-channel-legacy-macos'] = {
  type: 'stdio',
  command: current.command || process.execPath,
  args: [path.join(root, 'src', 'mcp-client.cjs')],
  cwd: root,
  disabled: false,
  env: {
    BRIDGE_MODE: 'production',
    MAAP_WS_URL: current.env.MAAP_WS_URL,
    MAAP_API_KEY_FILE: current.env.MAAP_API_KEY_FILE,
    ENFORCE_WHITELIST: 'true',
    ALLOWED_SENDERS: current.env.ALLOWED_SENDERS,
    BRIDGE_DRY: '0',
    ACP_CWD: path.join(root, 'var', 'workspace'),
    BRIDGE_SOCKET: path.join(os.homedir(), '.workbuddy', '5g-legacy-macos.sock'),
  },
};
const after = JSON.stringify(data, null, 2) + '\n';
JSON.parse(after);
const backup = file + '.bak-legacy-switch-' + Date.now();
fs.writeFileSync(backup, before, { mode: 0o600, flag: 'wx' });
const temp = file + '.tmp-legacy-switch';
fs.writeFileSync(temp, after, { mode: 0o600 });
fs.renameSync(temp, file);
fs.chmodSync(file, 0o600);
console.log(JSON.stringify({ backup, currentDisabled: true, legacyEnabled: true, allowedSenderCount: current.env.ALLOWED_SENDERS.split(',').filter(Boolean).length }, null, 2));

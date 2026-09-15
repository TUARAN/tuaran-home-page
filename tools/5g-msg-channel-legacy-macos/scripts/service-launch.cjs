'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const config = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.workbuddy', 'mcp.json'), 'utf8'));
const entry = config.mcpServers?.['5g-msg-channel-legacy-macos'];
if (!entry || entry.disabled || entry.env?.BRIDGE_MODE !== 'production') {
  throw new Error('5g-msg-channel-legacy-macos 未配置、已禁用或不是 production');
}
Object.assign(process.env, entry.env);
process.argv.push('--production', '--daemon');
require('../src/index.cjs');

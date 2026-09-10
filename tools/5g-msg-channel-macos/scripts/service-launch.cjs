'use strict';
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const config = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.workbuddy/mcp.json'), 'utf8'));
const entry = config.mcpServers?.['5g-msg-channel-macos'];
if (!entry || entry.disabled || entry.env?.BRIDGE_MODE !== 'production') throw new Error('生产连接器未配置或已禁用');
Object.assign(process.env, entry.env);
process.argv.push('--production', '--daemon');
require('../src/index.cjs');

#!/usr/bin/env node
import { createServer } from 'node:http';
import { loadConfig, diagnoseConfig } from './config.mjs';
import { FileTokenStore } from './token-store.mjs';
import { WorkBuddyClient, MockWorkBuddyClient } from './workbuddy-client.mjs';
import { AcpClient, MockAcpClient } from './acp-client.mjs';
import { HardwareBridge } from './bridge.mjs';
import { createBridgeHandler } from './server.mjs';

const print = (value) => process.stdout.write(JSON.stringify(value, null, 2) + '\n');

async function main() {
  const command = process.argv[2] || 'help';
  const config = loadConfig();
  const tokenStore = new FileTokenStore(config.tokenFile);
  if (command === 'doctor') {
    const checks = diagnoseConfig(config);
    const ok = Object.values(checks).every((item) => item.ok);
    print({ ok, mode: config.mode, checks });
    process.exitCode = ok ? 0 : 1; return;
  }
  if (command !== 'start') {
    process.stdout.write('用法：workbuddy-acp-bridge <doctor|start>\n'); return;
  }
  const workbuddy = config.mode === 'mock'
    ? new MockWorkBuddyClient()
    : new WorkBuddyClient({ config, tokenStore });
  const acp = config.mode === 'mock' ? new MockAcpClient() : new AcpClient();
  const bridge = new HardwareBridge({ workbuddy, acp });
  const server = createServer(createBridgeHandler({ config, bridge, workbuddy, tokenStore }));
  server.listen(config.port, config.host, () => print({
    ok: true, mode: config.mode,
    url: 'http://' + config.host + ':' + config.port,
    deviceEndpoint: '/v1/device/events',
  }));
}

main().catch((error) => {
  print({ ok: false, error: error.message }); process.exitCode = 1;
});

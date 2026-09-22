#!/usr/bin/env node
import { createServer } from 'node:http';
import { loadConfig, diagnoseConfig } from './config.mjs';
import { FileTokenStore } from './token-store.mjs';
import { WorkBuddyClient, MockWorkBuddyClient, probeTokenCredentials } from './workbuddy-client.mjs';
import { AcpClient, MockAcpClient } from './acp-client.mjs';
import { HardwareBridge } from './bridge.mjs';
import { createBridgeHandler } from './server.mjs';
import { runOfficialProbe, writeProbeReport } from './probe.mjs';

const print = (value) => process.stdout.write(JSON.stringify(value, null, 2) + '\n');

async function main() {
  const command = process.argv[2] || 'help';
  const config = loadConfig();
  const tokenStore = new FileTokenStore(config.tokenFile);
  if (command === 'doctor') {
    const checks = diagnoseConfig(config);
    const token = config.mode === 'real'
      ? await probeTokenCredentials(config)
      : { ok: true, skipped: true };
    const ok = Object.values(checks).every((item) => item.ok) && token.ok;
    print({ ok, mode: config.mode, checks, token });
    process.exitCode = ok ? 0 : 1; return;
  }
  if (command === 'probe') {
    const workbuddy = config.mode === 'mock'
      ? new MockWorkBuddyClient()
      : new WorkBuddyClient({ config, tokenStore });
    const acp = config.mode === 'mock' ? new MockAcpClient() : new AcpClient();
    const report = await runOfficialProbe({
      config,
      tokenStore,
      workbuddy,
      acp,
      testPhone: config.testPhone,
      sendLocalMessage: process.argv.includes('--send-local-message'),
    });
    const path = await writeProbeReport(report);
    print({ ...report, reportPath: path });
    process.exitCode = report.ok ? 0 : 1;
    await acp.close?.();
    return;
  }
  if (command !== 'start') {
    process.stdout.write('用法：workbuddy-acp-bridge <doctor|probe|start>\n'); return;
  }
  const workbuddy = config.mode === 'mock'
    ? new MockWorkBuddyClient()
    : new WorkBuddyClient({ config, tokenStore });
  const acp = config.mode === 'mock' ? new MockAcpClient() : new AcpClient();
  const bridge = new HardwareBridge({ workbuddy, acp });
  const handler = createBridgeHandler({ config, bridge, workbuddy, tokenStore });
  const ui = createServer(handler);
  const started = [];
  const listen = (server, host, port, role) => new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      started.push({ role, listening: 'http://' + host + ':' + port });
      resolve();
    });
  });
  await listen(ui, config.host, config.port, 'ui');
  if (config.oauthListen) {
    const same = config.oauthListen.hostname === config.host
      && config.oauthListen.listenPort === config.port;
    if (!same) {
      const oauth = createServer(handler);
      try {
        await listen(oauth, config.oauthListen.hostname, config.oauthListen.listenPort, 'oauth');
      } catch (error) {
        oauth.close();
        if (error.code !== 'EADDRINUSE') throw error;
      }
    }
  }
  print({
    ok: true, mode: config.mode,
    url: 'http://' + config.host + ':' + config.port,
    entry: config.oauthListen ? 'local-oauth' : 'fiveg-clawbot',
    oauthCallback: config.redirectUri,
    deviceEndpoint: '/v1/device/events',
    listening: started,
  });
}

main().catch((error) => {
  print({ ok: false, error: error.message }); process.exitCode = 1;
});

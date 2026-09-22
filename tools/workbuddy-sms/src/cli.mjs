#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.mjs';
import { SqliteStore } from './store.mjs';
import { createAgent } from './agent.mjs';
import { createChannel } from './channel.mjs';
import { SmsBridge } from './bridge.mjs';
import { createBridgeServer } from './server.mjs';
import { pollForever } from './poller.mjs';
import { WORKBUDDY_5G_HTTP, loadFiveGCallbackKey } from './workbuddy-5g-http.mjs';
import { describeCapabilityMatrix } from './capability-matrix.mjs';
import { compareAgentsFromConfig, compareSmsBackends, HARMLESS_SMS } from './compare.mjs';

function print(value) { process.stdout.write(`${JSON.stringify(value, null, 2)}\n`); }

async function build() {
  const { config, path } = await loadConfig();
  const store = await new SqliteStore(config.storage.path).open();
  const agent = createAgent(config.agent);
  const channel = createChannel(config.channel);
  return { config, path, store, agent, channel, bridge: new SmsBridge({ config, store, agent, channel }) };
}

async function main() {
  const command = process.argv[2] ?? 'help';
  if (command === 'init') {
    const target = resolve(process.argv[3] ?? './workbuddy-sms.config.json');
    const source = fileURLToPath(new URL('../workbuddy-sms.config.example.json', import.meta.url));
    await mkdir(dirname(target), { recursive: true });
    try {
      await copyFile(source, target, 0x1);
      print({ ok: true, config: target, next: '编辑 allowedSenders，设置 WORKBUDDY_SMS_RELAY_SECRET，然后运行 doctor' });
    } catch (error) {
      if (error.code === 'EEXIST') throw new Error(`配置文件已存在：${target}`);
      throw error;
    }
    return;
  }
  if (command === 'doctor') {
    const app = await build();
    const checks = {
      config: { ok: true, path: app.path },
      allowedSender: { ok: app.config.policy.allowedSenders.length > 0 },
    };
    if (app.config.channel.provider === 'fiveg') {
      checks.callbackKey = { ok: Boolean(loadFiveGCallbackKey()) };
    } else {
      checks.relaySecret = { ok: Boolean(process.env.WORKBUDDY_SMS_RELAY_SECRET) };
    }
    try { checks.agent = { ok: true, details: await app.agent.health() }; } catch (error) { checks.agent = { ok: false, error: error.message }; }
    try { checks.channel = await app.channel.health(); } catch (error) { checks.channel = { ok: false, error: error.message }; }
    const live = {};
    if (checks.agent?.ok) {
      const selected = app.config.agent.mode;
      if (selected === 'codebuddy') live['codebuddy-cli'] = { available: true };
      if (selected === 'local-acp') live['local-acp'] = { available: true };
      if (selected === 'workbuddy-acp') live['official-acp'] = { available: true };
    }
    const matrix = describeCapabilityMatrix(app.config.agent.mode, live);
    const ok = Object.values(checks).every((item) => item.ok);
    print({
      ok,
      agentMode: app.config.agent.mode,
      smsAsEntry: true,
      smsAsTool: false,
      checks,
      matrix,
    });
    process.exitCode = ok ? 0 : 1;
    return;
  }
  if (command === 'simulate') {
    const app = await build();
    const text = process.argv.slice(3).join(' ').trim();
    if (!text) throw new Error('用法：workbuddy-sms simulate <短信正文>');
    const senderId = app.config.policy.allowedSenders[0];
    if (!senderId) throw new Error('请先配置 policy.allowedSenders');
    print(await app.bridge.handle({ eventId: `sim:${randomUUID()}`, senderId, text, receivedAt: Date.now() }));
    return;
  }
  if (command === 'compare') {
    const { config } = await loadConfig();
    const text = process.argv.slice(3).join(' ').trim() || HARMLESS_SMS;
    const report = await compareSmsBackends({
      text,
      agents: compareAgentsFromConfig(config),
    });
    print(report);
    const expected = ['codebuddy-cli', 'local-acp', 'official-acp'];
    process.exitCode = expected.every((id) => report.results.some((item) => item.id === id)) ? 0 : 1;
    return;
  }
  if (command === 'start') {
    const app = await build();
    if (app.config.channel.provider === 'relay') {
      print({ ok: true, mode: 'outbound-poll', relay: app.config.channel.relayBaseUrl });
      await pollForever({
        bridge: app.bridge,
        channel: app.channel,
        intervalMs: app.config.channel.pollIntervalMs,
        onResult: (result) => {
          if (!result.idle) process.stderr.write(`${JSON.stringify(result)}\n`);
        },
      });
      return;
    }
    if (app.config.channel.provider === 'fiveg') {
      const callbackKey = loadFiveGCallbackKey();
      if (!callbackKey) throw new Error('缺少 WORKBUDDY_5G_CALLBACK_KEY 或 MAAP_API_KEY_FILE');
      const host = app.config.channel.callbackHost;
      const port = app.config.channel.callbackPort;
      const server = createBridgeServer({ ...app, callbackKey });
      server.listen(port, host, () => {
        print({
          ok: true,
          mode: 'fiveg',
          simulator: false,
          listening: `http://${host}:${port}/workbuddy/api`,
          http: WORKBUDDY_5G_HTTP,
          clawbot: app.config.channel.clawbotBaseUrl,
          socketPath: app.config.channel.socketPath,
        });
      });
      return;
    }
    if (!process.env.WORKBUDDY_SMS_RELAY_SECRET) throw new Error('缺少 WORKBUDDY_SMS_RELAY_SECRET');
    const server = createBridgeServer(app);
    server.listen(app.config.listen.port, app.config.listen.host, () => {
      print({ ok: true, listening: `http://${app.config.listen.host}:${app.config.listen.port}`, endpoints: ['/health', '/v1/events'] });
    });
    return;
  }
  process.stdout.write('用法：workbuddy-sms <init|doctor|simulate|compare|start>\n');
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exitCode = 1;
});

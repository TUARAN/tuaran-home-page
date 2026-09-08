import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseConfig, loadConfig } from '../src/config.mjs';

test('仅允许回环监听', () => {
  assert.throws(() => loadConfig({ WORKBUDDY_BRIDGE_HOST: '0.0.0.0' }), /回环地址/);
});

test('real 模式检查凭据、设备密钥和最小 scope', () => {
  const config = loadConfig({
    WORKBUDDY_BRIDGE_MODE: 'real',
    WORKBUDDY_CLIENT_ID: 'app-1',
    WORKBUDDY_CLIENT_SECRET: 'secret',
    WORKBUDDY_BRIDGE_KEY: '123456789012345678901234',
  });
  const checks = diagnoseConfig(config);
  assert.ok(Object.values(checks).every((item) => item.ok));
});

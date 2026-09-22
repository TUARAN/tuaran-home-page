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
    WORKBUDDY_REDIRECT_URI: 'https://5gvas01.cmicmaap.com/gtw-ai/workbuddy/api',
  });
  const checks = diagnoseConfig(config);
  assert.ok(Object.values(checks).every((item) => item.ok));
  assert.equal(config.oauthListen, null);
});

test('凭据会去掉首尾空格和包裹引号', () => {
  const config = loadConfig({
    WORKBUDDY_CLIENT_ID: ' cb_test ',
    WORKBUDDY_CLIENT_SECRET: '"official-secret"',
    WORKBUDDY_REDIRECT_URI: 'https://5gvas01.cmicmaap.com/gtw-ai/workbuddy/api',
  });
  assert.equal(config.clientId, 'cb_test');
  assert.equal(config.clientSecret, 'official-secret');
});

test('5G 生产回调可登记，本机不监听该地址', () => {
  const config = loadConfig({
    WORKBUDDY_REDIRECT_URI: 'https://5gvas01.cmicmaap.com/gtw-ai/workbuddy/api',
  });
  assert.equal(config.oauthListen, null);
  assert.equal(diagnoseConfig(config).redirectUri.ok, true);
});

test('线上本机 5G 回调在 8080 收授权码', () => {
  const config = loadConfig({
    WORKBUDDY_BRIDGE_MODE: 'real',
    WORKBUDDY_CLIENT_ID: 'app-1',
    WORKBUDDY_CLIENT_SECRET: 'secret',
    WORKBUDDY_BRIDGE_KEY: '123456789012345678901234',
    WORKBUDDY_BRIDGE_PORT: '8080',
    WORKBUDDY_REDIRECT_URI: 'http://localhost:8080/workbuddy/api',
  });
  assert.equal(config.port, 8080);
  assert.equal(config.oauthListen.listenPort, 8080);
  assert.equal(config.oauthListen.pathname, '/workbuddy/api');
  assert.equal(diagnoseConfig(config).redirectUri.localListen, true);
});

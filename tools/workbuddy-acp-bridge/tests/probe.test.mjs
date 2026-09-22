import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MockAcpClient } from '../src/acp-client.mjs';
import { MockWorkBuddyClient, parseScopes, unwrapWorkBuddyBody } from '../src/workbuddy-client.mjs';
import { runOfficialProbe, writeProbeReport } from '../src/probe.mjs';

test('unwrap 同时接受扁平任务和 data 包裹', () => {
  assert.equal(unwrapWorkBuddyBody({ task_id: 't1' }).task_id, 't1');
  assert.equal(unwrapWorkBuddyBody({ data: { online: true } }).online, true);
  assert.deepEqual(parseScopes('user.task.readable  user.task.invokable'), [
    'user.task.readable',
    'user.task.invokable',
  ]);
});

test('mock probe 脱敏写入 capability-probe.json 且不包含 token', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'acp-probe-'));
  const workbuddy = new MockWorkBuddyClient();
  const acp = new MockAcpClient();
  const report = await runOfficialProbe({
    config: { mode: 'mock' },
    workbuddy,
    acp,
  });
  assert.equal(report.ok, true);
  assert.ok(report.scopes.includes('user.task.readable'));
  assert.equal(report.checks.find((item) => item.name === 'getTask').hasToken, true);
  assert.equal(report.checks.find((item) => item.name === 'acp').ok, true);
  assert.equal(report.checks.find((item) => item.name === 'localassistant').skipped, true);
  const path = await writeProbeReport(report, cwd);
  const saved = await readFile(path, 'utf8');
  assert.doesNotMatch(saved, /mock-acp-token/);
  assert.match(saved, /official-acp/);
  await acp.close();
});

test('具备本地助理 scope 时探测在线状态', async () => {
  const workbuddy = new MockWorkBuddyClient({
    scopes: [
      'user.task.readable',
      'user.task.invokable',
      'user.localassistant.readable',
      'user.localassistant.invokable',
    ],
    localAssistantOnline: true,
  });
  const acp = new MockAcpClient();
  const report = await runOfficialProbe({
    config: { mode: 'mock' },
    workbuddy,
    acp,
    sendLocalMessage: true,
  });
  const local = report.checks.find((item) => item.name === 'localassistant');
  assert.equal(local.ok, true);
  assert.equal(local.online, true);
  assert.equal(local.historyCount, 0);
  assert.equal(local.sentMessage, true);
  await acp.close();
});

test('具备联系方式 scope 时只报告手机号匹配结果', async () => {
  const workbuddy = new MockWorkBuddyClient({
    scopes: ['user.task.readable', 'user.task.invokable', 'user.contact.readable'],
  });
  const acp = new MockAcpClient();
  const report = await runOfficialProbe({
    config: { mode: 'mock' },
    workbuddy,
    acp,
    testPhone: '+8613812345678',
  });
  const phone = report.checks.find((item) => item.name === 'phoneVerification');
  assert.equal(phone.ok, true);
  assert.equal(phone.matched, true);
  assert.doesNotMatch(JSON.stringify(report), /13812345678/);
  await acp.close();
});

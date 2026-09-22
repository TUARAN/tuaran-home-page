import assert from 'node:assert/strict';
import test from 'node:test';
import { MockAgent } from '../src/agent.mjs';
import { BACKEND_MATRIX, describeCapabilityMatrix } from '../src/capability-matrix.mjs';
import { compareSmsBackends } from '../src/compare.mjs';

test('capability matrix keeps MCP/CLI/ACP as separate backends and never mixes connector packages', () => {
  assert.equal(BACKEND_MATRIX.length, 3);
  assert.deepEqual(BACKEND_MATRIX.map((item) => item.id), ['codebuddy-cli', 'local-acp', 'official-acp']);
  assert.equal(BACKEND_MATRIX.every((item) => item.smsAsEntry && item.smsAsTool === false), true);
  const described = describeCapabilityMatrix('workbuddy-acp', { 'official-acp': { available: true } });
  assert.equal(described.find((item) => item.id === 'official-acp').selected, true);
  assert.equal(described.find((item) => item.id === 'codebuddy-cli').selected, false);
});

test('compare runs the same SMS against CLI, local ACP and official ACP adapters', async () => {
  const report = await compareSmsBackends({
    text: '请只回复 PING，不要调用工具。',
    agents: {
      'codebuddy-cli': {
        async health() { return { data: { mode: 'codebuddy' } }; },
        async run({ text }) { return { runId: 'cli-1', text: `CLI:${text.slice(0, 4)}` }; },
      },
      'local-acp': {
        async health() { return { data: { mode: 'local-acp' } }; },
        async run({ text }) { return { runId: 'acp-1', text: `DESKTOP:${text.slice(0, 4)}` }; },
      },
      'official-acp': {
        async health() { return { data: { mode: 'workbuddy-acp' } }; },
        async run({ text }) { return { runId: 'cloud-1', text: `CLOUD:${text.slice(0, 4)}` }; },
      },
    },
  });
  assert.equal(report.connectorFusion.allowed, false);
  assert.equal(report.results.length, 3);
  assert.deepEqual(report.results.map((item) => item.id), ['codebuddy-cli', 'local-acp', 'official-acp']);
  assert.equal(report.results[0].entersDesktopChat, false);
  assert.equal(report.results[1].entersDesktopChat, true);
  assert.equal(report.results[2].runsWithoutDesktop, true);
  assert.equal(report.results[2].sessionLocation, 'workbuddy-cloud-task');
});

test('compare records skipped backends without failing the whole matrix', async () => {
  const report = await compareSmsBackends({
    agents: {
      'codebuddy-cli': new MockAgent(),
      'local-acp': { async health() { throw new Error('本机 ACP 不可用：HTTP 404'); } },
      'official-acp': { async health() { throw new Error('缺少 WORKBUDDY_BRIDGE_KEY'); } },
    },
  });
  assert.equal(report.results[0].ok, true);
  assert.equal(report.results[1].skipped, true);
  assert.equal(report.results[2].skipped, true);
  assert.match(report.results[0].text, /模拟专家已处理/);
});

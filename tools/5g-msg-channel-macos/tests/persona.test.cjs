'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildPersona } = require('../src/persona.cjs');
const AcpClient = require('../src/acp-client.cjs');

function temp(t) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), '5g-persona-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true })); return dir; }

test('buildPersona：默认禁用（PERSONA_ENABLED 非 1 返回 null）', () => {
  assert.equal(buildPersona({ PERSONA_DIR: os.tmpdir() }), null);
  assert.equal(buildPersona({ PERSONA_ENABLED: '0' }), null);
});

test('buildPersona：空模板档案只注入渠道说明 + 渠道约束', t => {
  const dir = temp(t);
  // 写入空模板 IDENTITY（含模板占位特征句），应被跳过
  fs.writeFileSync(path.join(dir, 'IDENTITY.md'), '---\nsummary: x\n---\n_Fill this in during your first conversation._\n- **Name:**');
  const p = buildPersona({ PERSONA_ENABLED: '1', PERSONA_DIR: dir });
  assert.ok(p.includes('独立渠道会话'), '渠道说明应存在');
  assert.ok(p.includes('300 字以内'), '渠道约束应存在');
  assert.ok(!p.includes('_Fill this in'), '空模板不应被注入');
});

test('buildPersona：有实质档案时注入档案段', t => {
  const dir = temp(t);
  fs.writeFileSync(path.join(dir, 'USER.md'), '---\nsummary: x\n---\n- **Name:** 张三\n- **City:** 北京');
  const p = buildPersona({ PERSONA_ENABLED: '1', PERSONA_DIR: dir });
  assert.ok(p.includes('==== USER.md ===='), '应包含档案段标题');
  assert.ok(p.includes('张三'), '应包含档案正文');
});

test('AcpClient：优先 session/load，失败回退 session/new', async () => {
  const calls = [];
  const c = new AcpClient({ port: 1, cwd: '/x', preferredSessionId: 'OLD' });
  c.connect = async () => ({});
  c.connectionId = 'conn';
  c.request = async (method) => {
    calls.push(method);
    if (method === 'session/load') throw new Error('session not found');
    if (method === 'session/new') return { sessionId: 'FRESH', modes: { currentModeId: 'default' } };
  };
  await c.ensureSession();
  assert.deepEqual(calls, ['session/load', 'session/new']);
  assert.equal(c.sessionId, 'FRESH');
});

test('AcpClient：load 成功复用原 sessionId', async () => {
  const c = new AcpClient({ port: 1, cwd: '/x', preferredSessionId: 'OLD' });
  c.connect = async () => ({});
  c.connectionId = 'conn';
  c.request = async (method) => {
    if (method === 'session/load') return { modes: { currentModeId: 'default' } };
    throw new Error('不应调用 ' + method);
  };
  await c.ensureSession();
  assert.equal(c.sessionId, 'OLD');
});

test('AcpClient：人格仅在会话内首次 prompt 注入', async () => {
  const c = new AcpClient({ port: 1, cwd: '/x', persona: '我是人格' });
  c.connect = async () => ({});
  c.connectionId = 'conn';
  const prompts = [];
  c.request = async (method, params) => {
    if (method === 'session/new') return { sessionId: 'N', modes: { currentModeId: 'default' } };
    if (method === 'session/prompt') { prompts.push(params.prompt); return { stopReason: 'end_turn' }; }
  };
  await c.prompt('一');
  await c.prompt('二');
  assert.equal(prompts.length, 2);
  assert.equal(prompts[0].length, 2, '首次应含人格 + 用户消息两条');
  assert.equal(prompts[0][0].text, '我是人格');
  assert.equal(prompts[1].length, 1, '后续不再重复注入人格');
  assert.equal(prompts[1][0].text, '二');
});

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PassThrough } = require('node:stream');
const { settings, assertAllowed, senderDirectory } = require('../src/policy.cjs');
const Bridge = require('../src/bridge.cjs');
const { attach } = require('../src/mcp-server.cjs');
const { configure } = require('../scripts/configure.cjs');
function temp(t) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), '5g-test-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true })); return dir; }
test('默认模拟+DRY，空白名单/明文网关/混合模式拒绝', t => {
 const cwd = temp(t), env = { ACP_CWD: cwd };
 const config = settings(env, []); assert.equal(config.production, false); assert.equal(config.dry, true);
 assert.throws(() => settings({ ...env, ALLOWED_SENDERS: ' ' }, []));
 assert.throws(() => settings({ ...env, ENFORCE_WHITELIST: 'false' }, []));
 assert.throws(() => settings({ ...env, MOCK_WS_URL: 'ws://example.com' }, []));
 assert.throws(() => settings(env, ['--production', '--mock']));
 assert.throws(() => settings({ ...env, MAAP_WS_URL: 'ws://5gvas01.cmicmaap.com', ALLOWED_SENDERS: 'a', MAAP_API_KEY: 'fake' }, ['--production']));
});
test('上行及主动下发都执行白名单，DRY 全路径不写网关', async t => {
 const workdir = temp(t); let sent = 0;
 const b = new Bridge({ config: { allowed: ['a'], dry: true, workdir }, maap: { sendReply() { sent++; } }, makeClient: () => ({ prompt: async (_, o) => { o.onText('hello'); return { stopReason: 'end_turn' }; }, status: () => ({}), close: async () => {} }) });
 assert.throws(() => b.enqueue({ id: '1', replyTarget: 'outsider', text: 'hi' }));
 await assert.rejects(() => b.send('outsider', 'hi'));
 assert.equal((await b.send('a', 'hi')).status, 'dry_run');
 b.enqueue({ id: '1', replyTarget: 'a', text: 'hi' });
 await new Promise(r => setImmediate(r)); assert.equal(b.processed, 1); assert.equal(sent, 0);
});
test('不同号码不同目录和会话，同一消息去重', async t => {
 const workdir = temp(t), dirs = [];
 const b = new Bridge({ config: { allowed: ['a', 'b'], dry: true, workdir }, makeClient: dir => { dirs.push(dir); return { prompt: async (_, o) => { o.onText('ok'); return { stopReason: 'end_turn' }; }, status: () => ({}), close: async () => {} }; } });
 const message = { id: 'same', replyTarget: 'a', text: 'hello' };
 assert.equal(b.enqueue(message), true); assert.equal(b.enqueue(message), false);
 b.enqueue({ ...message, replyTarget: 'b' }); await new Promise(r => setImmediate(r));
 assert.equal(dirs.length, 2); assert.notEqual(dirs[0], dirs[1]);
 assert.ok(senderDirectory(workdir, '../../outside').startsWith(workdir + '/'));
});
test('任务失败不自动重放，不伪报成功', async t => {
 let calls = 0; const b = new Bridge({ config: { allowed: ['a'], workdir: temp(t), dry: true }, makeClient: () => ({ prompt: async () => { calls++; throw new Error('timeout'); }, status: () => ({}) }) });
 b.enqueue({ id: 'x', replyTarget: 'a', text: 'hi' }); await new Promise(r => setImmediate(r));
 assert.equal(calls, 1); assert.equal(b.failed, 1); assert.equal(b.processed, 0);
});
test('配置合并保留既有服务，预览不写入，应用生成合法 JSON 与备份', t => {
 const dir = temp(t), target = path.join(dir, 'mcp.json');
 const prior = { mcpServers: { existing: { env: { SECRET: 'do-not-print' } } }, other: true };
 fs.writeFileSync(target, JSON.stringify(prior));
 const preview = configure({ target }); assert.ok(!preview.diff.includes('do-not-print'));
 assert.deepEqual(JSON.parse(fs.readFileSync(target)), prior);
 const result = configure({ target, apply: true }); assert.equal(result.jsonValid, true);
 const data = JSON.parse(fs.readFileSync(target)); assert.deepEqual(data.mcpServers.existing, prior.mcpServers.existing);
 assert.ok(data.mcpServers['5g-msg-channel-macos'].args.includes('--mock'));
 assert.ok(fs.readdirSync(dir).some(x => x.includes('.bak-')));
 assert.equal(fs.statSync(target).mode & 0o777, 0o600);
});
test('MCP 状态保留 ACP 失败，不假报 ready；工具错误符合 MCP', async () => {
 const input = new PassThrough(), output = new PassThrough(); let text = '';
 output.on('data', x => text += x);
 const m = attach({ input, output, shutdown() {}, status: () => ({ runtimeReady: false, acpError: 'offline' }), send: async () => { throw new Error('blocked'); } });
 await m.handle({ id: 1, method: 'tools/call', params: { name: 'bridge_status' } });
 await m.handle({ id: 2, method: 'tools/call', params: { name: 'send_5g' } });
 const [status, error] = text.trim().split('\n').map(JSON.parse);
 assert.equal(JSON.parse(status.result.content[0].text).runtimeReady, false); assert.equal(error.result.isError, true); m.close();
});
test('生产迁移复用凭据、加入确认号码、停用旧条目，diff 不泄漏 Key', t => {
 const { migrate }=require('../scripts/production.cjs');const home=temp(t),dir=path.join(home,'.workbuddy');fs.mkdirSync(dir);
 const file=path.join(dir,'mcp.json'),prior={mcpServers:{other:{command:'unchanged'},'5gmsg-channel':{env:{MAAP_API_KEY:'PRIVATE_TEST_KEY',ALLOWED_SENDERS:'11111111111'}}}};
 fs.writeFileSync(file,JSON.stringify(prior));
 const preview=migrate({home,number:'19802021453'});assert.ok(!preview.diff.includes('PRIVATE_TEST_KEY'));assert.deepEqual(JSON.parse(fs.readFileSync(file)),prior);
 const result=migrate({home,number:'19802021453',apply:true});const data=JSON.parse(fs.readFileSync(file));
 assert.equal(data.mcpServers['5gmsg-channel'].disabled,true);assert.deepEqual(data.mcpServers.other,prior.mcpServers.other);
 assert.equal(data.mcpServers['5g-msg-channel-macos'].env.BRIDGE_DRY,'0');assert.ok(data.mcpServers['5g-msg-channel-macos'].env.ALLOWED_SENDERS.includes('19802021453'));
 assert.equal(fs.statSync(path.join(dir,'5g-macos-key')).mode&0o777,0o600);assert.ok(fs.existsSync(result.backup));
 assert.equal(data.mcpServers['5g-msg-channel-macos'].env.BRIDGE_BACKEND,'desktop');
 migrate({home,number:'19802021453',apply:true});
 assert.equal(JSON.parse(fs.readFileSync(file)).mcpServers['5g-msg-channel-macos'].env.BRIDGE_BACKEND,'desktop');
});
test('ACP 失败给手机一次明确反馈，并记录失败阶段',async t=>{
 const sent=[];const b=new Bridge({config:{allowed:['a'],workdir:temp(t),dry:false},maap:{sendReply:async(to,text)=>sent.push({to,text})},makeClient:()=>({prompt:async()=>{throw new Error('fetch failed');},status:()=>({ready:false})})});
 b.enqueue({id:'one',replyTarget:'a',text:'hello'});await new Promise(r=>setImmediate(r));
 assert.equal(b.received,1);assert.equal(b.failed,1);assert.equal(sent.length,1);assert.match(sent[0].text,/处理失败/);assert.equal(b.lastTask.state,'failed');
});
test('回复下发结果未知时不追加错误短信，防止重复发送',async t=>{
 let sends=0;const b=new Bridge({config:{allowed:['a'],workdir:temp(t),dry:false},maap:{sendReply:async()=>{sends++;throw new Error('unknown delivery');}},makeClient:()=>({prompt:async(_,o)=>{o.onText('answer');return{stopReason:'end_turn'};},status:()=>({})})});
 b.enqueue({id:'one',replyTarget:'a',text:'hello'});await new Promise(r=>setImmediate(r));assert.equal(sends,1);assert.equal(b.failed,1);
});

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { WebSocketServer, WebSocket } = require('ws');
const AcpClient = require('../src/acp-client.cjs');
const MaapClient = require('../src/maap-client.cjs');
async function fixture(t, handler) {
 const server = http.createServer(handler);
 await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
 t.after(() => { server.closeAllConnections(); server.close(); }); return server.address().port;
}
test('ACP SSE 中文分片、正文过滤、权限拒绝与连接清理', async t => {
 let denied = false, deleted = false;
 const port = await fixture(t, async (req, res) => {
  if (req.method === 'DELETE') { deleted = true; res.end('{}'); return; }
  if (req.url.endsWith('/connect')) { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ connectionId: 'test' })); return; }
  let raw = ''; for await (const c of req) raw += c;
  const msg = JSON.parse(raw);
  res.setHeader('content-type', 'text/event-stream');
  const emit = value => res.write('data: ' + JSON.stringify(value) + '\n\n');
  if (msg.method === 'initialize') emit({ id: msg.id, result: { protocolVersion: 1 } });
  else if (msg.method === 'session/new') emit({ id: msg.id, result: { sessionId: 'isolated' } });
  else if (msg.id === 'permission-1') { denied = msg.result.outcome.outcome === 'cancelled'; }
  else if (msg.method === 'session/prompt') {
   emit({ method: 'session/update', params: { sessionId: 'isolated', _meta: { 'codebuddy.ai': { mode: 'history' } }, update: { sessionUpdate: 'user_message_chunk', content: { type: 'text', text: '历史提问' } } } });
   emit({ method: 'session/update', params: { sessionId: 'isolated', _meta: { 'codebuddy.ai': { mode: 'history' } }, update: { sessionUpdate: 'agent_thought_chunk', content: { type: 'text', text: 'PRIVATE_HISTORY_THOUGHT' } } } });
   emit({ id: 'permission-1', method: 'session/request_permission', params: { options: [{ optionId: 'allow', kind: 'allow_once' }] } });
   emit({ method: 'session/update', params: { sessionId: 'isolated', update: { sessionUpdate: 'agent_thought_chunk', content: { type: 'text', text: 'SECRET_THOUGHT' } } } });
   const data = Buffer.from('data: ' + JSON.stringify({ method: 'session/update', params: { sessionId: 'isolated', update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: '中文正文' } } } }) + '\n\n');
   for (const byte of data) res.write(Buffer.from([byte]));
   emit({ id: msg.id, result: { stopReason: 'end_turn' } });
  }
  res.end();
 });
 const events = [];
 const client = new AcpClient({ port, cwd: '/private/tmp', timeoutMs: 2000, onEvent: event => events.push(event) });
 const history = [];
 let text = ''; await client.prompt('test', { onText: value => text += value, onHistory: value => history.push(value) });
 assert.deepEqual(history, [{ role: 'user', text: '历史提问' }]);
 assert.equal(client.status().backend, 'workbuddy-local-acp');
 assert.equal(client.status().phase, 'completed');
 assert.equal(client.status().eventCounts.agent_thought_chunk, 1);
 assert.equal(client.status().eventCounts.agent_message_chunk, 1);
 assert.equal(JSON.stringify(events).includes('SECRET_THOUGHT'), false);
 assert.equal(JSON.stringify(client.status()).includes('中文正文'), false);
 assert.equal(text, '中文正文'); assert.equal(denied, true); assert.equal(client.permissionsDenied, 1);
 await client.close(); assert.equal(deleted, true);
});
test('ACP HTTP 失败清理连接、无结果流失败，不挂死或误报 ready', async t => {
 const port = await fixture(t, (req, res) => {
  if (req.url.endsWith('/connect')) { res.setHeader('content-type', 'application/json'); res.end('{"connectionId":"test"}'); }
  else { res.statusCode = req.method === 'DELETE' ? 200 : 403; res.end(); }
 });
 const client = new AcpClient({ port, timeoutMs: 1000 });
 await assert.rejects(() => client.ensureSession(), /403/); assert.equal(client.ready, false); assert.equal(client.connectionId, null);
});
test('真实 WS 协议：认证前拒收，认证后本地写出仅为 ws_sent', async t => {
 const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 });
 await new Promise((resolve, reject) => { wss.once('listening', resolve); wss.once('error', reject); });
 t.after(() => { for (const ws of wss.clients) ws.terminate(); wss.close(); });
 const log = { info() {}, warn() {}, error() {}, debug() {} }; let delivered, clientSocket, messages = [];
 const received = new Promise(resolve => wss.on('connection', ws => {
  clientSocket = ws; ws.send(JSON.stringify({ type: 'text_message', from: 'a', content: 'preauth' }));
  ws.on('message', raw => {
   const data = JSON.parse(raw);
   if (data.type === 'auth') { ws.send(JSON.stringify({ type: 'auth_ok' })); ws.send(JSON.stringify({ type: 'text_message', from: 'a', content: 'postauth' })); }
   if (data.type === 'send') { delivered = data; resolve(); }
   if (data.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
  });
 }));
 const client = new MaapClient({ wsUrl: `ws://127.0.0.1:${wss.address().port}`, apiKey: 'test', logger: log });
 t.after(() => client.stop()); client.onMessage = msg => messages.push(msg.text);
 await new Promise(resolve => { client.onConnect = resolve; client.start(); });
 const result = await client.sendReply('a', 'test'); await received;
 assert.equal(result.status, 'ws_sent'); assert.equal(result.gatewayAccepted, null); assert.equal(result.delivered, null);
 assert.deepEqual(messages, ['postauth']); assert.equal(delivered.content, 'test'); assert.equal(clientSocket.readyState, WebSocket.OPEN);
});
test('入口集成：MCP 握手 + 模拟上行 → ACP → 模拟下行，进程退出清理', async t => {
 const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), { spawn } = require('node:child_process');
 const dir = fs.mkdtempSync(path.join(os.tmpdir(), '5g-e2e-')); t.after(() => fs.rmSync(dir, {recursive:true,force:true}));
 const port = await fixture(t, async (req,res) => {
  if(req.method==='DELETE'){res.end('{}');return;}
  res.setHeader('content-type','application/json');
  if(req.url.endsWith('/connect')){res.end('{"connectionId":"e2e"}');return;}
  let raw='';for await(const c of req)raw+=c;const msg=JSON.parse(raw);
  if(msg.method==='session/prompt'){
   res.setHeader('content-type','text/event-stream');
   res.write('data: '+JSON.stringify({method:'session/update',params:{sessionId:'s1',update:{sessionUpdate:'agent_message_chunk',content:{type:'text',text:'E2E_OK'}}}})+'\n\n');
   res.end('data: '+JSON.stringify({id:msg.id,result:{stopReason:'end_turn'}})+'\n\n');return;
  }
  res.end(JSON.stringify({id:msg.id,result:msg.method==='session/new'?{sessionId:'s1'}:{protocolVersion:1}}));
 });
 const wss=new WebSocketServer({host:'127.0.0.1',port:0});await new Promise(r=>wss.on('listening',r));
 t.after(()=>{for(const ws of wss.clients)ws.terminate();wss.close();});
 let received;
 const delivery=new Promise(resolve=>wss.on('connection',ws=>ws.on('message',raw=>{
  const f=JSON.parse(raw);
  if(f.type==='auth'){ws.send('{"type":"auth_ok"}');ws.send(JSON.stringify({type:'text_message',from:'test-sender',messageId:'e2e',content:'reply'}));}
  if(f.type==='ping')ws.send('{"type":"pong"}');
  if(f.type==='send'){received=f;resolve();}
 })));
 const child=spawn(process.execPath,[path.join(__dirname,'../src/index.cjs'),'--mock'],{env:{...process.env,ACP_PORT:String(port),ACP_CWD:dir,MOCK_WS_URL:`ws://127.0.0.1:${wss.address().port}/ws`,BRIDGE_DRY:'0',ALLOWED_SENDERS:'test-sender'},stdio:['pipe','pipe','pipe']});
 t.after(()=>child.kill('SIGTERM'));let stdout='';child.stdout.on('data',x=>stdout+=x);child.stderr.resume();
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05'}})+'\n');
 const timeout=setTimeout(()=>child.kill('SIGTERM'),5000);t.after(()=>clearTimeout(timeout));
 await Promise.race([delivery,new Promise((_,reject)=>child.on('exit',()=>reject(new Error('child exited before reply'))))]);
 assert.equal(received.content,'E2E_OK');assert.equal(JSON.parse(stdout.trim().split('\n')[0]).result.serverInfo.name,'5g-msg-channel-macos');
 const exit=new Promise(resolve=>child.on('exit',resolve));child.stdin.end();await exit;
});
test('ACP 拒绝继承绕过权限模式，空结果流与超时均报错', async t => {
 let mode='bypassPermissions';
 const port=await fixture(t,async(req,res)=>{
  if(req.method==='DELETE'){res.end('{}');return;}
  if(req.url.endsWith('/connect')){res.setHeader('content-type','application/json');res.end('{"connectionId":"x"}');return;}
  let raw='';for await(const c of req)raw+=c;const msg=JSON.parse(raw);
  if(msg.method==='timeout'){return;}
  if(msg.method==='empty'){res.setHeader('content-type','text/event-stream');res.end(': keepalive\n\n');return;}
  res.setHeader('content-type','application/json');res.end(JSON.stringify({id:msg.id,result:msg.method==='session/new'?{sessionId:'x',modes:{currentModeId:mode}}:{protocolVersion:1}}));
 });
 const client=new AcpClient({port,timeoutMs:1000});
 await assert.rejects(()=>client.ensureSession(),/default/);assert.equal(client.ready,false);
 mode='default';await client.ensureSession();
 await assert.rejects(()=>client.request('empty',{}),/without result/);
 await assert.rejects(()=>client.request('timeout',{}, {timeoutMs:30}),/timeout/);
 await client.close();
});
test('业务 error 帧令下发失败，不能伪报 ws_sent', async t => {
 const wss=new WebSocketServer({host:'127.0.0.1',port:0});await new Promise(r=>wss.once('listening',r));
 t.after(()=>{for(const ws of wss.clients)ws.terminate();wss.close();});
 wss.on('connection',ws=>ws.on('message',raw=>{const f=JSON.parse(raw);if(f.type==='auth')ws.send('{"type":"auth_ok"}');if(f.type==='ping')ws.send('{"type":"pong"}');if(f.type==='send')ws.send('{"type":"error","message":"recipient rejected"}');}));
 const client=new MaapClient({wsUrl:`ws://127.0.0.1:${wss.address().port}`,apiKey:'test',logger:{info(){},warn(){},error(){},debug(){}}});t.after(()=>client.stop());
 await new Promise(r=>{client.onConnect=r;client.start();});
 await assert.rejects(()=>client.sendReply('a','test'),/recipient rejected/);
});
test('共享 daemon 两个 MCP 客户端共用同一 PID，断开客户端不停止服务',async t=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net'),{spawn}=require('node:child_process');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'5g-daemon-')),socketPath=path.join(dir,'bridge.sock');t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const child=spawn(process.execPath,[path.join(__dirname,'../src/index.cjs'),'--mock','--daemon'],{env:{...process.env,ACP_PORT:'1',ACP_CWD:dir,BRIDGE_SOCKET:socketPath,BRIDGE_LEASE_PORT:'0'},stdio:['ignore','ignore','pipe']});child.stderr.resume();t.after(()=>child.kill('SIGTERM'));
 const started=Date.now();while(!fs.existsSync(socketPath)){if(Date.now()-started>3000)throw new Error('daemon socket absent');await new Promise(r=>setTimeout(r,20));}
 const call=()=>new Promise((resolve,reject)=>{const s=net.connect(socketPath);s.on('error',reject);s.on('connect',()=>s.write(JSON.stringify({id:1,method:'tools/call',params:{name:'bridge_status'}})+'\n'));s.once('data',raw=>{s.end();resolve(JSON.parse(JSON.parse(raw).result.content[0].text));});});
 const a=await call(),b=await call();assert.equal(a.pid,b.pid);assert.equal(a.service,'shared-daemon');assert.equal(fs.statSync(socketPath).mode&0o777,0o600);
 const done=new Promise(r=>child.once('exit',r));child.kill('SIGTERM');await done;
});
test('最新日志端口失效时探测下一端口，不重放 prompt',async t=>{
 let prompts=0;
 const good=await fixture(t,async(req,res)=>{
  res.setHeader('content-type','application/json');
  if(req.method==='DELETE'){res.end('{}');return;}
  if(req.url.endsWith('/connect')){res.end('{"connectionId":"fallback"}');return;}
  let raw='';for await(const c of req)raw+=c;const msg=JSON.parse(raw);
  if(msg.method==='session/prompt')prompts++;
  res.end(JSON.stringify({id:msg.id,result:msg.method==='session/new'?{sessionId:'fallback'}:msg.method==='session/prompt'?{stopReason:'end_turn'}:{protocolVersion:1}}));
 });
 const bad=await fixture(t,(req,res)=>{res.statusCode=503;res.end();});
 const client=new AcpClient({port:bad,discoverPorts:()=>[bad,good],timeoutMs:500});
 await client.prompt('hello');assert.equal(client.port,good);assert.equal(prompts,1);await client.close();
});
test('宿主默认 bypass 时必须先成功切换 default，失败不能发 prompt', async t => {
 let rejectMode = true, prompts = 0, switches = 0;
 const port = await fixture(t, async (req, res) => {
  res.setHeader('content-type', 'application/json');
  if (req.method === 'DELETE') { res.end('{}'); return; }
  if (req.url.endsWith('/connect')) { res.end('{"connectionId":"mode-test"}'); return; }
  let raw = ''; for await (const chunk of req) raw += chunk;
  const msg = JSON.parse(raw); let result = { protocolVersion: 1 };
  if (msg.method === 'session/new') result = { sessionId: 'new-channel', modes: { currentModeId: 'bypassPermissions', availableModes: [{ id: 'default' }] } };
  if (msg.method === 'session/set_mode') {
   assert.equal(msg.params.modeId, 'default'); switches++;
   if (rejectMode) { res.end(JSON.stringify({ id: msg.id, error: { message: 'mode rejected' } })); return; }
   result = {};
  }
  if (msg.method === 'session/prompt') { prompts++; result = { stopReason: 'end_turn' }; }
  res.end(JSON.stringify({ id: msg.id, result }));
 });
 const client = new AcpClient({ port, timeoutMs: 1000 }); t.after(() => client.close());
 await assert.rejects(() => client.prompt('hello'), /mode rejected/);
 assert.equal(prompts, 0);
 rejectMode = false; await client.prompt('hello');
 assert.equal(prompts, 1); assert.equal(switches, 2); assert.equal(client.status().permissionMode, 'default');
});

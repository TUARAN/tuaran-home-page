'use strict';
// Explicitly invoked only. Creates a NEW WorkBuddy session; never resumes user sessions.
// Reads/writes only synthetic fixtures under this script's dedicated temporary directory.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const AcpClient = require('../src/acp-client.cjs');
(async () => {
 const cwd = fs.mkdtempSync(path.join(os.tmpdir(), '5g-wb-permission-test-'));
 const nonce = crypto.randomBytes(12).toString('hex');
 fs.writeFileSync(path.join(cwd, 'read-fixture.txt'), nonce + '\n', { mode: 0o600 });
 const events = [], report = { date: new Date().toISOString(), cwd, gateway: 'not contacted', officialOAuth: 'not used', tests: {} };
 let client;
 try {
  for (const port of AcpClient.ports()) {
   client = new AcpClient({ port, cwd, timeoutMs: 8000, onEvent: event => { events.push(event); if(event.type !== 'update' || event.kind === 'tool_call') console.error(JSON.stringify(event)); } });
   try { report.initialize = await client.connect(); break; } catch (e) { await client.close(); report.lastConnectError = e.message; }
  }
  if (!client?.connectionId) throw new Error('No ACP connection');
  await client.ensureSession(); report.session = client.sessionId.slice(0, 8); report.sessionConfiguration = client.sessionResult;
  for (const [name, prompt] of [
   ['text', '这是用户授权的连接器测试。不要调用任何工具，仅回复 ACP_TEXT_OK。'],
   ['read', `这是用户授权的测试。只读取当前目录的 read-fixture.txt（合成测试文件），回复该文件的完整内容。不得读取任何其他路径。`],
   ['write', `这是用户授权的测试。只在当前目录创建 write-proof.txt，内容严格为 WRITE_PROOF_OK。不得修改其他文件；完成后回复完成。`],
   ['shell', `这是用户授权的测试。只执行一次终端命令：printf 'SHELL_PROOF_OK\\n' > shell-proof.txt。工作目录为 ${cwd}。不要执行其他命令，不要访问网络或其他文件。`],
  ]) {
   let text = ''; const start = events.length;
   try {
    const result = await client.prompt(prompt, { timeoutMs: 90000, onText: t => { text += t; } });
    const proof = name === 'text' ? text.includes('ACP_TEXT_OK') : name === 'read' ? text.includes(nonce) : fs.existsSync(path.join(cwd, name === 'write' ? 'write-proof.txt' : 'shell-proof.txt')) && fs.readFileSync(path.join(cwd, name === 'write' ? 'write-proof.txt' : 'shell-proof.txt'), 'utf8').trim() === (name === 'write' ? 'WRITE_PROOF_OK' : 'SHELL_PROOF_OK');
    report.tests[name] = { result, proof, response: text.slice(0, 1200), eventCounts: events.slice(start).reduce((a,e) => { const k = e.kind || e.type; a[k]=(a[k]||0)+1; return a; }, {}), tools: events.slice(start).filter(e => e.tool) };
   } catch (e) { report.tests[name] = { error: e.message, eventCounts: events.slice(start).reduce((a,e) => { const k=e.kind||e.type; a[k]=(a[k]||0)+1; return a; }, {}) }; break; }
   console.error('TEST ' + name + ': ' + JSON.stringify({ proof: report.tests[name].proof }));
  }
  report.permissionsDenied = client.permissionsDenied;
 } catch (e) { report.error = e.message; process.exitCode = 1; }
 finally {
  await client?.close();
  // Session identifiers/tokens returned by local API are not included in the saved report.
  if (report.sessionConfiguration) { const { sessionId, ...rest } = report.sessionConfiguration; report.sessionConfiguration = rest; }
  const dir = path.join(__dirname, '../var'); fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(dir, 'live-permissions.json'), JSON.stringify(report, null, 2), { mode: 0o600 });
  console.log(JSON.stringify(report, null, 2));
 }
})();

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const Acp = require('../src/acp-client.cjs');
(async () => {
 const cwd = fs.mkdtempSync(path.join(os.tmpdir(), '5g-wb-fixtures-'));
 const readPath = path.join(cwd, 'read.txt'), writePath = path.join(cwd, 'write.txt'), shellPath = path.join(cwd, 'shell.txt');
 const nonce = crypto.randomBytes(12).toString('hex'); fs.writeFileSync(readPath, nonce);
 const results = { cwd, date: new Date().toISOString(), mode: 'default', tests: {} };
 const port = Acp.ports()[0];
 for (const [name, prompt] of [
  ['text', 'Reply exactly MACOS_ACP_OK. Do not use tools.'],
  ['read', `User-authorized connector test. Read only the file at this exact absolute path: ${readPath}. Reply with its full content. Do not inspect other paths or run other tasks.`],
  ['write', `User-authorized connector test. Write exactly WRITE_FIXTURE_OK to this absolute path: ${writePath}. Do not touch any other path. Use the Write tool; do not use a shell. This test has a scoped one-time approval handler.`],
  ['shell', `User-authorized connector test. Run exactly this one command with Bash: printf 'SHELL_FIXTURE_OK' > '${shellPath}'. Do not run other commands or access other paths. This test has a scoped one-time approval handler.`],
 ]) {
  const eventCounts = {}, permissions = []; let text = '';
  const client = new Acp({ port, cwd, timeoutMs: 10000,
   onEvent(e) { const k=e.kind||e.type; eventCounts[k]=(eventCounts[k]||0)+1; },
   async onPermission(params) {
    // The test never enables an unrestricted WorkBuddy mode. Only a precise fixture operation can be approved.
    const tool = params?.toolCall || {}, raw = tool.rawInput || {};
    const title = tool.title || '';
    let allowed = false;
    if (name === 'write' && (raw.file_path === writePath || raw.path === writePath) && raw.content === 'WRITE_FIXTURE_OK') allowed = Object.keys(raw).every(k => ['file_path','path','content'].includes(k));
    if (name === 'read' && (raw.file_path === readPath || raw.path === readPath)) allowed = Object.keys(raw).every(k => ['file_path','path','offset','limit'].includes(k));
    if (name === 'shell' && raw.command === `printf 'SHELL_FIXTURE_OK' > '${shellPath}'`) allowed = Object.keys(raw).every(k => ['command','description','timeout'].includes(k));
    permissions.push({ title, rawInput: raw, options: params?.options, allowed });
    console.error(JSON.stringify({ test: name, permission: title, rawKeys: Object.keys(raw), allowed }));
    return allowed ? params.options?.find(o => o.kind === 'allow_once')?.optionId : null;
   }
  });
  try {
   await client.ensureSession();
   const result = await client.prompt(prompt, { timeoutMs: 90000, onText: t => text += t });
   const proof = name === 'text' ? text.includes('MACOS_ACP_OK') : name === 'read' ? text.includes(nonce) : fs.existsSync(name === 'write' ? writePath : shellPath) && fs.readFileSync(name === 'write' ? writePath : shellPath, 'utf8') === (name === 'write' ? 'WRITE_FIXTURE_OK' : 'SHELL_FIXTURE_OK');
   results.tests[name] = { stopReason: result.stopReason, outcome: result._meta?.['codebuddy.ai/outcome'], error: result._meta?.['codebuddy.ai/errorMessage'], proof, response: text.slice(0, 1000), eventCounts, permissions };
  } catch(e) { results.tests[name]={error:e.message,eventCounts,permissions}; }
  finally { await client.close(); }
  console.error(JSON.stringify({test:name,proof:results.tests[name].proof,stopReason:results.tests[name].stopReason}));
 }
 fs.mkdirSync(path.join(__dirname,'../var'),{recursive:true,mode:0o700});
 fs.writeFileSync(path.join(__dirname,'../var/fixture-permissions.json'),JSON.stringify(results,null,2),{mode:0o600});
 console.log(JSON.stringify({cwd,tests:Object.fromEntries(Object.entries(results.tests).map(([k,v])=>[k,{proof:v.proof,stopReason:v.stopReason,error:v.error}]))},null,2));
})();

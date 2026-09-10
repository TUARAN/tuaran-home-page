'use strict';
const { WebSocketServer } = require('ws');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const Acp = require('../src/acp-client.cjs');
(async () => {
 const report = { date: new Date().toISOString(), gateway: 'loopback mock', acp: 'real local WorkBuddy', smsSent: false };
 const cwd = fs.mkdtempSync(path.join(os.tmpdir(), '5g-live-bridge-'));
 const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 });
 await new Promise((resolve,reject)=>{wss.on('listening',resolve);wss.on('error',reject);});
 let child, timer;
 try {
  const finished = new Promise((resolve,reject)=>{
   timer=setTimeout(()=>reject(new Error('Bridge test timed out')),100000);
   wss.on('connection',ws=>ws.on('message',raw=>{
    const frame=JSON.parse(raw);
    if(frame.type==='auth'){report.gatewayAuthenticated=true;ws.send('{"type":"auth_ok"}');ws.send(JSON.stringify({type:'text_message',from:'test-sender',messageId:'live-bridge-test',content:'Reply exactly MACOS_BRIDGE_OK. Do not use tools.'}));}
    else if(frame.type==='ping')ws.send('{"type":"pong"}');
    else if(frame.type==='send'){report.reply=frame.content;report.target=frame.to;resolve();}
   }));
  });
  child=spawn(process.execPath,[path.join(__dirname,'../src/index.cjs'),'--mock'],{env:{...process.env,ACP_PORT:process.env.ACP_PORT || '',PERSONA_ENABLED:'0',ACP_CWD:cwd,ALLOWED_SENDERS:'test-sender',MOCK_WS_URL:`ws://127.0.0.1:${wss.address().port}/ws`,BRIDGE_DRY:'0'},stdio:['pipe','pipe','pipe']});
  let stderr=''; let stdout='';child.stdout.on('data',c=>stdout+=c);child.stderr.on('data',c=>{stderr+=c;process.stderr.write(c);});
  child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05'}})+'\n');
  await finished;
  // Finish the 2s business-error observation before stopping the test child.
  await new Promise(resolve => setTimeout(resolve, 2200));
  report.acpPromptObserved=stderr.includes('\"kind\":\"session/prompt\"');
  report.acpMessageObserved=stderr.includes('agent_message_chunk');
  report.outboundOriginObserved=stderr.includes('acp-response');
  report.mcpHandshake=stdout.includes('5g-msg-channel-macos');report.proof=report.reply?.includes('MACOS_BRIDGE_OK') && report.acpPromptObserved && report.acpMessageObserved && report.outboundOriginObserved;
  if (!report.proof) throw new Error('ACP evidence or reply missing');
 }catch(e){report.error=e.message;process.exitCode=1;}
 finally{
  clearTimeout(timer);if(child){const exit=new Promise(r=>child.once('exit',r));child.stdin.end();await exit;}
  for(const ws of wss.clients)ws.terminate();await new Promise(r=>wss.close(r));
  const dir=path.join(__dirname,'../var');fs.mkdirSync(dir,{recursive:true,mode:0o700});fs.writeFileSync(path.join(dir,'live-bridge.json'),JSON.stringify(report,null,2),{mode:0o600});console.log(JSON.stringify(report,null,2));
 }
})();

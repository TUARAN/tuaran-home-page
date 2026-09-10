'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function migrate({ home = os.homedir(), number, apply = false }) {
 if (!/^\d{11,15}$/.test(number || '')) throw new Error('请用 --to 提供确认过的测试号码');
 const file = path.join(home, '.workbuddy/mcp.json');
 const before = fs.readFileSync(file,'utf8'), data = JSON.parse(before);
 const legacy = data.mcpServers?.['5gmsg-channel'];
 const old = data.mcpServers?.['5g-msg-channel-macos'] || legacy;
 const key = old?.env?.MAAP_API_KEY || (old?.env?.MAAP_API_KEY_FILE ? fs.readFileSync(old.env.MAAP_API_KEY_FILE, 'utf8').trim() : null);
 if (!key) throw new Error('连接器缺少网关 Key 或 Key 文件');
 const url=old.env.MAAP_WS_URL || 'wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg';
 if (url !== 'wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg') throw new Error('旧网关地址不同，需要核对协议');
 const keyFile=path.join(home,'.workbuddy/5g-macos-key');
 const allowed=[...new Set([...(old.env.ALLOWED_SENDERS || '').split(',').map(x=>x.trim()).filter(Boolean),number])];
 if (legacy) data.mcpServers['5gmsg-channel']={...legacy,disabled:true};
 data.mcpServers['5g-msg-channel-macos']={type:'stdio',command:process.execPath,args:[path.join(root,'src/mcp-client.cjs')],cwd:root,disabled:false,env:{BRIDGE_MODE:'production',BRIDGE_BACKEND:old.env.BRIDGE_BACKEND || 'desktop',MAAP_WS_URL:url,MAAP_API_KEY_FILE:keyFile,ENFORCE_WHITELIST:'true',ALLOWED_SENDERS:allowed.join(','),BRIDGE_DRY:'0',ACP_CWD:path.join(root,'var/workspace')}};
 const after=JSON.stringify(data,null,2)+'\n'; JSON.parse(after);
 const redact = text => JSON.stringify(JSON.parse(text),(k,v)=>/KEY|SECRET|TOKEN/.test(k)&&k!=='MAAP_API_KEY_FILE'?'[redacted]':v,2)+'\n';
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'5g-production-'));
 fs.writeFileSync(path.join(tmp,'before'),redact(before));fs.writeFileSync(path.join(tmp,'after'),redact(after));
 const diff=spawnSync('diff',['-u',path.join(tmp,'before'),path.join(tmp,'after')],{encoding:'utf8'}).stdout;
 fs.rmSync(tmp,{recursive:true});
 let backup;
 if(apply){
  backup=file+'.bak-production-'+Date.now();fs.writeFileSync(backup,before,{mode:0o600,flag:'wx'});
  fs.writeFileSync(keyFile,key.trim(),{mode:0o600});fs.chmodSync(keyFile,0o600);
  fs.writeFileSync(file+'.tmp',after,{mode:0o600});fs.renameSync(file+'.tmp',file);
 }
 return {applied:apply,backup,jsonValid:true,mode:'production',dry:false,allowedSenderCount:allowed.length,diff};
}
function installService(){
 const dir=path.join(os.homedir(),'Library/LaunchAgents');fs.mkdirSync(dir,{recursive:true});
 const label='com.tuaran.5g-msg-channel-macos',file=path.join(dir,label+'.plist');
 const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const logs=path.join(root,'var');fs.mkdirSync(logs,{recursive:true,mode:0o700});
 const xml=`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>Label</key><string>${label}</string><key>ProgramArguments</key><array><string>${escape(process.execPath)}</string><string>${escape(path.join(root,'scripts/service-launch.cjs'))}</string></array><key>WorkingDirectory</key><string>${escape(root)}</string><key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>ThrottleInterval</key><integer>10</integer><key>StandardOutPath</key><string>${escape(path.join(logs,'service.log'))}</string><key>StandardErrorPath</key><string>${escape(path.join(logs,'service.log'))}</string></dict></plist>`;
 fs.writeFileSync(file,xml,{mode:0o600});
 const lint=spawnSync('plutil',['-lint',file],{encoding:'utf8'});if(lint.status)throw new Error(lint.stderr||lint.stdout);
 spawnSync('launchctl',['bootout',`gui/${process.getuid()}/${label}`]);
 let r;
 // launchd can briefly reject bootstrap while the old instance is being removed.
 for (let attempt=0;attempt<5;attempt++){
  r=spawnSync('launchctl',['bootstrap',`gui/${process.getuid()}`,file],{encoding:'utf8'});
  if(!r.status)break;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,250);
 }
 if(r.status)throw new Error(r.stderr||r.stdout);
 return {label,plist:file};
}
if(require.main===module){try{if(process.argv.includes('--install-service'))console.log(JSON.stringify(installService()));else{const result=migrate({number:process.argv[process.argv.indexOf('--to')+1],apply:process.argv.includes('--apply')});console.log(result.diff);console.log(JSON.stringify({...result,diff:undefined},null,2));}}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={migrate};

'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createPermissionPrompter}=require('../src/permission-dialog.cjs');
const params={toolCall:{rawInput:{command:'pwd'}},options:[{kind:'allow_once',optionId:'once'},{kind:'allow_always',optionId:'always'}]};
test('仅显式本机允许返回 allow_once，命令只作为 argv 数据',async()=>{
 let seen;const ui=createPermissionPrompter({platform:'darwin',run:async(...args)=>{seen=args;return{stdout:'allow_once\n'};}});
 assert.equal(await ui.request(params),'once');assert.equal(seen[0],'/usr/bin/osascript');assert.ok(!seen[1][1].includes('pwd'));assert.ok(seen[1].at(-1).includes('pwd'));assert.equal(ui.status().last.state,'allowed_once');
});
test('拒绝、超时、执行失败均不批准',async()=>{
 for(const answer of ['deny','timeout','unexpected']){const ui=createPermissionPrompter({platform:'darwin',run:async()=>({stdout:answer})});assert.equal(await ui.request(params),null);assert.equal(ui.status().pending,null);}
 const ui=createPermissionPrompter({platform:'darwin',run:async()=>{throw new Error('unavailable');}});assert.equal(await ui.request(params),null);assert.equal(ui.status().last.reason,'dialog_unavailable');
});
test('不显示截断操作，不接受永久许可或已经取消的任务',async()=>{
 let calls=0;const ui=createPermissionPrompter({platform:'darwin',run:async()=>{calls++;return{stdout:'allow_once'};}});
 assert.equal(await ui.request({...params,toolCall:{rawInput:{command:'x'.repeat(7000)}}}),null);
 assert.equal(await ui.request({...params,options:[{kind:'allow_always',optionId:'always'}]}),null);
 assert.equal(await ui.request(params,{signal:AbortSignal.abort()}),null);assert.equal(calls,0);
});
test('等待期间状态可查询，任务取消后拒绝迟到批准',async()=>{
 let release;const ac=new AbortController();const ui=createPermissionPrompter({platform:'darwin',run:()=>new Promise(r=>release=r)});
 const pending=ui.request(params,{signal:ac.signal});assert.equal(ui.status().pending.state,'awaiting_local_confirmation');ac.abort();release({stdout:'allow_once'});assert.equal(await pending,null);
});

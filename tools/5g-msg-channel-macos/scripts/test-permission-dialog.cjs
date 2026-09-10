'use strict';
const {createPermissionPrompter}=require('../src/permission-dialog.cjs');
(async()=>{
 const ui=createPermissionPrompter();
 const choice=await ui.request({toolCall:{rawInput:{说明:'仅测试确认窗口，不执行任何文件或终端操作',示例命令:'pwd'}},options:[{kind:'allow_once',optionId:'test-once'}]});
 console.log(JSON.stringify({choice,actualOperationExecuted:false,...ui.status()},null,2));
})();

# X 大互动智能体二阶段：任务引擎 v6 与 Harness v2

2026-11-20 · 分支 `feat/x-agent-v5-453` · 扩展版本 v5.1.0（本地测试，未打包）

## Issue 草稿

> 沙箱内 `gh` 连不上 api.github.com，Issue 未创建。站长可复制以下内容开 Issue，或并入 #453。

**标题**：X 大互动智能体二阶段：任务引擎 v6 + Harness v2 + 运行事实

**建议标签**：`area:extension`、`priority:now`

**要做的事**

- [x] 调度判断抽成纯函数模块 `taskEngine.js`，执行器改为有界循环，去掉 `return runTaskSchedule()` 自递归。
- [x] 智能体对话接入 Harness 循环：规划 → 只读工具 → 再规划；写操作只出确认按钮。
- [x] 统一运行事实 `readRunFacts`：今日数据、24 小时报警、空转与已停预警、调度记录。
- [x] 后台 `host_permissions` 去掉 `https://*/*`。
- [ ] 每日报告与巡检页改读 `xrc-run-facts`（下一刀）。
- [ ] 本机开发热更新、主题嵌入（下一刀，需站长定方案）。

**不做**：不调高评论 / 发帖 / 关注上限，不缩短冷却，不绕开 X 的自动化检测。互动按大互动理论与黄皮书「少而准」执行。

## 任务引擎 v6

| 部分 | 位置 | 说明 |
| --- | --- | --- |
| 判断 | `taskEngine.js` `createTaskEngine()` | 只把事实变成结论：占用标志、占用结论（recover / manual-start / hold / recovered / yield）、恢复动作、让出时写回的队列项。无存储、无标签页、无闹钟。 |
| 执行 | `background.js` `runTaskSchedule()` | `for (let pass = 0; pass < MAX_PASSES; …)` 调 `schedulePass()`；需要重算时返回 `ENGINE_AGAIN`，最多 24 轮。 |
| 记录 | `createEngineTrace(80)` | 内存环形缓冲，记每次派发、轮换、刷新和跳过，供 Harness 与巡检读取。 |

保持不变：共享执行页 `plan.workTabId`、占用相位、`xrc-task-schedule` / `xrc-task-slice` 闹钟、页内控制器（`loop.js`、`autoLike.js`、`mutual.js`、`poster.js`、`prunePosts.js`、`kolRoster.js`）、所有原有原因文案。

测试：`tests/extensions/task-engine.test.mjs`。

## Harness v2（协议 `xrc-agent-turn/v2`）

```
内容页 agentChat ──xrc-agent-harness──▶ 后台 runAgentHarness
                                        └─ agentPlanner.runHarnessTurn
                                             ├─ callModel（DeepSeek → B.AI → MobileOffice → NAS）
                                             ├─ 只读工具：schedule.now / facts.today / alerts.recent / engine.trace
                                             └─ 写工具：schedule.pauseAll / schedule.startAll → 只返回 pending
```

- 每步模型只回一个 JSON：`{tool,args}`、`{propose,why}`、`{answer}`。
- 限制：最多 4 步、整轮 45 秒、单个工具 10 秒。
- 写工具在后台注册表里没有 `run`；模型即使直接调用，也只变成待确认项。确认按钮复用确定性命令路由（「暂停全部」「开始全部」）。
- 失败（模型全挂、非约定 JSON、超时、步数用完）返回 `fallback: "status-buttons"`，面板只显示读到的状态和按钮。
- 只接受本扩展发来的消息（`sender.id === chrome.runtime.id`）。
- 工具只读插件内部状态，不读 X 页面正文，避免帖子内容影响规划。

测试：`tests/extensions/agent-harness.test.mjs`。

## 运行事实 `readRunFacts(now)`

| 字段 | 来源 |
| --- | --- |
| `schedule` | `readTaskSchedule`、`readPluginRuntime`、`dueTaskModes`；当前任务、到期任务、下一项等待、已停任务 |
| `today` | `XrcCommunityReceipt.comment/post/communityDailyBudget`、`readSharedFollowTodayCount` / `FOLLOW_DAILY_TARGET` |
| `alerts` | `xrcExecutionAlertsV1` 最近 24 小时，按 kind 计数 + 最近五条 |
| `warnings` | 空转（排班开着、无占用、无到期、下一项 > 30 分钟）、已停任务、评论 / 发帖到上限 |
| `engine` | 调度记录最近 12 条 |

内容页可经 `xrc-run-facts` 读取，供每日报告与巡检页下一刀接入。

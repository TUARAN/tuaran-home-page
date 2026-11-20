# X 大互动智能体对话界面 v5.2

2026-11-20 · 分支 `feat/x-agent-v5-453` · 扩展版本 v5.2.0（本地测试，未打包）

## Issue 草稿

> 沙箱内 `gh` 连不上 api.github.com，Issue 未创建。站长可复制以下内容开 Issue，或并入 #453。

**标题**：X 大互动智能体对话界面改版：工具记录、确认卡片、运行状态与输入体验

**建议标签**：`area:extension`、`priority:now`

**要做的事**

- [x] 标题栏显示运行中 / 已暂停、当前任务、账号（窄面板只隐藏账号）。
- [x] 助手回复去掉气泡；上方可折叠的工具调用记录，列出本轮真实读取或执行的工具与成败。
- [x] Harness 提议的写操作改为确认卡片：理由、「确认暂停全部 / 开始全部」、「先不」；处理结果写回会话留痕。
- [x] 每条回复：时间、作答模型、复制；状态与规划类回复可重试（写命令不出重试）。
- [x] 主会话状态播报改为紧凑动态流；空会话给四个只读起手问题。
- [x] 等待态显示真实阶段与已用秒数；新回复淡入，不做假流式。
- [x] 输入框自动增高，Enter 发送、Shift+Enter 换行，输入法选词（`isComposing` / keyCode 229）不误发；遵循「减少动态效果」。

**不做**：不改 Harness 协议与工具注册表，不调高上限、不缩短冷却。

## 实现位置

| 部分 | 位置 |
| --- | --- |
| 渲染 | `agentChat.js` `paintTrace` / `paintConfirm` / `paintMeta` / `paintWelcome` / `paintLog`；v5.3 起 `paintActivity` / `activityDrawer` / `noteActivity` |
| 交互 | `agentChat.js` `turnAction`（copy / retry / dismiss-confirm）、`submitDraft`、`fitComposer`、`mount` 的 keydown / input |
| 样式 | `agentChat.css` 对话区段 |
| 数据 | 助手回合新增可选 `why`（确认理由）与 `resolved`（确认结果：命令名或 `dismissed`），仍存在 `xrcAgentSessionV1` |

测试：`tests/extensions/x-agent-v5.test.mjs` 末尾四条（起手问题与标题状态、确认卡片可拒绝、确认只执行一次、Enter 与输入法）。

## v5.3.0：对话与运行通知分开

**问题**：主会话的状态播报（`kind: "status"`）和对话共用 40 条上限，任务进度每变一次就追加一条，几分钟就把真实对话挤出会话。

**方案**：会话只装人和智能体说的话；运行通知是另一类数据，不拆成更多会话。

- 存储：`xrcAgentSessionV1` 新增 `activity`（最多 60 条）与 `seenAt`。`threads[].turns` 不再接收 status。
- 合并：同一任务、同一开始 / 暂停状态的进度更新改写同一条，记 `updates` 与起始时间 `since`；换任务或开始 / 暂停才新开一条，并计入未读。
- 入口：标题栏铃铛 + 未读角标；点开为覆盖在对话上方的「运行动态」面板，打开即已读，可清空，Esc 关闭。实时状态仍由标题栏状态胶囊显示。
- 迁移：`normalizeStore` 首次载入时把旧会话里的 status 回合移入 `activity`，此后不再出现。

测试：`x-agent-v5.test.mjs` 末尾两条（60 次进度只产生 2 条动态且对话不丢、旧会话迁移）。

**样式隔离**：标题栏沿用 `.xrc-docs-head` 布局类，旧的 `.xrc-docs-head span / button / > div` 规则特异性更高，曾让未读角标变灰、变大并压住铃铛，头部按钮带边框、被裁切，运行状态胶囊失去颜色，窄栏下整条被隐藏。现在头部规则统一以 `.xrc-docs-head.xrc-agent-page-head` 限定；测试按选择器特异性比对，旧规则若再压过新规则即失败。

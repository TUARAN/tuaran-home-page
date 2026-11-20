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
| 渲染 | `agentChat.js` `paintTrace` / `paintConfirm` / `paintMeta` / `paintWelcome` / `paintEvent` / `paintLog` |
| 交互 | `agentChat.js` `turnAction`（copy / retry / dismiss-confirm）、`submitDraft`、`fitComposer`、`mount` 的 keydown / input |
| 样式 | `agentChat.css` 对话区段 |
| 数据 | 助手回合新增可选 `why`（确认理由）与 `resolved`（确认结果：命令名或 `dismissed`），仍存在 `xrcAgentSessionV1` |

测试：`tests/extensions/x-agent-v5.test.mjs` 末尾四条（起手问题与标题状态、确认卡片可拒绝、确认只执行一次、Enter 与输入法）。

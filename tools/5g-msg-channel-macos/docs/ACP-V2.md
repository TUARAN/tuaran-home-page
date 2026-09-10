# ACP 2.0.0 核验记录（2026-09-09）

旧自建 CLI 已退出：旧进程 0、`5gmsg-channel` MCP 条目已移除、`cn.workbuddy.5g-cli-bridge` 登录启动文件已移出且 label 禁用。私密配置备份在 `~/.workbuddy/retired-5g-cli/1788941138803`，源项目保留，不再自动运行。WorkBuddy 宿主自己的内置 codebuddy 进程保留。

## 实际架构

5G 网关 WebSocket → Bridge 白名单/队列 → WorkBuddy localhost HTTP/SSE ACP → 独立渠道会话 → ACP 正文 → 网关下发。MCP stdio 客户端通过本地 Unix socket 查询/调用这一共享服务。连接器不 spawn CLI；macOS 权限弹窗使用 osascript。保留原有 MaaP 协议实现，没有替换为官方 OAuth 接入，也未绑定桌面当前对话。

## 本次改动

- 版本 2.0.0，状态明确展示 backend、transport、会话绑定方式。
- ACP 阶段、思考/正文/工具事件计数及最后事件时间可查，只记录元数据，不记录思考正文。
- 每个任务分配 ID，下发标注 acp-response / failure-notice / mcp-send，避免用手机文案猜测调用来源。
- 宿主新会话若默认 bypassPermissions，先请求 session/set_mode=default；不支持或失败则不执行 prompt。
- 旧人格/记忆注入默认关闭；显式开启时说明真实渠道身份，不强制隐藏 CodeBuddy 名称。
- 清理旧入口，生产配置脚本支持读取现有 Key 文件，不再依赖旧 MCP 条目；启动项增加短时 bootstrap 重试。

## 验证

28 项测试通过；20 个源文件/脚本语法检查通过；package.json、package-lock.json 和实际 mcp.json JSON 校验通过。

真实 WorkBuddy ACP（54334）配合本地模拟网关：session/new → session/prompt → agent_message_chunk → prompt_result → acp-response → ws_sent → task_done。返回 MACOS_BRIDGE_OK。该轮未发送真实短信。报告见 ../var/live-bridge.json 和 ../var/acp-v2-live.log。

中间失败如实保留说明：临时 ACP 64081 返回 bypassPermissions，加入显式模式切换后收到思考事件，但未完成测试且该端口随后消失；改用仍监听的宿主 ACP 54334 完成闭环。首次 launchd bootstrap 返回错误5，旧服务退出后重试成功。

生产实例核验：PID 30451，version=2.0.0，acpStartupHandshake=true，wsConnected=true，wsAuthed=true，dry=false。重启后尚无新的手机上行，sessions=[]、acpReady=false 表示尚未按需创建渠道会话。生产新版本手机往返仍待使用者发测试消息确认；不能以此次模拟网关闭环代替真实手机送达验证。

## “思考中”的证据边界

ACP 定义 agent_thought_chunk 事件，但没有规定固定中文提示，也不保证每轮都有该事件。本次成功问答只有正文事件，仍完整结束。当前连接器不主动发送“正在思考中”的固定短信；手机若仍收到该文案，需要对照 outbound_attempt 的来源、时间和字符数进一步定位，不能仅凭文案断定来自旧 CLI 或 ACP。

协议参考：https://agentclientprotocol.github.io/typescript-sdk/types/SessionUpdate.html

## 手机复测

发送“请只回复 ACP2-0909，不调用工具”。随后调用 bridge_status：确认 version=2.0.0，received 增加，lastTask.state=completed，sessions 内有 ACP 端口与事件计数，并且手机收到回复。若停住，请查看 lastTask、sessions.phase、permissions.pending。真实生产网关下发可能产生费用。

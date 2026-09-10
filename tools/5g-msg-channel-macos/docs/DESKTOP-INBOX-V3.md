# 桌面 MCP 收件 v3

2026-09-09，macOS / Node 22.22.3 / WorkBuddy 5.5.4。

## 已改动

手机 → MaaP WSS → 共享后台的持久收件箱 → 桌面任务调用 receive_5g → WorkBuddy 处理 → reply_5g → 网关。

本机 BRIDGE_BACKEND=desktop，BRIDGE_MODE=production，BRIDGE_DRY=0。后台不再启动 CLI 或直接创建 ACP 推理会话。旧 ACP 后端代码保留用于兼容，但当前配置不使用。

新增 desktop-inbox.cjs；新增 receive_5g / reply_5g 工具；后台根据 backend 选择实现。生产配置迁移默认选择 desktop，并保留已有 backend。消息先以 0600 权限原子落盘，白名单、去重、领取状态和未知发送结果防重试均有测试。保留最多 1000 条去重记录、最多 100 条未完成消息。

## 桌面实测

桌面任务名称：验证桌面手机收件箱功能。

信任新版连接器后，旧测试任务仍无法发现新工具；新建桌面任务可正常加载。测试调用 receive_5g 收到 DESKTOP_INBOX_0909，再调用 reply_5g，返回 test_recorded。任务内展示收到的文本和 DESKTOP_INBOX_OK；切换其他任务后重新打开，两者仍可见。后台 processed=1、queueLength=0。此条为合成 testOnly 消息，没有发送短信，不等于真实手机端全链路测试。

后台 PID 在验证时为 40168，wsConnected=true、wsAuthed=true，网关为 wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg。31 项测试通过；随后配置迁移变更的 9 项 core 回归测试通过。

## 运行边界

桌面任务必须持续调用 receive_5g（waitSeconds 最大 50）。停止任务、退出 WorkBuddy 或模型主动结束后，后台只能保存消息，不能自动唤醒桌面任务。持续轮询可能消耗 WorkBuddy 额度。自动回复启动被审批拦下，目前尚未启动，等待明确授权。

记录以 MCP 收件内容及桌面助手回复保存，不是把手机内容直接变成原生用户聊天气泡。尚未实现 ACP 会话登记到桌面，也未获得官方 OAuth 权限。原有独立 ACP 历史不会自动导入。

使用单一专用接收任务；接收锁绑定 MCP 连接，不能保证宿主复用同一连接时能区分不同任务。多个发送者共用此桌面任务上下文，仅适用于当前个人白名单，不适合作为多用户隔离服务。

处理权限由桌面 WorkBuddy 原有权限系统管理；本轮没有验证危险操作的权限弹窗。发送结果 ws_sent 仅表示 WebSocket 写出，不证明业务受理或手机送达。发送结果未知时不自动重发。领取恢复时必须查看任务历史，避免重复执行有副作用的工作。

## 启动与恢复

获得持续回复授权后，在上述桌面任务发送：

> 持续调用 receive_5g，waitSeconds=50；暂无消息时继续等待。收到消息先在本任务展示，按正常权限处理，再通过 reply_5g 回复。遇到 resumed=true 先核对历史，避免重复执行。错误时停止并说明；发送结果未知时禁止自动重试。用户停止任务时结束。

然后检查 bridge_status 的 desktopReceiverWaiting=true。用已确认手机号码发一条带唯一标记的无副作用消息，核对桌面收到、任务回复、手机实际收到三处一致。当前尚未执行此新版真实手机验证。

停止接收可点击桌面任务停止；网关后台仍可收件落盘。恢复在同一任务重新发送上述接收指令。不要同时启动多个接收任务。

## 配置校验与回滚

mcp.json 已解析校验，变更为增加 BRIDGE_BACKEND=desktop。原配置备份：~/.workbuddy/mcp.json.bak-desktop-1788944503。回滚时应只恢复本连接器字段，避免覆盖其他后来修改的连接器；重启共享服务后在 WorkBuddy 管理页重新信任，使用新任务加载工具。

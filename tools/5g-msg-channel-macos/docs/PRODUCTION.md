# 真实网关接入与测试

2026-09-09 已把本机 `5g-msg-channel-macos` 从模拟模式切换为真实 MaaP 网关。原 `5gmsg-channel` MCP 条目和 `cn.workbuddy.5g-cli-bridge` launchd 服务已停用，原文件与配置备份保留。

## 现在的运行方式

一个 `com.tuaran.5g-msg-channel-macos` 用户级 launchd 后台进程负责真实 WebSocket 连接。WorkBuddy 中的 MCP 入口是 `src/mcp-client.cjs`，经 `~/.workbuddy/5g-macos.sock` 连接后台。socket 权限 0600；多个 WorkBuddy 窗口共用一个后台，不会因同 Key 重复建连互踢。

后台占用旧守护器相同的回环锁端口 18567。旧 launchd 服务已 disable + bootout，旧 MCP disabled=true，避免其自动重启。凭据复用旧 Key，保存为 `~/.workbuddy/5g-macos-key`，权限 0600，不在代码、分发包或 plist 中。白名单保留原平台 sender ID，并加入用户确认的测试手机号。

真实配置：

```json
{
  "mode": "production",
  "dry": false,
  "wsUrl": "wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg",
  "wsConnected": true,
  "wsAuthed": true
}
```

## 你可以直接测试

在 WorkBuddy 管理页重启/信任 **5g-msg-channel-macos**；保留旧 **5gmsg-channel** 为关闭状态。如果工具仍返回 mock，说明该会话仍持有旧进程，重启新条目后再查。

在 WorkBuddy 对话发送：

> 请调用 5g-msg-channel-macos 的 bridge_status，展示 mode、dry、wsConnected、wsAuthed、gatewayError 和 pid。

真实发送使用 `send_5g`，必须明确 `to` 和 `text`。仅白名单目标可以发送。已经向本次用户确认的测试号码发送过一次“生产部署验证”，不要为了查看状态反复发送。

也可以在本项目目录运行：

```sh
npm run channel:status
# 真实下发，必须使用你确认且已加入白名单的号码
npm run channel:send -- --to 你的测试号码 --text 测试内容
```

如果手机收到测试消息，回复“请只回复：手机闭环成功”。检查手机是否收到 AI 回复，并查看 `processed`、`failed`、`sessions`。`processed` 是上行任务处理计数，主动 send_5g 不增加此计数。没有上行时 sessions=[]、acpReady=false 是正常情况。

## 本次验证证据与边界

- 生产网关认证通过，wsConnected=true、wsAuthed=true、gatewayError=null。
- 用户确认测试号码后，只发送了一次“生产部署验证”，返回 ws_sent。
- 后续状态检查未观察到网关 error。手机送达和手机上行闭环尚待用户确认，不能据此标记成功。
- 新版增加 2 秒错误观察窗口，并串行处理下发。窗口内 error/连接断开会返回失败，之后的 error 保留到 gatewayError。服务没有业务正向 ACK，ws_sent 仍不等于网关业务受理或手机送达。
- 14 项自动化测试通过，覆盖迁移脱敏、白名单、错误帧、独立会话、MCP、多客户端共享后台、超时和模拟闭环。
- 正式后台的 ACP 文件/终端权限请求会弹出 macOS 原生确认窗口。只接受用户点击“仅允许一次”；拒绝、45 秒超时、窗口不可用或任务取消均不执行。未开启全局权限绕过。
- 即使 ACP 暂时不可用，已认证的真实网关仍可主动下发；上行任务会按当时最新端口尝试创建会话。运行时状态不能代替手机送达检查。

## 安装与维护

本机已完成以下生产迁移，无需重复执行。迁移到另一台已配置旧连接器的 Mac 时：

```sh
npm ci --ignore-scripts
npm run configure:production -- --to 测试号码
npm run configure:production -- --to 测试号码 --apply
```

切换前应卸载旧服务并停止旧实例，再执行：

```sh
npm run service:install
```

服务日志：`var/service.log`。日志不记录短信正文或 Key。生产配置修改后：

```sh
launchctl kickstart -k gui/$(id -u)/com.tuaran.5g-msg-channel-macos
```

需要停止新服务：

```sh
launchctl bootout gui/$(id -u)/com.tuaran.5g-msg-channel-macos
```

回退时应先停止新服务，再恢复 `~/.workbuddy/mcp.json.bak-production-1788936559654`；随后重新启用并 bootstrap 原 launchd plist。不要在新服务仍连接网关时恢复旧服务。

## 2026-09-09 上行卡住修复

手机截图确认“生产部署验证”已送达。随后手机上行已进入后台，但旧版本创建任务时只取日志里的第一条 ACP 端口 54359，该端口已失效；实际 54334 可握手。后台记录 `task_failed / fetch failed`，failed=1，未给手机发送失败提示。

已改为每次新建连接时依次握手验证候选端口，仅在 connect/initialize 阶段回退；不重放已经提交的 prompt。新增处理失败、超时、权限拒绝提示，并通过 `received` 和 `lastTask` 展示处理状态。回复下发结果未知时不追加另一条错误短信，避免重复发送。新增回归后共 17 项测试通过。

## macOS 原生权限确认

权限窗口标题为“5G 消息 · WorkBuddy 权限确认”，由连接器显示，不在 WorkBuddy 的审批列表中。完整参数作为纯文本展示，不会将参数解释为 AppleScript。过长无法完整展示的操作直接拒绝。

只有用户点击“仅允许一次”才向 ACP 返回 allow_once；不提供永久允许。超过 45 秒、点击拒绝、关闭窗口或任务取消后，手机会收到明确的未执行说明，不会再提示存在一个实际上不存在的待审批。

`bridge_status.permissions.pending` 展示是否等待确认，`permissions.last` 展示允许、拒绝、超时或弹窗不可用。电脑需要处于已登录且可交互的桌面；锁屏或无人确认时不会自动执行。

可从手机发送“请执行 pwd，并告诉我当前目录”，在 Mac 上核对命令后选择允许或拒绝。之前被拒绝的消息不会自动重放。

当前版本 3.0.0。本机使用桌面 MCP 收件后端，最新说明与实测见 [DESKTOP-INBOX-V3.md](docs/DESKTOP-INBOX-V3.md)。持续接收尚未启动，等待用户明确授权自动回复范围。

以下内容保留早期 ACP 模式说明；桌面模式的操作与权限边界以 v3 文档为准。

# macOS 5G 消息连接器

**本机已切换为真实网关并安装共享后台服务。当前操作以 [真实网关接入与测试](docs/PRODUCTION.md) 为准；下面的 mock 命令只用于离线联调，不要用它覆盖已启用的生产配置。**

基于用户提供的 `connector.rar` 改造。Node.js 22+，支持 macOS Apple Silicon / Intel；本次在 macOS arm64、Node v22.22.3、WorkBuddy 5.5.2 上验证。

手机消息通过 MaaP WebSocket 转交本地 WorkBuddy ACP 会话，回复再经网关返回。MCP stdio 提供 `bridge_status`、`bridge_version`、`send_5g`。本地 ACP 可用性依赖 WorkBuddy 版本和登录状态；此项目不提供官方 OAuth 权限。

## 安装与本地试用

双击 `scripts/安装与检查.command`，或在此目录运行：

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run doctor
npm run configure
npm run configure -- --apply
```

`configure` 默认只预览 diff；`--apply` 会备份 `~/.workbuddy/mcp.json`，仅新增 `5g-msg-channel-macos`，JSON 校验后原子写入。其他条目的凭据不会显示在 diff 中。已有同名配置但内容不一致时拒绝覆盖。

注册默认是 `--mock`、`BRIDGE_DRY=1`、仅允许 `test-sender`。在 WorkBuddy 连接器/MCP 管理页找到 **5g-msg-channel-macos**，必要时重启/信任。不要重启或替换旧的 `5gmsg-channel`。

手动体验本地模拟闭环，在两个终端分别运行：

```sh
# 终端一：只监听回环地址，输入文本并回车
npm run mock:gateway
```

```sh
# 终端二：真实 WorkBuddy 推理，回复只写本地模拟网关
BRIDGE_DRY=0 npm start
```

模拟模式可能消耗 WorkBuddy 推理额度，但不会通过真实短信网关下发。MCP 管理页实例仍默认 DRY；不要同时运行多个连接同一个模拟网关的实例，以免测试消息被重复处理。

## 权限边界

- 默认新建 `default / Always Ask` 会话，不复用桌面会话、不调用提权模式。生产后台收到权限请求时显示 macOS 原生确认弹窗，仅支持人工“仅允许一次”；拒绝或超时则不执行。
- 不同发送者使用不同 ACP 会话和不同建议工作目录；**工作目录不是 OS 沙箱**。实测 WorkBuddy 可能使用自己的宿主目录，不能保证 ACP_CWD 是文件访问边界。
- 连接器声明不提供客户端文件/终端能力，但 WorkBuddy 仍可能拥有宿主内置 Read / Write / Bash 工具；其执行由 WorkBuddy 权限系统控制。
- `test-fixture-actions.cjs` 是单独显式运行的测试程序：只允许精确匹配的合成文件操作或固定 printf 命令的一次性权限；普通连接器不加载这个批准器。
- `MAAP_API_KEY` 只认证 MaaP 网关，不能换取 WorkBuddy 官方 OAuth token。
- macOS 文件保护、完全磁盘访问、辅助功能和屏幕录制权限不会由本连接器自动授予；未进行这些系统级权限测试。

## 真实网关配置

现有 Mac 已有其他 5G 连接器；此版本测试未切换它，未复用其 Key。真实接入前确认原实例与本实例不会用同一个 Key 同时在线。

需要将本条目的 `--mock` 改为 `--production`，设置真实号码白名单与有效 Key。推荐 `MAAP_API_KEY_FILE=/绝对路径/key.txt`（文件权限必须为 0600），避免将 Key 写进命令行或提交到 Git。支持 `MAAP_API_KEY` 环境变量，但不会从其他连接器配置自动提取。

必须同时显式设置 `BRIDGE_DRY=0` 才会真实下发。真实网关将产生真实消息，费用与收发范围取决于平台授权。默认真实地址为 `wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg`，保留 TLS 校验。

白名单始终生效，空名单失败；主动下发和上行回复均检查。`ws_sent` 只表示本地 WebSocket 写出，无业务 ACK，不能作为网关受理或手机送达凭证。

## 状态解释

- `runtimeReady`：配置与连接器组件启动成功。
- `acpStartupHandshake`：启动时 ACP initialize 成功，是一次历史检查。
- `acpReady`：已创建的发送者会话客户端当前标记为就绪，不是后台主动健康探测；具体失败信息见 `sessions[].error`。
- `wsConnected / wsAuthed`：当前网关连接认证标记。
- `dry`：全部下行发送是否被拦截；DRY 不阻止接收消息和调用模型。
- `processed`：任务完成且发送路径返回成功的计数；在 DRY 下也会计数，不代表手机送达。

模拟 stdio 模式下，宿主关闭 MCP stdin 后连接器退出。生产模式已增加用户级 launchd 后台和独立 MCP 代理；关闭一个 MCP 客户端不会停止后台。未修改 WorkBuddy 全局权限。网关断线会退避重连；ACP 任务失败不自动重放，避免重复执行有副作用的任务。不同发送者会话只在本次进程内保留，重启后新建。暂不适合作为无人工监管的公共服务。

## 验证与材料

- `npm test`：纯策略、配置合并、MCP、HTTP/SSE、WebSocket 和入口模拟闭环。
- `npm run doctor`：只进行 ACP 建连与 initialize，然后断开，不发送 prompt。
- `npm run test:live`：真实 WorkBuddy 默认拒绝策略测试，只使用合成测试目录。
- `node scripts/test-fixture-actions.cjs`：一次性批准精确测试文件操作，验证读写和终端能力。
- `node scripts/test-live-bridge.cjs`：临时模拟网关 ↔ 真实本地 WorkBuddy 的纯文本闭环。

测试摘要见 `docs/TEST-REPORT.md`，官方渠道对照见同一报告。原包到此版本的代码变更见 `docs/UPSTREAM.diff`。原包运行日志、会话缓存和心跳文件未复制到分发包；依赖有 lockfile，安装禁用生命周期脚本。

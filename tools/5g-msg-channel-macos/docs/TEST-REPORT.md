# macOS 连接器测试与官方渠道对照

> 以下是首轮模拟/权限测试记录。之后已完成真实网关认证及首次真实发送，最新状态见 [生产接入记录](PRODUCTION.md)。

测试日期：2026-09-09（Asia/Shanghai）。环境：macOS arm64，Node v22.22.3，WorkBuddy 5.5.2。本报告区分真实本地宿主、模拟网关与官方 API，不把模拟结果计作真实短信验证。

## 已完成的改造

- 提供 macOS `.command` 安装/检查入口、Node 诊断工具、MCP JSON 配置预览/备份/合并。
- 默认模拟网关 + 全路径 DRY；生产必须显式 `--production`，下发必须显式 `BRIDGE_DRY=0`。
- 上行和主动下发均强制非空白名单。拒绝继承非 default 的权限模式。
- 每个发送者新建独立 ACP 会话，不复用用户桌面会话，不复制原包会话缓存。
- 仅收集 `agent_message_chunk` 正文，排除思考事件与历史回放；正确处理 UTF-8/SSE 分片。
- 权限请求默认拒绝；不实现客户端文件/终端 RPC，不自动开启权限绕过模式。
- ACP 超时、HTTP 错误、无结果流明确失败，失败任务不自动重放；有限队列和进程内消息去重。
- 状态分别表达启动握手、会话状态、网关认证和 DRY；`ws_sent` 不再标注为送达成功。
- 依赖已安装并锁定版本，未使用原包的旧日志、会话或心跳数据。保留原 MaaP 协议适配器并收紧模拟网络、认证前收包和消息大小。

## 验证结果

| 检查 | 方法与结果 |
| --- | --- |
| 依赖 | `npm install --ignore-scripts --no-audit --no-fund` 成功，生成 lockfile |
| 代码语法 | 14 个 CJS 文件 `node --check` 通过，macOS 脚本 `zsh -n` 通过 |
| JSON | package.json、package-lock.json、写入后的 WorkBuddy mcp.json 均合法 |
| 自动化 | `npm test`：11/11 通过；网络用例只绑定 127.0.0.1 |
| 真实 ACP | 本机 connect / initialize / session/new / session/prompt 成功，测试结束断开连接 |
| 纯文本 | 新会话返回 `MACOS_ACP_OK`，stopReason=end_turn |
| 读取 | 读取指定临时测试文件，回复随机内容，与本地生成值一致 |
| 写入 | 只授予精确测试路径和内容的一次性许可后，落盘文件内容严格等于 `WRITE_FIXTURE_OK` |
| 终端 | 只授予固定 printf 命令的一次性许可后，落盘文件内容严格等于 `SHELL_FIXTURE_OK` |
| 拒绝权限 | 默认拒绝处理器下，Write 和 Bash 请求均返回 cancelled / PERMISSION_DENIED，没有目标文件 |
| 本地完整闭环 | MCP 握手 → 临时模拟 WS 网关 → 真实 WorkBuddy → 模拟网关下行，收到 `MACOS_BRIDGE_OK` |
| 官方鉴权反例 | 不带凭据 GET 官方 `/openapi/v2/localassistant/message?limit=1`，HTTP 401，`missing Authorization Bearer header` |
| 真实 MaaP 网关 | 未连接；未复用旧连接器 Key，未测试收费/号码权限/手机送达 |
| 官方完整 OAuth | 未注册新应用、未执行用户 OAuth 授权，未验证该账号的已批 Scope |

自动化覆盖白名单、DRY、发送者会话分离、去重、任务失败不重放、配置保留/备份/脱敏 diff、MCP 状态/错误、SSE 中文与正文过滤、权限拒绝、HTTP 错误、WS 认证前拒收、入口闭环、权限模式检查、空流和超时。

首次纯文本调用曾发生 WorkBuddy 上游模型网络错误：HTTP 502 / BAD_DECRYPT。它是实际失败，未标记成功。后续使用全新会话和明确的绝对路径重新验证，四项能力均通过；此结果不能证明服务可连续 7×24 小时稳定运行。

## 权限的实际含义

WorkBuddy 会话报告的当前模式为 `default / Always Ask`。读取、写入、终端命令测试中均观察到权限请求；测试专用批准器只选择 `allow_once`，从未选择全局/持久许可。

WorkBuddy 报告 `sandbox=false`，说明宿主当前没有启用其命令隔离层。测试未修改该设置。一次相对路径写入尝试指向 WorkBuddy 自己的宿主目录而非传入 ACP_CWD，因此工作目录只能作为执行提示，不能视为文件访问控制。最终读写测试使用了明确的临时文件绝对路径。

不同发送者分配不同会话能避免常规上下文串用，但不提供不同 macOS 用户或进程级沙箱。对外服务仍需要真正的工具授权、资源隔离、配额和审计策略。

`initialize` 返回图像提示、嵌入上下文、HTTP/SSE MCP、加载会话等能力声明。本次只实测纯文本和限定文件/命令动作；能力声明不等于这些功能已全部验证或授权。

没有测试私人文件、任意目录访问、浏览器登录态、钥匙串、完全磁盘访问、屏幕录制、辅助功能、系统管理员/root 权限。不能根据这里的文件测试推导这些权限存在。

## 三种接入方式

| 比较项 | 此连接器的本地 ACP 路径 | 官方自定义 MCP 连接器 | 官方 Open API |
| --- | --- | --- | --- |
| 调用方向 | 外部消息触发本机 WorkBuddy | WorkBuddy 调用外部服务的工具 | 应用经授权调用 WorkBuddy 服务 |
| 接入点 | 127.0.0.1 的宿主 ACP 端点 | stdio / HTTPS MCP | 官方 HTTPS Open API；云端任务另有 ACP 通道 |
| 权限来源 | 本机已登录宿主、会话模式、工具确认、OS 权限 | 宿主信任连接器 + 第三方服务授权 | 注册应用、申请 Scope、用户 OAuth 2.1 授权 |
| 官方接口资格 | 本地能连通不构成官方 API 授权 | 安装自定义 MCP 不授予 WorkBuddy Open API Scope | 根据已批准 Scope 和用户授权调用 |
| MAAP_API_KEY | 只用于 5G 网关 | 可作为服务自身凭据 | 不能代替 WorkBuddy Bearer token |
| 是否需要开电脑 | 此路径需要 WorkBuddy 运行且在线 | 本地 stdio 需要宿主；远程 MCP 视部署而定 | 本地助理需要 PC 在线；云端任务是独立能力 |
| 文件/命令控制 | 实测受 default 模式确认控制，当前宿主未开 sandbox | 外部 MCP 自身的实现与权限边界 | Scope 控制平台接口；本地动作仍受宿主权限约束 |
| 可维护性 | 依赖本机日志发现及 ACP 版本行为，未证实为长期稳定公开接口契约 | 官方记录的连接器接口 | 官方记录的授权与接口契约 |

官方文档列出的本地助理 Scope 是 `user.localassistant.invokable`（发消息驱动 PC Agent）和 `user.localassistant.readable`（在线状态、消息历史）。云端任务使用 `user.task.invokable` / `user.task.readable` 等权限。本次未获得这些 Scope。

来源（2026-09-09 查阅）：

- [WorkBuddy 第三方应用：OAuth、Scope 与申请流程](https://open.workbuddy.cn/docs/third-party-app)
- [WorkBuddy Open API：本地助理、云端任务和 ACP](https://open.workbuddy.cn/docs/openapi)
- [WorkBuddy 连接器：MCP 与 stdio 配置](https://open.workbuddy.cn/docs/connector)

## 安装状态与限制

已在此 Mac 的 `~/.workbuddy/mcp.json` 新增 `5g-msg-channel-macos`，使用 macOS 上探测到的 Node 绝对路径。模式是 `--mock`，`BRIDGE_DRY=1`。备份文件为 `mcp.json.bak-1788935960359`。写入后比较确认所有原有连接器内容保持不变。配置片段 diff 见 `MCP-CONFIG.diff`。

MCP 协议和真实 WorkBuddy ACP 已通过独立进程测试；未通过管理页实际点击信任/重启验证宿主加载新条目。可在 WorkBuddy 管理页找到新条目后启用/重启。此次未停止旧的 5G 服务，也未修改其 Key。

所有测试进程正常完成；测试创建的 WorkBuddy 会话可能保留在其历史列表中，未删除用户数据。诊断原始结果位于本项目被 Git 忽略的 `var/`，分发 ZIP 不包含这些结果、测试目录、密钥或用户配置。

此版本适用于个人本地联调。下一阶段如需正式远程服务，应优先按官方本地助理 API 的 Scope 与 OAuth 接入，并单独验证真实网关账号、号码与送达回执。

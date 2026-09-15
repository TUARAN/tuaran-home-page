# 5g-msg-channel-legacy-macos

基于旧 `5g-msg-channel 1.0.0` 的 macOS 安全修正版，版本 1.1.0。保留原 MaaP/ACP 主流程，增加共享 launchd 后台、Key 文件、严格白名单、按发送者隔离 Session、消息去重、超时不重放和下发错误观察。

WorkBuddy MCP 入口为 `src/mcp-client.cjs`，真实后台由 `scripts/service-launch.cjs` 启动，经 `~/.workbuddy/5g-legacy-macos.sock` 共享。后台与现有连接器共用 18567 单实例锁，同一个 MaaP Key 不允许两个实现同时运行。

## 一键安装大包

在 Apple Silicon Mac 上运行 `npm run build:standalone`，会在仓库 `desktop-dist/` 生成自带 Node.js 与全部依赖的 DMG。用户打开 DMG 后双击“安装新消息手机”，首次填写 MaaP API Key 与允许号码即可完成安装；随后只需在 WorkBuddy 中完成一次连接器信任。

安装包不会包含构建机器上的 Key、号码、日志、收件箱或会话数据。

生产配置必须提供 `MAAP_API_KEY_FILE`、非空 `ALLOWED_SENDERS`、`BRIDGE_MODE=production`。`BRIDGE_DRY` 只有显式设为 `0` 才允许真实下发。

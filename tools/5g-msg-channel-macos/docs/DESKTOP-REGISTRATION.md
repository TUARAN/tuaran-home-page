# 本地桌面任务登记实测（2026-09-09）

结论：发现桌面本地任务管理入口；仅使用已登记的任务 ID 调用底层 ACP，未能把消息写入桌面历史。尚未完成原生同步修复。没有改动 WorkBuddy 安装包或直接写入其数据库，也未切换生产手机通道。

## 已定位的入口

安装包 main/contract2.js 定义 session:create、session:sendMessage、session:load、session:list、session:event 与 session:upserted。
main/application-manifest.js 的 SESSION_CHANNEL_MAP 将 createSession、prompt、loadSession 映射到这些 IPC 通道。
main/server.js 的 registerSessionsHandlers 调用 sessionManager；createSession 会触发 emitSessionRecordUpsert；loadSession 会恢复或重放上层保存的历史。
main/index.js 的 dispatchWbInvoke 将桌面 renderer 的请求经 Electron IPC 分发到 daemon；wb:invoke 的调用上下文由宿主构造。
main/server.js 的 DaemonServer 明确不开放 HTTP listener，正常桌面 daemon 由 stdio 生命周期管理。底层 /api/v1/acp 并非上述 IPC 业务接口。

## 实测

在 WorkBuddy 界面新建“手机渠道桌面同步测试任务”，只提交无工具调用的测试消息。桌面出现 DESKTOP_READY；只读 SQLite 查询确认对应任务存在。

随后通过独立 ACP 连接，向 session/load 传入该桌面任务 ID。调用被接受，但历史正文片段数为 0，因此不能据此认定已绑定同一上层会话。该连接的无工具 prompt 返回 REGISTERED_ACP_OK。

桌面即时检查以及切换任务后重新打开，均只有最初的 DESKTOP_READY，没有外部 ACP 测试消息或回复。测试明确不通过。

任务及结构化结果见 ../var/desktop-registration-test.json。测试任务保留在桌面，可供复核。

## 修复所需条件

本地方案仍有研究空间：需要运行于 WorkBuddy 认可的宿主集成上下文中的适配层，把渠道消息提交到上层会话 API，并将该任务的正文事件转回网关。仅向 ACP 传 sessionId、修改身份提示词或给 sessions 表补一行都不足以实现。

当前尚未验证到可供独立 stdio MCP 进程调用上述上层接口的受支持本地入口。不能把内部 IPC 方法名称当作可直接请求的 HTTP URL，也不能在未验证之前宣称必须使用云端 OAuth。

后续验收必须包含：真实手机输入在指定桌面任务出现；回复在两端一致；离开并重新打开任务仍有记录；WorkBuddy 重启后历史仍在；审批由同一上层任务负责。

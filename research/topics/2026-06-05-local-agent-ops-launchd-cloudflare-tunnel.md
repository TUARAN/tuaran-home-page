---
title: 本地 Agent 常驻：launchd 与 Cloudflare Tunnel
category: topics
topic_type: tech
tech_type: agents_automation
content_type: engineering_case
date: 2026-06-05
updated: 2026-11-04
tags: [launchd, Cloudflare Tunnel, cloudflared, macOS, Agent Ops, Zero Trust Access]
summary: 按 2026-11-04 Cloudflare Tunnel 文档对齐：远程管理隧道、Outbound-only、Access 保护本地服务；macOS 用 launchd KeepAlive 保活 cloudflared 与本地 Agent 进程。
tldr: Tunnel 把本机 HTTP 服务挂到 Cloudflare 主机名且不必开入站端口；Access 做身份门。launchd 只解决「开机与崩溃后还在」。安全边界在 Access 策略与本机监听范围，不在「有了隧道就安全」。
subjects: [web_cloud]
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

1. **Cloudflare Tunnel**（`cloudflared`）从源站**主动连出**到 Cloudflare；文档路径现归在 Cloudflare One → Networks → Connectors。[Get started](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/)
2. **推荐形态**：仪表盘创建远程管理隧道（Remotely-managed）；发布应用时配置 **Published application** 路由到 `http://localhost:<port>`。[Create tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/)
3. **暴露面**：隧道让公网主机名可达你的本地服务；**身份与授权**应另配 Cloudflare Access 应用，而不是假设「知道 URL 的都是自己」。
4. **macOS 常驻**：用 `launchd`（`KeepAlive` / `RunAtLoad`）拉起 `cloudflared` 与本地 Agent/HTTP 进程；这是进程保活，不是安全控件。
5. **防火墙**：源站需能访问 Cloudflare 隧道端口（文档提示常见为 **7844**）；先做 Connectivity pre-checks。

## 二、事实层：现行 Tunnel 步骤（仪表盘）

来源：Create a tunnel (dashboard)，文档标注 Last updated **Jun 23, 2026**（抓取日 2026-11-04）。

### 2.1 创建隧道

1. 登录 Cloudflare Dashboard → **Networking → Tunnels** → Create a tunnel。
2. 命名 → Create Tunnel。
3. 按 OS 复制安装/运行命令，在**源机**执行；等待状态变为已连接后 Continue。
4. 发布应用：Routes → Add route → **Published application** → 选域名/子域名 → Service URL 填 `http://localhost:8000`（示例；按本机端口改）。
5. 列表页状态应为 **Healthy**；Inactive / Down / Degraded 走官方排障文。

多级子域名可能需要 Advanced Certificate——以文档 Note 为准。

### 2.2 与「本地 Agent」的关系

典型拓扑：

```text
公网用户 → Cloudflare 边缘 →（Access 策略）→ Tunnel → cloudflared → 127.0.0.1:PORT → Agent/HTTP
```

- Agent 只监听本机回环或受控接口。
- `cloudflared` 是唯一出站长连接组件。
- 不在路由器上做端口转发。

旧文档常见 `cloudflare-tunnel` 独立产品树；现行入口在 **Cloudflare One / Cloudflare Tunnel** 连接器文档。命令旗标以你安装的 `cloudflared` 版本 `--help` 为准。

### 2.3 launchd 保活（工程约定）

macOS 用户级示例思路（路径与 Label 按机器改；**不要**把凭证写进可提交仓库）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.example.cloudflared</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/cloudflared</string>
    <string>tunnel</string>
    <string>run</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/cloudflared.out.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/cloudflared.err.log</string>
</dict>
</plist>
```

远程管理隧道通常用安装命令写入的服务凭证；若改用本地 `config.yml`，确保文件权限收紧。Agent 本体另写一条 plist（工作目录、环境变量、密钥从 Keychain 或受控 env 注入）。

加载：`launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.example.cloudflared.plist`（具体子命令随 macOS 版本略有差异，以 `man launchctl` 为准）。

## 三、结构：何时用这套 Ops

| 目标 | 做法 | 注意 |
|---|---|---|
| 临时演示本地 Web UI | 快速隧道 / 短时 `cloudflared` | 仍建议 Access；用完关掉 |
| 长期个人 Agent 控制面 | 远程管理隧道 + Access + launchd | 日志轮转；密钥轮换 |
| 团队内网替代 | Tunnel CIDR / 私有网路由 + Zero Trust | 超出本文个人 Ops 范围 |
| 仅本机 CLI Agent | 不必开隧道 | 少暴露面 |

**不要**：把带管理接口的 Agent 裸挂 Published application 且 Access 策略为 Bypass Everyone。

## 四、外部研判

本地 Agent 常驻的运维问题拆成两半：**进程还在**（launchd）与**谁能连上**（Tunnel + Access）。混淆二者会导致「隧道通了就当安全完成」。Cloudflare 侧文档已把创建路径收束到仪表盘远程隧道；个人笔记里的旧 CLI 旗标应按当前 `cloudflared` 与 Zero Trust 文档重跑一遍再写进 runbook。

## 五、信息来源与持续验证

复核截至 **2026-11-04（Asia/Shanghai）**。

- [Tunnel get started](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/)
- [Create a tunnel (dashboard)](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/)
- [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/)（策略配法以该树为准）
- Apple `launchd` / `launchctl` 手册（系统自带）

### 持续验证

- Dashboard 菜单若从 Networking > Tunnels 迁走，以 Cloudflare One 导航当日文案替换第二节步骤编号。
- `cloudflared` 安装包路径（Homebrew vs 官方包）随 OS 而变；plist 内绝对路径需本机 `which cloudflared` 核定。

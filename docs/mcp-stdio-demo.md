# 本地 stdio MCP Demo 与 WorkBuddy 联调

## stdio 模式是什么

stdio MCP Server 是一个由 MCP Client 在用户电脑上拉起的子进程。WorkBuddy 不请求 HTTPS URL，而是执行配置中的 `command` 和 `args`，然后通过子进程的 stdin/stdout 交换一行一个的 JSON-RPC 消息。

```text
WorkBuddy (MCP Client)
  ├─ spawn: node /absolute/path/server.mjs
  ├─ stdin  ──▶ initialize / tools/list / tools/call
  └─ stdout ◀── JSON-RPC result
                    │
             本地 Node.js 进程
             ├─ 读取本地密钥文件
             └─ AES-256-GCM 加解密
```

因此，stdio 通常需要把 MCP Server 的可执行程序、脚本或 npm/Python 包放在本机，或允许 `npx` 首次运行时下载。它适合本地文件、桌面应用、内网数据库、硬件和密钥操作；HTTPS MCP 更适合多用户、跨设备、集中升级和 OAuth 授权。

> 本地执行不等于数据一定不会离开电脑。WorkBuddy 会看到工具参数和结果，它们也可能被放入模型上下文。本 demo 保证的是“密钥和实际加解密计算在本机进程”，不是“工具的明文入参永不进入 AI Client”。

## Demo 内容

服务端位于 `tools/mcp-stdio-demo/server.mjs`，只使用 Node.js 内置模块，不需要额外安装依赖。

- `local_runtime_info`：确认本地进程、平台、PID 和密钥来源。
- `local_encrypt_text`：用随机 96-bit IV 的 AES-256-GCM 加密。
- `local_decrypt_text`：校验 GCM Auth Tag 后解密。

所有协议输出都写入 stdout，运行日志只写入 stderr，避免破坏 stdio 协议。单次文本最大 16 KiB，本例不读取任意文件、不执行 shell，也不开放网络端口。

## 1. 先在终端自测

仓库根目录执行：

```bash
npm run mcp:stdio:check
```

成功时会输出：

```text
✓ stdio 握手、工具发现、加密和解密调用均通过
```

这个测试会真实拉起子进程，完成 `initialize` → `tools/list` → 加密 → 解密，不依赖 WorkBuddy。

## 2. 准备本地密钥

推荐把密钥放在仓库之外，并只赋予当前用户读权限。macOS/Linux 示例：

```bash
mkdir -p ~/.config/tuaran-mcp
openssl rand -base64 32 > ~/.config/tuaran-mcp/crypto-demo.key
chmod 600 ~/.config/tuaran-mcp/crypto-demo.key
```

Windows PowerShell 示例：

```powershell
New-Item -ItemType Directory -Force "$HOME\.config\tuaran-mcp"
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)) | Set-Content "$HOME\.config\tuaran-mcp\crypto-demo.key"
```

也可设置 `LOCAL_MCP_SECRET`，但直接把密钥写在 `mcp.json` 中不适合生产环境。

## 3. 配置 WorkBuddy

WorkBuddy 官方流程是进入 **Settings → MCP → Add MCP Server**，贴入配置后点击 **Try to Run**。也可编辑 `~/.workbuddy/mcp.json`。

将下面两个路径替换为你机器上的绝对路径：

```json
{
  "mcpServers": {
    "tuaran-local-crypto-demo": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/tuaran-home-page/tools/mcp-stdio-demo/server.mjs"
      ],
      "env": {
        "LOCAL_MCP_SECRET_FILE": "/ABSOLUTE/PATH/TO/crypto-demo.key"
      },
      "description": "本地 AES-256-GCM 加解密联调 Demo"
    }
  }
}
```

Windows 的 JSON 路径建议用正斜杠，例如 `C:/Users/name/project/tools/mcp-stdio-demo/server.mjs`。如果 `Try to Run` 报 `node not found` 或 `ENOENT`，把 `command` 换成 `which node` (macOS/Linux) 或 `where.exe node` (Windows) 返回的 Node 绝对路径。

## 4. WorkBuddy 内验收

按顺序发送下面三句：

1. `请调用 tuaran-local-crypto-demo 的 local_runtime_info，告诉我 transport、processId 和 secretSource。`
2. `请用本地 MCP 加密“WorkBuddy stdio 联调成功”，完整返回密文。`
3. `请用同一个本地 MCP 解密上一步的密文。`

预期结果：`transport` 是 `stdio`，`secretSource` 是 `file`，密文以 `v1.` 开头，解密后与原文一致。

## 排错顺序

| 现象 | 检查 |
| --- | --- |
| `Try to Run` 无法启动 | `command` 和脚本是否为绝对路径，WorkBuddy 是否能访问该文件 |
| 连接后没有工具 | 先跑 `npm run mcp:stdio:check`；确认 stdout 没有任何额外日志 |
| 工具提示未配置密钥 | 检查 `LOCAL_MCP_SECRET_FILE` 绝对路径和文件读权限 |
| 重启后旧密文无法解密 | 密钥文件被替换，或连接到了另一套配置 |
| 改代码后不生效 | 在 MCP 设置中停止并重新启动该 Server，让 WorkBuddy 拉起新进程 |

生产化时还应加上操作系统密钥链/KMS、工具白名单、输入分级、审计与人工确认；不要将“能在本地执行”直接视为“可以无限权读取本机”。

# 在 WorkBuddy 中注册 MCP —— 小白安装手册

> 配套连接器：`5g-msg-channel`（版本 1.0.0）
> 难度：★☆☆☆☆（按步骤复制粘贴即可，不需要懂代码）
> 耗时：约 5 分钟

---

## 0. 这个手册能帮你做什么

把「5G 消息通道连接器」装进 WorkBuddy，装好后你**在对话里直接打字**就能调用它，
比如让 AI 帮你「给 13800138000 发一条 5G 消息」。

效果长这样（对话中输入）：
```
帮我用 send_5g 给 13800138000 发消息，内容：你好
```

---

## 1. 先想清楚：你要连什么？

本手册支持两种用法，**先选好你的场景**，后面照着对应的小节填就行：

| | 场景 A：先连本地模拟器练手 | 场景 B：直接对接真实 5G 网关（推荐小白直接用） |
|---|---|---|
| 适合谁 | 想先本地体验、不发真实短信 | 已经有平台账号，要真实收发 |
| 需要什么 | 什么都不用，模拟器自动起 | 问平台/负责人要 2 样东西（见 §4.0） |
| 会不会真发短信 | ❌ 不会，纯本地 | ✅ 会真发到手机（会产生费用） |
| 看哪一节 | 第 2、3 节 | 第 2、4 节 |

> 💡 **不想折腾模拟器？直接看场景 B（第 4 节）**，填两个值就完事。

---

## 2. 准备工作（两种场景都要做）

### ✅ ① 确认连接器文件在电脑上

打开文件夹确认存在这个文件（连接器的"入口"）：
```
E:\workbuddy\5g-msg-channel\connector\src\index.cjs
```
如果找不到，先找项目负责人要完整项目文件夹。

### ✅ ② 找到 node 程序的路径（复制备用）

用记事本打开这个文件（文件里只有一行字，是版本号）：
```
C:\Users\jx\.workbuddy\binaries\node\versions\current
```
我的电脑上是 `22.22.2-2`，那么 node 程序的完整路径就是：
```
C:\Users\jx\.workbuddy\binaries\node\versions\22.22.2-2\node.exe
```
> 💡 每台电脑版本号可能不同，请用你自己记事本里看到的那一行。

### ✅ ③ （可选）想指定 AI 用哪个会话？

在 `C:\Users\jx\.workbuddy\mcp.json` 这个文件的 `"env"` 里加一行即可（下面会带你看在哪加）：
```
ACP_SESSION_ID=<会话ID>
```
> 不填也没关系，连接器会自动新建并记住，下次自动复用。填了表示"优先用这个会话，如果失效会自动新建"。

---

## 3. 场景 A：连本地模拟器（纯本地练手）

### 3.1 启动模拟器（在终端里执行一次）
```
cd E:\workbuddy\5g-msg-channel\simulator\src
node sim-server.cjs 8066
```
看到 `模拟器已启动` 字样即可。浏览器打开 `http://127.0.0.1:8066/` 能看到页面就 OK。
（模拟器窗口别关，最小化即可。）

### 3.2 在 WorkBuddy 界面添加（方式 ①，推荐新手）

1. 打开 WorkBuddy → 左侧边栏找 **「连接器 / MCP」** → 点进去
2. 点 **「添加 MCP 服务器」** 或右上角 **「+」**
3. 按下表填写：

| 填写项 | 填什么 | 示例 |
|---|---|---|
| 服务器名称 | 随便起个名字 | `5g-msg-channel` |
| 命令 / Command | 第 2 步② 的 node.exe 路径 | `C:\Users\jx\.workbuddy\binaries\node\versions\22.22.2-2\node.exe` |
| 参数 / Args | 入口文件路径 + `--mock`（**场景 A 必须有**） | `E:\workbuddy\5g-msg-channel\connector\src\index.cjs`<br>`--mock` |
| 环境变量 / Env | 见下表 | 见下 |

**环境变量（场景 A）**：

| 变量名 | 值 | 说明 |
|---|---|---|
| MAAP_API_KEY | `test-api-key` | 模拟器的钥匙（默认值，别改） |
| ACP_CWD | `C:\Users\jx\WorkBuddy\2026-08-06-18-47-44` | 告诉 AI 在哪个文件夹干活 |
| ACP_SESSION_ID | （可选）你的会话 ID | 想指定会话就填 |

4. 点 **保存** → 找到刚添加的 `5g-msg-channel` → 点 **「信任」**（Trust）按钮
   （⚠️ 不点信任不生效，新手最常漏这步）

### 3.3 或直接改配置文件（方式 ②）

打开 `C:\Users\jx\.workbuddy\mcp.json`，**整个替换**为（把 `<...>` 换成你的路径）：

```json
{
  "mcpServers": {
    "5g-msg-channel": {
      "command": "C:\\Users\\<你的用户名>\\.workbuddy\\binaries\\node\\versions\\<你的版本号>\\node.exe",
      "args": [
        "E:\\workbuddy\\5g-msg-channel\\connector\\src\\index.cjs",
        "--mock"
      ],
      "env": {
        "MAAP_API_KEY": "test-api-key",
        "ACP_CWD": "C:\\Users\\<你的用户名>\\WorkBuddy\\<你的项目文件夹>",
        "ACP_SESSION_ID": "<可选：你的会话ID>"
      },
      "disabled": false
    }
  }
}
```
保存 → **重启 WorkBuddy** → 找到 `5g-msg-channel` → 点 **「信任」**

> ⚠️ JSON 格式要求：路径里的 `\` 要写成 `\\`（两个反斜杠），例如 `E:\workbuddy` 要写 `E:\\workbuddy`。

---

## 4. 场景 B：直接对接真实 5G 网关（不开模拟器）

### 4.0 先找平台要 2 样东西

对接真实网关需要向平台方/项目负责人索取：

| 需要什么 | 填到哪个变量 | 长什么样（示例） |
|---|---|---|
| ① 网关 WebSocket 地址 | `MAAP_WS_URL` | `wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg` |
| ② API 钥匙 | `MAAP_API_KEY` | `ak_xxxxxxxx` |

> 💡 顺便确认：你的业务手机号（机器人号）已经开通 5G 消息服务，并且**你知道自己的手机号**（收测试消息用）。

### 4.1 在 WorkBuddy 界面添加

步骤同 §3.2，只是表格内容换成：

| 填写项 | 填什么 |
|---|---|
| 服务器名称 | `5g-msg-channel` |
| 命令 / Command | 同 §2② 的 node.exe 路径 |
| 参数 / Args | **只填入口文件路径，不要加 `--mock`**<br>`E:\workbuddy\5g-msg-channel\connector\src\index.cjs` |
| 环境变量 / Env | 见下表 |

**环境变量（场景 B，直连真实网关）**：

| 变量名 | 值 | 说明 |
|---|---|---|
| MAAP_WS_URL | 平台给的网关地址（4.0 的①） | 连真实平台 |
| MAAP_API_KEY | 平台给的钥匙（4.0 的②） | 真实认证 |
| ACP_CWD | `C:\Users\jx\WorkBuddy\2026-08-06-18-47-44` | AI 工作目录 |
| ALLOWED_SENDERS | `13800138000,13900139000` | ⚠️ 只允许这些号码触发（**强烈建议填**） |
| ENFORCE_WHITELIST | `true` | ⚠️ 开启白名单开关（配合上行填） |
| ACP_SESSION_ID | （可选）会话 ID | 想指定会话就填 |

> 🛡️ **白名单为什么重要**：真实网关下，任何能发 5G 消息到机器人号的人都能触发你的 AI 干活。
> 填上 `ALLOWED_SENDERS` + `ENFORCE_WHITELIST=true`，只有白名单里的号码才能触发，避免陌生人乱用产生费用。

点 **保存** → 找到 `5g-msg-channel` → 点 **「信任」**。

### 4.2 或直接改配置文件

打开 `C:\Users\jx\.workbuddy\mcp.json`，**整个替换**为：

```json
{
  "mcpServers": {
    "5g-msg-channel": {
      "command": "C:\\Users\\<你的用户名>\\.workbuddy\\binaries\\node\\versions\\<你的版本号>\\node.exe",
      "args": [
        "E:\\workbuddy\\5g-msg-channel\\connector\\src\\index.cjs"
      ],
      "env": {
        "MAAP_WS_URL": "wss://5gvas01.cmicmaap.com/gtw-ai/openclaw/ws/msg",
        "MAAP_API_KEY": "ak_<平台给你的钥匙>",
        "ALLOWED_SENDERS": "13800138000",
        "ENFORCE_WHITELIST": "true",
        "ACP_CWD": "C:\\Users\\<你的用户名>\\WorkBuddy\\<你的项目文件夹>",
        "ACP_SESSION_ID": "<可选：你的会话ID>"
      },
      "disabled": false
    }
  }
}
```
保存 → **重启 WorkBuddy** → 找到 `5g-msg-channel` → 点 **「信任」**

### 4.3 重要区别提醒（场景 A vs B）

| | 场景 A（模拟器） | 场景 B（真实网关） |
|---|---|---|
| 参数 args 里 | 有 `--mock` | **没有** `--mock` |
| MAAP_WS_URL | 不用填（--mock 自动连本地） | 填真实网关地址 |
| MAAP_API_KEY | `test-api-key` | 真实钥匙 |
| 测试手机号 | 模拟器页面随便发 | 用自己的手机给机器人号发短信 |

### 4.4 网关连不上怎么办？（小白排查三步）

**症状**：配好场景 B 后，对话里查状态显示 `wsConnected: false`，或日志里有
`ETIMEDOUT`（连接超时）。

**第 1 步：确认你平时能打开平台后台吗？**
- 浏览器能打开平台管理后台 → 网络通，多半是配置填错 → 检查 `MAAP_WS_URL`/`MAAP_API_KEY` 是否复制完整（key 前面有没有多空格）
- 浏览器也打不开 → 是网络不通 → 走第 2 步

**第 2 步：确认这台电脑能不能直连平台服务器？**
问平台/负责人：网关是否需要**公司内网 / VPN / 专线 / IP 白名单**。
- 需要 → 先连上内网或 VPN，再刷新看状态
- 不确定 → 联系平台给「可访问的出口 IP 白名单」

**第 3 步：如果靠代理上网 → 给连接器配代理**
在 mcp.json 的 `"env"` 里加一行（端口换成你代理软件的端口，常见 7890）：
```json
"HTTPS_PROXY": "http://127.0.0.1:7890"
```
保存 → 重启 WorkBuddy → 点「信任」。连接器就会经代理连网关（日志会打印
`经代理连接: http://...`）。

> 📌 简单判断：在对话里输入 `用 bridge_status 工具查一下链路状态`，
> 看到 `"wsConnected": true` 即连通成功。

---

## 5. sessionId 放配置里？（上过手后想进阶再看）

可以。**两种放法**：

### 放法 ①：mcp.json 里（推荐）
在你用的那份配置（场景 A §3.3 / 场景 B §4.2）的 `"env"` 里加一行：
```json
"ACP_SESSION_ID": "d0bac45c-b979-47d2-a4d9-76f8f3ca2485"
```

### 放法 ②：连接器的 .env 文件里
在 `E:\workbuddy\5g-msg-channel\connector\` 文件夹下新建一个 `.env` 文件（没有就新建），写入：
```
ACP_SESSION_ID=d0bac45c-b979-47d2-a4d9-76f8f3ca2485
```

### 行为是什么？
```
填了 sessionId → 连接器启动时优先用这个会话
   ├─ 能用 ✅ → 就用它
   └─ 失效/报错 ❌ → 自动新建一个会话，并自动记住（下次自动用新的）
没填 → 连接器自动新建会话并记住，重启自动复用
```
> 想强制从头开始？删掉 `E:\workbuddy\5g-msg-channel\connector\.session.json` 这个文件再重启即可。

---

## 6. 验证是否成功（最重要）

打开一个新的对话，输入：
```
用 send_5g 工具给 13800138000 发一条消息，内容写：你好，这是测试
```

| 现象 | 说明 |
|---|---|
| AI 回复「sent ...」之类成功字样 | ✅ **成功！** 场景 A 去模拟器页面看；场景 B 检查自己手机 |
| AI 说「没有这个工具 / 找不到 send_5g」 | ❌ 没注册成功 → 检查配置，特别是有没有点「信任」 |
| AI 说「5G WS 未连接」 | 场景 A：模拟器没开；场景 B：网关地址/钥匙填错 |

也可在对话里输入查状态：
```
用 bridge_status 工具查一下链路状态
```
看到 `"wsConnected": true` 就说明连上了。

---

## 7. 常见问题（小白问答）

**Q1：找不到「连接器/MCP」在哪里？**
A：在 WorkBuddy 左侧边栏找，可能叫「连接器」「MCP」或插头/拼图图标。找不到就直接改 `mcp.json` 文件（方式 ②）最稳。

**Q2：「信任」按钮在哪？**
A：添加成功后，在服务器列表那一行的右侧，通常是开关或「信任 / Trust」字样。

**Q3：改了配置但没反应？**
A：先重启 WorkBuddy，再看是否点了「信任」。新手最容易漏这两步。

**Q4：怎么知道我填的 node 路径对不对？**
A：把路径复制到文件资源管理器地址栏回车，能看到 `node.exe` 文件就对了。

**Q5：报错 `auth_failed`？**
A：`MAAP_API_KEY` 填错了。场景 A 应是 `test-api-key`；场景 B 问平台要正确钥匙。

**Q6：真实网关收不到消息？**
A：① 确认 `MAAP_WS_URL`/`MAAP_API_KEY` 是平台给的真实值；② 检查你的号码是否在白名单 `ALLOWED_SENDERS`；③ 用自己手机给机器人号发条消息试试。

**Q7：我想删掉它怎么删？**
A：连接器/MCP 管理页找到 `5g-msg-channel`，点删除/禁用即可。

---

## 8. 还想了解什么

- 想了解连接器原理 / 排障日志 → 看 `connector/docs/INSTALL.md`
- 想了解本地模拟器怎么用 → 看 `simulator/docs/USAGE.md`
- 想看消息流转的时序图 → 看 `connector/docs/SEQUENCE.md`

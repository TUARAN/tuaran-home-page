# WorkBuddy ACP 本地硬件桥接台

一个只监听电脑回环地址的测试应用。硬件把文本事件交给本机 HTTP 接口，本机桥接台通过 WorkBuddy Open API 选择或创建云端任务，再通过 ACP 的 SSE + JSON-RPC 双通道进入对应会话。

它不会自动操作 WorkBuddy 桌面客户端，也不会把 client_secret、OAuth token 或 ACP token 交给硬件和浏览器。

## 架构

    硬件 / 开发板
       │  POST /v1/device/events + X-Bridge-Key
       ▼
    本机桥接台（127.0.0.1:8799）
       ├─ 本地测试界面
       ├─ OAuth token 本地文件（0600）
       ├─ WorkBuddy Open API：创建 / 查询任务
       └─ ACP：GET SSE 接收 + POST JSON-RPC 发送
                        │
                        ▼
                 WorkBuddy 云端会话

默认是 mock 模式，不访问 WorkBuddy，适合先验证硬件到电脑的链路。

## 桌面应用

本项目已经带 Electron 桌面壳。开发时运行：

    npm run desktop

第一次打开默认为 Mock 模式。在左下角“接入设置”中填写开放平台生成的 Client ID、Client Secret 与回调地址，切换为 Real 模式并保存；应用重启后，点击状态卡里的“连接 WorkBuddy”完成 OAuth 授权。

打包给其他人：

    npm run build:mac
    npm run build:win

产物在 release 目录。当前构建未配置 Apple/Windows 代码签名，仅适合内部测试；对外稳定分发前应配置开发者证书、macOS notarization 或 Windows 代码签名。

## 先跑 mock

要求 Node.js 22.12+。从本目录运行：

    cp .env.example .env
    # 把 WORKBUDDY_BRIDGE_KEY 改成至少 24 位随机值
    npm run doctor
    npm start

浏览器打开 http://127.0.0.1:8799：

1. 创建 mock 会话。
2. 在“已有会话”点“接入”。
3. 填入 .env 中的 Bridge Key。
4. 模拟硬件发送消息。
5. 在“ACP 实时事件”查看流式事件。

## 开放平台配置

在“硬件接入 → 新建应用”中建议填写：

- 硬件产品名称：ACP 短信桥接测试终端
- 应用图标：上传 1:1 方形 PNG/JPG，建议 512×512，文件小于 2 MB
- 产品介绍：用于企业内部硬件接入联调的短信式模拟终端。用户在本地桌面应用发送消息，经本机桥接服务选择或创建 WorkBuddy 会话，并通过 ACP 收发流式结果。凭据保存在用户本机。
- 硬件类型：按实际开发板或成品硬件选择，不要为了通过表单填写不符类型
- 产品页面链接：填写审核人员可以访问的真实产品说明页；本机 127.0.0.1 不能作为审核材料
- OAuth 回调地址：http://localhost:8799/oauth/callback
- Scope：只申请 user.task.readable 和 user.task.invokable

回调地址必须与 .env 的 WORKBUDDY_REDIRECT_URI 逐字一致。开放平台仅对 localhost 放开本地 HTTP 调试，因此不要把这里替换为 127.0.0.1。正式对外分发若要求 HTTPS，应先实现带 state、PKCE 或应用深链校验的安全回调中转；不要把 client_secret 放到网页前端。

## 切换真实模式

编辑 .env：

    WORKBUDDY_BRIDGE_MODE=real
    WORKBUDDY_CLIENT_ID=开放平台生成的_client_id
    WORKBUDDY_CLIENT_SECRET=创建时只展示一次的_client_secret
    WORKBUDDY_REDIRECT_URI=http://localhost:8799/oauth/callback
    WORKBUDDY_BRIDGE_KEY=至少24位随机字符串

然后：

    npm run doctor
    npm start

打开本地界面，点“连接 WorkBuddy”完成用户授权，再刷新会话列表。access token、refresh token 只写入 ./var/workbuddy-token.json，文件权限为 0600，该目录已加入仓库 .gitignore。

## 真实硬件请求

硬件需要能访问运行桥接台的这台电脑。当前安全默认值只监听 127.0.0.1，因此第一阶段建议让硬件 SDK/串口读取程序也运行在电脑上，由它调用：

    curl -X POST http://127.0.0.1:8799/v1/device/events \
      -H 'Content-Type: application/json' \
      -H 'X-Bridge-Key: 你的本机设备密钥' \
      --data '{
        "eventId": "button-0001",
        "deviceId": "dev-kit-01",
        "text": "读取当前任务状态并给出一句摘要"
      }'

成功时立即返回 HTTP 202。ACP 的流式结果和完成状态进入本地事件流 GET /v1/events，不会让硬件 HTTP 请求一直等待。

请求也可以显式传 taskId。不传时使用界面最近接入的活动会话。相同 eventId 会被去重，防止硬件重试造成重复指令。

当前版本有意拒绝监听 0.0.0.0。若下一步要让独立局域网硬件直接连电脑，应先增加设备配对、请求签名、时间戳/nonce 和 TLS，再开放局域网监听。

## 安全边界

- client_secret 只存在于本机环境变量。
- OAuth token 只存在于本机权限受限文件。
- ACP token 只保存在桥接进程内存。
- 浏览器不读取以上三类凭据。
- 硬件只持有独立的 Bridge Key。
- ACP 发来的权限请求显示在本地界面，由用户明确允许或拒绝；桥接台不自动审批。
- Web 请求执行 Origin 检查，设备入口额外使用常量时间比较验证 Bridge Key。

## 测试

    npm test

测试覆盖回环监听限制、真实模式配置检查、OAuth 回调参数、token 刷新、SSE 分块解析、ACP 会话接入和硬件事件去重。

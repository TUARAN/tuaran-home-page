# X 站长分发

文章页对站长显示“站长分发”按钮。点击后，公开站的 Edge API 会再次校验站长 Session，并使用 X OAuth 1.0a 用户身份直接创建一条 Post。浏览器不会接触 X 凭据，也不需要安装浏览器扩展或 Codex 插件。

## 发布内容

首版发布一条由“标题、摘要、原文链接”组成的 Post。X 的创建接口不接收 Markdown 文章，因此不直接上传完整 Markdown，也暂不拆分线程或上传封面。正文采用保守的字符权重截断，给 X 的短链接计数预留 23 个字符。

## X 侧准备

1. 在 X Developer Console 创建 Project 和 App。
2. 将 App 权限设为 Read and Write。
3. 生成该站长 X 账号的 Consumer Keys 与 Access Token and Secret。若修改过 App 权限，需要重新生成 Access Token。
4. 确认当前 X API 套餐允许调用 `POST /2/tweets`。

官方接口说明：[Create or Edit Post](https://docs.x.com/x-api/posts/create-post)；认证支持范围：[X API v2 authentication mapping](https://docs.x.com/fundamentals/authentication/guides/v2-authentication-mapping)。

## 服务端环境变量

本地写入 `.env.local`，线上写入承载 `2aran.com` 公开站的 Cloudflare Pages 项目 Secrets：

```text
X_API_KEY=
X_API_KEY_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_TOKEN_SECRET=
```

四个值必须全部配置，且不能使用 `NEXT_PUBLIC_` 前缀。配置完成后重新部署公开站。

## 权限与失败行为

- 客户端只对 `/api/me` 返回 `isOwner: true` 的会话展示按钮。
- `POST /api/distribution/x` 使用统一的 `getOwnerOrReject` 再做服务端权限校验。
- API 只接受本站文章 URL，避免误把任意外链作为本站文章发布。
- X 未配置、鉴权失败、套餐限制或网络错误时不会伪装成功，页面会显示失败提示。

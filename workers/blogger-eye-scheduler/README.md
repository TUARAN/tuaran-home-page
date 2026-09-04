# 小眼睛定时 Worker

独立 Cloudflare Worker，每 20 分钟检查一次 `https://2aran.com`，并把 HTTP 状态、耗时、执行节点、出口 IP 和相邻两次 IP 是否变化写入主站 D1。

## 运行模式

- 免费节点（当前默认）：`BLOGGER_EYE_FREE_PROBES=globalping`，未配置可用的自有 Runner 时，使用 Globalping 公共探针，按新加坡、日本、美国、德国、澳大利亚、香港六个地区循环。每轮选一个探针 GET 目标页面，再用 measurement ID 复用同一探针，GET 同域 `/cdn-cgi/trace` 获取来源 IPv4。`resolvedAddress` 是目标服务器 IP，不能作为出口 IP。
- 关闭免费节点且未配置 Runner：由 Cloudflare Worker 直接检查。跨 Zone 请求可能显示固定地址 `2a06:98c0:3600::103`，该模式只用于可用性检查，不代表 IP 轮换。
- 配置 Runner：每轮只选择一个 Runner，D1 保存下一节点游标；两个以上不同公网出口可实现按节点轮换。

Globalping 无需账号或 API 密钥。按 [官方 API](https://globalping.io/docs/api.globalping.io) 2026-09-04 的额度，未认证用户每小时 250 次测试；正常每轮 2 次、每小时 6 次，重定向另计。额度按调用 IP 共享，Cloudflare 上仍可能触发限流。测量仅包含公开的授权域名，不传递 Cookie、登录令牌或 Runner 密钥。公共测量结果可由测量 ID 查询。

节点离线、429、超时或来源 IP 无法验证会记录失败，游标仍前进到下个地区；不会回退直连并宣称轮换成功。地区池不代表独占固定 IP，也不保证每次 IP 必然改变。`ip_changed` 仅比较两次成功验证的回显 IP。免费模式单轮整体超时 60 秒，单次测量最多查询 12 次并遵循 ETag / 1 秒轮询间隔。仅目标域名下的 HTTPS 重定向可继续执行。

如果账户级 D1 读取额度暂时耗尽，Worker 会按当前 20 分钟时间槽确定 Runner，不让状态读取失败阻断网站检查；历史仍优先以追加写入方式保存到 D1，状态读取恢复后自动回到 D1 游标。

## 配置 Runner

编辑 `wrangler.jsonc` 中的 `BLOGGER_EYE_RUNNERS`，值为 JSON 数组：

```json
[
  {"id":"hkg","label":"香港","url":"https://hkg-runner.example.com/api/check"},
  {"id":"sin","label":"新加坡","url":"https://sin-runner.example.com/api/check"}
]
```

共享密钥不得写入配置文件：

```bash
wrangler secret put BLOGGER_EYE_RUNNER_SECRET
```

每个 Runner 必须设置相同的 `BLOGGER_EYE_RUNNER_SECRET`，部署说明见 `../../tools/blogger-eye-runner/README.md`。

## 线上认证执行

生产环境可通过受保护的 `POST https://2aran.com/_internal/blogger-eye/run` 立即执行一次检查，用于部署验收。该路径由 Worker 单独接管，不影响主站其他页面。先设置独立随机密钥：

```bash
wrangler secret put BLOGGER_EYE_MANUAL_SECRET
```

请求必须携带 `Authorization: Bearer <密钥>`；错误或缺失密钥返回 401。该次结果写入 D1，并明确记录为 `trigger_type = manual`，不会冒充 Cron。

## 验证与部署

```bash
npm test
npm run deploy:check
npm run deploy
```

D1 表由根目录迁移 `0087_blogger_eye_scheduler.sql` 创建。Worker 公开的 `/health` 只返回调度与认证就绪状态，不暴露运行历史或 Secret。

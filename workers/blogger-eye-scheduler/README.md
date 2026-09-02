# 小眼睛定时 Worker

独立 Cloudflare Worker，每 20 分钟检查一次 `https://2aran.com`，并把 HTTP 状态、耗时、执行节点、出口 IP 和相邻两次 IP 是否变化写入主站 D1。

## 两种运行模式

- 未配置 Runner：由 Cloudflare Worker 直接检查。跨 Zone 请求可能显示固定地址 `2a06:98c0:3600::103`，该模式只用于可用性检查，不代表 IP 轮换。
- 配置 Runner：每轮只选择一个 Runner，D1 保存下一节点游标；两个以上不同公网出口可实现按节点轮换。

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

# 站点探活定时 Worker

独立 Cloudflare Worker，每 5 分钟对 `https://2aran.com/` 和 `/api/site-health` 做 HTTP 检查。这是站点探活的**主跑手**；GitHub Actions `Site status monitor` 改为每 30 分钟跑一次的备份路径。默认不另搭 Uptime Kuma。

Cloudflare Pages 本身不支持 cron，所以探活调度必须放在这个独立 Worker 里。

## 当前还未上线

本目录只随预览 PR 提交代码、测试和说明。在站长说「合」并且完成一次对该 Worker 的部署之前，cron **不会**在生产环境触发。在此之前，仓库里已经上线的探活入口仍是 GitHub 备份工作流。

不要在未获站长部署授权时执行 `wrangler deploy` 或 `wrangler versions deploy`。

## 探活口径

- 独立 HTTP 检查：首页 `GET /` 期望最终状态 2xx；`GET /api/site-health` 期望 HTTP 200 且 JSON `healthy !== false`。
- 单次检查失败后重试 2 次（共 3 次），间隔 2 秒。
- 连续 3 次失败视为宕机，连续 3 次成功视为恢复；只在状态变化时写入 Worker 告警日志。首次达到连续成功只建立基线，不告警。
- 若站点仍可达，Worker 会 POST `/api/site-status/monitor`，沿用公开公告的连续失败/成功计数。
- 上一轮状态写在 `CONTENT_FEED`（`tuaran-content-feed`）的 `site-status/scheduler-state.json`，与公告对象分开，避免覆盖站长人工公告。

## 配置

`SITE_STATUS_TARGET_ORIGIN` 和 `SITE_STATUS_MONITOR_URL` 写在 `wrangler.jsonc` 的 `vars` 里，只能指向 `2aran.com` 或其子域。探活和手动执行密钥必须用 Secret，不要写入仓库：

```bash
wrangler secret put SITE_STATUS_MONITOR_SECRET
wrangler secret put SITE_STATUS_MANUAL_SECRET
```

`SITE_STATUS_MONITOR_SECRET` 必须与公开站 / GitHub 的同名值一致。未配置时可兼容 `AUTOMATION_ALERT_SECRET`。

## 线上认证执行

部署后可通过受保护的 `POST https://2aran.com/_internal/site-status/run` 立即执行一轮探活，用于验收。请求必须携带 `Authorization: Bearer <SITE_STATUS_MANUAL_SECRET>`；错误或缺失密钥返回 401。该次结果明确记录为手动触发，不会冒充 Cron。

`GET /health` 或 `GET https://2aran.com/_internal/site-status/health` 只返回调度与认证就绪状态，不暴露 Secret。

## 验证

```bash
npm test
npm run deploy:check
```

部署只在站长批准合并并明确要求之后进行：

```bash
npm run deploy
```

# 站点故障公告自动化

## 工作方式

- 公开页面每分钟读取 `/api/site-status`；只有状态不是 `operational` 时才显示顶部公告。
- 当前状态和探测计数存放在 `CONTENT_FEED` R2 的 `site-status/` 前缀，不依赖 D1。
- `/api/site-health` 读取 D1 的 `sqlite_master`，验证 binding、查询能力和表目录可用性，不返回数据库错误原文。
- **主跑手**是独立 Cloudflare Worker cron（`workers/site-status-scheduler`），不依赖 GitHub Actions，也不跑在公开站 Pages 进程里。Worker 每 5 分钟对 `https://2aran.com/` 和 `/api/site-health` 做独立 HTTP 检查；单次检查失败会再重试 2 次。连续 3 次失败或连续 3 次成功才切换状态，并只在状态变化时写入告警日志。若站点仍可达，Worker 还会 POST `/api/site-status/monitor`，沿用同一套连续失败/成功计数更新公开公告。
- **备份路径**是 GitHub Actions 工作流 `Site status monitor`（`.github/workflows/site-status-monitor.yml`），每 30 分钟调用一次 `/api/site-status/monitor`，失败时带重试。GitHub 的 `*/5` 近日实际间隔可拉到数小时，不能再当主心跳。
- 人工公告优先级高于自动探测。站长在 `/admin/site-status` 解除人工公告后，自动探测重新取得控制权。
- 默认不另搭 Uptime Kuma 服务。探活口径对齐常见开源监控模型：独立 HTTP 检查、可实际跑到的间隔、失败重试、状态变化才告警。

## 部署状态（重要）

Worker cron **现在还没有上线**。本仓库只提交代码、测试和跑书；在站长说「合」且完成对该独立 Worker 的后续部署之前，定时探活仍只有 GitHub 备份工作流。不要把预览 PR 或未部署的 Worker 代码当成已经在跑的主心跳。

部署该 Worker 时（仅在站长批准合并并要求部署之后）：

1. 确认 `wrangler.jsonc` 中的 `CONTENT_FEED` 指向现有 `tuaran-content-feed`。
2. 用 `wrangler secret put SITE_STATUS_MONITOR_SECRET` 写入与公开站 / GitHub 相同的探活密钥；也可以配置 `AUTOMATION_ALERT_SECRET` 作为兼容回退。不要把密钥写入仓库或 `wrangler.jsonc` 的 `[vars]`。
3. 若要启用受保护的手动执行入口，再执行 `wrangler secret put SITE_STATUS_MANUAL_SECRET`。
4. 在 `workers/site-status-scheduler` 目录运行测试后，再按该目录 README 部署。部署前可用 `GET /health`（或 `https://2aran.com/_internal/site-status/health`）确认配置就绪，用带 Bearer 的 `POST /run` 做一次验收。

## 首次启用（公告存储与备份工作流）

1. 在公开站和后台站两个 Cloudflare Pages 项目的 Production、Preview 环境确认存在指向同一 bucket 的 `CONTENT_FEED` R2 binding。
2. 在 Cloudflare Pages Secret 中配置 `SITE_STATUS_MONITOR_SECRET`。也可以暂时复用已有的 `AUTOMATION_ALERT_SECRET`。
3. 在 GitHub Actions Secrets 中配置同名 `SITE_STATUS_MONITOR_SECRET`；值必须与 Cloudflare 一致。工作流同样兼容 GitHub 已有的 `AUTOMATION_ALERT_SECRET`。
4. 部署站点后，在 GitHub Actions 手动运行一次 `Site status monitor`，确认备份路径可用。
5. 打开 `/admin/site-status`，确认 D1 显示“连接正常”、最近探测时间已经更新。

## 接口

| 接口 | 用途 | 鉴权 |
| --- | --- | --- |
| `GET /api/site-status` | 公开公告状态 | 无；短时 CDN 缓存 |
| `GET /api/site-health` | 公开机器健康状态 | 无；不返回内部错误 |
| `POST /api/site-status/monitor` | 执行探测并推进连续成功/失败计数 | `x-site-status-secret` |
| `GET /api/admin/site-status` | 后台读取状态、探测计数和实时健康 | owner session |
| `PUT /api/admin/site-status` | 发布或解除人工公告 | owner session |
| Worker `GET /health` | 调度与认证就绪状态，不暴露 Secret | 无 |
| Worker `POST /run` | 立即执行一轮独立探活（验收用） | `Authorization: Bearer`（`SITE_STATUS_MANUAL_SECRET`） |

## 故障边界

公告适用于“页面仍能打开，但 D1 或部分动态功能异常”的情况。如果 Cloudflare Pages 整体无法访问，站内公告和监控写入接口都会同时不可用；独立 Worker 仍可继续做 HTTP 检查，并在状态变化时写入 Worker 日志（需已部署）。这种整站不可用仍建议另设不同域名或不同供应商上的独立状态页才能覆盖对外展示。

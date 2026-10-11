# 站点故障公告自动化

## 工作方式

- 公开页面每分钟读取 `/api/site-status`；只有状态不是 `operational` 时才显示顶部公告。
- 当前状态和探测计数存放在 `CONTENT_FEED` R2 的 `site-status/` 前缀，不依赖 D1。
- `/api/site-health` 读取 D1 的 `sqlite_master`，验证 binding、查询能力和表目录可用性，不返回数据库错误原文。
- GitHub Actions 每 5 分钟调用 `/api/site-status/monitor`：连续 3 次失败发布公告，连续 3 次成功解除公告。
- 人工公告优先级高于自动探测。站长在 `/admin/site-status` 解除人工公告后，自动探测重新取得控制权。

## 首次启用

1. 在公开站和后台站两个 Cloudflare Pages 项目的 Production、Preview 环境确认存在指向同一 bucket 的 `CONTENT_FEED` R2 binding。
2. 在 Cloudflare Pages Secret 中配置 `SITE_STATUS_MONITOR_SECRET`。也可以暂时复用已有的 `AUTOMATION_ALERT_SECRET`。
3. 在 GitHub Actions Secrets 中配置同名 `SITE_STATUS_MONITOR_SECRET`；值必须与 Cloudflare 一致。工作流同样兼容 GitHub 已有的 `AUTOMATION_ALERT_SECRET`。
4. 部署站点后，在 GitHub Actions 手动运行一次 `Site status monitor`。
5. 打开 `/admin/site-status`，确认 D1 显示“连接正常”、最近探测时间已经更新。

## 接口

| 接口 | 用途 | 鉴权 |
| --- | --- | --- |
| `GET /api/site-status` | 公开公告状态 | 无；短时 CDN 缓存 |
| `GET /api/site-health` | 公开机器健康状态 | 无；不返回内部错误 |
| `POST /api/site-status/monitor` | 执行探测并推进连续成功/失败计数 | `x-site-status-secret` |
| `GET /api/admin/site-status` | 后台读取状态、探测计数和实时健康 | owner session |
| `PUT /api/admin/site-status` | 发布或解除人工公告 | owner session |

## 故障边界

公告适用于“页面仍能打开，但 D1 或部分动态功能异常”的情况。如果 Cloudflare Pages 整体无法访问，站内公告和监控写入接口都会同时不可用；这种故障需要部署在不同域名或不同供应商上的独立状态页才能覆盖。

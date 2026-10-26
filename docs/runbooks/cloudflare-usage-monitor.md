# Cloudflare 每日用量监控

后台入口：`/admin/site-health?tab=usage`。每个快照按 Cloudflare UTC 自然日存入 `CONTENT_FEED` R2 的 `cloudflare-usage/YYYY-MM-DD.json`，不写 D1。页面显示最近 14 天；当天数据至少间隔 15 分钟才重新查询一次。站长可手动采集当天。

## 上线配置

1. 后台 Pages 项目配置 `CONTENT_FEED` R2 binding，指向现有 `tuaran-content-feed`。
2. 后台 Pages 项目配置 `CLOUDFLARE_ANALYTICS_TOKEN` 和 `CLOUDFLARE_ZONE_ID`。Token 需要 Cloudflare **Account Analytics: Read**，并允许读取 `2aran.com` 区域 Analytics。账号 ID 默认使用此仓库对应账号，若迁移账号则配置 `CLOUDFLARE_ACCOUNT_ID`；D1 数据库迁移时配置 `CLOUDFLARE_D1_DATABASE_ID`。
3. 后台 Pages 项目配置 `SITE_STATUS_MONITOR_SECRET`（或已有 `AUTOMATION_ALERT_SECRET`），GitHub Actions 同名 Secret 填入相同值。
4. 部署后台后，在 GitHub Actions 手动运行一次 `Cloudflare usage daily report`，检查接口返回 `ok: true`，再打开用量监控页。

GitHub Actions 每天 00:20 UTC（北京时间 08:20）调用后台采集接口，用一次 GraphQL 查询归档前一个 UTC 日的完整快照，并在 Actions 运行摘要列出总量与最高请求路径；当天数据在站长打开页面时查询。错过的日期可在已登录的后台向 `POST /api/admin/cloudflare-usage?date=YYYY-MM-DD` 发请求补档。页面刷新失败时保留历史快照并显示错误。Cloudflare GraphQL 使用按查询成本计的限流预算，不要连续点击手动采集；等待平台限流窗口结束。

## 指标口径

- Workers / Pages Functions：账号范围的 `workersOverviewRequestsAdaptiveGroups`，并按脚本列出调用量。
- D1：`d1AnalyticsAdaptiveGroups` 对指定数据库的读写行数与查询次数。参考额度以 Free 套餐显示；其他套餐以 Cloudflare 控制台为准。
- 入口路径：区域 `httpRequestsAdaptiveGroups` 的请求数，并列出主要 HTTP 状态码。包括缓存命中和超出免费 Functions 额度后未进入脚本的请求，因此不能等同于函数调用量。
- Cloudflare Analytics 为采样/汇总数据，最近数分钟可能延迟。当天数值会变化；每日 08:20 的前一天快照供复盘。

监控本身依赖后台 Pages Functions。如果整个账号的 Workers 免费额度已耗尽，当天后台可能也无法打开；GitHub Actions 采集会失败并留下运行记录，次日重试。需要独立于 Cloudflare 的告警通道时，另设外部监控。

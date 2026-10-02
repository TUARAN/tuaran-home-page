# 站点体检：流量、错误率与运行负载

记录日期：2026-09-29

最近更新：2026-10-02

检查范围：Cloudflare 最近 30 天流量、主域真实访客请求、热点接口、缓存状态、D1 查询热点，以及当前工作区中可能增加线上负载的待发布代码。

状态：检查与修复建议已记录；尚未执行线上修复。2026-10-02 新增一笔已恢复、当前无法复现的 Cloudflare 1102 运行事件。本记录使用当前能取得的聚合数据定位风险，不替代逐请求日志与发布后的回归验证。

## 0. 近期运行事件

### 2026-10-02 Cloudflare Error 1102

- 发生时间：2026-10-02 23:04:50（Asia/Shanghai），即 15:04:50 UTC。
- 现场标识：Ray ID `a4449a136d6b5ddd-HKG`，Cloudflare 边缘节点为香港；截图未保留触发错误的完整 URL 路径。
- 用户现象：页面返回 `Error 1102` 与 `Worker exceeded resource limits`，该次请求未能正常完成。
- 当前状态：事件发生后主域首页已恢复访问，随后未能再次复现。影响持续时间、受影响请求数和具体路由暂时无法确认。
- 已知边界：1102 表示 Worker 超出 CPU 时间或内存限制；仅凭错误页无法区分具体是哪一种。本次没有逐请求日志证据，不把最近提交或某条业务路由直接认定为根因。
- 后续动作：暂不发布故障公告，继续观察。若再次出现，立即保存完整 URL、发生时间和 Ray ID，并在 Cloudflare 调用日志中核对 invocation outcome、CPU time、内存状态及相邻请求，确认是单路由问题还是共享 isolate 的瞬时资源压力。

## 1. 结论

流量规模较大，但不能把全部请求当作真实用户访问。截图中的统计口径包含多个 Host、自动化客户端、搜索爬虫和 Cloudflare 内部请求；桌面请求占绝大多数，Curl、Headless、未知浏览器与跨地区来源也说明机器流量占有明显比例。

按主域 `2aran.com`、`requestSource = eyeball` 过滤 Cloudflare 内部请求后，最近 30 天共有 1,547,233 次请求、384,930 次访问和约 34.5 GB 下行流量。真实请求的 4xx 比例为 11.75%，5xx 比例为 0.85%。当前主要问题是高频轮询、404 偏多、真实 5xx 缺少可追溯日志，以及若干 D1 热点查询，不是流量本身失控。

截图总览的 3.51M 请求、680.92K Visits、83.9 GB 带宽、712.85K 4xx 和 46.35K 5xx 仍可用于观察全局规模，但不能直接与上述主域真实请求口径相除比较。

## 2. 口径校正

原始 Cloudflare 聚合数据里出现了大量 504。进一步按 User-Agent、来源和源站状态拆分后，主要来自 Cloudflare Pages Early Hints 的内部探测：User-Agent 为 `nginx-ssl early hints` 或 `bastion early hints`，`originResponseStatus = 0`，缓存状态为 miss。

Cloudflare 官方文档说明 Pages Early Hints 会发起内部请求，日志中 `504 / origin status 0` 可能代表未连接源站的内部处理结果。这部分已从真实访客错误率中排除，不能当作用户实际遇到的 504 故障，也不应据此关闭业务接口。

真实访客状态码中，200 为 1,260,120 次，404 为 153,123 次，304 为 34,084 次，301 为 19,064 次，403 为 18,214 次，307 为 15,183 次，503 为 10,928 次，500 为 2,138 次。404 是当前最主要的错误响应，需要结合具体路径、来源站和爬虫规则继续拆分。

## 3. 流量热点

`/api/site-status` 在主域真实请求中达到 262,187 次，约占 16.95%，远高于任何内容页。原因已经定位：`SiteStatusBanner` 全站挂载，每个打开的页面每 60 秒以 `no-store` 请求一次接口，页面在后台或多个标签页打开时仍持续轮询；接口本身又是强制动态响应。

其他高频路径包括 `/api/notifications`、`/`、`/rss.xml`、`/api/me`、`/api/nav-config`、`/articles`、`/sw.js`、`/api/research-pv`、`/api/site-settings` 和 `/api/points/unlock`。这些接口混合了正常页面初始化、轮询、机器人访问和真实交互，后续优化应优先处理“每次打开页面都会发生”的调用。

缓存状态中 dynamic 857,739 次、none 418,501 次、hit 198,958 次、miss 41,454 次，整体命中占比约 12.9%。API 请求较多会天然拉低总命中率，但公开配置、站点状态和可稳定复用的数据仍有缓存空间。

## 4. 真实错误与可观测性

过滤内部请求后，仍有真实 500 / 503。聚合数据里较明显的路径包括：

- `/api/notifications`：多个 500 分组，已观察到至少 318 次。
- `/api/public-opinion/collect`：165 次 500。
- `/api/automation/alert`：126 次 500。
- `/rss.xml`：153 次 503。
- `/api/subsites/session`：存在多个 503 分组。
- `/api/research-pv`、`/api/points/me`、`/api/points/unlock`：存在分散的 500。

当前多处 catch 只返回通用错误，没有结构化记录异常类型、请求 ID、数据库操作和耗时。历史聚合数据只能确定哪些路由失败，不能还原每次失败的根因。修复真实 5xx 前，应先补齐不含敏感数据的结构化日志。

## 5. D1 负载热点

D1 Insights 显示，读取全部 `content_documents` 覆盖记录的查询最近 30 天执行 51,987 次，平均每次读取约 290 行，累计读取 15,079,466 行。`readPublishedResearchKeys` 为了判断一组内容是否发布，间接加载了全部覆盖记录；`/api/research-pv` 会触发这条路径。这里应改为只查询当前请求涉及的 key，或维护更小的发布索引。

`SELECT href, audience FROM nav_overrides` 执行约 21,402 次；通知列表、总数和未读数查询各执行约 20,400 次，一次通知请求并行发出三条 SQL；`site_settings` 的建表语句也在读取路径重复执行约 11,226 次。公开配置可以短时缓存，建表和迁移应离开日常读取路径，通知统计可合并或按使用场景延迟读取。

## 6. 待发布代码风险

当前工作区新增的 `SitePresenceProvider` 计划全站每 60 秒请求 `/api/presence`。虽然它会在页面不可见时暂停，但服务端每次心跳执行在线状态 upsert、过期数据删除和在线人数 count 三项 D1 操作。如果按当前设计发布，会在现有站点状态轮询之外再增加一套常驻心跳和数据库写负载。

该功能在发布前需要重新确定必要性与实时性。可选方案包括延长间隔、只在需要展示在线状态的页面启用、把清理任务从每次心跳移出、聚合写入，或使用更适合在线状态的 Durable Objects。未经压测和成本估算，不应直接按全站 60 秒心跳上线。

## 7. 建议修复顺序

- [ ] HEALTH-01：把站点状态刷新改为页面可见时才执行，间隔由 60 秒提高到 5 分钟，窗口重新聚焦时再刷新；多标签页共享结果。
- [ ] HEALTH-02：移除 `/api/site-status` 的无条件 `no-store`，根据故障公告的时效要求设置短时 Edge Cache，并验证故障发布后的失效时间。
- [ ] HEALTH-03：暂停按当前方案发布全站 Presence 心跳；完成数据模型、刷新频率、清理任务和并发成本设计后再启用。
- [ ] HEALTH-04：把 `readPublishedResearchKeys` 改为按请求 key 查询，避免每次读取全部 `content_documents`。
- [ ] HEALTH-05：为 notifications、public-opinion、automation、RSS、subsites 和 points 路由补结构化错误日志与请求 ID，再按错误类型修复真实 5xx。
- [ ] HEALTH-06：合并通知接口的列表、总数和未读统计查询，或仅在界面确实需要时查询统计。
- [ ] HEALTH-07：为 nav-config 和 site-settings 增加短时缓存；把 `CREATE TABLE IF NOT EXISTS` 移出常规读取路径。
- [ ] HEALTH-08：按路径与来源拆分 404，修复站内失效链接；对登录、WordPress 等明显探测路径限速或挑战，但保留正常搜索爬虫访问。
- [ ] HEALTH-09：修复后使用同一 `eyeball + 主域 + 30 天` 口径复测请求量、4xx、5xx、D1 rows read / written 和缓存命中率。

优先级建议：先完成 HEALTH-01、HEALTH-03 和 HEALTH-04，直接减少持续请求与数据库负载；随后完成 HEALTH-05，获得真实错误根因；缓存与 404 治理在有基线后逐项推进。

## 8. 验收指标

站点状态接口日请求量应相对当前基线下降至少 70%，并保证故障公告在约定时间内可见。Presence 若重新启用，需要给出每千活跃会话的 D1 读写成本上限。`content_documents` 热点查询的平均 rows read 应从约 290 行降至与请求 key 数量同阶。

真实 5xx 以 `requestSource = eyeball` 为准，修复后连续观察 7 天；每个 500 / 503 应能通过请求 ID 定位到错误类型。404 应区分站内失效链接、历史 URL、扫描器与正常不存在页面，不以“一律返回 200”降低表面错误率。

缓存优化只针对可复用响应，登录态、通知、积分与个性化结果不得跨用户缓存。所有修复都需同时验证公开站和后台站构建，避免把降低请求量变成状态延迟或权限泄漏。

## 9. 代码定位

- 站点状态轮询：`app/(site)/components/SiteStatusBanner.jsx`。
- 全站挂载：`app/(site)/layout.jsx`。
- 站点状态接口：`app/api/site-status/route.js`。
- 待发布在线状态：`app/(site)/components/SitePresenceProvider.jsx`、`app/api/presence/route.js`。
- 调研发布状态读取：`lib/researchRuntime.js`、`app/api/research-pv/route.js`。
- 通知接口：`app/api/notifications/route.js`。
- 导航与配置：`app/api/nav-config/route.js`、`app/api/site-settings/route.js`。

## 10. 外部依据

- [Cloudflare Pages Early Hints](https://developers.cloudflare.com/pages/configuration/early-hints/)
- [Cloudflare Logs：504 与 origin status 0](https://developers.cloudflare.com/logs/faq/504-origin-status-0/)
- [Cloudflare Error 1102：Worker exceeded resource limits](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1102/)

| 日期 | 操作 | 状态 |
|---|---|---|
| 2026-09-29 | 核对流量总览、主域真实请求、状态码、缓存、热点路径与 D1 Insights | 已完成只读检查；已排除 Early Hints 内部 504 对真实错误率的干扰 |
| 2026-09-29 | 定位站点状态轮询、研究发布状态全量读取和待发布 Presence 心跳 | 已定位代码路径；尚未修改线上行为 |
| 2026-09-29 | 建立站点体检入口并记录修复顺序与验收口径 | 已写入项目文档；待部署与后续逐项实施 |
| 2026-10-02 | 记录 Cloudflare 1102 资源超限事件（Ray ID `a4449a136d6b5ddd-HKG`） | 已恢复且当前无法复现；保留现场信息，等待复发时结合调用日志定位 CPU 或内存原因 |

---
title: Cloudflare D1 免费层开始硬性限额：一次规则落地如何改变小应用的数据库预算
category: topics
date: 2026-09-02
time: 09:48
tags: [Cloudflare, D1, Workers, SQLite, 免费额度, 数据库成本, 索引, 可观测性, 个人开发者]
summary: 2026 年 9 月 1 日起，Workers Free 账户用完 D1 每日行读取或行写入额度后，查询会直接失败；真正需要管理的是扫描行数、索引写放大和账户级故障域。
tldr: D1 免费层每天仍有 500 万行读取、10 万行写入和 5GB 总存储，但读写额度从预算参考变成了服务可用性的硬边界。未建索引的高频查询、ORDER BY RANDOM()、事件明细表和批量任务最容易提前耗尽额度。先用 Metrics、Insights、meta 与 EXPLAIN QUERY PLAN 找到高消耗 SQL；优化后仍接近上限，再升级最低 5 美元/月的 Workers Paid。
topic_type: tech
tech_type: web_cloud
subjects: [web_cloud]
content_type: analysis
assistance: codex
model: gpt-5
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

Cloudflare 在 2026 年 9 月 1 日落地了一条很具体的规则：Workers Free 账户当天累计超过 D1 的行读取或行写入额度后，后续 D1 查询直接报错，直到次日 00:00 UTC 重置。北京时间的重置点是每天 08:00。

- 免费额度没有随公告缩减，仍是每天 **500 万行读取、10 万行写入**，以及账户合计 **5GB** 存储。
- 限制按读取或写入的行数计算，不按 SQL 条数，也不按返回给客户端的行数计算。一条只返回 1 行的 SQL，可能扫描几万行。
- 读额度或写额度任一耗尽，D1 查询就会失败。Workers Binding API、REST API、Wrangler 和控制台执行的远程查询都在计量范围内。
- 限额是账户级风险。同一个 Cloudflare 账户下的站点、后台任务、测试库和其它项目，可能共同消耗免费层预算。
- 数据不会因超限丢失，静态页面和不依赖 D1 的路径仍可工作；评论、登录、计数、后台查询等动态能力可能一起失效。
- 索引通常同时降低延迟和行读取，但会增加写入与存储。该建哪些索引，要看线上最常执行的 SQL，不能把“多建索引”当成统一答案。

这次变化让免费层从“可以观察的用量”变成“必须设计的故障边界”。个人站和小应用仍然很适合 D1，只是数据库成本不能再用请求次数粗略代替。

## 二、公告究竟改变了什么

Cloudflare 的 [2026 年 9 月 1 日更新公告](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/) 明确写了三件事：

1. Workers Free 账户达到每日行读取或行写入上限后，D1 查询失败。
2. Binding API 和 REST API 都会返回额度超限错误。
3. 账户会收到额度已经用尽的邮件，现有数据不受影响。

两个错误文本分别对应读取和写入：

```text
Your account has exceeded D1's free tier daily row read limit.
Upgrade to a paid plan or wait until tomorrow (midnight UTC) to continue.

Your account has exceeded D1's free tier daily row write limit.
Upgrade to a paid plan or wait until tomorrow (midnight UTC) to continue.
```

“会收到邮件”不等于有提前预警。公告只确认达到上限时发信，没有承诺在 50%、80% 或 90% 时通知。需要提前发现风险的项目，仍要自己观察 Metrics 或通过 GraphQL Analytics API 建监控。

### 当前免费与付费口径

| 计量项 | Workers Free | Workers Paid |
|---|---:|---:|
| 行读取 | 500 万/天 | 每月前 250 亿行包含在套餐内，超出后每百万行 0.001 美元 |
| 行写入 | 10 万/天 | 每月前 5000 万行包含在套餐内，超出后每百万行 1 美元 |
| 存储 | 账户合计 5GB | 前 5GB 包含，超出后 0.75 美元/GB-month |
| 免费额度重置 | 每天 00:00 UTC | 月度包含量按订阅续费日重置 |
| 数据传输 | D1 不收 egress 费 | D1 不收 egress 费 |

Workers Paid 的最低月费目前是 5 美元。付费方案取消了免费层的每日读写硬停机边界，但仍有月度包含量和超额计费。Workers 自身的请求与 CPU 用量也要单独计算，D1 额度不能替代 Workers 预算。

## 三、D1 计量的核心：数据库摸过多少行

D1 按查询实际读取、写入的行数计量。三个常被混淆的数字分别是：

| 指标 | 含义 | 是否直接用于 D1 读写计量 |
|---|---|---|
| 查询次数 | 执行了多少条 SQL | 否 |
| 返回行数 | 应用最终收到多少行 | 否 |
| 扫描/写入行数 | 查询执行时读取或修改了多少行 | 是 |

假设 `events` 表有 5 万行：

```sql
SELECT * FROM events WHERE campaign = 'summer' LIMIT 1;
```

如果 `campaign` 没有合适的索引，数据库可能为了找出 1 条结果而扫描大量记录。最坏情况下，每次请求读 5 万行，100 次请求就用完 500 万行的日读取额度。

另一个直观例子：一条查询平均扫描 1000 行，每天执行 5000 次，也会达到 500 万行。对公开 API 来说，5000 次并不算高流量。

每次 D1 查询返回的 `meta` 对象包含 `rows_read` 和 `rows_written`，它比“接口一天被调用多少次”更能说明成本。Cloudflare 控制台的 D1 Metrics 和 GraphQL Analytics API 也能按数据库、时间段观察这些指标；官方文档称分析指标保留最近 31 天。

### 行很宽，并不会多算几行

D1 的行计量不看一行有多少列，也不按单行字节数加倍。一条 1KB 记录与一条 100KB 记录，在行读取指标中都算一行。大字段仍会影响存储、响应体、延迟和 Worker 内存，只是不会直接把一行变成多行读取。

### 索引省读取，也会制造写放大

索引让 SQLite 查询器跳到目标范围，避免从头扫描整张表。代价是：写入被索引的列时，数据表与索引都需要更新；索引本身也占用存储。

| 工作负载 | 索引的典型效果 | 需要留意的代价 |
|---|---|---|
| 高频等值查询 `WHERE user_id = ?` | 大幅减少行读取 | 每次相关写入要维护索引 |
| 多条件查询 `WHERE a = ? AND b = ?` | 合适的联合索引可避免先读出大量 `a` 再过滤 `b` | 列顺序必须匹配查询的左前缀 |
| 时间范围查询 | 时间列索引可缩小扫描范围 | 明细持续写入时会增加写成本 |
| 低频后台统计 | 可能节省单次读取 | 若执行很少，新增索引未必值得 |
| 高频事件流水 | 读取更快 | 多个重叠索引可能让写额度先耗尽 |

Cloudflare 建议用 `EXPLAIN QUERY PLAN` 核对查询计划。输出中的 `SCAN` 通常意味着全表或大范围扫描，`SEARCH ... USING INDEX` 表示查询器使用了索引。建完索引后还可以运行 `PRAGMA optimize`，让查询器收集表和索引统计信息。

## 四、最容易触发硬限额的查询模式

### 1. 无索引过滤

`WHERE email = ?`、`WHERE status = ? AND created_at >= ?` 看起来很普通。过滤列没有匹配索引时，每次访问都可能扫描整表。表越大，同样的访问量消耗越快。

### 2. `ORDER BY RANDOM() LIMIT 1`

随机取一条记录通常需要读取并排序整个候选集合。Cloudflare 的索引指南把它列为索引也无法直接解决的高消耗模式。候选表一旦变大，公开接口的每次调用都会重复这份成本。

### 3. 前置通配符搜索

`LIKE '%关键词%'` 通常无法使用普通 B-tree 索引。需要任意位置的文本搜索时，可以评估 FTS5 与 trigram tokenizer，但全文索引也会增加存储和写入成本。

### 4. 没有索引的 JOIN 与相关子查询

连接列缺少索引时，被连接表可能被反复扫描。相关子查询还可能对外层的每一条候选记录重新执行内部查询，行读取会乘起来。

### 5. 事件明细表的多索引写入

PV、审计、调用日志、限流记录和埋点常常是一请求一写。事件表又容易同时为时间、用户、内容、来源和状态建立索引。一条业务事件实际产生的行写入，可能明显高于“一条 INSERT”的直觉。

### 6. 批量任务与维护 SQL

导入、回填、清理、迁移和后台统计会在短时间触碰大量行。控制台和 Wrangler 对远程库执行的查询同样计量。把大任务拆成小批次可以控制单次风险，但拆批不会自动降低总行数；真正的节省仍来自减少扫描、减少无效更新和选择合适的执行时间。

## 五、为什么 Cloudflare 要在此时把它变成硬限制

以下属于基于公开产品设计的外部研判，Cloudflare 没有在公告中披露内部成本数据或商业目标。

### 免费层需要一个可执行的资源边界

D1 采用 scale-to-zero，闲置数据库不按 CPU 小时收费。活跃查询仍会消耗存储 IO、查询执行、复制、网络和观测资源。只显示额度、不在超额时停止，会让“免费额度”缺少实际约束，也会把异常程序、爬虫流量和正常付费工作负载放进同一资源池。

硬限制把 Cloudflare 的成本上限变得可预测。对开发者来说，代价是免费项目首次需要明确处理数据库不可用状态。

### 按扫描行数计费，把性能问题变成成本问题

按请求计费无法区分两条复杂度完全不同的 SQL。一次主键查询与一次全表扫描都只算一个请求，会鼓励应用把大量工作留给数据库。D1 的行计量让查询效率同时影响速度、免费额度和账单。

这套模型也有认知成本。开发者看到接口只返回一行，容易误以为只读了一行。Cloudflare 因此持续把 `rows_read`、Insights、查询效率和索引指南补进产品工具链。

### 5 美元付费层承担了增长后的承接

Workers Paid 每月包含 250 亿行读取与 5000 万行写入。按 30 天平均折算，分别约为每天 8.33 亿行与 166.7 万行；这只是帮助理解量级，付费包含量按月结算，没有对应的每日配额。

免费与付费之间形成了很明确的分工：免费层可以支撑原型、个人站和低频应用，增长后的项目用较低固定门槛换取不中断服务，再按实际超额用量付费。

### 账户级限额会推动资源治理

当多个数据库、预览环境、定时任务和独立 Worker 位于同一免费账户时，一个异常任务可能影响其它项目。这会促使开发者清理闲置远程任务、区分本地与远程开发，并为重要业务选择付费账户或更清晰的故障隔离。

## 六、对 2aran.com 的具体影响

本站公开页面以静态/ISR 内容为主，文章 Markdown 不依赖 D1 才能渲染。超限时，主要内容仍有机会继续访问；PV、评论、点赞、通知、登录、短链和部分后台功能属于动态链路，故障面集中在这里。

以下是对当前仓库的静态检查，不代表线上已经超限。是否接近额度，只能由 Cloudflare D1 Metrics、Insights 或每条查询的 `meta` 确认。

| 位置 | 观察到的模式 | 风险判断 | 建议验证 |
|---|---|---|---|
| `/api/quotes` | 公开接口使用 `ORDER BY RANDOM() LIMIT 1`，响应为 `no-store` | 每次请求都可能读取全部启用名言；当前种子规模小，增长或被刷后风险放大 | 看该 SQL 的 `avgRowsRead`、`totalRowsRead` 和每日调用数 |
| `research_pv_hits` | 每个合格阅读写一条明细；表上有按时间、内容、访客、来源、质量等多个二级索引 | 单次 INSERT 会维护多个索引，写额度消耗可能高于事件条数 | 查看 `rows_written / 新增明细数`，核对重叠索引的实际命中率 |
| `/api/admin/content-weekly` | 一次后台加载并行执行多条 30/90 天区间聚合 | 调用频率低，但明细增长后单次读取可能很大 | 用 Insights 按 `totalRowsRead` 排序，逐条跑查询计划 |
| PV 清理任务 | 按 `created_at` 删除过期明细 | 有时间索引可帮助定位；批量 DELETE 本身仍消耗写入并维护索引 | 记录每次清理的 `rows_read`、`rows_written` 与执行时段 |
| 其它 Worker/数据库 | 仓库包含采集、A 股/加密调研、PoemCN 等 D1 工作负载 | 若部署在同一 Workers Free 账户，会共享账户级故障风险 | 在账户总览中按 databaseId 拆分用量 |

### 本站优先级最高的三个动作

1. **先量化公开热路径。** 对名言、PV、评论、登录和限流接口记录查询的 `rows_read`、`rows_written`，并在 D1 Insights 中按总读取、总写入排序。
2. **处理随机名言查询。** 当前只有约百条种子时绝对消耗不大，但 `no-store + ORDER BY RANDOM()` 的增长曲线不好。可以改为缓存结果、预生成随机序号，或按可索引的随机键/ID 采样。
3. **审计 PV 明细索引与汇总方式。** 保留真正服务常用查询的索引；长期趋势可用日汇总表承载，明细设置保留期，避免每次后台打开都扫描更长的历史窗口。

这里不建议只为省读取而继续给 `research_pv_hits` 加索引。该表已经有多个二级索引，新增索引可能把压力从读取额度转移到写入额度。需要先看查询计划与线上命中频率。

## 七、排查与优化顺序

### 第一步：找到哪个数据库在消耗额度

Cloudflare Dashboard 路径为 **D1 → 选择数据库 → Metrics → Row Metrics**。先看最近 24 小时，再看 7 天和 31 天：

- `Rows read` 与 `Rows written` 的日峰值；
- 峰值发生在哪个数据库、哪个时间段；
- 查询次数是否平稳，但行读取突然上升；
- 写入增长是否与业务事件数明显不成比例。

查询次数不参与 D1 行计费，但它能帮助拆解：

```text
每日行读取 ≈ 查询执行次数 × 每次平均 rows_read
每日行写入 ≈ 写查询次数 × 每次平均 rows_written
```

### 第二步：用 Insights 找出最贵的 SQL

D1 提供实验性的 Wrangler Insights 命令，可以按读取、写入、耗时或次数排序：

```bash
npx wrangler d1 insights <database_name> \
  --sort-type=sum \
  --sort-by=reads \
  --sort-direction=DESC \
  --timePeriod=7d
```

重点看：

- `totalRowsRead`：这条 SQL 在时间段内的总消耗；
- `avgRowsRead`：单次执行是否昂贵；
- `numberOfTimesRun`：是否因调用过于频繁变贵；
- `queryEfficiency`：返回行数除以读取行数，越接近 1 通常越有效率。

Insights 不记录绑定参数，以减少敏感信息暴露。它目前仍是实验命令，参数与输出可能变化。

### 第三步：检查查询计划

对总消耗最高的 SQL 使用：

```sql
EXPLAIN QUERY PLAN
SELECT ...;
```

检查 `WHERE`、`JOIN`、`ORDER BY` 和 `GROUP BY` 是否匹配已有索引。联合索引遵循左前缀规则，`(customer_id, created_at)` 可以服务只按 `customer_id` 查询，通常不能服务只按 `created_at` 查询。

### 第四步：按收益排序优化

1. 高频、单次扫描多的公开查询；
2. 高频写入与索引写放大的事件表；
3. 批处理、采集、清理和迁移任务；
4. 低频后台报表；
5. 偶尔执行的管理查询。

优化手段包括：补匹配索引、删除确认无用的重叠索引、缓存可复用结果、把明细汇总成日表、限制返回范围、用游标分页、减少重复查询、把大批次分段执行。任何 `DROP INDEX` 都应先确认查询计划与线上命中情况，并通过版本化迁移执行。

### 第五步：给动态功能设计降级

额度错误不是短暂网络抖动。反复重试只会制造更多失败请求，无法在重置前恢复服务。

- 读取失败：公开页面返回静态内容或缓存结果，隐藏依赖 D1 的计数和个性化信息。
- 写入失败：明确告诉用户操作暂时无法保存，不能伪装成成功。
- 后台任务：识别额度错误后停止本轮，避免无限重试；在 00:00 UTC 后再恢复，或升级方案。
- 监控：对两段明确的超限错误文本单独分类，避免和普通 `D1_ERROR` 混在一起。

### 第六步：决定优化还是付费

| 情况 | 更合适的动作 |
|---|---|
| 少数 SQL 全表扫描 | 先修查询与索引 |
| 测试任务误打远程库 | 改用本地 D1，收紧环境配置 |
| 事件明细无限增长 | 汇总、保留期、归档与索引治理 |
| 优化后仍经常接近日上限 | 升级 Workers Paid |
| 登录、支付、订单等不能等到次日恢复 | 不应依赖免费层硬限额运行正式业务 |
| 月用量可能超过付费包含量 | 建立读、写、存储和 Workers 的联合成本模型 |

## 八、几个容易误判的问题

### 达到读取上限后，还能继续写吗

公告的表述是达到每日行读取或行写入上限后，D1 查询会失败。不要把两个额度理解成互相独立的“读通道”和“写通道”。应用应按数据库暂时不可用设计降级。

### 升级后会立刻恢复吗

Cloudflare FAQ 表示，升级到 Workers Paid 后通常会在几分钟内解除免费层限制。“通常”不是严格 SLA，关键业务不应把临时升级当作唯一恢复预案。

### 读副本能降低行读取计费吗

读副本可以降低延迟、提高读取吞吐，但同样按查询产生的 `rows_read` 计量。它解决地理距离与吞吐，不会免除行读取成本。

### 加缓存一定能解决吗

缓存命中可以避免访问 D1，适合公开、可复用、允许一定陈旧度的数据。登录态、余额、权限、一次性验证码等数据不能为了省额度随意缓存。缓存策略要服从一致性和安全边界。

### 免费额度适合多大流量

没有统一 PV 答案。每天 10 万次主键查询可能只读取很少的行；每天 100 次无索引的大表扫描就可能达到上限。应使用“调用次数 × 单次平均扫描/写入行数”估算，而不是只看访问量。

## 九、仍未能验证的部分

1. Cloudflare 没有在 9 月 1 日公告中披露，此前免费账户超额后具体采用了怎样的软处理，也没有说明本次执行变化覆盖多少账户、节省多少资源。
2. D1 Release Notes 当前仍能看到一条“从 2025 年 2 月 10 日开始执行免费层每日限制”的旧记录，而 2026 年 9 月 1 日 Changelog 又宣布开始执行。两个官方页面的时间口径存在冲突。可能是延期、分阶段覆盖、重新执行或文档未同步，公开资料不足以确认。
3. 公告没有给出提前用量预警的阈值、邮件送达时效和可配置告警能力。
4. 本站线上每条 SQL 的 `rows_read`、`rows_written`、数据库拆分用量和日峰值未从公开页面获得，因此不能判断当前是否接近额度。
5. 索引维护的实际写入倍数要以 D1 返回的 `meta.rows_written` 为准。它受表结构、索引和具体 SQL 影响，不能用“一个 INSERT 固定等于几行写入”概括。

## 十、信息来源与说明

### Cloudflare 官方资料

- [D1 免费层硬性限额公告，2026-09-01](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/)
- [D1 Pricing：免费与付费额度、行计量定义](https://developers.cloudflare.com/d1/platform/pricing/)
- [D1 Metrics and analytics：指标、31 天留存与 Insights](https://developers.cloudflare.com/d1/observability/metrics-analytics/)
- [D1 Use indexes：查询计划、常见高消耗模式与索引成本](https://developers.cloudflare.com/d1/best-practices/use-indexes/)
- [D1 Debug：错误列表、重试边界与日志](https://developers.cloudflare.com/d1/observability/debug-d1/)
- [D1 FAQ：超限、升级与批处理建议](https://developers.cloudflare.com/d1/reference/faq/)
- [D1 Release Notes：旧版 2025-02-10 执行记录](https://developers.cloudflare.com/d1/platform/release-notes/)
- [D1 Read Replication：延迟、吞吐与计量边界](https://developers.cloudflare.com/d1/best-practices/read-replication/)
- [Workers Pricing：最低月费与 Workers 自身计费](https://developers.cloudflare.com/workers/platform/pricing/)

### 本站仓库检查范围

- `app/api/quotes/route.js`：随机名言公开查询与缓存策略。
- `app/api/research-pv/route.js`：阅读事件写入与 PV 汇总链路。
- `app/api/admin/content-weekly/route.js`：阅读明细的区间聚合查询。
- `migrations/0012_research_pv_hits.sql`、`0051_reading_analytics_dimensions.sql`、`0052_qualified_reading_analytics.sql`：阅读事件表及索引演进。

### 站内关联阅读

- [Cloudflare 免费与付费服务边界深度调研](/articles/research/topics/cloudflare-free-paid-service-boundaries)：从 Workers、Pages、R2、D1、KV 与安全产品看完整免费边界。
- [Cloudflare Workers + D1 vs Supabase 技术调研](/articles/research/topics/cloudflare-d1-vs-supabase)：数据库模型、配套能力与成本结构对比。
- [D1 + Edge Cache 可配置燃币系统实践](/articles/research/topics/d1-edge-cache-configurable-ranbi)：本站如何把 D1 业务数据与边缘缓存组合起来。

事实资料截至 2026 年 9 月 2 日。第五节为外部研判；第六、七节中的本站建议基于仓库静态检查，未代替线上 Metrics 与查询计划验证。

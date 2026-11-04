---
title: D1 日写入额度为何在三小时内耗尽：2aran.com 一次迁移事故复盘
category: topics
topic_type: tech
tech_type: architecture
subjects: [site_engineering]
content_type: build_log
date: 2026-09-30
time: 14:24
updated: 2026-11-04
tags: [2aran.com, Cloudflare D1, 数据库迁移, 配额治理, 故障复盘, GitHub Actions, 可观测性, 燃币]
summary: 2026-09-30，2aran.com 的 Cloudflare D1 Free 日写入额度在 UTC 日切后约三小时内耗尽。账户面板、查询洞察、任务日志与代码时间线共同指向燃币固定总量迁移；在线人数与舆情采集构成持续消耗但量级不足以单独解释。2026-11-04 复核确认迁移提交与降频修复提交仍在 GitHub；面板数字一律标为事故当日观察。
tldr: 当日账号写入约 17.73 万行，超过 Free 日顶 10 万。09:45 舆情仍成功，10:42 起出现明确 D1 配额错误；09:49 进入 main 的 `0100_fixed_ranbi_supply.sql` 会全量重算 user_points 并扫描约 8.65 万条流水。证据支持「批量迁移触发、日常写入补充」。不发明事后基线。
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

2026-09-30 上午（北京），2aran.com 使用的 Cloudflare D1 Free 写入额度被提前耗尽。最先暴露的是 X 自动发布，随后舆情采集、互动机器人与站内自动化告警失败。

**面板与洞察数字均为 2026-09-30 约 14:00（北京）观察**，不是 2026-11-04 实时值：

- 当日已写入 **177,320** 行（Free 日顶 **100,000**）；
- 当日已读取约 **285 万** 行（未触 500 万日读顶）；
- `tuaran-me` 最近 24 小时写入曲线约 **195,560** 行；
- 错误串含：`Your account has exceeded D1's free tier daily row write limit`。

公开定价口径（2026-11-04 仍成立）：Free 日写 10 万 / 日读 500 万，**00:00 UTC** 重置；超限后查询失败。[D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)

现有证据支持的判断（不升格为逐语句账单）：

1. **燃币固定总量迁移是最可能的触发点**——额度耗尽前进入生产窗口，含全量余额重算与历史流水聚合。
2. **燃币日常流水与舆情采集是主要持续写入项**——查询洞察可见写入高于在线人数。
3. **在线人数设计确实过于频繁**——放大日常消耗，但观察窗口约 2,090 行可见写入无法单独解释约 17 万超额。
4. **X 自动发布基本是受影响方**——单次写量小，却共享账号额度。
5. **告警与业务共用同一 D1 写配额**——故障后告警也写不进去。

---

## 二、事实层：额度何时耗尽

Free 额度按 UTC 自然日。北京 09-30 08:00 = UTC 00:00，新日额度开始。

| 北京时间 | 事件 | 结果 |
|---|---|---|
| 08:00 | Free 日额度重置 | 重新获得 10 万行写 |
| 09:08 | 舆情采集 | 成功 |
| 09:45 | 舆情采集，处理 99 条 | 成功 |
| 09:49 | 燃币固定总量升级进入 main | 含 `0100_fixed_ranbi_supply.sql`（提交 [`2e888b87`](https://github.com/TUARAN/tuaran-home-page/commit/2e888b87)） |
| 10:42 | 下一轮舆情采集 | HTTP 500 |
| 10:43 | 失败告警重试 | 三次均收到 D1 日写超限 |
| 11:25 起 | X 自动发布陆续失败 | 素材状态与告警无法写入 |
| 13:58 | 在线人数降频与 X 发布降级推送 | [`431641489c`](https://github.com/TUARAN/tuaran-home-page/commit/431641489c8423beaf357df10694913a8ef85bb8)；当日已计入额度无法撤回 |

09:45–10:42 是可确定的耗尽窗口。GitHub Actions 失败日志给出完整错误，排除了「仅 X API / 模型 / 定时器」等早期猜测。

**提交复核（2026-11-04）**：迁移对象 `migrations/0100_fixed_ranbi_supply.sql` 在 `2e888b87…` 可解析；修复提交 `431641489c…`（message: `fix: restore X auto posting and add hook formats`）仍存在，含 presence 降频、首页限定心跳、X 模型降级等 diff。

---

## 三、事实层：哪些操作消耗写入

### 1. 一次性燃币迁移

`0100_fixed_ranbi_supply.sql` 将燃币升级为固定 2,100 万总量，并建立储备池、黑洞账户、转账表与触发器。最重两段：

```sql
UPDATE user_points
   SET balance = COALESCE(
     (SELECT SUM(pl.delta)
        FROM point_ledger pl
       WHERE pl.user_id = user_points.user_id),
     0
   ),
   updated_at = 1790730000000;

INSERT OR IGNORE INTO user_points (user_id, balance, updated_at)
SELECT user_id, SUM(delta), 1790730000000
  FROM point_ledger
 GROUP BY user_id;
```

第一段更新 `user_points` 每一行；第二段扫描并聚合整张流水表。事故排查时，一条后台查询对 `point_ledger` 四次扫描合计约 34.62 万行读 → 表内约 **8.65 万** 条历史流水（**事故日观察**）。

面板无公开逐语句账单。三项证据仍集中：时间窗口吻合；24h 总写入约 19.56 万而行洞察能解释的常规写入明显更少；全量 `UPDATE` 行为会把存量直接变成当日写入。精确逐行归因仍需 GraphQL Analytics 或迁移执行 `rows_written` 元数据（见持续验证）。

### 2. 燃币、签到与资源解锁（事故日洞察观察）

| SQL 类别 | 可见写入行数（约） |
|---|---:|
| `point_ledger` 通用流水 | 4,650 |
| 两类 `user_points` 余额更新 | 3,190 |
| 解锁消费流水 | 1,520 |
| `resource_unlocks` 权益记录 | 1,330 |

一次用户动作可能经转账、余额、兼容流水、权益记录与索引维护放大为多行计费写。

### 3. 每小时舆情采集（事故日洞察观察）

`public-opinion-collect`：约 1,449 次执行、约 5,880 行写；`public_opinion_posts` 有二级索引。09:45 成功任务处理 99 条；来源稳定时大量已存在行仍可能被按小时改写时间戳。

### 4. 在线人数心跳（事故日洞察观察）

最初挂全站：可见即请求、60s 心跳、聚焦再请求；每次 upsert + 过期清理 + 计数。约 1,020 次旧 upsert、约 2,090 行写——确定的低价值高频写，但不是本次主量级。

修复后（`43164148…`，2026-11-04 仍可核对）：仅首页；心跳 10 分钟；同访客最短 8 分钟才允许更新；移除每次删除过期行。

### 5. 其他（事故日洞察观察）

API 限流约 935、DeepSeek 任务约 585、有效阅读约 400。多库拆分**不会**复制 Free 日额度——账单与限制按账号汇总。[D1 Billing](https://developers.cloudflare.com/d1/observability/billing/)

---

## 四、结构：为何先看到 X 发布失败

```text
GitHub Actions
  → 站内发布 API
  → D1 素材租约与状态
  → DeepSeek / 新闻源
  → X API
  → D1 结果与告警
```

配额在链路前半段耗尽，模型与 X 调用不会发生。失败告警也写同一 D1；业务写失败后告警继续失败，Actions 日志成唯一可靠证据。故障通道须与被监控资源隔离。

---

## 五、已做修复（代码可核；不发明事后基线）

- **在线人数降频**：全站 1 分钟 → 首页 10 分钟 + 服务端 8 分钟闸门（见修复提交）。
- **X 发布降级路径**：DeepSeek 回退选项与素材存储不可用时的错误识别（无法绕过账号级硬顶）。
- **保留原始失败证据**：Actions 的 HTTP 状态、正文与运行链接。

当日已计入的约 17.73 万行无法撤回。**本重写不声称 10-01 之后的新基线数字**——旧文「持续验证」里写的次日观察若未再抓取，此处不复述为事实。

---

## 六、外部研判：迁移流程要改什么

1. **迁移前先算行数**（只读 `COUNT` + 余额差异行），避免无条件全表 `UPDATE`。
2. **DDL 与数据回填分开**；大回填按主键分批、可暂停，跨 UTC 日切。
3. **用执行结果记账**：每批记录 SQL 名、业务行数、`rows_read`/`rows_written`、起止与失败位。
4. **关键任务软预算**（站点内部纪律，非 Cloudflare 产品限制）——装饰统计与可补跑采集优先让路。
5. **告警不唯一依赖同一写配额**——Actions / 外部通知作独立出口。

Free D1 可承载个人站日常事务，前提是高频统计、批量回填与核心业务分属不同成本纪律。真正危险的是一条「看起来合理」的全量 `UPDATE`。

---

## 七、信息来源与持续验证

**来源**

- Cloudflare 账户面板与 `tuaran-me` 查询洞察：**核对时间 2026-09-30 约 14:00（北京）**
- GitHub Actions `Public opinion collect`：09:45 成功 / 10:42 起失败
- 迁移：[`2e888b87` / `0100_fixed_ranbi_supply.sql`](https://github.com/TUARAN/tuaran-home-page/blob/2e888b87/migrations/0100_fixed_ranbi_supply.sql)（2026-11-04 仍可解析）
- 修复：[`431641489c8423beaf357df10694913a8ef85bb8`](https://github.com/TUARAN/tuaran-home-page/commit/431641489c8423beaf357df10694913a8ef85bb8)（2026-11-04 仍存在）
- [D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)、[Billing](https://developers.cloudflare.com/d1/observability/billing/)、[D1 changelog / 2026-09-01 日限额](https://developers.cloudflare.com/changelog/2026-09-01-d1-daily-limits-enforcement/)

**持续验证**

- 查询洞察与账号账单聚合窗口有差；约 17 万行一次性写入仍缺 GraphQL / 迁移 `rows_written` 最终拆分——若拆分结果否定「迁移为主因」，须改写结论第 1 点。
- 本重写**未**回填 2026-10-01 及之后的 24h 写入基线；若要声称「降频后日常回落」，须另日抓取面板。
- Free 强制日期叙述（2025-02-10 vs 2026-09-01）见姊妹文《D1 Free 层硬限额》持续验证；不影响本事故「超限即拒」事实。

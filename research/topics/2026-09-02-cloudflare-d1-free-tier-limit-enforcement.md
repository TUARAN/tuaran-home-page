---
title: Cloudflare D1 Free 层硬限额：公开口径、错误串与本站静态对照
category: topics
topic_type: tech
tech_type: web_cloud
subjects: [web_cloud]
content_type: research
date: 2026-09-02
time: 09:48
updated: 2026-11-04
tags: [Cloudflare, D1, Free tier, Workers, 配额, 定价, 运维]
summary: 2026-11-04 复核 Cloudflare D1 定价页与 2026-09-01 changelog：Free 日限额仍为 500 万行读 / 10 万行写，Paid 含月额度，日限额 00:00 UTC 重置；超额返回固定错误串。本站静态代码与面板数字仅作观察，不作实时指标。2025-02-10 与 2026-09-01 两则官方「开始强制」日期并存，结论侧不择一，列入持续验证。
tldr: Free 层读/写是按日硬顶，不是软提示。定价页与 2026-09-01 changelog 对额度、错误串、UTC 重置口径一致。站点侧只能确认静态路径与某一时刻面板快照。两则强制日期冲突未解，不影响「超限即拒」这一结论。
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、结论

截至 **2026-11-04（北京）**，[D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/) 与 [2026-09-01 changelog](https://developers.cloudflare.com/changelog/2026-09-01-d1-daily-limits-enforcement/) 对 Free / Paid 额度、日重置时刻、超额错误串的公开口径一致：

| 项 | Workers Free | Workers Paid |
| --- | --- | --- |
| Rows read | **5 million / day** | First **25 billion / month** included + $0.001 / million |
| Rows written | **100,000 / day** | First **50 million / month** included + $1.00 / million |
| Storage | 5 GB total | First 5 GB + $0.75 / GB-mo |
| Databases | 10 | First 100,000 + $0.10 / extra / month |

Free 日限额在 **00:00 UTC** 重置。超过日读或日写后，D1 API 对查询返回错误（不是降速软限）。Paid 超月含额度按价加收，不因「日顶」停写。

**本站相关内容**只作静态观察：仓库里出现的 D1 写入路径、迁移文件名、某日面板截取数字，都不是 2026-11-04 复核当时的实时用量。

官方文档里同时出现 **2025-02-10**（release notes：Free 日限额开始强制）与 **2026-09-01**（changelog：再次强调 Free 日限额强制及错误串）两套日期。结论不选择「哪一天才是真正第一次」，见「持续验证」。

---

## 二、事实：公开额度与错误串

### 2.1 定价页（2026-11-04 抓取；页脚 Last updated Oct 30, 2026）

- Free：5M reads/day，100k writes/day，5 GB storage，10 databases。
- Paid：25B reads / 50M writes 月含额度，其后按行计费；存储与库数另计。
- 明确定义：rows read = 扫描行数（与返回行数可不等）；rows written 含 INSERT/UPDATE/DELETE；索引更新可额外计入写。
- FAQ：Free 超日限额后「will not be able to run queries」；API 返回表明日限额已超的错误；升 Paid 通常数分钟内去掉日顶。

### 2.2 2026-09-01 changelog 错误串

Changelog 标题侧强调 Free plan daily limits enforcement，并给出客户端可见错误文案（与先前公开稿一致，复述官方错误串）：

- 读超额：`D1_ERROR: Exceeded daily limit of 5,000,000 rows read`
- 写超额：`D1_ERROR: Exceeded daily limit of 100,000 rows written`

（精确标点与大小写以 changelog 原文为准；若日后改写，以官方页为准。）

### 2.3 重置与观测方式

- Free 日用量：**00:00 UTC** 重置。
- Paid 月含额度：按订阅续订日重置。
- 官方建议用 query `meta.rows_read` / `meta.rows_written`、GraphQL Analytics、Dashboard → Metrics → Row Metrics 追踪。

### 2.4 本站静态观察（非实时指标）

下列仅描述仓库/面板在写作当时可核对的痕迹，**不作** 2026-11-04 用量声明：

- 存在 D1 相关迁移与 presence / 内容写入路径（例如 `site_presence` 心跳、内容发布写库）。
- 旧文引用的面板读/写数字，应标为**观察日快照**；本重写不复制未再核对的面板数。
- 工程侧把装饰性在线人数心跳降频、把写额度留给内容发布——属于站点设计选择，见姊妹文《D1 写限额事故复盘》。

---

## 三、结构：限额如何进运维决策

```
公开定价 / changelog
        ↓
Free 日硬顶 vs Paid 月含+超量计费
        ↓
超限 → 固定错误串 → 查询失败直至 UTC 日切或升配
        ↓
站点：区分「装饰写」与「内容写」，静态代码可审，面板数字须标观察日
```

对 Free 站：日写 10 万是硬约束；任何每分钟级心跳、全表扫描、无索引过滤都会加速触顶。对 Paid 站：日顶消失，但仍需看月含与单次 `meta` 成本。

---

## 四、外部研判（短）

把 Free D1 当「永远够用的生产库」与公开口径不符。可靠做法是：用官方错误串与 Dashboard 对账；把非核心写从热路径拿掉；需要稳定吞吐时按 Paid 定价估算，而不是赌软限。

两则「强制日期」并存，说明文档时间线有重叠叙述；**不影响**「Free 超限即拒、00:00 UTC 重置」这一可操作结论。

---

## 五、来源与持续验证

**来源（2026-11-04）**

- Pricing：<https://developers.cloudflare.com/d1/platform/pricing/>
- Changelog 2026-09-01：<https://developers.cloudflare.com/changelog/2026-09-01-d1-daily-limits-enforcement/>
- Release notes / Limits：<https://developers.cloudflare.com/d1/platform/release-notes/>、<https://developers.cloudflare.com/d1/platform/limits/>

**持续验证**

- **日期冲突**：release notes 写 Free 日限额自 **2025-02-10** 起强制；changelog 于 **2026-09-01** 再次宣告 enforcement 并固定错误串。两则官方页面仍同时可访问。未找到 Cloudflare 说明「2025-02-10 仅为预告 / 2026-09-01 才真正拒写」的单一权威澄清。结论侧继续只主张「超限返回错误 + UTC 日切」，不主张唯一强制日。
- 若 Pricing 表或错误串改写，应整表替换本节数字，并改 `updated`。
- 本站面板数字若再引用，须写明抓取日与数据库名；禁止当作永久基线。

---
title: Cloudflare 免费与付费服务边界
category: topics
topic_type: tech
tech_type: web_cloud
content_type: analysis
date: 2026-07-02
updated: 2026-11-04
tags: [Cloudflare, Workers, Pages, R2, D1, KV, Zero Trust, 定价, 免费层]
summary: 按 2026-11-04 官方定价与 Limits 页核对：站点套餐、Workers 平台按量、Zero Trust 合同是三套账；免费层是入口与硬限额，付费层买的是额度、SLA 与治理。
tldr: 个人站与轻量 API 可长期停在 Free；正式动态业务先看 Workers Paid（$5/月起）与日请求/CPU；商业 SLA、PCI、团队安全再进 Pro/Business/Contract。数字以当日 scrape 为准，采购前复读官方页。
subjects: [web_cloud]
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> 风险与合规提示：配额与标价摘自 2026-11-04 可打开的 Cloudflare 官方页；不含税、不含合同特批。不构成采购或财务建议。上线或续费前请再打开文末链接核对。

## 一、先给结论

1. **Cloudflare 至少有三套计费逻辑**：站点套餐（Free / Pro / Business / Contract）、开发者平台按量（Workers Paid 起 + R2/D1/KV 等）、Zero Trust / 企业安全合同。混成一张「月费」会算错。
2. **免费层已经能跑通**：DNS、CDN、Universal SSL、基础 DDoS/WAF、Pages 静态、Workers/Pages Functions 日限额、R2/D1/KV 免费额度、Zero Trust 约 50 用户 PoC。
3. **真正的付费边界**是硬限额与确定性：日请求、CPU、构建次数、日志留存、SLA、合规、团队治理、按量超额。
4. **Workers Free**：100,000 请求/天、10 ms CPU/调用；Workers Paid 最低约 **$5/月**，含更高初始额度，超额按请求与 CPU ms 计。
5. **选型一句话**：能静态就静态；动态 API 早升 Workers Paid；商业关键站再谈站点套餐与安全加购。

## 二、事实层（2026-11-04 scrape）

### 2.1 站点套餐

来源：[cloudflare.com/plans](https://www.cloudflare.com/plans/)

| 套餐 | 公开标价 | 主要买什么 |
|---|---|---|
| Free | $0 | DNS、CDN、SSL、基础安全入口 |
| Pro | $20/月年付，或 $25/月月付 | 性能与运营增强；无 Enterprise 级合同条款 |
| Business | $200/月年付，或 $250/月月付 | 公开页强调商业级能力（含 PCI DSS 4.0 相关表述）、更高支持档 |
| Contract | 定制 | 任务关键应用；SLA、合规、企业支持按合同 |

站点套餐**不**等于 Workers/R2/D1 无限量。

### 2.2 Workers / Pages Functions

来源：[Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)（页内 Last updated Oct 2, 2026）、[Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)（Last updated Oct 29, 2026）

| 项目 | Free | Paid（Standard） |
|---|---|---|
| 请求 | 100,000/天 | 含 1,000 万/月，超额约 $0.30/百万 |
| CPU | 10 ms/调用 | 含 3,000 万 CPU ms/月，超额约 $0.02/百万 ms；单次 HTTP 默认可配，上限文档写 5 分钟 |
| 子请求 | 50/请求 | 默认 10,000/请求 |
| Worker 数 | 100 | 500 |
| 内存 | 128 MB | 128 MB |
| Worker 包体积 | 64 MiB（未压缩） | 64 MiB（未压缩） |
| 静态资源请求 | 免费不限量（不调用 Worker 时） | 同左 |

Workers Paid 账户最低收费文档写明 **$5 USD/月**。Pages Functions **按 Workers 计费**；纯静态资源请求免费。[Pages Functions Pricing](https://developers.cloudflare.com/pages/functions/pricing/)

### 2.3 Pages 构建与文件

来源：[Pages Limits](https://developers.cloudflare.com/pages/platform/limits/)（Last updated Sep 5, 2026）

| 项目 | Free | Pro | Business |
|---|---|---|---|
| 月构建次数 | 500 | 5,000 | 20,000 |
| 并发构建 | 1 | 5 | 20 |
| 单站文件数 | 20,000 | 100,000 | 100,000 |
| 单文件 | 25 MiB | 25 MiB | 25 MiB |
| Pages 项目数 | 账户约 100（文档称不常规提高） | 同左逻辑 | 同左逻辑 |

大文件应放 R2，页面只引用 URL。

### 2.4 R2 / KV / D1

来源：[R2 Pricing](https://developers.cloudflare.com/r2/pricing/)（Oct 30, 2026）、Workers Pricing 内 KV/D1 表、[D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)、[D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)（Oct 30, 2026）

| 产品 | Free 关键额度 | Paid 要点 |
|---|---|---|
| R2 Standard | 10 GB-month；Class A 100 万/月；Class B 1,000 万/月；**egress 免费** | 存储约 $0.015/GB-month；Class A/B 按百万次 |
| KV | 存 1 GB；读 100,000/天；写/删/list 各 1,000/天 | 含更高月额度，超额按百万次 |
| D1 | 行读 500 万/天；行写 100,000/天；账户存储合计 5 GB；**库数 10**；**单库最大 500 MB（Free）** | 行读/写月含额度后按量；单库最大 **10 GB**；付费库数首 100,000 含入，超出约 $0.10/库/月 |

D1 Time Travel：Free 7 天，Paid 30 天（Limits 页）。

### 2.5 Zero Trust 公开口径

[plans](https://www.cloudflare.com/plans/) 写明：Free 面向 **50 用户以内**或企业 PoC；Pay-as-you-go 公开标价 **$7**/用户量级；Contract 面向完整 SASE。日志留存、DLP/CASB 等以 Zero Trust 产品页与合同为准，本稿不展开未打开的细表。

## 三、结构分析：什么时候该付钱

| 场景 | 通常够用的层 | 常见触发付费的信号 |
|---|---|---|
| 博客 / 文档 / 作品集 | Free + Pages + DNS | 构建次数、单站文件数、需要商业支持 |
| 轻量 API / Webhook | Workers Free 试；稳定后 Workers Paid | 日请求破 10 万、CPU >10 ms、子请求多 |
| 小对象存储 / 附件 | R2 Free | Class A/B 与存储超额（egress 仍免费） |
| 边缘小库 | D1 Free | 日写/读顶满、单库 >500 MB、库数 >10 |
| 商业官网 / 电商落地 | Pro 起，关键业务看 Business | SLA、PCI 表述、安全规则深度、支持 |
| 内网替代 VPN | Zero Trust Free PoC | 用户 >50、长日志、合规、企业策略 |

成本应按**业务事件链路**估算：一次页面请求是否打 Function、是否读 D1/KV、是否写 R2、是否进日志——而不是只看「某个产品有没有免费额度」。

旧文常见的「Free 包 3 MB gzip / Paid 10 MB gzip」与现行 Limits（**64 MiB 未压缩**）已不一致；以 Limits 页为准。

## 四、外部研判

Cloudflare 免费层的意义是把全球网络入口交给个人与小团队；商业逻辑是：从「能跑」进入「必须可预期地跑」时，为额度、SLA、日志与治理付费。个人站可以长期 Free；把 Workers 当正式 API 层却仍按 Free 硬限额做架构，会把产品决策锁死在日配额上——这类项目更合理的默认是 Workers Paid，再按用量解释账单。

## 五、信息来源与持续验证

资料 scrape 日期：**2026-11-04（Asia/Shanghai）**。

- [Plans](https://www.cloudflare.com/plans/)
- [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Pages Limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Pages Functions Pricing](https://developers.cloudflare.com/pages/functions/pricing/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)

### 持续验证

- Workers Logs 文档写明自 **2026-12-01** 起将改用 Observability 计价；若已切换，第五节日志口径需重抓。
- Business/Enterprise 的 SLA 与 PCI 细则以合同与产品合规页为准，本稿只用 plans 公开句。
- Durable Objects / Containers / Vectorize 等未逐项展开；若采购清单含这些，应另开当日定价表。

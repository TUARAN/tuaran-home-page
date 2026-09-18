---
title: "阿燃调研：每天一个加密资产 —— Zcash（ZEC）观察"
category: topics
topic_type: market
crypto_type: asset
coin_id: "zcash"
symbol: "ZEC"
market_cap_rank: 10
date: "2026-09-10"
time: "01:32"
tags: [加密资产, "Zcash", "ZEC"]
subjects: [business_market]
summary: "Zcash 是 2016 年上线的隐私公链，以 zk-SNARK 屏蔽交易为核心，2026 年经历 Orchard 漏洞修复、SEC 结案与灰度现货 ETF 上市等关键节点。"
tldr: "Zcash 是隐私公链与 ZEC 代币的统称，2026 年 6 月修复 Orchard 严重漏洞、8 月灰度 ZCSH 现货 ETF 上市，隐私币监管与治理分歧仍是主要变量。"
content_type: analysis
assistance: codex
model: deepseek-v4-flash
research_template: crypto-asset-research
research_template_version: 1
sources_as_of: "2026-09-10"
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

Zcash 是一个 2016 年 10 月上线的隐私公链，代币为 ZEC，总量上限 2100 万枚。其核心差异在于用 zk-SNARK（零知识证明）实现"屏蔽交易"（shielded transaction），交易内容在链上加密，同时通过公开账本维持共识。协议、网络与代币三者关系：Zcash 协议是技术规范，Zcash 网络是运行该协议的节点集合，ZEC 是网络内用于转账与区块奖励的记账单位。

截至资料截点（2026-09-10），ZEC 在 CoinGecko 市值排名第 10，价格 1280.16 美元，流通市值约 216.45 亿美元。2026 年是 Zcash 的高波动年份：1 月 ECC 核心团队因治理分歧集体离职，6 月 Orchard 屏蔽池被披露存在可无限增发的严重漏洞并紧急修复，8 月灰度 Zcash 现货 ETF（ZCSH）在 NYSE Arca 上市。外部观察认为，ZEC 的上涨由隐私叙事、ETF 通道与监管缓和共同驱动，但隐私币在欧盟等地面临 2027 年起的交易限制，治理结构也仍处调整期。

## 二、起源、背景与发展时间线

Zcash 起源于学术项目 Zerocash/Zerocoin，由 Zooko Wilcox 于 2016 年 1 月公开宣布，2016 年 10 月 28 日由特拉华州公司 Zerocoin Electric Coin Company（后更名 Electric Coin Company，ECC）正式上线。

| 时间 | 事件 | 来源 |
|---|---|---|
| 2016-01 | Zooko Wilcox 宣布 Zcash 项目（前身 Zerocash/Zerocoin） | electriccoin.co/blog/helloworld |
| 2016-10-28 | Zcash 主网上线，由 Zerocoin Electric Coin Company 运营 | z.cash 监管简报、corporatefinanceinstitute |
| 2018-10 | Sapling 升级，替换原 zk-SNARK 电路，提升屏蔽交易性能 | coindesk.com/research |
| 2022-05 | NU5 升级，引入 Orchard 屏蔽协议与 Halo 2 证明系统（无需可信设置） | z.cash/learn |
| 2024-11 | 减半，区块奖励由 3.125 ZEC 降至 1.5625 ZEC | coinmarketcap 社区文章 |
| 2025-11-24 | NU6.1 在区块 3,146,400 激活 | z.cash/upgrade/nu6-1 |
| 2026-01-07 | ECC 核心团队因与 Bootstrap 董事会治理分歧集体离职 | coindesk、bitcoin.com |
| 2026-01 | SEC 结束对 Zcash Foundation 的调查，未建议执法行动 | yahoo finance、gate |
| 2026-06-02/03 | Orchard 漏洞披露，紧急软分叉 + NU6.2 硬分叉修复 | zfnd.org、github |
| 2026-08-25 | 灰度 Zcash 现货 ETF（ZCSH）在 NYSE Arca 上市 | theblockbeats、kucoin |
| 2026-08-24 | NU7 持币人投票（是否取消减半） | kucoin、weex |

## 三、技术机制与网络结构

Zcash 是比特币代码库的分叉，采用工作量证明（PoW）共识，出块约 75 秒，算法为 Equihash。其核心创新是隐私层。

**屏蔽交易与透明交易**：Zcash 支持两类地址——透明地址（t-address）交易公开可见，屏蔽地址（z-address）交易内容加密。屏蔽交易通过 zk-SNARK 证明交易有效而不泄露发送方、接收方与金额。

**证明系统演进**：早期使用需要"可信设置"（trusted setup）的 zk-SNARK；2022 年 NU5 引入基于 Halo 2 的 Orchard 屏蔽池，Halo 2 是递归证明系统，消除了对可信设置的依赖，被视为网络更去中心化的关键一步。

**多池结构**：历史上存在 Sprout、Sapling、Orchard 三代屏蔽池。Orchard 是当前主要迁移目标池，使用 Halo 2 证明。

**节点实现**：除 ECC 维护的 C++ 参考实现 zcashd 外，Zcash Foundation 开发了独立的 Rust 节点实现 Zebra，增强网络韧性。

**2026 年 Orchard 漏洞事件**：2026 年 5 月 29 日，安全研究员 Taylor Hornby 私下向 Zcash 团队报告 Orchard 零知识证明电路存在严重正确性漏洞，理论上可伪造 nullifier 实现无限增发/双花。6 月 2 日部署紧急软分叉暂时禁用 Orchard 交易，6 月 3 日 NU6.2 硬分叉在区块 3,364,600 用修正电路重新启用 Orchard。该漏洞此前约四年未被发现，披露后 ZEC 一度下跌超 40%。

## 四、用途、生态与价值来源

**用途**：Zcash 定位为隐私支付与"数字黄金"式储值资产。屏蔽交易用于保护支付隐私，透明交易保持与交易所、合规机构的兼容。

**钱包生态**：ECC 的 Zashi 移动钱包默认强制屏蔽交易；第三方钱包（Trust Wallet、Exodus 等）逐步集成部分屏蔽支持；Ledger、Trezor 等硬件钱包主要支持透明地址。Zcash Foundation 的 Zebra 节点与 ECC 的 zcashd 构成双实现。

**屏蔽采用数据**：屏蔽交易占周交易比例从 2025 年初约 30% 升至 2026 年 2 月历史新高 59.3%，2026 年至今均值约 40.2%（CoinDesk Research 报告）。屏蔽池中的流通 ZEC 占比从 2024 年初约 8% 升至 2026 年 5 月约 30%，为历史最高。

**价值来源（外部判断）**：Zcash 的价值主张建立在隐私稀缺性、固定供给与监管叙事之上。2026 年灰度 ETF 上市为传统资金提供合规敞口。需注意 ZEC 本身不产生现金流，其价值依赖市场对隐私资产与储值叙事的定价。

## 五、代币经济与供给结构

| 项目 | 数据 | 来源 |
|---|---|---|
| 总量上限 | 2100 万 ZEC | CoinGecko 快照 |
| 流通量 | 16,921,867.35 ZEC | CoinGecko 快照 |
| 总量（含未流通） | 16,923,342.35 ZEC | CoinGecko 快照 |
| 当前区块奖励 | 1.5625 ZEC | kucoin、edgen |
| 减半周期 | 约四年 | coinmarketcap |
| 下次减半 | 预计 2028 年（区块 4,406,400），降至 0.78125 ZEC | kucoin、edgen |

**创始人奖励与开发基金**：上线前四年，每区块奖励的 20% 作为"创始人奖励"分配给创始人、员工、顾问与早期投资者，累计约 210 万 ZEC（占上限 10%）。该机制结束后以"开发基金"名义延续类似比例的区块奖励分成，用于资助 ECC、Zcash Foundation 与社区拨款。

**NU7 发行投票**：2026 年 8 月 24 日，Zcash 持币人就 NU7 升级的五个问题投票，其中包括是否取消/平滑减半机制。ZEC 财库公司 Cypherpunk 主张保留四年减半机制，理由是此前投票中 83.5% 持币人反对平滑方案。投票结果被视为方向信号而非立即切换点，下次减半仍按约两年后（2028 年）安排。

## 六、市场位置与历史表现

CoinGecko 快照（2026-09-09 更新）：ZEC 市值排名第 10，价格 1280.16 美元，流通市值约 216.45 亿美元，FDV 约 216.47 亿美元，24 小时成交额约 16.25 亿美元，24 小时涨跌 +8.50%。

| 指标 | 数据 |
|---|---|
| 历史高点 | 3191.93 美元（2016-10-28），距高点 -59.89% |
| 历史低点 | 16.08 美元（2024-07-04） |
| 流通量/总量/上限 | 16,921,867 / 16,923,342 / 21,000,000 ZEC |

**2026 年价格波动节点**：1 月 ECC 团队离职引发约 14% 下跌；6 月 Orchard 漏洞披露后一度下跌超 40%（清算超 1 亿美元）；8 月灰度 ETF 上市前后显著上涨。外部观察（如 F2Pool 联创王纯）认为 ZEC 近期涨势属叙事驱动，基本面与 Solana、Hyperliquid 等存在差距——此为外部观点，非本报告结论。

## 七、治理、安全与关键依赖

**治理结构**：Zcash 治理由少数受资助机构主导。ECC 负责大部分协议工程、钱包与研究；Zcash Foundation 维护 Zebra 节点并管理社区咨询投票；Bootstrap 是非营利组织，负责治理并管理 ECC。ECC 与 Zcash Foundation 之间的商标协议形成"两方共识"模式，任何创建新共识协议的网络升级需双方同意。

**2026 年治理危机**：2026 年 1 月 7 日，ECC 整个核心团队因与 Bootstrap 董事会治理方向分歧集体离职，CEO Josh Swihart 指责 Bootstrap 单方面改变雇佣条件，团队计划成立新公司。Zcash Foundation 于 1 月 9 日声明重申维护 Zcash 作为去中心化开源协议的承诺。

**安全事件**：2026 年 6 月 Orchard 电路漏洞是 Zcash 历史上最严重的安全事件之一，理论允许无限增发。修复通过紧急软分叉与 NU6.2 硬分叉完成。此前 2019 年曾出现类似"无限伪造"漏洞（针对旧版本）。

**关键依赖**：Zcash 依赖零知识证明电路的正确性、多实现节点（zcashd 与 Zebra）的同步，以及少数核心机构（ECC、Zcash Foundation、Bootstrap）的持续投入。治理机构变动与人才流失是结构性依赖风险。

## 八、监管与合规环境

**美国**：2026 年 1 月，SEC 结束对 Zcash Foundation 的调查，未建议执法行动，消除了悬而未决的证券相关问题。SEC 尚未就隐私币作为资产类别发布正式指引。2026 年 5 月 Grayscale 提交 S-3 表格申请将 Zcash 信托转换为现货 ETF，8 月 25 日 ZCSH 在 NYSE Arca 上市，管理费率 2.5%，收入重新投入 Zcash 生态。Coinbase Custody 为托管方。

**欧盟**：欧盟条例 (EU) 2024/1624 第 79 条自 2027 年 7 月 10 日起禁止交易所保留可实现匿名加密交易的账户，实际效果是隐私币（含 ZEC）从受监管平台退市。Cypherpunk 的 SEC 10-K 文件亦提及欧盟自 2025 年 7 月起的相关限制。

**其他地区**：韩国、日本、印度等地曾对隐私币实施退市或限制。2026 年 2 月，印度交易所按新 AML/CFT 规则退市 Zcash、Dash、PIVX 等隐私代币。

## 九、催化因素、主要风险与外部研判

**催化因素（外部观察）**：
- 灰度 ZCSH 现货 ETF 上市（2026-08-25）为传统资金提供合规敞口，两周内 AUM 一度达 5 亿美元。
- SEC 结束对 Zcash Foundation 调查，缓解证券合规不确定性。
- 屏蔽交易采用率上升（2026 年 2 月达 59.3%），强化隐私叙事。

**主要风险**：
- 欧盟 2027 年 7 月起对匿名加密交易的限制，可能引发新一轮退市潮。
- 治理结构脆弱：ECC 团队 2026 年 1 月集体离职后，开发能力与人才延续存在不确定性。
- 零知识证明电路正确性风险：Orchard 漏洞表明此类系统存在难以发现的深层缺陷。
- ZEC 不产生现金流，价值依赖叙事与市场情绪定价。

**外部研判**：市场对 ZEC 上涨存在分歧。一方认为隐私资产在监管缓和与 ETF 通道下迎来结构性重估；另一方（如 F2Pool 联创）认为涨势属叙事炒作，基本面支撑有限。本报告不给出买卖或价格预测。

## 十、信息来源与未能验证

**CoinGecko markets 接口**：本报告市场数据采用用户提供的 CoinGecko 快照（coin_id: zcash，symbol: ZEC，数据更新 2026-09-09T17:29:20Z）。CoinGecko 官方 markets 接口（api.coingecko.com/api/v3/coins/zcash）未在本轮检索中直接调用，快照数据未独立复核。

**实际检索来源**：
- z.cash（官方）、z.cash/upgrade/nu6-1、z.cash/learn、z.cash/network
- zcash.readthedocs.io（协议文档）
- electriccoin.co/blog/helloworld（ECC 官方博客）
- zfnd.org（Zcash Foundation）
- github.com/zcash/zcash、github.com/ZcashFoundation/zebra
- SEC EDGAR（Cypherpunk Technologies 10-K）
- coindesk.com/research、theblock.co、blockworks.com
- 第三方：kucoin、bitget、weex、htx、edgen、chaincatcher、foresightnews、theblockbeats、bitcoin.com、messari、blocksec、zksecurity、quillaudits

**未能验证**：
- NU7 投票的最终结果（截至截点 2026-09-10，投票于 8 月 24 日举行，但公开报道多停留在投票前立场声明，最终计票结果未能从一手来源确认）。
- 灰度 ZCSH ETF 的实时 AUM 与费率细节（管理费 2.5% 来自第三方报道，未在 SEC 文件或 Grayscale 官网直接核实）。
- 屏蔽交易占比（59.3%、40.2%）与屏蔽池供给占比（约 30%）数据来自 CoinDesk Research 及第三方转述，未直接核验链上原始统计。
- 2019 年"无限伪造"漏洞的具体细节未从一手安全公告核实。
- 部分第三方报道（如 F2Pool 联创评论）为外部观点，其数据口径未独立验证。
- 历史高点、低点及市值排名等以用户提供的 CoinGecko 快照为准，未交叉验证其他数据源。
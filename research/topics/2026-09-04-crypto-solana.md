---
title: "阿燃调研：每天一个加密资产 —— Solana（SOL）观察"
category: topics
topic_type: market
crypto_type: asset
coin_id: "solana"
symbol: "SOL"
market_cap_rank: 7
date: "2026-09-04"
time: "01:33"
tags: [加密资产, "Solana", "SOL"]
subjects: [business_market]
summary: "Solana 是以高性能著称的 Layer-1 区块链，SOL 为其原生代币，2026 年 8 月通过 SGP-0002 将年度通缩率翻倍至 30%，并获 SEC/CFTC 归类为数字商品。"
tldr: "Solana 定位高吞吐 Layer-1，靠 PoH+PoS 实现亚秒级最终性；2026 年 8 月治理通过加速通缩、SEC/CFTC 将其列为数字商品，但网络曾多次宕机、代币集中度与 FTX 关联构成主要风险。"
content_type: analysis
assistance: codex
model: deepseek-v4-flash
research_template: crypto-asset-research
research_template_version: 1
sources_as_of: "2026-09-04"
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

Solana 是一个以高吞吐、低费用为设计目标的 Layer-1 区块链网络，SOL 是其原生代币，兼具网络手续费、质押与治理权重三种用途。截至资料截点，SOL 市值排名第 7，价格 104.79 美元，距 2025 年 1 月历史高点 293.31 美元回撤约 64%。

三个关键事实决定当前观察框架：其一，2026 年 8 月 28 日，Solana 首个正式链上治理提案 SGP-0002 以 67.001% 支持率惊险通过，将年度通缩率从 15% 翻倍至 30%，把 1.5% 的通胀下限达成时间从约 2032 年提前到约 2029 年；其二，2026 年 8 月，美国 SEC 与 CFTC 将 SOL 等 16 项资产联合归类为"数字商品"，监管定位从证券争议转向商品框架；其三，网络历史上多次宕机（最近一次完整停机在 2024 年 2 月约 5 小时），2026 年 8 月 12 日一次 BGP 误路由曾使约 29% 质押 SOL 短暂离线、险些失去最终性。

外部研判层面，Solana 的链上活跃度（稳定币交易量、SOL 计价 TVL）与其价格表现存在明显背离，2026 年 Q1 价格大跌约 33% 至 57%（不同口径），同期 SOL 计价 TVL 创历史新高。这种"活动与价格脱钩"被多家机构解读为高 beta 资产在宏观风险偏好收缩时的典型特征。本报告只陈述事实与外部观察，不构成任何买卖或价格建议。

## 二、起源、背景与发展时间线

Solana 协议由 Anatoly Yakovenko 于 2017 年 11 月在一份白皮书中首次提出，核心创新是"历史证明"（Proof of History, PoH）——一种在不互信计算机之间记录时间流逝的技术。2018 年 2 月，Greg Fitzgerald 开始编写首个开源实现。Solana Labs 是早期核心开发公司，Solana Foundation 是总部位于瑞士楚格（Zug）的非营利基金会，负责生态去中心化、采用与安全事务。

| 时间 | 事件 | 来源 |
|---|---|---|
| 2017-11 | Yakovenko 发布描述 PoH 的白皮书 | solana.com 白皮书、GitHub 历史文档 |
| 2018-02 | 首个开源实现开始原型开发 | solana-labs/solana GitHub history.md |
| 2020-03-16 | 主网 genesis 区块上线 | CoinMarketCap、Cointelegraph |
| 2021-09-14 | 遭遇 DoS 攻击，网络离线约 17 小时 | SEC 招股文件披露 |
| 2022-11 | FTX/Alameda 崩溃，SOL 价格大幅下挫 | Coindesk、Coinspeaker |
| 2024-02-06 | 完整网络停机约 5 小时 | HTX、SEC 文件 |
| 2025-01-19 | 价格触及历史高点 293.31 美元 | CoinGecko 快照 |
| 2025-03-13 | SIMD-0228 动态通胀提案未通过（43.6% 赞成） | Bitget、HTX |
| 2025-10 | 美国首批现货 SOL ETF 获批上市（Bitwise BSOL 等） | GetBlock、KuCoin |
| 2026-03 | 链上治理（svmgov）正式激活 | docs.governance.solana.com |
| 2026-08-12 | BGP 误路由致约 29% 质押 SOL 短暂离线 | HTX |
| 2026-08-21 | SEC 与 CFTC 将 SOL 等 16 项资产归类为数字商品 | Edgen、PrimeXBT |
| 2026-08-28 | SGP-0002 双倍通缩提案以 67.001% 通过 | ForkLog、Edgen |

## 三、技术机制与网络结构

Solana 采用 PoH 与 Tower BFT（一种 PoS 变体）结合的共识机制。PoH 通过可验证的延迟函数为交易排序提供时间戳，使网络无需等待多轮通信即可确认顺序；Tower BFT 则用于投票与最终性。网络目标吞吐量高，官方早期宣传称理论峰值约 6.5 万 TPS，并随硬件改进每两年翻倍（此为项目方主张，见第十节验证情况）。

| 维度 | 说明 | 来源 |
|---|---|---|
| 共识 | PoH + Tower BFT（PoS 变体） | solana.com 白皮书、SEC 文件 |
| 区块时间 | 约 400ms 出块，epoch 约 2 天 | SEC 招股文件 |
| 客户端 | Agave、Jito、Firedancer 等多客户端 | Coinbase 验证者报告、Everstake |
| 手续费 | 基础费 5000 lamports/签名（50% 销毁）+ 优先费（100% 归验证者，SIMD-0096） | solana.com 费用文档 |
| 计划升级 | Alpenglow 共识改革，拟以 Votor/Rotor 取代 PoH+Tower BFT，最终性降至 100-150ms | SEC 文件、KuCoin、Coindesk |

Alpenglow 是 Solana 历史上最大的共识架构改革，2026 年 5 月在社区测试集群上线测试，原计划 8 月部署，后推迟至 2026 年 10 月，无固定激活日期。该升级若落地，将替换网络两个最基础的共识机制。

## 四、用途、生态与价值来源

SOL 代币在协议内承担三类功能：支付网络交易手续费（部分销毁）、质押以保障网络并获取通胀奖励、以及作为链上治理的投票权重基础。Solana 生态以 DeFi、稳定币支付、NFT、meme 币和 AI agent 应用为主。

| 生态指标 | 数值/状态 | 来源 |
|---|---|---|
| DeFi TVL | 约 101.5 亿美元（2026-08） | KuCoin 引 DeFi Development Corp |
| 稳定币供应 | 约 150 亿美元（2026-02） | Solana 官方生态报告 |
| 稳定币交易量 | 2026-02 处理 6500 亿美元，创纪录 | Solana 官方生态报告 |
| SOL 计价 TVL | 2026-02 突破 8000 万 SOL，创历史新高 | Solana 官方生态报告 |
| Solana Mobile | 出货超 20 万台，链上交易额超 30 亿美元 | Solana 官方生态报告 |
| 美国现货 ETF | 累计净流入约 12.2 亿美元（2026-08） | Farside、KuCoin |

价值来源上，Solana 的收入主要来自交易费与优先费。2026 年 Q1 网络收入同比大跌约 68%，主因投机需求收缩。生态中头部协议集中度较高——2026 年 Q1 前五大协议占 Solana 总 DeFi TVL 约 82%。

## 五、代币经济与供给结构

SOL 初始铸造 5 亿枚，无固定总量上限，通过通胀机制持续增发，同时以手续费销毁作为对冲。CoinGecko 快照显示流通量约 5.85 亿枚、总量约 6.33 亿枚、上限为 0（即无硬顶）。

| 供给参数 | 数值 | 来源 |
|---|---|---|
| 初始铸造 | 5 亿 SOL | SEC 招股文件 |
| 主网上线时流通 | 约 800 万 SOL | VanEck JitoSOL S1 |
| 通胀机制 | 初始 8%，逐年递减，1.5% 下限 | SEC 文件、Solana 文档 |
| 通缩率（2026-08 前） | 年度 15% | SGP-0002 相关报道 |
| 通缩率（2026-08 后） | 年度 30%（SGP-0002 通过） | ForkLog、Edgen |
| 通胀下限达成 | 从约 2032 提前至约 2029 | Edgen、KuCoin |

2026 年 8 月的 SGP-0002 是 Solana 首个正式链上治理提案，由 Helius 的 Lostin 与 0xIchigo 撰写的 SIMD-0550 支撑。投票以 67.001% 赞成（仅超出 66.67% 门槛 0.334 个百分点）通过，六年内削减约 1890 万枚 SOL 预期发行量。此前的 SIMD-0228（Multicoin 提出，目标质押率 50% 的动态通胀）于 2025 年 3 月以 43.6% 赞成未通过。

初始分配比例在不同来源存在差异（见第十节）：CoinMarketCap 口径为种子轮 16.23%、创始轮 12.92%、团队 12.79%、基金会 10.46%；SEC 文件（BSOL 10-K）称基金会获 5200 万枚（约 10.4%）；Goodwin Law 引述 Solana Labs 称 12.5% 分配给 Solana Labs。这些数字需以官方口径进一步核实。

## 六、市场位置与历史表现

| 指标 | 数值 | 来源 |
|---|---|---|
| 市值排名 | #7 | CoinGecko 快照 |
| 价格 | 104.79 USD | CoinGecko 快照 |
| 流通市值 | 61,339,825,762 USD | CoinGecko 快照 |
| FDV | 66,379,492,611 USD | CoinGecko 快照 |
| 24h 成交额 | 3,923,537,687 USD | CoinGecko 快照 |
| 24h 涨跌 | +6.45501% | CoinGecko 快照 |
| 历史高点 | 293.31 USD（2025-01-19） | CoinGecko 快照 |
| 历史低点 | 0.500801 USD（2020-05-11） | CoinGecko 快照 |

价格历史呈现明显周期：2021 年牛市大幅上涨，2022 年因 FTX 崩溃全年跌超 96% 并一度跌出市值前 20；2023-2025 年随生态复苏与 ETF 获批回升至 2025 年 1 月高点；2026 年 Q1 进入回调，价格大跌约 33%（Superex 口径）至 57%（BlockEden 口径，不同时间窗），同期 SOL 计价 TVL 却创历史新高。2026 年 8 月现货 ETF 连续净流入推动价格反弹，24h 涨 6.46%。

## 七、治理、安全与关键依赖

**治理**：Solana 长期以验证者投票为主导，2026 年 3 月正式激活链上治理框架（svmgov）。任何质押 ≥10 万 SOL 的验证者可发起提案，需附 GitHub 链接说明细节；提案需获得活跃质押 15% 的验证者支持方可进入投票。委托人可用自身质押权重推翻验证者的投票。SGP-0002 是首个通过该框架的正式提案。

**安全与宕机史**：Solana 历史上多次遭遇网络级故障。2021 年 9 月 DoS 攻击致离线约 17 小时；2024 年 2 月 6 日完整停机约 5 小时；2026 年 8 月 12 日一次 BGP 误路由使约 29% 质押 SOL 短暂离线，网络一度接近失去最终性（距完全宕机仅差约 14%）。SEC 招股文件明确将"周期性网络宕机与拥堵"列为风险因素。

**关键依赖与集中度**：SEC 文件披露，截至 2025 年底，最大的 100 个 Solana 钱包持有约 23% 的流通 SOL。质押池集中度方面，SEC 文件称截至 2025 年 5 月，最大的三个质押池合计控制约 11% 质押量。验证者客户端呈多客户端趋势，Coinbase 运行 Harmonic、Jito、JitoBAM、Firedancer 四种客户端。

## 八、监管与合规环境

| 时间 | 监管事件 | 来源 |
|---|---|---|
| 2023-06 | SEC 在 Binance/Coinbase 诉讼中将 SOL 列为证券主张对象 | SEC 文件、Haynes Boone |
| 2025 | 特朗普政府下 SEC 撤销多起加密诉讼 | Haynes Boone、Binance |
| 2025-10 | 美国首批现货 SOL ETF 获批上市 | GetBlock、KuCoin |
| 2026-08-21 | SEC 与 CFTC 联合将 SOL 等 16 项资产归类为"数字商品" | Edgen、PrimeXBT |

2026 年 8 月 21 日，SEC 与 CFTC 联合将包括 SOL 在内的 16 项数字资产归类为"数字商品"，监管框架从证券法转向《商品交易法》（CEA）。此前 SEC 曾在 2023 年诉讼中主张 SOL 为证券。尽管分类转向商品，部分法律观察人士（如 Haynes Boone 的 Arie Heijkoop）提醒，交易所相关代币的最终法律地位仍未完全尘埃落定。SEC 招股文件仍保留"若 SOL 被认定为证券可能影响价值"的风险提示。

## 九、催化因素、主要风险与外部研判

**潜在催化因素**（外部观察，非保证）：
- Alpenglow 共识升级若于 2026 年 10 月落地，将最终性降至 100-150ms，可能支撑更复杂的延迟敏感应用。
- 美国现货 SOL ETF 持续净流入（累计约 12.2 亿美元），Bitwise BSOL 成为首个 AUM 破 10 亿美元的 Solana ETF。
- SGP-0002 加速通缩，减少未来六年约 1890 万枚 SOL 发行。
- SEC/CFTC 商品分类可能降低部分合规不确定性。

**主要风险**（SEC 招股文件与外部报道）：
- 网络宕机与拥堵历史，可能削弱可靠性并阻碍采用。
- 代币集中度：前 100 大钱包持有约 23% 流通量，大额持有者抛售可能压制价格。
- FTX 破产清算相关的早期投资者与团队解锁，持续构成周期性卖压（Superex 报道）。
- 高 beta 特性：宏观冲击下 SOL 跌幅常大于大盘，2026 年 Q1 价格与链上活动背离。
- 质押收益率下降：SGP-0002 加速通缩后名义质押收益率预计下降（SIMD-0550 作者模型：首年约 4.34%，随后降至 3%、2.25%）。
- 竞争：来自其他高吞吐平台与 Layer-2 方案的竞争。

**外部研判**：多家机构（MEXC、Superex、BlockEden）将 2026 年 Q1 的 SOL 大跌归因于宏观风险偏好收缩、比特币 ETF 净流出（约 27 亿美元）以及 FTX 解锁卖压，而非链上基本面恶化。Solana 官方生态报告强调稳定币交易量、SOL 计价 TVL 等链上指标创纪录，形成"活动强、价格弱"的背离格局。本报告不据此给出方向性判断。

## 十、信息来源与未能验证

**CoinGecko markets 接口**：本报告市场数据全部采用用户提供的 CoinGecko 快照（coin_id: solana，数据更新时间 2026-09-03T17:28:20Z），未另行调用 CoinGecko markets API 核实。

**实际检索来源**（本次调研通过 web_search 与 open_page 获取）：
- solana.com 官方文档（白皮书、费用结构、Token Extensions、质押 FAQ）
- docs.governance.solana.com（svmgov 治理框架）
- solana.org（基金会与资助计划）
- SEC EDG
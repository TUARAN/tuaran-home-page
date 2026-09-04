---
title: "阿燃调研：每天一个加密资产 —— USDC（USDC）观察"
category: topics
topic_type: market
crypto_type: asset
coin_id: "usd-coin"
symbol: "USDC"
market_cap_rank: 6
date: "2026-09-01"
time: "01:34"
tags: [加密资产, "USDC", "USDC"]
subjects: [business_market]
summary: "USDC 是 Circle 发行的美元稳定币，以 1:1 现金与短期美债储备支撑，2026 年随 Circle 纽交所上市、OCC 国家信托银行牌照及 GENIUS 法案落地而进入联邦监管框架。"
tldr: "USDC 由 Circle 发行，储备以现金和短期美债为主，2026 年 Circle 完成 IPO 并获 OCC 国家信托银行牌照，GENIUS 法案为其提供联邦监管框架。"
content_type: analysis
assistance: codex
model: deepseek-v4-flash
research_template: crypto-asset-research
research_template_version: 1
sources_as_of: "2026-09-01"
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

USDC 是 Circle 发行的美元稳定币，按 CoinGecko 快照市值排名第 6，流通市值约 740.5 亿美元，价格稳定在 0.99998 美元。其核心特征是储备资产以现金和短期美国国债为主，并承诺 1:1 美元赎回。2026 年是 USDC 的监管里程碑之年：Circle 于 6 月在纽交所上市（代码 CRCL），7 月先后获得 OCC 国家信托银行最终批准和纽约州有限目的信托章程，同时美国 GENIUS 法案为其提供了首个联邦稳定币监管框架。USDC 的定位是"受监管的数字美元"，与储备透明度较低、离岸属性更强的 USDT 形成差异化竞争。

## 二、起源、背景与发展时间线

| 时间 | 事件 |
|------|------|
| 2018-05 | CENTRE 联盟由 Circle 与 Coinbase 联合创立，USDC 同步宣布 |
| 2018-09-26 | USDC 正式上线，Circle 为首个发行方 |
| 2018-10 | Coinbase 上线 USDC，成为联合创始成员 |
| 2021 | Circle 提交 SEC 文件（S-1 相关披露） |
| 2023-03 | 因硅谷银行（SVB）事件，USDC 一度脱锚，创下历史低点 0.877647 美元 |
| 2023-08 | CENTRE 联盟解散，USDC 由 Circle 全权运营 |
| 2024 | Circle 成为首个符合欧盟 MiCA 框架的全球稳定币发行方；与 BlackRock 合作 BUIDL 集成 |
| 2025-06-05 | Circle 在纽交所 IPO，发行价 31 美元，首日涨 168% |
| 2025-07-18 | 美国 GENIUS 法案签署成为法律 |
| 2026-07-10 | Circle 获 OCC 最终批准设立国家信托银行（Circle National Trust） |
| 2026-07-31 | Circle 获纽约州金融服务部有限目的信托章程 |

来源：Coinbase 官方博客（2018-10-22）、Circle 官方新闻稿（2026-07-10）、The Block（2025-06 IPO）、Mercuryo（GENIUS 法案时间线）。

## 三、技术机制与网络结构

**协议与网络区分**：USDC 是运行在多条区块链上的 ERC-20 标准代币（以及其他链的原生标准），并非独立网络。Circle 同时运营 Circle Payments Network 和 Arc（企业级区块链）。

**跨链机制（CCTP）**：Circle 的跨链传输协议（Cross-Chain Transfer Protocol）采用"销毁-铸造"（burn-and-mint）机制，在源链销毁原生 USDC，在目标链铸造等量原生 USDC，避免包装代币（wrapped token）带来的对手方风险。截至 2026 年 5 月，CCTP 已支持 23 条区块链直接转账。

**储备管理**：USDC 储备大部分存放在 Circle Reserve Fund（USDXX），这是一个 SEC 注册的 2a-7 政府货币市场基金，可持有现金、短期美国国债和隔夜美国国债回购协议。其余储备以现金形式存放在少数全球大型银行。Circle 每周披露储备持有量及铸造/赎回流量，每月由四大会计师事务所出具第三方鉴证报告。

来源：Circle 透明度页面、Circle 官方文档、Jupiter 文档、KuCoin CCTP 指南。

## 四、用途、生态与价值来源

**主要用途**：
- 链上美元计价交易媒介与结算工具
- DeFi 生态的抵押品与流动性基础
- 跨境支付与汇款
- 机构资金入场的合规通道

**生态连接**：USDC 原生部署于以太坊、Solana、Arbitrum、Avalanche、Stellar 等多条链。Circle 与 Coinbase 关系密切（2026 年 6 月曾向 Coinbase 控制的钱包转移约 44 亿美元 USDC）。与 BlackRock 的 BUIDL 集成带来协议费用收入。

**价值来源**：USDC 的价值来自其 1:1 美元锚定承诺、储备透明度和监管合规属性。Circle 的收入主要来自储备资产（短期美债等）产生的利息，因此利率下行周期会压缩其收益结构。

来源：Circle 透明度页面、Yahoo Finance、The Block、SBI VC 分析。

## 五、代币经济与供给结构

| 指标 | 数值（CoinGecko 快照） |
|------|------|
| 流通量 | 74,056,535,448.34 |
| 总量 | 74,056,660,632.35 |
| 上限 | 0（无硬上限） |
| 流通市值 | 74,052,219,871 USD |
| FDV | 74,050,859,108 USD |

USDC 无固定供应上限，供给由市场需求驱动：机构存入美元铸造 USDC，赎回时销毁。当市场价格高于 1 美元时，套利者存入美元铸造并在市场卖出；低于 1 美元时买入并赎回，从而维持锚定。2026 年 8 月最后一周，Circle 执行约 50 亿美元的总铸造量，流通市值突破 730 亿美元。Circle 曾设定 2026 年下半年 USDC 供应量达 1500 亿美元的目标（较年初的 1120 亿美元上调）。

来源：CoinGecko 快照、CryptoBriefing、Bitget 新闻、HTX 资讯。

## 六、市场位置与历史表现

**市场位置**：按 CoinGecko 快照，USDC 市值排名第 6，流通市值约 740.5 亿美元。作为第二大稳定币，其规模仍不足 USDT（约 1831 亿美元）的一半。USDC 在稳定币市场占约 25% 份额。

**历史表现**：
- 历史高点：1.043 美元（2018-11-14），距高点 -4.17%
- 历史低点：0.877647 美元（2023-03-11，硅谷银行事件期间）
- 24 小时涨跌：+0.00254%
- 24 小时成交额：约 95.4 亿美元

**价格稳定性**：USDC 长期锚定 1 美元，2023 年 3 月因储备中约 30 亿美元存放在硅谷银行（未投保存款）而短暂脱锚，随后恢复。2026 年 Q1 流通供应量约 770 亿美元，同比增长 28%。

来源：CoinGecko 快照、American Banker、BYDFi 指南。

## 七、治理、安全与关键依赖

**治理结构**：USDC 由 Circle 全权运营（2023 年 8 月 CENTRE 联盟解散后）。Circle 是上市公司（NYSE: CRCL），受 SEC 监管披露要求约束。最终控制人为 Circle 管理层，联合创始人 Jeremy Allaire 任董事长兼 CEO。

**安全与审计**：
- Deloitte & Touche LLP 自 2022 财年起担任 Circle 独立审计师
- Circle Mint 平台通过 Deloitte SOC 1 Type 2 审计（覆盖 2024-10 至 2025-09 期间）
- Circle Mint 和 Wallets 系统通过 SOC 2 Type 2 认证（2025-12-18 出具报告）
- 储备每月由四大会计师事务所出具第三方鉴证

**关键依赖与争议**：
- 依赖银行体系进行铸造/赎回（2023 年 10 月前 12 个月桥接超 2770 亿美元）
- 2026 年 4 月，链上调查员 ZachXBT 发布"Circle Files"报告，指控 Circle 自 2022 年以来在 15 起涉及超 4.2 亿美元涉嫌非法资金的案件中冻结/黑名单执行缓慢或不一致，包括未能在 CCTP 桥接过程中阻止攻击者转移超 2.32 亿 USDC

来源：Circle 透明度页面、blockchain.news、MEXC 新闻、ZachXBT 报告。

## 八、监管与合规环境

**美国联邦层面**：
- 2025-07-18 GENIUS 法案签署，成为美国首个联邦稳定币法律，要求 1:1 储备、审计和消费者保护；实施规则于 2026-07-18 到期，执法自 2027-01-18 生效
- 2026-07-10 Circle 获 OCC 最终批准设立国家信托银行（Circle National Trust / First National Digital Currency Bank, N.A.），置于联邦监管之下
- 2026-07-31 Circle 获纽约州金融服务部有限目的信托章程
- 2026-04-08 美国财政部根据 GENIUS 法案提出反洗钱框架

**国际层面**：
- 2024 年成为首个符合欧盟 MiCA 框架的全球稳定币发行方
- 持有英国、新加坡、百慕大牌照，满足加拿大 VRCA 要求
- 2025 年获阿布扎比全球市场（ADGM）FSRA 牌照
- 2015 年获纽约州 BitLicense（首个）

来源：Circle 官方新闻稿、Mercuryo、MENA Fintech、CoinPaprika。

## 九、催化因素、主要风险与外部研判

**催化因素**：
- Circle 纽交所上市（2026-06）带来资本市场关注与资金
- OCC 国家信托银行牌照使 USDC 储备管理有望纳入联邦监管
- GENIUS 法案落地为稳定币提供明确联邦法律框架
- 机构采用扩大（BlackRock BUIDL 集成、Coinbase 合作）
- Circle 设定 2026 下半年供应 1500 亿美元目标

**主要风险**：
- 储备集中风险：依赖银行体系，2023 年 SVB 事件曾致脱锚
- 利率下行压缩利息收入，影响 Circle 盈利能力
- 合规执行争议：ZachXBT 指控的冻结/黑名单执行不一致
- 与 USDT 的竞争：USDC 规模仍不足 USDT 一半
- 监管执行的不确定性：GENIUS 法案实施规则细节尚未完全落地

**外部研判**（区分于事实）：市场观察者认为 USDC 的差异化优势在于监管合规与储备透明度，这使其成为机构资金入场的首选通道；但利率环境和监管执行细节仍是其增长的关键变量。上述为外部观点，非确定性判断。

## 十、信息来源与未能验证

**实际检索来源**：
- CoinGecko markets 接口（用户提供快照，数据更新时间 2026-08-29T17:29:30Z）
- Circle 官方透明度页面（circle.com/transparency）
- Circle 官方新闻稿（OCC 国家信托银行批准，2026-07-10）
- Coinbase 官方博客（USDC 发布公告，2018-10-22）
- Circle 官方文档（developers.circle.com）
- SEC EDGAR（crcl-2026 季度文件）
- The Block、CryptoBriefing、Bitget、HTX、KuCoin、MEXC、CoinPaprika、American Banker、Mercuryo 等媒体报道

**未能验证**：
- CoinGecko 快照中"总量"与"流通量"的微小差异（约 11.5 万枚）的具体原因未能核实
- Circle 2026 年下半年 1500 亿美元供应目标的官方确认文件未能直接访问
- ZachXBT"Circle Files"报告的原始全文未能直接访问，仅通过二手报道核实
- Circle 上市首日 168% 涨幅的精确收盘价（83.23 美元）来自二手报道，未经交易所原始数据核实
- USDC 储备中现金与美债的具体比例数字（页面为动态数据）未能获取精确快照
- 部分来源（如 Bitget、HTX）为聚合新闻，其原始出处未能逐一核实
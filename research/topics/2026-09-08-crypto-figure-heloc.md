---

title: "阿燃调研：每天一个加密资产 —— Figure Heloc（FIGR_HELOC）观察"
category: topics
topic_type: market
crypto_type: asset
coin_id: "figure-heloc"
symbol: "FIGR_HELOC"
market_cap_rank: 9
date: "2026-09-08"
time: "01:32"
tags: [加密资产, "Figure Heloc", "FIGR_HELOC"]
subjects: [business_market]
summary: "Figure Heloc（FIGR_HELOC）是 Figure Technologies 在 Provenance 区块链上发行的代币化房屋净值信贷额度（HELOC）资产，其市值随底层贷款未偿还本金余额动态变化，2026 年升至全球加密资产市值第 9 位，同时因链上使用与流动性不足引发分类争议。"
tldr: "FIGR_HELOC 每个代币对应 Figure 发放的 HELOC 贷款未偿还本金，供给随贷款发放与还款动态增减，无编码上限，主要交易于 Figure Markets，因被指缺乏链上使用与流动性而引发是否应计入加密资产排名的争议。"
content_type: analysis
assistance: codex
model: deepseek-v4-flash
research_template: crypto-asset-research
research_template_version: 1
sources_as_of: "2026-09-08"
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0

---

## 一、先给结论

Figure Heloc（FIGR_HELOC）是金融科技公司 Figure Technology Solutions 在自有的 Provenance 区块链上发行的代币化房屋净值信贷额度（HELOC）资产。它并非一条独立公链或通用网络代币，而是一类"代表型"（represented）现实世界资产（RWA）：每个代币对应 Figure 发放的某笔 HELOC 贷款的未偿还本金余额（UPB），供给随新贷款发放而增加、随借款人还款而减少，无编码上限。

按用户提供的 CoinGecko 快照（2026-09-05 更新），FIGR_HELOC 市值约 235.16 亿美元，居全球加密资产市值第 9 位，价格约 1.055 美元，24 小时成交额仅约 34.35 万美元。市值规模与成交额之间形成巨大落差，这正是围绕该资产的核心争议所在：批评者认为其链上使用与流动性不足，不应与 ADA、DOGE 等被广泛交易的加密资产并列排名；数据商 RWA.xyz 将其归入"represented"（代表型）类别，与 Broadridge DLR 等以记账为主要用途的资产并列。Figure CEO Mike Cagney 则主张这些资产是公链上的真实资产，应被归类为基于区块链的 RWA。

需要区分三层：底层公司 Figure（NASDAQ: FIGR，2025 年 9 月上市）、底层网络 Provenance 区块链、以及代币 FIGR_HELOC。三者归属同一创始人 Mike Cagney 控制体系，但性质不同。FIGR_HELOC 的市值主要反映 Figure 链上 HELOC 贷款簿的未偿还本金规模，而非二级市场对该代币的独立定价。

## 二、起源、背景与发展时间线

Figure Heloc 的起源与 Figure 公司及其创始人密切相关。

| 时间 | 事件 |
|------|------|
| 2018 | Mike Cagney 与 June Ou 创立 Figure，同年推出首个数字 HELOC 产品 |
| 2020-03 | Figure 完成首次链上资产证券化 |
| 2023 | 推出批发型 HELOC 模式，通过抵押贷款经纪人分销 |
| 2024-03 | Figure 提交 IPO 申请 |
| 2024-04 | 推出 DART（数字资产注册技术），基于 Provenance 的留置权与电子票据注册系统 |
| 2024-06 | 推出 Figure Connect 链上贷款交易市场 |
| 2025-02 | 推出 YLDS 计息稳定币 |
| 2025-06 | 启动 Democratized Prime，代币化 HELOC 首次作为 DeFi 抵押品 |
| 2025-09-10 | Figure IPO 定价 $25/股 |
| 2025-09-11 | Figure 在纳斯达克上市（NASDAQ: FIGR），开盘 $36，收 $31.11，募资约 7.875 亿美元 |
| 2025-10-31 | FIGR_HELOC 历史低点 0.155357 美元（CoinGecko 快照） |
| 2026-02 | FIGR_HELOC 市值突破 150 亿美元，升至加密资产第 10 位，引发分类争议 |
| 2026-08-03 | FIGR_HELOC 历史高点 1.061 美元（CoinGecko 快照） |
| 2026-09 | 市值约 235 亿美元，居第 9 位（CoinGecko 快照） |

**公司归属穿透**：Figure Technology Solutions（FTS）为纳斯达克上市公司（FIGR），最终控制人为联合创始人 Mike Cagney。根据公司 SEC 文件，公司采用双重股权结构，B 类股每股 10 票，Cagney 及其许可受让人持有全部 B 类股，合计控制约 90% 投票权，公司因此被纳斯达克认定为"受控公司"（controlled company）。Cagney 曾联合创立 SoFi，后因包含性骚扰指控的文化争议离职。Figure 的核心领导层还包括其妻子 June Ou（联合创始人、顾问、董事）。

## 三、技术机制与网络结构

FIGR_HELOC 运行在 Provenance 区块链上，该链由 Figure 开发，基于 Cosmos SDK 构建，采用权益证明（PoS）共识，定位为面向受监管金融服务的应用专用链。

**技术组件分层：**

| 组件 | 功能 |
|------|------|
| Provenance 区块链 | 底层公链，作为系统记录账本，承载代币化资产 |
| DART（数字资产注册技术） | 基于 Provenance 的留置权与电子票据（eNote）注册系统，替代传统 MERS 系统 |
| Figure Connect | 链上私募信贷一级/二级市场，标准化并代币化 HELOC 与私募信贷资产 |
| Figure Markets | 资本交易平台，FIGR_HELOC 的主要交易场所 |
| Democratized Prime | 去中心化借贷协议，允许代币化 HELOC 资产池作为抵押品 |

**代币化流程**：Figure 或其合作伙伴通过贷款发起系统（LOS）承销贷款 → 贷款发放后，电子票据与留置权信息在 DART 注册 → 在 Provenance 上成为原生数字资产（RWA）→ 在 Figure Connect 挂牌 → 机构投资者链上竞价 → 双边即时结算（T+0）。

**FIGR_HELOC 代币性质**：每个代币对应底层 HELOC 贷款的未偿还本金余额（UPB）。供给动态变化——新贷款发放则供给增加，借款人还款则供给减少。无编码最大供给上限，理论上受限于 Figure 能发放的 HELOC 债务总量。

**关键区分**：FIGR_HELOC 是"代表型"资产，区块链主要作为链下头寸的数字记录，而非可自由转移、广泛交易的独立网络代币。这与"分布式"（distributed）资产（可在公开链上移动、可被投资者买卖）有本质区别。

## 四、用途、生态与价值来源

FIGR_HELOC 的价值来源与 Figure 的 HELOC 贷款业务直接挂钩。

**底层产品**：Figure HELOC 是以借款人房屋净值担保的开放式信贷额度。贷款金额 1.5 万至 75 万美元（部分州最低额更高），初始提款按固定利率，后续提款按浮动利率（WSJ 优级利率加固定利差）。截至 2025 年 9 月，APR 范围约 6.50%–15.25%，发起费最高为初始提款的 4.99%。

**生态角色**：
- Figure 及其合作伙伴累计发放超过 160 亿美元 HELOC 贷款，服务超 20 万户家庭，成为美国最大非银行 HELOC 提供商之一
- Figure Connect 作为一级市场，2024 年 6 月推出后首年促成约 13 亿美元 HELOC 交易量，接入 27 个市场参与者
- 合作伙伴网络超 170 家机构（截至 2025 年中），覆盖美国前 20 大零售抵押贷款公司中的一半
- Democratized Prime 允许代币化 HELOC 资产池作为 DeFi 抵押品，2025 年 6 月启动 1500 万美元额度，年化收益率接近 9%

**价值来源**：FIGR_HELOC 的市值主要反映链上 HELOC 贷款簿的未偿还本金规模，而非二级市场对代币的独立定价。其"价值"本质上是 Figure 贷款资产池的账面映射。

## 五、代币经济与供给结构

| 项目 | 数据（CoinGecko 快照） |
|------|------|
| 流通量 | 22,290,650,137.398 FIGR_HELOC |
| 总量 | 22,295,914,166.468 FIGR_HELOC |
| 上限 | 0（无编码上限） |
| 价格 | 1.055 USD |
| 流通市值 | 23,516,084,575 USD |
| FDV | 23,516,084,575 USD |

**供给机制**：流通量与总量动态变化，均按 Figure 发行的全部代币化 HELOC 的未偿还本金余额（UPB）计算。新贷款发放则供给增加，借款人还款则供给减少。无编码最大供给上限，理论上无限（∞），仅受 Figure 可发放的 HELOC 债务总量限制。

**价格锚定**：代币价格接近 1 美元，反映每代币对应 1 美元未偿还本金。历史高点 1.061 美元（2026-08-03），历史低点 0.155357 美元（2025-10-31），价格在 1 美元附近小幅波动。

**主要交易场所**：Figure Markets，最活跃交易对为 FIGR_HELOC/USD。

## 六、市场位置与历史表现

按 CoinGecko 快照，FIGR_HELOC 市值约 235.16 亿美元，居全球加密资产市值第 9 位。

| 指标 | 数据 |
|------|------|
| 市值排名 | #9 |
| 价格 | 1.055 USD |
| 流通市值 | 23,516,084,575 USD |
| 24 小时成交额 | 343,538 USD |
| 24 小时涨跌 | +4.97879% |
| 历史高点 | 1.061 USD（2026-08-03） |
| 历史低点 | 0.155357 USD（2025-10-31） |

**市场位置演变**：FIGR_HELOC 于 2026 年 2 月市值突破 150 亿美元，升至加密资产第 10 位；此后持续增长，至 2026 年 8-9 月市值约 220-235 亿美元，稳居第 9 位。据 KuCoin 报道，2026 年 8 月 RWA 市场突破 710 亿美元，其中 Figure Heloc 贡献了约 32% 的 RWA 增长，是当时最大的 RWA 持仓（约 228 亿美元）。

**关键观察**：该代币市值约为 Figure 公司自身股票市值（约 86.6 亿美元）的 2.5 倍。市值规模与 24 小时成交额（约 34 万美元）之间的巨大落差，是理解其市场位置的核心——其市值主要来自贷款簿的未偿还本金映射，而非活跃的二级市场交易。

## 七、治理、安全与关键依赖

**公司治理**：Figure Technology Solutions 为纳斯达克上市公司（FIGR），采用双重股权结构。Mike Cagney 通过 B 类股（每股 10 票）控制约 90% 投票权，公司被纳斯达克认定为"受控公司"。公众股东在战略决策、董事会构成或高管薪酬方面话语权有限。

**关键人物依赖**：公司命运高度绑定创始人 Mike Cagney 的愿景与执行力。Cagney 在 SoFi 的争议性离职（含性骚扰指控）构成声誉风险。核心领导层还包括其妻子 June Ou。

**安全与依赖**：
- 底层依赖 Provenance 区块链的安全性与稳定性
- 依赖 DART 作为留置权与所有权记录系统
- 依赖 Figure Connect 与 Figure Markets 作为交易基础设施
- 依赖美国房地产市场和利率周期（HELOC 业务高度敏感）

**潜在风险点**：区块链在资本市场的应用仍处早期，存在安全漏洞、数字资产监管不确定性、加密市场波动等固有风险。贷款资产质量（逾期率）是重要观察指标——Figure 公布其证券化资产加权平均逾期率 0.80%，但该指标与纽约联储的 HELOC 逾期统计口径不同，难以直接比较。

## 八、监管与合规环境

**公司层面**：Figure Technology Solutions 为纳斯达克上市公司，受 SEC 监管，需提交定期报告（10-K、10-Q 等）。Figure Lending LLC 持有 NMLS ID 1717824，在 45 个州及哥伦比亚特区提供 HELOC 产品，但未获纽约州金融服务部授权，无法为纽约州房产办理贷款申请。

**代币层面**：FIGR_HELOC 的监管定性仍在演变。Figure 主张其代币化资产应被视为基于区块链的 RWA。SEC 文件显示，涉及区块链代币代表的贷款资产的交易，与传统或纸质代表的现实世界资产交易方式相同——存在债务工具和担保工具的转让。Figure 的 YLDS 稳定币则是全球首个获 SEC 批准、作为证券注册的计息稳定币。

**争议焦点**：Morpheus Research 于 2026 年 4 月发布报告，引用 Figure 的监管披露文件，主张其贷款发放系统并不依赖区块链，贷款发放与所有权转移仍采用传统文件程序。Figure 反驳称该主张源于对贷款完整生命周期的误解——法律文件制作沿用既有程序，但资金拨付后的贷款所有权与转移记录在链上进行。SEC 424(b)(4) 文件确认 DART 运作于 Provenance Blockchain 之上，2025 年前 9 个月经 Figure LOS 处理的贷款中 85% 被载入 DART。

## 九、催化因素、主要风险与外部研判

**催化因素（外部观察）**：
- 利率下行预期降低 HELOC 借贷成本，刺激房屋净值提取需求
- Figure Connect 平台从 HELOC 扩展至更广泛私募信贷资产类别的潜力
- RWA 代币化叙事升温，机构资本流入
- Figure 作为"RWA 第一股"的公开市场验证效应

**主要风险（外部观察）**：
- **分类争议风险**：批评者认为 FIGR_HELOC 缺乏链上使用与流动性，不应与其他加密资产并列。DefiLlama 负责人 0xngmi 曾质疑"120 亿美元资产如何被交易，当链上可交易的资产如此之少"，并质疑多数持有者是否以自有密钥转移资产，还是仅将内部数据库镜像到链上
- **公司治理风险**：Cagney 约 90% 投票权高度集中，公众股东制衡有限
- **宏观经济风险**：HELOC 业务高度依赖美国房地产与利率周期
- **区块链应用范围争议**：Morpheus Research 质疑 Figure 夸大区块链应用范围
- **流动性风险**：24 小时成交额仅约 34 万美元，与 235 亿美元市值严重不匹配

**外部研判**：RWA.xyz 联合创始人 Adam Lawrence 认为 Figure 是"合法的、机构导向的公司，最终将驱动加密领域的大部分交易量"，但将其归入"represented"类别。SevenX Ventures 分析认为 Figure 是少数通过区块链技术真实赋能商业场景的加密相关上市公司，但也指出其业务高度依赖 HELOC 市场、监管不确定性和创始人治理风险。市场对该资产的定价逻辑与传统加密资产不同——其市值主要反映贷款簿映射，而非二级市场活跃度。

## 十、信息来源与未能验证

**CoinGecko markets 接口**：用户提供的市场快照来自 CoinGecko 的 markets 数据接口（coin_id: figure-heloc，symbol: FIGR_HELOC）。CoinGecko 页面地址为 https://www.coingecko.com/en/coins/figure-heloc（直接访问被网络策略拦截，未能打开页面原文，数据以用户提供的快照为准）。

**实际检索来源**：
- DL News：Figure Heloc becomes 10th biggest crypto — but critics say it shouldn't be there（https://www.dlnews.com/articles/defi/figure-heloc-becomes-tenth-biggest-crypto/）
- IQ.wiki：Figure Heloc 
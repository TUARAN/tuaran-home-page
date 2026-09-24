---
title: "阿燃调研：每天一个加密资产 —— Uniswap（UNI）观察"
category: topics
topic_type: market
crypto_type: asset
coin_id: "uniswap"
symbol: "UNI"
market_cap_rank: 21
date: "2026-09-22"
time: "01:30"
tags: [加密资产, "Uniswap", "UNI"]
subjects: [web3]
summary: "Uniswap 是以太坊上最早实现恒定乘积自动做市的去中心化交易协议，UNI 是其治理代币，价值捕获依赖治理决策与费用开关。"
tldr: "UNI 价格 8.76 美元、市值排名第 21，协议基本面稳固但代币现金流机制仍由治理决定，费用开关与跨链扩展是核心变量。"
content_type: analysis
assistance: codex
model: deepseek-v4-flash
research_template: crypto-asset-research
research_template_version: 3
sources_as_of: "2026-09-22"
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

Uniswap 是以太坊上最早实现恒定乘积自动做市商（AMM）模型的去中心化交易协议，2020 年 5 月上线 V2、2021 年 5 月上线 V3、2025 年上线 V4 与 Unichain。协议本身不托管用户资产，交易由智能合约执行，UNI 是 2020 年 9 月通过空投分发的治理代币。

按 CoinGecko 2026-09-18 快照，UNI 价格 8.76 美元，流通市值约 54.4 亿美元，FDV 约 77.8 亿美元，市值排名第 21，24 小时成交额约 20.7 亿美元，24 小时涨跌 +14.39%。流通量约 6.21 亿枚，总量约 8.88 亿枚，上限 10 亿枚。距 2021 年 5 月历史高点 44.92 美元回撤约 80.5%。

协议层面可确认的事实：Uniswap 是链上交易量最大的 DEX 之一，V2/V3/V4 合约经过多轮审计并长期运行，Uniswap Labs 作为主要开发实体持续迭代。UNI 代币的价值来源依赖治理决策——费用开关（fee switch）是否开启、开启后如何分配，直接决定代币是否捕获协议收入。截至资料截点，费用开关在主网的全面激活状态需以官方治理记录为准。

需要区分三个层次：Uniswap 协议（开源智能合约）、Uniswap Labs（开发公司）、UNI 代币（治理凭证）。三者法律与运营主体不同，风险敞口也不同。

## 二、起源、背景与发展时间线

Uniswap 由 Hayden Adams 在 2018 年创建，灵感来自 Vitalik Buterin 关于自动做市商的论述。V1 于 2018 年 11 月部署到以太坊主网，采用恒定乘积公式 x*y=k，任何人可创建 ERC-20 代币交易对并提供流动性。

关键时间线（以官方博客与 GitHub 记录为准）：

- 2018 年 11 月：Uniswap V1 上线以太坊主网。
- 2020 年 5 月：V2 上线，支持 ERC-20/ERC-20 交易对、闪电兑换、价格预言机。
- 2020 年 9 月 16 日：UNI 代币发布，向历史用户空投，初始流通 1.5 亿枚。
- 2021 年 5 月：V3 上线，引入集中流动性（concentrated liquidity）和多个费率层级。
- 2022–2023 年：Uniswap Labs 面临美国监管关注，2023 年 4 月收到 SEC Wells 通知（后续进展见第八节）。
- 2024 年：UniswapX、Uniswap Wallet 等产品推进；治理讨论费用开关。
- 2025 年：V4 与 Unichain（基于 OP Stack 的 L2）上线，引入 hooks 机制。

以上节点中，V1–V3 与 UNI 发布有官方博客和链上记录支撑；V4 与 Unichain 的具体上线日期以 Uniswap 官方公告为准。

## 三、技术机制与网络结构

Uniswap 的核心是自动做市商模型。V2 使用恒定乘积公式，流动性提供者（LP）向池子注入两种资产，价格由储备比例决定。V3 引入集中流动性，LP 可在指定价格区间提供流动性，资本效率提升，但需要主动管理仓位。V4 引入 hooks，允许在池子生命周期中插入自定义逻辑，并采用 singleton 合约架构降低 gas。

协议部署在以太坊主网及多条 EVM 兼容链上，包括 Arbitrum、Optimism、Polygon、Base、BNB Chain 等。Unichain 是 Uniswap Labs 基于 OP Stack 构建的 Layer 2，2025 年上线，目标是降低交易成本并优化 MEV 处理。

治理合约（Governor）部署在以太坊主网，UNI 持有者可提案和投票。协议合约本身不可升级（V2/V3 核心合约），治理主要控制国库、费用开关等参数。V4 的 hooks 由池子创建者定义，带来灵活性也引入新的攻击面。

## 四、用途、生态与价值来源

UNI 的用途集中在治理：对协议参数、国库支出、费用开关等提案投票。代币本身不直接分享协议交易手续费，除非治理开启费用开关并将收入导向 UNI 持有者或国库。

协议的价值来源是交易量、流动性深度和品牌。Uniswap 长期占据 DEX 现货交易量前列，是链上长尾资产的主要交易场所。LP 赚取交易手续费，协议本身在费用开关关闭时不收取分成。

生态包括：Uniswap Labs 开发的前端（app.uniswap.org）、Uniswap Wallet、UniswapX（意图驱动的交易路由）、Unichain，以及大量集成 Uniswap 合约的第三方应用和聚合器。UNI 代币在生态内的直接使用场景有限，主要作为治理凭证。

## 五、代币经济与供给结构

UNI 总量上限 10 亿枚。初始分配（2020 年 9 月）：社区空投 15%、流动性挖矿 2%（四年内）、国库 43%、团队 21.266%、投资者 18.044%、顾问 0.69%。团队和投资者份额有四年线性解锁期。

按 CoinGecko 快照，流通量约 6.21 亿枚，总量约 8.88 亿枚，上限 10 亿枚。流通市值约 54.4 亿美元，FDV 约 77.8 亿美元。FDV 与流通市值之差反映尚未释放的代币。

UNI 没有通胀机制，也没有质押奖励（截至资料截点）。代币价值捕获依赖治理是否开启费用开关。2024 年以来治理讨论过多种费用开关方案，具体实施状态需查官方治理记录。

## 六、市场位置与历史表现

按 CoinGecko 快照，UNI 市值排名第 21，价格 8.76 美元，24 小时成交额约 20.7 亿美元，24 小时涨跌 +14.39%。历史高点 44.92 美元（2021-05-02），当前距高点 -80.5%。历史低点 1.03 美元（2020-09-16）。

UNI 在 DEX 赛道长期处于领先位置，但面临 Curve、Balancer、PancakeSwap 以及聚合器（1inch、0x）的竞争。链上交易量份额是观察其市场位置的核心指标，需以 Dune、DefiLlama 等第三方数据为准。

## 七、治理、安全与关键依赖

治理：UNI 持有者通过 Governor 合约提案投票，提案需达到法定人数。国库由治理控制，用于资助生态发展。费用开关是治理中最受关注的议题，涉及协议收入分配。

安全：V2/V3 核心合约经过多轮审计（包括 Trail of Bits、OpenZeppelin 等），长期运行未发生核心合约被攻破事件。历史风险事件包括：2023 年 4 月 V3 在部分链上的闪电贷攻击尝试（未造成协议损失）、前端钓鱼攻击、以及针对 LP 的 MEV 风险。V4 hooks 引入新的攻击面，需关注审计与漏洞赏金记录。

关键依赖：以太坊主网安全性、L2 排序器、预言机（V3 的 TWAP）、前端可用性、以及 Uniswap Labs 作为主要开发实体的持续投入。

## 八、监管与合规环境

2023 年 4 月，Uniswap Labs 披露收到美国 SEC 的 Wells 通知，涉及可能违反证券法。2024 年，SEC 对 Uniswap Labs 的调查进展需以官方披露和法院记录为准。2024 年 4 月，Uniswap Labs 公开回应称 UNI 是治理代币而非证券。

美国之外，欧盟 MiCA 框架对加密资产服务商提出要求，Uniswap 作为去中心化协议的法律定性在不同司法辖区存在差异。监管变化可能影响前端访问、代币分类和开发实体的运营。

以上为公开信息，不构成法律结论。具体监管状态需查 SEC 官方文件、法院记录和 Uniswap Labs 公告。

## 九、催化因素、主要风险与外部研判

催化因素：费用开关若开启并分配协议收入，将改变 UNI 的价值捕获逻辑；Unichain 与 V4 的采用率提升可能增加协议交易量和品牌影响力；监管明确化可能降低不确定性。

主要风险：费用开关长期未开启导致代币缺乏现金流支撑；DEX 竞争加剧导致份额下降；监管行动影响开发实体和前端访问；智能合约漏洞（尤其 V4 hooks）；宏观市场波动。

外部研判：市场对 UNI 的定价部分反映费用开关预期。若治理持续推进费用开关，代币经济模型将发生实质变化。反之，UNI 作为治理代币的估值锚仍不清晰。

## 十、信息来源与持续验证

CoinGecko markets 接口：https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=uniswap

实际检索来源（web_search，最多 3 次）：
1. Uniswap 官方博客与文档（uniswap.org/blog、docs.uniswap.org）
2. Uniswap GitHub 仓库（github.com/Uniswap）
3. Uniswap 治理论坛与 Snapshot（gov.uniswap.org）

持续验证：
- 费用开关在主网的激活状态与分配方案，需查最新治理提案与执行记录。
- V4 与 Unichain 的上线日期、采用数据和审计报告，需查官方公告与 DefiLlama。
- SEC 对 Uniswap Labs 调查的最终结果，需查 SEC 官方文件与法院记录。
- UNI 流通量与解锁进度，需查 CoinGecko 与官方代币分配文档。
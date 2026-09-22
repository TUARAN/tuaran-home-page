---
title: "Circle 与 Arc：数字美元发行方为什么还要建一条链"
category: companies
date: 2026-09-22
time: "16:56"
tags: [Circle, Arc, USDC, 稳定币, 跨链]
subjects: [company_research, web3]
summary: "Circle 已用 USDC 建立跨链数字美元网络，Arc 则把支付、金融应用和结算基础设施放进自建的公链；商业机会与验证者治理风险同时上升。"
tldr: "Circle 是 USDC 发行方，Arc 是其 2026 年 9 月上线的 Layer 1，交易手续费以 USDC 支付。ARC 代币虽已完成初始铸造，官方尚未承诺公开发行。判断 Arc 要看真实支付与应用使用量，也要看许可验证者模式如何演变。"
content_type: analysis
assistance: codex
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> **风险与合规提示：** 稳定币、股票及加密资产均有发行方、市场、技术和监管风险。资料用于理解 Circle、Arc 及相关资产的公开机制，不构成投资、开户、买卖或法律建议。ARC 的公开发行状态应以 Circle 的后续正式披露为准。

## 一、先给结论

Circle 已经通过 USDC 进入多条公链，又在 2026 年 9 月推出 Arc。前者解决的是数字美元的发行与流通，后者试图为支付、外汇和链上金融提供一条按金融业务需求设计的底层网络。Arc 用 USDC 支付 Gas，降低了用户为了转账而持有另一枚波动代币的需要；目前验证者须获准加入，网络治理仍比开放式验证者网络更集中。[Circle 主网公告](https://www.circle.com/pressroom/circle-launches-arc-mainnet-an-economic-operating-system-for-the-internet)

这组关系先分清四层：**Circle 是公司，USDC 是其发行的稳定币，Arc 是区块链，ARC 是规划用于网络安全、效用和治理的代币。**Circle 股票代码是 CRCL。Arc 的手续费仍以 USDC 支付；ARC 已完成 100 亿枚初始铸造，但 Circle 明确说，初始铸造不构成公开发行承诺。[Circle 主网公告](https://www.circle.com/pressroom/circle-launches-arc-mainnet-an-economic-operating-system-for-the-internet)

## 二、Circle 的现有生意：发行、储备与分发

Circle 通过旗下受监管实体发行 USDC 和 EURC。用户持有的 USDC 对应发行人的美元计价负债，储备资产支持其赎回安排；USDC 持有人没有因此取得 Circle 股权。[Circle 公司资料](https://investor.circle.com/) [Circle USDC 说明](https://www.circle.com/usdc)

2026 年第二季度，Circle 披露期末 USDC 流通量为 **733 亿美元**，季度收入及储备收益合计 **7.01 亿美元**，其中储备收益 **6.68 亿美元**、其他收入 **3400 万美元**。储备收益约占当季收入的 **95.2%**。USDC 流通量增加有助于扩大计息储备，利率下降则会压缩单位储备收益；Circle 在同期披露中称，平均流通量增长带来的增益被储备收益率下降部分抵消。[Circle 二季度业绩](https://www.circle.com/pressroom/circle-reports-second-quarter-2026-results) [Circle 2026 年二季度 10-Q](https://www.sec.gov/Archives/edgar/data/1876042/000187604226000248/crcl-20260630.htm)

发行能力还要配合分发。Circle 的 2025 年年报说明，Coinbase 通过平台帮助 USDC 触达用户，并按双方协议分享一部分储备相关收益；相关付款计入 Circle 的分发成本。这使 USDC 的增长与渠道合作紧密相连。Arc 则让 Circle 在发行、支付工具之外，进一步运营交易发生的网络。[Circle 2025 年 10-K](https://www.sec.gov/Archives/edgar/data/1876042/000187604226000062/crcl-20251231.htm)

## 三、Arc 已经上线什么，哪些仍是路线图

Arc 于 **2026 年 9 月 16 日**开放主网，是面向支付、金融市场和链上应用的 Layer 1。它兼容 EVM，开发者可以沿用 Solidity 合约和现有工具。官方列出的当前设计包括 USDC 计价 Gas、确定性快速终局性，以及由获准机构组成的验证者集合。Circle 公告列出了 BlackRock、DTCC、Mastercard、Visa 等创始验证者；这说明机构参与网络运营，不等于所有列名机构都已把核心业务迁入 Arc。[Circle 主网公告](https://www.circle.com/pressroom/circle-launches-arc-mainnet-an-economic-operating-system-for-the-internet)

隐私功能和网络分区仍有开发或后续推出部分，不能把路线图目标算作已交付能力。Circle 还提出未来从当前的权威证明模式探索转向权益证明，时间指向 2027 年；ARC 被设计为相关安全、效用和治理机制的一部分。当前用户支付手续费仍用 USDC。若有人仅凭“ARC 已铸造”销售同名币，须先核对 Circle 的发行公告和完整合约地址。[Circle 主网公告](https://www.circle.com/pressroom/circle-launches-arc-mainnet-an-economic-operating-system-for-the-internet)

## 四、多链 USDC 与“跨链映射”

同一名称出现在多条链上，资产来源可能完全不同。Circle 在 Arbitrum 上直接发行的 **USDC**，与从以太坊桥接而来的 **USDC.e** 是两个合约；后者由桥的机制承接赎回关系，Circle 不直接发行或赎回这枚桥接币。OP Mainnet 也存在相同区分。判断资产身份应同时核对链、完整合约地址、发行人和桥接路径，不能只看名称或图标。[Circle 的 Arbitrum 对照](https://www.circle.com/blog/usdc-on-arbitrum-now-available) [Circle 的 OP 对照](https://www.circle.com/blog/what-you-need-to-know-native-usdc-on-op-mainnet)

Circle 的 CCTP 为受支持的原生 USDC 提供“源链销毁、目标链铸造”的跨链路径，因此目标链收到的仍是原生 USDC。传统锁定—铸造桥则在目标链生成有桥接依赖的表示资产。Arc 上出现 USDC，也不意味着所有叫 USDC 的代币都由 Circle 发行。[Circle CCTP 说明](https://help.circle.com/support/en/getting-started-with-cctp-cross-chain-transfer-protocol?id=kb_article_view&sys_kb_id=961f11cc3bf5435006839064c3e45aa3) [Circle 桥接 USDC 条款](https://www.circle.com/legal/bridged-usdc-terms)

## 五、把 Arc 放到其他链与公司旁边看

Bitcoin 以 BTC 价值转移和工作量证明为核心；Ethereum 为通用智能合约提供权益证明网络，手续费用 ETH；Solana 也面向通用应用，手续费用 SOL。Arc 针对稳定币支付和金融结算做了更窄的产品选择，手续费用 USDC，并接受目前许可验证者模式的治理取舍。它刚上线，网络运行历史、独立应用和持续交易需求仍要积累。[Bitcoin 说明](https://bitcoin.org/en/faq) [Ethereum 共识文档](https://ethereum.org/developers/docs/consensus-mechanisms/pos/) [Solana 手续费文档](https://solana.com/docs/core/fees) [Circle 主网公告](https://www.circle.com/pressroom/circle-launches-arc-mainnet-an-economic-operating-system-for-the-internet)

公司比较也要按业务拆开。币安经营大型交易平台和用户入口，Circle 经营稳定币发行与支付基础设施；Strategy（原微策略，MSTR）主要通过持有 BTC 和融资安排提供比特币敞口，仍有企业分析软件业务。Circle 的关键变量是 USDC 流通量、储备收益率、分发成本及 Arc 的实际采用；Strategy 的资产负债表更直接承受 BTC 价格、融资和优先股义务的影响。CRCL 与 MSTR 是公司股票，USDC 和 ARC 均不代表公司股权。[币安公司介绍](https://www.binance.com/en/about/) [Strategy 2026 年二季度业绩](https://www.strategy.com/press/strategy-announces-second-quarter-2026-financial-results_07-30-2026) [Circle 二季度业绩](https://www.circle.com/pressroom/circle-reports-second-quarter-2026-results)

## 六、外部研判与持续验证

一种可能的商业解读是：Arc 让 Circle 从“在别人的链上发行数字美元”，推进到“同时提供美元、跨链工具和结算网络”。这能让支付与开发体验更统一，也让 Circle 承担链本身的安全、治理、运营和生态竞争责任。Arc 上线时公布的合作方和测试网交易量说明已有启动资源，商业效果仍需看主网上长期留存的支付、结算和第三方应用活动。[Circle 主网公告](https://www.circle.com/pressroom/circle-launches-arc-mainnet-an-economic-operating-system-for-the-internet)

资料截至 **2026 年 9 月 22 日**。会改变判断的后续事项包括：Arc 主网真实交易中有多少来自持续支付与金融业务；验证者加入规则及权益证明迁移如何落实；ARC 若公开发行，其权利、流通和与 USDC Gas 的关系如何披露。Circle 的利率敏感性和分发成本则继续按后续财报复核。[Circle 2026 年二季度 10-Q](https://www.sec.gov/Archives/edgar/data/1876042/000187604226000248/crcl-20260630.htm)

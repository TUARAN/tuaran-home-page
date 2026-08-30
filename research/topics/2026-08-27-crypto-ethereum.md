---
title: "阿燃调研：每天一个加密资产 —— Ethereum（ETH）观察"
category: topics
topic_type: market
crypto_type: asset
coin_id: "ethereum"
symbol: "ETH"
market_cap_rank: 2
date: "2026-08-27"
time: "16:06"
tags: [加密资产, "Ethereum", "ETH"]
subjects: [business_market]
summary: "Ethereum 是 2015 年上线的通用智能合约公链，ETH 为其原生代币，2022 年完成向权益证明的合并，现为市值排名第二的加密资产。"
tldr: "Ethereum 以可编程智能合约开创了公链应用生态，ETH 兼具 gas 燃料、质押与价值存储功能，2024 年现货 ETF 获批后进入传统金融视野。"
content_type: analysis
assistance: codex
model: deepseek-v4-flash
research_template: crypto-asset-research
research_template_version: 1
sources_as_of: "2026-08-27"
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

Ethereum 是 2015 年 7 月 30 日上线主网的通用智能合约公链，由 Vitalik Buterin 于 2013 年提出构想。ETH 是其原生代币，承担交易燃料（gas）、质押抵押品与价值存储三重职能。截至资料截点，ETH 在 CoinGecko 市值排名第 2，流通供应约 1.21 亿枚，无固定总量上限。

Ethereum 的核心价值在于其可编程性：它把区块链从"记账本"扩展为"全球计算机"，催生了 DeFi、NFT、稳定币与 Layer 2 等应用层生态。2022 年 9 月完成的"合并"（The Merge）将其共识机制从工作量证明（PoW）切换为权益证明（PoS），能源消耗下降约 99%。2024 年 5 月美国 SEC 批准现货以太坊 ETF，标志其进入传统金融配置范畴。

需要区分三层概念：**协议**（Ethereum 网络规则与代码）、**网络**（运行该协议的节点与链）、**代币**（ETH，网络内计价与结算单位）。本报告按此框架展开。

## 二、起源、背景与发展时间线

Ethereum 的起源可追溯至 2013 年。当时参与比特币生态的程序员 Vitalik Buterin 提出构建一个可编程的通用区块链平台，2013 年 11 月向少数潜在合作者发送了白皮书草案，2014 年正式发布白皮书。2014 年项目通过预售（crowdfunding）募集开发资金，2015 年 7 月 30 日主网 Frontier 版本上线。

| 时间 | 事件 |
|------|------|
| 2013 年 11 月 | Vitalik Buterin 发出白皮书草案（"Introducing Ethereum"） |
| 2014 年 | 白皮书正式发布，预售募资，以太坊基金会成立 |
| 2015 年 7 月 30 日 | 主网 Frontier 上线，创世区块生成 |
| 2016 年 3 月 | Homestead 版本发布 |
| 2016 年 6 月 | The DAO 遭重入攻击，约 360 万 ETH 被转走 |
| 2016 年 7 月 20 日 | 区块 1,920,000 硬分叉逆转 DAO 事件，拒绝分叉者形成 Ethereum Classic |
| 2017–2019 年 | Metropolis（Byzantium、Constantinople）、Istanbul 等升级 |
| 2020 年 12 月 | 信标链（Beacon Chain）上线，启动 PoS 质押 |
| 2021 年 8 月 | 伦敦升级实施 EIP-1559，引入基础费销毁机制 |
| 2022 年 9 月 15 日 | 合并（The Merge）完成，共识机制切换至 PoS |
| 2023 年 4 月 | Shapella（上海+Capella）升级，开放质押提款 |
| 2024 年 3 月 | Dencun 升级，实施 EIP-4844（Proto-danksharding） |
| 2024 年 5 月 | SEC 批准 8 只现货以太坊 ETF 的 19b-4 表格 |
| 2025 年 5 月 | Pectra 升级 |
| 2025 年 12 月 | Fusaka 升级，引入 PeerDAS |
| 2026 年 | 计划 Glamsterdam（H2 2026）、Hegotá 升级 |

来源：ethereum.org 白皮书与路线图、Consensys 历史博客、Ethereum Classic 官网 DAO 分叉记录、SEC 文件、The Block。

## 三、技术机制与网络结构

Ethereum 是一个状态机型区块链：每个区块包含交易列表，节点通过执行交易使全局状态发生转移。核心创新是**智能合约**——部署在链上、由代码控制的可执行账户，使开发者能构建去中心化应用（dApp）。

**账户模型**：Ethereum 采用账户余额模型（区别于比特币的 UTXO 模型）。账户分两类——外部拥有账户（EOA，由私钥控制）和合约账户（由代码控制）。只有 EOA 能发起交易。

**共识机制**：2022 年合并后采用权益证明（PoS）。验证者需质押 32 ETH 参与出块，通过 Casper FFG 与 LMD GHOST 规则达成共识。违规行为（如双重签名）会触发 slashing，验证者被强制退出并损失部分质押 ETH。

**执行层与共识层分离**：节点需同时运行执行客户端（如 Geth）与共识客户端（如 Prysm），二者配对工作。客户端实现多样被视为去中心化优势，但也带来互操作与升级协调成本。

**扩容路线**：Ethereum 采用"以 Rollup 为中心的路线图"。Dencun 升级的 EIP-4844 引入 blob 数据（Proto-danksharding），大幅降低 Layer 2 数据发布成本；Fusaka 升级引入 PeerDAS（对等数据可用性采样），进一步提升 L2 扩展能力。

**关键升级一览**：

| 升级 | 时间 | 核心内容 |
|------|------|----------|
| 伦敦（EIP-1559） | 2021-08 | 基础费销毁，手续费更可预测 |
| 合并（The Merge） | 2022-09 | PoW 切换 PoS，能耗降约 99% |
| Shapella | 2023-04 | 开放质押提款 |
| Dencun（EIP-4844） | 2024-03 | Proto-danksharding，L2 成本下降 |
| Pectra | 2025-05 | EIP-7251、EIP-7702，质押灵活性与账户抽象 |
| Fusaka | 2025-12 | PeerDAS，L2 数据可用性提升 |

来源：ethereum.org 路线图、SEC 文件、Gate 升级页面、Nexo 博客。

## 四、用途、生态与价值来源

ETH 的价值来源可归纳为三个层面：

**1. 燃料费（gas）**：每笔交易与智能合约执行都需支付 gas 费，以 ETH 计价。EIP-1559 后基础费被销毁，网络活跃度直接决定 ETH 的销毁量。

**2. 质押抵押品**：PoS 下验证者需质押 32 ETH。截至 2026 年中，质押量已超 3900 万 ETH，约占流通供应约 32%。质押既是安全机制，也形成对 ETH 的锁仓需求。

**3. 生态结算资产**：Ethereum 是最大的 DeFi 生态。2026 年其 DeFi TVL 约 380–450 亿美元区间波动，仍是按 TVL 计最大的公链，但份额从 2026 年初约 63.5% 降至约 54%。稳定币、NFT、借贷、衍生品等应用均以 ETH 为计价或抵押基础。

**生态构成**：

| 类别 | 代表 | 说明 |
|------|------|------|
| DeFi | Uniswap、Aave、Lido | 去中心化交易、借贷、流动性质押 |
| Layer 2 | Arbitrum、Optimism、Base | Rollup 扩容方案 |
| 稳定币 | USDC、USDT | 大量发行于 Ethereum |
| NFT | 各类 ERC-721 资产 | 数字藏品与链上凭证 |
| 流动性质押 | Lido（约 61.66% 流动性质押份额） | 降低 32 ETH 门槛 |

来源：CoinMarketCap 社区文章、KuCoin 快讯、Thirdweb 博客、BingX 快讯。

## 五、代币经济与供给结构

ETH 的供给机制在 2021 年后发生根本变化：

**无固定上限**：Ethereum 没有总量上限（Max Supply 为无限），与比特币的 2100 万上限不同。

**发行机制**：PoS 下新 ETH 通过验证者奖励发行，发行率随质押量变化。合并后净发行率大幅下降。

**销毁机制**：EIP-1559 引入基础费销毁。当销毁量超过发行量时，ETH 处于净通缩状态。自 EIP-1559 激活以来，累计销毁超 450 万 ETH。

**质押锁仓**：截至 2026 年中，质押量约 3900–3960 万 ETH，占流通供应约 32%。流动性质押协议（如 Lido）锁定了其中约 1440 万 ETH。

| 指标 | 数值 | 说明 |
|------|------|------|
| 流通供应 | 约 1.21 亿 ETH | Coinbase/The Block 数据 |
| 总量 | 约 1.21 亿 ETH | 无固定上限 |
| 上限 | 无 | 无限发行 |
| 质押量 | 约 3900–3960 万 ETH | 约占流通 32% |
| 累计销毁 | 超 450 万 ETH | 自 EIP-1559 起 |

来源：Coinbase 价格页、The Block、KuCoin、BingX、Bit Digital 博客。

## 六、市场位置与历史表现

ETH 长期位居加密资产市值第二，仅次于比特币。CoinGecko 快照显示其市值排名 #2（具体价格、市值、成交额等数据在快照中为"—"，未能验证）。

**历史价格节点**：

| 时间 | 事件 | 价格参考 |
|------|------|----------|
| 2015 年 | 主网上线 | 约 $0.27 |
| 2021 年 11 月 | 历史高点 | $4,878.26 |
| 2022 年 | 熊市低点 | 约 $1,068 |
| 2024 年 12 月 | 回升 | 超 $4,100 |
| 2025 年 8 月 | 反弹 | 超 $4,500 |

**市场地位**：Ethereum 是 DeFi 与稳定币的核心结算层，尽管 2026 年 DeFi TVL 份额下滑，仍保持最大公链地位。2024 年现货 ETF 获批带来机构资金通道。

来源：The Block、Coincheck、Binance Square、KuCoin。

## 七、治理、安全与关键依赖

**治理机制**：Ethereum 治理是链下、以开发者为中心的流程。核心机制是 EIP（Ethereum Improvement Proposal）流程，由核心开发者通过 All Core Devs 会议讨论决定是否纳入网络升级。代币持有者不直接投票决定协议变更，这与链上治理公链（如部分 DAO）不同。以太坊基金会（Ethereum Foundation）在协调开发与资助中扮演重要角色，但并非唯一控制方。

**安全事件**：

| 事件 | 时间 | 影响 |
|------|------|------|
| The DAO 攻击 | 2016-06 | 约 360 万 ETH 被转走，触发硬分叉 |
| Truebit 漏洞 | 2026-01 | 损失 $2,620 万（整数溢出） |
| 未验证合约攻击 | 2025-12 至 2026-06 | Chainalysis 统计共 $3,670 万 |
| Jaredfromsubway MEV 机器人 | 2026-06 | 授权漏洞损失超 $750 万 |

**关键依赖**：Ethereum 的安全性依赖验证者网络的诚实多数、客户端实现的多样性、以及质押集中度。Lido 在流动性质押市场占约 61.66% 份额，引发对质押集中化的关注。MEV（最大可提取价值）活动（如三明治攻击）是持续存在的结构性风险。

来源：ethereum.org、Ethereum Classic 官网、Chainalysis 报告、KuCoin、The Defiant。

## 八、监管与合规环境

**美国**：2023 年 8 月，纽约法院在 Uniswap 相关案件中称 ETH 为商品（commodity），但 SEC 长期回避明确表态。2024 年 5 月 SEC 批准 8 只现货以太坊 ETF 的 19b-4 表格，被广泛解读为对 ETH 非证券属性的实际承认。SEC 曾对以太坊基金会及以太坊 2.0 展开调查，2026 年 Consensys 宣布 SEC 结束对以太坊 2.0 的调查，不指控 ETH 销售为证券交易。

**其他地区**：欧盟 MiCA 法规自 2024 年起适用；中国大陆禁止加密货币交易；英国 FCA 曾禁止面向散户的加密衍生品。

**关键监管节点**：

| 时间 | 事件 |
|------|------|
| 2023-08 | 纽约法院称 ETH 为商品 |
| 2024-05 | SEC 批准 8 只现货以太坊 ETF |
| 2026 | SEC 结束以太坊 2.0 调查，不指控证券违规 |

来源：CoinDesk、Nasdaq、Fortune、HTX 快讯、SEC 文件。

## 九、催化因素、主要风险与外部研判

**潜在催化因素**：
- 2026 年计划中的 Glamsterdam、Hegotá 升级，持续推进扩容与账户抽象
- 现货 ETF 持续流入与机构配置
- 以太坊基金会 2026 年 2 月发布的"Strawmap"路线图（覆盖至 2029 年），将量子安全列为更高优先级
- 质押规模持续增长，形成锁仓效应

**主要风险**：
- **竞争压力**：Solana、Base 等链在 DeFi 份额上持续追赶，Ethereum DeFi 份额 2026 年从 63.5% 降至约 54%
- **质押集中化**：Lido 占流动性质押市场约 61.66%，引发中心化担忧
- **MEV 与安全**：MEV 机器人攻击、未验证合约漏洞等持续存在
- **监管不确定性**：ETH 的证券/商品属性在美国仍无立法明确，各司法辖区规则不一
- **技术升级风险**：硬分叉可能引入 bug 或导致社区分裂

**外部研判**：市场观察者普遍认为 Ethereum 仍是 DeFi 与稳定币的核心结算层，但其主导地位正面临多链竞争。2026 年 DeFi TVL 整体下滑约 39%，Ethereum 自身 TVL 也出现回落，反映行业整体承压。上述为外部观察，非本报告结论。

## 十、信息来源与未能验证

**CoinGecko markets 接口**：本报告市场数据以用户提供的 CoinGecko 快照为准。CoinGecko API 提供 `/coins/ethereum` 及 `/coins/{id}/market_chart` 等端点（见 docs.coingecko.com），但本报告未直接调用该接口，快照中价格、市值、成交额、涨跌、历史高低点等字段均为"—"，未能验证。

**实际检索来源**：
- ethereum.org（白皮书、路线图、PoS 文档）
- Ethereum Classic 官网（DAO 分叉记录）
- Consensys 博客（历史时间线）
- The Block、CoinDesk、Fortune、Nasdaq（市场与监管报道）
- SEC EDGAR 文件（ETF 批准、10-K/10-Q 风险披露）
- Coinbase、KuCoin、BingX、HTX、Gate（市场数据与快讯）
- Chainalysis 报告（安全事件统计）
- CoinMarketCap 社区文章（TVL 数据）
- CoinGecko API 文档

**未能验证**：
- CoinGecko 快照中的具体价格、流通市值、FDV、24 小时成交额、24 小时涨跌、历史高点/低点及对应日期（快照中均为"—"）
- 精确的流通供应量（Coinbase 显示约 1.21 亿，MarketScreener 显示约 1.22 亿，存在口径差异）
- 2026 年 8 月 27 日当日的实时质押量、TVL 与销毁量
- 历史低点的具体数值与日期
- 部分 2026 年升级（Glamsterdam、Hegotá）的确切上线日期与最终功能清单

**数据口径说明**：市场数字仅采用用户提供的 CoinGecko 快照；其余链上数据（质押量、TVL、销毁量）来自第三方报道，存在时间与口径差异，均标注来源。
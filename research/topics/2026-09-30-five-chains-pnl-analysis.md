---
title: X Layer、Robinhood Chain、Arc、Solana、BNB Chain：技术结构与盈亏核算难点
category: topics
topic_type: tech
content_type: analysis
subjects: [web3]
entity_type: technology
date: 2026-09-30
time: "18:30"
tags: [盈亏分析, X Layer, Robinhood Chain, Arc, Solana, BNB Chain, EVM, SVM, 链上数据]
summary: 五条链分别承接交易所、券商、稳定币和公链生态。盈亏工具接入它们，核心工作是还原地址的资金流、成交价和成本，而非读取一项链上现成指标。
tldr: X Layer 与 Robinhood Chain 是以太坊 L2；Arc、Solana、BNB Smart Chain 是 L1。前四者里除 Solana 外都兼容 EVM。盈亏分析要跨过交易所充提、桥、内部调用、Token-2022、代币税和股票代币公司行动等数据缺口，页面显示“已支持”只说明索引器已有一套计算口径。
assistance: codex
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> **风险与合规提示：** 链上盈亏是按公开交易、价格源和既定成本法计算的估计结果，不能替代交易所账单、证券持仓凭证、税务记录或法律意见。跨链桥、股票代币、稳定币、迷因币和其他加密资产可能造成全部本金损失。资料用于理解技术与数据口径，不构成投资、开户、买卖或税务建议。

## 一、先给结论

**X Layer、Robinhood Chain、Arc、Solana、BNB Smart Chain** 是五套需要分别索引的账本。产品标注“支持盈亏分析”，通常表示它已经能识别地址、代币、交换、转账、Gas 和价格，并按自己的成本法生成结果。链本身没有一个可直接读取的“用户盈亏”字段。

五条链放在一起看，有四个结论：

1. **它们来自四种入口。** X Layer 连接 OKX，Robinhood Chain 连接券商与股票代币，Arc 连接 Circle 与 USDC，BNB Chain 连接币安生态；Solana 的独立公链与消费级应用规模使它成为多链工具的常见必选项。
2. **技术上是“四加一”。** X Layer、Robinhood Chain、Arc、BNB Smart Chain 兼容 EVM，地址都是 `0x...`；Solana 使用 SVM、Base58 地址、Mint 和 Token Account，需要另一套解析器。
3. **层级上是“三加二”。** Arc、Solana、BNB Smart Chain 是 L1；X Layer 和 Robinhood Chain 是把数据与结算锚回 Ethereum 的 L2。L2 的排序器、官方桥和提现挑战期会直接影响资金流识别。
4. **“算得出来”不等于“算得准”。** 中心化交易所内的买入成本不会写进链；跨链桥会把同一经济头寸拆成两条链上的销毁、锁定、铸造或释放；复杂合约又会把一次交易拆成多层调用。产品必须补价格、标签与归因规则。

截至 2026 年 9 月 30 日，[DefiLlama 链列表](https://defillama.com/chains)记录的 DeFi TVL 快照约为：Solana 64.7 亿美元、BSC 57.3 亿美元、Robinhood Chain 10.2 亿美元、Arc 4.74 亿美元、X Layer 1.72 亿美元。TVL 会随币价、统计口径和重复抵押变化，只用于观察网络规模，不能证明盈亏数据质量或资产安全。

## 二、五条链各自是什么

| 网络 | 层级与执行环境 | 主网识别 | Gas | 发起方与主要入口 | 盈亏分析最容易漏掉什么 |
|---|---|---|---|---|---|
| X Layer | Ethereum L2；EVM | Chain ID `196` | OKB | OKX、OKX Wallet、OKX Pay | OKX 账户内成交成本、桥接前的来源链成本、发射台与带税代币 |
| Robinhood Chain | Ethereum L2；Arbitrum Nitro / EVM | Chain ID `4663` | ETH | Robinhood App、Wallet、Stock Tokens | 券商账户成本、股票代币的法律结构、拆股分红等公司行动 |
| Arc | 独立 L1；EVM 兼容 | Chain ID `5042` | USDC | Circle、USDC、支付与金融机构 | USDC 直接支付 Gas、稳定币兑换价差、许可验证者下的链上与链下结算 |
| Solana | 独立 L1；SVM | 不使用 EVM Chain ID | SOL | 钱包、DEX、支付、发射台与消费应用 | 内层指令、聚合路由、Token-2022、优先费、账户租金与关闭账户退款 |
| BNB Smart Chain | 独立 L1；EVM | Chain ID `56` | BNB | 币安、钱包、PancakeSwap 与大量零售应用 | 交易所充提、内部交易、代币税、反射分红；还容易把 opBNB 当成同一条链 |

BNB Chain 是生态品牌，常见的余额与交易分析对象是 **BNB Smart Chain（BSC）**。opBNB 是另一条 L2，Chain ID 为 `204`，不能把两个账本的同地址余额直接合并。Robinhood 作为链名称时指 Robinhood Chain，不能和 Robinhood 券商账户里的持仓混为一组链上数据。

## 三、X Layer：交易所入口做的以太坊 L2

X Layer 主网 Chain ID 为 `196`，用 OKB 支付 Gas。它最初按 Polygon CDK / zkEVM 路线启动，后续 PP 升级后的[网络信息页](https://web3.okx.com/xlayer/docs/developer/build-on-xlayer/network-information)将现行架构写为增强版 OP Stack、EVM-equivalent，并列出约 7 天的标准提现挑战期。OKX 还把与其重叠的 OKTChain 逐步停用，平台链上入口进一步收口到 X Layer。[OKB 与 X Layer 公告](https://www.okx.com/help/announcement-on-the-pp-upgrade-of-x-layer-and-optimisation-of-the-okb-gas)

对盈亏工具来说，EVM 兼容降低了解析门槛：普通转账、ERC-20、Uniswap 风格 Swap、合约事件和交易回执都能复用成熟工具。难点在入口边界。用户可能先在 OKX 账户买入，再提现到 X Layer；链上只看得到资产进入地址，看不到交易所内的成交时间、手续费和成本。若产品把这笔入账按当时市价当作买入，结果会和真实账单不同。

X Layer 上的发射台、迷因币和带转账税代币还会制造第二层偏差。标准 `Transfer` 事件只告诉索引器余额怎样变化，不能自动说明哪一部分是税、回购、分红、销毁或项目方费用。合约代理升级后，旧规则也未必继续适用。

## 四、Robinhood Chain：股票代币把会计口径带进 DeFi

Robinhood Chain 于 2026 年 7 月开放主网，主网 Chain ID 为 `4663`，使用 ETH 付 Gas。它采用 Arbitrum Nitro，交易数据通过 Ethereum blobs 发布，Robinhood 运营排序器；合约部署对外开放。协议升级由 8 席安全委员会管理，BoLD 验证者在资料截至日仍需许可。[Robinhood Chain 文档](https://docs.robinhood.com/chain/) [治理说明](https://docs.robinhood.com/chain/governance/)

这条链的差异化资产是 Stock Tokens。官方文件将其写为 Robinhood Assets (Jersey) Limited 发行的 ERC-20 代币化债务证券，持有人取得与标的股票或 ETF 相关的经济敞口，不因此取得标的公司的股东身份。[Stock Tokens 文档](https://docs.robinhood.com/chain/stock-tokens/)

普通代币盈亏常用“收入减支出”近似；股票代币还要处理拆股、合股、现金分红和其他公司行动。Robinhood 文档提供 `uiMultiplier()` 以调整展示数量。索引器若只读取原始 ERC-20 `balanceOf`，可能在拆股后把数量、单价和成本全部算错。Robinhood App 内的证券账户与 Robinhood Chain 地址也属于两个数据域，只有链上地址无法还原券商账户里的原始买入批次。

## 五、Arc：用 USDC 付 Gas 的金融型 L1

Circle 于 2026 年 9 月 16 日开放 Arc 主网。Arc 是 EVM 兼容 L1，主网 Chain ID 为 `5042`，原生 Gas 资产是 USDC。当前验证者由获准机构组成；Circle 表示未来将探索转向权益证明。ARC 已完成初始铸造，公开发行并未因此自动发生，当前手续费仍由 USDC 支付。[Circle 主网公告](https://www.circle.com/pressroom/circle-launches-arc-mainnet-an-economic-operating-system-for-the-internet) [稳定币原生模型](https://docs.arc.io/arc/concepts/stablecoin-native-model)

USDC 付 Gas 改变了盈亏页面的展示习惯。多数 EVM 链会单列 ETH、BNB 或 OKB 的 Gas 消耗；Arc 上支付手续费会直接减少美元计价资产。一次 USDC 兑换可能同时产生：换入资产、协议费、滑点和 USDC Gas。若工具把钱包减少的全部 USDC 都当作买入成本，或把 Gas 重复扣一次，净收益都会偏离。

“一枚 USDC 约等于一美元”也是价格假设，不是链上常量。脱锚、跨币种换汇、桥接版与 Circle 原生发行版之间的差别，仍需合约地址、发行路径和成交价格共同确认。

## 六、Solana：高吞吐账本需要单独的交易解释器

Solana 是五条链里唯一的非 EVM 网络。SOL 支付基础费和优先费；代币由 Token Program 或 Token-2022 Program 管理，用 Mint 地址识别，钱包余额通常存放在 Associated Token Account。[Solana 费用文档](https://solana.com/docs/core/fees) [Token 文档](https://solana.com/docs/tokens)

一笔用户看到的 Swap，链上可能经过 Jupiter 聚合器、多个流动性池和多条 inner instructions。只读取最外层指令，容易漏掉中间币、平台费、账户创建费和最终实际到账。版本化交易与 Address Lookup Table 还要求索引器补齐账户列表。

Token-2022 支持转账费、利息展示、永久委托等扩展。解析器若仍按传统 SPL Token 处理，账面转出数量和收款方实收数量会对不上。Solana 创建 Token Account 时还会锁定一笔可退还的 rent；关闭账户后 SOL 返回钱包。把锁定额算成永久手续费，会低估收益。

## 七、BNB Chain：成熟 EVM 生态里，代币行为比接口更复杂

BNB Smart Chain 主网 Chain ID 为 `56`，使用 BNB 付 Gas，兼容 EVM。BEP-20 从 ERC-20 接口演化而来，开发工具和用户体验与以太坊接近。[BSC 介绍](https://docs.bnbchain.org/bnb-smart-chain/introduction/) [BEP-20 规范](https://github.com/bnb-chain/BEPs/blob/master/BEPs/BEP20.md)

BSC 的交易历史长、代币数量大，盈亏工具能复用 EVM 的日志与调用追踪，但不能只解析标准 Swap。带税代币会在转账时扣除费用；反射型代币可能不靠一条普通 `Transfer` 就改变持有人可见余额；代理合约、路由器、多跳交易和内部调用还会改变资金归因。

币安账户与链上地址之间也存在和 X Layer 相同的数据断点。充值到币安只证明资产离开链上地址；它可能被卖出、换币、转入理财或继续留存。没有交易所账单时，链上分析只能把充值记作转出，不能确认这是实现收益、内部调拨还是托管地点变化。

## 八、盈亏工具到底要做哪些计算

一套可复核的多链盈亏至少需要五层数据：

```text
地址与账户
  → 交易、回执、日志、内层指令
  → Swap / 转账 / 桥 / 借贷 / 质押等动作归类
  → 代币身份、精度、公司行动与价格
  → FIFO / LIFO / 加权平均等成本法
  → 已实现收益、未实现收益、Gas 与无法归因项
```

其中三组概念应分开：

| 项目 | 能从链上直接确认 | 仍需外部数据或规则 |
|---|---|---|
| 数量 | 地址在某一区块的余额变化 | 这笔变化属于买卖、赠与、桥接、内部调拨还是公司行动 |
| 价值 | 某池在某时刻的成交结果 | 法币价格、低流动性资产公允价、稳定币脱锚和异常成交过滤 |
| 盈亏 | 无 | 初始成本、税务成本法、交易所内成交、跨地址归属与费用处理 |

因此，可靠页面应允许用户展开计算明细：采用哪种成本法、Gas 是否计入成本、跨链是否延续原成本、无价格资产怎样处理、哪些交易无法识别。只给一个绿色或红色总数，无法判断误差来自行情、标签还是成本归因。

## 九、外部研判

这五条链同时被接入，反映的主要是用户入口与交易活动的组合。Solana 和 BSC 提供大规模链上交易；X Layer 与 Robinhood Chain把交易所、券商用户带进专用 L2；Arc 把稳定币发行、Gas 和金融结算放进同一网络。对盈亏产品而言，这样的覆盖比单纯按 TVL 排名前五更有产品价值。

接入 EVM 链的边际成本相对低，地址、ABI、事件和节点接口可以复用。Solana 需要独立工程投入。Robinhood Stock Tokens 和 Arc 的 USDC Gas 又迫使产品理解资产语义，单纯“扫余额乘价格”的方法很快会失效。

“支持某条链”最好拆成覆盖等级：原生币与普通转账、DEX Swap、桥、借贷与 LP、质押、复杂代币、交易所账单。五条链都打勾，只能说明产品已建立入口；计算能否复核，要看它具体覆盖到了哪一层。

## 十、信息来源与持续验证

- X Layer：[网络信息](https://web3.okx.com/xlayer/docs/developer/build-on-xlayer/network-information)、[OKB 与链升级公告](https://www.okx.com/help/announcement-on-the-pp-upgrade-of-x-layer-and-optimisation-of-the-okb-gas)
- Robinhood Chain：[开发文档](https://docs.robinhood.com/chain/)、[连接参数](https://docs.robinhood.com/chain/connecting/)、[治理](https://docs.robinhood.com/chain/governance/)、[Stock Tokens](https://docs.robinhood.com/chain/stock-tokens/)
- Arc：[Circle 主网公告](https://www.circle.com/pressroom/circle-launches-arc-mainnet-an-economic-operating-system-for-the-internet)、[稳定币原生模型](https://docs.arc.io/arc/concepts/stablecoin-native-model)、[EVM 差异](https://docs.arc.io/build/evm-differences)
- Solana：[手续费](https://solana.com/docs/core/fees)、[代币与 Mint](https://solana.com/docs/tokens)、[Token-2022 扩展](https://solana.com/docs/tokens/extensions)
- BNB Chain：[BSC 介绍](https://docs.bnbchain.org/bnb-smart-chain/introduction/)、[BEP-20](https://github.com/bnb-chain/BEPs/blob/master/BEPs/BEP20.md)
- 规模快照：[DefiLlama Chains](https://defillama.com/chains)、[X Layer](https://defillama.com/chain/X%20Layer)、[Robinhood Chain](https://defillama.com/chain/Robinhood%20Chain)、[Arc](https://defillama.com/chain/Arc)、[Solana](https://defillama.com/chain/Solana)、[BSC](https://defillama.com/chain/BSC)
- 站内交叉：[一枚币到底运行在哪里](/articles/research/topics/public-chain-l1-l2-evm-svm)、[Robinhood Chain](/articles/research/topics/robinhood-chain)、[Circle 与 Arc](/articles/research/companies/circle-arc)、[Solana](/articles/research/topics/crypto-solana)、[BNB](/articles/research/topics/crypto-binancecoin)

资料截至 **2026 年 9 月 30 日**。持续验证项：各产品对跨链成本延续、交易所账单、Token-2022、带税代币和股票代币公司行动的实际覆盖级别；Arc 与 Robinhood Chain 的验证者开放进度；X Layer 升级后的证明、挑战和官方桥运行数据。任何一项变化都可能影响“已支持”的准确含义。

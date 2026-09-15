---
title: Robinhood Chain 深度调研：券商自建 L2，怎样把股票代币接入 DeFi
category: topics
topic_type: industry
content_type: analysis
subjects: [business_market, ai_dev]
date: 2026-09-15
time: 15:10
tags: [Robinhood Chain, 罗宾汉链, 以太坊L2, Arbitrum, 股票代币, RWA, DeFi, Stock Tokens]
summary: Robinhood Chain 已从股票代币的专用结算层长成高交易量的开放 L2；它的优势来自 Robinhood 用户入口、发行主体和 DeFi 流动性的组合，真正考验则是股票代币规模、治理透明度与跨司法辖区合规。
tldr: Robinhood Chain 于 2026 年 7 月上线主网，使用 Arbitrum Nitro、Ethereum blobs 和 ETH Gas，允许任何人部署合约；Robinhood 运营排序器，协议由 8 席安全委员会管理，BoLD 验证者仍需许可。主网早期 TVL、稳定币和 DEX 成交增长很快，活动主体仍是稳定币、借贷和高波动代币。Stock Tokens 是 Jersey 实体发行的代币化债务证券，只提供标的经济敞口，不赋予持有人标的股票权利。
assistance: codex
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> **风险提示：** Robinhood Chain 上的加密资产、股票代币、借贷和衍生品可能造成全部本金损失。Stock Tokens 受销售地区和投资者资格限制，也不等同于持有对应公司的股票。以下内容用于技术与行业研究，不构成投资、法律或税务建议。

## 一、先给结论

Robinhood Chain 是 Robinhood 把券商、加密钱包、资产发行和链上交易连接起来的一层基础设施。它已经具备开放区块链的基本形态：任何人都能部署合约，资产由用户自托管，状态数据发布到以太坊，Uniswap、Morpho、Chainlink、Alchemy 等基础组件已经接入。

几个结论可以先确定：

1. **网络已经上线。** 2026 年 7 月 1 日开放主网，主网 Chain ID 为 `4663`，测试网为 `46630`，ETH 同时承担 Gas 资产。
2. **开放使用与集中运营同时存在。** 合约部署无需许可；Robinhood 运营排序器，BoLD 欺诈证明目前由两家获许可验证者参与，协议升级由 8 席安全委员会控制。
3. **Stock Tokens 是核心差异化资产。** 它们是 Robinhood Assets (Jersey) Limited 发行的 ERC-20 代币化债务证券，向持有人提供股票或 ETF 的经济敞口，法律关系落在发行人和产品条款上。
4. **早期数据很强，结构仍偏加密原生。** 截至 2026 年 9 月 15 日抓取的 DefiLlama 页面，DeFi TVL 约 9.20 亿美元、稳定币市值约 10.44 亿美元、RWA 活跃市值约 2.74 亿美元，过去 24 小时 DEX 成交约 16.68 亿美元。这些数字实时变化，也会受激励、重复换手和高波动代币影响。
5. **Robinhood 得到了一条新的收入与分发链路。** 用户在链上每做一次交易，可能同时给排序器、钱包入口、交易协议、借贷市场和流动性提供者贡献收入。Robinhood 可以把原先分散在外部链和第三方应用里的活动留在自己的生态里。
6. **长期胜负看 RWA 的实际使用。** 交易笔数和 Meme 币成交可以快速制造热度。更难复制的结果是持续扩大合规可流通的 Stock Tokens，让它们形成可靠的现货深度、抵押借贷和跨应用结算。

## 二、先分清三个“Robinhood”

| 层级 | 用户拿到什么 | 谁控制主要入口 | 关键边界 |
|---|---|---|---|
| Robinhood App | 券商、加密交易、现金管理等账户服务 | Robinhood 及各地区持牌实体 | 账户资产、可用产品和保护规则按地区变化 |
| Robinhood Wallet | 自托管钱包与 dApp 入口 | 私钥由用户控制，界面和默认路由由 Robinhood 提供 | 钱包中的链上交易不自动获得券商账户保护 |
| Robinhood Chain | 开放的 EVM Layer 2 | Robinhood 运营排序器；协议治理由安全委员会执行 | 第三方可自由发币和部署应用，Robinhood 不为它们背书 |

这三个入口会互相导流，却不能混为一种产品。Robinhood Chain 支持页面明确写明，它与用户的 Robinhood 券商及加密账户相互独立。链上的余额、授权和合约风险也不会自动同步到券商账户。

同样需要区分两代股票代币：2025 年在欧洲推出、部署于 Arbitrum One 的产品后来被称为 **Classic Stock Tokens**；2026 年主网上线后，新一代 **Stock Tokens** 部署在 Robinhood Chain，并通过 Robinhood Wallet 面向符合条件的地区开放。两者的发行文件、合约地址和可用地区不能互换。

## 三、从欧洲股票代币到独立主网

| 时间 | 事件 | 意义 |
|---|---|---|
| 2025-06-30 | Robinhood 在欧洲推出 200 多只美国股票和 ETF 代币，并公布自建 Arbitrum L2 计划 | 先在 Arbitrum One 验证需求和运营流程 |
| 2026-02-10 | Robinhood Chain 公共测试网上线 | Alchemy、Allium、Chainlink、LayerZero、TRM 等开始接入 |
| 2026-07-01 | 公共主网上线，新一代 Stock Tokens 和一组 DeFi 产品同时公布 | 发行、钱包、交易和借贷开始向专用链迁移 |
| 2026-07 中旬 | 链上高波动代币和 DEX 活动率先爆发 | 流动性增长快于 RWA 使用，网络开放性得到真实检验 |
| 2026-09-15 | DeFi TVL 约 9.20 亿美元，RWA 活跃市值约 2.74 亿美元 | RWA 已增长，但稳定币、借贷和交易仍构成更大的活动底盘 |

Arbitrum 将这条路径概括为“launch-and-migrate”：先在通用链发布产品，再迁移到可定制的专用链。Robinhood 获得了交易排序、Gas 经济、升级节奏和产品集成上的控制权，同时继续复用 Nitro、EVM 和以太坊数据可用性。

## 四、技术架构与控制面

### 1. 交易怎样落到以太坊

Robinhood Chain 运行 Arbitrum Nitro，交易先交给 Robinhood 运营的排序器。排序器按到达先后排序，官方称用户不能靠提高优先费插队。批量交易数据通过 Ethereum blobs 发布到以太坊；独立全节点需要同时读取以太坊执行层和共识层数据，才能重建 L2 状态。

主网技术参数包括：

| 项目 | 当前公开配置 |
|---|---|
| 执行环境 | EVM，Solidity、Vyper 及常见以太坊工具可直接使用 |
| Rollup 软件 | Arbitrum Nitro；官方节点文档在资料截至日列出 ArbOS 61 |
| 数据可用性 | Ethereum blobs |
| Gas 资产 | ETH |
| 排序 | 先到先服务，由 Robinhood 排序器接收交易 |
| 账户抽象 | 支持 ERC-4337、Gas 赞助、批量交易和 session key |
| L1 提现 | 官方给出的典型挑战期约 7 天 |
| 浏览器 | Blockscout |

“交易按到达顺序排列”只能说明公开排序规则。外部资料还不足以独立验证各网络位置的到达时间、排序器抗审查能力和极端拥堵下的处理方式。

### 2. 谁能挑战错误状态

网络使用 Arbitrum 的 BoLD 争议解决机制。官方治理页同时写明，验证者集合需要许可，目前只有 Offchain Labs 和 Alchemy 两家；节点文档称成为验证者要进入 allowlist，并质押 1 WETH。

因此，普通用户可以运行全节点并检查状态，但不能自动获得发起协议级挑战的资格。以太坊提供数据发布和最终结算底座，错误状态能否被及时挑战还依赖许可验证者持续在线并采取行动。

### 3. 谁能升级协议

安全委员会共有 8 席：Robinhood 占 2 席，BitGo、Chainlink Labs、Fireblocks、Offchain Labs、Paxos 和 Talos 各占 1 席。

- 常规操作需要 6/8 同意，并经过 7 天链上时间锁；
- 紧急操作需要 7/8 同意，可以绕过时间锁；
- Robinhood 单独无法达到任何一个门槛；
- 六家外部机构在票数上足以通过常规操作，但公开资料没有披露提案流程、成员协议、责任安排和实际签名历史的完整说明。

这种治理把升级权分散给多家机构，比单一公司热钱包更稳健。它仍是一套机构委员会治理，用户和普通验证者没有链上投票权。

## 五、Stock Tokens 到底代表什么

Stock Tokens 最容易被误读成“链上的美股”。准确的法律和技术拆分如下：

| 维度 | 公开事实 | 对持有人的影响 |
|---|---|---|
| 发行人 | Robinhood Assets (Jersey) Limited，简称 RHJ | 持有人首先面对 RHJ 的履约与产品条款 |
| 法律性质 | 代币化债务证券 | 获得标的价格相关的经济敞口 |
| 股东权利 | 不授予对标的证券发行人的法律或受益权利 | 不能凭代币直接主张股东身份、投票权或登记所有权 |
| 链上格式 | 标准 ERC-20，18 位小数 | 可由钱包持有，也可接入交易、借贷和组合策略 |
| 一级发行 | 需经 KYB 的 Authorized Participant 才能向 RHJ 申购；文档列出的初始参与者为 BBVI | 普通开发者和终端用户不能直接向发行人铸造 |
| 价格 | 每项资产配有 Chainlink 链上价格源 | 合约仍需检查数据新鲜度、偏差与市场状态 |
| 公司行动 | 通过 `uiMultiplier()` 调整每枚代币对应的股份数量 | 只读取原始 ERC-20 余额会算错拆股、分红等调整后的展示数量 |

RHJ 的基础招股书由列支敦士登金融市场管理局按欧盟招股书规则批准。Robinhood 在 2026 年二季度 10-Q 中强调，这类批准只确认文件的完整性、可理解性和一致性，不构成对发行人或产品质量的背书；Jersey 的相关同意也不等于对 RHJ 的审慎监管。

Stock Tokens 没有在美国证券法下注册，不能向美国人士发售或交付；加拿大、英国、瑞士等地也有限制。Robinhood Wallet 覆盖 120 多个国家只说明入口范围，单项资产能否交易仍要结合用户所在地、资格检查和具体条款。

### 24/7 交易仍受链下窗口约束

终端用户可以在一级铸造窗口之外继续链上买卖，但做市商向 RHJ 铸造和销毁 Stock Tokens 的窗口为欧洲时间周一 02:00 至周六 02:00。各资产还分别标记常规、延长和隔夜时段的可交易状态。

这意味着周末或底层市场休市时，链上价格可能继续变化，而一级市场无法立刻扩张或收缩供给。流动性较薄时，代币价格、预言机参考值和下一次可赎回价值可能拉开。所谓“24/7”描述的是链上转让能力，不保证全天候都有同样深度和套利效率。

## 六、主网上线后的真实结构

DefiLlama 在 2026 年 9 月 15 日页面快照中给出：

| 指标 | 快照值 | 该数字不能单独证明什么 |
|---|---:|---|
| DeFi TVL | 约 9.20 亿美元 | 会受资产价格、重复抵押和统计口径影响 |
| 稳定币市值 | 约 10.44 亿美元 | 稳定币进入网络不等于发生了真实支付或投资需求 |
| USDG 占稳定币比例 | 约 68.34% | 集中度高，增长与 Paxos/Global Dollar 生态绑定较深 |
| RWA 活跃市值 | 约 2.74 亿美元 | 包含多类现实资产，不能全部视为股票代币 |
| 24 小时 DEX 成交 | 约 16.68 亿美元 | 高频换手、机器人和激励能显著放大成交额 |
| 7 日 DEX 成交 | 约 122.51 亿美元 | 需要结合独立交易者、手续费和留存判断质量 |
| 24 小时链费 / 链收入 | 约 48.5 万 / 43.6 万美元 | 单日值波动大，也不是 Robinhood 全部可确认会计收入 |

TVL 最大的应用是 Morpho Blue，约 5.25 亿美元；Uniswap 约 2.48 亿美元。借贷和交易已经形成基础深度。Pons、Fables、NOXA Fun、StonkBrokers 等发币或交易应用同时进入主要活动列表，说明高波动代币仍在贡献大量手续费和交易。

这个结构有两面。高频交易给网络带来流动性、钱包活跃和 Gas 收入，也增加诈骗、抢跑、同名代币和品牌混淆风险。CoinDesk 在主网上线两周后的统计中发现，当时 RWA 只占链上价值的一小部分；到 9 月，RWA 活跃市值已经明显扩大，但仍不足以解释全网的 DEX 成交。

## 七、Robinhood 为什么需要自己的链

### 1. 把产品分发变成协议分发

传统 Robinhood 产品依赖 App 内账户。自建开放链以后，外部钱包、机器人、聚合器和开发者也能使用 Robinhood 发行的资产。Robinhood 不必亲自开发每一个交易、借贷或组合工具，就能让 Stock Tokens 进入更多应用。

### 2. 保留交易产生的链级经济

在第三方链上发行资产，Robinhood 能获得发行与产品收入，但网络 Gas 和排序器经济归属外部生态。独立 L2 让 Robinhood 运营排序器并收取 Gas。DefiLlama 对“链收入”的定义，是 Gas 收入扣除以太坊 L1 执行与 blob 成本以及 Arbitrum 相关分成后的估算；它适合观察量级，不能直接替代 Robinhood 财报收入。

### 3. 为 RWA 定制交易和账户体验

先到先服务排序、ERC-4337、Gas 赞助、Stock Token API、公司行动 multiplier、Chainlink 数据流和地区资格判断，可以组成一套更接近金融应用的开发环境。开发者仍需自己处理许可、前端限制、价格源异常和用户适当性，链本身不会自动完成合规。

### 4. 降低对单一地区业务的依赖

Robinhood 的美国券商业务受到证券交易、支付订单流和市场时段约束。Stock Tokens、Wallet 和 Chain 组成全球产品栈，可以面向不同司法辖区推出自托管交易、借贷和衍生品。相应代价是发行、钱包、链和第三方协议分别落入不同监管框架，运营复杂度也随之上升。

## 八、竞争力与短板

### 竞争力

- **现成用户入口。** Robinhood App 与 Wallet 能把链上产品放到已有零售用户面前。
- **发行能力。** RHJ、价格 API、公司行动处理和 Authorized Participant 体系形成了从链下证券到链上代币的完整链路。
- **基础设施复用。** EVM 与 Arbitrum Nitro 降低迁移成本，开发者无需学习一套全新虚拟机。
- **金融合作方密度。** Paxos、BitGo、Fireblocks、Chainlink、Talos、Morpho 等覆盖稳定币、托管、密钥、数据和借贷。
- **链级收入。** 高频链上活动可以直接产生排序器收入，减少纯靠交易佣金或点差变现的压力。

### 短板

- **排序器仍是单一运营入口。** Robinhood 明确不保证排序器持续可用，停机和审查风险需要逃生与延迟交易机制兜底。
- **验证者集合很小且需许可。** 两家验证者比开放挑战市场更依赖机构持续履职。
- **股票代币的法律关系复杂。** 代币持有人拥有 RHJ 债权产品，仍需理解发行人、抵押、赎回、破产隔离和销售限制。
- **早期活动质量难判断。** DEX 成交和手续费很高，独立真实用户、激励依赖、机器人占比和 RWA 用户留存尚无统一公开口径。
- **开放链会放大品牌风险。** 任何人都能发行带有 Robinhood、HOOD 或股票 ticker 的代币，名称和图标无法证明官方身份。

## 九、主要风险

| 风险 | 触发方式 | 可观察信号 |
|---|---|---|
| 排序器与升级风险 | 排序器停机、紧急升级、委员会密钥失陷 | 状态页、延迟交易是否可用、委员会链上操作 |
| 欺诈证明集中 | 两家许可验证者同时离线或未挑战错误断言 | 验证者名单、挑战记录、allowlist 是否扩大 |
| Stock Token 发行人风险 | RHJ 履约、托管或对冲安排出现缺口 | 招股书更新、审计/证明、Authorized Participant 数量 |
| 流动性错配 | 周末或休市期间无法铸造赎回，链上价格偏离 | DEX 深度、预言机偏差、铸造窗口恢复后的套利速度 |
| 预言机与公司行动 | 价格停更、multiplier 读取错误、拆股或分红处理异常 | 数据源新鲜度、API 与链上值差异、异常暂停 |
| 桥接风险 | 第三方快速桥密钥、消息或流动性池被攻击 | 使用哪条桥、验证模型、限额与暂停机制 |
| 监管风险 | 证券、加密资产、衍生品或跨境营销规则变化 | 产品下架、地区限制、招股书补充、监管公告 |
| 投机与诈骗 | 同名代币、假官网、恶意授权和拉盘出货 | 完整合约地址、源码、权限、流动性集中度 |

Robinhood 自己在 2026 年二季度 10-Q 中把依赖以太坊、协议升级、第三方智能合约漏洞、非法活动、Stock Tokens 和全球监管都列为实质风险。这个披露比营销页面更适合用来确定风险边界。

## 十、外部研判

### 判断一：Robinhood Chain 的护城河在资产与入口

Arbitrum Nitro、EVM 和 Blockscout 都可被其他团队复用。Robinhood 更难复制的部分是零售用户分发、受监管实体、股票代币发行流程、钱包默认入口和做市关系。链的价值要通过这些能力持续向链上导入资产与用户才能成立。

### 判断二：Meme 活动是压力测试，也是噪声

开放主网出现高波动代币，说明开发和交易确实无须 Robinhood 逐项批准。它同时考验品牌隔离、钱包风险提示、排序公平和欺诈处理。短期成交可为 RWA 市场积累 ETH、稳定币和交易基础设施；是否会转化为股票代币用户，目前没有足够证据。

### 判断三：专用链让 Robinhood 同时扮演多种角色

Robinhood 及关联实体可能分别承担应用分发、钱包界面、链排序器、资产发行生态和金融产品运营角色。纵向整合能减少摩擦，也会带来利益冲突问题：默认展示哪些资产、交易怎样路由、排序器收入怎样处理、紧急升级由谁决定，都需要比普通 dApp 更高的透明度。

### 判断四：RWA 的最终约束来自链下权利

链上合约可以 24 小时转让，底层证券、发行人义务、一级铸造窗口、地区限制和法院执行仍在链下。Robinhood Chain 改善了可编程性和结算体验，没有消除发行人信用、法律文件和市场时段造成的约束。

## 十一、后续值得跟踪的指标

1. Stock Tokens 的活跃市值、持有人数、日均成交、买卖价差和抵押借贷占比；
2. RWA 活动占全网 TVL、DEX 成交和手续费的比例；
3. 剔除机器人、女巫和激励后的周活跃地址与 30 日留存；
4. 排序器可用率、强制纳入交易、BoLD 挑战和安全委员会操作记录；
5. 验证者是否从两家扩展，以及加入条件是否开放；
6. RHJ 的 Authorized Participant 数量、储备/对冲披露、赎回时间与异常事件；
7. Robinhood 财报是否单独披露 Chain、Wallet、Stock Tokens 的收入和成本；
8. 各司法辖区对 Stock Tokens、链上借贷和衍生品的新增限制。

## 十二、未能验证

- Robinhood 尚未按统一口径披露主网真实自然人用户、机器人比例和 Stock Tokens 用户留存；
- 公开文档未完整说明排序器故障时用户交易进入链的实际操作体验、最大延迟和历史演练；
- 暂未看到覆盖 Robinhood Chain 全部协议合约、升级权限和生产部署版本的单一公开审计索引；
- 安全委员会成员之间的法律协议、赔偿责任、离任与替换机制没有完整公开；
- RHJ 对每类 Stock Token 的底层对冲、资产保管、破产隔离和赎回瀑布需要逐份查阅基础招股书、补充文件与 Final Terms，不能从 ERC-20 合约推断；
- DefiLlama 的链收入属于第三方估算，尚不能与 Robinhood 会计报表中的收入科目一一对应。

## 十三、信息来源与说明

### 一手资料

- [Robinhood Chain 概览](https://docs.robinhood.com/chain/)：网络定位、Arbitrum Dedicated Blockchains、交易排序、EVM 与账户抽象。
- [连接 Robinhood Chain](https://docs.robinhood.com/chain/connecting/)：Chain ID、RPC、Ethereum blobs、ETH Gas 和基础设施提供商。
- [Robinhood Chain 治理](https://docs.robinhood.com/chain/governance/)：8 席安全委员会、签名门槛、时间锁、BoLD 和许可验证者。
- [运行全节点](https://docs.robinhood.com/chain/run-a-full-node/)：Nitro/ArbOS、硬件、L1 数据依赖、验证者 allowlist 与 1 WETH bond。
- [跨链桥文档](https://docs.robinhood.com/chain/bridging/)：Canonical Bridge、约 7 天挑战期和第三方快速桥。
- [Stock Tokens 文档](https://docs.robinhood.com/chain/stock-tokens/) 与 [Stock Token API](https://docs.robinhood.com/chain/stock-token-apis/)：发行结构、交易窗口、价格、公司行动和 multiplier。
- [Robinhood Chain 服务条款](https://docs.robinhood.com/chain/terms-of-service/)：排序器、公共 RPC、第三方合约、钱包和责任边界。
- [2025 年产品发布](https://robinhood.com/us/en/newsroom/robinhood-launches-stock-tokens-reveals-layer-2-blockchain-and-expands-crypto-suite-in-eu-and-us-with-perpetual-futures-and-staking/)：Classic Stock Tokens 与独立 L2 的起点。
- [2026 年主网发布](https://robinhood.com/us/en/newsroom/robinhood-accelerates-global-expansion-robinhood-chain-mainnet-stock-tokens-agentic-trading/)：主网上线、新 Stock Tokens、钱包和 DeFi 产品。
- [Robinhood 2026 年第二季度 10-Q](https://investors.robinhood.com/static-files/8b6703a6-90f8-4697-b225-caf577e5720a)：公司披露的网络、智能合约、非法活动与股票代币监管风险。
- [Arbitrum 的主网发布说明](https://blog.arbitrum.io/robinhood-chain-mainnet/)：从 Arbitrum One 到专用链的 launch-and-migrate 路径。

### 市场与外部资料

- [DefiLlama：Robinhood Chain](https://defillama.com/chain/Robinhood%20Chain)：TVL、稳定币、RWA、成交、费用和协议构成的实时数据。
- [CoinDesk：主网上线两周后的活动结构](https://www.coindesk.com/tech/2026/07/13/robinhood-built-a-blockchain-for-tokenized-stocks-memecoins-took-over)：早期 Meme 币、RWA 占比和链上活动观察。

市场数据为 2026 年 9 月 15 日页面快照，随资产价格、协议统计和链上活动持续变化。DefiLlama 与 CoinDesk 用于描述外部统计和市场结构；网络配置、治理、法律性质与公司风险优先采用 Robinhood 官方文档和监管披露。文中的竞争力、护城河与长期判断属于外部研判。

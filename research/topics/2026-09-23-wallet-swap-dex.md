---
title: 钱包里的 Swap 到底是不是 DEX：从报价、路由到链上结算
category: topics
topic_type: industry
subjects: [web3]
content_type: analysis
date: 2026-09-23
time: "17:34"
tags: [Web3 钱包, Swap, DEX, DEX 聚合器, MetaMask, Phantom, OKX Wallet, 链上交易]
summary: 钱包内置 Swap 把报价、路由、签名和链上结算收进一个界面；流动性通常仍来自 DEX、专业做市商或跨链桥，钱包则逐渐成为订单分发、交易聚合与收费入口。
tldr: 钱包可以同时经营 Swap 界面、聚合路由和收费服务，但这不等于它拥有底层流动性。判断一笔交易由谁完成，需要沿着 Provider、Spender、Router、Pool 或 Solver 逐层核对；判断报价是否划算，则要比较净到账、平台费、网络费、价格影响和执行风险。
assistance: codex
model: gpt-5
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> **风险与合规提示：** 链上兑换可能涉及代币合约、授权、流动性、滑点、MEV、跨链桥和司法辖区风险，低流动性代币可能无法按显示价格卖出。钱包或聚合器给出报价、收录代币或成功模拟交易，不代表相关资产经过投资审查。资料用于理解产品和交易机制，不构成投资、交易、开户或法律建议。

## 一、先给结论

钱包里的 Swap 是一个交易入口。它把找价格、选路线、授权、签名和查看结果压缩进几次点击，但一笔链上兑换仍由多个角色共同完成。

| 角色 | 通常负责什么 | 常见例子 |
|---|---|---|
| 钱包 | 管理账户和私钥、展示报价、让用户签名 | MetaMask、Phantom、OKX Wallet |
| 钱包内置 Swap | 请求报价、比较 Provider、组装交易、收取界面或服务费 | MetaMask Swaps、Phantom Swap、OKX Wallet Swap |
| DEX 聚合器 | 查询多个流动性来源，计算拆单和路由 | Jupiter、0x、1inch、OKX DEX Aggregator |
| DEX 协议 | 用智能合约和资金池完成资产交换 | Uniswap、Curve、Raydium、Orca、PancakeSwap |
| 专业做市商 / Solver | 提供链下报价或竞争执行用户意图，最后在链上结算 | 0x RFQ 做市商、OKX Intent Solver |
| 跨链桥 | 在两条网络之间锁定、销毁、释放或铸造资产 | LI.FI 接入的桥、Relay、deBridge、Garden |
| 区块链 | 排序、执行和记录交易，收取网络费 | Ethereum、Solana、Base、BNB Smart Chain |

由此可以得到四个结论：

1. **钱包能 Swap，不代表钱包自己提供流动性。** 很多钱包从第三方 DEX、聚合器和做市商取价，再把可执行交易交给用户签名。
2. **钱包已经可能超出单纯签名工具的范围。** 当钱包经营报价服务器、路由、Spender 或 Router 合约，并从 Swap 收费时，它同时是交易界面、订单分发层和商业平台。
3. **“走哪个 DEX”不是固定答案。** 路线会随网络、交易对、金额、Gas、流动性和当时价格变化，同一笔交易也可能拆到多个池子。
4. **“最优报价”有明确边界。** 它通常表示某个系统在已接入来源、指定参数和报价时点下算出的较优结果，不是对全市场、最终成交和未来价格的保证。

技术协议、产品界面、商业角色和监管身份是四套口径。把它们都叫作“DEX”，说话方便，分析时会丢掉最重要的责任边界。

## 二、先把六个概念分开

### 2.1 自托管钱包

自托管钱包保存或调用用户的签名凭证。它可以生成地址、展示余额、构造交易并请求用户签名。资产记录在区块链上，私钥控制权在用户手里。

钱包是否内置 Swap 属于产品选择。一个只支持收款、转账和签名的钱包仍然是钱包；一个集成 Swap、跨链桥、永续合约和法币出入金的钱包，也不会因此自动拥有这些市场的全部底层设施。

### 2.2 DEX 协议与流动性池

DEX 协议是一组链上交易规则和智能合约。以自动做市商为例，流动性提供者把两种或多种资产放进资金池，交易者与池子交换资产，价格沿着合约定义的曲线变化。Uniswap v2 白皮书把它描述为采用恒定乘积公式的链上自动流动性协议。

这层真正持有或调度可交易库存。交易量很小时，单个池子就能完成兑换；金额变大后，价格影响、手续费档位和池子深度会决定实际成交结果。

### 2.3 DEX 前端

前端是人看到的网页或 App。它读取池子数据、构造调用并帮助用户签名。前端可以由协议团队运营，也可以由第三方独立提供。

因此，访问某个品牌网站和调用该品牌协议不是同一件事。第三方钱包可以直接调用 Uniswap 合约，聚合器也可以把部分订单分给 Uniswap 池子，用户无需打开 Uniswap 官方网页。

### 2.4 DEX 聚合器

流动性分散在不同协议、池子和网络。聚合器查询多个来源，比较兑换率、Gas、手续费和可执行性，再返回一条或多条路线。[0x 的 API 文档](https://docs.0x.org/api-reference/api-overview)把自己的产品定义为流动性聚合、定价和链上交易的统一接口；其路由可以在不同来源之间拆单。

一笔 `USDC → 某代币` 可能出现这样的路线：

```text
USDC
 ├─ 60% → Uniswap V3 → WETH → 目标代币
 ├─ 25% → Curve → WETH → 目标代币
 └─ 15% → 专业做市商 RFQ → 目标代币
```

拆单增加了计算和合约调用复杂度，目标是提高净到账或成交成功率。金额较小、Gas 较高时，最短路线反而可能更划算。

### 2.5 Meta-aggregator

单个聚合器也有覆盖范围、路由算法和商业策略。钱包可以同时询价多个聚合器，再比较它们给出的完整路线。行业里常把这种模式称为“聚合器的聚合器”或 Meta-aggregator。

Syndica 在 2025 年 1 月的 Solana DApp 收入分析中，把同时比较 Jupiter 和 OKX 路线的 Phantom 描述为“aggregator of aggregators”。这个称呼很好地解释了钱包的新位置：它不必亲自接入每一个资金池，也能控制最终把订单交给谁。

### 2.6 RFQ、专业做市商与 Intent Solver

AMM 不是唯一的链上流动性来源。RFQ（Request for Quote，询价）会让专业做市商在链下给出带签名的报价，用户接受后再原子化地在链上结算。[0x 对 RFQ 的说明](https://help.0x.org/articles/3310442497-understanding-0x-rfq-request-for-quote)显示，它会让做市商报价与公开 AMM 路线竞争。

Intent 模式再往前一步：用户签署“我想得到什么结果”的意图，多个 Solver 竞争寻找执行方式。用户看到的是目标和约束，Solver 处理跨池、跨协议甚至跨链的执行细节。这里的成交仍可链上验证，但价格发现和路线计算有很大一部分发生在链下。

这也是“钱包 Swap 等于直接访问某个 DEX”越来越不准确的原因。用户点击一次 Swap，背后可能同时包含 API 报价、私有做市、链上池子、路由合约和交易保护服务。

## 三、一笔钱包 Swap 怎样完成

一笔同链 ERC-20 兑换的典型路径如下：

```text
用户输入卖出金额
      │
      ▼
钱包向一个或多个 Provider 请求报价
      │
      ├─ DEX 聚合器
      ├─ AMM / DEX
      └─ RFQ 做市商 / Intent Solver
      │
      ▼
比较预计到账、Gas、费用、价格影响和成功率
      │
      ▼
用户授权 Spender 使用指定代币
      │
      ▼
用户签署 Swap 交易
      │
      ▼
Router 按路线调用一个或多个池子 / 做市商结算合约
      │
      ▼
区块链执行；满足最低到账条件则完成，否则整笔回滚
```

### 3.1 报价不是成交回执

报价生成时会读取池子状态、Gas 价格和可用做市报价。用户检查、签名、广播、进入区块都需要时间，其间市场可能变化。钱包通常设置 `minimum received` 或类似参数；实际结果低于下限时，交易回滚，用户仍可能损失已经消耗的网络费。

“模拟成功”也只说明交易在模拟所使用的状态下可以执行。它无法保证代币价格不变、区块排序不变或项目本身安全。

### 3.2 Approve、Spender、Router、Pool 各做什么

ERC-20 代币通常要求用户先执行 `approve`，允许一个 Spender 在额度内转走代币。Spender 接收授权，Router 根据报价调用底层协议，Pool 或做市结算合约完成资产交换。

这几个地址可能相同，也可能分开。钱包为了减少重复授权和隔离底层协议风险，可能让用户统一授权给自有 Spender，再由包装合约与不同流动性来源交互。[MetaMask 对 Swaps 授权的说明](https://support.metamask.io/stay-safe/safety-in-web3/why-does-swaps-use-unlimited-token-approvals)就把其 Spender 描述为用户与底层协议之间的保护层。

授权不会因为用户断开钱包连接而自动消失。MetaMask 的[授权撤销指南](https://support.metamask.io/more-web3/learn/how-to-revoke-smart-contract-allowances-token-approvals)明确区分了 disconnect 与 revoke：前者停止前端连接，后者才会取消合约移动代币的额度。

### 3.3 一笔 Swap 的成本不止 Gas

| 成本 | 含义 | 常见去向 |
|---|---|---|
| 交易价格与池手续费 | 池子或做市商给出的兑换条件 | 流动性提供者、协议或做市商 |
| 价格影响 | 订单本身改变池内资产比例造成的价格变化 | 反映在成交价格里 |
| 滑点 | 报价到执行之间的价格变化 | 反映在最终到账或交易失败上 |
| 网络费 | 区块链执行交易的成本 | 验证者、排序器或网络费用机制 |
| 钱包 / 界面服务费 | 钱包提供报价、路由和交易体验收取的费用 | 钱包运营方及合作方 |
| 聚合器费 | 聚合、路由或 API 服务费 | 聚合器及集成方 |
| 跨链桥费 | 跨链消息、流动性或验证成本 | 桥、流动性网络、Relayer |
| MEV 损失 | 交易排序造成的额外不利成交 | 搜索者、构建者等交易排序参与者 |

不同产品把费用显示在不同位置。有的把网络费折进报价，有的把桥费合并到价格影响，有的按输出代币扣费。只比较屏幕上的汇率，容易漏掉真正影响净到账的项目。

### 3.4 跨链 Swap 多了一组失败面

跨链交易通常先在源链兑换为桥支持的资产，再由桥锁定或销毁，目标链释放或铸造资产，必要时再完成一次目标链兑换。Phantom 当前文档列出的桥 Provider 包括 LI.FI、Relay、deBridge 和 Garden，并说明报价引擎会比较速度、费用和流动性。

此时用户同时依赖源链 DEX、桥、跨链消息或验证网络、目标链 DEX。一次点击减少了操作步骤，没有减少协议层数。

## 四、三个钱包怎样做 Swap

### 4.1 MetaMask：钱包充当报价聚合入口

[MetaMask Swaps 用户指南](https://support.metamask.io/manage-crypto/move-crypto/swap/user-guide-swaps)对角色边界说得很直接：MetaMask 充当信息聚合器，汇总报价；它不提供流动性，也不亲自执行底层交易。其公开说明还写明，报价来源包含 DEX、DEX 聚合器和做市商。

截至 2026 年 9 月 23 日，该指南列出的费用结构包括报价、网络费和 **0.875% MetaMask fee**。用户可以查看多个报价，但入选范围取决于 MetaMask 已接入的 Provider、支持网络、风控过滤和当时的可用性。

MetaMask 同时经营自己的 Spender 与交易包装层。它能减少用户直接给多个底层协议授权的次数，也把合约安全和路由依赖集中到 MetaMask 这一层。官方称这种包装曾隔离部分底层流动性来源的安全事件；该说法属于产品方披露，不能替代对当前合约、升级权限和审计记录的检查。

MetaMask 的 Gas-included Swap 允许部分网络和资产把 Gas 包进报价。用户无需预先持有 ETH，不代表网络停止收费，费用改由卖出资产覆盖或由产品机制代付。

### 4.2 Phantom：钱包开始比较聚合器

Phantom 的[交易设置说明](https://help.phantom.com/articles/27085326202515)允许用户查看 Provider、市场、价格、滑点、优先费和 Tip。自动模式会选择它认为更有利的 Provider，用户也可以查看替代项。

2024 年 11 月，[OKX 宣布 Phantom 接入 OKX DEX API](https://www.okx.com/en-us/learn/okx-dex-api-phantom)，用于 Solana 钱包内兑换。Syndica 随后的链上分析显示，Phantom 同时从 Jupiter 与 OKX 取得路线，并把两者放在同一层比较。这正是 Meta-aggregator 的实际案例：

```text
Phantom
 ├─ Jupiter Aggregator ──→ Raydium / Orca / Meteora / 其他来源
 └─ OKX DEX Aggregator ─→ 多个 Solana 流动性来源
```

截至资料日，Phantom 帮助中心列出的常规钱包 Swap 费为多数交易 **0.85%**，具体适用范围以确认页为准；部分 Gasless 流程可能采用不同费率。跨链交易还可能包含桥费和两端网络费。

0.85% 看起来只是界面上的一个小数。交易频率和金额上升后，它会成为重要成本，也会成为钱包的主要收入。Syndica 统计 2025 年 1 月时，Phantom 占 Jupiter Swap API 合作方收入的大部分；1kx 的 2025 年链上收入报告则把钱包归为依靠 Swap 额外收费获得显著收入的应用层类别。这些历史数据不能直接代表 2026 年收入，却足以证明钱包内 Swap 已经形成独立商业模式。

### 4.3 OKX Wallet：自有聚合器、第三方路线与 Intent 并存

[OKX DEX API 文档](https://web3.okx.com/build/dev-docs/dex-api/dex-swap-api-introduction)把 OKX DEX 定义为多 DEX 聚合器。它会比较 DEX 与 PMM 报价，并通过智能拆单算法综合价格、滑点和交易成本。用户授权 OKX DEX Router 后，钱包广播聚合器返回的交易数据。

这套关系需要与 OKX 中心化交易所分开：

| 产品 | 资产控制与成交方式 |
|---|---|
| OKX 中心化交易所账户 | 平台托管账户资产，通过交易所内部账本和订单系统交易 |
| OKX Wallet | 用户控制链上账户并签名 |
| OKX DEX Aggregator | 汇总链上 DEX、PMM 和其他 Provider 的报价与路线 |
| OKX Intent | 用户签署交易意图，获准 Solver 竞争提供执行 |

OKX 在 2026 年 4 月发布的[聚合器与 Intent 利益冲突政策](https://web3.okx.com/help/dex-aggregator-and-intent-conflict-of-interest-policies)披露了一项关键事实：聚合算法声称按价格、深度、Gas、滑点和可靠性评估来源，不因关联关系优先路由；但界面可能把 OKX 自有聚合器路线设为默认或突出显示，即使它的预估到账并非所有可用 Provider 中最高。用户需要主动展开替代路线并比较净到账。

这项披露揭示了钱包交易入口的核心权力：路由算法决定哪些来源有资格竞争，界面默认值决定大多数用户首先看到什么。算法中立与界面中立是两个问题。

## 五、钱包为什么争着做 Swap

### 5.1 钱包掌握交易发起点

用户已经在钱包里查看余额。把 Swap 放在资产页上，交易无需再经历搜索 DApp、核对域名、连接钱包和切换页面。对普通用户而言，少几步往往比节省几个基点更有感知。

对钱包运营方而言，这个位置可以持续产生订单流。钱包知道用户选择的网络、资产和金额，能够把请求发送给合作聚合器，也能围绕交易增加服务费、推荐、返佣、Gas 代付和积分激励。

Dune 的 [Wallet Report v2](https://dune.com/blog/wallet-report-v2)专门把 embedded swap（嵌入式兑换）作为钱包分析对象，并通过已知 Router、费用接收地址和交易调用识别活动。报告同时提醒，钱包结构已经高度模块化：前端、账户、路由和基础设施可能来自不同团队，单靠一个品牌名无法还原全部交易链路。

### 5.2 流动性变成可采购的基础设施

0x、Jupiter、1inch、OKX DEX 等服务把大量 DEX 接入、路径搜索、Gas 估算和交易构造封装成 API。钱包可以采购这套能力，不必从头维护每个池子的适配器。

[0x 2026 年文档](https://docs.0x.org/docs/core-concepts/introduction-to-0x)把钱包、投资组合工具、社交应用和 AI Agent 都列为流动性的需求侧。它披露其 API 已被 MetaMask、Coinbase Wallet、Robinhood Wallet、Phantom 等产品使用。这个模式与支付聚合相似：用户看到一个入口，入口背后同时连接多个供应方。

### 5.3 收费权从协议层向界面层移动

底层 DEX 依靠池手续费或协议费盈利；钱包和交易终端可以在此之上再加一层服务费。1kx 的 2025 年收入研究认为，钱包在 2024 年第四季度以后从 Swap 获得了显著费用，Phantom、Coinbase Wallet 和 MetaMask 都属于这一类。

这不表示钱包收费一定不合理。钱包可能提供交易模拟、失败过滤、MEV 保护、Gas 抽象、客户支持和更短的操作路径。判断值不值，要比较服务创造的执行改善与增加的费用，不能只看有没有收费。

### 5.4 默认路线具有商业价值

大多数用户不会逐项打开 Provider。默认选择因此会影响订单分配、聚合器市场份额和合作收入。Phantom 接入 OKX 后，Syndica 观察到 OKX 在 Solana 聚合器成交中的规模明显上升；这说明钱包入口足以改变底层聚合器竞争。

当钱包、聚合器、链和交易所属于同一品牌生态，潜在利益冲突会随之放大。可核对的重点包括：是否展示第三方路线、排序依据是什么、比较的是毛报价还是扣除 Gas 后净到账、默认路线能否手动切换、关联来源是否获得特殊待遇。

## 六、钱包到底算不算 DEX

答案取决于使用哪套分类。

| 口径 | 怎样判断钱包 |
|---|---|
| 技术协议 | 普通钱包通常不等同于底层 AMM 或资金池；拥有自有 Router、Intent 或结算合约后，它可能参与更多执行环节 |
| 产品体验 | 用户可以在钱包里完成发现、报价、签名和交易，体验上已经像交易平台 |
| 商业模式 | 钱包掌握订单入口、Provider 选择和收费规则，属于交易价值链的重要一层 |
| 资产托管 | 自托管 Swap 通常由用户签名并在链上结算，与 CEX 账户内撮合存在明显差异 |
| 监管身份 | 要结合司法辖区、托管、控制程度、撮合方式、收费、前端运营和可用资产逐案判断 |

“钱包是 DEX”适合描述用户感受到的一站式交易功能。技术分析应继续区分钱包、聚合器、Router、Solver 和流动性协议，否则难以回答收费归谁、授权给谁、漏洞在哪一层、交易失败找谁处理。

## 七、便利背后的成本与风险

### 7.1 钱包报价可能更方便，也可能更贵

MetaMask 与 Phantom 公布的 Swap 服务费都接近交易金额的 0.9%。对于 100 美元交易，费用不到 1 美元；对于 10 万美元交易，同样费率已经接近 900 美元。大额交易是否仍值得走钱包入口，要看它带来的价格改善、MEV 保护和操作便利能否覆盖这笔费用。

正确比较方法是同时询价，并记录最终可得数量：

```text
净到账 = 毛报价
       - 钱包 / 界面费
       - 聚合器或 Provider 费
       - 网络费折算
       - 桥费
       - 可预见的价格影响
```

不同界面可能在同一时刻采用不同滑点、Gas 估计和报价有效期。比较时要统一卖出金额、网络、代币合约、滑点和时间，否则结果没有可比性。

### 7.2 “最优”只覆盖已接入来源

聚合器无法访问未接入的池子、私有订单流或暂时不可用的 Provider。合规过滤、代币黑名单、API 故障、最低交易金额和地区限制也会缩小搜索空间。

即使两个聚合器都接入 Uniswap，它们对拆单、Gas、失败概率和报价过期的处理也可能不同。最优路线是一项持续计算，不是平台可以永久授予的标签。

### 7.3 低流动性 Meme 币把误差放大

新 Meme 币的池子可能只有很少资金。买入本身就会推高价格，卖出时又会压低价格；创建者撤走流动性后，界面仍可能显示历史价格，实际无法成交。代币还可能带有买卖税、冻结、黑名单或限制卖出的逻辑。

钱包能够生成报价，只说明当时存在一条可尝试的交易路径。它不证明合约安全、持仓分散或未来仍有退出流动性。

### 7.4 授权把风险留在交易之后

无限授权可以省去重复 approve 的 Gas 和步骤，也会扩大 Spender 合约失陷后的风险面。交易结束后，余额已经换成另一种代币，旧授权仍可能有效。

用户应定期用钱包或区块浏览器的 approval checker 检查授权对象。对不再使用、来源不明或权限过大的 Spender，提交链上撤销交易。撤销需要支付网络费，但断开网站连接不能替代它。

### 7.5 公开交易可能被 MEV 利用

[Ethereum.org 的 MEV 说明](https://ethereum.org/developers/docs/mev)把 sandwich trading 列为常见形式：搜索者观察公开内存池中的大额 DEX 交易，先买入推高价格，等用户成交后再卖出。受影响用户会承受更高滑点和更差成交。

私有交易通道、RFQ、合理滑点和防夹路由可以减少部分风险。保护范围要具体核对。[0x FAQ](https://docs.0x.org/docs/introduction/faq)说明其 MEV 保护适用于私有且原子成交的 RFQ 订单，不自动覆盖经公开内存池执行的全部 AMM 交易。

### 7.6 跨链的一键体验会隐藏更多协议

跨链 Swap 可能先换币、再过桥、再换币。任一环节暂停、流动性不足或消息延迟，都可能让交易停留在中间状态。主界面显示一个总进度条，资金实际已经经过多个独立系统。

大额跨链前应查看桥 Provider、预计时间、退款条件和目标链 Gas 安排。Refuel 或 Gasless 功能解决的是用户体验，相关费用和智能合约依赖仍然存在。

## 八、怎样核对一笔钱包 Swap

### 8.1 签名前

1. **核对链与合约地址。** 同名和同图标不能证明是同一资产。
2. **展开 Provider 与 Route。** 查看钱包选中了哪个聚合器、经过哪些中间币和池子。
3. **比较净到账。** 同时在钱包、一个独立聚合器和主要 DEX 前端询价。
4. **分开看费用。** 平台费、网络费、价格影响、桥费和代币税分别是多少。
5. **检查最低到账与滑点。** 低流动性代币不要用过宽滑点换取“更容易成功”。
6. **确认授权对象与额度。** Spender 地址应能在产品官方文档或区块浏览器标签中对应上。
7. **检查池深与持仓。** Meme 币额外查看流动性、前十大地址、创建者行为和是否能正常卖出。

### 8.2 交易后

在区块浏览器打开交易哈希，可以沿着三层读取：

| 层级 | 应查看什么 | 能回答什么 |
|---|---|---|
| 顶层交易 | `To` 地址、方法、状态、Gas | 用户把交易交给了哪个 Router，是否成功 |
| Token Transfers | 卖出、输出、中间币和费用转账 | 钱从哪里到哪里，费用以什么资产扣除 |
| Internal Calls / Instructions | Router 调用了哪些池子、桥或结算合约 | 实际路线和流动性来源 |

EVM 链重点看 `approve`、`transferFrom`、Router 和事件日志；Solana 重点看交易 Instructions、Program IDs、Token Balance Changes 和账户列表。聚合路线复杂时，同一交易里会出现多个 Program 或 Pool。

交易成功后再检查实际到账与报价差异。若以后不再使用相关 Spender，撤销剩余额度。跨链交易还应保存源链哈希、桥订单 ID 和目标链哈希，单看钱包首页可能漏掉中间状态。

## 九、行业会怎样继续演变

钱包正在成为链上交易控制台。账户抽象、Gas 代付、跨链聚合和 Intent 会继续减少用户看到的步骤，底层供应链反而会更长。

未来竞争可能集中在四个方向：

1. **执行质量。** 在净到账、成功率、延迟和 MEV 保护之间取得更好平衡。
2. **透明度。** 清楚展示 Provider、路线、费用、默认项和利益冲突。
3. **资产覆盖与风控。** 支持新资产的速度与拦截恶意代币之间需要取舍。
4. **订单流所有权。** 钱包、聚合器、交易所和 Solver 都希望掌握用户发起交易的第一入口。

钱包、聚合器和 DEX 的产品边界会继续靠近。流动性归属、授权对象和收费去向仍可通过合约与交易记录拆开。用户真正需要比较的是净到账、执行风险和退出能力，不能只看界面是否方便，也不能只看一个“最优”标签。

## 十、信息来源与持续验证

主要资料截至 **2026 年 9 月 23 日**：

- [MetaMask：User guide — Swaps](https://support.metamask.io/manage-crypto/move-crypto/swap/user-guide-swaps)，钱包作为报价聚合入口、支持网络及费用说明
- [MetaMask：Why does Swaps use unlimited token approvals?](https://support.metamask.io/stay-safe/safety-in-web3/why-does-swaps-use-unlimited-token-approvals)，Spender 与底层流动性来源之间的关系
- [MetaMask：How to revoke smart contract allowances](https://support.metamask.io/more-web3/learn/how-to-revoke-smart-contract-allowances-token-approvals)，授权与断开连接的区别
- [Phantom：Adjust swap settings](https://help.phantom.com/articles/27085326202515)，Provider、路线、滑点和费用展示
- [Phantom：Swap crypto in Phantom](https://help.phantom.com/articles/5985106844435)，Swap 费、网络费和价格影响
- [Phantom：Understanding cross-chain swaps](https://help.phantom.com/articles/51384804802195)，跨链 Provider 与执行步骤
- [OKX：DEX Swap API Introduction](https://web3.okx.com/build/dev-docs/dex-api/dex-swap-api-introduction)，DEX、PMM、智能拆单和 Router 流程
- [OKX：DEX Aggregator and Intent Conflict of Interest Policy](https://web3.okx.com/help/dex-aggregator-and-intent-conflict-of-interest-policies)，默认路线、第三方 Provider 与利益冲突披露，2026-04-30
- [0x：API Overview](https://docs.0x.org/api-reference/api-overview)与[核心概念](https://docs.0x.org/docs/core-concepts/introduction-to-0x)，聚合路由、RFQ 与钱包集成
- [Dune：Wallet Report v2](https://dune.com/blog/wallet-report-v2)，钱包模块化与 embedded swap 统计方法，2025-06-10
- [Syndica：Solana DApps Revenue — January 2025](https://blog.syndica.io/deep-dive-solana-dapps-revenue-january-2025/)，Phantom、Jupiter 与 OKX 的链上路线及收入分析
- [1kx：Onchain Revenue Report 2025](https://1kx.capital/writing/2025-onchain-revenue-report)，钱包与交易界面的 Swap 收费结构
- [Ethereum.org：Maximal extractable value](https://ethereum.org/developers/docs/mev)，DEX 交易中的 sandwich trading 与 MEV
- [Uniswap v2 Whitepaper](https://docs.uniswap.org/whitepaper.pdf)，自动做市协议与恒定乘积池的基础机制

会改变部分判断、需要继续核对的事项：

- MetaMask、Phantom 与 OKX Wallet 的 Provider、费用和 Gasless 规则会随版本和地区调整；
- 钱包通常不完整公开路由算法，官方“最优”表述需要用同一时点的实际报价和链上成交复核；
- Intent Solver、私有订单流和界面默认项的透明度仍在变化；
- 不同司法辖区对自托管钱包、前端、聚合器和交易服务的分类可能调整，具体合规结论应以当地最新规则和专业意见为准。

---
title: 怎么判断一枚币在哪条链上
category: topics
topic_type: tech
content_type: guide
subjects: [web_cloud]
entity_type: technology
auto_images: false
date: 2026-09-18
time: "14:50"
tags: [公链, Chain ID, EIP-155, ERC-20, EIP-20, Ethereum, Solana, SPL Token, USDT, USDC]
summary: 钱包里的 1、56、8453，一串 0x 地址，以及 USDT、ETH、SOL 这些名字，分别指向账本、合约和原生币。先认链，再认币。
tldr: EVM 链用 Chain ID 区分账本，用 ERC-20 合约地址认同质代币；Solana 用 Mint 地址，没有这套 Chain ID。同名可以各链各一份。部署过的合约远多于有持有人和成交的头部。
assistance: cursor
model: grok-4.6
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> **风险与合规提示：** 资料用于识别账本、交易签名和代币标准，不构成投资、开户、发币、上架或法律建议。迷因币和平台币价格可以在短时间内归零；私钥丢失、钓鱼授权、合约漏洞、桥和排序器故障都可能导致全部本金损失。中国人民银行等八部门《银发〔2026〕42 号》把境内代币发行融资等虚拟货币相关业务列为非法金融活动；境外单位和个人不得以任何形式非法向境内主体提供交易、兑换、中介、定价等服务。违背公序良俗的相关民事法律行为无效，损失自行承担。

## 一、先给结论

**先认这条账本，再认这枚币。** 名字可以重复，Chain ID、合约地址和 Mint 不能混用。

1. **钱包要你选的网络编号，是 EVM 的 Chain ID。** Ethereum 主网是 `1`，BNB Smart Chain 是 `56`，Base 是 `8453`。Solana 没有这套编号。
2. **传统交易把 Chain ID 编进签名字段 `v`。** 主网签出来是 `37` 或 `38`，拿到 BSC 上广播会被拒。规则写在 [EIP-155](https://eips.ethereum.org/EIPS/eip-155)。
3. **`0x` 开头的代币合约走 [EIP-20 / ERC-20](https://eips.ethereum.org/EIPS/eip-20)。** 它规定 `transfer`、`approve`、`balanceOf` 这些接口。ETH 本身不是 ERC-20；进 DEX 池通常要先换成 WETH。
4. **看见一长串 Base58，按 Solana 处理。** 代币识别靠 Token Program 的 [Mint](https://solana.com/docs/tokens)，持有还要有 Associated Token Account。
5. **同名各链各一份。** 以太坊上的 USDT 合约和 Solana 上的 USDT Mint 不能当同一枚余额花。Etherscan 能扫到约 229 万份 ERC-20 合约，有信誉标记的只有约 3700 份。

分层、L1/L2、EVM/SVM 的关系见[一枚币到底运行在哪里](/articles/research/topics/public-chain-l1-l2-evm-svm)。核对编号、地址或名字时，先分清认的是哪一项。

## 二、事实层

### 1. 你看见的东西各自管什么

| 你看见什么 | 它在回答 | 规范或登记处 |
|---|---|---|
| `1` / `56` / `8453` | 这笔交易属于哪条 EVM 账本 | [EIP-155](https://eips.ethereum.org/EIPS/eip-155)；社区名册 [ethereum-lists/chains](https://github.com/ethereum-lists/chains) |
| 签名里的 `v = 37` | 传统交易已经绑死 Chain ID `1` | EIP-155：`v = 奇偶位 + chainId × 2 + 35` |
| `0xdAC17F95…1ec7` | 以太坊主网上那份 USDT 合约 | [EIP-20](https://eips.ethereum.org/EIPS/eip-20) |
| Base58 长地址 | Solana 账户或 Mint | [SPL Token](https://solana.com/docs/tokens) |
| 名字「USDT」「ETH」「SOL」 | 口语标签，不能单独当账本 | 必须补链和地址 |

以太坊外部账户地址取公钥 Keccak-256 哈希的后 20 字节，加 `0x` 前缀，共 42 个字符。[账户页](https://ethereum.org/developers/docs/accounts/) 写明合约地址也是同一形态。同一把私钥在 Ethereum、BSC、Base 上会算出**同一个地址字符串**，余额记在各自账本里。转错链、看错浏览器，资产不会自动出现在另一条链上。

### 2. 头部主网 Chain ID

| 网络 | 层级 | Chain ID | 十六进制 | Gas |
|---|---|---:|---|---|
| Ethereum | L1 | 1 | `0x1` | ETH |
| OP Mainnet | 以太坊 L2 | 10 | `0xa` | ETH |
| BNB Smart Chain | L1 | 56 | `0x38` | BNB |
| Polygon PoS | 侧链 | 137 | `0x89` | POL |
| X Layer | 以太坊 L2 | 196 | `0xc4` | OKB |
| opBNB | BSC 上的 L2 | 204 | `0xcc` | BNB |
| zkSync Era | 以太坊 L2 | 324 | `0x144` | ETH |
| Base | 以太坊 L2 | 8453 | `0x2105` | ETH |
| Avalanche C-Chain | L1 | 43114 | `0xa86a` | AVAX |
| Arbitrum One | 以太坊 L2 | 42161 | `0xa4b1` | ETH |
| Linea | 以太坊 L2 | 59144 | `0xe708` | ETH |
| Solana | 独立 L1 | 无 | — | SOL |

Circle 的 Arc 在开发者接入口径里用主网 `5042`；2026-09-16 新闻稿确认主网上线，当时公开连接页仍以测试网 `5042002` 为主，列入未能验证。

Chain ID **没有发号机构**。2016-10-14 的 EIP-155 把以太坊主网写成 `1`，并要求其它链换一个不重复的整数。各链自己把数字写进创世配置，节点对 `eth_chainId` 返回什么，这个数字就生效。钱包用的公开名册是社区仓库 [ethereum-lists/chains](https://github.com/ethereum-lists/chains)：先合并的 PR 占用该号，后到的会被拒。[ChainList](https://chainlist.org/) 和 [chainid.network](https://chainid.network/chains.json) 是二次收录。链上没有一份全球 Chain ID 登记表；[ERC-7785](https://eips.ethereum.org/EIPS/eip-7785) 提议搬到 ENS，仍是提案。

### 3. `v` 里怎么带上 Chain ID

EIP-155 规定，传统（type 0）交易签名：

\[
v = y\text{ 的奇偶} + \text{chainId} \times 2 + 35
\]

奇偶位只能是 `0` 或 `1`。以太坊主网 `chainId = 1`，所以 `v` 只可能是 `37` 或 `38`。没带 Chain ID 的老签名是 `27` 或 `28`。

提案里的示例交易：`nonce = 9`，`gasPrice = 20 gwei`，`gasLimit = 21000`，收款地址 `0x3535…3535`，金额 1 ETH，空 data。写入签名哈希的 chainId 是 `1`，结果 `v = 37`。

从 `v` 反推：`chainId = ⌊(v − 35) / 2⌋`。

| 看见的 v | 算出的 Chain ID | 哪条链 |
|---:|---:|---|
| 27 或 28 | 无 | 分叉前的老签名，可被重放 |
| 37 或 38 | 1 | Ethereum 主网 |
| 147 或 148 | 56 | BNB Smart Chain |
| 427 或 428 | 196 | X Layer |
| 16941 或 16942 | 8453 | Base |

这只适用于传统 type 0 交易。现在以太坊上更常见的 EIP-1559（type 2）把 `chainId` 单独放进交易体，恢复位改叫 `yParity`，只剩 `0` 或 `1`。区块浏览器上很多主网转账看起来 `v` 很小，原因在这里。

### 4. EIP-155 管链，EIP-20 管代币接口

| | EIP-155 | EIP-20 / ERC-20 |
|---|---|---|
| 标题 | Simple replay attack protection | Token Standard |
| 作者 / 日期 | Vitalik Buterin，2016-10-14 | Fabian Vogelsteller、Vitalik Buterin，2015-11-19 |
| 改哪一层 | 协议层：交易怎么签名 | 合约层：代币接口怎么写 |
| 要不要硬分叉 | 要。Spurious Dragon，块高 2,675,000 | 不要。谁部署符合接口的合约，谁就是 ERC-20 |
| 保证什么 | 签过的交易只能在对应 Chain ID 的账本上被接受 | 钱包和 DEX 能调用同一套方法 |

ERC-20 必填方法包括 `totalSupply`、`balanceOf`、`transfer`、`transferFrom`、`approve`、`allowance`，以及事件 `Transfer`、`Approval`。`name`、`symbol`、`decimals` 在原文里是可选的。规范保证接口能被调用，不保证这枚币有价值、发行方是谁、有没有增发后门。

BSC 上的 [BEP-20](https://github.com/bnb-chain/BEPs/blob/master/BEPs/BEP20.md) 从 ERC-20 导出，并补了跨 Beacon Chain 的字段。对用户来说，MetaMask 加上 Chain ID `56` 之后，操作手感和以太坊接近。

Solana 官方的 EVM→SVM 对照页写：以太坊用合约地址标识一枚代币；Solana 用 Mint 地址。创建 SPL 代币是对已部署的 Token Program 创建 Mint，不必再编译一份 Solidity。

### 5. 以太坊上有多少份代币合约，头部是哪些

2026-09-18，[Etherscan Token Tracker](https://etherscan.io/tokens) 写明：以太坊主网共 **2,294,842** 份 ERC-20 合约，展示 **3,716** 份信誉为 OK 或 Neutral 的条目。原生币只有 ETH。CoinGecko 的 Ethereum 数据接口另写过覆盖 40 万+ DEX 新币，那是行情索引，仍小于链上合约总数。

按**链上市值**和**持有地址**看，当天头部大致是：

| 合约 | 它是什么 | 链上市值 | 持有地址 | 主网合约 |
|---|---|---:|---:|---|
| USDT | 美元稳定币 | $882 亿 | 1571 万 | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |
| USDC | 美元稳定币 | $502 亿 | 889 万 | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| stETH | Lido 质押 ETH | $241 亿 | 63 万 | `0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84` |
| wstETH | 包装后的 stETH | $115 亿 | 3.9 万 | `0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0` |
| WBTC | 包装比特币 | $90 亿 | 19 万 | `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599` |
| WETH | 包装 ETH | $53 亿 | 332 万 | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |
| SHIB | 迷因 | $53 亿 | 169 万 | `0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE` |
| DAI | 链上美元稳定币 | $46 亿 | 70 万 | `0x6B175474E89094C44Da98b954EedeAC495271d0F` |
| LINK | Chainlink | 全供给计价很高 | 91 万 | `0x514910771AF9Ca656af840dff83E8264EcF986CA` |
| UNI | Uniswap 治理币 | 全供给计价很高 | 38 万 | `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984` |

持有人最多的前几名是 USDT、USDC、WETH、SHIB、LINK、DAI、stETH。Etherscan 默认的「流通市值」会把 BNB、NEAR、DOT、WZEC 的全球盘子算进来；那些映射合约在以太坊上往往只有很小一截。例如当天 BNB 这份 ERC-20 的链上市值约 $3 亿，全球流通市值约 $1000 亿。DOT 那份甚至只有 3 个持有人。

### 6. 以太坊和 Solana 当天差在哪

[DefiLlama](https://defillama.com/chains) 2026-09-18 主网快照：

| | Ethereum 主网 | Solana |
|---|---:|---:|
| DeFi TVL | $503 亿 | $59 亿 |
| 稳定币存量 | $1470 亿 | $154 亿 |
| 24h DEX 现货 | $15 亿 | $24 亿 |
| 24h 永续 | $4.7 亿 | $17 亿 |
| 24h 活跃地址 | 60 万 | 304 万 |
| 24h 交易笔数 | 196 万 | 1.14 亿 |
| RWA 在管 | $135 亿 | $16 亿 |
| 应用层 24h 收入 | $260 万 | $562 万 |
| 链手续费 24h | $35 万 | $81 万 |

以太坊主网头部协议是 Lido、Aave、各类质押 / 再质押、Ethena、Morpho、Uniswap。Solana 头部是 Jupiter、Raydium / Meteora、Kamino、Jito / Sanctum、Drift、Pump。同一天 Base 一条 L2 的 DeFi TVL 约 $56 亿，和整条 Solana 主网同一量级。

Solana 日交易含验证者投票。即便只数用户交易，[Solana Compass](https://solanacompass.com/news/solana-july-2026-monthly-transaction-record-42b-non-vote-txns-up-91-since-december) 记 2026 年 7 月非投票交易日均约 1.33 亿笔。2026 年 8 月生态应用收入里，公开报道称 Pump.fun 约占四成；发射台上单日可以造出大量 SPL Mint，绝大多数没有流动性。

## 三、结构分析

核对顺序可以收成一棵树：

```text
看见名字（USDT / ETH / SOL）
  → 先问：哪条账本？哪个地址或 Mint？
看见 0x + 40 位十六进制
  → EVM 家族
  → 再用 Chain ID 或浏览器网络区分 ETH / BSC / Base / X Layer
  → 代币再对合约地址
看见 Base58 长串
  → Solana
  → 代币对 Mint，余额在 Associated Token Account
看见 1 / 56 / 8453
  → 这是网络编号，还不是代币
看见 v = 37
  → 传统交易签给了 Ethereum 主网
```

三层不要并成一层：

```text
EIP-155  → 这笔交易属于哪条账本
EIP-20   → 这条账本上那份合约是不是标准同质代币
市场     → 有没有持有人、流动性和成交
```

创建 Token 是一次部署或一次 Mint。Etherscan 的 229 万份合约、Solana 发射台上一天几十万个 Mint，数的都是第一层。头部那几千份 ERC-20，数的是第三层。

比「ETH 生态对 SOL 生态」时，先说清范围。以太坊把执行放到 L2，Base、Arbitrum、OP 都还是 EVM，地址形态相同，Chain ID 不同。Solana 把吞吐做在本层，工具链和账户模型单独一套。把 Base 的 TVL 加进「以太坊生态」、却拿 Solana 单条 L1 来比，结论会被放大。

钱包验签时拆开 `v`（或读 type 2 交易体里的 `chainId`），对不上节点返回的 `eth_chainId`，交易直接作废。这就是「同一笔以太坊签名拿到 BSC 上广播会失败」的机械原因。

## 四、外部研判

观察，不是已证实的内部决策备忘。

1. **零售入口会继续同时展示名字和网络，很少默认展示 Chain ID。** 用户先看见 USDT，后看见「Ethereum」或「Solana」标签。钓鱼盘和同名迷因吃的就是这层空白。区块浏览器和钱包若把合约地址、Chain ID 放进第一屏，识别成本会下降。
2. **流通市值排行不适合当「这条链上头部代币」的名单。** 包装资产、跨链映射、全供给计价，都会把别条链的盘子算进以太坊。链上市值和持有人数更接近「谁真正住在这条账本上」。
3. **对大陆读者：** 用 Chain ID、`eth_chainId`、合约地址和 Mint 读公开文档、[ChainList](https://chainlist.org/) 和区块浏览器，**跟进**。用这些知识去发币、做市、兑换、充值到境外交易所，**不跟进**。对某一枚迷因的价格和「项目发展」，**观望**，只保留「它是哪条链上的哪一份合约或 Mint」这一句事实。

## 五、未能验证

- Arc 主网 Chain ID `5042` 来自开发者接入材料和索引器；Circle 新闻稿确认 2026-09-16 上线，当时 `docs.arc.io` 连接页仍以测试网 `5042002` 为主。
- Solana 上 SPL Mint 的全量个数没有一份与 Etherscan Token Tracker 对等的、可逐日引用的官方普查。发射台单日创建量波动很大。
- Pump.fun 占 2026 年 8 月 Solana 应用收入约四成，来自二次报道，未核对平台自己的逐笔结算表。
- Etherscan「信誉 OK / Neutral」的筛选规则、蓝标标准，未在本次逐条对照其知识库全文。
- DefiLlama 的 TVL、DEX 量、活跃地址是瞬时快照，随价格和成交变化；文中数字只对 2026-09-18 抓取有效。
- 各链实时费用、TPS、验证者集中度会变，不在这里引用瞬时行情当结论。

## 六、信息来源与说明

- EIP：[EIP-155](https://eips.ethereum.org/EIPS/eip-155)、[EIP-20](https://eips.ethereum.org/EIPS/eip-20)、[ERC-7785](https://eips.ethereum.org/EIPS/eip-7785)
- 账户与代币：[ethereum.org 账户](https://ethereum.org/developers/docs/accounts/)、[Solana Tokens](https://solana.com/docs/tokens)、[EVM→SVM 对照](https://solana.com/developers/evm-to-svm/erc20)、[BEP-20](https://github.com/bnb-chain/BEPs/blob/master/BEPs/BEP20.md)
- 登记处：[ethereum-lists/chains](https://github.com/ethereum-lists/chains)、[ChainList](https://chainlist.org/)、[chainid.network](https://chainid.network/chains.json)
- 链上规模：[Etherscan ERC-20](https://etherscan.io/tokens)、[DefiLlama 链排名](https://defillama.com/chains)、[Ethereum](https://defillama.com/chain/ethereum)、[Solana](https://defillama.com/chain/solana)
- 合约地址核对：Lido [部署页](https://docs.lido.fi/deployed-contracts/)（stETH / wstETH）；USDT、USDC、WETH、WBTC、DAI、LINK、UNI、SHIB 为业内长期使用的主网地址，与 Etherscan 当日排行对应
- 非投票交易：[Solana Compass，2026 年 7 月](https://solanacompass.com/news/solana-july-2026-monthly-transaction-record-42b-non-vote-txns-up-91-since-december)
- 站内交叉：[分层与虚拟机](/articles/research/topics/public-chain-l1-l2-evm-svm)、[Ethereum](/articles/research/topics/crypto-ethereum)、[Solana](/articles/research/topics/crypto-solana)、[USDC](/articles/research/topics/crypto-usd-coin)、[Pump.fun](/articles/research/topics/pump-fun)、[如何上链发币](/articles/research/topics/how-to-launch-token-onchain)
- 未公开：各钱包内置网络名单的审核标准、Etherscan 信誉算法细节、Pump.fun 内部收入分账
- 推断：零售入口较少默认展示 Chain ID；流通市值排行会放大跨链映射
- 资料截至 2026-09-18

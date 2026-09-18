---
title: OKX Web3 钱包观察：多链自托管入口绑在交易所流量上
category: topics
topic_type: product
subjects: [web3]
entity_type: product
content_type: analysis
date: 2026-09-16
time: "10:25"
tags: [OKX, Web3钱包, 自托管, DEX聚合器, MPC, 加密资产]
summary: OKX Web3 钱包是欧易集团推出的自托管多链钱包，和交易所账户分属两套资金控制权；可核验的长板是 DEX 聚合成交，用户量、链上托管规模和无钥钱包现状要把官方宣传与帮助中心口径分开读。
tldr: 它把多链资产、内置 DEX、DApp 连接和行情工具收进同一个自托管入口。新用户默认走助记词；无钥/MPC 已停新建。DefiLlama 显示 OKX DEX 仍是头部多链聚合器。大陆读者应按 42 号文把兑换、中介类功能当成禁止项，而不是比较哪家钱包更好用。
assistance: cursor
model: grok-4.6
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> **风险与合规提示：** 加密资产价格波动大，私钥或助记词丢失、钓鱼授权、恶意合约、跨链桥故障和设备木马都可能导致全部本金损失。资料整理不构成投资、开户、下载或法律建议。中国大陆现行规则把虚拟货币相关业务活动定性为非法金融活动；境外单位和个人不得以任何形式非法向境内主体提供虚拟货币相关交易、兑换、中介、定价等服务。违背公序良俗的相关民事法律行为无效，损失自行承担。

## 一、先给结论

OKX Web3 钱包（产品名现多用 **OKX Wallet**，官网 [web3.okx.com](https://web3.okx.com)）是欧易集团做的**自托管热钱包**：私钥在用户设备上生成和签名，交易所账户里的托管资金不会自动变成钱包余额。它的产品形状接近「交易所流量入口 + 多链 DEX 终端」，和 MetaMask 那种相对克制的浏览器插件、Phantom 那种链生态钱包走的是不同路线。

| 问题 | 结论 |
|---|---|
| 它卖什么 | 自托管软件入口：多链资产管理、内置 DEX/跨链、DApp 连接、NFT、链上行情与跟单 |
| 钱在谁手里 | 助记词模式下，签名密钥在用户设备；欧易交易所的 Proof of Reserves 不覆盖这些地址 |
| 和欧易 App 的关系 | 2022 年前后先作为主 App 内的 Web3 模式；2025 年 4 月拆出独立 Wallet App，主 App 内钱包功能计划逐步下线 |
| 当前默认密钥模型 | 新建走助记词 / 私钥；无钥（MPC）钱包 2025 年 5 月 23 日起停新建 |
| 可核验的规模 | DefiLlama 2026-09-16：OKX DEX 24 小时聚合成交约 1.97 亿美元，30 天约 72.6 亿美元，覆盖 35 条链，排在聚合器前列 |
| 宣传数字怎么读 | 「每日新增 50 万钱包、日交易 10 亿美元、自托管 445 亿美元、130+/140+ 条链」来自官方营销，缺少与帮助中心、开发者 API 一致的审计口径 |
| 对大陆读者 | 观望使用其 DEX、跨链兑换和任何面向境内的虚拟货币服务；产品观察可以继续跟踪 |

我对它的判断：**偏正面看产品完成度，置信度中等；对大陆居民的使用建议是不跟进。** 多链覆盖和 DEX 路由是真的；把官方用户量和自托管规模当成已审计事实，目前做不到。

## 二、事实层

### 2.1 先把两套账户拆开

欧易同时提供两类入口，界面可以做「从交易所快捷提币」，控制权并不相同。

| | 欧易交易所账户 | OKX Web3 钱包 |
|---|---|---|
| 资金控制 | 平台托管，提现需过平台风控 | 自托管，签名在本地完成 |
| 身份要求 | KYC、居住地限制 | 标准助记词钱包通常不要求身份核验 |
| 法律文本 | OKX Exchange 服务条款 | Web3 Ecosystem Terms of Service；帮助中心写明「OKX Web3 Wallet and its ancillary services are not offered by OKX Exchange」 |
| 资产证明 | 定期发布 zk-STARK Proof of Reserves | 没有对等的全用户自托管资产审计 |
| 失败模式 | 平台停提、被盗、监管关停、破产 | 助记词泄露、钓鱼签名、设备被控、桥和合约风险 |

帮助中心把钱包定义为 non-custodial、decentralized multi-chain wallet：一套助记词生成链上身份，可在 iOS、Android 和浏览器插件上管理多网络资产，并支持多助记词导入和地址派生。[How do I manage my wallet?](https://www.okx.com/help/how-do-i-manage-my-wallet-web)

官网 FAQ 同步写明：可以用私钥把资产恢复到任何兼容钱包；欧易拿不到用户链上资产。这只约束密钥保管方式，不约束内置 DEX、跨链桥、跟单和第三方 DApp 的合约风险。

### 2.2 公司归属与监管记录

公开资料把运营主体写成塞舌尔 **Aux Cayes FinTech Co. Ltd.**，对外品牌 2017 年起用 OKEx，约 2022 年 1 月改为 OKX。创始人兼 CEO 是徐明星（Star Xu）。公司未上市，完整股权结构和最终控制人未公开披露。Chrome 插件开发者邮箱仍是 `okexwallet@okx.com`，保留旧品牌痕迹。

2025 年 2 月 24 日，Aux Cayes FinTech 在纽约南区就「经营未注册货币转账业务」一项罪名认罪，同意支付约 5.05 亿美元罚款与没收。起诉书称，2018 年至 2024 年初，OKX 在未向 FinCEN 注册 MSB 的情况下服务美国客户，相关交易超过 1 万亿美元。徐明星本人未被该项指控列为被告人。[Reuters 报道](https://www.reuters.com/legal/operator-okx-crypto-exchange-enters-guilty-plea-pay-more-than-504-million-us-2025-02-24/)与[纽约南区起诉书](https://www.justice.gov/usao-sdny/media/1390641/dl?inline=)是一手来源。

香港方面，OKX Hong Kong FinTech Company Limited 于 2023 年 11 月 16 日向证监会提交虚拟资产交易平台牌照申请，2024 年 5 月 24 日撤回；之后按本地规则停止向香港居民提供中心化交易服务。钱包软件与持牌 VATP 不是同一许可。证监会名单见 [Lists of virtual asset trading platforms](https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators/Lists-of-virtual-asset-trading-platforms)。

2025 年 4 月独立 App 公告还写过：EEA 地区 Web3 服务暂时不可用，部分地区 Apple App Store 没有 Wallet App。地域开关会变，下载前要以当时商店和官网为准。

交易所储备金和钱包自托管是两套数。OKX 第 45 次 PoR 写的是约 231.2 亿美元主要资产（2026 年 7 月）；媒体转述第 46 次约为 229.6 亿美元（2026 年 8 月末）。这些数字证明的是**交易所托管储备**，不能用来核对钱包里用户自己控制的地址。中心化交易所成交量、储备金和各国入口，见站内[加密货币交易所观察](/articles/research/topics/cryptocurrency-exchanges)。

### 2.3 产品形态与时间线

| 时间 | 事件 | 能确认的范围 |
|---|---|---|
| 2021 DeFi Summer | Web3 产品负责人 Aaron 称内部产品从 DeFi Hub / DeFi Max 演进到 OKX Wallet | 访谈转述，适合做起源线索 |
| 约 2022 | CMO Haider Rafique 2025 年文：钱包作为主 App 内模式上线，用户可在中心化交易和自托管之间切换 | 官方博客 |
| 2022-10-31 | SlowMist 审计钱包私钥模块，结论是助记词/私钥仅本地存储 | 官方披露的审计摘要 |
| 2023-04-04 | 宣布钱包接入 MPC，当时宣传支持 37 条链，并提供独立 Emergency Escape | 官方新闻稿 |
| 2023 | 开源 `okx/threshold-lib`（2-of-n ECDSA / Ed25519 门限签名） | [GitHub](https://github.com/okx/threshold-lib) |
| 2023–2024 | Ordinals / BRC-20 市场、Cryptopedia、内置 DeFi 与 NFT 聚合成为中文社区高频卖点 | 官方与 OKX Ventures 材料 |
| 2024-04-16 | X Layer 公有主网上线（Polygon CDK 的 ZK L2），并接入钱包 | 官方新闻稿 |
| 2025-04-07 | 插件端停用无钥钱包；已有无钥钱包改走 App 管理 | 帮助中心 |
| 2025-04-16 | 发布独立 OKX Wallet App；主 App 内钱包功能将逐步下线，需用助记词导入新 App | [Announcing the new OKX Wallet app](https://www.okx.com/learn/okx-new-wallet-app) |
| 2025-05-23 | App 与插件都去掉无钥钱包创建入口；退出后的无钥钱包不能再新建 | 帮助中心，2026-09-01 仍保持该口径 |
| 2026-09-11 | Chrome 插件版本 4.16.0；商店文案写 140+ 网络，并列出 Social Login、Trader Mode、Auto-Confirm | [Chrome Web Store](https://chromewebstore.google.com/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge) |

当前公开入口：

1. **独立 Wallet App**（iOS / Android）
2. **浏览器插件**（Chrome 扩展 ID `mcohilncbfahbmgdjkbpemcciiolgcge`）
3. **web3.okx.com 网页端**
4. **主 OKX App 内残留 Web3 模式**（官方称过渡期后将下线）
5. **WalletConnect**，连接第三方 DApp
6. **OKX OS / Wallet API / DEX API**：把钱包和聚合器能力卖给开发者

CMO 2025 年 4 月那篇公告给出一组公司口径：数百万用户使用自托管、大约每日新增 50 万钱包、日处理约 10 亿美元交易、覆盖 130 多条链、约 445 亿美元等值资产经该钱包自托管。这些数字没有审计附注，也没有与交易所 PoR 对表的方法，事实层只记录「公司这样说过」。

### 2.4 密钥模型：助记词、MPC、硬件、社交登录

| 模式 | 公开机制 | 2026 年 9 月状态 |
|---|---|---|
| 助记词 / 私钥 | 本地加密存储；一套助记词派生多链地址；可导出到其他钱包 | 新建默认路径 |
| 无钥 / MPC | 私钥拆成 3 份：OKX 服务器、用户设备、iCloud / Google Drive / 华为云备份；2-of-3 签名 | 2025-05-23 后停新建；存量可导入；退出后不可再用 |
| 硬件钱包 | 帮助中心允许创建或导入硬件钱包；第三方评测点名 Ledger、Trezor，部分还写 Keystone | 适合大额；各链支持范围需按设备核对 |
| 观察钱包 | 只看余额、NFT、授权和 DeFi 仓位，不能签名 | 已上线 |
| Social Login | Chrome 商店 2026-09 文案：Google / Apple / 邮箱 | 帮助中心未见与无钥钱包同级的密钥托管说明 |

无钥钱包的恢复路径写得很清楚：丢失设备可用 Share 1 + Share 3（云备份）恢复，三份份额会刷新；欧易不可用时，可用设备份额 + 云备份做 Emergency Escape，拼出完整私钥并转成普通助记词钱包，原无钥钱包随后作废。[What is OKX keyless wallet?](https://www.okx.com/help/what-is-okx-keyless-wallet)

算法库开源，不等于整个 App 开源。CertiK 2023 年 10 月审计 `threshold-lib` 时，发现当时版本存在 Lindell17 中止漏洞（CVE-2023-33242）：具备特权的攻击者大约 200 次恶意签名请求后，可能抽出完整私钥。报告写明 OKX 随后加了封禁名单和零知识证明修复。这是密码学库层面的历史漏洞，不能外推成「2026 年插件已被攻破」，也不能写成「MPC 从未出过问题」。

Chrome 商店现在把 Social Login 和 Auto-Confirm（部分订单可不再次弹窗确认）写进卖点。这两项会改变「每次转账都要人眼看签名」的默认假设。技术实现、密钥是否再次分片、Auto-Confirm 的授权范围，公开帮助中心暂未给出与无钥钱包同等详细的说明。

### 2.5 内置功能：钱包本身已经是交易终端

帮助中心 2026 年 9 月 8 日更新的 DEX 指南，把产品能力写得很满：

| 模块 | 官方口径 | 需要分开读的限制 |
|---|---|---|
| 多链存储 | 官网 130+ 原生链；Chrome 商店 140+；帮助中心曾写 80+ | 营销、商店、帮助、开发者 API 四套数字不一致 |
| DEX 聚合 | 30+ 公链、25+ 桥、400+ DEX、30 万+ 代币；X Routing 可拆单到多个 DEX | 同页后文写「当前可交易 26 条链、跨链 17 条链」 |
| 交易模式 | Swap、高级、Bridge、限价、智能拆单、跟单、intent-based | 跟单和 Meme 发现会把用户推向高换手、高欺诈品种 |
| 安全插件 | KYT、恶意域名/合约提示、MEV 保护、限时 0 交易服务费 | 提示挡不住用户主动授权无限额 approve |
| NFT / 铭文 | 市场、铭刻、BRC-20 / Atomicals 等比特币资产解析 | 2024 年 1 月出现过 Ordinals 索引漏洞 |
| 赚币 / 质押 | 聚合多链质押与链上收益入口 | 收益来自第三方协议，钱包不承担兑付 |
| 开发者 | Wallet API、DEX API、Marketplace / Explorer；X Layer 为自有 L2 | API 支持链与 C 端「130+」不是同一张表 |

开发者文档 [Supported Networks](https://web3.okx.com/onchainos/dev-docs/wallet/supported-networks) 列出的是 Wallet API / Agentic Wallet 子集：EVM 约 20 余条（含 Ethereum、BNB Chain、Base、Arbitrum、Polygon、X Layer、Monad 等），非 EVM 中 Bitcoin、Solana 已支持，Sui / TON / Tron 在该表上仍标 Coming Soon。C 端钱包能显示的链，明显多于这张 API 表。

X Layer 是欧易自己的 Ethereum ZK L2（Polygon CDK），2024 年 4 月 16 日公有主网，钱包可查看、转账并在 DEX / NFT 市场交易该链资产。它和更早的 OKT Chain（Cosmos 系、EVM 兼容）是两条链，不能混成「欧易只有一条自有链」。

### 2.6 能对上第三方数据的规模

2026 年 9 月 16 日 DefiLlama DEX Aggregators 快照（成交额单位：美元）：

| 聚合器 | 覆盖链 | 24h | 7d | 30d |
|---|---:|---:|---:|---:|
| Jupiter | 1 | 5.43 亿 | 39.3 亿 | 165.4 亿 |
| 0x Protocol | 26 | 3.04 亿 | 22.8 亿 | 97.8 亿 |
| DFlow | 1 | 2.95 亿 | 21.7 亿 | 86.9 亿 |
| KyberSwap | 24 | 2.41 亿 | 18.5 亿 | 85.8 亿 |
| **OKX DEX** | **35** | **1.97 亿** | **17.4 亿** | **72.6 亿** |
| Binance Wallet | 12 | 0.41 亿 | 4.18 亿 | 16.8 亿 |
| MetaMask | 11 | 0.08 亿 | 0.53 亿 | 2.57 亿 |

来源：[DefiLlama DEX Aggregators](https://defillama.com/dex-aggregators)。单日成交会剧烈波动；30 天量更稳。OKX DEX 协议页另有累计聚合成交约 1906 亿美元的口径，并显示 2025 年四季度有约 1085 万美元手续费、2026 年前三季度费用记为 0，与「限时 0 交易服务费」宣传同方向，是否长期免费无法从这一页单独证实。

Solana 子榜上，OKX DEX 24 小时约 1.41 亿美元，排在 Jupiter、DFlow 之后，说明它在 Solana meme / 聚合交易里有真实份额，并不只吃 EVM。

Dune《Wallet Report v2》按国家抽样时，新加坡用户里 OKX 约占 60%、MetaMask 约 35%；印尼用户 MetaMask 59%、OKX 23%，但 OKX 的余额份额约 41%。这是链上方法学下的地区结构，不能当成全球 MAU。

Chrome 插件页面能稳定核到：2.9K 条评分、版本 4.16.0、2026 年 9 月 11 日更新、体积约 31.44 MB、声明收集 User activity。检索摘要出现过 “1,000,000 users” 档，抓取正文没有稳定命中精确安装量。

### 2.7 安全事件：要分清「钱包漏洞」和「设备/生态被打」

| 时间 | 事件 | 公开结论 |
|---|---|---|
| 2024-01 | Ordinals 索引规则问题，假 sats 上架成交 | Triathon 统计投资者损失约 28.0 万美元；报道称平台修复并赔付 |
| 2025-02 | 假 App「BOM」窃取助记词，超 182 万美元、逾 1.3 万个钱包 | SlowMist / OKX Web3 Security：恶意第三方应用，不是官方钱包放密钥 |
| 2025-09 | npm 供应链攻击（qix 账户，篡改交易地址） | 官方称原生 App、插件、Web 与移动 DApp 浏览器未使用受影响版本 |
| 2026-03 | 武汉安顺科技相关案件，报道金额约 700 万美元 | 徐明星：木马控设备、挂钩网页 JS / 键盘记录；调查结论不是 OKX Web3 钱包漏洞。SlowMist 对送审版本称未见私钥/助记词外传 |

官方还汇总过 CertiK、SlowMist、Hacken 对前端/移动端/SDK、MPC App、私钥模块、Account Abstraction、Ord 组件的审计。能核到的具体报告包括：SlowMist 2023 年对 Android MPC 钱包评低风险；CertiK 2024 年 5 月 23 日对前端与移动端发现 5 个问题并称已修复。审计覆盖的是送审版本，不覆盖用户设备已经被控之后的情况。

自托管钱包的共性边界：设备木马、剪贴板劫持、假下载页、无限额授权、貔貅盘，官方风控可以提示，拦不住用户点确认。Datawallet 2026 年评测把这类风险写得很直：适合已经在 DEX、跨链、NFT mint 里高频操作的人；不适合「只想安全存、偶尔买」的新手，因为默认界面在推快速交易。

### 2.8 中国大陆口径

《银发〔2026〕42 号》把虚拟货币相关业务活动继续定性为非法金融活动，并写明境外单位和个人不得以任何形式非法向境内主体提供交易、兑换、中介、定价等服务。全文见[中国人民银行条法司页面](https://www.pbc.gov.cn/tiaofasi/144941/3581332/2026020619591971323/index.html)。

42 号文没有单独写「个人持有自托管软件即违法」。它管的是业务活动：兑换、中介、定价、面向境内提供服务，以及未经同意的 RWA 代币化相关技术服务。OKX 钱包内置的 DEX、跨链、跟单、法币/交易所快捷通道，落在「服务」一侧的概率高于「纯离线看余额工具」。

知乎检索里，OKX Web3 钱包常被写成「新人易用、多链、内置 DEX」；同期结果大量是铭文行情和项目软文，不能当市场份额。中文教程站还常见邀请码、返佣和「从交易所一键提到 Web3」流程，说明产品在中文互联网的实际传播路径，仍是交易所品牌带钱包，而不是一个与欧易无关的开源插件。

## 三、结构分析

### 3.1 商业模式：把 CEX 用户送进链上订单流

钱包本身按官方说法不托管资金，收入要从别的地方来。公开能看到的抓手是：

1. **DEX 聚合路由。** 成交走 Uniswap、Raydium、Jupiter 等池子，OKX 收服务费或返佣；2025 年四季度 DefiLlama 记过约 1085 万美元费用，2026 年又出现 0 费率促销。
2. **流量分发。** Cryptopedia、Boost、X Launch、跟单和 Meme 发现，把用户注意力留在自有终端，再导向新币、活动和项目。
3. **CEX 协同。** 快捷提币降低「从托管账户搬到自托管」的摩擦；用户仍可能把法币入口、合约和法币出金留在交易所。
4. **OKX OS。** Wallet API / DEX API 卖给其他钱包、游戏和 DApp；官方称 DEX API 能承载超过每日 2 亿美元量级，服务 1000+ 项目。这是 ToB，和 C 端 MAU 不是同一张报表。
5. **自有 L2。** X Layer 需要钱包作为默认入口，否则链上应用没有用户。

费率可以短期为 0，订单流不能为 0。只要路由还在 OKX 终端里完成，它就掌握了链上交易的分发权。这和 MetaMask 早期主要做注入 `window.ethereum`、把 swap 让给 MetaMask Swaps / 第三方 DApp 的结构不同；也和币安 Wallet 接近，但 DefiLlama 这一天的聚合量上，OKX DEX 明显高于 Binance Wallet。

### 3.2 技术链路

用户看到的「一个钱包管 100 多条链」，背后至少有四层：

1. **密钥层**：BIP39 助记词 + 各链派生；MPC 用 Feldman VSS + Lindell17 做 2-of-n；硬件钱包把签名留在 Secure Element。
2. **链适配层**：EVM 一套地址，Bitcoin / Solana / Tron / Sui / TON 各有地址和签名算法。API 文档显示异构链接入进度并不齐。
3. **交易路由层**：X Routing 在多个 DEX 和桥之间拆单、比价、估 Gas 和滑点；跨链依赖第三方桥，钱包无法担保桥的安全性。
4. **风控与内容层**：域名检测、代币风险标、KYT、MEV 保护，以及 Meme / 跟单信息流。后一层决定用户实际点到什么合约。

独立 App 拆分，是发现问题和合规问题叠在一起。CMO 原文写：新人找不到嵌在主 App 里的钱包，所以拆出去试验独立分发。同时，把 Web3 服务条款与交易所条款分开、按司法辖区关停 EEA Web3，也降低「未持牌交易服务」和「自托管软件」被写成同一产品的概率。Lennix 在 Odaily 访谈里把战略说成：坚持自托管和多链，不想做「用户把资产交给我们、我们代买」的买办模式。访谈是当事人口径，不是监管认定。

### 3.3 组织约束

钱包能力受三组约束，产品文档解决不了：

| 约束 | 表现 |
|---|---|
| 司法辖区开关 | 美国认罪后更不能让钱包变成面向美国零售的未注册资金传输；EEA、香港、大陆各有不同红线 |
| 品牌与下载安全 | 假 App、假插件、假客服是真实损失来源；官方反复强调只走官网和商店 |
| 开源边界 | 门限签名库开源，App、插件、路由和风控规则闭源；「完全可审计的自托管」只覆盖密钥算法一层 |

无钥钱包停新建，可以读成体验实验结束。MPC 降低了「纸质助记词」门槛，也把一份密钥份额放到欧易服务器和消费级云盘上。停新建之后，产品重新把「你自己备份 12/24 个词」当成默认，和独立 App 导入助记词的迁移要求一致。社交登录若在 2026 年重新承担「免助记词」角色，等于用另一种账户抽象回到同一问题：恢复路径依赖哪几方。

### 3.4 竞争位置

| 钱包 | 公开可核对的位置 | 和 OKX Wallet 的差异 |
|---|---|---|
| MetaMask | DApp 连接的默认注入；聚合成交量远小于 OKX DEX | 更像基础设施，少做交易所式行情和跟单 |
| Phantom | Solana 生态主导，swap 活动仍高度集中在 Solana | OKX 在 Solana 聚合量可观，但品牌心智仍是多链综合盘 |
| Trust Wallet | 币安系，下载量和多链覆盖都大 | 和币安账户的绑定路径不同 |
| Binance Wallet | 同类「交易所做自托管 + 内置 DEX」 | 同一 DefiLlama 快照上聚合量低于 OKX DEX |
| Rabby | 开源、模拟交易、EVM 安全向 | 对开源和签名可读性要求高的人，会觉得 OKX 过重 |
| Coinbase Wallet | 北美合规品牌 + 账户抽象 | 法币和牌照叙事不同 |

DappRadar 把 OKX Wallet 列为「交易所把用户带进 Web3」的代表，支持 EVM 之外的 Solana、Cosmos、NEAR、Dogecoin、Litecoin 等。名单会过时，结构判断仍然成立：它的获客成本摊在已有 CEX 品牌上，独立钱包要从零教育「什么是助记词」。

## 四、外部研判

这些是观察，不是用户普查或安全承诺。

**判断 1：它已经是可用的多链交易终端，密钥保管只是底盘。** 帮助中心把 Swap、Bridge、限价、拆单、跟单、intent 写在同一套 DEX 指南里。用户打开它，主要动作是发现代币和下单。自托管降低了平台挪用风险，没有降低合约和授权风险。反证：独立 App 把交易模块大幅收回到「只转账、只连接 DApp」。

**判断 2：官方链数量和用户量目前不能横比。** 130+、140+、80+、API 表 30 来条、DEX 可交易 26 条，同时出现在官方材料里。每日 50 万新建钱包如果按字面理解，年化超过 1.8 亿个地址，和 Chrome 评分规模、第三方地区抽样都不匹配；更可能含派生地址、空钱包、活动刷量或未披露口径。反证：出现与 PoR 同级的第三方地址集合审计，或监管文件给出 MAU 定义。

**判断 3：无钥钱包停新建，说明「免助记词」还没成为可长期运营的默认。** 份额在欧易服务器和 iCloud/Google Drive 上，恢复方便，攻击面也从「一张纸」变成「账号 + 云 + 设备」。停新建后，存量用户仍可导入，新用户回到助记词。Chrome 商店的 Social Login 若成为下一轮默认，需要重新核验密钥托管。反证：帮助中心重新开放无钥创建，或公布社交登录的开源密钥协议。

**判断 4：安全叙事里，「从未被黑」和「用户大量亏钱」可以同时成立。** CMO 写过 wallet software never been hacked。公开案件更多是假 App、木马、钓鱼授权和铭文索引错误。对用户来说，损失发生在签名那一步，责任划分在「官方二进制是否被攻破」。反证：出现可复现的官方客户端私钥外传，或审计商撤回「未见外传」结论。

**判断 5：对大陆读者，产品完成度回答不了能不能用。** 42 号文盯的是向境内提供虚拟货币服务。内置 DEX 和跨链兑换属于服务能力；即使软件能装，也不构成合法境内通道。香港已撤回 VATP、美国主体已认罪，说明同一品牌在不同地方是不同许可状态。反证：主管部门把特定自托管软件列入允许向境内提供兑换的范围——目前没有看到。

**跟进 / 观望：**

- **观望** 中国大陆居民使用 OKX DEX、跨链兑换、跟单、邀请返佣，以及任何把钱包当境内交易入口的方案。
- **跟进** 独立 Wallet App 是否真正替换主 App 内钱包；DefiLlama OKX DEX 30 天量是否还留在聚合器第一梯队；Social Login / Auto-Confirm 的正式技术说明；EEA 与其他地区 Web3 开关。
- **不跟进** 把 445 亿美元自托管、每日 50 万新钱包、商店「最安全 USDT 钱包」教程当成决策依据。

下一步：核对下一期 Chrome 插件更新是否补上社交登录帮助文档；看 DefiLlama 2026 年四季度 OKX DEX 费用是否仍为 0；对照欧易下一次 PoR，确认两套资产口径仍未混用。

## 五、未能验证

| 缺失项 | 为什么缺 | 可能的查证路径 |
|---|---|---|
| 真实 MAU / DAU / 独立地址数 | 公司只给「数百万」和每日新增 | 等监管文件、应用商店分区、或 Dune 级公开仪表盘给出定义 |
| 445 亿美元自托管 | 2025-04 博客单源，无地址集合 | 需要可验证地址列表或第三方托管证明，并排除交易所热钱包 |
| 统一链支持清单 | 官网、商店、帮助、API 四套数 | 抓 C 端「添加网络」完整列表，与 API `supported-chains` 对表 |
| Social Login 密钥模型 | 仅出现在 Chrome 商店文案 | 等帮助中心或安全白皮书写清份额存储、恢复和退出路径 |
| Auto-Confirm 的授权边界 | 商店写 one-click，帮助中心未展开 | 实测哪些交易可免确认，是否可被恶意 DApp 复用 |
| 独立 App 对主 App 钱包的下线日期 | 2025-04 只说 phased out over time | 以 App 发版说明和帮助中心为准 |
| MPC 存量用户规模 | 停新建后没有披露 | 无法从外部准确估计 |
| 硬件钱包各链支持矩阵 | 帮助中心只写「可连接硬件钱包」 | 以 Ledger / Trezor / Keystone 官方兼容表实测 |
| 钱包业务收入 | 无分产品财报 | 只能看 DefiLlama 费用和 DEX API 客户，无法拆广告/返佣/API |
| 大陆实际使用人数 | 属被禁止或灰色的服务场景 | 不存在可引用的合法普查 |
| 「从未被黑客攻击」 | 当事人宣传 | 只能核对已公开事件是否涉及官方客户端密钥外传 |

## 六、信息来源与说明

主要资料来源：

- 产品站 [web3.okx.com](https://web3.okx.com)，以及帮助中心 [What is OKX keyless wallet?](https://www.okx.com/help/what-is-okx-keyless-wallet)、[OKX DEX User Guide (Web)](https://web3.okx.com/help/okx-dex-user-guide-web)（2026-09-08 更新）、钱包管理说明。
- CMO 公告 [Announcing the new OKX Wallet app](https://www.okx.com/learn/okx-new-wallet-app)（发布于 2025-04-16）。
- 开发者文档 [Supported Networks](https://web3.okx.com/onchainos/dev-docs/wallet/supported-networks)；开源库 [okx/threshold-lib](https://github.com/okx/threshold-lib)。
- Chrome Web Store 插件页（版本 4.16.0，2026-09-11）。
- DefiLlama [DEX Aggregators](https://defillama.com/dex-aggregators) 与 [OKX DEX](https://defillama.com/protocol/okx-dex)（2026-09-16 抓取）。
- 美国司法部纽约南区起诉书、Reuters 对 2025-02-24 认罪的报道；香港证监会 VATP 名单。
- 中国人民银行等八部门《银发〔2026〕42 号》。
- CertiK threshold-lib 审计摘要（含 CVE-2023-33242）、SlowMist Android MPC 审计摘要、公开安全事件报道（Triathon、BlockBeats、ChainCatcher）。
- Dune Wallet Report v2 的地区结构；Odaily 对 Lennix 的访谈；ABMedia 对产品负责人 Aaron 的访谈。
- 知乎开放平台检索，只用于观察中文社区点名哪些卖点，不写成份额。

没有公开、因而不能写成事实的数据：审计后的全球 MAU、自托管资产地址全集、社交登录的密钥托管细节、钱包独立收入。

属于推断的结论：DEX 零费率是为了锁订单流、无钥停新建意味着免助记词尚未成为默认、独立 App 同时服务发现与合规切分。这些放在第四节，未写入事实表。

资料截至 2026 年 9 月 16 日。DEX 成交额使用当日 DefiLlama 快照，后续会变；帮助中心对无钥钱包停新建的口径以页面更新时间为准。

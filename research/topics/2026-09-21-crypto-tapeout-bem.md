---
title: "阿燃调研：每天一个加密资产 —— TapeOut / $BEM 观察"
category: topics
topic_type: market
crypto_type: asset
coin_id: "tapeout-bem"
symbol: "BEM"
date: "2026-09-21"
time: "17:25"
tags: [加密资产, TapeOut, BEM, BNB Chain, Proof of Design]
subjects: [web3]
summary: "BNB Chain 上的 TapeOut 协议把 NAND/LATCH 做成晶体管 Token，流片生成电路 NFT，再用 Proof of Design 挖出 $BEM。大家口头说的 TapeOutX 没有这枚独立交易代码；能核到的主币是 BEM，合约 0x5ce033b2bfca3af30b3e8c8457deaf776a8b695a。官方累计已挖约 20.85 万枚，GeckoTerminal 记 ERC-20 总量约 10.06 万枚、价格约 47.7 美元、纸面约 480 万美元。日产量仍按约 7200 枚发放。"
tldr: "TapeOut 是 16 岁开发者 Blonskr 在 BNB Chain 上做的链上电路实验，$BEM 是它的矿币。货币数字几乎按比特币抄：上限 2100 万、日产约 7200、约四年减半；现场规则相反——成本在流片时一次性沉没，之后几乎零边际成本每天领币。矿机合约 owner 已是零地址、题库已冻结；TapeHub 仍有单钱包升级权。日产按现价约 34 万美元，主池流动性只有二十多万美元。继续当机制实验看，不当成已经有外部需求托住的交易品种。"
content_type: analysis
assistance: cursor
model: grok-4.6
research_template: crypto-asset-research
research_template_version: 3
sources_as_of: "2026-09-21"
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> **风险与合规提示：** 加密资产波动大，日产量可以压过盘口深度。资料只用来理解 TapeOut 协议和 $BEM 的公开机制，不构成投资、开户、买卖或法律建议。合约以 tapeout.net / bem.community 公布的为准；搜索结果里的 TapeOut、TapeOutX、BEM、BEMT 大量同名假币，尤其是 Four.meme 上的 `$TapeOut`。

## 一、先给结论

**大家在 BNB 上找的 TapeOut / TapeOutX，能核对上的主币是 $BEM。** TapeOut 是协议名，BEM 是 Proof of Design（PoD，设计证明）挖出来的奖励代币。创始人 Blonskr 公开身份是 16 岁高中生。2026 年 8 月 15 日他先在 BNB Chain 上流片了一台名叫 Behemoth 的 4 位处理器，8 月 21 日打开挖矿并发 BEM。决定观察框架的是后面这套矿币规则，不是「链上 CPU」这句宣传。

目前能核验的要点：

1. 官方 BEM 合约只在 BNB Smart Chain，地址 `0x5ce033b2bfca3af30b3e8c8457deaf776a8b695a`，8 位小数。社区站 [bem.community](https://www.bem.community/) 与 KuCoin 介绍文都写了同一条。CoinGecko 没有收录（`coingecko_coin_id` 为空）。
2. 协议把 NAND（与非门）和 LATCH（锁存器）做成 ERC-1155「晶体管」，浏览器画布免费仿真，点「流片」后烧掉晶体管、铸出 ERC-721 电路 NFT。只有官方两台处理器——Behemoth（权重系数 6）和 TapeOut（系数 1）——上的电路能挖 BEM。
3. 官方 [`pod-stats.json`](https://tapeout.net/pod/pod-stats.json) 在 2026-09-21 08:40 UTC 记录：挖矿合约 `0x7E2E0DC66a3bD9103E69b766afA62d9f7b697b46`，`owner` 为零地址，`tasksFrozen: true`，累计已挖 **208,516.39** 枚，日产约 **7,200** 枚，活跃矿机 18,002 台（已验证 17,378），题库 267 道。挖矿从 2026-08-21 13:15 UTC 开始，约 30.8 天。
4. GeckoTerminal 同期把 ERC-20 `totalSupply` 记成 **100,636.37** 枚，价格约 **47.70 美元**，按该供给计完全稀释估值约 **480 万美元**，持有地址约 7,429，前十大合计 30.61%。主池是 PancakeSwap V3 的 BEM/USDT（1% 费率），池子约 20.9 万美元；接口合计储备约 44.7 万美元。两条供给口径差约 **10.8 万枚**。
5. 上限对外口径是 2,100 万枚、约四年减半、无预挖、无团队预留。把现价乘到 2,100 万，纸面约 10 亿美元。日产 7,200 枚按 47.7 美元约 **34.3 万美元/天**，已经接近全部 DEX 储备。

外部判断：**观望。** 链上确实有一套可验证的电路网表、抽检和矿机权重，不是凭空发一张图。BEM 的交易盘口目前仍按矿币在定价：沉没成本已经付过，矿工几乎零成本每天领币，买盘要持续吞掉日产和尚未领完的库存。CZ 的点赞、评论、跟关注的是社交溢价，不是币安上币。TapeHub 仍保留单钱包升级权。跟进条件见第九节末。

## 二、起源、背景与发展时间线

Blonskr 在公开账号里自称 16 岁、「8grade coder」，中文社区叫他「小弟」。2026 年 8 月 15 日他宣布在 BNB Chain 上做出 Behemoth：约 2,251–2,300 个 NAND/触发器组成的 4 位处理器，规格对标 1971 年 Intel 4004，时钟跟着 BNB Chain 出块走，大约 0.45 秒一拍、2.22 Hz。他自己的原话是：「This is one small step for me, but a giant leap for BNB Chain。」

第二天，赵长鹏（CZ）在帖下评论并关注，英文原话是「pretty interesting. What's the use case?」。奥点云 8 月 17 日的报道写：当时 NFT 矿机还不能产币，市场先炒晶体管；Behemoth 的 NAND 从铸造价 0.0005 BNB 涨到约 0.0085 BNB。挖矿是 8 月 21 日才打开的。

| 时间 | 事件 | 来源 |
|---|---|---|
| 2026-08-15 | Blonskr 公开 Behemoth；官网定位「链上硬件制造商基础设施」 | 奥点云、[tapeout.net](https://tapeout.net/) |
| 2026-08-16 | CZ 点赞、评论、关注 | 奥点云、Foresight / BlockBeats |
| 2026-08-21 21:15 北京时间 | PoD 挖矿启动，BEM 开始按约 0.0833 枚/秒发放 | 官方 `pod-stats.json` 的 `startTime` |
| 2026-08 下旬 | 官方题库、一键流片降低门槛；第三方市场 Firsto、TapeOutScan 出现 | PANews、WEEX 生态盘点 |
| 2026-09-07 | CoinCodex 记美元历史低点 9.18 美元 | CoinCodex |
| 2026-09-12–14 | 媒体记 BEM 从约 20 美元冲到约 101.9 美元；CoinCodex ATH 72.28 美元（9 月 14 日） | BlockBeats、CoinCodex |
| 2026-09-13 | GitHub 组织 TapeOutProtocol 创建，随后开源 TapeKit | [GitHub](https://github.com/TapeOutProtocol) |
| 2026-09-14 | 挖矿合约 owner 置零，题库冻结 | 官方 `owner` / `tasksFrozen`；tapeout.work 日程 |
| 2026-09-15 | CZ 发「immortal fruit flies」；Blonskr 引用；TapeHub 上线 | BlockBeats、tapeout.work |
| 2026-09-15 前后 | 交易员 Bonk Guy 公开称约 3.341 万美元单价买入约 7.16 万美元 BEM | BlockBeats / Foresight |
| 2026-09-16 | TapeKit 浏览器内核开源 | tapeout.work、[TapeKit](https://github.com/TapeOutProtocol/TapeKit) |
| 2026-09-21 | 本条快照：已挖 20.85 万枚，ERC-20 供给约 10.06 万枚 | 官方 JSON、GeckoTerminal |

社区对年龄和「是不是真 CPU」有过争论。后续公开材料里能看到 RISC-V / 链上 Linux 演示、电路容器、TapeKit 把网站文件存进容器并按 SHA-256 校验。这些是产品扩张，不等于 BEM 已经有稳定的外部购买需求。

## 三、技术机制与网络结构

TapeOut 不是独立公链。结算、Gas、出块都走 BNB Smart Chain。协议自己新增的是一套资产分层和求值规则。

| 层级 | 标准 | 作用 |
|---|---|---|
| 晶体管 NAND / LATCH | ERC-1155 | 原材料；流片时销毁 |
| 电路 Circuit | ERC-721 NFT | 永久网表；挖矿时当矿机 |
| 处理器 Processor | 工厂合约克隆出的「空白硅」 | 设定晶体管总量和铸造价；目前能挖矿的是 Behemoth 与 TapeOut |
| $BEM | ERC-20 | PoD 奖励，8 位小数 |

画布在浏览器里跑，不花 Gas。链上发生的是：烧掉对应数量的晶体管，把连线关系写成电路 NFT。PANews 专栏把计算拆得很清楚：NFT 是静态图纸，真正读写状态的是协议智能合约里的求值器和存储。时钟来自 BNB Chain 出块。官方宣言 PDF 也写了 0.45 秒一拍、2.22 Hz，并自称这是「全宇宙最慢的 CPU」。

奥点云 8 月 17 日的判断更素：没有新的资产标准，玩法仍是 EVM 上的矿机游戏，只不过材料叫晶体管、成品叫电路。两套描述可以同时成立。NAND 在布尔逻辑里确实功能完备，LATCH 提供 1 bit 记忆；把它们做成 Token 并记录网表，能在链上留下可验证的设计。它仍然受 EVM Gas、区块时间和合约求值器能力约束，不是硅片上的微处理器。

挖矿流程（官方 PoD 页）：arm 预约锚点 → start 开始并由合约抽检测试向量 → 通过后按权重持续产 BEM → 随时 claim。已验证池分走日产的 99%，未验证池 1%。复制别人的网表不能抢先占槽。目前挖矿禁止 REF（引用其他电路当黑盒），组合能力在矿币规则里被关掉了。

已确认的协议相关地址：

| 对象 | 地址 |
|---|---|
| BEM 代币 | `0x5ce033b2bfca3af30b3e8c8457deaf776a8b695a` |
| 挖矿合约 | `0x7E2E0DC66a3bD9103E69b766afA62d9f7b697b46` |
| 挖矿 lens | `0xdd20b9537b9f5db9d2a23e6b11ad863cf81930d8` |
| Genesis 电路 | `0x50A994E71615474b55559fF4F500928fbc339DD9` |
| Genesis 晶体管 | `0x1d23Bf70ec6bAAD95f396Ea38f8A8415119dFDE6` |
| 主池 BEM/USDT（PancakeSwap V3，1%） | `0x3098d7a051045000d68ec0360753a40c8cabea31` |

创世项目页把协议合约标成「正式封存前可升级」。挖矿合约本身 owner 已是零地址、题库已冻结；新处理器、TapeHub、容器仍要单独看管理员。

## 四、用途、生态与价值来源

设计用途有三层，要分开看。

**晶体管。** 流片必须烧掉 NAND/LATCH。Behemoth 晶体管因为系数 6 且早期铸造量小，二级市场价格通常高于 TapeOut 处理器上的同名零件。官网首页同时挂着大量第三方「处理器」项目，按销售额排序，Keccak-256 IP Core、BEM Vault、BEMDOG、BEMCAT 都在前列。这些是工厂克隆出来的新硅片，默认不能挖 BEM。

**电路 NFT。** 通过抽检后成为矿机。权重公开算法：烧掉的晶体管数量 × 处理器系数；同一道题只有成本最低的「最优首创」拿满设计溢价，套官方模板通常只有工本、没有溢价。Foresight 转述 TapeOutScan：当时若要日产 1 枚 BEM，用晶体管铸造最优蓝图大约 2.75 BNB，二级市场买现成矿机大约 3.28 BNB，静态回本 36–43 天——前提是 BEM 价格不掉、日产能被买盘吃掉。

**$BEM。** 社区站写：可以从市场买，也可以用兼容矿机挖。路线图提到 Binary Neural Network（BNN，二值神经网络）推理要消耗 BEM，TapeHub / 容器 / 流片费计划回购销毁。WEEX 和 TapeOut Market 都把回购写成政策或早期 Alpha，不是已经按日对冲 7,200 枚产量的链上事实。

第三方工具已经很多：Firsto、tapeout.market、TapeOutScan、tapeout.work、SILICON X、TapeOut Club、BEM OTC。TapeKit 试图把 HTML/JS/CSS 存进电路容器，用 `4246.0.tape` 这类名字打开。GitHub 组织目前公开的协议代码主要是 TapeKit，核心矿机与求值器没有完整开源仓库。

真实采用能看见的量：约 1.8 万台活跃矿机、267 道题、官网项目墙超过 1,000 个处理器。市场叙事把它写成「CZ 点过的链上芯片」。BEM 的即期需求，公开可跟踪的仍是矿工卖币和交易员接盘。Gas 付的是 BNB，不是 BEM。

## 五、代币经济与供给结构

| 指标 | 当前值 | 口径日期 / 来源 |
|---|---:|---|
| ERC-20 总供应量 | 100,636.37 | 2026-09-21 08:57 UTC，GeckoTerminal `totalSupply` |
| 官方累计已挖 | 208,516.39 | 2026-09-21 08:40 UTC，`pod-stats.json` `totalMined` |
| 永久作废（空池） | 111.86 | 同上 `totalForgone` |
| 最大供应量 | 21,000,000 | bem.community、媒体转述官方口径 |
| 日产量 | 7,199.9997 | 官方 `currentRate` 0.08333333 枚/秒 |
| 按 ERC-20 供给的 FDV | 约 480 万美元 | 100,636.37 × 47.70 美元 |
| 按已挖数量的纸面 | 约 995 万美元 | 208,516.39 × 47.70 美元 |
| 按 2100 万上限的纸面 | 约 10.0 亿美元 | 21,000,000 × 47.70 美元 |
| 持有地址 | 7,429 | GeckoTerminal，2026-09-21 08:57 UTC |
| 前十大持仓占比 | 30.61% | 同上 |
| 单一最大地址 | 5,546.88 枚（约 5.5%） | `0xc860a2331156f0a6e521bd1c1c08215ebc2b8a87` |

对外口径几乎是比特币数字的平移：2,100 万上限、起步约每天 7,200 枚、约四年减半、无预挖。Foresight 写出发行只来自挖矿合约。现场规则和比特币相反。比特币矿工每天付电费，价格跌破电费会关机，供给收缩；BEM 的晶体管成本在流片那一刻已经付完，电路还在就能继续 claim，边际成本接近 Gas。卖压结构因此更硬。

两条供给数字必须并排写。官方 `totalMined` 是累计发放权；GeckoTerminal 的 `totalSupply` 是已经出现在 ERC-20 账本上的数量。差额约 **107,880 枚**，按 47.70 美元约 **515 万美元**。更可能的解释是尚未 claim 的库存仍在挖矿合约里，领出来就会进入可卖供给。不能在未核账的情况下把 480 万美元市值当成「已经挖完并流通」的数字。

按当前 10.06 万枚 ERC-20 供给计，日产 7,200 枚相当于每天增加约 7.2% 的账面供给，年化约 26 倍。即使用 20.85 万枚已挖数量做分母，每天仍增加约 3.5%。这是观察 BEM 时最硬的约束。

## 六、市场位置与历史表现

CoinGecko 没有币种页。价格用 GeckoTerminal 与聚合站交叉。

| 指标 | 数值 | 口径 |
|---|---:|---|
| 价格 | 约 46.47–47.70 美元 | 2026-09-21 08:57 UTC，GeckoTerminal |
| 24 小时区间 | 36.28–54.58 美元 | 主池 |
| 主池 24 小时成交 | 约 115 万美元 | GeckoTerminal 池页 |
| 全池 24 小时成交 | 约 260 万美元 | GeckoTerminal token API |
| 主池流动性 | 约 20.9 万美元（2,433 BEM + 94,494 USDT） | PancakeSwap V3 1% |
| 全池储备 | 约 44.7 万美元 | token API `total_reserve_in_usd` |
| 池龄 | 约 27 天 | GeckoTerminal |
| CoinCodex ATH / ATL | 72.28 美元（2026-09-14）/ 9.18 美元（2026-09-07） | CoinCodex；与 BlockBeats 记的 101.9 美元高峰不是同一口径 |
| 中心化交易所 | MEXC、LBank、WEEX、Ourbit；媒体另写 Gate、Bitrue Alpha | CoinCodex、BlockBeats、KuCoin |
| 安全分 | GT Score 70.4；接口记非 honeypot | GeckoTerminal |

BlockBeats 转述 GMGN 的「买卖各 1% 手续费」，与主池 1% 的 V3 费率一致。没有在已核资料里看到独立的代币税参数，不作额外税种结论。

9 月 12–15 日那一波同时出现三件事：价格从约 20 美元拉到媒体所记的约 100 美元、CZ 第二条社交互动、Bonk Guy 公开买入。那是事件溢价。9 月 21 日盘口已经回到 47 美元附近，24 小时振幅仍超过 50%。主池只有约 2,433 枚 BEM，按现价约 11 万美元；日产 7,200 枚是这个池子存货的三倍。大额卖单会先打穿 AMM，再溢到 CEX。

Four.meme / FLAP 上另有名为 `$TapeOut` 的代币，合约 `0x0a9f66a5b694cc1b3cf868fd136a0cce4b397777`，总量 10 亿，2026-08-15 创建。GeckoTerminal 上它的 Uniswap V4 池 FDV 约 3.7 万美元。这和 BEM 无关。

## 七、治理、安全与关键依赖

已经能确认的收口：

- 挖矿合约 `owner = 0x000…0000`，官方 JSON 同步 `tasksFrozen: true`。Foresight 写 9 月 14 日放弃管理权之后，不能再升级、暂停或改题库，产量曲线钉死。这只覆盖挖矿这一份合约。
- tapeout.work 在 Launch Week 条目里并排写了另一句：9 月 15 日 TapeHub 上线，「one wallet can upgrade every project」。发射台和第三方矿币项目仍有升级键。
- 新处理器在创建时设定供给、铸造价和收入分成；官网写明正式封存前合约可升级。
- 核心协议代码没有完整公开仓库。能核到的开源主要是 TapeKit（CC0 规范、MIT 代码）。
- 电路容器的持有人可以替换容器里的网站文件。TapeKit 把「链上网站不可篡改」建立在「持有对应电路 NFT 的人决定内容」之上。

依赖清单很集中：BNB Chain 出块当时钟；PancakeSwap 主池当定价；NAND/LATCH 订单簿（官方 + Firsto 等）当原材料市场；Blonskr 个人账号当路线图入口。创始人年龄是公开设定，不是链上可验证事实。奥点云 8 月已经提醒：一旦进入金融化，亏损方的攻击会落到这个人身上。

GeckoTerminal 记主池已验证、未见代理、未见 honeypot。放弃 owner 不能替代审计，也不能锁住 LP。流动性是否锁定，本条没有在浏览器里逐笔核 LP token。

## 八、监管与合规环境

BEM 是 BNB Chain 上的协议代币 / 矿币，没有在已核资料里看到证券注册、稳定币牌照或法院文件。CZ 的互动来自个人账号，不构成币安上市、托管或背书。中文社区和 BNB 大户是目前主要传播面。

同名风险是实务问题。BEM / BEMT 在 Tron 等链上另有无关代币；TapeOut 作为名字已经被 Four.meme 用过。核验只认：

- [tapeout.net](https://tapeout.net/)
- [bem.community](https://www.bem.community/) 公布的 `0x5ce033B2bFCa3Af30b3e8C8457DeaF776A8b695a`
- 官方 `pod-stats.json` 里的 mining / token 字段

法律状态只写到这里。没有监管机构文件，就不推断证券属性。

## 九、催化因素、主要风险与外部研判

已确认、可能改写观察的事项：

- 日产约 7,200 枚已经写进冻结后的挖矿合约，减半到来之前不会因为价格下跌而关机。
- TapeHub 把「晶体管 → 矿机 → 挖矿」模板化给第三方项目，并声称发行/流片/燃料收入的一部分回购销毁 BEM。参数仍可能改，升级权仍在。
- TapeKit、电路容器、链上 Linux / BNN 若产生必须付 BEM 的用量，才可能在矿工卖盘之外长出需求。
- CZ 或币安生态再一次公开互动，会继续当社交开关用。

风险按已经能看清的写：

1. **供给。** 每天约 34 万美元的新筹码，对上约 21–45 万美元的 DEX 储备。尚未 claim 的约 10.8 万枚如果存在，纸面超过当前 ERC-20 市值。回购销毁目前是政策语言。
2. **机制。** 一键模板和题库降低了「设计证明」的门槛。挖矿禁止 REF，组合电路的故事和产币规则是分开的。最优解被占之后，后来者只拿工本权重。
3. **治理。** BEM 矿机合约已封；TapeHub 和未封存的处理器没有一起封。单钱包升级权足以改写发射台规则。
4. **流动性与命名。** 主池浅、名称乱、CoinGecko 未收录。买错 `$TapeOut` 或其它链上的 BEM，是比看错价格更常见的损失路径。
5. **叙事。** 价格对 CZ 互动和鲸鱼买入敏感。社交溢价可以来得快，撤得也快。16 岁创始人是传播材料，也是运营单点。

一种可能的外部解读：TapeOut 把数字电路的零件做成了会耗尽的 Token，把设计质量做成了可抽检的链上权重。这件事在公链实验里少见，值得当机制看。BEM 把比特币的发行表贴到一套「一次付费、永久领币」的矿机上，盘口要回答的问题很具体——每天谁在买走这 7,200 枚。8 月中旬先炒晶体管，8 月 21 日后改炒矿币，9 月中旬用 CZ 和鲸鱼把价格打到约百美元，随后回到 47 美元附近。外部需求（BNN、容器付费、TapeKit）还没有在公开数字里表现为能对冲日产的销毁。

外部研判：**观望，跟踪机制和供给，不当成已经形成独立需求的交易品种。** 跟进的条件是：官方 `totalMined` 与 ERC-20 `totalSupply` 的缺口持续收敛且没有等量卖压打穿主池；链上能核到与日产同量级的回购销毁；TapeHub 升级权交出或冻结；BEM 出现稳定的非挖矿消耗（容器/BNN/协议费）。看四个公开数字——`pod-stats.json` 的 `totalMined` 与 `currentRate`、GeckoTerminal `totalSupply`、主池 USDT 储备、TapeHub 管理员地址是否仍可升级。

## 十、信息来源与持续验证

主要来源，资料截至 2026-09-21：

- [TapeOut 官网](https://tapeout.net/)：协议说明、项目墙、Genesis 合约
- [PoD 挖矿页](https://tapeout.net/pod/) 与官方快照 [`pod-stats.json`](https://tapeout.net/pod/pod-stats.json)：owner、题库冻结、日产、已挖、矿机数、`startTime`
- [TapeOut 链上微处理器宣言 PDF](https://tapeout.net/TapeOut-Protocol.pdf)：晶体管 / 电路 / 工厂 / 2.22 Hz 时钟
- [bem.community](https://www.bem.community/)：BEM 合约、2100 万上限
- [tapeout.work BEM overview API](https://tapeout.work/api/v1/bem/overview)：挖矿 / lens / token 地址交叉核验
- [GeckoTerminal BEM](https://www.geckoterminal.com/bsc/tokens/0x5ce033b2bfca3af30b3e8c8457deaf776a8b695a) 与 token API：价格、供给、持仓、池子
- [TapeKit](https://github.com/TapeOutProtocol/TapeKit)、[tapehub.ai](https://tapehub.ai/)
- 奥点云 [2026-08-17](https://www.odaily.news/en/post/5212520)；Foresight / BlockBeats [BEM 与 CZ](https://en.theblockbeats.news/news/63711)；KuCoin [BEM 介绍](https://www.kucoin.com/blog/what-is-bem-token-tapeout-protocol-proof-of-design)（2026-09-19）；PANews [小白科普](https://www.panewslab.com/zh/articles/01a03820-6305-75be-9e73-12005316087a)；WEEX [生态盘点](https://www.weex.com/news/detail/tapeout-ecosystem-overview-from-nand-latch-to-on-chain-application-ecosystem-ncx5ivsan3qc3wslafbqxkr5)（2026-09-20）
- 跟风盘：[$TapeOut on FLAP](https://flap.sh/bnb/0x0a9f66a5b694cc1b3cf868fd136a0cce4b397777)

**持续验证**（会改变结论的才留）：

- `pod-stats.json` 的 `owner` 是否保持零地址，`tasksFrozen` 是否保持 true
- `totalMined` 与 ERC-20 `totalSupply` 的约 10.8 万枚缺口是未领取库存、销毁，还是口径错误
- 主池 USDT 储备是否还能覆盖数倍日产；回购销毁是否出现可核对的链上规模
- TapeHub 是否仍由单钱包升级全部项目
- CoinGecko 若收录，市值口径用哪一条供给

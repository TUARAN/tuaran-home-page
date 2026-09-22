---
title: "阿燃调研：每天一个加密资产 —— Arweave（AR）观察"
category: topics
topic_type: market
crypto_type: asset
coin_id: "arweave"
symbol: "AR"
market_cap_rank: 148
date: "2026-09-22"
time: "08:42"
tags: [加密资产, Arweave, AR, 永久存储, AO]
subjects: [web3]
summary: "Arweave 是 2018 年主网上线的永久存储网络，AR 用于支付一次性存储费和矿工奖励；供给上限 6600 万枚已发行约 99.5%，当前要看的是捐赠池购买力、实际上传，以及 2025 年后 AO 与网关层是否带来新的存储需求。"
tldr: "2026-09-22 CoinGecko 快照里 AR 价格 4.637 美元，市值排名第 148，流通市值约 3.05 亿美元。链上高度 2,005,867，数据集 356.22 TiB，捐赠池约 36.75 万枚 AR。永久存储是激励设计，成立条件写在协议文档里：存储成本每年下降 0.5% 且代币购买力不变。"
content_type: analysis
assistance: cursor
model: grok-4.7
research_template: crypto-asset-research
research_template_version: 3
sources_as_of: "2026-09-22"
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> **风险与合规提示：** 资料用于理解 Arweave 协议和 AR 的公开机制，不构成投资、交易、开户或法律建议。价格与供给取自 2026-09-22 的 CoinGecko 快照和当时的区块头，之后会变。

## 一、先给结论

Arweave 卖的是一次性付费的永久存储。上传者用 AR 支付费用，费用的大部分进入协议内的存储捐赠池，矿工靠证明自己保存着历史数据来出块并领取奖励。AR 是这条网络的支付和挖矿代币，上限 6600 万枚，到 2026 年 9 月已经发行约 99.5%。

目前能核上的要点：

1. 黄皮书写明：2018 年 6 月 8 日创世铸出 5500 万枚 AR，之后再通过挖矿奖励释放 1100 万枚，流通上限 6600 万枚。1 AR = 10^12 Winston。
2. 共识从早期的访问证明走到 2.6 的简洁随机访问证明（SPoRA），再经 2.8 的 composite 打包，到 2025 年 2 月 3 日前后激活的 `replica.2.9`。矿工要打包并读取历史数据，官方文档把目标读速写成每分区约 5 MiB/s。
3. 2026-09-22 08:40（北京时间）公共网关 `arweave.net` 的区块高度为 2,005,867，`weave_size` 为 391,665,257,324,790 字节，即 356.22 TiB（391.67 TB）。同一区块的 `reward_pool` 换算为 367,450.39 AR。`denomination` 为 1，`redenomination_height` 为 0，面额重定尚未排期。
4. CoinGecko markets 接口在 2026-09-22T00:38:10Z 的快照：价格 4.637 美元，市值排名第 148，流通市值与接口给出的 FDV 同为 304,698,486 美元，24 小时成交额 48,046,233 美元，24 小时涨跌 -3.91%。历史高点 89.24 美元出现在 2021-11-04，距高点 -94.80%。
5. AO 是建在 Arweave 存储之上的并行计算网络，2025 年 2 月 8 日主网上线，代币与 AR 分开，上限 2100 万枚。2026 年 3 月 1 日，ar.io 把 `arweave.net` 网关交回 Forward Research；此后官方把该域名的访问层迁到 HyperBEAM。

外部判断：**观望。** 协议规则、供给上限和当前数据集大小都能核对。捐赠池今天只占已发行供给的约 0.56%，它能不能在通胀奖励继续衰减后付得起复制成本，取决于存储价格和 AR 购买力，协议文档把这一点写进了假设。AO 和网关迁移是 2025–2026 年的结构变化，上传费是否因此上升，还要用后续的 `weave_size` 和捐赠池变动来看。

## 二、起源、背景与发展时间线

公开人物资料把发起人记为 Sam Williams 与 William Jones，早期项目名为 Archain，2018 年 2 月改名 Arweave。能直接核对的起点是黄皮书：主网于 2018 年 6 月 8 日启动。2018 年 7 月 13 日的主网上线报告列出的早期支持者包括 1kx、Arrington XRP Capital、KuCoin Capital 等。报告没有给出可复核的募资总额，二级资料里的轮次金额彼此不一致，这里不采用单一融资数字。

| 时间 | 事件 | 来源 |
| --- | --- | --- |
| 2018-06-08 | 主网上线，创世 5500 万枚 AR | 黄皮书 |
| 2018-07-13 | 项目方发布主网上线报告 | Arweave Medium |
| 2023-03-06 | 2.6 硬分叉激活，高度约 1,132,210；引入 3.6 TB 分区与 SPoRA 哈希链 | 当时报道对创始人说明的转述；机制见 [2.6 规范](https://2-6-spec.arweave.dev/) |
| 2023-10-05 | 2.7.0 于高度 1,275,480 激活，调整 VDF 难度并推迟 2.6 定价切换 | [GitHub N.2.7.0](https://github.com/ArweaveTeam/arweave/releases/tag/N.2.7.0) |
| 2024-02 | AO 测试网公开，计算层开始试用 | AO 主网上线稿对测试阶段的回溯 |
| 2024-03-26 | 2.7.2 于高度 1,391,330 激活协同挖矿 | [GitHub N.2.7.2](https://github.com/ArweaveTeam/arweave/releases/tag/N.2.7.2) |
| 2024-11-13 | 2.8.0 于高度 1,547,120 激活 composite 打包；发行说明署名为 Digital History Association | [GitHub N.2.8.0](https://github.com/ArweaveTeam/arweave/releases/tag/N.2.8.0) |
| 2025-02-03 | 2.9.1 于高度 1,602,350 激活，`replica.2.9` 进入生产；NCC Group 审计该版本 | [GitHub N.2.9.1](https://github.com/ArweaveTeam/arweave/releases/tag/N.2.9.1) |
| 2025-02-08 | AO 主网上线，原生代币与 AR 分离，上限 2100 万枚 | [Business Wire](https://www.businesswire.com/news/home/20250208125254/en/AO-Mainnet-Launches-Ushering-in-a-New-Era-of-Decentralized-Computing-and-Permissionless-Ecosystem-Growth) |
| 2026-03-01 | ar.io 将 `arweave.net` 的运营交回 Forward Research | [ar.io](https://ar.io/articles/arweave-dot-net/) |
| 2026-09-22 | 高度 2,005,867，数据集 356.22 TiB，捐赠池 367,450.39 AR | `arweave.net` 当前区块 |

2.6 把 weave 切成 3.6 TB（3,600,000,000,000 字节）的分区，矿工用自己的地址把分区打包成专属副本。2.8 允许更慢的磁盘仍能挖较大的盘。2.9 把诚实矿工的数据准备从重 CPU 打包改成更快的熵生成加轻量异或，发行说明写明磁盘 IO 成为打包瓶颈。2.6 规范里，单个 3.6 TB 分区要维持约 200 MiB/s 的读取。2.9 之后的挖矿文档把理想读速写成每分区约 5 MiB/s。

## 三、技术机制与网络结构

Arweave 是独立的一层网络，AR 是它的原生资产。数据结在一条只增不减的 weave 上。每个区块同时做两件事：接收新的上传和转账，并抽查历史数据是否还能被读到。

出块使用 SPoRA，并配一个可验证延迟函数（VDF）。矿工不需要把整份数据放进区块，只提交协议抽中的一到两个 256 KiB 召回块。VDF 限制单位时间内能尝试的召回次数，使瓶颈落在保存了多少数据，而不是谁的盘更快。分区按矿工地址打包，同一份明文的不同物理副本才会各自贡献算力。官方协议说明把期望行为写成三条：预算主要花在约 5 MB/s、延迟可接受的存储介质上；数据要摊满盘，而不是反复复制同一小段；新数据进网前，费用要够支付足够多的副本。

存储费分两截。一小部分当场给打包该交易的矿工，其余进入捐赠池。官方文档的定价假设是：用户按当前价格支付约 200 年的复制存储；在代币购买力不变时，存储综合成本每年下降 0.5%（协议称之为 Kryder+，含硬件、电力和运维）就足以让捐赠池的存储购买力在年末与年初相当。文档同时给出过去约 50 年存储成本平均每年下降约 38.5% 的历史对照。0.5% 是协议选用的保守阈值，历史均值是背景，两者都不是对未来成本的预测。

当前区块还给出一个直接的规模读数：356.22 TiB 的唯一数据集大约覆盖 108.8 个 3.6 TB 分区。2025 年 11 月的挖矿文档写过 103 个分区、约 373 TB 的完整副本，和眼下的字节数是同一量级、略小一截，符合数据集继续增长。矿工若保存多份完整副本，物理占用会是 weave 的数倍；那个倍数要看算力和副本分布，本次没有从区块头单独算出全网副本数。

内容政策不由协议统一执行。节点可以自备黑名单，或订阅外部列表，拒绝存储和提供特定交易。官方文档把这称为自愿原则：协议不强制每个矿工保存每一条数据。

## 四、用途、生态与价值来源

AR 的设计用途是支付交易和上传费用，并作为矿工奖励。它不是链上治理投票代币。协议升级靠客户端硬分叉，而不是 AR 持仓表决。

使用方看到的产品是 permaweb：网页、文件和应用数据以交易 ID 寻址，经网关在普通浏览器打开。网关是读取层。2026 年 3 月 1 日之前，公众最常用的 `arweave.net` 由 ar.io 运营；当天 ar.io 把该域名交回 Forward Research，并说明底层数据仍在 Arweave 上，交接期间出现过变慢和超时。ar.io 自己的网络继续用 Wayfinder 在多个网关之间选路，`ar://` 用来避免把链接死绑在一个域名上。AO 官方博文描述了随后的另一次迁移：`arweave.net` 改由 HyperBEAM 节点提供可验证的读取。博文给出的 alpha 数字是 27 个运营方处理了近 400 万次请求；页面没有可核对的发表日期，这组数字只说明迁移已经跑起来。

AO 与 AR 要分开看。AO 主网上线稿称其测试网在上线前处理了超过 15 亿条消息、有超过 100 个项目接入，并写有超过 7 亿美元资产预先桥入测试网。这些是项目方在主网上线当天的主张。AO 代币上限 2100 万枚，上线稿写明 AR 持有人有资格获得 AO。同期报道把长期分配写成大约 36% 给 AR 持有人、64% 给向 AO 转入资产的用户；36/64 没有出现在我读到的 Business Wire 正文里。

可以继续跟踪的采用指标是：`weave_size` 的增量、捐赠池的净流入或净释放、以及上传费用占矿工收入的比例。AO 的消息条数和桥入资产规模不能直接换成 AR 存储需求。

## 五、代币经济与供给结构

| 指标 | 当前值 | 口径日期 / 来源 |
| --- | ---: | --- |
| 流通量 | 65,652,466 AR | CoinGecko，2026-09-22T00:38:10Z |
| 总供应量 | 65,652,466 AR | 同上，`total_supply` |
| 最大供应量 | 66,000,000 AR | 黄皮书；CoinGecko `max_supply` 一致 |
| 流通市值 | 304,698,486 USD | CoinGecko |
| 完全稀释估值（FDV） | 304,698,486 USD | CoinGecko；与流通市值相同 |
| 捐赠池 `reward_pool` | 367,450.39 AR | 高度 2,005,867，按 1 AR = 10^12 Winston |
| 当前区块挖矿奖励 | 0.1462 AR | 同一区块 `reward` 字段 |

尚未挖出的部分是 347,534 枚，约占上限的 0.53%。黄皮书的通胀奖励随区块高度衰减，剩余部分会继续按这个曲线释放，没有一笔集中解锁。按当前高度约 0.146 AR 的区块奖励、黄皮书每年 262,800 个区块的设计节奏，年化新增大约 3.8 万枚，并且还会继续下降。

捐赠池里的 36.75 万枚已经铸出，暂存在协议字段 `reward_pool` 里，等区块奖励不够覆盖存储成本时再释放给矿工。9 月 18 日 arweave.app 把同一类余额标成 Endowment Pool，当时为 366,689.332 AR、高度 2,003,390，和这次读数衔接。它约占 CoinGecko 流通量的 0.56%。池子规模小，当前每个区块仍在发放 0.146 AR 的通胀奖励。价格和存储成本的变化，会先作用在这笔储备上。

创世 5500 万枚如何拆成公募、团队和生态，黄皮书没有给出链上分配表。CoinMarketCap 等二级页面流传过一套百分比和五年锁仓。若按主网上线起算，五年锁仓到 2023 年已经结束，不再决定 2026 年的流通盘。这套百分比不当作协议参数。

面额重定是另一条供给规则：当可用供给（总供给加债务供给再减去捐赠池）低于协议阈值时，协议会把单位乘以 1000。官方文档写明这件事未必发生。当前 `debt_supply` 为 0，捐赠池远小于已发行量，`redenomination_height` 为 0。

## 六、市场位置与历史表现

| 指标 | 数值 | 来源 |
| --- | --- | --- |
| 市值排名 | 148 | CoinGecko，2026-09-22T00:38:10Z |
| 价格 | 4.637 USD | 同上 |
| 24 小时区间 | 4.38–5.16 USD | 同上，`low_24h` / `high_24h` |
| 24 小时涨跌 | -3.91% | 同上，-3.9095% |
| 24 小时成交额 | 48,046,233 USD | 同上 |
| 历史高点 | 89.24 USD（2021-11-04T20:14:42Z） | 距高点 -94.80% |
| 历史低点 | 0.2988 USD（2020-01-30T22:47:36Z） | CoinGecko `atl` |

成交额约占流通市值的 15.8%。这个比例只说明当天换手，不能用来推断存储需求。价格仍比 2021 年 11 月的高点低大约 95%。24 小时下跌 3.91%，不改变协议判断，也不构成方向结论。

CoinGecko 页面把 AR 标在 Binance、OKX、Gate、Bybit 等交易所的现货市场。接口快照本身没有给出这些市场的法律身份。

## 七、治理、安全与关键依赖

协议没有 AR 投票治理。2.8 之后的节点发行说明由瑞士非营利组织 Digital History Association 准备，并写明与更广的生态协作。Forward Research 由 Sam Williams 主导，对外承担 permaweb 和 AO 的孵化；2026 年又重新成为 `arweave.net` 的运营方。客户端提案和主网关域名因此仍然集中在少数组织。

2.9.1 的发行说明写了两点安全事实：该版本由 NCC Group 审计；2.8 composite 打包在较高难度下有一个问题，说明文字写明它不危及数据、代币或共识，`replica.2.9` 用来替换这套打包。本次没有逐份阅读审计报告原文。

读取依赖网关或自建节点。`arweave.net` 在 2026 年换过运营方，并继续迁往 HyperBEAM。数据仍以交易 ID 存在 weave 上，但一次域名切换已经造成过访问变慢。ar.io 的多网关路由是并行的读取方案，不是协议共识本身。

矿工可以拒绝某些内容。对上传者来说，付费进入 weave 不等于每一个网关都会展示它。对运营者来说，永久保存也意味着无法靠协议回滚一条已经确认的数据，只能选择不存储、不提供。

## 八、监管与合规环境

本次核对的官方文档、节点发行说明和主网上线稿里，没有一份监管机构或法院文件把 AR 定性为证券或其他特定法律类别。没有找到，不等于已经获得某种许可。

能核对的合规相关设计是内容政策。协议不提供统一删除。节点用黑名单决定自己保存和对外提供什么。上传违法或侵权内容的责任不会因为“数据在去中心化网络上”而消失；网关和矿工则可以用拒绝服务来执行自己的政策。不同司法辖区对永久存储、节点运营和代币发行的要求不同，这里不把交易所仍在挂牌写成合规结论。

AO 是另一套代币和桥接资产。桥入资产如果包含受监管的质押凭证或稳定币，适用的规则要另看那些资产和桥的运营方，不能从 AR 的存储费用推导。

## 九、催化因素、主要风险与外部研判

已经发生、且会改变观察框架的事有三件：供给接近上限，挖矿奖励不再是早期那种主要的新增供给；2.6 到 2.9 把矿工成本从高速盘推向大容量磁盘；AO 主网和 `arweave.net` 的运营权变更，把计算层和读取层从 2018 年的单一存储叙事里拆了出来。

仍可能改写判断的风险：

| 风险 | 触发条件 | 现在能看到的 |
| --- | --- | --- |
| 捐赠池购买力不足 | 存储成本下降慢于协议假设，或 AR 价格下跌使同样枚数买到的磁盘变少，同时通胀奖励已覆盖不住存储开支 | 文档写明 0.5% Kryder+ 的永续结论不含代币价格变化。当前池子 36.75 万枚，区块奖励仍有 0.146 AR |
| 永久是激励结果，不是物理承诺 | 副本数下降，或矿工集中保存热数据、丢开冷数据 | 协议鼓励均匀复制，也允许矿工自选内容。本次没有全网副本数 |
| 读取层再次集中 | `arweave.net` 或 HyperBEAM 运营方停摆，而用户链接只写了这一个域名 | 2026-03-01 的交接已经出现过超时。ar.io 提供了替代路由 |
| AO 需求停在叙事 | 计算消息增加，但 weave 增量和 AR 上传费不增加 | 上线稿的 15 亿条消息和 7 亿美元是项目方主张，尚未换成存储费序列 |
| 客户端集中 | 硬分叉只由少数组织实现，节点无法独立验证或拒绝 | 2.8 起发行说明署名为 Digital History Association |

外部判断维持观望。AR 的流通盘由 2018 年写定的 6600 万枚上限和随高度衰减的挖矿释放决定，2026 年已经没有一笔会改写供给的集中解锁。后续要看捐赠池何时从净流入转为净释放，以及释放发生时 weave 是否还在增长。24 小时价格不进入这个判断。

若后续区块显示捐赠池持续下降、数据集同时停滞，观望会改成对经济模型的负面结论。若上传费在 AO 和网关迁移之后稳定抬升，并体现为 `weave_size` 加快增长，观望会改成对存储需求的正面结论。两条都还没有出现在 2026-09-22 的这一组读数里。

## 十、信息来源与持续验证

资料截至 2026-09-22。市场数字来自 CoinGecko `coins/markets`（`vs_currency=usd&ids=arweave`），`last_updated` 为 2026-09-22T00:38:10Z。链上读数来自 `https://arweave.net/block/current`，高度 2,005,867，时间戳对应 2026-09-22 08:40（北京时间）。

- 协议与供给：[黄皮书](https://arweave.org/yellow-paper.pdf)；[协议说明](https://docs.arweave.org/developers/development/overview)；[面额规则](https://docs.arweave.org/developers/development/overview/denomination)；[捐赠池说明](https://cookbook.ar.io/protocol/endowment-fund.html)
- 客户端：[2.6 规范](https://2-6-spec.arweave.dev/)；[N.2.7.0](https://github.com/ArweaveTeam/arweave/releases/tag/N.2.7.0)；[N.2.7.2](https://github.com/ArweaveTeam/arweave/releases/tag/N.2.7.2)；[N.2.8.0](https://github.com/ArweaveTeam/arweave/releases/tag/N.2.8.0)；[N.2.9.1](https://github.com/ArweaveTeam/arweave/releases/tag/N.2.9.1)；仓库 [ArweaveTeam/arweave](https://github.com/ArweaveTeam/arweave)
- 主网与计算层：[2018 年上线报告](https://arweave.medium.com/arweave-network-launch-report-b7e7ffac0f75)；[AO 主网，2025-02-08](https://www.businesswire.com/news/home/20250208125254/en/AO-Mainnet-Launches-Ushering-in-a-New-Era-of-Decentralized-Computing-and-Permissionless-Ecosystem-Growth)；[2.9 数据准备算法](https://www.businesswire.com/news/home/20250127112212/en/Arweave-2.9-Upgrade-Introduces-Breakthrough-Data-Preparation-Algorithm)
- 读取层：[ar.io 对 arweave.net 交接的说明](https://ar.io/articles/arweave-dot-net/)；[AO 博文《Anatomy of the decentralized permaweb: part two》](https://ao.arweave.net/blog/decentralized-permaweb-part-two)
- 市场：[CoinGecko markets 接口](https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=arweave)

持续验证：

- 创世 5500 万枚的团队、公募和生态拆分没有黄皮书级别的单一原件。该拆分已不影响 2026 年的流通盘判断；若出现仍在锁仓的官方地址，需要重看供给。
- AO 的 36/64 分配只见于同期报道，不在已读的主网上线稿正文中。它影响 AO 如何分给 AR 持有人，不改变 AR 的 6600 万枚上限。
- 全网独立副本数和矿工集中度没有从这一次区块头算出。副本数若明显下降，会改写“永久”能在多大程度上靠激励维持。

---
title: "阿燃调研：每天一个加密资产 —— Tether（USDT）观察"
category: topics
topic_type: market
crypto_type: asset
coin_id: "tether"
symbol: "USDT"
market_cap_rank: 3
date: "2026-08-27"
time: "16:09"
tags: [加密资产, "Tether", "USDT"]
subjects: [business_market]
summary: "Tether（USDT）是全球市值最大的美元稳定币，由 Tether International 发行，以 1:1 美元储备背书，2026 年流通量约 1846 亿美元，占稳定币市场逾六成。"
tldr: "USDT 是锚定美元的稳定币，储备以美国国债为主，2026 年完成首次 KPMG 全面审计，但面临 MiCA 下欧盟准入受限与储备透明度争议。"
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

Tether（USDT）是全球市值排名第三的加密资产、市值最大的美元稳定币。它由 Tether International, S.A. de C.V. 发行，采用"1:1 美元储备背书 + 链上代币"模式，本身不运行自有区块链，而是依托多条公链发行代币。截至 2026 年 6 月 30 日，USDT 流通量约 1846 亿美元，占稳定币市场逾六成（Tether Q2 2026 公告）。

核心事实：Tether 的储备以美国国债为主（2026 年 3 月 31 日约 1410 亿美元），2026 年 8 月完成由 KPMG U.S. 出具的 2025 财年财务报表无保留意见审计。同时，它面临欧盟 MiCA 框架下交易所准入受限（2026 年 7 月 1 日起）、储备透明度历史争议、以及涉及被冻结伊朗资金的诉讼等外部压力。

外部研判：USDT 已从交易工具演变为新兴市场"数字美元"基础设施，官方称服务超 6.5 亿用户。其最大风险集中在监管合规（尤其欧盟）与储备治理的持续可信度，而非技术本身。

## 二、起源、背景与发展时间线

Tether 的起源可追溯至 2014 年。项目最初以 Realcoin 名义，由 Brock Pierce、Reeve Collins 和 Craig Sellars 于 2014 年 7 月在中国香港创立，目标是创建一种与美元挂钩、用于比特币交易的稳定币。项目随后更名为 Tether，并在比特币的 Omni 层（前身为 Mastercoin 协议）上发行首批代币（2014 年 10 月），同年 11 月正式更名 Tether（Messari 项目档案）。

关键时间线如下：

| 时间 | 事件 |
|------|------|
| 2014 年 7 月 | 以 Realcoin 名义创立（香港），创始人为 Brock Pierce、Reeve Collins、Craig Sellars |
| 2014 年 9 月 | Bitfinex 运营方 Potter 与 Devasini 在英属维尔京群岛设立 Tether Limited（Nasdaq 时间线） |
| 2014 年 10 月 | 首批 USDT 在比特币 Omni 层发行 |
| 2014 年 11 月 | 项目更名为 Tether |
| 2018 年 | Bitfinex 因支付处理商冻结约 8.5 亿美元资金，Tether 向其提供贷款（NYAG 调查背景） |
| 2021 年 2 月 | 与纽约州总检察长办公室达成和解，支付 1850 万美元罚金（Tether 官方公告） |
| 2023 年 10 月 | 任命 Paolo Ardoino 为 CEO，2023 年 12 月接替 Jean-Louis van der Velde 就任 |
| 2026 年 5 月 | 曼哈顿联邦法院受理要求 Tether 移交 3.44 亿美元被冻结 USDT 的诉讼 |
| 2026 年 7 月 1 日 | MiCA 过渡期结束，USDT 失去欧盟受监管交易所订单簿准入 |
| 2026 年 8 月 13 日 | KPMG U.S. 对 Tether 2025 财年财务报表出具无保留意见审计 |

## 三、技术机制与网络结构

需要区分三个层面：协议、网络与代币。

- **协议**：Tether 不运行自有区块链。USDT 最初基于比特币的 Omni 层（前身 Mastercoin）协议发行，该协议允许在比特币网络上创建代币（Messari；Bitget 白皮书解读）。
- **网络**：USDT 现已部署在以太坊、波场（Tron）、Solana、Avalanche、Celo 等多条公链上，通过跨链桥（如 Wormhole 的 NTT 框架）实现链间转移。
- **代币**：USDT 是锚定美元的稳定币，设计上每发行 1 USDT 对应 1 美元储备资产。

技术机制的核心是"储备金证明"（Proof of Reserve）：Tether 声称每一单位 USDT 都有等值美元资产背书，通过定期发布储备报告与第三方鉴证（attestation）来验证。官方白皮书描述其基于比特币区块链、采用储备金证明机制运行（Bitget 白皮书；btc-echo）。

需要说明：储备鉴证（attestation）与全面审计（audit）是不同概念。Tether 多年来发布的是季度鉴证报告（由 BDO 出具），2026 年 8 月才首次完成由 KPMG U.S. 出具的 2025 财年财务报表全面审计（Tether 官方公告）。

## 四、用途、生态与价值来源

USDT 的价值来源是"数字美元"的流动性桥梁功能，主要用途包括：

- **加密交易计价与结算**：作为交易所的主要交易对与避险工具，是加密市场流动性的关键载体。
- **跨境支付与汇款**：用于新兴市场的国际支付、汇款与美元储蓄（The Block）。
- **美元储蓄与价值存储**：在通胀或本币不稳地区，USDT 被用作美元替代储蓄工具。

生态规模：官方称 USDT 服务超 6.5 亿用户（Tether 2026 年 8 月审计公告），2026 年第二季度新增超 3000 万用户（Tether Q2 公告）。Tether 生态还延伸至代币化黄金（Tether Gold / XAU₮，2026 年 Q2 持仓约 146.2 吨）与机构代币化平台 Hadron（2026 年 8 月与沙特 First Data、BKN301 合作）。

价值来源的实质：USDT 的价值锚定于 Tether 的储备资产（以美国国债为主）及其兑付能力，而非任何链上协议收益。其市场地位建立在流动性与网络效应之上。

## 五、代币经济与供给结构

USDT 是中心化发行的稳定币，供给由 Tether 公司控制，无挖矿、无质押发行。

| 指标 | 数据 | 来源 |
|------|------|------|
| 流通量（2026-06-30） | 约 1846 亿美元 | Tether Q2 2026 公告 |
| 稳定币市场份额 | 逾 60% | Tether Q2 2026 公告 |
| 总资产（2026-06-30） | 1877.5 亿美元 | Tether Q2 2026 公告 |
| 总负债（2026-06-30） | 1836.4 亿美元 | Tether Q2 2026 公告 |
| 超额储备（2026-06-30） | 41.1 亿美元 | Tether Q2 2026 公告 |
| 超额储备（2026-03-31） | 82.3 亿美元（历史高点） | Tether Q1 2026 公告 |
| 储备构成（2026-03-31） | 美国国债约 1410 亿、黄金约 200 亿、比特币约 70 亿美元 | Tether Q1 2026 公告 |

供给机制：USDT 的发行与销毁由 Tether 依据储备资产增减进行，属于"储备背书型"供给，而非算法或去中心化治理决定。CoinGecko 快照中流通量/总量/上限数据缺失，未能验证。

## 六、市场位置与历史表现

市场位置（截至资料截点 2026-08-27，CoinGecko 快照）：市值排名第 3，价格、流通市值、FDV、成交额、涨跌、历史高低点等字段在快照中均缺失，未能验证。

外部数据补充（非 CoinGecko 快照，供参考）：
- 2026 年 7 月，USDT 市值一度接近 1900 亿美元，短暂超过以太坊成为市值第二大加密资产（Pluang，2026-07-16）。
- 2026 年 5 月至 7 月，USDT 市值从近 1900 亿美元回落约 54 亿美元至约 1840 亿美元（Pluang，2026-07-20）。
- 同期稳定币市场整体收缩超 124 亿美元，为四年来最大回撤，USDT 跌幅相对较小（Pluang，2026-07-17）。

历史表现要点：USDT 长期维持接近 1 美元的锚定，其市值随加密市场周期与美元需求波动。2021 年 NYAG 和解时市值约 340 亿美元，至 2026 年已增长至约 1840 亿美元（Tether 2021 公告与 Q2 2026 公告对比）。

## 七、治理、安全与关键依赖

**治理结构**：Tether 是中心化公司治理，非去中心化协议。发行主体为 Tether International, S.A. de C.V.（萨尔瓦多注册），母公司为 Tether Holdings Limited。所有权穿透：Tether 与 Bitfinex 同属 iFinex 集团，最终控制人为 Giancarlo Devasini、J.L. van der Velde、Paolo Ardoino、Phil Potter、Stu Hoegner 等（法院文件；ICIJ Paradise Papers 调查）。CEO 为 Paolo Ardoino（2023 年 12 月就任）。

**关键依赖**：
- 储备资产托管与审计（BDO 季度鉴证、KPMG 年度审计）
- 银行与支付渠道（美国国债、回购市场）
- 多条公链的跨链基础设施

**安全与事件**：
- 2021 年 NYAG 和解：Tether 与 Bitfinex 就 2018 年贷款披露问题支付 1850 万美元罚金，未承认不当行为（Tether 官方公告）。
- 2026 年 5 月诉讼：曼哈顿联邦法院受理请求，要求 Tether 将逾 3.44 亿美元与伊朗伊斯兰革命卫队相关的 OFAC 冻结 USDT 移交给恐怖主义受害者（CoinDesk，2026-05-14）。

## 八、监管与合规环境

Tether 面临的主要监管动态：

| 地区/机构 | 动态 | 来源 |
|-----------|------|------|
| 欧盟（MiCA） | 2026 年 7 月 1 日过渡期结束后，USDT 失去欧盟受监管交易所订单簿准入；Tether 未申请 MiCA 授权 | The Paypers；Gate 新闻 |
| 欧盟（Revolut） | Revolut 宣布 2026 年 8 月 31 日起对欧盟用户下架 USDT | MEXC News；TradingView |
| 美国（NYAG） | 2021 年和解，支付 1850 万美元罚金 | Tether 官方公告 |
| 美国（法院） | 2026 年 5 月受理 3.44 亿美元冻结资金移交诉讼 | CoinDesk |
| 美国（审计） | KPMG U.S. 2026 年 8 月出具 2025 财年无保留意见审计 | Tether 官方公告 |

欧盟合规是当前最突出的监管压力点。Tether 在 2024 年已停止发行欧元挂钩的 EURT 稳定币，并在 2026 年 7 月截止日前减少欧洲风险敞口（Gate 新闻）。

## 九、催化因素、主要风险与外部研判

**潜在催化因素**：
- 完成首次 KPMG 全面审计，增强储备透明度与机构信任（2026 年 8 月）。
- 新兴市场"数字美元"需求持续增长，官方称用户超 6.5 亿。
- 代币化业务扩展（黄金 XAU₮、Hadron 平台）。

**主要风险**：
- **监管风险**：欧盟 MiCA 下交易所准入受限，若其他司法辖区跟进，可能压缩流通渠道。
- **储备透明度争议**：历史上关于储备充分性与披露的质疑长期存在，虽经审计缓解，但季度鉴证与全面审计的差异仍需关注。
- **法律诉讼**：3.44 亿美元冻结资金诉讼可能为稳定币发行方设定先例。
- **集中化风险**：中心化治理与单一公司控制，存在单点失败风险。

**外部研判**（区分事实与判断）：从公开事实看，Tether 的储备规模与审计进展显著改善其可信度；但欧盟合规收缩与法律诉讼构成中期不确定性。其市场地位高度依赖储备治理的持续可信度与全球美元需求，这两者均非 Tether 单方可控。

## 十、信息来源与未能验证

**实际检索来源**：
- Tether 官方新闻（tether.io）：NYAG 和解公告、Q1 2026 公告、Q2 2026 公告、KPMG 审计公告
- CoinDesk：3.44 亿美元诉讼、Q2 2026 储备报告
- The Block：稳定币排名、NYAG 和解、Q1 2026 储备
- Messari：Tether 项目档案（起源与 Omni 层）
- Nasdaq：Tether/Bitfinex 时间线
- ICIJ：Paradise Papers 所有权调查
- The Paypers、Gate 新闻、MEXC News、TradingView：MiCA 与 Revolut 下架
- Pluang、KuCoin、Forkast、crypto.news：市场数据与 Q2 报告
- CourtListener：Tether 诉讼文件（所有权结构）

**CoinGecko markets 接口**：本调研未直接调用 CoinGecko markets API。用户提供的 CoinGecko 快照中，价格、流通市值、FDV、24 小时成交额、24 小时涨跌、流通量/总量/上限、历史高低点等字段均为缺失（"—"），故这些数据未能验证。

**未能验证**：
- CoinGecko 快照中的全部市场数字（价格、市值、FDV、成交额、涨跌、供给、历史高低点）。
- 官方声称的"6.5 亿用户"与"3000 万季度新增用户"为项目方主张，无独立第三方核实。
- USDT 在 CoinGecko 快照中的流通量/总量/上限具体数值。
- 历史高点与历史低点的具体价格与日期。
- 部分市场数据（如 1900 亿美元市值峰值）来自第三方媒体，与 CoinGecko 快照口径可能不一致。

**冲突信息说明**：关于 Q2 2026 超额储备，Tether 官方公告为 41.1 亿美元，第三方报道（Forkast、Yahoo Finance）表述为"从 Q1 的 82.3 亿降至 41.1 亿"，两者一致。关于流通量，Tether 官方称 1846 亿美元，第三方（The Block）称约 1840 亿美元，存在轻微口径差异，均纳入上述来源。
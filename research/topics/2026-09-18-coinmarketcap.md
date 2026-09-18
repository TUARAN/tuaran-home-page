---
title: CoinMarketCap 观察：零售默认行情板如何把成交量做成注意力
category: topics
topic_type: product
subjects: [business_market]
entity_type: product
content_type: analysis
date: 2026-09-18
time: "09:50"
tags: [CoinMarketCap, CMC, 加密数据, 市值排名, DexScan, Binance, CoinGecko]
summary: CoinMarketCap 不撮合交易，却决定大多数人看见的价格、市值和交易所座次；2020 年被币安收购后，数据口径与所有权冲突一直并存。
tldr: 它是零售端默认的加密行情聚合器：价格按成交量加权，市值用流通量，交易所座次掺进流量和流动性。榜单本身会被刷量、供给口径和付费加急扭曲。行业观察可以跟进，但必须和 CoinGecko、Kaiko、DefiLlama 对表；大陆读者不应把它当成境内合法定价或开户入口。
assistance: cursor
model: grok-4.6
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> **风险与合规提示：** CoinMarketCap 展示的价格、市值、成交量和排名都是聚合结果，会被交易所上报、刷量、流通量口径和抽样频率改写。资料整理用于理解数据平台，不构成投资、开户、上架或法律建议。中国人民银行等八部门《银发〔2026〕42 号》把境内虚拟货币相关业务列为非法金融活动，禁止口径覆盖交易、兑换、中介和**定价**。违背公序良俗的相关民事法律行为无效，损失自行承担。

## 一、先给结论

CoinMarketCap（CMC）是 2013 年 5 月上线的加密资产行情站。它不托管资金、不撮合订单，却提供大多数零售用户第一眼看到的价格、流通市值、24 小时成交额和交易所座次。2020 年 3 月 31 日，币安完成收购；交易条款未公开，媒体区间约 3–4 亿美元，结构以股权加 BNB 为主。

| 问题 | 可核验的答案 |
|---|---|
| 它卖什么 | 免费行情注意力 + 付费 API + 上架/更新加急 + 首页品类位 |
| 法律文本里的运营主体 | [服务条款](https://coinmarketcap.com/terms/)（2025-11-24）：香港 **CoinMarketCap Mgmt Limited** |
| 所有权 | 币安体系；收购方公开口径为 Binance Capital Management。条款写「独立运营」，算法权重不对外公开 |
| 价格怎么来 | 各交易对成交量加权平均，再换成美元；停提、区域隔离和显著离群价会被剔除 |
| 市值怎么来 | 参考价 × **已核验流通量**（类比股票流通股本），不是总量或 FDV |
| 长尾资产 | DexScan 按合约地址自动索引；官方称跟踪 5,000 万+ 资产、约 70 条链 |
| 付费能否买排名 | 官方写明不接受流通量、交易所座次等「影响排名」的付费更新；加急的是资料页、交易所接入和首页品类位 |

2026-09-18 首页快照：全球加密市值约 **2.63 万亿美元**，24 小时成交约 **715.7 亿美元**，比特币占比约 **58.53%**；比特币约 76,512 美元、流通市值约 1.53 万亿美元。这些数字只代表当日页面，次日就会变。

对行业观察：**跟进**，把它当公开零售口径，同时用 CoinGecko、Kaiko、DefiLlama 交叉。对大陆读者：把它当浏览工具可以**观望**；把它当开户入口、兑换通道或境内定价依据，**不跟进**。把 CMC 名次当成买卖信号，**不跟进**。

## 二、事实层

### 2.1 产品边界：行情板，不是交易所

首页自我定位是数据公司，明确不提供哪枚币该买、何时该买的建议。用户在站内看到的「去交易」，是跳到已接入的交易所或链上池，资金不经过 CMC 托管。

和站内[加密货币交易所观察](/articles/research/topics/cryptocurrency-exchanges)要分开读：交易所比的是成交、牌照和储备；CMC 比的是**谁的数字被写进默认排行榜**。后者会反向影响前者的获客。

当前公开产品面：

| 层 | 做什么 | 谁在用 |
|---|---|---|
| 资产榜 | 按流通市值排序的已核验币 | 媒体、钱包、零售 |
| 交易所榜 | 成交额、流动性、周访问、Confidence | 想被看到的交易所 |
| DexScan | 按链上池自动索引未核验合约 | 迷因币、新链、发射台 |
| 指数 | CMC20 / CMC100，月度再平衡 | 展示、API、首页上的 CMC20 Index DTF |
| API | 标准行情 + DEX 端点 + x402 按次付费 | 钱包、终端、研究产品 |
| 内容 | Academy、社区、Fear & Greed、CMC AI | 停留时间和广告 |

DexScan 把「上 CMC」从人工审核扩成链上扫描。CMCP 文档（2026-07-23 更新）写：多数资产经链上基础设施免费自动跟踪，已超过 5,000 万个；免费人工队列没有时限承诺，可能数天到数年。首页另写：覆盖约 70 条链、估计超过 97% 的代币，全球交易对超过 200 万。两套数字量的不是同一件事：5,000 万是合约地址量级，首页主表仍是少数已核验、有流通市值的资产。

### 2.2 公司归属与主体

| 项 | 公开资料 | 怎么读 |
|---|---|---|
| 创始 | 2013-05，纽约程序员 Brandon Chez | 官网页脚与 Wikipedia |
| 早期形态 | 个人站，几乎不公开露面 | 2018 年 WSJ 专访 |
| 收购交割 | 2020-03-31；2020-04-02 宣布 | The Block、Bloomberg、币安 |
| 对价 | 未披露；Forbes / The Block 转述约 3–4 亿美元，股权 + BNB | 二手，不能当审计数 |
| 创始人去向 | Chez 卸任 CEO，短暂留任顾问 | 同期官方口径 |
| 过渡负责人 | CSO Carylyne Chan 任临时 CEO | CoinDesk / The Block |
| 现任公开职务 | LinkedIn 公司页把 **Mai Lu（Rush）** 列为 CEO，标注 2021-10 起 | 个人页，不是监管备案 |
| 服务条款主体 | 香港 CoinMarketCap Mgmt Limited | [Terms](https://coinmarketcap.com/terms/)，2025-11-24 |
| Google Play 开发者 | 同一香港公司，葵涌工业大厦地址 | 应用商店 |
| 诉讼中出现的美国实体 | CoinMarketCap OpCo, LLC（特拉华） | 亚利桑那州相关诉讼转述 |
| 收购方 | Binance Capital Management（英属维尔京群岛口径，见诉讼和媒体） | 与 Binance.com 是否「无股权关系」，诉讼材料里有过辩称，外部无法核验完整控制链 |

条款专设 Disclosure Policy：自称独立运营，上市和排名标准对任何一方一视同仁，包括母公司旗下的币安和 BNB。同一段也承认币安和 BNB 都列在站上。独立是政策声明，不是可复现的算法披露。

### 2.3 时间线

| 时间 | 事件 | 来源 |
|---|---|---|
| 2013-05 | 站点上线，按市值给加密资产排序 | 官网自述 |
| 2018-01 | 从价格计算中剔除韩国交易所（当地溢价长期偏高），XRP 等市值大幅回落，引发市场混乱 | Wikipedia 引 WSJ；Chez 致信 WSJ |
| 2018 | WSJ 称 CMC 已成为全球最热门网站之一 | WSJ |
| 2019-03 前后 | 资产管理人 Bitwise 向 SEC 提交材料，称向 CMC 报数的交易所中约 95% 的成交量不真实 | CoinDesk 引 Bitwise |
| 2019-07 | Forbes：CMC 前 25 名交易所里超过 75% 曾被怀疑虚报成交；广告收入估算约 2,000–3,000 万美元/年 | Forbes |
| 2019-11 | 推出 Liquidity 指标，目标是对抗假成交 | Bloomberg |
| 2019-11 起 | 收购洽谈（The Block 转述知情人士） | The Block |
| 2020-03-31 / 04-02 | 币安完成并宣布收购；Chez 卸任 | 币安、Bloomberg |
| 2020-05-13/14 | 交易所默认座次加入 Web Traffic Factor，币安升至第一；此前按调整成交额币安并不稳居榜首 | Decrypt、The Block |
| 2021-11 | Squid 等欺诈币被媒体引用 CMC 页面作为警示材料 | NYT、Vice |
| 约 2023–2024 | DexScan 上线，扫描 50+ 链、100+ DEX | CMC Academy |
| 2024-01-01 | CMC20 指数基期定为 100 | [指数方法论 PDF](https://s3.coinmarketcap.com/uploads/CoinMarketCap_20_Index_Methodology.pdf) |
| 2025-11-24 | 服务条款最近一次标注更新 | 官网 Terms |
| 2026-05-29 | 衍生品未平仓改为单边口径，双边数字除以 2 | 官方 Volume & OI 说明 |
| 2026-07-23 | CMCP 加急价目更新：币页约 5,000 美元、交易所约 5 万美元、DexScan 链+DEX 8 万美元 | 官方 CMCP |
| 2026-08 | 《Exchange Monthly Report》：11 家样本现货+衍生品合计 4.23 万亿美元，币安 43.30% | [官方月报](https://coinmarketcap.com/events/august-exchange-monthly-report/) |

### 2.4 数据怎么算

官方把关键定义拆在帮助中心，而不是藏在营销页。

**价格。** 一枚资产的展示价 = 各交易对报价的成交量加权平均，再按 CMC 自己的参考价换成美元。成交占比高的市场权重更大。出现以下情况会剔除：提现/充值关闭、监管导致区域外无法买入（标 `*`），或算法判定显著离群（标 `***`）。2018 年剔除韩国溢价，是同一逻辑的早期版本。

**供给与市值。** 帮助中心把市值拆成四层：FDV（最大供给 × 价）、已铸造市值（总量去销毁 × 价）、已解锁市值、**流通市值**。主榜用流通市值，类比股票的 public float，意图是减少锁仓筹码把名次做上去。核验流通量通常要求：至少 3 家 CMC 已跟踪交易所上有实质成交，并提交可核验材料。过不了核验的资产可以有页面，但标成 Unranked，改按 24 小时成交额排。稳定币、隐私币、封装资产、交易所平台币，官方承认必须人工裁量。

**成交额。** 交易对成交额 = 交易所以计价货币上报的 24 小时量 × CMC 该计价资产美元价。资产成交额加总时，异常市场会打星号并剔除。交易所层再拆：

| 口径 | 含义 |
|---|---|
| Reported Volume | 全部现货市场上报量 |
| Adjusted Volume | 去掉零手续费和交易挖矿市场 |
| Liquidity Score | 模拟约 100–20 万美元市价单的滑点，0–1,200 分，约每 2 小时刷新 |
| Web Traffic Factor | Similarweb / Ahrefs 等流量代理，相对打分，榜首固定 1,000 |
| Confidence | 用流动性、流量、逐笔成交估计「该有的量」；高于 75% 为高，50–75% 中，低于 50% 低。官方写明：低置信**不是**洗售证明 |

交易对座次由 Reported Volume、Liquidity Score、Web Traffic 输入机器学习模型，权重不公开。交易所座次同样混合流量、流动性、成交和「对上报量真实性的信心」。

**指数。** CMC20 按 CMC 市值排名取前 20，剔除稳定币和 WBTC、stETH 等封装资产，市值加权，每月再平衡，美元计价，约每 5 秒刷新。指数由 CMC 自己拥有和管理；方法论 PDF 写明遵循 CMC 既有价格与流通量口径。2026-09-18 首页还列出 **CoinMarketCap 20 Index DTF**（约 158.85 美元、流通市值约 554 万美元）。指数方法论没有逐条解释这个 DTF 代币与指数本身的合约关系，二者不能直接当成同一个产品。

### 2.5 商业模式：免费榜单，收费的是速度和位置

2019 年 Forbes 把收入主引擎写成广告，量级估算 2,000–3,000 万美元。收购时 The Block 写过，币安内部讨论过从广告转向向交易所收订阅。2026 年能直接报价的是三类：

**1. API 订阅**（[定价页](https://coinmarketcap.com/api/pricing/)，2026-09-18 读取）

| 档 | 标价 | 月度 credits | 频率 |
|---|---:|---:|---|
| Basic | 免费 | 15,000 | 60 秒 |
| Builder | 29 美元/月 | 150,000 | 60 秒 |
| Startup | 79 美元/月 | 450,000 | 实时 + WebSocket |
| Growth | 299 美元/月 | 2,000,000 | 实时 |
| Professional | 699 美元/月 | 5,000,000 | 实时 |
| Enterprise | 定制 | 30,000,000 量级 | 实时，SLA 99.95% |

多数行情接口按返回条数计费（常见 250 条 1 credit）；DEX 家族按次 1 credit。商业许可覆盖 Basic 到 Professional，但限制为**一个产品、最多约 10 万用户**，不得把数据再卖成独立 API。另有 x402 按次：例如 `/x402/v3/cryptocurrency/quotes/latest` 标 0.01 USDC / 次。平台宣传 ISO/IEC 27001、27701 以及 SOC 1 / SOC 2。

CoinGecko 自己的对比文声称，同等生产查询下 CMC 可能贵一个数量级，因为它按返回点数扣 credit。这是竞争对手口径，只能当对照，不能当审计。

**2. CMC Priority（加急）**

| 项目 | 公开标价 | 官方边界 |
|---|---|---|
| 币页更新/上架（C1） | 约 5,000 美元，约 24 小时；试点可短于 2 小时 | 不含流通量（影响排名） |
| 交易所更新/上架（C2） | 约 50,000 美元（3 万接入 + 2 万年费），约 14 个工作日 | 不保证名次，不教「打榜」 |
| DexScan 链 + DEX | 80,000 美元 | 新链「第一天可被搜到」 |
| 首页 trending 品类 | 200,000 美元 / 10 天 | 明确是位置，不是排名算法 |
| 品类页 / 审计徽章 / 钱包 logo | 1–5 万美元 + 月费 | 展示位 |

官方反复写：向员工行贿会导致拉黑和下架；加急只处理不改名次的字段。价格仍可以买到**被看见的速度**和**首页货架**。对发射台项目，这和[Pump.fun](/articles/research/topics/pump-fun)那种链上自动发现是两条通道：一条付 gas，一条付 CMC 工单。

**3. 广告与流量。** Semrush 记 2026 年 7 月 coinmarketcap.com 约 **5,345 万次访问**，较 6 月降 3.25%，平均停留约 9 分 17 秒。LegalClarity 转述 2026 年初月访约 5,500–7,400 万，低于上一轮牛市高峰。流量代理不是日活，也不能和 CoinGecko 的访问次数直接加减。

### 2.6 和 CoinGecko 的分工

两边都做聚合，审查层不一样。CMC 自己的 Academy 文把差别写得很直：CMC 强在**交易对**（价格加权、Liquidity、Confidence）；CoinGecko 的 Trust Score 把交易所质量拆成流动性、网络安全、监管、事故、储备证明，流动性权重最高。

实务上：

| | CoinMarketCap | CoinGecko |
|---|---|---|
| 零售心智 | 仍是「市值榜」默认入口 | 开发者和「更干净的成交」用户更多提到 |
| 成交清洗 | Adjusted Volume + Confidence | Trust Score、另做可信成交榜 |
| 长尾 | DexScan 合约海 | 同样有链上发现，体量叙事不同 |
| 所有权 | 币安 | 独立于头部交易所（Gecko Labs） |
| 2026-08 交易所月报 | 把 11 家现货+衍生品加总，币安 43.3% | 另有 2025 现货年份额研究，口径不同 |

站内交易所文已经用过这两套数：CMC 月报放大合约盘，CoinGecko 年份额看现货。同一天的座次可以对不上，因为分子分母不是同一个市场。

### 2.7 已经被记录的扭曲

**上报量。** Bitwise 2019 年向 SEC 的材料，是机构后来不把 CMC 原始成交额当真相的起点。Forbes 2019 年把问题概括成：假量研究报告已经出来，CMC 前排仍大量是被点名的盘。Liquidity、Adjusted Volume、Confidence 都是对这个历史的产品回应，不是对假量的消除证明。

**所有权后的座次。** 2020 年 4 月 3 日，Decrypt 写过币安按调整成交额排第 15，上报量 67 亿美元、调整量 21 亿美元。约六周后，默认座次改成偏流量，币安拿满分 1,000 排第一；「潜在可疑」对照数字被拿掉。CZ 推文承认当时排名「heavily biased towards web traffic」。Chan 称 CZ 的推特是研究输入之一，并重申独立。时间线和结果对外观察者可见，决策过程不可见。

**韩国溢价。** 2018 年 1 月一次方法论调整，足以让市值榜和价格一起跳。Chez 事后说没料到影响这么大。这说明 CMC 的「参考价」一旦被钱包和媒体当全球价，剔除或纳入某个法币岛，会变成市场事件。

**诉讼。** 公开检索能见到针对 CMC 排名（包括 HEX 等相关主张）的美国诉讼，以及 CoinMarketCap OpCo 作为被告。截至撰写时，未见一份可当作终局判决的胜负结论；主张仍是主张。

## 三、结构分析

### 3.1 它卖的是「被默认引用」

加密没有统一交易所。价格、市值、成交必须有人聚合，否则媒体、钱包、税务软件和零售对话无法开口。CMC 先占据了这个位置：2013 年把股票市值框架套到比特币之后的资产上，2018 年已经是全球流量头部。币安买下它，买的是**用户心智**，不是撮合引擎。CZ 当时的原话大意是：赚钱能力不如币安，但用户比任何加密产品都多。

默认引用会自我强化。交易所为了出现在「BTC 市场」列表里，必须给 CMC 接 API；项目为了被搜到，要走审核或 DexScan；钱包为了少维护数据，直接调 CMC。数据源越集中，刷量、锁仓叙事、付费加急的回报越高。

### 3.2 方法论是过滤器，权重是黑箱

CMC 现在同时做三件事：收交易所 API、扫链上池、用模型给上报量打分。前两件可核对（交易对列表、合约地址）。第三件故意不公开阈值，理由是防止被 gaming。结果是：用户能看见 Confidence 色条，不能自己重算为什么这家是 900 分、那家是 300 分。

这对「独立于币安」的声明构成结构限制。即使员工真心不给 BNB 开后门，外部也没有办法证伪。能做的只有对照：同一日 CMC 现货榜、CoinGecko Trust Score、DefiLlama 储备是否指向同一批名字。站内交易所文 2026-09-13 的快照已经显示过分裂：CMC 现货额靠前的名字，和 CoinGecko 按 Trust Score 的前三（Coinbase、币安、Kraken）不是同一张表。

### 3.3 付费加急把「上榜」拆成两层

DexScan 让几乎任意合约都能被搜到，降低了「没上 CMC」的耻辱感，也把 5,000 万垃圾合约和数百个主榜资产叠在同一个品牌下。人工核验、流通量勾选、交易所 API 接入，仍是稀缺的。CMCP 把稀缺做成价目表：5,000 美元换资料页速度，20 万美元换 10 天首页品类。官方用「不卖排名」划线，商业上卖的是**被看见的概率**。

新链愿意花 8 万美元做 DexScan 接入，因为发射台项目的生命周期以小时计，搜索可见性就是流动性。这和 Pump.fun 把发现期留在自有曲线上，是同一场注意力竞争的两个货架。

### 3.4 指数和 DTF：从引用到产品

CMC20 把自家排名再做成指数，再在首页挂一个可交易的 DTF。数据公司一旦让指数可买，就从「描述市场」走进「参与市场」。方法论仍用 CMC 价格和流通量，等于用自己的口径给自己的产品定价。规模目前很小（快照市值约数百万美元），方向已经不是纯广告站。

## 四、外部研判

这是观察，不是对任何资产或 API 套餐的购买建议。

**1. CMC 仍是零售默认板，机构默认不把它的原始成交额当真相。**  
流量、媒体引用、钱包集成仍在。Bitwise 之后，认真的成交研究都会另做清洗或改用 Kaiko、CoinGecko Trust、监管报表。两套世界可以长期共存：零售看市值榜，机构看深度和储备。

**2. 币安所有权是永久的利益冲突，不是一次公关事件。**  
2020 年 5 月的流量座次，是冲突变成可见结果的案例。之后 Liquidity 和 Confidence 补回来一部分，但权重仍不公开。读币安在 CMC 上的名次，应同时打开 CoinGecko 和 DefiLlama。把「CMC 第一」写成「全球第一交易所」，是在复制母公司的分发渠道。

**3. DexScan 让 CMC 变成迷因币搜索引擎，主榜的稀缺性反而更值钱。**  
5,000 万合约地址不能当「有 5,000 万种可投资资产」。主榜核验、三所成交、流通量勾选，才是名次游戏。付费加急会让有预算的项目先出现在资料页和首页货架上；这改变发现顺序，不自动改变链上基本面。

**4. 对大陆读者，定价两个字已经写进 42 号文。**  
CMC 的核心输出就是美元价格和市值。浏览公开页面、做行业对比，和把 CMC 价当成境内交易、结算或产品定价，不是同一档风险。后者按现行规则应视为不跟进。API 接入面向境内用户的行情/交易产品，同样落在禁止口径附近。

**5. 跟进清单可以很具体。**  
继续看：官方方法论有没有改流通量规则、月报样本有没有换、Confidence 是否开始对母公司交易对给出可核对的统计、CMCP 价目有没有把「不卖排名」这条线往后移、CMC20/DTF 规模有没有从数百万美元涨到需要单独当产品看。

当前判断：作为公开零售数据源，**跟进观察，置信度中等**；作为单一真相来源或投资信号，**不跟进**。对大陆居民的交易和定价用途，**不跟进**。

## 五、未能验证

- 收购对价的准确金额、现金/股权/BNB 比例、交割后的完整股权图。
- CoinMarketCap Mgmt Limited、OpCo LLC 与币安各持牌/无牌实体之间的控制链和利润上缴。
- 交易所座次和 Confidence 的模型权重、训练数据、是否对币安交易对使用同一套阈值。
- 2019 年广告收入 2,000–3,000 万美元：Forbes 估算，其后没有公开年报。
- 月活、注册用户、App 日活：只有 Semrush 类访问次数，没有审计口径。
- DexScan「5,000 万+」是否去重、是否含已销毁/钓鱼合约、70 条链名单的完整表。
- 首页 CMC20 Index DTF 的合约、托管、与指数 PDF 的跟踪误差。
- Mai Lu 作为 CEO 的任命文件；LinkedIn 不是公司登记。
- HEX 等相关诉讼的最新程序状态和实体责任。
- API「一个产品 10 万用户」许可在实际执法中的边界。
- CoinGecko「CMC 贵 24 倍」的测算是否用了 2026-09 的最新 credit 规则（官方已把部分接口从每 100 条改为每 250 条）。

查证路径：帮助中心方法论页、Solactive/指数 PDF、CMCP 价目、API 定价页、The Block / Decrypt 对 2020-05 座次的原始报道、Bitwise 致 SEC 材料、PACER 上的 OpCo 诉讼、Semrush/Similarweb 月报、与 CoinGecko Trust Score 的同日截图对照。

## 六、信息来源与说明

**一手 / 官方**

- [coinmarketcap.com](https://coinmarketcap.com/) 首页快照（2026-09-18）：全球市值、成交、BTC 占比、CMC20 DTF
- [Terms of Use](https://coinmarketcap.com/terms/)（2025-11-24）：香港主体、独立声明
- [How are prices calculated](https://support.coinmarketcap.com/hc/en-us/articles/360015968632-How-are-prices-calculated-on-CoinMarketCap)
- [Market Capitalization](https://support.coinmarketcap.com/hc/en-us/articles/360043836811-Market-Capitalization-Cryptoasset-Aggregate)
- [Supply](https://support.coinmarketcap.com/hc/en-us/articles/360043396252-Supply-Circulating-Total-Max)
- [Volume & Open Interest](https://support.coinmarketcap.com/hc/en-us/articles/360043395912-Volume-Open-Interest-Market-Pair-Cryptoasset-Exchange-Aggregate)
- [Ranking](https://support.coinmarketcap.com/hc/en-us/articles/360043836851-Ranking-Market-Pair-Cryptoasset)
- [Liquidity Score](https://support.coinmarketcap.com/hc/en-us/articles/360043836931-Liquidity-Score-Market-Pair-Exchange)
- [Web Traffic Factor](https://support.coinmarketcap.com/hc/en-us/articles/360043398591-Web-Traffic-Factor-for-Exchanges)
- [Listings Criteria](https://support.coinmarketcap.com/hc/en-us/articles/360043659351-Listings-Criteria)
- [CMC Priority](https://support.coinmarketcap.com/hc/en-us/articles/16945563933723-CMC-Priority-CMCP)（2026-07-23）
- [API Pricing](https://coinmarketcap.com/api/pricing/) 与 [What one credit buys](https://coinmarketcap.com/api/resources/what-one-credit-buys-endpoint-by-endpoint/)
- [August 2026 Exchange Monthly Report](https://coinmarketcap.com/events/august-exchange-monthly-report/)
- [CMC20 Index Methodology PDF](https://s3.coinmarketcap.com/uploads/CoinMarketCap_20_Index_Methodology.pdf)
- [How CoinMarketCap and CoinGecko Validate the Numbers](https://coinmarketcap.com/academy/article/how-coinmarketcap-and-coingecko-validate-the-numbers-they-show-you)

**新闻与研究（二手，需回源）**

- The Block：收购确认、2020-05 流量座次
- Decrypt：收购后币安座次与调整成交额对照
- Bloomberg：Liquidity 指标、收购质疑
- WSJ：2018 年韩国溢价、Chez 专访
- Forbes：2019 年假量与收入估算、收购估值
- CoinDesk：CZ 谈收购动机、Bitwise 材料
- Wikipedia：时间线索引
- Semrush：2026-07 访问次数
- CoinGecko Learn：API 比价（竞争对手）

**未公开 / 推断**

- 「独立运营」对算法结果的约束力：政策声明，无法外部复现
- 把 CMC 当成加密市场的「官方市值」：媒体习惯，不是监管指定
- 5,000 万资产 ≈ 可投资宇宙：把合约地址数误读成资产数

资料截至 2026-09-18。价格、市值、流量和 API 标价都是快照。站内相关：[加密货币交易所观察](/articles/research/topics/cryptocurrency-exchanges)、[Pump.fun](/articles/research/topics/pump-fun)、[如何上链发币](/articles/research/topics/how-to-launch-token-onchain)、[什么是 Web3](/articles/research/topics/what-is-web3)。

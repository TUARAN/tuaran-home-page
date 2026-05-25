---
title: 马来西亚数据中心市场与能源背景 + ETCon26 峰会调研
category: topics
date: 2026-05-25
tags: [数据中心, 马来西亚, 能源转型, ETCon26, 出差准备, AI 基础设施]
summary: 6.3–6.5 KLCC 召开的 ETCon26 由 TNB 主办，主题"Energy & AI"，对接马来西亚已超 6.4GW 的数据中心新增电力需求；本篇汇总市场/能源底盘 + 一份现场问题清单。
tldr: Johor 占全国 70%+ 数据中心电力、Cyberjaya 是第二极；TNB 已签 6.4GW 数据中心供电、未来 5 年投 ~108 亿美元升级电网；2026 年起马政府限制"非 AI"型数据中心、加征水电费、强推 CRESS 绿电——出差前重点带问题，而非带答案。
topic_type: industry
source: claude-code
model: claude-opus-4-7
---

> 出差背景：领导让我去 6.3–6.5 在吉隆坡 KLCC 召开的 **ETCon26（The Energy Transition Conference 2026）** 看看。会议由马来西亚国家电力公司 **TNB（Tenaga Nasional Berhad）** 主办，与能源科技展 **ENERtec Asia 2026** 同期同地。三大议题之一是"Energy for AI"——为数据中心扩张提供电力底盘，所以"数据中心 + 能源"是绕不开的主线。
>
> 本调研定位：**出发前的"先验地图"**——先把市场盘子、电网底盘、政策风向、争议点摸清，到现场重点是问问题、收一手信息，不要被展台话术牵着走。

---

## 一、是什么

### 1.1 ETCon26 基本信息

| 项 | 内容 |
|---|---|
| 全名 | The Energy Transition Conference 2026 |
| 时间 | 2026 年 6 月 3 – 5 日 |
| 地点 | Kuala Lumpur Convention Centre（KLCC，吉隆坡） |
| 主办 | Tenaga Nasional Berhad（TNB，马来西亚国家电力公司） |
| 同期展 | ENERtec Asia 2026（1,000+ 展商、40+ 技术论坛） |
| 主题 | **Energy & AI: The Synergy for Energy Transition** |
| 规模 | 与 ENERtec 合计 12,000+ 与会者、60+ 国家、约 2,000 名会议代表、80+ 讲者、40+ 赞助商 |
| 开幕规格 | 总理 Anwar Ibrahim 致开幕辞；副总理兼能源转型与水务部长 Fadillah Yusof 做主旨发言 |
| 三大议题 | ① Energy for AI（为数字经济/数据中心建可靠电力）<br>② AI for Energy（用 AI 优化电网与脱碳）<br>③ Energy Transition for People（普惠、可负担、公平） |
| 官网 | https://the-etconference.com/ |

### 1.2 马来西亚数据中心市场（一句话）

> **"东南亚增长最快的数据中心市场，正在用国家电网换 AI 算力。"**

- 总容量：到 2026 年预计 **4–5 GW**（在役 + 在建），市场规模 **65.5 亿美元 → 2031 年 160.2 亿美元（年复合 ~20%）**。
- 地理格局：**Johor 占全国 70%+ 电力供应**（DC Byte：含已承诺/早期投资达 ~4 GW，2019–2024 年存量 CAGR 高达 260%）；**Cyberjaya 是第二极**（22 个已运营 + 9 个在建，2031 前 CAGR 29.6%）。
- 主要客户：**Microsoft（在 Johor 建第二个 Azure 区域 "Southeast Asia 3"）、AWS、Google、NTT DATA（Johor 6 栋园区）、ByteDance、Equinix、Zdata** 等。

---

## 二、为什么重要

### 2.1 为什么数据中心扎堆来马来西亚

1. **新加坡溢出**——新加坡 2019 年起对新建数据中心实施事实上的限制（moratorium），2022 后虽部分放开但门槛极高。CBRE 等机构认为 **Johor 直接吃下了新加坡溢出的需求**：跨长堤、低时延、土地/电费/水费均显著低于狮城。
2. **地缘"安全港"**——RHB 等券商把马来西亚定位为中美博弈下数据中心的 "safe haven"：英文+穆斯林+东盟身份+对中美都相对中立。
3. **政府前期非常宽松**——MIDA / Cyberjaya / Johor 州都给税收减免、土地、绿色数据中心指南等组合拳。

### 2.2 为什么"能源"突然成主线

- **TNB 已对 43 个数据中心项目承诺 ~6.4 GW 供电**（截至 2025Q1，其中 21 个已通电）。
- 预测：**2035 年数据中心可能占马来西亚总发电装机的 ~20%（>5 GW）**——这是国家级安全议题，不再是单纯生意。
- TNB 2025 年资本开支 **MYR 157 亿（~39.6 亿美元）**，其中 **MYR 120 亿（~30.2 亿美元）用于电网现代化**；面向 2030 年的电网升级计划合计约 **108.5 亿美元**。
- 配套基建：TNB 上线了 **Santong 100MW/400MWh 并网级电池储能（BESS）**——马来西亚第一个 grid-forming BESS，给变波动新能源 + AI 尖峰负荷打底。

### 2.3 这对中国厂商意味着什么

- **是窗口，也是政策风向标转折点**：2026 年 2 月 24 日，Anwar 总理公开表示马来西亚已"事实上限制非 AI 类数据中心 ~2 年"，理由是**保电网、保水**。"投资数据中心若不能给 rakyat（人民）带来切实附加值，就不该再被无脑引进。"
- **未来的市场进入门槛会显著提升**：从"给地给电就能来"，升级为"必须带 AI 业务/电力自给方案/绿电采购协议（CRESS 等）/水循环方案"。

---

## 三、关键玩家与生态

### 3.1 政策与基础设施侧

| 类别 | 主要主体 | 角色 |
|---|---|---|
| 监管 | Energy Commission（ST/Suruhanjaya Tenaga）、能源转型与水务部（PETRA）、MIDA、MyDIGITAL | 牌照、电力配额、投资促进 |
| 电力 | **TNB（半岛）**、Sarawak Energy、Sabah Electricity | 发电、电网、CRESS 绿电、BESS |
| 园区/特区 | **Johor-Singapore Special Economic Zone (JS-SEZ)**、Cyberjaya、Sedenak Tech Park、Kulai、Sepang | 招商、土地、配套 |
| 水务 | Ranhill SAJ（Johor 自来水）、Air Selangor | 数据中心冷却用水 |

### 3.2 数据中心运营商 / 客户

- **超大规模云**：Microsoft Azure（SEA3 在 Johor）、AWS（已在马设 region）、Google Cloud（已宣布 Region）、Oracle、TikTok/ByteDance。
- **国际 colo**：Equinix、NTT DATA、Digital Realty / GDS International、Princeton Digital Group、ST Telemedia、Yondr。
- **本地玩家**：YTL Power（与 NVIDIA 合作 AI DC）、TM One（Telekom Malaysia）、Bridge Data Centres（中资 Bain Capital 旗下）、AIMS、CSF Group、Open DC（YTL）、Vantage。
- **中资背景**：GDS International（万国数据海外平台）、Bridge DC、华为云、阿里云、字节跳动等以租用/合建为主。

### 3.3 设备/工程链

- **冷却**：Vertiv、Schneider、Stulz、Midea（已落地马来西亚液冷工厂方案）、Trane。
- **配电/UPS**：施耐德、ABB、伊顿、Vertiv、华为数字能源。
- **EPC**：Gamuda、Sunway Construction、IJM、Mudajaya、Exyte。
- **光伏/储能**：Solarvest、Cypark、Pekat Group、Samaiden；中资龙头（隆基、晶科、阳光电源、宁德时代/比亚迪）大多通过本地总包参与。

---

## 四、技术 / 实施细节（出差时重点核对的"硬数据"）

### 4.1 电力侧

- **CRESS（Corporate Renewable Energy Supply Scheme）**：2024 年推出的"企业绿电直购"机制，要求通过 TNB 输电网"过网费 + 系统服务费"，**已签 785 MWp 用于数据中心**。这是马来西亚版的"绿电 PPA"，是大客户绑定绿电的主通道。
- **NEM 3.0 / NEM Nova / LSS5+**：屋顶光伏与大型地面光伏（Large-Scale Solar）的招标轮次，**LSS5+** 是 2024–2026 主力轮次，配额数 GW 级。
- **电网拓扑**：500kV 主干、Grid of the Future 计划、Sarawak–Sabah–半岛互联（**ASEAN Power Grid** 框架下马来西亚是核心枢纽）。
- **关税**：数据中心电价已在 2025 年 ICPT（不可控成本转嫁）机制下上调，**TNB 还在研究专门的数据中心"高负荷率"电价类目**——这是去现场必须问清的。

### 4.2 水侧

- 一座 hyperscale DC 年用水可达 **20 亿升+**；Johor 的 Sungai Layang/Sungai Lebam 等水库压力已是公共议题。
- 2026 年 2 月 Gelang Patah 居民抗议数据中心施工——这是出差时**问"社会许可成本"的真实案例**。
- 主流路径：**风侧 + 液冷（D2C / immersion）+ 灰水/海水二次利用**；液冷在马来西亚高温高湿场景下经济性边界还在快速变化。

### 4.3 商业/政策

- **税收**：MSC Malaysia 状态、Pioneer Status、Investment Tax Allowance、绿色投资税务优惠（GITA/GITE）。
- **2026 起**：政府明确"**不再给非 AI 数据中心增量电力配额**"、推动 **JS-SEZ 与新加坡的跨境电力与数字协同**。
- **可比基准**：与印尼 Nongsa/Batam、泰国曼谷东部、越南胡志明市/河内、菲律宾、印度 Mumbai/Hyderabad 抢同一批 hyperscaler 订单。

---

## 五、争议与风险（也是去现场必须验证的）

1. **电网能否真的扛住** —— 6.4 GW 已承诺、潜在 >10 GW 排队，TNB 自己也承认变电站审批与建设周期是瓶颈；**首次/最快通电时间**正在从"6 个月" 拉长到"18–24 个月"。
2. **水资源与社会许可** —— Johor 旱季缺水会直接传导到 DC 运营，社区抗议已经出现。
3. **政策不连续风险** —— Anwar 政府的"挑客户"政策可能在政府更替时再次反转，外资在意稳定性。
4. **关税与补贴的"明牌化"** —— 2025–2026 ICPT 上调说明数据中心不再吃"低电价红利"。
5. **绿电真实性** —— CRESS 是否能做到"小时级匹配（24/7 CFE）"是关键；很多绿电更像 "annual matching" 漂绿。
6. **地缘 —— "中美都做"的窗口期能持续多久** —— 美国对华芯片出口管控是否会蔓延到第三方算力中心是悬念。
7. **冷却技术路线** —— 风冷 vs 液冷 vs 浸没的经济性切换点（kW/机柜）目前没有公认答案，热带气候下又被改写。

---

## 六、个人结论

**一句话定性：** 马来西亚已经从"东南亚数据中心红海"切换到"国家算力底盘 + 能源转型"的政策驱动期，ETCon26 是 **TNB 把自己定位成"AI 时代电力枢纽"** 的一次集中宣示，**有去的价值，但不要把它当成纯生意展会**——它更像一次"政策 + 电网 + 算力"的三方对齐会议。

**跟进判断：✅ 去**。重点不在带 leads 回来，而在三件事：
1. 摸清 TNB 在 **专项数据中心电价 / CRESS / BESS / 变电站排队周期** 上的真实口径；
2. 把握政府对"AI 型 vs 非 AI 型"DC 的**判定标准**——这直接影响进入策略；
3. 现场识别**未来 12–24 个月的政策风险点**（水、电价、绿电 24/7、JS-SEZ 跨境）。

**下一步行动：**
- 出发前：把官网最终议程下载下来，标出三大议题里"Energy for AI" 的全部 session；预定**总理开幕辞 + 副总理主旨 + TNB CEO 主题演讲**三场必听。
- 现场：用下方问题清单，**每场 session 至少抛 1 个问题**；展会 ENERtec 侧重点跑 TNB / YTL / Bridge DC / Equinix / NTT / Midea 液冷展位。
- 会后 1 周内：回写一份 **"会后纪要 + 决策建议"**，落到 `research/topics/2026-06-xx-etcon26-debrief.md`。

---

## 七、出差现场问题清单（按对象分组）

### A. 对 TNB（最优先）

1. 截至目前对数据中心承诺供电 **6.4 GW** 的实际通电率是多少？2026 年还能新增多少 GW 配额？
2. 数据中心专项电价（如有）何时落地？与一般工业电价的溢价/折扣区间？是否引入"高负荷率 / 24/7 基荷"差异化结构？
3. **CRESS 第一批 785 MWp** 中数据中心占比？合同价（RM/kWh）、过网费、容量费拆分？
4. 是否支持 **24/7 CFE（小时级绿电匹配）**？BESS 是否纳入 CRESS 调度？
5. 新数据中心从签约到通电的**实际中位周期**？是哪段（变电站？传输线？）卡？
6. Santong 100MW/400MWh BESS 的商业模式（容量电费 vs 现货）？后续几个项目？
7. **ASEAN Power Grid** 跨境送电（与新加坡、泰国、印尼）对马来西亚算力出口的实际进展？

### B. 对监管/政府（PETRA / MIDA / 能源委）

8. "**AI 型 vs 非 AI 型**" 数据中心的认定标准？是否有书面 guideline？
9. JS-SEZ 框架下，新加坡客户在 Johor 部署 DC 的**电力 / 数据 / 税收**特殊安排？
10. 水资源约束：是否对 hyperscale DC 设 **PUE / WUE 强制上限**？取水许可走哪条路径？
11. 绿色数据中心指南（Green DC Guidelines）下一版更新方向？强制 vs 自愿？
12. 数据本地化、跨境数据流动（PDPA 2024 修订后）对云厂商的实际影响？

### C. 对 hyperscaler / colo 运营商（MS / AWS / Google / NTT / Equinix / YTL / Bridge）

13. 未来 24 个月在马新增 IT load 计划（MW）？分布在 Johor / Cyberjaya / Sarawak 的比例？
14. **冷却路线**：当前主力 PUE / WUE？液冷渗透率？目标 GPU 机柜密度（kW/rack）？
15. 绿电采购策略：CRESS / 自建光伏 / 海外 EAC 三者比例？
16. 选址中最大瓶颈到底是 **电力、水、土地、人才** 中的哪一个？
17. 中美客户结构有没有变化？是否在做"中美分舱"设计？

### D. 对设备/方案商（华为 / Vertiv / Schneider / Midea / 中资储能）

18. 在热带（35°C+ 干球 / 高湿度）下，**冷板 vs 浸没** 的 TCO 拐点目前在多少 kW/rack？
19. 中国厂商进入马来西亚 hyperscaler 链路的最大门槛（认证、本地化、地缘）？
20. AI 服务器供电（HVDC 800V / 中压直挂）在马市场的成熟度？
21. BESS / UPS / 柴发 三件套未来 3 年的预算分配趋势？

### E. 给自己（行业判断校验）

22. **马来西亚的窗口期还有几年？** 是 3 年（电网耗尽配额）、5 年（关税重定价完成）、10 年（区域格局成熟）？
23. 如果今天要在马来西亚投一个**新增量**，应该是**算力服务、绿电资产、冷却设备、还是 EPC**？
24. 如果中美彻底脱钩，马来西亚会站在哪一侧？是否需要提前做"在马的中资 vs 美资"双轨布局？

---

## 八、信息来源

### 一手 / 主办方

- [ETCon26 官网（The Energy Transition Conference）](https://the-etconference.com/)
- [TNB（Tenaga Nasional Berhad）](https://www.tnb.com.my/)
- [ENERtec Asia 2026 + ETCon26 联合公告（PR Newswire APAC）](https://www.prnewswire.com/apac/news-releases/enertec-asia-and-etcon26-unite-to-power-malaysias-energy--ai-transition-302769344.html)
- [BERNAMA：Powering AI, Transforming Energy: The Core Synergy At ETCon26](https://asean.bernama.com/news.php?id=2541396)
- [BERNAMA：ENERtec Asia 2026, ETCon26 Forge Alliance](https://bernama.com/en/region/news.php/business/news.php?id=2557581)

### 市场与电力数据

- [TNB 对 43 个数据中心承诺 6.4 GW（Arc Media Global）](https://arcmediaglobal.com/tnb-commits-6-4-gw-to-data-centers-amid-growing-digital-energy-demand/)
- [TNB ~108.5 亿美元电网升级（China.org.cn 转 Xinhua）](http://www.china.org.cn/world/Off_the_Wire/2026-05/21/content_118507328.shtml)
- [TNB 首个并网级 BESS（Energy-Storage.News）](https://www.renewableenergyasia.org/2026/05/malaysian-utility-tnb-connects.html)
- [Malaysia DC Market 2026–2031（Mordor Intelligence）](https://www.mordorintelligence.com/industry-reports/malaysia-data-center-market)
- [Malaysia Colocation DC Portfolio Report 2026](https://www.globenewswire.com/news-release/2026/04/27/3281377/28124/en/malaysia-colocation-data-center-portfolio-report-2026.html)
- [The Star：Malaysia on track to become one of Asia-Pacific's largest data centre markets](https://www.thestar.com.my/business/business-news/2025/11/04/malaysia-on-track-to-become-one-of-asia-pacifics-largest-data-centre-markets)
- [Johor 占 80% IT 容量（DCD 分析）](https://www.datacenterdynamics.com/en/analysis/the-past-present-and-future-of-johor/)
- [White & Case：What is propelling Malaysia's data centre boom?](https://www.whitecase.com/insight-our-thinking/what-propelling-malaysias-data-centre-boom)

### 政策与争议

- [Techwire Asia：Malaysia's data centre policy is saying the quiet part out loud（2026-03）](https://techwireasia.com/2026/03/malaysia-data-centre-policy-ai-moratorium/)
- [The Diplomat：Whose Water Powers the Cloud?（2026-04）](https://thediplomat.com/2026/04/whose-water-powers-the-cloud-data-centers-and-the-right-to-water-in-johor/)
- [Eco-Business：Southeast Asia's data centres should be sited in more water-rich areas](https://www.eco-business.com/news/southeast-asias-data-centres-should-be-sited-in-more-water-rich-areas-experts/)
- [Fortune：SEA's AI data center boom must overcome heat and humidity（2026-03）](https://fortune.com/2026/03/26/southeast-asia-ai-data-centers-heat-challenge/)
- [SCMP：Singapore spillover benefits Johor](https://www.scmp.com/week-asia/economics/article/3288291/singapore-spillover-data-centres-benefits-malaysias-johor)
- [RHB / TNGlobal：Malaysia as data center safe haven](https://technode.global/2026/04/28/malaysia-emerges-as-data-center-safe-haven-as-geopolitical-risks-reshape-global-investment-flows-rhb/)
- [China-Global South Project：China Steps In as Malaysia's DC Surge Puts Grid to Test](https://chinaglobalsouth.com/analysis/china-malaysia-data-centers-power-grid/)

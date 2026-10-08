---
title: 搞懂 AI 半导体：GPU、HBM、DRAM、NAND 到底怎么分
category: topics
date: 2026-10-08
time: 14:31
tags: [AI, 半导体, GPU, HBM, DRAM, NAND, 英伟达, 博通]
summary: AI 数据中心按活来分。英伟达的 GPU 负责算，博通做网络芯片和定制加速芯片，高通偏手机和 PC。DRAM 是正在用的内存，HBM 是贴在 GPU 旁边的高速 DRAM，NAND 放进 SSD 做长期存储。
tldr: 英伟达算，博通连也做定制芯片，高通在终端。DRAM 管正在用，HBM 给 GPU 高速喂数据，NAND 和硬盘管存下来的数据。海力士、美光、三星三条存储都做；闪迪做 NAND，西部数据做硬盘。
topic_type: industry
subjects: [business_market]
content_type: analysis
assistance: cursor
model: grok-4.7
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

> **风险提示：** 这是一张产品分工图，用来分清谁在算、谁在连、哪种存储干什么。各家实际产品比这张图宽。某一季的出货份额会变。内容不构成证券买卖建议。

## 一、先给结论

AI 数据中心里的芯片，按干的活来分，比按公司名来分清楚。

1. **英伟达负责算。** 卖给 AI 数据中心的核心是 GPU，模型计算主要在 GPU 上完成。英伟达自己也做机柜内和机柜间的网络。
2. **博通占两格。** 一格是数据中心以太网交换芯片，一格是给云厂商做的定制加速芯片。
3. **高通负责终端计算。** 重心在手机和 PC，不在训练集群里。
4. **内存和存储是另一层。** DRAM 是设备运行时反复读写的内存。HBM 属于 DRAM，叠在 GPU 旁边，带宽高得多。NAND 掉电还在，主要做成 SSD。
5. **存储公司的差别是侧重点。** SK 海力士、美光、三星都做 DRAM、HBM 和 NAND。闪迪做 NAND 和 SSD。西部数据在 2025 年 2 月把闪存拆出去之后，留下硬盘。

可以记成两句。**英伟达负责算，博通负责连，高通负责终端计算。DRAM 管正在用，HBM 管高速喂 GPU，NAND 管长期存储。**

整条链是：英伟达负责算 → HBM 给 GPU 高速喂数据 → DRAM 支撑系统运行 → NAND/SSD 存大量数据 → HDD 做更大规模、更低成本的数据仓库。

## 二、事实层

### 算、连、终端

| 位置 | 公司 | 公开产品里能对上的 | 这张图没收进来的 |
|---|---|---|---|
| 算 | 英伟达 NVIDIA | GPU。Blackwell 这一代把 GPU、Grace CPU、NVLink 和网络放进同一套系统 | 英伟达也卖 InfiniBand 和 Spectrum-X 以太网 |
| 连，以及定制计算 | 博通 Broadcom | Tomahawk 以太网交换芯片；公司自己把 AI 半导体分成定制加速芯片和网络 | 博通还有基础设施软件，不在这张芯片图里 |
| 终端 | 高通 Qualcomm | 手机上的 Snapdragon；Windows PC 上的 Snapdragon X | 汽车等其他终端，这篇不展开 |

英伟达首席执行官 2025 年的信里，把公司写成从 GPU、CPU 到网络处理器、NVLink 交换机、InfiniBand 和以太网的一整套。所以「英伟达负责算」说的是主业：模型的矩阵运算在 GPU 上跑。连接 GPU 的活，英伟达自己也做。

博通 2025 年 6 月开始出货 Tomahawk 6，单芯片交换容量 102.4 Tb/s，面向 AI 集群的以太网。2026 年 8 月 2 日的业绩说明里，首席执行官 Hock Tan 把需求写成两块：「custom AI accelerators and networking」，也就是定制 AI 加速芯片和网络。定制芯片是按一家云厂商的模型来做的，和英伟达那种谁都能买的通用 GPU 不是同一类货。

高通的 Snapdragon X 是给 Windows 笔记本的处理器，官方把它放在笔记本电脑产品页。手机侧仍是 Snapdragon 移动平台。两边都是终端，算力、功耗和散热按电池和机身来设计，不按一个放几千张 GPU 的机房来设计。

### DRAM、HBM、NAND

三种东西经常被写成并列的四个名词。HBM 不是第四种，它是 DRAM 里的一种做法。

**DRAM** 是易失内存。断电，数据就没了。服务器上的 DDR5、手机和轻薄本上的 LPDDR，都是 DRAM。系统正在跑的程序和正在用的数据，放在这里。容量比 HBM 好做大，单价也低，接口比 HBM 窄，所以喂不饱一张一直在算的 GPU。

**HBM**（High Bandwidth Memory，高带宽内存）是 JEDEC 标准里的 HBM DRAM。标准写明：它和负责计算的那颗芯片紧贴在一起，接口拆成许多独立通道，用很宽的总线换带宽。做法是把多片 DRAM 垂直叠起来，用硅通孔连上。可以把它想成 GPU 旁边的高速工作台：东西就在手边，一次能搬很多。JEDEC 在 2025 年 4 月 16 日发布 HBM4。标准里的接口宽到 2048 bit，按最高 8 Gb/s 计算，一个堆叠的带宽上限写到 2 TB/s。它仍然要刷新，断电一样会丢。

**NAND** 是闪存，非易失。断电，数据还在。数据中心里它主要做成 SSD，也可以想成高速仓库：比内存慢，比硬盘快，容量比内存大得多。模型权重、数据集、训练中途存下来的检查点，放在这一层。它喂不了 GPU 的每一个计算节拍，所以中间还要经过 HBM。

**HDD** 是机械硬盘，磁碟转起来读写。比 SSD 慢，单盘容量大，按每 TB 算通常更便宜。它适合更冷、更大的数据仓库。训练服务器里直接挂在 GPU 旁边的，更多是 HBM 和 SSD。硬盘在容量那一层。

### 公司和存储怎么对

| 公司 | DRAM / HBM | NAND / SSD | 硬盘 | 读新闻时怎么放 |
|---|---|---|---|---|
| SK 海力士 | 做，HBM 是它 AI 产品的门面 | 做 | 不做 | 名字最常和 HBM 一起出现 |
| 美光 Micron | 做。2026 年 3 月已量产给英伟达 Vera Rubin 的 HBM4，也卖 DDR5 等系统内存 | 做，含数据中心 SSD | 不做 | 三条都有产品页 |
| 三星 Samsung | 做。官网把 HBM 放在 DRAM 栏目下 | 做 | 消费级硬盘有，数据中心硬盘不是它的主标签 | 存储覆盖 DRAM 和 NAND，公司另外还有晶圆代工和先进封装 |
| 闪迪 Sandisk | 不做 | 做。2025 年 2 月 24 日起作为独立公司交易，业务是闪存 | 不做 | 2025 年 2 月从西部数据拆出 |
| 西部数据 Western Digital | 不做 | 拆出之后不做 | 做 | 拆分后留下 HDD |

三家存储原厂的产品清单是叠在一起的。不能记成「海力士等于 HBM、美光等于 DRAM、三星等于 NAND」。海力士在 HBM 上非常突出，指的是它把 HBM 放在 AI 存储的最前面，新闻里也最常被写成 GPU 内存的供应商。美光同时覆盖 HBM、普通 DRAM 和 NAND。三星的存储同样覆盖 DRAM、HBM 和 NAND；「产业链比较完整」在它自己的 HBM 页面上，指的是存储、晶圆代工和先进封装放在同一家公司里。

闪迪和西部数据在 2025 年 2 月 21 日完成分离，24 日对外宣布。闪存归闪迪，硬盘留在西部数据。在这之前把两家当成同一家公司的存储业务，和现在的报表对不上。

## 三、结构分析

这条链卡住的地方是速度，不是名字。

GPU 一个节拍要吃进大量数字。如果这些数字还在 SSD 里，GPU 大部分时间在等。HBM 把 DRAM 叠到计算芯片旁边，用几千条线同时搬数据，等的时间就短了。代价是贵、难做、单堆叠容量仍然有限。所以 HBM 只放 GPU 眼前最急的那一块。

整机还有 CPU、操作系统和别的任务。这些用普通 DRAM。它比 HBM 好扩容量，接口没有那么宽，也不必和 GPU 封在同一块基板上。

算完的结果、下次还要读的数据，不能只活在会掉电的内存里。NAND/SSD 接住这一段：容量上去，掉电还在，延迟仍远高于 DRAM。再往下，访问更少、体积更大的数据，用硬盘更划算。

所以那句串起来的话，对应的是远近，不是五家公司的股权关系：

**离 GPU 最近的是 HBM，接着是系统 DRAM，然后是 SSD，最远、最便宜的大仓库是 HDD。**

「博通负责连」也要按这个精度来用。博通的交换机负责把很多计算芯片接成一个集群。它的定制加速芯片本身也在算，只是按一家客户的模型来做，不拿去当通用 GPU 卖。英伟达那边，NVLink 负责一小群 GPU 之间的紧连接，InfiniBand 和以太网负责更大范围的连接。两家在「连」上有重叠，在「卖给谁的通用 GPU」上没有重叠。

高通不在这条机房链上。手机和 PC 也有 DRAM 和 NAND，那是终端自己的内存和闪存，量小，不负责训练大模型。

## 四、外部研判

这张图够用来读一条新闻。标题里出现 HBM，先把它放回 DRAM，再看是不是贴在 GPU 旁边的那一层。出现 NAND 或 SSD，放回长期存储。出现硬盘，放回更冷的仓库。出现英伟达，先看是不是 GPU 的计算；出现博通，先分清是交换机还是某家云厂商的定制芯片。

**跟进的是分工，观望的是某一季谁供得更多。** 海力士、三星、美光都做 HBM，份额每个季度都在变。份额变化会改变「谁卖得更多」，不会把 NAND 变成 DRAM，也不会把闪迪变成 HBM 供应商。

下一步就一件事：看到存储涨价、缺货或新合同，先问这批货是 HBM、普通 DRAM、NAND 还是硬盘。四样的客户、扩产时间和价格周期不是同一件事。

## 五、信息来源与持续验证

资料看到 2026 年 10 月 8 日。分工用的是标准机构和公司自己的产品说明，不用卖方的份额预测。

- JEDEC，HBM3 DRAM 标准说明：HBM DRAM 与计算芯片紧耦合，宽接口、独立通道。[JESD238B.01](https://www.jedec.org/standards-documents/docs/jesd238b01)
- JEDEC，2025 年 4 月 16 日，HBM4 发布说明：2048 bit 接口，带宽上限 2 TB/s，面向生成式 AI 和高性能计算。[新闻稿](https://www.jedec.org/news/pressreleases/jedec%C2%AE-and-industry-leaders-collaborate-release-jesd270-4-hbm4-standard-advancing)
- 英伟达，2025 年首席执行官信：GPU、Grace CPU、NVLink、InfiniBand 与以太网。[PDF](https://images.nvidia.com/pdf/Annual-NVIDIA-CEO-Letter-2025.pdf)
- 英伟达网络产品页：NVLink、Quantum InfiniBand、Spectrum-X 以太网。[nvidia.com/networking](https://www.nvidia.com/en-us/networking/)
- 博通，2025 年 6 月 3 日，Tomahawk 6 出货，102.4 Tb/s。[新闻稿](https://investors.broadcom.com/news-releases/news-release-details/broadcom-ships-tomahawk-6-worlds-first-1024-tbps-switch)
- 博通，2026 年 8 月 2 日业绩说明：定制 AI 加速芯片与网络。[8-K 附件](https://www.sec.gov/Archives/edgar/data/1730168/000173016826000076/avgo-08022026x8kxex99.htm)
- 高通，Snapdragon X 笔记本电脑页面。[qualcomm.com/snapdragon/laptops](https://www.qualcomm.com/snapdragon/laptops)
- 美光产品页：DRAM、HBM、NAND。[micron.com/products](https://www.micron.com/products)
- 美光，2026 年 3 月 16 日：HBM4 量产，面向英伟达 Vera Rubin；同时有数据中心 SSD。公司自述产品组合为 DRAM、NAND 和 NOR。[新闻稿](https://investors.micron.com/news/press-release/2026/Micron-in-High-Volume-Production-of-HBM4-Designed-for-NVIDIA-Vera-Rubin-PCIe-Gen6-SSD-and-SOCAMM2-03-16-2026/default.aspx)
- 三星半导体，HBM 放在 DRAM 栏目，并写明存储、晶圆代工与先进封装在同一体系内。[HBM 页面](https://semiconductor.samsung.com/dram/hbm/)
- SK 海力士，公司介绍写明产品为 DRAM 与 NAND flash；HBM 是其 AI 存储展示的核心。[2026 年 8 月关于 HBF 的新闻稿末尾介绍](https://news.skhynix.com/en/hbf-at-fms-2026/)
- 西部数据，2025 年 2 月 24 日：闪存业务分离完成。[新闻稿](https://www.westerndigital.com/company/newsroom/press-releases/2025/2025-02-24-western-digital-completes-planned-company-separation)
- 闪迪，2025 年 2 月 24 日：独立上市，业务为闪存。[新闻稿](https://www.sec.gov/Archives/edgar/data/2023554/000119312525033433/d849281dex991.htm)
- 西部数据，2025 年 2 月 21 日完成分离的 8-K。[wdc-20250220](https://www.sec.gov/Archives/edgar/data/106040/000010604025000012/wdc-20250220.htm)

持续验证：HBM 三家的季度份额、以及某家云厂商的定制芯片出了多少，会改变「谁卖得更多」，不会改变上面这张分工。没有会把 DRAM、HBM、NAND 的位置对调的缺项。

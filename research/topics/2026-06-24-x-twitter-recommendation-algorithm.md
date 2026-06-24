---
title: X（推特）开源推荐算法深度拆解：从 2023 的 SimClusters/Heavy Ranker 到 2026 的 Grok 两塔
category: topics
date: 2026-06-24
time: 16:20
tags: [推荐算法, X, Twitter, 推荐系统, Grok, SimClusters, Heavy Ranker, Transformer, 开源, For You]
summary: X（原 Twitter）先后两次把「For You」推荐算法开源到 GitHub：2023-03 的 twitter/the-algorithm（Scala 为主的经典多级漏斗——SimClusters 社区召回、TwHIN/RealGraph 信号、Light/Heavy Ranker 排序、可见性过滤），与 2026-01 起 xai-org/x-algorithm 的彻底重写（Rust+Python，用 Grok 同源 Transformer「Phoenix」做两塔召回+排序，几乎删光手工特征）。本文拆解两代架构的多级流水线、关键模块与排序目标，并研判「开源了代码、却没开源权重/训练数据/用户信号」这件事的边界。本文为基于公开仓库与官方资料的技术整理。
tldr: 推荐系统的工程范式这三年在 X 身上完整演了一遍：2023 版是「人写规则 + 多个专用模型」的经典漏斗——先用 SimClusters/关注图把全网几亿帖收敛到约 1500 条候选（约一半来自关注内、一半关注外），再用约 4800 万参数的 Heavy Ranker 按「点赞/回复/转发/被作者回复/举报」等带权重的互动概率打分，最后叠一层多样性与可见性过滤；2026 版被 Grok 同源 Transformer「Phoenix」一锅端：两塔出 user/post 向量做召回，排序时用注意力掩码让候选互不可见以便缓存，官方称「删掉了每一个手工特征和大部分启发式」。但两次开源都只给了代码骨架，没给模型权重、训练数据和真实用户信号——能看懂「怎么排」，看不到「凭什么是你」。以上为外部技术判断，不构成对平台的合规或商业结论。
topic_type: tech
assistance: claude-code
model: claude-opus-4-8
pv: 0
---

# X（推特）开源推荐算法深度拆解：从 2023 的 SimClusters/Heavy Ranker 到 2026 的 Grok 两塔

> **写在前面**：本文基于 X 两个开源仓库与官方/第三方公开资料整理（来源见文末），属外部技术解读，非官方文档；权重等数值以仓库当前快照为准，未开源部分只能就架构论架构。

---

## 一、先给结论

**如果只记住一句话：X 的推荐算法这三年完成了一次范式切换——从「一堆专用模型 + 人写规则拼成的多级漏斗」（2023），切到「一个 Grok 同源的 Transformer 几乎全包」（2026）；但两次开源都是开了「怎么排序的代码」，没开「凭什么排到你头上的权重、训练数据和用户信号」。**

理解这件事要分清三层，越往下越接近本质：

| 层次 | 看到的是什么 | 多数解读停在哪 |
|---|---|---|
| **现象层** | 「算法开源了，能照着优化涨粉」 | 大多数自媒体文章 |
| **架构层** | 多级漏斗：召回 → 粗排 → 精排 → 过滤，每级用什么模型 | 真正能复用的工程认知 |
| **边界层** | 开源的是**管道形状**，没开源的是**权重 + 训练数据 + 你的行为日志** | 谈「透明度」时的关键 |

**核心判断：开源代码让你看懂「排序管道长什么样」，但决定「为什么推给你」的是权重与数据，而这部分始终没公开。** 详细研判见第五节。

---

## 二、两次开源：时间线（事实层）

> 本节为可核对的史实，逐项给出仓库/官方来源。

| 时间 | 事件 | 仓库 / 来源 |
|---|---|---|
| 2023-03-31 | 首次开源经典推荐算法：服务代码 + ML 模型代码两个仓库 | [twitter/the-algorithm](https://github.com/twitter/the-algorithm) · [the-algorithm-ml](https://github.com/twitter/the-algorithm-ml) |
| 2023-03-31 | 官方工程博客同步说明架构与排序目标 | [blog.x.com 工程博客](https://blog.x.com/engineering/en_us/topics/open-source/2023/twitter-recommendation-algorithm) |
| 2023 起 | 社区注解版（recsys 视角逐文件批注） | [igorbrigadir/awesome-twitter-algo](https://github.com/igorbrigadir/awesome-twitter-algo) |
| 2025-10 | Musk 宣布 Grok 将「逐条读帖、逐条看视频」取代旧推荐系统 | 平台公告（第三方转述） |
| 2026-01-20/21 | xAI 开源**全新** Grok-Transformer 推荐算法，承诺约每 4 周更新一次 | [xai-org/x-algorithm](https://github.com/xai-org/x-algorithm) · [@XEng 公告](https://x.com/XEng/status/2013471689087086804) |
| 2026-05-15 | 该仓库重大更新：端到端推理管线、预训练模型产物、内容理解 Grox、广告混排等 | [xai-org/x-algorithm](https://github.com/xai-org/x-algorithm) |

**两条主线要分清**：`twitter/the-algorithm`（2023 经典版，Scala 为主）与 `xai-org/x-algorithm`（2026 Grok 版，Rust 为主）是**两套不同的代码与范式**，不是同一仓库的迭代。下面两节分别拆。

---

## 三、2023 版：经典多级漏斗（事实层）

> 这一版是「推荐系统教科书式」的工程实现，至今仍是理解大规模推荐的最佳公开样本。

### 3.1 整体流水线

```
全网海量帖子（亿级）
   │  ① 候选召回（Candidate Sourcing）
   ├── 关注内 In-Network：Earlybird 搜索索引（约占一半候选）
   └── 关注外 Out-of-Network：Tweet-Mixer 协调
         ├── SimClusters：社区召回（~14.5 万重叠兴趣社区）
         ├── UTEG：User-Tweet-Entity-Graph（GraphJet 实时图）
         ├── TwHIN：知识图谱稠密 embedding
         └── FRS：Follow-Recommendation-Service
   ▼  收敛到约 1500 条候选
   │  ② 粗排 Light Ranker（轻量神经网络快速筛）
   ▼
   │  ③ 精排 Heavy Ranker（约 4800 万参数神经网络，按加权互动概率打分）
   ▼
   │  ④ 过滤与启发式（Visibility Filtering / 多样性 / 疲劳度 / 信任与安全）
   ▼
For You 时间线（约 50% 关注内 + 50% 关注外）
```

### 3.2 关键模块速查

| 模块 | 作用 | 一句话定位 |
|---|---|---|
| **Earlybird** | 关注内帖子的实时搜索索引 | In-Network 召回主力（约半数候选） |
| **SimClusters** | 社区发现 + 稀疏 embedding，约 14.5 万重叠社区、约每 3 周重算 | Out-of-Network 召回的核心 |
| **TwHIN** | 用户/帖子的稠密知识图谱 embedding | 把异构关系压成向量 |
| **RealGraph** | 预测两个用户之间的互动概率 | 关系强度信号 |
| **TweepCred** | 基于 PageRank 的用户声誉分 | 账号权重 |
| **Light Ranker** | 轻量模型快速粗筛 | 召回与精排之间的减压阀 |
| **Heavy Ranker** | 约 4800 万参数神经网络，多目标打分 | 决定排序的主信号 |
| **Visibility Filtering** | 合规、质量、信任的硬过滤与降权 | 排序后的最后一道闸 |

### 3.3 Heavy Ranker 在优化什么（排序目标）

精排不是「预测一个分」，而是预测**多种互动的概率并加权求和**。2023 版公开代码里可见的相对权重（示意，方向比绝对值更重要）：

| 预测的用户行为 | 相对权重（示意） | 含义 |
|---|---|---|
| 点赞（like） | 较低正权重 | 基础正反馈 |
| 转发（retweet） | 中等正权重 | 扩散意愿 |
| 回复（reply） | **较高正权重** | 深度互动 |
| 回复且被作者回复 | **最高正权重** | 真实对话，权重远高于点赞 |
| 点进详情页停留 / 看完视频 | 中等正权重 | 停留时长信号 |
| 举报 / 拉黑 / 屏蔽 | **大额负权重** | 强烈负反馈，直接压制 |

**节首判断**：这套权重把「能引发对话、尤其能让作者回复」排在「点赞」之上，把「举报/拉黑」作为大额惩罚——**对创作者的隐含含义是：引发真实回复 ≫ 单纯点赞，而触发举报是毁灭性的**。这是 2023 版能给创作者的最实用结论。

### 3.4 语言与配套

- 主语言：**Scala 约 66%、Java 约 20%、Python 约 3.5%**（外加 C++/Thrift）。
- ML 模型与训练代码在配套仓库 [the-algorithm-ml](https://github.com/twitter/the-algorithm-ml)（Python/PyTorch）。
- 注：2023 版开源**不含**模型权重与训练数据，只有架构与代码。

---

## 四、2026 版：Grok 两塔重写（事实层）

> 2026-01 起的 `xai-org/x-algorithm` 是一次彻底重写：用与 xAI Grok 同源的 Transformer 架构，吃掉了原来「多个专用模型 + 大量人写规则」的大部分。

### 4.1 整体流水线

```
   │  编排层：Home Mixer（串起整条管线）
   ├── Query Hydration：拉用户上下文与互动历史
   ├── 候选召回
   │     ├── Thunder：关注内（In-Network）
   │     └── Phoenix 检索：关注外（两塔向量召回）
   ├── Hydration / Filtering / Scoring
   │     └── Phoenix 排序：Grok 同源 Transformer 打分
   └── Selection + 选后过滤（屏蔽/静音/违规内容）
   ▼
For You 时间线
```

### 4.2 核心：Phoenix（Grok 同源 Transformer）

Phoenix 一个模型干两件事：

- **召回（两塔模型）**：User Tower 把用户特征与互动历史编码成 user embedding；Candidate Tower 把帖子编码成 post embedding；两者点积做相似度检索。
- **排序**：用**特殊的注意力掩码让候选之间互不可见**（candidates cannot attend to each other）——保证每条帖子的分数只取决于「用户 × 该帖」，与同批其它候选无关，从而**分数一致、可缓存**。

排序输出的是**多种行为的概率**：点赞、回复、转发、引用、点开主页、看视频、停留（dwell）、关注作者，以及负向信号（拉黑、静音、举报）。和 2023 的多目标思路一脉相承，但**特征从「人工设计」变成「Transformer 从行为序列里自己学」**。

### 4.3 与 2023 版的根本差异

| 维度 | 2023 the-algorithm | 2026 x-algorithm |
|---|---|---|
| 范式 | 多个专用模型 + 大量人写规则 | 单一 Grok 同源 Transformer 几乎全包 |
| 召回 | SimClusters / UTEG / TwHIN / FRS 多路 | Thunder（内）+ Phoenix 两塔（外） |
| 排序 | 约 4800 万参数 Heavy Ranker | Phoenix（Grok 架构） |
| 特征工程 | 大量手工特征与启发式 | 官方称「删掉每一个手工特征和大部分启发式」 |
| 主语言 | Scala/Java 为主 | **Rust 约 6 成 + Python 约 4 成** |
| 编排 | tweet-mixer 等 | Home Mixer |
| 更新 | 开源后基本停更 | 承诺约**每 4 周**更新一次 |

**节首判断**：2026 版的赌注是「**用一个大模型的表征能力，替代十年攒下来的特征工程与规则**」。工程上更简洁、迭代更快；代价是可解释性进一步下降——以前还能指着某条规则说「这里降权了」，现在答案藏在 Transformer 权重里。

---

## 五、研判：开源了什么，没开源什么

> 以下是我作为外部观察者的一种解读，落在结构与机制上，不代表平台立场，也不构成合规或投资结论。

### 5.1 两次开源的共同边界

无论 2023 还是 2026，公开的都是**代码与架构**，没有公开的三样东西决定了「为什么是你」：

| 没开源的 | 为什么关键 |
|---|---|
| **模型权重** | 同一套代码，权重不同，推荐结果天差地别 |
| **训练数据** | 模型学到的偏好全在数据里 |
| **真实用户信号 / 日志** | 你的每一次停留、划走才是真正的输入 |

正因如此，2026-01 的开源被部分评论称为 **「透明度表演」（transparency theater）**——给了管道形状，没给让外部能真正复算或审计的料；并指出 2023 版当年也「同样不完整」。

### 5.2 监管与时点

2026-01 这次开源的外部背景值得记一笔（作为时点信息，不作因果断言）：

- 2025-12，欧盟以违反《数字服务法（DSA）》**透明度义务**为由对 X 开出约 **1.4 亿美元**罚单。
- 同期 Grok 在「生成不当图像」上面临立法者与监管的审视。

把「开源算法」放在「正承受透明度监管压力」的时点看，**开源既是工程动作，也是对外姿态**——但这是外部可观察的并列事实，不等于因果。

### 5.3 对「能不能照着优化」的冷判断

- **能学到的**：排序目标的方向（回复 > 点赞、被作者回复权重高、举报是大额惩罚）、整体漏斗结构、关注内/外的并重。这些对内容策略是真有用的。
- **学不到的**：具体权重数值、阈值、当下生效的模型——而且 2026 版用 Transformer 后，「可照抄的显式规则」本身在变少。
- **结论**：把开源算法当**方向盘校准**（理解平台奖励什么）是合理的；当成**可逆向的精确公式**去钻空子，则越来越不现实。

---

## 六、横向参照与可用结论

> 与其它平台的公开程度做横向对照，仅为定位 X 的相对位置，非逐一精确比较。

| 平台 | 推荐算法公开程度 |
|---|---|
| **X / Twitter** | 两次开源核心排序**代码**（不含权重/数据），目前业界最公开 |
| 抖音 / TikTok | 不开源；仅有专利、招股书与零散官方说明 |
| Meta（FB/IG） | 不开源代码；提供「系统卡」与部分透明度报告 |
| 小红书 / 微博等 | 不开源；以运营侧规则说明为主 |

**结构性观察**：X 是唯一把排序**代码**公开到可逐文件读的主流平台，这本身有稀缺价值——即便没给权重，「能读到管道」已经比绝大多数平台多。

**给创作者的三条可落地结论**（基于公开排序目标，非承诺）：
1. **优先做能引发回复、并让你愿意回复对方的内容**——「对话」权重显著高于「点赞」。
2. **避免触发负反馈**：标题党、误导、引战带来的举报/拉黑是大额惩罚，得不偿失。
3. **关注外曝光靠「兴趣社区」**：你的内容会经由相似用户聚成的社区被分发，垂直、稳定的选题比追热点更易被持续推给对的人。

---

## 七、未能验证的事实清单

诚实列出本文未能一手验证、需要读源码或实测才能确认的点：

| 未验证项 | 现状 | 获取路径 |
|---|---|---|
| Heavy Ranker 精确权重数值与参数量（约 4800 万） | 多为公开转述，未逐行核对当前仓库 | 读 [the-algorithm-ml](https://github.com/twitter/the-algorithm-ml) 与 home-mixer 配置 |
| 2026 版语言占比（Rust ~57% vs 另说 ~63%） | 第三方数字有出入 | 以 [xai-org/x-algorithm](https://github.com/xai-org/x-algorithm) 仓库语言条为准 |
| Phoenix 的层数 / 维度 / 训练目标细节 | 仓库给架构，未给完整模型卡 | 读仓库 model 目录与 README |
| 「删掉每一个手工特征」的实际彻底程度 | 官方表述，未独立验证 | 逐目录核对是否仍有规则代码 |
| 各预测信号当前的相对权重 | 未公开（属未开源部分） | 无法从代码得到，需平台披露 |

---

## 八、结语与信息来源

**一种外部解读**：X 这两次开源最大的价值，不是让谁能「逆向算法」，而是给了行业一份罕见的、可逐文件阅读的「大规模推荐系统」公开样本——2023 版教你经典漏斗怎么搭，2026 版示范用一个大模型把它重写成什么样。但「开源代码 ≠ 开源算法」：决定推给谁的权重、数据和你的行为日志，始终在闸门后面。**以上为分析视角，不是预测，也不是建议。**

### 信息来源

一手资料（仓库 / 官方）：

- [twitter/the-algorithm（2023 经典版）](https://github.com/twitter/the-algorithm)
- [twitter/the-algorithm-ml（2023 ML 模型）](https://github.com/twitter/the-algorithm-ml)
- [xai-org/x-algorithm（2026 Grok 版）](https://github.com/xai-org/x-algorithm)
- [X 工程博客：Twitter's Recommendation Algorithm（2023）](https://blog.x.com/engineering/en_us/topics/open-source/2023/twitter-recommendation-algorithm)
- [@XEng 公告：开源新 X 算法（Grok 架构）](https://x.com/XEng/status/2013471689087086804)

行业资料（第三方，仅作参照）：

- [igorbrigadir/awesome-twitter-algo（社区注解版）](https://github.com/igorbrigadir/awesome-twitter-algo)
- [TechCrunch：X 在透明度罚单与 Grok 争议中开源算法（2026-01）](https://techcrunch.com/2026/01/20/x-open-sources-its-algorithm-while-facing-a-transparency-fine-and-grok-controversies/)
- [InfoQ：Twitter Open-Sources Recommendation Algorithm（2023）](https://www.infoq.com/news/2023/04/twitter-algorithm/)

站内交叉：

- 本站 [15 分钟搞懂大语言模型](/articles/research/topics/15-minutes-understand-large-language-models)
- 本站 [LLM 涌现能力的临界点](/articles/research/topics/llm-emergent-abilities-threshold)
- 本站 [豆包 App 架构猜想](/articles/research/topics/doubao-app-architecture-conjecture)
</content>

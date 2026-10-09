---
title: "twitter/the-algorithm：7.4 万 star 的旧推荐代码库，现在还能读出什么"
category: topics
topic_type: tech
date: "2026-10-09"
time: "17:30"
tags: [推荐系统, 开源, "X", Scala, 信息流]
subjects: [ai_dev]
summary: "twitter/the-algorithm 是 X 在 2023 年开源的 Scala 推荐系统代码，7,667 个文件、31 次提交，最后一次实质更新停在 2025-09-03；它未归档、未标注后继，但线上排序早已迁到 xai-org/x-algorithm。"
tldr: "它是「生产级推荐系统全链路的可审计切片」，反映 2023—2025 年的过渡态，回答不了 X 现在怎么排序；广为流传的 2023 年权重表来自另一个仓库，主仓库里 30 个权重默认值全是 0.0。"
content_type: analysis
assistance: workbuddy
sources_as_of: "2026-10-09"
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

`github.com/twitter/the-algorithm` 是 X 在 2023 年 3 月开源的推荐系统代码库，今天仍在 GitHub 上、未归档、描述仍写着「Source code for the X Recommendation Algorithm」，7.4 万 star。它的默认分支自 2025-09-03 起没有新提交，而真正决定现在 For You 排什么的代码在 `xai-org/x-algorithm`（Rust，2026-01 创建，Apache-2.0）。旧仓库通篇没有一处指向这个后继。

已经能站住的几个判断：

1. **规模真实**：7,667 个文件、约 29.2 MB，Scala 4,880 个、Java 1,043 个、Python 180 个、Rust 30 个（GitHub Trees API，2026-10-09 读取）。这是一份从线上切出来的代码，不是演示项目。
2. **提交极少**：主分支共 31 次提交，其中 25 次集中在 2023 年 3—7 月，2023-07-07 到 2025-09-03 之间有两年空窗，之后至今未再更新。
3. **权重不在主仓库**：被引用最多的那组互动权重（fav 0.5、reply 13.5、report −369）出自另一个仓库 `the-algorithm-ml` 的 Heavy Ranker README，标注日期是 2023-04-05。主仓库 `HomeGlobalParams.scala` 里 30 个 `home_mixer_model_weight_*` 参数的 `default` 全是 `0.0`，取值区间是 ±10000。
4. **最后一次提交是过渡态快照**：2025-09-03 的 `c54bec0` 一次性新增 65,319 行，GitHub API 能返回的 300 个文件全部落在 `home-mixer`，其中包含 `GrokGoreFilter`、`GrokNsfwFilter`、`GrokSpamFilter`、`GrokViolentFilter` 以及 `PhoenixScorer`、`PhoenixModelRerankingScorer`——LLM 与新排序模型的接入痕迹都在里面。
5. **不可构建、不完整**：仓库没有顶层 `WORKSPACE` / `BUILD` / `.bazelrc`，README 自己写明「We include Bazel BUILD files for most components, but not a top-level BUILD or WORKSPACE file」；可见性库 `visibilitylib` 的 README 声明部分代码已被移除、注释已做 sanitize 处理。

结论：把它当成「2023—2025 年间 X 推荐系统的工程切片」读，价值很高；当成「X 现在怎么排序」读，会读到过期信息。

## 二、事实层

### 仓库基本盘（2026-10-09 读取 GitHub API）

| 项 | 值 |
|---|---|
| 创建时间 | 2023-03-27 |
| 语言 | Scala |
| 许可证 | AGPL-3.0 |
| star / fork | 73,957 / 13,270 |
| open issues | 526 |
| 归档状态 | 未归档（`archived: false`） |
| 默认分支 | `main`，共 31 次提交 |
| 最后一次提交 | 2025-09-03 `c54bec0`「update for-you recommendations code」 |
| 文件数 / 体积 | 7,667 个 / 约 29.2 MB |

主仓库之外还有两个配套仓库：`twitter/the-algorithm-ml`（Python，Heavy Ranker 与 TwHIN 嵌入，10,597 star，仅 2 次提交，最后一次 2023-04-05），以及现在的 `xai-org/x-algorithm`（Rust，Apache-2.0，2026-01-19 创建，33,548 star / 5,433 fork，持续更新）。

### 时间线

| 日期 | 事件 |
|---|---|
| 2023-03-27 | 仓库创建 |
| 2023-03-31 | 官方工程博客发布《Twitter's Recommendation Algorithm》，两个仓库同时公开；官方声明不含广告推荐代码、不发布训练数据与模型权重 |
| 2023-04-04 ~ 05-19 | 陆续开源 Representation Manager / Scorer、User Signal Service、Unified User Actions、Tweetypie、pushservice，更新 README |
| 2023-07-07 | `[opensource] Update home mixer with latest changes`，此后两年无提交 |
| 2025-03-28 | 马斯克宣布 xAI 以全股票交易收购 X，合并后 xAI 估值 800 亿美元、X 估值 330 亿美元（新华社报道） |
| 2025-09-03 | 唯一一次实质性刷新，集中在 `home-mixer` |
| 2026-01-19 | `xai-org/x-algorithm` 创建 |
| 2026-08-13 / 08-14 | 新仓库补齐权重参数文件、可见性过滤系统、Phoenix 训练代码，并追加注释澄清权重的读法 |
| 2026-09-07 / 09-08 | 旧仓库 5 个社区 PR（#16100—#16104）被关闭，未合并 |

### 官方博客给出的线上规模（2023-03-31）

Twitter 工程博客称这套流水线每天运行约 50 亿次，从数亿条候选中选出约 1,500 条，排序用一个约 4,800 万参数的神经网络持续训练，For You 平均约 50% 来自关注的人、50% 来自站外（TechCrunch 2023-03-31 转述）。仓库里 `RETREIVAL_SIGNALS.md` 把候选阶段的量级写成「约 10 亿条收窄到几千条」，`home-mixer/README.md` 写排序前要补齐「约 6,000 个特征」。

## 三、结构分析

### 3.1 一次 For You 请求经过什么

按 `home-mixer/README.md`，For You 的链路是：候选生成（Earlybird 搜索索引、UTEG 用户—推文实体图、Cr Mixer、FRS 关注推荐）→ 特征补齐 → 模型打分排序 → 过滤与启发式（作者多样性、站内站外内容平衡、反馈疲劳、去重、可见性过滤）→ 混排（广告、Who-to-follow、提示）→ 产品特性与下发（会话模块、社交上下文、分页游标、埋点）。

组织上分三层：`product-mixer` 是通用 feed 框架，`home-mixer` 是 For You / Following / Lists 的具体编排，`visibilitylib` 单独负责「这条内容能不能被看见」。这个切分本身是这份代码最有复用价值的部分——排序打分的细节会过期，而「候选源 / 打分 / 混排 / 可见性」四段职责边界不会。

### 3.2 权重：最常被引用的一张表，不在主仓库

网上流传的互动权重来自 `the-algorithm-ml` 的 `projects/home/recap/README.md`，原文标注 2023 年 4 月 5 日，共 10 项：fav 0.5、retweet 1.0、reply 13.5、good_profile_click 12.0、video_playback50 0.005、reply_engaged_by_author 75.0、good_click 11.0、good_click_v2 10.0、negative_feedback_v2 −74.0、report −369.0，公式为「score = Σ 权重 × 预测概率」。

主仓库里的实际情况不同。`home-mixer/.../param/HomeGlobalParams.scala` 的 `ModelWeights` 对象里列了 30 个权重参数（fav、retweet、reply、dwell_0—dwell_4、open_link、screenshot、video_watch_time_ms、negative、report 等），每一个的 `default = 0.0`，只有 report 类的区间被限制在 `[-20000, 0]`。也就是说：仓库给出的是参数名与合法区间，真实线上值由配置服务下发，代码里查不到。

这与官方 2023 年的口径一致——他们公开的是「哪些动作被预测、如何加权求和」，不是「权重现在是多少」。同一份 README 也写明权重会随平台指标周期性调整。

### 3.3 2025-09-03 那次提交，是旧栈的过渡态

`c54bec0` 是仓库唯一一次大规模刷新：+65,319 行、−3,195 行，GitHub API 单次能返回的 300 个文件全部在 `home-mixer` 下。新增内容里有两类值得注意：

- **Grok 系列过滤器**：`GrokGoreFilter`、`GrokNsfwFilter`、`GrokSpamFilter`、`GrokViolentFilter`，以及 `GrokAnnotationsFeatureHydrator`、`GrokTopics` 等特征；`tweet-mixer` 下另有 `GrokFilter.scala`、`PopGrokTopicTweetsCandidateSource.scala`。
- **Phoenix 打分链路**：`PhoenixScorer`、`PhoenixModelRerankingScorer`、`PhoenixClientModule`、`PhoenixPredictedScoreFeature`，参数侧还有 `UseProdInPhoenixParams` 一组开关（默认 `false`）。

Phoenix 正是后来 `xai-org/x-algorithm` 里的排序模型。旧仓库在停更前把新模型的接入层倒了出来，却没倒出模型本身——这解释了为什么它读起来「像旧的，又不完全是旧的」。此外这次提交还带入了 `TuneFeedModule`、`StoriesModule`、`VideoCarouselModule`、`VerifiedPrompt` 等 2024—2025 年的产品形态。

### 3.4 透明度边界落在哪

`visibilitylib` 决定一条内容是被丢弃、加提示层、还是降权，是这套系统里最敏感的部分。仓库里确实有 `rules/` 目录，`AdvancedFilteringRules.scala`、`DownrankingRules.scala`、`PublicInterestRules.scala`、`FreedomOfSpeechNotReach.scala`、`ForEmergencyUseOnly.scala` 都在。但这些文件旁边，README 写着一段明确的限制：

> Visibility Filtering library is currently being reviewed and rebuilt, and part of the code has been removed and is not ready to be shared yet. The remaining part of the code needs further review… Also code comments have been sanitized.

构建侧同样不完整：没有顶层 `WORKSPACE` 或 `BUILD`，README 说「计划未来补充更完整的构建与测试系统」，至今没有。

### 3.5 社区通道的实际状态

README 邀请社区提 issue 与 PR，并承诺「working on tools to manage these suggestions and sync changes to our internal repository」。实际数据是：526 个未关闭 issue，其中多数是用户投诉账号被限流、被贴敏感标签的求助帖，不是代码讨论；2026-09-06 至 09-07 提交的 5 个 PR（涉及 GrokFilter 冷启动、静音作者转推、YAML 安全加载等）在两天内被关闭且未合并；2023-03-31 提交的一个拼写修复 PR（#476）直到 2026-09-14 才关闭。

## 四、外部研判

**读旧仓库的人，多数不知道自己读的是过渡态。** 旧仓库未归档、描述未改、README 未提后继，任何搜索引擎的第一条结果还是它。想看「现在排什么」，应当读 `xai-org/x-algorithm`：那里有 `home-mixer/params/param.rs` 给出当前权重默认值，`visibility-filtering/` 给出过滤规则，Phoenix 提供训练与合成数据脚本。

**把权重表当运营秘籍，是两个层面上的误读。** 一是时间：那张表是 2023 年 4 月的快照，主仓库的对应参数默认值现在是 0。二是量纲：权重乘的是「预测概率」而不是「动作次数」。新仓库 README 在 2026-08-14 专门加注释说明这一点——report 权重比 like 高两个数量级，是因为举报本身比点赞稀少得多，「1 次举报抵消 468 个赞」这种换算是错的。

**2023 年的开源承诺，落到仓库上打了折扣。** 马斯克当时说第三方应能「合理准确地判断用户会看到什么」，并说会根据建议每 24—48 小时更新算法。三年半过去，主仓库 31 次提交、两年空窗、526 个未处理 issue。开源出来的代码结构缺了让系统跑起来的那部分：权重、数据、配置、构建脚本都不在里面。

**对工程师来说，这份代码值钱的地方在于架构切分，不在「算法揭秘」。** 候选源怎么并行、特征怎么补齐、过滤为什么要放在排序之后独立成服务、非内容位（广告、推荐关注、提示）怎么与内容混排——这些工程切分在公开材料里极少见到完整版本。`xai-org/x-algorithm` 延续了同一套切法，说明它经住了换代。

## 五、信息来源与持续验证

主要来源（均于 2026-10-09 读取）：

- GitHub REST API：`twitter/the-algorithm` 仓库元数据、提交列表、`c54bec0` 提交文件清单、PR 与 issue 列表；`twitter/the-algorithm-ml`、`xai-org/x-algorithm` 元数据
- 仓库源码包 `the-algorithm@main`：`README.md`、`RETREIVAL_SIGNALS.md`、`home-mixer/README.md`、`visibilitylib/README.md`、`home-mixer/.../param/HomeGlobalParams.scala`
- `twitter/the-algorithm-ml`：`projects/home/recap/README.md`（Heavy Ranker 权重表，标注 2023-04-05）
- `xai-org/x-algorithm`：`README.md`（含 2026-08-13、08-14、09-18 更新说明）
- Twitter 工程博客《Twitter's Recommendation Algorithm》（2023-03-31）及 TechCrunch 同日报道（官方规模数字、开源范围声明、马斯克表态）
- 新华社 2025-03-29 报道（xAI 收购 X 的交易结构与估值）

会改变结论、需要继续看的缺项：

1. 旧仓库是否会归档、或补上指向 `xai-org/x-algorithm` 的说明。目前两者同名近似，检索极易混淆。
2. `HomeGlobalParams.scala` 中权重默认值为 0 的确切含义。FSParam 机制支持配置服务下发，但仓库未提供配置源，无法从代码确认线上实际取值。
3. 2025-09-03 提交与当时线上 Scala 栈的对应关系。仓库只反映一次快照，无法判断它是完整同步还是局部导出。

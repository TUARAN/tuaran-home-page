---
title: "X 推荐算法：两次开源的代码，和那些始终没公开的判定"
category: topics
topic_type: tech
date: "2026-10-09"
time: "23:15"
tags: [推荐系统, 开源, "X", Scala, Rust, 信息流, Phoenix, 账号限流]
subjects: [ai_dev]
summary: "相隔 34 个月的两次开源：2023 年的 Scala 仓库停在 2025-09-03，2026 年的 xai-org/x-algorithm 每四周更新一次并回写生产参数。两份源码逐文件比对后，能确认的东西比想象中少，也比流传的说法具体。"
tldr: "拉开两代差距的是透明度，不是语言：旧仓库 30 个权重默认值全是 0.0，新仓库 26 个是真实生产值并带同步时间戳。Rust 只接管了每次请求那一层，离线 Scala 资产照搬了过来；够不到的部分从模型参数延伸到了账号一天能发多少。"
content_type: analysis
assistance: workbuddy
sources_as_of: "2026-10-09"
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

X 的推荐算法被开源过两次：2023 年 3 月的 `twitter/the-algorithm`（Scala，AGPL-3.0），以及 2026 年 1 月的 `xai-org/x-algorithm`（Apache-2.0）。两份源码都完整下载、按目录与文件逐一核对过（2026-10-09），能站住的判断有七条。

1. **搜索引擎给的还是前者，能用的只有后者。** 旧仓库未归档、描述未改、README 未提后继，7.4 万 star，默认分支停在 2025-09-03。新仓库 3.3 万 star，最后一次提交就在 2026-10-09，两者互不相指。
2. **权重层面差一个数量级。** 旧仓库 `HomeGlobalParams.scala` 里 30 个 `home_mixer_model_weight_*` 的 `default` 全是 `0.0`；新仓库 `home-mixer/params/param.rs` 的 26 个参数是真实生产默认值，文件头写着 `// mirrored from config feature-switch defaults; last sync 2026-10-08T16:00:35Z`。
3. **网上流传最广的那张权重表不在主仓库。** fav 0.5 / reply 13.5 / report −369 出自配套仓库 `the-algorithm-ml` 的 Heavy Ranker README，标注 2023-04-05，总共 2 次提交。
4. **「Rust 重写」这个说法不准确。** 新仓库 2,240 个文件里 Scala 568、Rust 564、Java 313、Python 470。分界依据是延迟：每次刷新要毫秒级返回的那一层换成了 Rust，离线打标与批处理那一层继续用 Scala。
5. **两代之间唯一肉眼可见的代码继承是 `simclusters`。** 新仓 `simclusters/` 232 个文件里 197 个与旧仓同名，逐文件比对 git blob 哈希，20 个字节完全一致、179 个已经改过，目录树只换了一层前缀。
6. **2026 年这次不只是给代码，还示范了一次真实的算法改动。** `docs/BIDIRECTIONAL_BOOST_CHANGE.md` 记录了「双向关注加权」从 A/B 到全量再到回调节的全过程，仓库里对应的参数是 `15.0`。
7. **透明度最薄的一处不在模型里，在账号额度上。** 内容分发开放到参数级（26 个权重、80 个 RuleId），账号一天能发多少却只有 5 个技术硬顶数字加一句不解释判据的警告。

## 二、事实层

### 2.1 三个仓库同刻度（GitHub REST API，2026-10-09 同一时刻读取）

| 项 | twitter/the-algorithm | twitter/the-algorithm-ml | xai-org/x-algorithm |
|---|---|---|---|
| 创建 | 2023-03-27 | 2023-03-31 | 2026-01-19 |
| 主语言 | Scala 4,880 / Java 1,043 / Python 180 / Rust 30 | Python | Scala 568 / Rust 564 / Java 313 / Python 470 |
| 许可证 | AGPL-3.0 | AGPL-3.0 | Apache-2.0 |
| star / fork | 73,954 / 13,269 | 10,597 / 2,226 | 33,553 / 5,432 |
| open issues | 526 | 52 | 119 |
| 提交数 | 31 次，25 次集中在 2023-03～07 | 2 次 | 46 次，2026-08 有 13 次、09 有 23 次 |
| 最后提交 | 2025-09-03 `c54bec0` | 2023-04-05 `b852108` | 2026-10-09 |
| 文件数 / 字节和 | 7,667 / 29.2 MB | — | 2,240 / 16.6 MB |
| 构建配置 | 968 个 BUILD / BUILD.bazel，无顶层 WORKSPACE | — | 仅 `phoenix/` 一套 Cargo workspace（9 个成员 crate + Cargo.lock） |
| 更新承诺 | 马斯克 2023 年称可 24—48 小时同步一次 | 无 | 每四周一次并附开发者说明；权重由 cron 回写 |

新仓库的文件总数只有旧仓库的 29%，字节数是 57%。

### 2.2 旧仓库的时间线与规模

| 日期 | 事件 |
|---|---|
| 2023-03-27 | 仓库创建 |
| 2023-03-31 | 官方工程博客《Twitter's Recommendation Algorithm》发布，两个仓库同时公开；声明不含广告推荐代码，不发布训练数据与模型权重 |
| 2023-04-04 ~ 05-19 | 陆续开源 Representation Manager / Scorer、User Signal Service、Unified User Actions、Tweetypie、pushservice |
| 2023-07-07 | `[opensource] Update home mixer with latest changes`，此后两年没有提交 |
| 2025-03-28 | 马斯克宣布 xAI 以全股票交易收购 X；合并后 xAI 估值 800 亿美元、X 估值 330 亿美元（新华社报道） |
| 2025-09-03 | 唯一一次实质性刷新，集中在 `home-mixer` |
| 2026-01-19 | `xai-org/x-algorithm` 创建 |
| 2026-08-13 / 08-14 | 新仓库补齐权重参数文件、可见性过滤系统、Phoenix 训练代码，并追加注释澄清权重的读法 |
| 2026-09-06 ~ 09-08 | 旧仓库 5 个社区 PR（#16100—#16104）被关闭，未合并 |

Twitter 工程博客在 2023-03-31 给出的线上规模：这套流水线每天运行约 50 亿次，从数亿条候选中选出约 1,500 条，排序用一个约 4,800 万参数的神经网络持续训练，For You 平均约 50% 来自关注的人、50% 来自站外（TechCrunch 同日转述）。仓库里 `RETREIVAL_SIGNALS.md` 把候选阶段的量级写成「约 10 亿条收窄到几千条」，`home-mixer/README.md` 写排序前要补齐「约 6,000 个特征」。

### 2.3 最后一次提交是旧栈的过渡态快照

`c54bec0` 一次性新增 65,319 行、删除 3,195 行，GitHub API 单次能返回的 300 个文件全部落在 `home-mixer` 下。新增内容分两类：

- **Grok 系列过滤器**：`GrokGoreFilter`、`GrokNsfwFilter`、`GrokSpamFilter`、`GrokViolentFilter`，以及 `GrokAnnotationsFeatureHydrator`、`GrokTopics` 等特征；`tweet-mixer` 下另有 `GrokFilter.scala`、`PopGrokTopicTweetsCandidateSource.scala`。
- **Phoenix 打分链路**：`PhoenixScorer`、`PhoenixModelRerankingScorer`、`PhoenixClientModule`、`PhoenixPredictedScoreFeature`，参数侧还有 `UseProdInPhoenixParams` 一组开关，默认 `false`。

Phoenix 就是后来 `xai-org/x-algorithm` 里的排序模型。旧仓库在停更前把新模型的接入层倒了出来，没有倒出模型本身。这次提交还带入了 `TuneFeedModule`、`StoriesModule`、`VideoCarouselModule`、`VerifiedPrompt` 等 2024—2025 年的产品形态。

### 2.4 新仓库的时间线与请求路径

| 日期 | 事件 |
|---|---|
| 2026-01-10 | 马斯克预告一周内开源新的内容推荐算法，覆盖自然结果与广告的代码，之后每四周更新一次并附开发者说明 |
| 2026-01-20 | 正式开源，称由与 Grok 相同架构的 Transformer 驱动；当时媒体指出仓库未包含权重参数 |
| 2026-05-15 | 第二次发布批次 |
| 2026-08-13 | 补齐 `home-mixer/params/param.rs`、可见性过滤系统与合成数据生成器；Phoenix 从示例模型换成生产训练代码 |
| 2026-08-14 | 追加权重读法注释，并加入 `Brazil2026ElectionFilter` |
| 2026-09-03 | 合并外部贡献者的 PR #88（可见性过滤查询前对站内 id 去重） |
| 2026-09-18 | Under the Hood 透明度工具开始显示合规类限流，含具体国家 |
| 2026-10-08 | 参数文件最后一次同步生产默认值 |

按 README 的架构图，一次 For You 请求在 `home-mixer` 里走九步：Query Hydration（拉行为序列、关注列表、屏蔽静音、已看已推、关注话题）→ 并行查候选源 → Candidate Hydration（正文、作者、计数、语言、订阅状态）→ Pre-Scoring Filters（去重、48 小时时效、自己发的、已看、静音词、屏蔽作者等 19 个过滤器）→ Scoring → TopKScoreSelector → Post-Selection Filters（可见性过滤再过一遍）→ Blending Pipeline（广告、Who to Follow、提示位的插入规则）→ Side Effects（记录服务日志、刷新缓存、埋点）。

候选源默认配额写在 `param.rs` 里：Thunder 1,200、Phoenix 检索 1,000、Phoenix 冷启动 200、SimClusters 开启、tweet-mixer 800（默认关闭）。

## 三、结构分析

### 3.1 语言的落点：按延迟分界

按 crate 拆开统计文件数，语言分布有明确的规律：

| 层 | crate | Rust | Scala | Python / Java |
|---|---|---|---|---|
| 请求装配 | `home-mixer` | 247 | 0 | 0 |
| 候选框架 | `candidate-pipeline` | 11 | 0 | 0 |
| 关注者候选 | `thunder`（内存索引） | 24 | 0 | 0 |
| 排序模型 | `phoenix`、`phoenix-rankall` | 104 | 0 | 229 |
| 打分与权重 | `xai-value-model`、`vm-ranker` | 20 | 0 | 0 |
| 可见性执行 | `visibility-filtering`（含 client） | 112 | 0 | 0 |
| 处罚记账 | `abuse-enforcement-service`、`abuse-ledger-service` | 42 | 0 | 0 |
| 社区发现 | `simclusters` | 0 | 232 | 0 |
| 规则引擎 | `botmaker` | 0 | 147 | 313 |
| 内容理解 | `grox`、`clip`、`media-model-proxy`、`adult-content`、`pnsfwmedia` | 0 | 57 | 207 |
| 异常与信誉 | `agatha`、`scarecrow`、`bdsm`、`user-cred-v2`、`takedowns` | 4 | 108 | 33 |
| 合规披露 | `under-the-hood` | 0 | 20 | 0（另有 9 个 Strato 文件） |

每次刷新都要在毫秒级返回的那一层走 Rust，按天或按事件跑的那一层留在 Scala。`simclusters` 是这条分界线上的例外：它承担 Out-of-Network 候选源的角色，本体仍是 Scala，`home-mixer` 侧用 Rust 的候选源去调用它。

顶层共 28 个目录，最大的几块：`phoenix`（366 个文件、5.4 MB）、`botmaker`（492 个）、`home-mixer`（247 个）、`simclusters`（232 个）、`visibility-filtering`（103 个）、`grox`（197 个）。

### 3.2 继承层：只有 simclusters 留了下来

两个仓库顶层名录相比，交集只有 `home-mixer`（名字没变，语言换了）和 `simclusters`（旧名 `simclusters-ann`），其余全部换名。

`simclusters` 的搬家方式是最直接的证据：新仓 232 个文件里 197 个与旧仓同名，逐文件比对 git blob SHA-1，20 个字节完全一致、179 个改过；目录结构只换了一层前缀（旧的 `src/scala/com/twitter/simclusters_v2/…` 变成新的 `simclusters/simclusters_v2/…`）。这套社区发现系统跨了两代推荐栈，还在原位。

### 3.3 旧模块到新模块的映射

| 旧（2023，Scala） | 新（2026） | 关系 |
|---|---|---|
| `product-mixer` | `candidate-pipeline` | 同一职责：定义六类 stage 的 feed 框架 |
| `home-mixer` | `home-mixer` | 目录名保留，实现换成 Rust |
| Earlybird 搜索索引（关注者源） | `thunder/` | 位置对应，README 描述为「把关注账号的新帖子保存在内存里」 |
| Cr Mixer / UTEG（协同过滤候选） | Phoenix retrieval + `popular_posts_source` | 退场 |
| TwHIN 双塔嵌入（ml 仓库） | Phoenix retrieval 的 6 级 semantic ID 双塔 | 都是用户—内容双塔，不直接对应 |
| Heavy Ranker（约 4,800 万参数） | Phoenix Transformer（Candidate Isolation） | 替换 |
| `visibilitylib` | `visibility-filtering` | 重写，输出收敛为四值 |
| `trust_and_safety_models` | `botmaker` + `scarecrow` + `abuse-*` | 拆散，规则引擎本体第一次公开 |
| `timelines` / `timelineranker` | Rust serving 栈 | 退场 |
| `simclusters-ann` | `simclusters` | 原样搬迁后修改（197 个同名文件） |
| — | `under-the-hood` | 新增，面向用户的合规披露页面 |

新仓库 README 第 251 行写 `candidate-pipeline` 是「`home-mixer` 所基于的框架」；同一份 README 全文检索 `product-mixer`、`earlybird`、`tweetypie`、`timelineranker` 均 0 命中，没有留兼容层。

### 3.4 权重：两代看着像，量纲不同

| 动作 | 2023-04-05（the-algorithm-ml，10 项） | 2026-10-08（x-algorithm param.rs，26 项） |
|---|---|---|
| favorite | 0.5 | 0.5 |
| retweet | 1.0 | 1.0 |
| reply | 13.5 | 5.0 |
| reply 且作者参与 | 75.0 | — |
| good_click / good_click_v2 | 11.0 / 10.0 | — |
| profile_click | 12.0 | 0.0 |
| click（进会话） | — | 0.3 |
| open link | — | 0.2 |
| video playback / video open | 0.005 | 0.07 |
| negative feedback / not interested | −74.0 | −47.52 |
| report | −369.0 | −234.0 |
| mute author | — | −58.8 |
| block author | — | −31.2 |
| share via copy link | — | 20.0 |
| quote | — | 5.0 |
| share via DM | — | 5.0 |
| follow author | — | 4.0 |
| share | — | 2.0 |

两张表不能直接做数学等价。2023 年那组处在 heavy ranker 的输出侧：神经网络对每条候选输出一批动作概率，再做加权求和。2026 年这组处在 `xai-value-model` 的 Phoenix 预测之上，是线性组合层。两边都写明「权重 × 预测概率」，但上一层的模型已经换了。

可以比较的是趋势：`reply` 从旧表里最重的正向信号（13.5）降到 5.0，低于新表里的 `share via copy link`（20.0）；负反馈的绝对值也在收，report 从 −369 到 −234。新表把「拉黑作者」「静音作者」和各类停留时长拆成了独立项，旧表里这些信号没有单独出现。

新仓库里有三处细节值得拆开：

**代码自己写了防误读注释。** `xai-value-model/scoring.rs` 顶部有一段长注释，明确权重乘的是预测概率或连续值（如观看时长），「它们不乘原始互动计数」；举报基线概率比点赞低三个数量级，所以权重大是为了让这个预测还能影响排序。同一段还回应了「恶意批量举报能压热度」的担心：推荐是个性化的，举报主要影响与举报者相似的用户；只有在 Home Timeline 里被投放出去的帖子上产生的行为才计入排名，直接点链接访问不计。

**权重一直在动。** 网上流传较广的一组值里 not_interested 是 −43.2、click 是 0.4，当前文件里是 −47.52 和 0.3。任何转述这组数字的内容都需要核对日期。

**用户级扰动也是一个显式参数。** `weights.rs` 的 `perturbed(sigma, salt, user_id)` 用 MD5 对「盐:用户 ID:动作」取哈希，决定每个权重乘以 `exp(±sigma)` 的方向——同一份配置在不同用户身上会有确定性但不同的微抖，这是实验分桶机制的痕迹。

对照旧仓库：`HomeGlobalParams.scala` 的 `ModelWeights` 对象里 30 个参数每一个的 `default = 0.0`，只有 report 类的区间被限制在 `[-20000, 0]`，其余取值区间是 ±10000。仓库给出的是参数名与合法区间，真实线上值由配置服务下发。

### 3.5 可见性规则：从近 500 KB 的删节本到 4,785 行的完整表

| 项 | 旧 `visibilitylib` | 新 `visibility-filtering` |
|---|---|---|
| 规则载体 | 33 个 Scala 文件、485,726 字节（单文件最大的 `VisibilityPolicy.scala` 152 KB、`Condition.scala` 91 KB） | `rules/` 目录 4,785 行，去重后 80 个 RuleId |
| 输出 | drop、interstitial、downrank 等动作组合 | ALLOW / NOTICE / INTERSTITIAL / DROP 四值 |
| 完整性声明 | README 写明部分代码已移除、注释经过 sanitize | 全目录无 redacted / sanitized / removed 字样 |
| 求值方式 | 规则叠加求值 | 命中第一个 drop 规则即终止 |
| 行数参考 | — | registry.rs 1,094 行、tweet_rules.rs 1,148 行、rule_spec.rs 1,164 行 |

旧仓库 README 那段写得毫不含糊：

> Visibility Filtering library is currently being reviewed and rebuilt, and part of the code has been removed and is not ready to be shared yet… Also code comments have been sanitized.

新仓库的规则引擎另有一条针对推荐场景的设计：有一组规则只在「这条是不关注账号的推荐」时生效，且只能丢弃——高召回抓到的垃圾内容会被从推荐里丢掉，同一个账号的关注者仍能看到。

### 3.6 Phoenix：这次是生产实现

`phoenix/README.md` 明确写了这次放出的是什么：

> Earlier releases shipped a sample transformer ported from the Grok-1 open source release. This release ships the **production implementation itself**… synthetic data generators are included so the whole system runs end to end with nothing external.

几处工程细节：

- **检索用双塔，且生产检索不学用户 ID 嵌入**（`use_user_embedding=False`），用户由他交互过的内容加少量粗粒度画像特征表示，候选侧用残差量化的 6 级 semantic ID 表达。好处是新帖子无需进词表立即可检索。
- **排序用 Transformer，候选之间互不 attend**（Candidate Isolation），只能看观看者上下文。一条帖子的分数不依赖同批次里还有哪些帖子，分数因此稳定、可缓存。
- **哈希嵌入**：检索与排序都用多哈希函数查表，没有需要维护的词表。
- 训练侧保留了一条替换说明：legacy dense-optimizer 配置里用标准 AdamW 替换了内部调优版本，旗舰排序配置与 nano 孪生仍完整使用生产的 Muon 配方。
- `QUICKSTART.md` 给出 Linux + NVIDIA GPU + CUDA 12 + uv + Rust + protoc 3.15 的完整命令序列，从生成合成数据（种子固定，可复现）到训练、checkpoint、serve、发一次 retrieve→rank 请求。

### 3.7 一次完整公开的算法改动

`docs/BIDIRECTIONAL_BOOST_CHANGE.md` 是目前公开材料里少见的东西：一家公司把自己一次真实的提权过程连同事后复盘写出来。

- 2026-07-10：开始 A/B，小比例用户被随机分到 +5 / +10 / +15 / +20，多数人为 0。
- 2026-07-13：初步结果好，向大量用户推 20，同时继续测其他档位。
- 2026-07-24：结合实验数据与站内反馈（有人抱怨世界杯期间看不到够多来自非关注账号的讨论），把值从 20 降到 15。

现在 `param.rs` 里 `BidirectionalFollowReplyWeightBoost = 15.0`，与文档对齐。README 承诺「占流量 10% 以上的实验应当能在仓库里看到」，这份文档是这条承诺的兑现样本。

### 3.8 两边都跑不起来，卡住的地方不同

旧仓库给了 968 个 Bazel BUILD 文件，覆盖 `ann`、`home-mixer`、`visibilitylib` 等绝大多数组件，唯独缺一个统一的 WORKSPACE 入口。README 自己承认计划后续提供完整的构建与测试系统，至今没有。

新仓库倒过来：只有 `phoenix/` 一套完整封装——workspace 声明 9 个成员 crate、带 `Cargo.lock`、`QUICKSTART.md` 给出从生成合成数据到 gRPC serve 的完整命令，`phoenix/python` 侧另有 `pyproject.toml`。其余 27 个顶层目录没有一个带自己的 `Cargo.toml`，仓库也没有根级 workspace，两侧都没有 `.github/workflows`。

结果是：`x-algorithm` 只有 Phoenix 这一段能真跑起来（并且必须用合成数据），旧仓库一段也跑不起来；但旧仓库留了每个部件的构建依赖图，新仓库没有。这是两种不同形状的缺口。

## 四、账号行为额度：看得见的数字，看不见的判据

这套仓库把「一条内容怎么被分发」开放到了参数级。同一家公司在「一个账号一天能发多少」这件事上给的是另一套东西：一个技术硬顶，加一句不解释判据的警告。两组规则都由这批代码的不同部件执行，透明度差别很大。

**官方给出的额度（2026-10-09 读取 limits 页）。**

| 动作 | 2026-05 之前 | 现在（limits 页 current 段） |
|---|---|---|
| 原帖 | 2,400 条/天，不分账号档位 | 未验证账号 50 条/天 |
| 回复 | 计入同一 2,400 额度 | 未验证账号 200 条/天 |
| 关注 | 400 条/天 | 400 条/天 |
| 私信 | 500 条/天 | 500 条/天 |
| 邮箱修改 | 4 次/小时 | 4 次/小时 |

关注那条规则的官方原文如下：

> Following (daily): The technical follow limit is 400 per day. Please note that this is a technical account limit only, and there are additional rules prohibiting aggressive following behavior.

后半句是整份文档里信息量最大的一句：**400 只是技术硬顶，在这之下还有一层不公开的「激进关注」判定**，按数量向 400 靠拢的人往往远没到就已经被拦。回复走的是同一个双层结构——硬顶写在页面上，实际把你拦住的那层写在 policy 里。limits 页另有一条常被忽略的规则：账号关注数超过 5,000 之后，可关注额度改为按该账号的关注比动态折算，400 这时也不再是上限。

**2026-05 那次改版没有发任何公告。** Wayback 上 2026-05-05 的快照还是 2,400，Engadget 在 2026-05-18 才发文，heise、Gigazine、Gadget Review 各自独立佐证。原帖额度一次性削到原来的 1/48，中文互联网在 2026 年 5 月以前写的限额说明基本全部失效。

**日额度不是一整块，被切成 48 个半小时窗口。** 官方原文：

> The daily update limit is further broken down into smaller limits for semi-hourly intervals.

按 200 条/天的未验证档折算，每个半小时窗口只合到 4 条上下。这条能解释最常见的困惑——总量还剩很多却已经发不出去：分布比总数先触顶。

**「一天 1400 条」没有官方出处。** X 从未公布过已验证账号（含 Premium 各档）的发帖与回复上限，limits 页上连未验证档都只给整段数字。流传较广的 1400、1000、1500 全部来自工具商社群的实测估计，彼此还打架（`autotweet` 写 1,000；`xengageai` 写「上限约 1,000、安全值 50–75」）。能当作基准的数据点目前只有一个：2026-10-09 当天，一个真实账号在第 600 条左右被拦。

**真正管用的那一层写在 spam policy 里，它描述的是行为而不是数量。** Platform manipulation and spam policy 的禁止项包含 `bulk, aggressive, high-volume unsolicited replies, mentions, or Direct Messages`，以及重复或高度近似的内容。措辞针对的是行为——手动复制粘贴同一段文案刷几百条，与用脚本发的一致。命中之后账号的有效阈值会被单独下调，于是出现「别人 1400、你 600」。

三类错误提示要分开看：`You've hit the daily limit` 是日硬顶；`Rate limit exceeded` 是半小时间隔窗口；出现 `account temporarily restricted` 或要求人机验证，说明命中的是行为层，此时继续加量会让处罚升级。

**这组规则在代码侧有对应部件，但只有骨架可见。** 执行侧是同一份仓库里的 `botmaker`（147 个 .scala、313 个 .java 的规则引擎本体）、`scarecrow`（事件触发）、`bdsm`（行为序列异常检测）、`agatha`（举报与屏蔽比），以及 `abuse-enforcement-service` 搭配 `abuse-ledger-service`（后者保证被申诉推翻的处罚不会重复施加，记账逻辑写得相当细）。README 同时写明部分 botmaker 规则被扣下。

两侧透明度可以这样并排：

| | 面向内容 | 面向账号行为 |
|---|---|---|
| 载体 | `param.rs` 26 个权重、`visibility-filtering` 80 个 RuleId | help 页额度表 + spam policy |
| 数值 | 生产值可读，带同步时间戳 | 仅技术硬顶可见，已验证账号档位无数字 |
| 判据 | 规则项公开到可逐条核对 | 判定逻辑不公开，只列出被禁止的行为类型 |
| 自查 | Under the Hood 能看到自己帖子被贴的标签 | 看不到，只能从被拦时的错误文案反推 |

Under the Hood 自 2026-09-18 起展示合规类限流（含具体国家），账号行为额度不在其中。

顺带给出一条实操口径（来自官方文档的边界，非仓库内容）：官方没有写明确的恢复时限，社区实测较一致的处置是停止一切回复 24 小时，期间正常浏览、点赞、发少量原帖，不要零星试探；恢复之后从前一次触发量的一半起步，并把节奏摊平到全天的各个半小时窗口。第三方工具会消耗同一个账号额度（官方写明额度按账号跨 web、移动端与 API 合并计算），后台挂着的自动化任务需要一并计入。

## 五、外部研判

**把权重表当运营秘籍，是两个层面上的误读。** 一是时间：流传最广的那张表是 2023 年 4 月的快照，主仓库当时的对应参数默认值是 0。二是量纲：权重乘的是预测概率而不是动作次数，report 权重比 like 高两个数量级，是因为举报本身比点赞稀少得多，「1 次举报抵消 468 个赞」这种换算是错的。

**2023 年的开源承诺，落到仓库上打了折扣。** 马斯克当时说第三方应能「合理准确地判断用户会看到什么」，还说会根据建议每 24—48 小时更新算法。三年半过去，主仓库 31 次提交、两年空窗、526 个未处理 issue，其中多数是用户投诉账号被限流、被贴敏感标签的求助帖，不是代码讨论；2026-09-06 至 09-07 提交的 5 个 PR（涉及 GrokFilter 冷启动、静音作者转推、YAML 安全加载等）在两天内被关闭且未合并；2023-03-31 提交的一个拼写修复 PR（#476）直到 2026-09-14 才关闭。

**2026 年这一侧把承诺换成了两类可核对的机制。** 一是写回：`home-mixer/params/param.rs` 文件头那行同步时间戳是可被验证的产物，配置有没有同步，看这一行就够。二是留痕：README 承诺占流量 10% 以上的实验应当能在仓库里看到，`docs/BIDIRECTIONAL_BOOST_CHANGE.md` 是兑现样本，外部贡献者的 PR #88 也在 2026-09-03 被合并。用户侧还多了 Under the Hood（页面在 `x.com/i/jf/under_the_hood`），能看到自己的账号与帖子被贴了哪些影响可见性的标签。

**「Rust 重写」这个说法把事情说偏了。** 真正的划分依据是延迟：在线路径全盘重写为 Rust，离线层能搬就搬。`simclusters` 那 197 个同名文件、20 个字节一致，说明这类资产的价值高于重写成本。一个跑了近十年的推荐系统换代时，通常先换掉的是 serving 层，离线构图与统计那一层留得最久。

**两次开源给的东西不在一个层次。** 2023 年给的是结构合法性：证明这家公司确实在用候选、补齐、打分、过滤、混排这套工业链路。2026 年给的是参数可核查：能看见 26 个权重的值、上一次同步的时间，以及一次真实实验为什么被回调、回调到多少。对工程师来说，这部分代码值钱的地方在于架构切分——候选源怎么并行、特征怎么补齐、过滤为什么要放在排序之后独立成服务、非内容位怎么与内容混排，这些工程切分在公开材料里极少见到完整版本。

**star 数倒挂本身说明了一件事。** 旧仓库比新仓库多 40,401 个 star，却连自己代码里的默认值都没给出来。一个合理的解释是 2023 年那次是新闻事件，star 表达的是情绪；2026 年这次是查询习惯与工具链依赖。还在 bookmark 旧链接的人，把 URL 换掉就行。

**两次开源的动机窗口也不一样。** 2023 年那次是收购后的公开承诺；2026-01 这次赶在欧洲监管窗口上——据 heise 2026 年 1 月报道，欧盟在 2025 年 12 月以透明度缺陷为由对 X 处以 1.2 亿欧元罚款（金额为媒体报道口径）。按这个时间线，「每四周更新 + 权重 cron 回写 + Under the Hood」这套组合更像持续合规动作，与一次性公关的定位不同。

**同一个取舍延续到了账号行为一侧。** 官方只公开发帖、回复、关注的技术硬顶，扣下判定阈值本身，理由仍然是防止被用来钻空子。认下这条边界，可引用范围就明确了：内容分发规则可以引确切数值，账号行为规则只能引官方给出的上限与适用范围，低于硬顶的那些都不能当成已知事实。

## 六、信息来源与持续验证

主要来源（均于 2026-10-09 读取）：

- GitHub REST API：三个仓库的元数据、提交列表；`twitter/the-algorithm` 的 trees 与 contents（`simclusters-ann`、`visibilitylib/rules` 逐文件）、`c54bec0` 提交文件清单、PR 与 issue 列表
- 两份源码包 `the-algorithm@main` 与 `x-algorithm@main`：后者本地解压后按 crate 统计语言分布，并对 `simclusters/` 逐文件计算 git blob SHA-1 与旧仓库比对
- `twitter/the-algorithm`：`README.md`、`RETREIVAL_SIGNALS.md`、`home-mixer/README.md`、`visibilitylib/README.md`、`home-mixer/.../param/HomeGlobalParams.scala`
- `twitter/the-algorithm-ml`：`projects/home/recap/README.md`（Heavy Ranker 权重表，标注 2023-04-05）
- `xai-org/x-algorithm`：`README.md`、`docs/BIDIRECTIONAL_BOOST_CHANGE.md`、`home-mixer/params/param.rs`、`xai-value-model/scoring.rs`、`xai-value-model/weights.rs`、`phoenix/README.md`、`phoenix/QUICKSTART.md`、`phoenix/Cargo.toml`、`visibility-filtering/rules/`
- Twitter 工程博客《Twitter's Recommendation Algorithm》（2023-03-31）及 TechCrunch 同日报道；新华社 2025-03-29 报道（xAI 收购 X）；IT 之家、heise online、每日经济新闻 2026 年 1 月报道（开源公告、更新频率承诺、欧洲监管背景）
- 账号行为额度部分（第四章）：X 官方帮助中心《X rate limits》与《Platform manipulation and spam policy》原文；Engadget 2026-05-18 报道、heise online、Gigazine、Gadget Review 对同次改版的佐证；Wayback Machine 2026-05-05 快照（改版前仍是 2,400）；工具商 `autotweet` 与 `xengageai` 的实测估计（用于说明 1400 这类数字的来源）；2026-10-09 一个真实账号在第 600 条左右被拦（单点样本，不作基准）

会改变结论、需要继续看的缺项：

1. `param.rs` 的同步时间戳是否持续推进。当前是 `2026-10-08T16:00:35Z`；若长时间停在某一日期，README 描述的 cron 回写机制就需要重新评估。
2. 旧仓库是否会归档，或补一句指向 `xai-org/x-algorithm` 的说明。目前两者名字近似且互不相指，检索混淆仍在发生。
3. `simclusters` 之外是否还有其他 Scala 模块属原样搬迁。本次只逐文件比对了 `simclusters/`，`agatha`、`scarecrow`、`user-cred-v2` 存在同名文件的可能性没有排除。
4. Grok 的 `.j2` 提示词与未公开的 botmaker 规则是否会放开。这决定内容理解这一层能否被独立验证。
5. Phoenix 生产配置与 nano 预设之间的差距。README 说 nano「几何结构与生产一致」（排序侧）或「另有差异」（检索侧），但生产集群的真实宽度、深度与训练数据规模均未公开。
6. 官方 limits 页是否还会变动。2026-05 那次把未验证账号的原帖额度从 2,400 削到 50 且未发公告，同一页的数字存在再次静默调整的可能；引用前需要重读页面并记下读取日期。
7. 「每天 1400 条回复」这类数字是否会拿到任何官方出处。目前它只存在于工具商社群的实测估计中，且各家数值不一致。

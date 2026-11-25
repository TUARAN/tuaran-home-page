---
title: 大模型降本的三条开源路线：任务路由、指令优化与消耗量控制
category: topics
date: 2026-11-25
time: 17:20
tags: [AI, 大模型, 开源, 模型路由, 成本优化]
summary: 开源方案已经把「每次调用选哪个模型、提示词怎么写、单次调用发多少 token」拆成三条可叠加的优化路线，先观测和缓存通常比上学习路由更快见效。
tldr: 路由决定「选谁」，提示词优化决定「怎么说」，消耗量控制决定「发多少」；三层作用于账单的不同环节，按观测、缓存、上下文卫生、分级路由、离线提示词优化的顺序投入，收益递增、风险递减。
topic_type: tech
subjects: [ai_dev]
content_type: analysis
assistance: workbuddy
review_ready: false
ad_eligible: false
auto_images: false
pv: 0
---

## 一、先给结论

先给结论：大模型成本优化的开源方案已经收敛成三条成熟路线——请求级任务路由、离线提示词优化、单次调用内的消耗量控制。三条路线作用于账单的不同环节，可以叠加，投入顺序比选哪个工具更重要。

目前能站住的判断有五个：

1. 任务路由的标杆是 RouteLLM（UC Berkeley LMSYS，2024 年 7 月发布，ICLR 2025 接收）。论文口径：MT Bench 基准上最高降低 85% 成本、保住 95% 的 GPT-4 质量；同样 95% 质量线，MMLU 约省 45%、GSM8K 约省 35%。这些数字来自基准集，落到自己业务会缩水，取决于简单请求的占比。
2. 提示词优化已经从手写走向「编译」。DSPy 的优化器阶梯（BootstrapFewShot → MIPROv2 → GEPA）和微软 PromptWizard 都把指令与 few-shot 示例当可搜索参数；GEPA 论文报告以更少的 rollout 取得超过 MIPROv2 的增益。前提是任务有可计算的评测指标，没有指标就无从优化。
3. 单次调用的消耗大头是上下文。微软 LLMLingua 号称最高 20 倍提示词压缩；语义缓存对重复率高的流量能拿到 25%–60% 的命中。缓存消灭整次调用，是单一杠杆里最便宜的。
4. 学习路由有前提：需要流量分布和质量标注。没有标注时，按任务类型静态分档（轻任务走小模型）是更诚实的起步，多数团队的收益大头也在这里。
5. 三条路线共同的前提是观测。没有按调用归因的 token 与成本记录，任何优化都验证不了效果；生态里两个常用观测项目（Langfuse、Helicone）2026 年先后被并购，选型时归属是变量。

## 二、事实层

### 2.1 任务路由：判断每个请求该用哪个模型

| 项目 | 定位 | 协议 | 判断 |
|---|---|---|---|
| LiteLLM | 多厂商网关 + 规则路由 | MIT | [!good]维护活跃，星标约 63.9k（2026-11-25 检索）[/!good] |
| RouteLLM | 学习型强/弱二分路由 | Apache-2.0 | [!warn]论文与代码齐备，但仓库 2024-08 后未再更新[/!warn] |
| semantic-router（Aurelio） | 嵌入相似度做意图分派 | MIT | [!warn]组件级，需自建策略[/!warn] |
| vLLM Semantic Router | 自托管推理栈的信号驱动路由 | 开源 | [!warn]部署链路重（Envoy + Go）[/!warn] |
| LLMRouter（ulab-uiuc） | 16+ 路由实现对比框架 | 开源 | [!risk]仅见第三方转述，未核一手[/!risk] |

RouteLLM 的机制值得展开。它训练轻量分类器预测「这个请求是否需要强模型」，训练数据来自三层：Chatbot Arena 约 8 万条人类对战偏好、约 1500 条 MMLU 有标准答案的对照样本、用 GPT-4 当裁判在 Nectar 数据集上批量生成的约 12 万条偏好样本（官方口径成本约 700 美元）。仓库提供四类预训练路由器：矩阵分解（官方推荐）、相似度加权 Elo、BERT 分类器、因果 LLM 分类器。论文定义了两个工程指标：PGR（路由方案追回强弱模型质量差距的比例）和 CPT（达到指定 PGR 需要调用强模型的最低比例）。一个对工程友好的发现：路由器学的是问题难度特征，更换强弱模型组合后无需重训，论文报告跨模型对迁移时 PGR 只掉 2–3 个百分点。

RouteLLM 的边界同样明确：只支持强/弱二分，没有 8B/70B/旗舰多档调度；零标注冷启动时精度明显下滑；训练只覆盖纯文本对话；未结合 token 长度、限流、实时价格做动态阈值。这些都在论文自己的局限清单里。

LiteLLM 走另一条路：把 100 多家厂商收进一个 OpenAI 兼容接口，路由靠规则配置——按模型、成本、延迟、fallback 链，附带按 key 的预算封顶与成本统计。它不判断「这个请求难不难」，但给了团队最需要的支出硬约束。两者常被叠着用：LiteLLM 做网关，RouteLLM 挂在它后面做按请求的智能分流。

semantic-router 用嵌入相似度做路由决策，不调 LLM，官方生态口径约 100 毫秒出决策（对比让 LLM 判断要数秒）。vLLM Semantic Router 更进一步，在 Envoy 代理后面按意图、复杂度、安全信号分类，内置语义缓存、越狱检测、PII 过滤，适合自托管 vLLM 推理栈的生产场景，代价是 Envoy + Go 的部署链路。

另有 ulab-uiuc 的 LLMRouter（2025 年 12 月，第三方文章称含 16 种以上路由实现），[!warn]一手信息未核，引用前回查[/!warn]。

热度与维护状态是这一层的现实约束（星标与最近提交为 2026-11-25 GitHub API 检索）：LiteLLM 约 63.9k 星、当天仍有提交；RouteLLM 约 5.7k 星，但仓库最后一次实质更新停在 2024 年 8 月——论文结论依然成立，工程上要按「研究原型已冻结」来预期，遇到 bug 需要自己动手。vLLM Semantic Router 约 6.5k 星、更新活跃，是学习路由思想在自托管栈里的现役延续。

### 2.2 指令优化：把提示词当可搜索的参数

DSPy（Stanford NLP）的定位是把提示词工程变成编译问题：程序写好后，优化器在指令与 few-shot 示例的空间里搜索，产出可保存、可复用的编译产物。官方文档把十几个优化器排成一条成本阶梯：

- `LabeledFewShot`：零 LM 调用，从训练集采样示例挂上去，做基线。
- `BootstrapFewShot`：用教师模型跑通程序轨迹，按指标过滤出有效示例。几分钟、几乎零成本。
- `MIPROv2`：贝叶斯优化同时搜指令和示例，指标当黑盒分数。官方建议 200 例以上、40 轮 trial 以上的预算。
- `GEPA`：反思式进化。指标返回 `Prediction(score, feedback)`，GEPA 读执行轨迹和自然语言反馈，让反思 LLM 诊断失败原因、提出新指令，在 Pareto 前沿上保留多个互补候选。GEPA 论文口径：GPT-4.1 Mini 上聚合增益 +12.2 分（MIPROv2 为 +5.6），产出的提示词最多短 9.2 倍，rollout 比 RL 少约 35 倍。
- `BootstrapFinetune`：把提示词程序蒸馏成权重，官方文档明确这是最后一级杠杆——增益有限、成本大得多。

成本上有个关键量级：一次 MIPROv2 或 GEPA 编译可能花掉几百美元的 LM 调用（DSPy 官方文档口径），简单任务约 2 美元起。经济学成立的前提是「编译一次、产物长期复用」，编译产物只是提示词和示例文本，推理时不再花钱。

微软 PromptWizard（MIT，星标约 4.0k，2026-11 检索）是另一条实现路径：LLM 自己生成、批评、修订提示词与示例，两阶段进行——第一阶段迭代改指令，第二阶段针对弱点合成正例、反例和思维链示例。官方口径在 45 个任务上评估，单个数据集优化约 20–30 分钟，在小模型和少样本场景优势明显。它比 DSPy 轻，适合只想拿到一条更好提示词、不想引入整套框架的团队。

TextGrad（Stanford）用「文本梯度」对单条提示词做迭代修订，机制上与 GEPA 同源但只维护单候选，容易陷局部最优；多任务、多目标的场景 Pareto 前沿结构更有优势。

### 2.3 消耗量控制：同一次调用少花钱

消耗量控制作用于调用内部，手段按激进度排序：

**缓存层**。厂商侧 prompt caching（Anthropic、OpenAI、Bedrock、Gemini 均提供）对重复前缀打折，是零改造成本的基线。应用侧语义缓存更进一步：把请求嵌入后按相似度匹配历史答案，命中就跳过模型调用。GPTCache（Zilliz）是这一类最知名的开源实现，生态文章给出的命中率区间在 25%–60%（取决于流量重复度）；但仓库最后一个正式版本停留在 2024 年 8 月，[!risk]维护状态存疑，依赖前需评估[/!risk]。

**压缩层**。微软 LLMLingua 系列用小模型按困惑度剪掉低信息 token，项目口径最高 20 倍压缩、任务性能损失可控；LLMLingua-2 用蒸馏 BERT 换速度，LongLLMLingua 专攻长上下文。代价要记两条：压缩改变提示词文本，会击穿前缀缓存；激进压缩在生成类任务上质量漂移比分类任务明显，上自己的任务前必须回测。

**上下文卫生**。这是没有专用工具但收益确定的一层：对话历史用便宜模型摘要化（近期轮次保留原文）、RAG 检索结果用 reranker 剪到 2–3 段、工具/日志输出先压缩再进上下文。生态文章口径这些做法能砍掉 40%–75% 的上下文 token，数字因负载而异，方向上没有争议。

**观测层**。Langfuse（MIT，星标约 37.8k，2026-11-25 检索）提供按调用的 token、成本、缓存命中追踪，2026 年 1 月并入 ClickHouse 后声明继续开源可自托管；Helicone（约 6.3k 星）2026 年 3 月并入 Mintlify并宣布转入维护模式，新选型需要掂量。个人开发者看 Claude Code 花销还有 ccusage 这类轻量统计工具。

### 2.4 客户端侧：把路由装进现成智能体

不想自己写路由代码，2026 年已经有三档现成方案，按接入成本从低到高排列。

**桌面客户端的官方入口**。Claude Desktop 的 Developer 菜单里有 Third-Party Inference 配置：Connection 选 Gateway，把 base URL 指向 OpenRouter，登录后整个 agent harness（skills、插件、MCP、文件工具）就跑在任意模型上，选模型变成模型选择器里的一个动作。据 2026-11 的第三方整理，该功能处于研究预览、已文档化；[!warn]未直接核对官方文档页，引用前回查[/!warn]。企业侧同一入口支持 Bedrock、Vertex、Foundry，用于把数据留在已批准的云边界内。

**远程 MCP**。OpenRouter 官方 MCP Server（`https://mcp.openrouter.ai/mcp`，2026-06 发布）把实时模型目录、Artificial Analysis 与 Design Arena 的第三方评分、逐供应商定价、试推理做成 11 个工具，OAuth 授权后生成带消费上限的专用 key。客户端只填一个 URL 就能让智能体自己回答「这个任务现在该用哪个模型」，选型标准从人脑里搬进了可查询的工具。

**本地 MCP 装机脚本**。frugal 用 `frugal mcp install` 自动检测 Claude Desktop、Cursor、Claude Code 并合并配置，把搜索、抓取、浏览等工具调用路由到最便宜的可用 provider（免费与本地优先，付费兜底）；llm-router 走同一模式，按 prompt 复杂度分档并本地记账、报告估算节省。两者装完即用，代价是路由逻辑只能用它内置的策略档位。

**本地网关**。OmniRoute（cheaper-inference/OmniRoute，MIT，星标约 90.2k，2026-11-25 检索）把 375 家 provider 收进一个本机端点，带 19 种路由策略、自动降级、内置压缩和一个 105 工具的管理型 MCP server。网关跑在本机，密钥不出本机，适合对第三方中转有隐私要求的场景；prompt 仍会发给你配置的 provider，数据流向取决于这份配置。

## 三、结构分析

三条路线乘在一起决定账单：账单 ≈ 调用次数 × 每次选的模型单价 × 每次发的 token 量。缓存压调用次数，路由压模型单价，压缩和上下文卫生压 token 量。任何一层做到位，其余层的收益会等比例缩小，投入顺序应该先看自己账单的哪一项最大。

路由策略本身分三代，选哪一代取决于三个判断标准。静态规则按任务类型、输入长度、用户等级分档，可解释、好维护，多数生产环境停在这一代；信号驱动用嵌入相似度或复杂度分类器替代人工规则，semantic-router 这类方案约 100 毫秒出决策；学习型用偏好数据训练路由器，把「用户更满意哪个模型」变成目标函数。跨代共用的评价口径是 PGR 与 CPT：PGR 衡量路由追回了多少强弱模型的质量差距，95% 是常见的上线及格线；CPT 衡量达到目标 PGR 需要多少比例的请求走强模型，数值越低越省钱。三个判断标准依次是：错误成本是否远高于 token 成本（是就不该分档，如安全审计、架构设计）、简单请求占比有多高（决定学习路由的收益上限）、有没有可标注的评测数据（决定能不能进入学习型）。

路由层真正卡住工程落地的是质量归因。便宜模型答错一次的返工成本（人工复核、重跑、下游修复）可能超过省下的 token 钱；RouteLLM 的 PGR/CPT 把「用户偏好保持率」当目标函数，意味着部署前要有一套能代表自己流量的评测集，部署后要持续盯路由决策的质量漂移——小模型能力随版本更新变化时，路由器会继续把请求发给已经答不好的模型。第三方实践文章给出的共识是：先静态规则、量出各档成本、再决定要不要上学习路由，多数团队在静态规则阶段就吃到了大部分收益。

提示词优化的经济学取决于任务可否评测。DSPy 全家桶的每一级优化器都需要 metric，GEPA 还需要 metric 能产出诊断性文字反馈；「感觉输出不够好」这种不可计算的目标，优化器无从下手。编译成本一次几百美元的量级，也决定了它只适合长期复用的固定任务（如每天的调研稿、固定的抽取管道），不适合一次性需求。

消耗量层内部有冲突要管理：压缩改写前缀，前缀缓存要求前缀稳定，两者叠加时可能压缩省的钱被缓存失效吐回去。正确做法是分层处理——稳定的系统指令和工具定义保持字节级稳定吃缓存，易变的检索内容和历史对话走压缩或摘要。语义缓存另有一个安全边界：带 PII 或用户私有内容的请求不该进共享缓存，语义「相似」匹配答非所问的风险也要和命中率一起监控。

维护风险集中在长尾项目上。这一领域头部项目（LiteLLM、DSPy、LLMLingua、vLLM）背后有公司或大学实验室持续投入，而 GPTCache 停更、Helicone 转维护模式说明观测与缓存这两层的格局还在变动；2026 年两个并购事件（Langfuse→ClickHouse、Helicone→Mintlify）提示选型时要评估归属方对开源承诺的持续性。

## 四、外部研判

把上面的机制落成一套可执行的分层设计，按投入产出排序：

<figure class="research-inline-diagram">
<svg viewBox="0 0 720 340" role="img" aria-label="大模型成本优化的五层设计：观测先行，然后缓存、上下文卫生、分级路由、离线提示词优化，质量守门贯穿全部层">
<defs>
<marker id="arrow-guard" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
<path d="M0,0 L6,3 L0,6 Z" fill="#44337A"/>
</marker>
</defs>
<rect x="40" y="40" width="460" height="44" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="1"/>
<text x="60" y="67" font-size="14" font-weight="bold" fill="#0C447C">① 观测先行：按调用记录 token、成本与用途归因</text>
<rect x="40" y="96" width="460" height="44" rx="8" fill="#E8F5EC" stroke="#2F7D4F" stroke-width="1"/>
<text x="60" y="123" font-size="14" font-weight="bold" fill="#1F5E3D">② 缓存：厂商前缀缓存打底，重复流量加语义缓存</text>
<rect x="40" y="152" width="460" height="44" rx="8" fill="#FFF3E0" stroke="#B26A00" stroke-width="1"/>
<text x="60" y="179" font-size="14" font-weight="bold" fill="#8A5200">③ 上下文卫生：历史摘要化、RAG 剪枝、工具输出压缩</text>
<rect x="40" y="208" width="460" height="44" rx="8" fill="#E6F1FB" stroke="#185FA5" stroke-width="1"/>
<text x="60" y="235" font-size="14" font-weight="bold" fill="#0C447C">④ 分级路由：静态规则起步，有标注后上 RouteLLM</text>
<rect x="40" y="264" width="460" height="44" rx="8" fill="#E8F5EC" stroke="#2F7D4F" stroke-width="1"/>
<text x="60" y="291" font-size="14" font-weight="bold" fill="#1F5E3D">⑤ 提示词离线优化：DSPy 阶梯或 PromptWizard，编译一次复用</text>
<rect x="530" y="40" width="160" height="268" rx="8" fill="#F3EFFB" stroke="#5B4A9F" stroke-width="1"/>
<text x="610" y="70" text-anchor="middle" font-size="14" font-weight="bold" fill="#44337A">质量守门</text>
<line x1="510" y1="170" x2="524" y2="170" stroke="#44337A" stroke-width="1.5" marker-end="url(#arrow-guard)"/>
<text x="546" y="100" font-size="12" fill="#44337A">golden set 回归</text>
<text x="546" y="122" font-size="12" fill="#44337A">省钱幅度与质量</text>
<text x="546" y="144" font-size="12" fill="#44337A">损失同屏对比</text>
<text x="546" y="166" font-size="12" fill="#44337A">低于基线 95%</text>
<text x="546" y="188" font-size="12" fill="#44337A">即回滚该层改动</text>
<text x="60" y="330" font-size="12" fill="#666666">自上而下＝先做→后做；每做一层都要过质量守门再保留</text>
</svg>
<figcaption>图 1：成本优化五层按先做后做排序，任何一层改动都须经质量守门验证后保留</figcaption>
</figure>

对一个小流量、任务以文本生成为主的个人或团队站点，具体建议是：

1. **先观测两周再动手**。日志记录每次调用的用途标签、token 数、模型、成本。多数账单的真相是一两个功能占了大头，先修那个。
2. **打开厂商前缀缓存**，这是改配置就有的钱。系统指令、工具定义保持字节级稳定。
3. **做上下文卫生**，对话历史摘要化、检索结果剪枝。这一层不需要引入任何新依赖。
4. **静态分级路由**：按任务类型显式分档——摘要、格式化、简单抽取走小模型，推理、代码、长文生成走强模型。规则写在自己代码里，不急着上框架。
5. **两个条件同时满足再上学习路由**：简单请求占比高（观测数据能证明），且已有一套能标注质量好坏的评测集。届时 RouteLLM 挂在 LiteLLM 后面是社区验证过的组合。
6. **固定任务用离线提示词优化**：10 条标注数据起步先跑 `BootstrapFewShot`，数据到 200 条以上、指标能给出文字反馈时再考虑 GEPA。编译产物存进版本库，当成代码资产管理。
7. **每层改动跑一次 golden set 回归**：100 条左右有标注的代表性请求，省钱幅度和质量得分同屏看，质量掉到基线 95% 以下就回滚。

反过来的情形也成立：流量小、任务以强推理为主、没有评测能力的场景，这套分层的前三层就够了——学习路由和提示词优化器的编译成本在这种场景下收不回来。

## 五、信息来源与持续验证

主要来源（检索截至 2026-11-25）：

- RouteLLM：论文 arXiv:2406.18665、lm-sys/RouteLLM 仓库 README、LMSYS 2024-07-01 发布博客；成本与质量数字均为论文在公开基准上的口径。
- DSPy：dspy.ai 官方 Optimizers 选择指南与优化器文档；GEPA 增益数字转引自 GEPA 论文口径与多篇第三方解读，未逐条复核原始论文表格。
- PromptWizard：microsoft/PromptWizard 仓库 README 与微软 Foundry Labs 项目页；45 任务、20–30 分钟为官方口径。
- LLMLingua：microsoft/LLMLingua 项目页；20 倍压缩为项目自报基准。
- LiteLLM、semantic-router、vLLM Semantic Router、GPTCache：各仓库页与第三方选型对比文章（klymentiev.com 2026、smfclearinghouse.com 2026、pointfive.co 2026、ecorpit.com 2026）。
- 客户端侧：OpenRouter MCP 官方文档页；Claude Desktop 第三方推理的配置步骤转引自 eigent.ai 2026-11 的整理文章；OmniRoute、frugal、llm-router 的参数转引自 followagents.com、skillselion.com、mcptrove.com 的目录条目，OmniRoute 星标经 GitHub API 核过。
- 星标数为 2026-11 检索时点的第三方口径，会随时间漂移。

持续验证（会改变结论的缺项）：

- RouteLLM 仓库自 2024 年 8 月未更新，是否仍有社区 fork 或后继项目接手维护。
- Claude Desktop 第三方推理入口的官方状态：研究预览是否转正式、支持哪些模型与网关协议，目前依据第三方整理。
- ulab-uiuc LLMRouter 的实现数量与维护状态，目前仅见第三方转述。
- GEPA 相对 MIPROv2 的优势在自有任务上是否复现，论文数字不能直接外推。
- GPTCache 停更后的替代（vCache 等）成熟度，影响语义缓存选型结论。
- vLLM Semantic Router 的生产案例数量，影响自托管场景的重部署成本判断。

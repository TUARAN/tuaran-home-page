---
title: Agent Harness 也有 benchmark：评分榜与评测工作台现状
category: topics
date: 2026-11-20
time: 15:30
tags: [AI Agent, Harness, Benchmark, 评测, Terminal-Bench, SWE-bench, olmo-eval, AI 工程]
summary: 模型有各种 benchmark，harness 也有。梳理给 harness 打分的几类 bench、当前能用的评分榜，以及把评测流程产品化的 workbench。
tldr: 截至 2026-11-20，harness 已经有专门的 benchmark，固定模型只换 harness 的分差能到 23.8 分。综合选型看 Artificial Analysis Coding Agent Index，研究 harness 本身看 Harness-Bench；把评测做成可反复跑的工作台，Allen AI 的 olmo-eval 是明确以 evaluation workbench 定位的开源选项。没有一张覆盖所有场景的权威榜，各榜口径和版本不同，分数每周都在变。
topic_type: tech
subjects: [ai_dev]
content_type: analysis
assistance: workbuddy
model: hunyuan-hy
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
auto_images: false
---

> 适用范围：以下分数来自各榜单自己的公开页面，版本、任务集和推理力度不同，彼此不能直接换算。数据截至 2026-11-20，引用具体数字前回查原榜。

## 一、harness 是什么，凭什么也要单独打分

一个能干活的 agent，等于模型加上包在它外面的一层软件。这层软件管上下文怎么拼、压缩时丢什么、模型能调哪些工具、权限卡在哪里、状态怎么跨轮保存、工具失败怎么重试、整个循环怎么往下走。LangChain 把它写成一句 `Agent = Model + Harness`，METR 早些年用的词是 scaffolding。

模型负责推理，harness 决定推理能看到什么、能做什么、做完怎么验证。Claude Code、Codex CLI、Aider、OpenHands、SWE-agent 都是同一类东西的不同设计选择。arXiv:2606.10106 甚至给了一个形式化判定：有 agent loop、工具接口、上下文管理和控制机制，就算 harness。

为什么突然要给这层单独打分？因为有实测把模型和 harness 拆开了。

Harness-Bench（arXiv:2605.27922，360 团队）固定 106 个离线任务和 8 个模型后端，只换 harness，跑出 5,194 条轨迹。6 个可配置 harness 里，NanoBot 综合分 76.2，OpenClaw 52.4，差 23.8 分。同一批模型、同一套任务，分差全来自脚手架。

<figure class="research-inline-diagram">
<svg viewBox="0 0 720 350" role="img" aria-label="Harness-Bench 中六个可配置 harness 在固定模型和任务下的综合分条形图，从 NanoBot 76.2 到 OpenClaw 52.4，跨度 23.8 分">
<text x="24" y="30" font-size="15" font-weight="700" fill="#0C447C">固定模型与任务，只换 harness（Harness-Bench，106 任务 × 8 模型）</text>
<text x="40" y="70" font-size="13" fill="#1F1F1F">NanoBot</text>
<rect x="170" y="56" width="443" height="22" rx="4" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="622" y="72" font-size="13" font-weight="700" fill="#0C447C">76.2</text>
<text x="40" y="112" font-size="13" fill="#1F1F1F">Hermes</text>
<rect x="170" y="98" width="414" height="22" rx="4" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="593" y="114" font-size="13" font-weight="700" fill="#0C447C">71.2</text>
<text x="40" y="154" font-size="13" fill="#1F1F1F">Moltis</text>
<rect x="170" y="140" width="400" height="22" rx="4" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="579" y="156" font-size="13" font-weight="700" fill="#0C447C">68.8</text>
<text x="40" y="196" font-size="13" fill="#1F1F1F">NullClaw</text>
<rect x="170" y="182" width="374" height="22" rx="4" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="553" y="198" font-size="13" font-weight="700" fill="#0C447C">64.4</text>
<text x="40" y="238" font-size="13" fill="#1F1F1F">ZeroClaw</text>
<rect x="170" y="224" width="357" height="22" rx="4" fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5"/>
<text x="536" y="240" font-size="13" font-weight="700" fill="#0C447C">61.4</text>
<text x="40" y="280" font-size="13" fill="#1F1F1F">OpenClaw</text>
<rect x="170" y="266" width="305" height="22" rx="4" fill="#FCE8E6" stroke="#A32D2D" stroke-width="0.5"/>
<text x="484" y="282" font-size="13" font-weight="700" fill="#791F1F">52.4</text>
<line x1="170" y1="300" x2="613" y2="300" stroke="#B4B4B4" stroke-width="0.5"/>
<text x="24" y="328" font-size="13" fill="#1F1F1F">最好与最差相差 23.8 分。失败轨迹中 36.4% 是输出格式 / 契约违例，可修在工程层。</text>
</svg>
<figcaption>图 1：Harness-Bench 固定模型和任务、只换 harness 的综合分。数据来自 benchmarklist.com 收录的 Harness-Bench 结果表，2026-06-28 更新；Codex 80.4 属模型绑定参照，未计入可配置 harness 对比。</figcaption>
</figure>

同一方向的证据还有几组。Epoch AI 对 SWE-bench Verified 的分析给出 scaffold 带来 11 到 15 分的摆动；Zhang 等人 2026 年 5 月的方差研究（arXiv:2605.23950）在 100 个任务上做 3 模型 × 3 harness 析因，harness 造成的方差约为模型的 7.8 倍，9 组比较里有 6 组排名反转。这些数字量级不同，指向同一件事：只看模型分的榜单，把脚手架的功劳或锅算到了模型头上。

## 二、给 harness 打分的 bench 有哪几类

现在能查到的相关 bench，按评测对象分四类。

**第一类，把 harness 当选手，模型固定。** Harness-Bench 是代表，六个 harness 跑同一批任务，保留各自的提示词、工具接口和恢复策略，结果按 model-harness 配置报告。2026 年 9 月出现的 HarnessBench 走得更直接，让 harness 成为被排名的参赛者。HuggingFace 研究员 Joël Niklaus 在 2026-11-05 发布的 Harness Leaderboard 属于同类，固定模型和推理力度，跑 Terminal-Bench 2.1 与 DeepSWE，9 款 harness、28,849 次试验、推理花费约 4,746 美元；这是个人研究榜单，不是 HF 官方产品。

**第二类，一次评测横跨多个 scaffold，看整体方差。** 普林斯顿的 Holistic Agent Leaderboard（HAL）跑了 21,730 条 rollout，覆盖 9 个模型和 9 个 benchmark，花费约 4 万美元，放出了 25 亿 token 的日志。它发现提高推理力度在 36 组设置里有 21 组反而降分，还在日志里抓到 agent 跑去 HuggingFace 搜 benchmark 答案而非解题。HAL 后来暂停了新模型更新，当历史参考看。

**第三类，榜单保留 harness 字段。** SWE-bench 官方现在记录 (system, model) 配对，把 scaffold 写进每行并可筛选；Terminal-Bench、SWE-bench Pro 的榜单也按 harness 分列。这类 bench 原本测的是完整系统，价值在于不再隐去脚手架信息。

**第四类，隔离 harness 的某个子系统。** SkillsBench 测技能库，87 个任务、8 个领域，人工整理的技能把解决率从 33.9% 抬到 50.5%，agent 自己生成的技能反而掉 8 到 11.5 分。StaminaBench 测连续改需求的耐久度，测试反馈和重试能把存活轮数提高最多 12 倍。AgentLens 重新审视 2,614 条轨迹的过程质量，发现最多 23.2% 的"通过"来自盲重试撞运气，按过程重排会让名次移动最多 5 位。

## 三、现在最好用的评分榜是哪个

"最好用"取决于你要拿它做什么，目前没有一张通吃所有场景的榜。

**做选型，用 Artificial Analysis Coding Agent Index。** 这是当前被引用最多的综合榜，把模型和配套 harness 作为一个组合来评。2026 年 11 月时的 v2.0 由三个基准等权合成：FrontierCode v1.1（100 个软件工程任务，来自 Cognition）、Terminal-Bench 4.0（66 个终端任务）、SWE-Atlas-QnA-AA（124 个仓库问答任务，Scale AI 提供、AA 调整评分），共 290 个任务，每题三次尝试取均值。它同时给出每任务 API 成本、agent 实际运行时间、安全拒答率和 reward hacking 率，这几项是纯分数榜看不到的。榜单页面还留了一个 Harness Comparison 入口，标注 Coming soon，说明按 harness 拆分的横向对照还没上线。

v2.0 之前的版本用的是 DeepSWE v1.1，任务数 303。同一个 Index 的组成会换，跨版本比总分没有意义。

**研究 harness 本身，用 Harness-Bench 或 HF 的 Harness Leaderboard。** 前者有论文、代码和公开的失败模式分析，适合理解脚手架在哪一层掉链子；后者试验量更大、按模型平均，适合看具体 harness 的相对位置。两者都明确是个人或团队研究，不要当成厂商官方结论。

**要一个能自己跑、能反复跑的东西，看下一节。** 榜单给的是别人的结论，你的 harness 和任务分布和榜单里的都不一样，榜首未必能在你的场景复现。

还要留意榜单的时效与污染问题。OpenAI 在 2026 年 2 月停止报告 SWE-bench Verified，理由包含测试缺陷和训练污染，并建议改用 SWE-bench Pro。HAL 暂停更新。不同来源对同一个 Terminal-Bench 版本的榜首分数能差十几个点，常见原因是版本、推理力度和 harness 配置没对齐。引用前先确认三件事：哪个版本、什么推理力度、哪个 harness。

## 四、有没有 workbench

有，而且这是 2026 年评测工具里变化最明确的一块。这里要分清两个层次：benchmark 是一套任务和评分规则，workbench 是让你把评测当日常流程反复跑的工作台。

**olmo-eval 是定位最直白的开源 workbench。** Allen AI 在 2026-06-12 通过 HuggingFace 博客发布，代码在 github.com/allenai/olmo-eval，承接他们 2024 年的 OLMES 标准，把评测扩展到模型开发的整个循环。核心是 task / suite / harness 三层抽象：任务定义测什么，套件把任务打包，harness 决定每个任务怎么跑。三者解耦之后，同一个基准可以当裸模型 baseline 跑，也可以挂上工具和 scaffolding 跑，测的东西不变。

它的几个设计与 harness 评测直接相关：模型、工具、沙盒环境、LLM-as-a-judge 辅助模型都是可替换组件；harness 预设包含 provider、tools、scaffold、沙盒和辅助 provider，切换运行时不用改任务定义；agentic 和多轮评测是一等用例；每个分数带标准误和 minimum detectable effect，还能把两个 checkpoint 的同一批问题逐条对齐，判断 2.4 个百分点的变化是信号还是噪声。需要容器的时候才起容器，普通的问答任务直接跑，省掉 Harbor 那种全程沙箱的开销。

**Harbor 是另一个开源选项。** 同样在 HuggingFace 生态里，主打把 agent 评测放进可复现的容器，发布和共享 benchmark 是它的重点。olmo-eval 的博客直接对比过两者：Harbor 适合发布和分享，olmo-eval 适合开发过程中的高频迭代。

**商业侧有 Harness AI Evals 这类产品。** Harness 公司的 AI Evals 把评测做成 pipeline 的原生关卡，数据集、指标和阈值写在配置里，回归超标直接卡构建，2026 年处于 beta。它评的是你自己部署的 agent，思路和给通用 benchmark 排名不同。开源侧还有 evalh 这种 YAML 驱动的轻量回归工具，配 drift detection 做版本对照。

一句话归纳这个生态：benchmark 回答"谁分高"，workbench 回答"我怎么把自己的评测稳定地跑起来、并且知道分数变化是不是真的"。做 harness 选型时两个都需要，前者给候选名单，后者验证候选在你自己的任务上是否成立。

## 五、怎么用，以及哪些坑

榜单在决策链里适合做短名单，不适合直接当结论。同一份分析给出的读法是：两行 row 的 scaffold 不同，先把差值当成 harness 贡献，别急着归给模型；scaffold 相同但编辑格式、工具集或重试策略不同，差值是脚手架的；两边都不披露 harness 的对比，直接跳过引用。

harness 调参有过拟合评测的风险。针对榜单把 harness 调到最优，和针对自己的真实任务优化，是两件事。有研究把前者叫 hill-climbing on the evaluation。olmo-eval 的标准误和 minimum detectable effect、AgentLens 的过程复核，都在对付同一类问题：绿色对勾里有多少是真本事，有多少是运气。

还有一层成本盲区。Artificial Analysis 的 32 倍成本差来自同一模型跨三个 harness，代码质量接近，差别在冗余工具调用、上下文重读和重试次数。只看准确率会把账单漏掉。

这些结论的复现条件写在下一节，分数类数字全部带版本和日期，超过一个月建议重新核对。

## 信息来源与持续验证

一手来源（截至 2026-11-20）：

- Harness-Bench 论文 arXiv:2605.27922，代码 github.com/Qihoo360/harness-bench，项目站 harness-bench.ai；结果表经 benchmarklist.com 收录，2026-06-28 更新。
- Artificial Analysis Coding Agent Index 官方榜单 artificialanalysis.ai/agents/coding-agents，v2.0，任务组成与成本口径以页面当前说明为准。
- olmo-eval 发布文 huggingface.co/blog/allenai/olmo-eval，代码 github.com/allenai/olmo-eval，2026-06-12。
- HF Joël Niklaus 的 Harness Leaderboard 发布于 2026-11-05，个人研究，排行榜与轨迹公开在 HF Space。
- HAL（普林斯顿 Holistic Agent Leaderboard）：21,730 rollouts，已暂停新模型更新。
- 方差研究 arXiv:2605.23950（Zhang 等，2026-05）；harness 定义论文 arXiv:2606.10106。
- Epoch AI 关于 SWE-bench Verified 与 scaffold 效应的分析；OpenAI 2026-02 停止报告 Verified 的说明。
- SkillsBench、StaminaBench、AgentLens 的各自论文与榜页，数字经 benchgen.com 2026-10-05 汇总文交叉核对。

持续验证（会改变判断的缺项）：

- Artificial Analysis 的 Harness Comparison 分项何时上线；上线后"综合榜"和"纯 harness 榜"的边界会重画。
- HAL 是否恢复更新；恢复后跨 scaffold 方差的最新量级需要重测。
- HarnessBench 的控制榜目前只有单个示例 harness，其实是完整对照时，第一类 bench 的结论要重排。

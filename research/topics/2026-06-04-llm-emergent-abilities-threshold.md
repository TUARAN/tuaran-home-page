---
title: 大模型涌现能力的参数量阈值调研
category: topics
topic_type: tech
date: 2026-06-04
tags: [大模型, 涌现能力, Scaling Law, 后训练, 推理模型]
summary: 「模型大到一定程度就会涌现」是 2022 年的经典叙事；2023 年被「海市蜃楼」论文打回原形，2024-2026 年又被小模型 + 后训练 + 推理 RL 彻底改写。本文梳理这条结论的兴衰史，并给出今天还能不能用「参数量阈值」来谈涌现的判断。
tldr: 经典论文给出的涌现阈值是 10B 起、100B 成熟；但这个阈值在 2023 年被证伪一半（指标错觉），又在 2024-2026 年被 7B 级模型 + RLHF/RLVR / 长链推理彻底打穿。今天还谈「涌现参数量阈值」基本是过时的提问方式，真正的拐点已经迁移到数据质量、后训练算法与推理时算力。
assistance: claude-code
model: claude-opus-4-7
pv: 0
---

「大模型参数量到多少会出现涌现」是一个 2022-2023 年特别流行的提问。彼时 GPT-3 175B、PaLM 540B 的能力跃迁刚被命名为 "emergent abilities"，业界普遍相信存在一个清晰的参数量门槛——跨过去，模型就突然学会了 few-shot、CoT、指令跟随这类「质变」能力。

三年过去，这套叙事已经被两轮强冲击修正：先是 2023 年 Stanford 的反驳论文指出大部分「涌现」是评测指标的非线性错觉；再是 2024-2026 年 Llama 3 / Qwen 2.5 / DeepSeek-R1 这一批 7B-32B 小模型，靠数据 + 后训练 + 推理 RL 直接把当年「千亿模型才有的能力」做到了消费级显卡上。

这篇调研的目的不是给一个新的「阈值数字」，而是把这条结论的兴衰路径讲清楚，让今天再被问到「多少 B 会涌现」时知道该如何回答。

## 一、是什么

**涌现能力（Emergent Abilities）的原始定义**（Wei et al., 2022）：

> An ability is emergent if it is not present in smaller models but is present in larger models.
> 一种能力在小模型上不存在、在大模型上存在，就叫做涌现。

这个定义有两个关键操作化：
1. **不存在 → 存在**：用一个固定阈值（比如 GSM8K 准确率 > 随机猜）来判定「有/无」。
2. **以训练 FLOPs 或参数量为 X 轴**：曲线在某个规模点突然抬头。

按这个定义，2022 年的经典论文给出过几个常被引用的数字：

| 能力 | 论文里报告的「起跳点」 |
|---|---|
| Few-shot in-context learning | GPT-3 在约 **13B** 后明显有效，**175B** 成熟 |
| Chain-of-Thought 推理 | 约 **68B-100B** 才在 GSM8K 上跑出来，PaLM **540B** 表现最强 |
| 复杂指令跟随 / 多步算术 | 通常落在 **几十 B 到 100B+** 区间 |
| BIG-Bench 困难子集 | 部分任务在 **数百 B** 才超越随机 |

所以早期口径里的「涌现阈值」是一个模糊带：**10B 起、100B 成熟、540B 完整**。

## 二、为什么重要

这条结论在 2022-2023 年深度影响了行业判断：

- **资本叙事**：OpenAI、Anthropic、Google 都用「scaling 必然带来涌现」论证训练千亿、万亿模型的合理性，催出大模型军备竞赛。
- **国产追赶路径**：国内多家厂商把「先把参数量堆到 100B+」作为团队 KPI，理由就是「不到这个规模做不出真正的能力」。
- **端侧悲观论**：「7B/13B 模型只能做玩具，认真业务必须上百亿千亿」是 2023 年的主流观点，直接影响了端侧 AI 的投资节奏。
- **学术框架**：emergent abilities 成为对齐、可解释性、AI safety 讨论的高频前提——「能力是突变的，所以风险也是突变的」。

如果这条结论站不住，上面这些判断的根基就被抽走了。所以它不是一个纯学术问题，而是关系到投资方向、研发路线、安全叙事的核心命题。

## 三、关键玩家与生态

围绕「涌现」这条命题的三条主要力量：

**1. 支持派（涌现是真实的质变）**

- **Google Brain / DeepMind**：Jason Wei 等人 2022 年的原始论文是这一派的奠基。PaLM、Gemini 系列内部一直以「scaling 带来新能力」作为路线依据。
- **OpenAI**：GPT-3 → GPT-4 的发布博客和技术报告反复强调能力的阶梯式跃迁。
- **Anthropic**：早期 Predictability and Surprise 论文也持类似立场，把涌现与对齐挑战绑定。

**2. 反驳派（涌现是评测指标的错觉）**

- **Stanford / Schaeffer et al. 2023**：《Are Emergent Abilities of Large Language Models a Mirage?》——直接质疑涌现的真实性。该论文获 NeurIPS 2023 Outstanding Paper Award。
- **EleutherAI / Big Science**：开源社区在复现实验中发现，换用连续指标（log-likelihood、token-level accuracy）后，所谓「突然抬头」基本消失。

**3. 路线改写派（涌现的阈值早已下移）**

- **Meta（Llama 3 系列）**：用 15T tokens 训练 8B 模型，能力对标早期 70B+。
- **阿里 Qwen 2.5 / Qwen3**：7B 已具备稳定的指令跟随、CoT、工具调用能力。
- **DeepSeek**：R1 通过纯 RL（RLVR）让 32B distill 模型在数学/代码上接近闭源前沿。
- **OpenAI o1 / o3 系列**：把能力增长从「训练时参数」迁移到「推理时算力」，参数量不再是核心变量。

## 四、技术 / 实施细节

### 4.1 经典版本：Wei et al. 2022 的「涌现曲线」

论文方法很简单：
- 选 200+ 个 BIG-Bench 任务
- 把 LaMDA / GPT-3 / PaLM 等不同规模模型放在同一张图上
- X 轴是训练 FLOPs（log 尺度），Y 轴是任务准确率
- 找出那些「在小规模下接近随机、在某个规模后陡升」的任务

得到结论：约 **10²² FLOPs**（对应 GPT-3 13B 量级）开始出现 few-shot 涌现；约 **10²⁴ FLOPs**（对应 PaLM 540B 量级）出现 CoT 涌现。

### 4.2 反驳：Schaeffer et al. 2023 的「海市蜃楼」

核心论点：**涌现不是模型的属性，而是评测指标的属性**。

证据链：
1. **指标非线性**：exact-match、multi-step accuracy 这类指标要求「全对才算分」。当模型在每一步的 log-likelihood 是平滑提升时，全对概率就会呈指数式陡升——视觉上看像突变，实质是连续。
2. **换指标重做**：把同样的任务换成 token-level edit distance、Brier score 等连续指标，「涌现曲线」全部变成平滑曲线。
3. **人造涌现**：作者展示了如何在视觉任务上用类似指标人为制造出「涌现」，证明它是评测设计的产物。

这个反驳没有完全否定涌现的存在（少数任务即使换指标仍有跳变），但**把「广泛涌现」的叙事打掉了一大半**。

### 4.3 路线改写：2024-2026 年的三条新轴

**轴一：数据 > 参数（Chinchilla 之后）**

DeepMind 2022 年的 Chinchilla 论文已经证明，给定算力预算下，「更多数据 + 更小模型」优于「更少数据 + 更大模型」。这条结论在 2024-2025 被 Llama 3 推到极致：8B 模型用 15T tokens 训练，参数量与 2020 年 GPT-3 相比小了一个数量级，能力却接近 175B 版本。

**轴二：后训练（SFT + RLHF + RLVR）撑起能力下沿**

- **SFT**：高质量指令数据让 7B 模型也能稳定跟随指令。
- **RLHF**：让模型学会人类偏好，是 ChatGPT 之后所有模型的标配。
- **RLVR（Reinforcement Learning with Verifiable Rewards）**：DeepSeek-R1、Qwen-Math 等用「答案可验证」的任务（数学、代码）做 RL，让小模型获得高质量推理能力，参数量不再是关键约束。

**轴三：推理时算力（test-time compute）**

OpenAI o1 / o3、DeepSeek-R1 的范式转变：能力不再来自「训练时把模型做大」，而来自「推理时让模型思考更久」。一个 32B 模型如果在推理时生成 10k tokens 的 reasoning chain，可以打过一个 1.8T 参数、推理只生成 200 tokens 的传统模型。

**这三条轴合起来，让「参数量阈值」这个提问失去了讨论价值**——同样的能力，2026 年用 7B + 后训练就能拿到，谈「100B 才涌现」已经不成立。

### 4.4 一个对照表

| 能力 | 2022 年阈值 | 2026 年阈值 |
|---|---|---|
| 流畅多轮对话 | 100B+ | 1.5B-3B |
| Few-shot 指令跟随 | 13B-175B | 7B（已成 baseline） |
| CoT 数学推理 | 540B（PaLM） | 7B-8B（带 RLVR 后训练） |
| 代码生成（HumanEval > 70%） | GPT-4 级 | 7B-14B（Qwen2.5-Coder、DeepSeek-Coder） |
| 长上下文检索 | 千亿 + 长上下文训练 | 与参数量基本解耦，看 RoPE / position encoding 方案 |

## 五、争议与风险

**1. Schaeffer 论文也有反对意见**

部分研究者（包括原 Wei 团队）反驳：即使换连续指标，仍有少数能力（如 modular arithmetic、特定 BIG-Bench 任务）存在真实的相位跃迁。「全部都是指标错觉」也是夸大其词。**温和的共识是：广泛涌现是错觉，但局部、特定任务的能力跳变是真实存在的**。

**2. 「小模型能力对齐大模型」的对照很容易作弊**

Llama 3 8B 在某些 benchmark 上接近 GPT-3.5，但在长 horizon planning、跨领域知识广度、稀有语言、长尾事实记忆等维度，参数量仍然是硬约束。「小模型已经够用」很多时候只在 benchmark 上成立，在真实业务里仍然吃亏。

**3. 推理时算力的成本陷阱**

o1 / R1 路线把能力换算成 token，但 token 是有成本的。一个 32B + 10k reasoning tokens 的方案，在延迟和单价上未必比 200B + 短回答便宜。「参数下移」并不等于「成本下移」。

**4. 能力可预测性下降，对 safety 反而更难**

经典涌现叙事虽然可疑，但它给了 safety 一个清晰的讨论框架：能力跳变 = 风险跳变。如果今天能力增长来自后训练 / RL / 推理算力的复合作用，那么「下一个能力跃迁会从哪里来」反而更难预测，对齐工作更难提前布防。

**5. 阈值话术仍在被滥用**

国内一些路演 PPT 还在用「我们做到了 XX B，跨过了涌现门槛」作为卖点。这种说法在 2026 年基本属于过时甚至误导——参数量本身已经不是能力的充分条件，也不是必要条件。

## 六、个人结论

**一句话定性**：「参数量到多少会涌现」是一个 2022 年的提问方式，2023 年被部分证伪，2024-2026 年被彻底改写——今天再用「参数量阈值」框架谈大模型能力，基本是过时的。

**是否跟进**：

- **作为历史脉络**：值得跟进。理解涌现叙事的兴衰，是理解大模型行业过去四年路线变化的关键线索，对判断未来叙事的可信度有帮助。
- **作为现在的判断框架**：不要再用。判断一个模型能否胜任某个任务，应该看的是：基座模型质量 + 后训练方案 + 推理时算力预算 + 任务可验证性，而不是参数量数字。
- **作为投资 / 路线决策依据**：完全不跟进。任何以「我们做到 XX B，跨过涌现阈值」为核心论据的项目都值得警惕。

**下一步**：

1. 把这篇调研沉到二级目录，首页不主推（按内容策略约定，AI 协助调研属于 commodity）。
2. 后续如果要写「为什么 7B 模型已经够用」「推理时算力 vs 训练时算力的成本经济学」这类延伸主题，可以反向引用本篇做背景。
3. 在与非技术朋友讨论大模型时，遇到「多少参数才算大模型」这类提问，用本篇的结论快速纠偏：**问错了问题**。

## 七、信息来源

- [Emergent Abilities of Large Language Models (Wei et al., 2022)](https://arxiv.org/abs/2206.07682) — 涌现叙事的奠基论文
- [Are Emergent Abilities of Large Language Models a Mirage? (Schaeffer et al., 2023)](https://arxiv.org/abs/2304.15004) — NeurIPS 2023 Outstanding Paper，海市蜃楼反驳
- [Training Compute-Optimal Large Language Models (Chinchilla, Hoffmann et al., 2022)](https://arxiv.org/abs/2203.15556) — 数据 > 参数的奠基论文
- [Chain-of-Thought Prompting Elicits Reasoning in Large Language Models (Wei et al., 2022)](https://arxiv.org/abs/2201.11903) — CoT 涌现的原始报告
- [The Llama 3 Herd of Models (Meta, 2024)](https://arxiv.org/abs/2407.21783) — 8B 用 15T tokens 训练的工程报告
- [DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning (DeepSeek, 2025)](https://arxiv.org/abs/2501.12948) — RLVR 让小模型获得推理能力
- [Learning to Reason with LLMs (OpenAI o1 blog)](https://openai.com/index/learning-to-reason-with-llms/) — 推理时算力范式的官方阐述
- [Predictability and Surprise in Large Generative Models (Anthropic, 2022)](https://arxiv.org/abs/2202.07785) — 涌现与 safety 的早期连接

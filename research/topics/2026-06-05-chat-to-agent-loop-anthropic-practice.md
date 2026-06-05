---
title: 从 chat 任务到 agent loop：Anthropic 一线工程实践 + 升级路径调研
category: topics
topic_type: tech
date: 2026-06-05
tags: [Agent, Agent Loop, Claude Code, Tool Use, Subagent, Harness, Managed Agents, Anthropic, 工程实践]
summary: chat → agent loop 不是工程模式升级，是失控范围放大。综合 Anthropic 官方 "Building Effective Agents" + Erik Schluntz 的最小框架主张 + 2026-04 三-agent harness + Claude Managed Agents，给出从 chat one-shot 到 managed agent 的四阶段路径与判断标准。
tldr: 多数任务应止于「tool-use loop」（一个 model + 几个 tool + while 循环），Erik Schluntz 反复强调"模型越聪明越不需要 scaffold"。真正需要 subagent 分工的是长时任务（>1h）+ 高侵入操作。大多数人从 chat 直接跳到 multi-agent 框架是过度工程化，正确路径是 chat → tool-use loop → subagent → managed agent，每一阶段都有明确触发条件。
assistance: claude-code
model: claude-opus-4-7
pv: 0
---

「从 chat 任务转向 agent loop 调用」这件事，听起来像引入新组件、抽象更多层、用上更复杂的框架，但实际是反向：放弃对模型每一步的控制，把"任务完成"的判定权交给模型自己，等待它自循环到收敛。这是把可控的工程问题换成不可控的概率问题，复杂度真正爆发的不是代码，是失败模式 —— 出错时究竟在第几次 tool call 出错、错在哪一层、为什么继续循环没纠偏，都需要新的诊断体系。

要做对这件事，先理解 Anthropic 官方对 workflow 和 agent 的明确区分；然后看一线工程师（Erik Schluntz）反复强调的"最小框架"主张；最后看 2026-04 三-agent harness、Claude Managed Agents 这类"完整 harness 形态"的事实，把它们放在一条升级路径上对照。多数人需要的不是最右端的形态，而是知道自己应该停在哪一阶段。

## 一、是什么

Anthropic 官方区分得很清楚（[Building Effective Agents, 2024-12](https://www.anthropic.com/research/building-effective-agents)）：

- **Workflow**：LLM + tool 被代码预编排好执行路径，每一步走法固定，分支由代码控制。
- **Agent**：LLM 自己决定调用什么 tool、什么时候停 —— LLM 在循环里既是决策者也是执行者，代码只提供工具能力和退出兜底。

"chat 任务" 通常是 workflow 极简形态：单轮 prompt → 单轮回答。"agent loop" 是把这个单轮换成 `while(not done) { model_call → tool_call → feedback }` 直到模型自己决定 done。

技术形态最小：一个 model 调用循环 + 一组 tool 定义 + 一个停止条件。**最难的不是代码，是判断什么任务值得这样做**。

## 二、为什么重要

Anthropic 的 [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 给出的核心判断：

> "Find the simplest solution possible, and only increase complexity when needed. ... Most successful implementations weren't using complex frameworks or specialized libraries, but instead were building with simple, composable patterns."

翻译成大白话：能用 workflow 别用 agent loop，能用 agent loop 别用 multi-agent，能用单 prompt 别上 workflow。这个原则的反面是：每加一层 autonomy，失败模式都呈非线性放大。

Erik Schluntz（Anthropic Member of Technical Staff，搞 tool use / computer use / SWE-bench）在 [Latent Space 访谈](https://www.latent.space/p/claude-sonnet) 里有句更直接的话：

> "Some existing agent frameworks had whole systems built to try to detect loops. We found that the smarter the models are, the less you need that kind of extra scaffolding."

意思是：旧 agent 框架的很多复杂度（loop detection、step planning、explicit memory）是为了补偿模型不够聪明。模型越强，scaffold 越是负担。**Claude 团队自己内部用的是"最小框架"** —— 给模型工具，让它一直调到自己觉得完事。

## 三、关键玩家与生态

- **Anthropic Claude Code**：自家最完整的 agent harness 形态，社区拆解（[Claude Code Agent Harness Breakdown](https://wavespeed.ai/blog/posts/claude-code-agent-harness-architecture/)）显示有 **29 个 lifecycle event** 可挂 hook、subagent 机制、skill 机制、CLAUDE.md 上下文管理、MCP server 接入。
- **Anthropic Managed Agents（2026-04 公测）**：把 harness 那一套抽成 REST API —— harness loop / tool execution / sandbox container / state persistence 一次性提供。[InfoQ 报道](https://www.infoq.com/news/2026/04/anthropic-three-agent-harness-ai/)。
- **Anthropic 三-agent harness（2026-04）**：受 GAN 启发，planning / generation / evaluation 三个角色互检，专为多小时长时任务设计（[GitHub: cwc-long-running-agents](https://github.com/anthropics/cwc-long-running-agents)）。
- **OpenAI Assistants API / Agents SDK**：抽象层更厚，threads + runs + tool calls 一套 stateful 概念。哲学差异：OpenAI 偏重平台抽象，Anthropic 偏重最小化 + harness 工程化。
- **第三方 agent harness**：Cursor、Cline / Roo Code、Aider、Continue —— 都是把"chat + tool use loop"包成 IDE 体验。
- **多 agent 框架**：LangGraph、CrewAI、AutoGen —— 这些是 Anthropic 官方明确建议大多数场景不要用的"复杂框架"。

## 四、技术 / 实施细节

把"从 chat 到 agent loop"拆成 4 个阶段，每阶段有明确触发条件，**没满足下一阶段触发条件就不应该升级**。

### 阶段 0：chat one-shot

```
user → prompt → model → answer
```

触发场景：单步可解 / 不需要环境信息 / 答案能一次给出。
例：润色一段文案、解释一段代码、回答事实问题。

**停留信号**：任务能在一次 model call 内被回答清楚。

### 阶段 1：tool-use loop（最小 agent）

```
while not done:
    model.call(messages + tools)
    if model wants tool: execute tool, append result
    else: done
```

这就是 Erik 反复推崇的"最小框架"。一个 while、一组 tool、一个 model。

**触发信号**：
- 任务需要环境反馈（读文件 / 跑命令 / 查 API）
- 步数不确定（不是 1 步、不是 5 步，模型自己定）
- 每步结果决定下一步做什么

**关键工程细节**：
- **不要做 loop detection / step counter / explicit planner** —— Erik 直说越聪明的模型越不需要这些
- **Tool 设计是核心**：tool 名字 + description + parameter schema 要让模型一眼读懂边界
- **Ground truth 必须真**：每个 tool 必须返回真实的环境反馈（成功 / 失败 / 实际数据），不能模糊不能拼凑。[Anthropic 官方](https://www.anthropic.com/research/building-effective-agents) 反复强调 "agents need to gain ground truth from the environment at each step"
- **退出兜底**：模型自己说 done 就 done；额外加 max_iterations 是兜底防失控，不是主流程
- **错误传给模型，不要 catch 后吞掉**：tool 失败的 stderr / error trace 原样返回给模型，让它自己重试 / 换路径

90% 的 agent 项目应该止于这一阶段。SWE-bench Verified 顶榜的 Anthropic 内部 agent 就是这个形态（[Erik's SWE-bench blog](https://www.anthropic.com/research/swe-bench-sonnet)）。

### 阶段 2：subagent / planning + execution + evaluation

```
planner → 任务清单 → executor (loop) → evaluator → done | retry
```

主 agent 拆解任务、把 bounded subtask 派给 subagent（独立 context window、独立 prompt、独立 tool 权限），收到 subagent 的 summary 回来后再判断下一步。Anthropic 2026-04 三-agent harness 是这一阶段的成熟形态（planning / generation / evaluation，GAN 风格 generator + skeptical evaluator 互检）。

**触发信号**：
- 任务超过一个 model 的有效 context window（>30k token 的代码库扫描）
- 任务分明显异构子任务（前端 + 后端 + 测试 + 部署）
- 单 loop 跑超过 ~30 步开始走偏（context 污染、目标漂移）
- 需要"另一个视角"来质检结果（生成 + 审稿）

**关键工程细节**：
- Subagent 必须有**独立 context**（不共享主 agent 的对话历史），通过结构化 handoff artifact 沟通
- Evaluator 不能用同一个 prompt 同一个角色 —— Anthropic 三-agent harness 的关键是 evaluator 被显式塑造成 "skeptical reviewer"，否则就是自己夸自己
- 主 agent 只看 subagent 的 summary，不看它的全过程 —— 减少 context 污染
- 失败的 subagent 任务原样回传，由主 agent 决策 retry / 换 subagent / 放弃

### 阶段 3：managed agent / long-running harness

```
REST API 调起 → harness 自管 loop / state / sandbox / persistence
```

不再手写 loop，调 Claude Managed Agents 这类托管服务，平台帮你管：
- harness loop（同阶段 1 但平台跑）
- tool execution（沙箱 + 资源限制）
- state persistence（中断恢复）
- 长时任务（>1h、多小时）的崩溃 / 重启 / context 重置

**触发信号**：
- 任务持续 hours，必须支持中断 / 恢复
- 需要严格 sandbox（用户数据 / 生产环境）
- 多用户场景，每个 user 一个独立 agent session
- 不想自己运维 harness 进程 / 状态机

**关键工程细节**：
- 你只负责 tool 定义 + 任务 prompt + 收结果
- 平台对应 lifecycle event（启动 / 中断 / 完成 / 失败 / token 用尽）你能挂 webhook
- 调试体验比手写差 —— 看不到 raw model call，只能看 platform 给的事件流

## 五、争议与风险

**1. 过度工程化 = 多数失败的根因**

LangGraph、CrewAI、AutoGen 这一票多 agent 框架几乎都是为"阶段 2 / 3"准备的。多数人项目还在阶段 0 / 1 就上这套框架，结果是：模型在一堆抽象层里反复绕，调试器看到的全是框架日志而不是 model 决策，失败时根本不知道哪一层出了问题。Anthropic 官方两次明文反对："Most successful implementations weren't using complex frameworks."

**2. Agent loop 的成本不透明**

阶段 1 的最大坑是 token 消耗 —— 每次循环都把前面所有 tool result 带回 model，5 步循环可能消耗 50k token，20 步循环超过 100k。`messages` 数组每次完整发回去是 quadratic 增长。需要主动 truncate / summarize 历史，否则单任务 token 账单 100x 失控。

**3. 失败模式从可枚举变成不可枚举**

Workflow 失败可以列出来（每一步可能怎么挂）；agent loop 失败是开放集合 —— 模型可能调错 tool、调对 tool 但传错参数、看不懂 tool 返回值、陷入 plausible 错路径却 confidence 很高。这些不是 try/catch 能兜的，需要 evals / 观察性 / 人工抽样。

**4. 可观察性是 sleeper cost**

阶段 1 看似简单，但产线上需要：每个 model call 的 token 消耗、每个 tool call 的耗时和成功率、每个 task 的总迭代次数和总成本、失败任务的 model trajectory 复现。这套观察性比 agent 本身代码量大几倍。多数项目崩在这里。

**5. Anthropic 的"最小框架"主张未必适用所有模型**

Erik 的"模型越聪明越不需要 scaffold"假设的是 Claude / GPT 顶级模型。用更小 / 开源模型时，scaffold 仍然有用 —— planner / verifier / retry 都能补救小模型的弱推理。判断对自己模型的能力实测，不要照搬。

**6. 「agent loop = 自动化」是错觉**

Agent loop 把人从"每步决策"里解放，但要求人接受"多步决策的概率结果"。任务关键时（生产部署、财务操作、不可逆改动），必须显式加 human-in-the-loop checkpoint —— 这一刻 agent 等于退回 workflow。

## 六、个人结论

**一句话定性**：chat → agent loop 不是"用了更高级的工具"，是"把工程问题升级成概率问题"。值得做，但应该慢做，按 4 阶段严格升级，**没满足下一阶段触发条件就停在原阶段**。

**判断什么阶段**：

| 任务特征 | 推荐阶段 |
|---|---|
| 一次回答 / 不需环境信息 | **阶段 0** chat |
| 需要读文件、跑命令、查 API、不确定步数 | **阶段 1** tool-use loop |
| >30k token、>30 步、明显异构子任务、需要审稿 | **阶段 2** subagent |
| 持续 hours、需要 sandbox、多用户、不想自己运维 | **阶段 3** managed agent |

**对独立开发者的实操建议**：

1. **从阶段 1 开始**，跳过阶段 0 的 "chat 工具"幻觉。哪怕只是"AI 帮我看一下这个文件然后写个总结"，加上 read_file tool 都比纯 chat 更可控
2. **手写 while 循环，不要用框架**。30 行代码就够，能直接看到每个 model call 和 tool call。出问题肉眼能 debug
3. **第一个 production agent 不上 evals 不上**。先写完跑两周收 traces，看失败模式再倒推 evals 该测什么
4. **观察性优先于功能**：token 消耗 / iteration 数 / tool 成功率 三件先有，再加功能
5. **不要急着上阶段 2**。多数任务卡的不是"需要 subagent"，是阶段 1 的 tool 设计差 / prompt 写得糙
6. **阶段 3 留给真正长时 + 多用户**。个人项目 99% 不需要 Managed Agents

**对内容创作者 / 团队的建议**：

- 对外讲 agent 工程时，用 Anthropic 的"workflow vs agent"定义，不要混用 marketing 词（autonomous AI、智能体平台）
- 区分"读了 5 篇博客"和"实际跑过阶段 1+ 的 agent"。前者写起来流畅但容易抽象，后者才有用
- 自己的产品里宣称"agent"前先问自己：模型在循环里吗？还是只是 chat + workflow？

**下一步可跟进信号**：

- Claude Managed Agents 公测出 GA 时机 / 价格曲线 / 真实 SLA
- Claude Code 的 hook / skill 体系是否被其它 IDE 抄走 / 形成标准
- 2026-Q3 三-agent harness 在 SWE-bench 之外的 benchmark 表现（特别是真实生产任务）
- 各家"模型越强越不需要 scaffold"的反例 —— 用 7B 开源模型时 scaffold 是不是仍必要

## 七、信息来源

- [Anthropic 官方：Building Effective Agents（2024-12）](https://www.anthropic.com/research/building-effective-agents) —— workflow vs agent 区分；5 工作流模式；agent 定义 + 何时该用 agent
- [Anthropic Multi-agent Harness for Long-Running Tasks（2026-04, InfoQ 报道）](https://www.infoq.com/news/2026/04/anthropic-three-agent-harness-ai/) —— planning / generation / evaluation 三 agent harness
- [GitHub: anthropics/cwc-long-running-agents](https://github.com/anthropics/cwc-long-running-agents) —— 长时 agent 官方参考实现
- [Erik Schluntz on Latent Space（Claude 3.5 Sonnet, Computer Use, SOTA Agents）](https://www.latent.space/p/claude-sonnet) —— "最小框架"主张、scaffold negative-correlation、SWE-bench 内部 agent 形态
- [Erik Schluntz on X (@ErikSchluntz)](https://x.com/ErikSchluntz) —— 散见 agent loop / verification / tool use 推文
- [Claude Code Agent Harness Breakdown（WaveSpeed）](https://wavespeed.ai/blog/posts/claude-code-agent-harness-architecture/) —— 29 个 lifecycle event、hooks/dispatchers/skills/agents/workflows 拆解
- [Claude Code Agent Teams 2026 Playbook（Developers Digest）](https://www.developersdigest.tech/blog/claude-code-agent-teams-subagents-2026) —— subagent / team lead / shared task list
- [Dive into Claude Code（GitHub 学术分析）](https://github.com/VILA-Lab/Dive-into-Claude-Code) —— Claude Code 作为现代 agent 系统设计样板的系统性拆解
- 本站相关：[CF × VoidZero · Anthropic × Bun · Vercel × Next 三极割据研判](https://2aran.com/platform-framework-pairs) —— Anthropic 在 runtime 层的下场是本篇 agent 工程能力的产业基础

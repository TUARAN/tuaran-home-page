---
title: 字节 AI Agent 二面（飞连）面试题与参考解答
category: topics
topic_type: tech
date: 2026-05-26
tags: [面经, 字节跳动, 飞连, AI Agent, RAG, LangGraph, Redis, Transformer, 八股]
summary: 把一份字节飞连 AI Agent 二面的完整题面（10 道项目题 + 6 道八股 + 1 道算法）拆开逐题作答，给出可直接背的简版与可上手聊的展开版，并标明哪些题是"信号题"、哪些是"凑数题"。
tldr: 这套二面的真正杀招在 Tool Calling 设计、bad case 闭环、Agentic RAG 三块——其它题（Redis 八股、Transformer 基础、合并链表）只是过滤极端候选人的最低线，答出来不加分、答不出来直接挂。
source: claude-code
model: claude-opus-4-7
pv: 0
---

> **本调研定位**：把流传的一份「字节跳动 · 飞连团队 · AI Agent 应用开发岗二面」面经（10 道项目题 + 6 道八股 + 1 道算法）整理成可直接复用的「题面 + 解答 + 信号判断」结构。重点不是把每道题都答到极致，而是搞清楚**哪些题是真正的鉴别题**、**哪些点踩中加分、踩空直接挂**。

## 一、是什么

**飞连（Feilian）** 是字节跳动内部孵化、对外商用的零信任办公网络与企业 IT 管控平台（VPN / 设备管控 / SSO / 终端安全），是飞书生态在「企业 IT 基础设施」这一侧的延伸。2024 年起飞连开始把 AI Agent 塞进自己的产品形态——典型场景包括：

- IT 工单自动诊断与脚本生成（终端用户报"连不上 VPN"，Agent 自己跑诊断 → 给修复建议或直接派单）
- 安全告警的自然语言归因（SIEM 事件用 LLM 串起来）
- 内部知识库的对话式问答（接入飞书 wiki / Lark Base）

二面的题目结构很典型：
1. **实习拷打**（10 min）：让候选人讲一段真实做过的事，面试官针对细节追问
2. **Agent 主线项目题**（10 大题，每题 3–6 个追问）：覆盖流程拆分、Tool Calling、bad case、Memory、RAG、Agentic RAG、框架选型、低代码平台对比、AI 编程工具使用
3. **八股**（6 题）：Redis 4 题 + Transformer 1 题 + RLHF/DPO 1 题
4. **算法**：合并两个有序链表（LeetCode 21，Easy）

题面强度判断：**Agent 主线题问得很深，八股偏中等，算法是底线题**。这套面经的真实指向是「能不能从 0 到 1 把一个 Agent 项目交付出去」，而不是「LLM 内部数学推导有多熟」。

## 二、为什么重要

### 2.1 这是 2026 年大厂"Agent 应用开发"岗的标准模板

对照阿里通义、腾讯混元应用、美团 LongCat、京东言犀的同期面经，**70% 题目重叠**。换句话说，把这套题答透，能覆盖大厂 Agent 应用岗二面的多数追问。

### 2.2 区分"调过 API"和"做过项目"的就是项目追问

实习拷打 + 项目流程题 + bad case 题 = 三连击，**专门用来挂"只跑过 demo"的候选人**。如果不能把"你们多 Agent 怎么通信、状态怎么存、bad case 怎么定位、有没有评测数据"答到具体的字段名 / 数据结构 / 评测指标，几乎一定挂。

### 2.3 八股题量不大但都是"信号题"

Redis 四题问的不是 Redis 本身，而是「**你做 Agent 系统时知不知道用 Redis 存什么、怎么存**」。Transformer 基础和 SFT/RLHF/DPO 是确认你不是纯 prompt 调参党。算法题是底线——`merge two sorted lists` 答不出来直接结束。

## 三、关键玩家与生态

| 角色 | 代表 | 在飞连场景里的位置 |
|---|---|---|
| 底座模型 | 豆包 1.5 / 1.6（字节内部叫 Doubao / Skylark） | 飞连 Agent 默认走豆包 API，少数走自研小模型本地化 |
| Agent 框架 | LangGraph（外部）、内部自研 DAG 编排 | 二面常以 LangGraph 为锚，问你能不能讲清 State/Node/Edge |
| RAG 基建 | 飞书 Wiki + 字节自研向量库（火山引擎 VikingDB）+ BGE / Cohere Rerank | RAG 题大概率落到「BGE 召回 + Rerank 精排」组合 |
| 低代码对手 | 扣子（Coze，字节自家）、Dify、n8n、阿里百炼 | 第 9 题专门问扣子，注意：**面试时不能踩扣子**——它就是面试官隔壁组做的 |
| 部署形态 | 飞书机器人 / 飞连客户端嵌入 / 浏览器扩展 | 影响 Memory 设计与上下文长度限制 |
| 评测体系 | 内部 LLM-as-a-Judge + 人工抽检 + 业务指标（工单解决率、误派率） | bad case 闭环题必问"评测数据" |

## 四、Agent 主线 10 题：题面与参考解答

> 说明：以下解答按"**简版（30 秒口播）/ 展开（追问时铺开）/ 加分点 / 雷区**"四段写。简版是用来通过初轮筛的，展开是用来抢二面 offer 的。

---

### Q1. 实习拷打（10 min）

> 题面：让你完整讲一遍最近做过的实习/项目，面试官随机抓细节追问。

**这一题没有标准答案，但有结构化叙述模板**：

- **背景 30 秒**：什么业务、为什么要做、上下游是谁
- **难点 30 秒**：列 2 个真正卡过你的点（不要列"工期紧"这种废话）
- **方案 90 秒**：方案 A vs 方案 B 的对比，你为什么选 A
- **结果 30 秒**：上线了什么、量化指标（QPS、准确率、人力节省）
- **反思 30 秒**：现在回头看哪里还可以更好

**雷区**：
- 把"我跟着 mentor 做了 xxx"挂在嘴边——面试官立刻追问你独立完成了什么
- 指标没数字（"提升很多"=没提升）
- 把架构图背出来但讲不出为什么这么拆——下一题立刻被打穿

---

### Q2. 介绍 Agent 项目整体流程

> 追问：为什么这么拆？哪些是 Workflow 哪些是 LLM？失败分支怎么办？状态怎么存？多 Agent 怎么分工/通信/终止？怎么避免相互扯皮和死循环？

**简版**：
> "我们把 Agent 项目拆成 **意图识别 → 计划生成 → 工具执行 → 结果聚合 → 反思** 五段。前两段交给 LLM 决策，工具执行是确定性 Workflow，结果聚合用规则模板，反思阶段用 LLM 再走一次。状态用 Redis Hash + Postgres 双写：Redis 存当前会话短期状态（TTL 30 min），Postgres 存可追溯日志。"

**展开（按追问逐条）**：

1. **为什么这么拆**：把"创造性"环节（理解意图、规划）和"确定性"环节（API 调用、字段校验）分开，是为了**让能 fail-safe 的部分尽量不进 LLM**。LLM 调用每多一次，成本、延迟、失败概率全部叠加。
2. **哪些是 Workflow 哪些交给 LLM**：原则是「能用 if-else 写出来的不交给 LLM」。比如「判断用户是否登录」「检查工单类型在白名单内」全是 Workflow；「猜用户真实意图」「生成派单原因摘要」交给 LLM。
3. **失败分支与重试**：每个节点都包一个 `try/retry/fallback` 三段。LLM 节点失败 → 换更小的兜底模型（豆包 1.6 失败 → 豆包 lite）；工具节点失败 → 指数退避重试 3 次 → 进入人工兜底队列。**关键：失败要 fail loud，不要 fail silent**，必须落日志 + 指标。
4. **状态怎么保存**：
   - 短期会话：Redis Hash，key = `session:{user_id}:{conversation_id}`，TTL 30 min
   - 长期记忆：Postgres + 向量库双写，定期 batch 归档
   - 中间步骤：写到一张 `agent_steps` 表（step_id, parent_step, tool_name, input_json, output_json, status, ts），方便回放
5. **多 Agent 分工/通信/终止**：
   - 分工：用 Planner + Executor + Critic 三角色，Planner 出计划、Executor 执行、Critic 评估是否结束
   - 通信：共享状态对象（LangGraph 里就是 `State`），不要让 Agent 之间直接对话——直接对话很容易扯皮
   - 终止：硬上限（最多 N 步）+ 软上限（Critic 连续 2 次说"已完成"）+ 异常上限（连续 3 次工具失败）
6. **避免死循环 / 扯皮**：
   - **设硬步数上限**（典型 10–15 步），到了就强制返回当前最优结果
   - **去重**：同一个工具 + 同一组参数在同一会话内调用过就直接返回缓存结果
   - **降权**：连续两次失败的工具，第三次自动从可选工具列表里剔除

**加分点**：能画出 `LangGraph State` 的字段表（`messages`, `current_plan`, `tool_history`, `step_count`, `should_continue`）；提到用 `interrupt()` / `human-in-the-loop` 兜复杂决策。

**雷区**：说"多 Agent 全交给 AutoGen 自己跑"——立刻被追问"那超时和死循环你怎么治"。

---

### Q3. 怎么设计 Tool Calling

> 追问：Schema 怎么定义？失败怎么处理？参数错误怎么兜底？怎么防危险工具？Tool 直接暴露还是服务端分发？怎么判断是 Prompt 问题还是模型能力问题？

**简版**：
> "Schema 用 JSON Schema + Pydantic 双层校验，模型这层用 JSON Schema 让它生成结构化输出，服务端这层用 Pydantic 真正解析。失败按"参数错→重 prompt"、"权限错→直接拒"、"执行错→重试 3 次"分类。危险工具不暴露，必须经过服务端二次确认。"

**展开**：

1. **Schema 定义**：
   - 模型侧：用 OpenAI function calling 风格的 JSON Schema，字段名用 snake_case，每个字段都写 `description`（模型主要看这个）
   - 服务端：同一份 Schema 用 Pydantic 反序列化，类型不对直接 422
   - 输出 Schema 同样要定义，否则后置流程没法接
2. **工具失败**：
   - 网络 / 5xx：指数退避重试（1s, 2s, 4s）
   - 4xx 参数错：**把错误信息塞回 prompt 让模型重写一次**，最多 2 次
   - 业务侧拒绝（如权限不足）：立即终止 + 透传给用户
3. **参数错误兜底**：
   - 服务端默认值（能给默认值的字段标记 `default`）
   - 枚举字段强制 fuzzy match（模型输出 "中国"，枚举只有 "China"，做映射）
   - 必填字段缺失：返回结构化错误让模型补一次，不补就转人工
4. **防止危险工具**：
   - 危险分级：read-only / write / destructive（比如删数据库、转账）
   - destructive 类**绝不放进 LLM 可见的 tool list**——由 LLM 提交"意图"，服务端拿到意图后弹二次确认（飞书卡片确认）再执行
   - 加 `allowlist` + 操作审计日志
5. **直接暴露 vs 服务端分发**：**永远走服务端分发**。理由：
   - 鉴权统一在服务端做（每个工具不重复写）
   - 工具版本可以热更新而不需要重新 prompt
   - 危险工具天然隔离
   - 审计与限流好做
6. **是 Prompt 问题还是模型能力问题**：
   - 控制变量：同样的 prompt 喂给更大的模型（豆包 1.6 → 豆包 pro / GPT-5），如果大模型能做对，**多半是模型能力**；大模型也错，**多半是 prompt**
   - 看 logit / log_prob：模型对正确 token 给的概率不低但输出错——属于 prompt 引导不够；概率本身就低——能力问题
   - 看 bad case 是否聚集（如 80% 集中在某个工具）——多半是 schema 描述写得烂

**加分点**：提到 MCP（Model Context Protocol），说 MCP 把"工具暴露"标准化了，未来工具发现可以走 MCP server。

**雷区**：说"我们让模型自己 retry"——基本被秒挂，因为没控成本和死循环。

---

### Q4. 项目中模型不听指令怎么办

> 追问：具体 bad case？怎么定位？Prompt/参数/后处理/流程约束哪个解？解决后有评测数据吗？反思会不会污染上下文？

**简版**：
> "典型 bad case 是模型在 ReAct 流程里跳过工具直接给答案。定位靠抓 trace（每步的 input/output 全落表）。先 Prompt 调（加 few-shot + 显式说"必须先调工具"），不行再加流程约束（在 LangGraph 里把"未调用工具就不能进入答案节点"写成边），最后才动模型参数（temperature 调到 0.2）。评测用一份 200 条的 bad case 回归集，每次改完跑一遍看通过率。"

**展开**：

1. **bad case 举例**：
   - "幻觉式工具调用"：工具名拼错（`get_user_info` → `getUserInfo`）
   - "省略式作答"：跳过工具直接给答案
   - "格式漂移"：要求 JSON 输出但偶尔加 markdown ```json```
   - "中文夹英文"：要求纯中文输出但混了英文术语
2. **定位**：必须有**端到端 trace**（每步 input/output/latency/cost 落库），SQL 一查就知道在哪段崩。没 trace 的项目 bad case 定位基本靠猜。
3. **解决手段优先级**（从便宜到贵）：
   1. **流程约束**最便宜：在框架层写硬规则（必须先调工具才能答），模型再不听话也走不通
   2. **后处理**次之：JSON 解析失败就强制 regex 兜底；格式漂移就 strip code fence
   3. **Prompt 优化**：加 1–3 条 few-shot 比改 system prompt 见效快
   4. **模型参数**：temperature ↓、top_p ↓ 可以稳定输出，但牺牲发散性
   5. **微调**最贵：bad case 量级到几千条才值得做 SFT/DPO
4. **评测数据**：
   - 一份 200–500 条的 bad case 回归集（人工标注）
   - 每次改完跑一遍，看「**修复率 vs 回归率**」两个指标
   - 业务侧再看「工单解决率」「人工兜底比例」这种 north star
5. **反思会不会污染上下文**：
   - 会。如果把"我刚才错了"原样塞回 context，下一轮模型容易过度自我怀疑或重复道歉
   - 处理：反思结果**摘要后再写回**，不留原始错误文本；或者反思放到独立的 scratchpad，不进主 context

**加分点**：提到 LLM-as-a-Judge 做自动评测，并能说出 judge 模型偏好长答案的偏差，要校准。

---

### Q5. Claude Code 的 Memory 机制

> 追问：为什么分层？项目规则 / 用户偏好 / 会话上下文怎么隔离？上下文过长怎么办？

**这题是「你平时用没用 Claude Code」的鉴别题**。如果只用过 Cursor/Copilot，请诚实说，不要硬编。

**简版**：
> "Claude Code 把记忆分三层：**项目级 `CLAUDE.md`**（仓库根，跟代码一起 commit，给项目级规则用）、**用户级 `~/.claude/CLAUDE.md`**（跨项目的个人偏好）、**会话级 context**（当前 conversation）。三层在每次请求时都拼到 system prompt，但生命周期不同，所以天然隔离——项目规则随仓库走，用户偏好跟着机器走，会话上下文随关掉窗口就丢。上下文过长时靠 auto-compact（接近 token limit 时自动总结历史 + 保留近期消息）。"

**展开**：

1. **为什么分层**：
   - **职责隔离**：项目规则（团队约定）和用户偏好（个人习惯）是两套不该耦合的东西；如果都写一起，换个人就乱套
   - **共享粒度不同**：`CLAUDE.md` 进 git，团队共享；`~/.claude/CLAUDE.md` 不进 git，个人专属
   - **优先级清晰**：项目级 > 用户级（团队规矩压过个人喜好）
2. **三层怎么隔离**：
   - 文件路径就是隔离手段：项目级在 repo，用户级在 home，会话级在内存
   - Claude Code 还有 `memory/` 子目录支持自动写入的小记忆文件（auto memory），用 frontmatter 标 type=user/feedback/project/reference
3. **上下文过长怎么办**：
   - **auto-compact**：到阈值（如 90% context window）自动跑总结，保留最近 N 轮原文 + 历史摘要
   - **prompt cache**：Anthropic 的 5-min TTL prompt cache 让长 system prompt 不付每次 input cost
   - **chapter 切分**：长会话主动 mark chapter，未来检索更准
   - **检索式记忆**：不是把所有历史塞 prompt，而是按相关性召回（typical 8K 历史 → 召回 2K 相关片段）

**加分点**：说出 Claude Code 在 Opus 4.7 上推荐用 `claude-opus-4-7` model ID，并提到 prompt cache 5-min TTL 对 long-running session 的影响。

---

### Q6. RAG 做过哪些优化

> 追问：为什么加 Rerank？Recall@K vs Precision@K 怎么取舍？Top-K 怎么动态调整？BM25 已经很好向量检索还有必要吗？

**简版**：
> "我们做了四件事：**查询改写、混合检索（BM25 + 向量）、Rerank、动态 Top-K**。Rerank 是因为向量召回追求 Recall，会把语义相似但答非所问的塞进来，Rerank 用 cross-encoder 重新精排提升 Precision。Top-K 按 query 长度和模型 context window 动态算（短 query 取 5，长 query 或多文档场景取 15–20）。BM25 在词面命中场景几乎无敌，向量检索补的是同义/近义/跨语种，两者是互补不是替代。"

**展开**：

1. **为什么加 Rerank**：
   - 召回阶段（vector / BM25）模型是 bi-encoder：query 和 doc 分别编码再算余弦，省算力但精度有限
   - Rerank 阶段用 cross-encoder（如 BGE-Reranker、Cohere Rerank-v3）把 query+doc 拼起来一起进模型，**精度高一档**但只能跑 top-N（N=50–100）
   - 一句话：召回 50 条 → Rerank 选 top-5 → 喂给 LLM
2. **Recall@K vs Precision@K**：
   - **召回阶段优先 Recall@K**：宁可多召回噪声，不能漏掉正确答案（漏了后面无论怎么排都救不回来）
   - **Rerank/最终阶段优先 Precision@K**：LLM context 有限，喂进去的每一条都该有用
   - 两者矛盾时：召回 K 调大（如 50→100）保 Recall，Rerank 严格保 Precision
3. **Top-K 动态调整**：
   - 按 **query 长度**：单实体查询 K=3–5，多实体或对比类 K=10+
   - 按 **chunk 大小**：chunk 短 K 调大，chunk 长 K 调小（不要爆 context）
   - 按 **Rerank 分数阈值**：分数低于 τ 的不要（即使位列 top-K）——这是动态 K 的精华
4. **BM25 已经够好向量检索还有必要吗**：**有，但不是所有场景**。
   - BM25 强在：精确词面匹配、专有名词、代码片段、数字、SKU
   - 向量强在：同义、近义、跨语言、概念查询
   - 飞连场景里 "VPN 连不上" 这种自然语言查询，BM25 漏掉「网络连接异常」这类同义文档，**必须**靠向量补
   - 工程上推荐 hybrid：BM25 + Vector 做 RRF（Reciprocal Rank Fusion）合并

**加分点**：提到 Late Interaction（ColBERT v2）作为 bi-encoder 和 cross-encoder 之间的折中；提到 chunk 策略（按语义切 vs 按 token 切）对 RAG 上限的决定性影响。

**雷区**：说"我们用了 Rerank 但没看 Recall/Precision 数据"——直接被追问"那你怎么知道有用"。

---

### Q7. Agentic RAG 和传统 RAG 的区别

> 追问：Query Rewrite 算 Agentic 吗？多轮检索怎么设计？检索失败 Agent 怎么调整策略？成本和稳定性怎么控？

**简版**：
> "传统 RAG 是 **retrieve-once → generate** 的一步流程；Agentic RAG 是 **plan → retrieve → reflect → re-retrieve → generate** 的多步循环，每步都允许 LLM 决定下一步动作。Query Rewrite 严格说只是预处理，不算 Agentic；要算 Agentic，至少要有「根据上一轮结果决定要不要再检索」这个决策点。多轮检索常用 **self-ask** 或 **iterative retrieval**，每轮迭代生成子问题再检索。成本控制靠硬上限（最多 N 轮）+ 早停（置信度够高就停）。"

**展开**：

1. **核心区别**：
   | 维度 | 传统 RAG | Agentic RAG |
   |---|---|---|
   | 检索次数 | 1 | N |
   | 决策权 | 没有，固定流程 | LLM 决定要不要再查、查什么 |
   | 工具数 | 1（一个检索器） | 多（多个数据源 + 计算工具） |
   | 适用 | 简单事实查询 | 多跳推理、跨文档对比、深度研究 |
   | 成本 | 低 | 3–10x |
   | 稳定性 | 高 | 低（多了决策点就多了失败点） |
2. **Query Rewrite 算 Agentic 吗**：**严格说不算**。
   - Query Rewrite 是固定一步预处理，无决策回路 → 仍是传统 RAG
   - 但如果是「**检索一轮 → 看结果 → 改 query → 再检索**」的循环，那就是 Agentic
3. **多轮检索设计**：
   - **Self-Ask**：LLM 自问"我还需要知道什么"，生成子问题 → 检索 → 答 → 拼装
   - **ReAct-RAG**：Thought → Search → Observation → Thought → ... 直到 Answer
   - **Plan-and-Execute**：先出完整 plan（5 步），再执行
   - 飞连 IT 工单场景适合 ReAct-RAG（用户描述往往不完整，需要边问边查）
4. **检索失败时的策略**：
   - 改写 query（同义词、去停用词、英文化）
   - 切数据源（wiki 没查到 → 切到工单历史 → 切到代码库）
   - 降难度（找不到完整答案就找相关上下文，让 LLM 推理）
   - 兜底：透明告知"未找到相关文档"+ 转人工
5. **成本与稳定性控制**：
   - **硬上限**：每个 query 最多 N 轮（典型 3–5）
   - **早停**：每轮算一次置信度，超过 τ 就停
   - **缓存**：同一个 sub-query 命中过就不重复
   - **降级**：Agentic RAG 失败/超时 → fallback 到传统 RAG
   - **小模型做决策、大模型做总结**：决策环节用 Haiku 4.5 / 豆包 lite，便宜稳定

**加分点**：提到 Anthropic 的 deep-research / multi-agent research 论文，把研究任务拆给多个 sub-agent 并行做。

---

### Q8. 用过哪些 Agent 框架

> 追问：LangGraph vs LangChain？State/Node/Edge 各解决什么？为什么选 LangGraph 不选 AutoGen/CrewAI/手写？框架不满足怎么扩展？

**简版**：
> "LangChain 是早期的"链式调用"抽象，封装了 prompt / LLM / output parser 这些 building block；LangGraph 是 LangChain 团队后来出的有状态图框架，把"工作流"显式建模成状态机。State 解决"上下文怎么传"，Node 解决"每一步做什么"，Edge 解决"下一步去哪"，特别是 conditional edge 让流程可以根据状态走不同分支。选 LangGraph 是因为它最贴近"显式有限状态机"的心智模型，调试、回放、断点都比 AutoGen 那种"Agent 互相说话"好治理。框架不满足时可以直接写 Node 函数（任意 Python），State 用 TypedDict 自定义。"

**展开**：

1. **LangChain vs LangGraph**：
   - LangChain：链式（LCEL），适合 prompt → llm → parser 这种线性流
   - LangGraph：图式，节点是函数、边是路由，支持循环、分支、并行、人工介入
   - LangChain 现在的官方推荐是"复杂逻辑用 LangGraph，LangChain 只做底层组件"
2. **State / Node / Edge**：
   - **State**：整个图的共享上下文，TypedDict 定义字段（messages、plan、step_count……），每个 Node 读 + 改它
   - **Node**：纯函数（input=State, output=State partial），可以是 LLM 调用、工具调用、纯 Python 逻辑
   - **Edge**：
     - 静态 Edge：`A → B`
     - Conditional Edge：函数返回下一节点名，实现分支与循环
     - `END`：终止
3. **为什么 LangGraph 而不是别的**：
   - **AutoGen**：多 Agent 对话范式，适合"Agent 互聊"，**调试很痛苦**（对话历史长且非结构化）
   - **CrewAI**：角色化抽象（Crew / Agent / Task），上手快但定制弱
   - **手写状态机**：可控但要重写一堆通用能力（state persistence、stream、interrupt）
   - LangGraph 是**显式状态 + 显式路由 + 复用通用能力**的折中
4. **框架能力不满足怎么扩展**：
   - Node 是普通函数，想怎么写怎么写
   - 自定义 Checkpoint（state 持久化）：实现 `BaseCheckpointSaver` 接口接 Redis / Postgres
   - 自定义 Stream：自己 yield，前端用 SSE 接
   - 真的不行就**只用 LangGraph 的 State 和 Edge 抽象，Node 内部全部自写**

**加分点**：能讲清 LangGraph 的 `interrupt()` 怎么实现 human-in-the-loop（暂停 → 等用户输入 → resume from checkpoint）。

---

### Q9. 怎么看扣子（Coze）这类产品

> 追问：低代码 Agent 平台的优势和局限？和 LangGraph 怎么选？

**面试官眼里这题是"政治正确"题**——扣子是字节自家产品，**不能踩**，但也不能夸到失去判断力。

**简版**：
> "扣子这类低代码 Agent 平台的核心价值是**让非工程师也能搭出可用的 Agent**——拖拽节点、可视化编排、内置常用工具，对营销、运营、HR 场景特别合适。局限是**复杂控制流和深度定制**：自定义 state 结构、复杂分支、和已有系统深度集成时，可视化反而成了束缚。选型上的简单原则：业务流程相对标准、改动频繁、需求方是非技术 → 扣子；流程复杂、性能敏感、需要嵌入已有大系统 → LangGraph 这类代码框架。我们项目里偶尔会让运营同学在扣子上先搭原型验证需求，工程化阶段再迁到代码。"

**展开**：

1. **优势**：
   - **极低上手成本**：UI 拖拽，几分钟出 demo
   - **内置插件市场**：飞书、抖音、TikTok、常用 SaaS 一键接
   - **托管运行环境**：不用自己起服务
   - **协作友好**：产品/运营/工程同框讨论
2. **局限**：
   - **复杂控制流难表达**：循环、并行、条件嵌套深了 UI 就乱
   - **自定义性受限**：自定义 Node、自定义 State 结构、复杂错误处理基本只能"魔改"
   - **版本管理与代码 Review 不友好**：JSON 配置文件 diff 几乎无法读
   - **平台锁定**：搭出来的东西迁出来要重写
   - **性能/成本不可控**：跑在平台托管环境，难做精细优化
3. **怎么选**：
   - **用扣子的场景**：需求迭代快、流程标准、非技术参与、小流量
   - **用 LangGraph 的场景**：高 QPS、复杂状态、深度集成、性能敏感
   - **混合用**：扣子做原型 → 代码框架做生产；或者把扣子的 workflow 当成"低代码沙箱"，让运营自己改文案，工程只负责底座

**雷区**：直接说"扣子就是玩具"——隔壁组工程师会非常难过。

---

### Q10. AI 编程工具的使用流程

> 追问：怎么保证 AI 生成代码质量？规则文件 / 测试 / Code Review 兜底？

**简版**：
> "我主用 Claude Code，流程是：**先在 `CLAUDE.md` 写项目规则**（架构约定、风格、禁忌）→ **用 plan 模式让它先出方案**而不是直接写代码 → **小步实施 + 每步跑测试** → **完成后人工 review diff + 跑完整测试套件**。质量靠三层兜底：项目规则文件（约束生成方向）、单测/集成测试（防回归）、人工 Code Review（catch 设计问题）。"

**展开**：

1. **项目规则文件**：`CLAUDE.md` 写架构约定、命名规范、禁忌操作（如「不准 mock 数据库」「不准跳过 lint」），这是 AI 编程的"宪法"
2. **Plan 优先**：复杂改动先让 AI 出 plan，人 review plan，再让它写代码——比让它一上来狂改文件靠谱
3. **小步实施**：每完成一个 Task 立刻跑测试 / type check，**绝不积压一堆改动后才验证**
4. **测试驱动**：让 AI 先写测试再写实现，或者改完立刻让它跑现有测试
5. **Code Review**：AI 写的代码必须人工至少扫一遍 diff——尤其留意「过度抽象」「无意义的兜底 try-catch」「自作主张加新依赖」这三个典型问题
6. **多模型交叉验证**：复杂决策让另一个模型（Codex / Gemini）独立 review 一次

**加分点**：提到自己有一套 keyboard shortcut、hook 配置、custom skill，说明是深度用户而不是偶尔玩玩。

---

## 五、八股 6 题：要点速答

### Q11. Redis 数据结构

> String / Hash / List / Set / ZSet 各适合什么？Agent 会话状态用哪种？

| 结构 | 典型场景 |
|---|---|
| **String** | 计数器（`INCR`）、缓存对象 JSON、分布式锁 |
| **Hash** | 对象字段级读写（用户资料、**Agent 会话状态**：`HSET session:xxx step 3`）|
| **List** | 消息队列（左进右出）、操作日志 |
| **Set** | 去重（已处理 tool_call_id）、标签 |
| **ZSet** | 排行榜、按时间戳排序的事件、延时队列 |

**Agent 会话状态推荐 Hash**：字段级 update 不用读整个对象，省带宽；TTL 整体设在 key 上即可。如果状态结构复杂、需要嵌套，反而推荐序列化成 JSON 存 String，简单。

### Q12. 过期删除策略 + 内存淘汰策略

- **Key 过期会立刻删吗**：**不会**。Redis 用 **惰性删除 + 定期删除** 组合：
  - **惰性删除**：下次访问这个 key 才检查、过期就删
  - **定期删除**：每 100ms 抽样若干个有 TTL 的 key 检查
- `maxmemory-policy` 8 种：
  - `noeviction`（默认）/ `allkeys-lru` / `allkeys-lfu` / `allkeys-random` / `volatile-lru` / `volatile-lfu` / `volatile-random` / `volatile-ttl`
- **Agent 会话状态选 `allkeys-lru` 或 `volatile-lru`**：会话本身就有时效性，LRU 自然把最久没碰的踢掉。

### Q13. 缓存穿透 / 击穿 / 雪崩

| 概念 | 含义 | 解法 |
|---|---|---|
| **穿透** | 查一个**不存在**的 key，每次都打到 DB | 缓存空值（短 TTL）+ **布隆过滤器**前置判断 |
| **击穿** | 一个**热点 key 过期**瞬间大量并发打到 DB | **互斥锁**（只让一个线程回源，其他等结果）/ 永不过期 + 异步更新 |
| **雪崩** | **大量 key 同时过期** + 突发流量打到 DB | **过期时间加随机扰动**（base + rand）/ 多级缓存 / 限流降级 |

- **布隆过滤器**：用多个 hash 函数把 key 映射到 bit 数组，**说不存在一定不存在，说存在可能误判**。用来挡掉绝大部分"查不存在 key"的穿透。
- **击穿加互斥锁**：避免 N 个请求同时回源 DB，DB 被打挂
- **雪崩加随机过期**：防止"同一秒批量过期"

### Q14. Redis Stream vs Kafka

| 维度 | Redis Stream | Kafka |
|---|---|---|
| 持久化 | 看 Redis 持久化模式（RDB/AOF），AOF everysec 仍可能丢 1s | 磁盘顺序写 + 副本，更强 |
| 吞吐 | 单机十万级 | 单机百万级 |
| 消费组 | 有（XGROUP） | 有（Consumer Group） |
| ACK | XACK | offset commit |
| Pending List | **未 ACK 的消息会留在 Pending List**，挂掉的 consumer 重启后能 claim 回去 | 类似机制是 unconfirmed offset |
| 用场景 | 中小规模事件、Agent 步骤日志、消息总线 | 大规模日志、跨系统数据管道 |

- **Redis Stream 能保证消息不丢吗**：在 AOF `appendfsync always` + 主从复制下接近不丢，但仍弱于 Kafka
- **什么时候选哪个**：已经有 Redis、量不大、想少一个组件 → Stream；高吞吐 / 跨团队数据管道 / 严格一致性 → Kafka

### Q15. Transformer 基础

- **Self-Attention**：
  - 每个 token 算 Q / K / V 三个向量
  - 注意力分数 = `softmax(Q · K^T / sqrt(d_k)) · V`
  - 除以 `sqrt(d_k)` 是为了防止 softmax 在大 d_k 下梯度消失
- **Multi-Head Attention**：把 Q/K/V 切成 h 份并行做注意力，**让模型在不同子空间关注不同信息**（句法 / 语义 / 位置），最后 concat + 线性层融合
- **GPT vs BERT**：
  - **GPT**：Decoder-only，**因果 mask**（只能看前文），训练目标是 next token prediction → 适合生成
  - **BERT**：Encoder-only，**双向 attention**，训练目标是 MLM + NSP → 适合理解 / 分类 / 抽取
  - 现代主流（包括 Claude / GPT / 豆包）全是 Decoder-only，因为生成能力上限更高且能 zero-shot 做理解任务

### Q16. SFT vs RLHF vs DPO

| 阶段 | 做什么 | 数据形态 | 难点 |
|---|---|---|---|
| **SFT** | 监督微调，让模型学会"指令 → 答案"的格式 | (prompt, response) | 答案质量上限决定模型上限 |
| **RLHF** | 用人类偏好训 Reward Model，再用 PPO 优化 | (prompt, response_A, response_B, 谁更好) | 训练不稳定、超参敏感、贵 |
| **DPO** | 直接用偏好数据优化策略，**跳过 RM** | 同 RLHF 偏好对 | 稳定、便宜、效果接近 PPO |

- **为什么 SFT 后还要偏好优化**：SFT 只会"模仿"标注答案的格式，但**不会区分"哪个回答更好"**——偏好优化让模型学到「helpful / harmless / honest」这种排序信号，对话体验质变。
- 现在工业主流是 **SFT → DPO**（或 ORPO/KTO 变体），PPO 因为太贵已经少用。

---

## 六、算法题：合并两个有序链表

> LeetCode 21，Easy。

**核心思路**：双指针 + dummy head。

```python
# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

class Solution:
    def mergeTwoLists(self, l1: ListNode, l2: ListNode) -> ListNode:
        dummy = ListNode()
        cur = dummy
        while l1 and l2:
            if l1.val <= l2.val:
                cur.next = l1
                l1 = l1.next
            else:
                cur.next = l2
                l2 = l2.next
            cur = cur.next
        cur.next = l1 if l1 else l2
        return dummy.next
```

**复杂度**：时间 O(m+n)，空间 O(1)（只用了几个指针，**没有创建新节点**）。

**面试要点**：
- 用 dummy head 避免「头节点单独处理」的冗余逻辑
- 比较时用 `<=` 保证稳定（相等时 l1 优先）
- 最后一行 `cur.next = l1 if l1 else l2` 直接接上剩余的——别傻乎乎再 while 一遍
- 递归写法也能 ≤5 行写完，但**面试默认要求迭代**（递归在长链表上会爆栈）

**追问可能**：
- 合并 K 个有序链表？→ 用最小堆（heapq）或者分治两两合并
- 链表 vs 数组合并？→ 链表不需要额外空间，数组需要

---

## 五、争议与风险

### 5.1 "刷面经" vs "做项目"

这套题面给的信息已经非常密集，**但密集本身就是陷阱**：照着题目背答案的候选人，遇到面试官追问"你具体写的哪个函数"立刻露馅。**面经只能用来对照自己项目的缺口，不能用来代替项目本身**。

### 5.2 题目时效性

- 框架题里的 LangGraph 是 2024–2026 主流，但 2026 H2 OpenAI Agents SDK / Anthropic Computer Use SDK / 字节自研 Agent Studio 都在抢这个生态位
- RAG 题里的 Cohere Rerank、BGE 是当下答案，半年后可能换成 ColBERT v2 / Late Interaction 主流化
- 模型题里的 SFT/RLHF/DPO 已经在被 ORPO / SimPO / KTO 替代

### 5.3 "飞连"特有的隐藏考点

题面没明说，但飞连业务背景下面试官**会偷偷加分**的方向：
- **安全合规**：Agent 触碰内网工具时怎么做权限校验、审计、敏感词过滤
- **企业上下文**：飞书机器人 / 多租户 / 跨组织数据隔离
- **低延迟**：IT 工单交互是同步的，对响应时间敏感（>5s 用户就走了）

### 5.4 八股题的真实分量

八股题答得溜不算加分（这是大厂应届最低线），但答不出来直接挂。**Redis 那四题尤其要会**，因为 Agent 系统真的会大量用 Redis 做 session / cache / lock / event bus。

## 六、个人结论

**一句话定性**：这是一份**质量明显高于均值**的 Agent 应用岗二面题集——题目分布合理，既考"做没做过"又考"懂不懂底层"，没有出现纯背诵或纯刁难。

**判断**：✅ **跟进**。理由：
1. 题面覆盖了 2026 年 Agent 工程师的全部主流知识图谱，可以作为**自我盘点 checklist**
2. 字节飞连场景（企业 IT + AI Agent）是少数已经跑通商业闭环的 Agent 落地方向，技术选型有参考价值
3. 八股题虽然偏 Redis 单点，但折射出"Agent 系统 = LLM + 一堆传统中间件"的工程现实，避免陷入"只学 LLM 不学工程"的偏科

**下一步行动**（针对个人）：
- 把自己项目对照 Q2/Q3/Q4 重新写一份 1500 字以内的「项目自述」，包含具体字段名 / 数据结构 / 评测数据
- 整理一份「bad case → 解法 → 评测改善」的小型 portfolio（哪怕只有 5 条）
- 准备好"为什么选 LangGraph"的可挑战版本：能讲清楚 AutoGen / CrewAI / 手写状态机各自的坑
- Redis 八股 + 合并链表当天背一下足够，不要花太多时间

## 七、信息来源

- [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/) — Node / Edge / State / Checkpoint 抽象的一手定义
- [Anthropic — Building effective agents](https://www.anthropic.com/research/building-effective-agents) — workflow vs agent / tool design 最值得读的一份
- [Anthropic — Claude Code docs](https://docs.claude.com/en/docs/claude-code/overview) — Memory / CLAUDE.md / auto-compact 机制说明
- [Redis 官方文档：Eviction policies](https://redis.io/docs/latest/develop/reference/eviction/) — maxmemory-policy 全部 8 种的一手定义
- [Redis Streams Introduction](https://redis.io/docs/latest/develop/data-types/streams/) — Pending List / XACK / Consumer Group 一手说明
- [BGE Reranker on Hugging Face](https://huggingface.co/BAAI/bge-reranker-v2-m3) — cross-encoder rerank 当前事实标准
- [DPO 原始论文（Rafailov et al., 2023）](https://arxiv.org/abs/2305.18290) — "Direct Preference Optimization" 公式与推导
- [LeetCode 21 · Merge Two Sorted Lists](https://leetcode.com/problems/merge-two-sorted-lists/) — 官方题面
- 飞连官网 <https://www.feishu.cn/product/feilian> — 业务定位参考

---
title: 类 AGI 智能体调研：真正能干活的第一梯队，以及谁真的在用
category: topics
topic_type: industry
subjects: [ai_dev]
content_type: analysis
date: 2026-06-17
time: 09:16
updated: 2026-11-04
tags: [AI Agent, 类AGI, Codex, Claude Code, Computer Use, ChatGPT, Project Astra, Microsoft Copilot Studio, Manus, OpenClaw, 智能体, 行业调研]
summary: 把「类 AGI」收窄为可验收的工作闭环：操作代码库 / 电脑环境、多步执行、结果可审。事实层列公开产品能力；用户图景与梯队排序标为外部观察，避免写成已验证全球排名。
tldr: 按「能干活、可验收」口径，公开可见的第一梯队仍是工程向 agent（Codex 系与 Claude Code 系）。对话入口里的任务助手、多模态随身原型、企业流程平台、自托管工作台分属不同层，不宜压成单一「最强」。谁真的在用，只能描述可见工作方式样本，不能写成全球用户冠军榜。
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
pv: 0
---

## 一、先给结论

「类 AGI」的比较标准收得很窄：**能不能接复杂目标、操作环境、跑一段时间后交出可验收结果**。只会对话或给建议，不进入「工作型第一梯队」比较。

目前能站住的判断：

1. **工作感来自系统，不只来自单模型**：终端、文件系统、代码库、浏览器、测试、权限确认，以及人在终点验收，共同构成闭环。
2. **工程向 agent 最先穿过「真实工作流」门**：公开产品里，Codex（ChatGPT / CLI / Cloud 工作流）与 Claude Code（本地仓库级 harness）证据最密。
3. **其他产品线服务不同问题**：ChatGPT 的任务 / Work 入口偏知识工作；Project Astra / Gemini 偏随身多模态；Copilot Studio 偏企业权限与流程；OpenClaw / Manus 等偏自建工作台。
4. **用户侧没有可核验的「全球第一用户」榜**：下文把 AI-native 小团队、高级程序员、研究员、企业业务团队、超级个体写成**使用形态样本**，不写成名次。

---

## 二、事实层（复核截至 2026-11-04）

### 2.1 产品能力对照（公开资料，非基准跑分）

| 产品线 | 公开可见能力 | 更像哪一类问题 | 资料锚点 |
|---|---|---|---|
| **OpenAI Codex** | 读改代码库、跑命令与测试、云沙箱并行任务；CLI / ChatGPT Desktop / Cloud 多入口；可用 AGENTS.md 约束仓库习惯 | 软件工程交付 | [Introducing Codex](https://openai.com/index/introducing-codex/)；Help Center「ChatGPT Work and Codex」 |
| **Anthropic Claude Code** | 本地终端与仓库级 agent harness；工具循环、子 agent、hooks / skills / MCP | 深度本地开发工作流 | [Claude Code](https://www.anthropic.com/claude-code)；Building Effective Agents |
| **ChatGPT Agent / Work** | 对话入口上的多步任务、研究与交付物；与 Codex 分工（Work 偏通用交付，Codex 偏软件） | 知识工作与轻任务 | OpenAI 产品说明与 Help Center |
| **Computer use（Anthropic 等）** | 模型操作图形界面的参考实现 / API 能力 | GUI 操作，稳定性与成本仍是约束 | Anthropic computer use 公告 |
| **Gemini / Project Astra** | 实时多模态、跨设备助理原型 | 随身 AI 形态 | [Project Astra](https://deepmind.google/models/project-astra/) |
| **Microsoft Copilot Studio** | 企业 agent 搭建：连接器、权限、审批、审计 | 企业流程落地 | [Copilot Studio](https://www.microsoft.com/en-us/microsoft-365-copilot/microsoft-copilot-studio) |
| **OpenClaw** | 自托管网关 + 多消息渠道 + Skills；星标高，**无权威公开 MAU** | 极客 / 自建执行层 | 仓库与 [gradually.ai 统计述评](https://www.gradually.ai/en/openclaw-statistics/) |
| **Manus / Genspark / Comet 等** | 浏览器或综合工作台，把搜索、文档、页面生成串起来 | 个人任务台 | 各产品页（功能迭代快） |

说明：表中「更像哪一类问题」是归类，**不是**强度排名。同一厂商产品线在 2026 年内多次改名与合并入口，引用以当日帮助中心 / 文档为准。

### 2.2 编码场景为什么证据更密

编码任务自带客观反馈：编译、测试、类型检查、diff 审查。OpenAI 与 Anthropic 都把 coding agent 当作优先验证场（SWE-bench 类评测、内部工程使用案例）。这解释了为何「能干活」的体感最先出现在仓库里，而不是先出现在全生活助理里。

### 2.3 企业与个人的验收标准不同

| 主体 | 常问的问题 | 公开可见落地形态 |
|---|---|---|
| 个人开发者 | 能否改完、测过、可审查 | Codex / Claude Code / IDE agent |
| 知识工作者 | 能否出报告、表、稿 | ChatGPT Work / 研究型 agent |
| 企业 IT | 权限、连接器、审计、谁负责 | Copilot Studio 等平台 |
| 自托管爱好者 | 数据是否留本地、渠道是否自控 | OpenClaw 等 |

---

## 三、结构分析：差距从 prompt 移到工作系统

早期差距常被说成 prompt 技巧。公开产品演进后，更硬的差距变成：

| 能力 | 具体表现 |
|---|---|
| 拆任务 | 把模糊目标切成 agent 能执行的块 |
| 定验收 | 区分「看起来完成」与「真的完成」 |
| 管权限 | 哪些目录、账号、生产环境不能交出去 |
| 组工具 | 浏览器、仓库、脚本、云、文档是否串得起来 |
| 看质量 | 幻觉、偷懒、越权、边界错误能否被抓住 |

同一 Codex 或同一 Claude Code，在不同人手里差距可以很大——放大的是判断结构，不是神秘提示词。站内 [Vibe Coding 的判断结构](/articles/research/topics/vibe-coding-judgment-structure) 写过同一机制。

类 AGI **体验**也会先出现在可验证域：代码、表格、带来源的报告、有日志的企业流程。手机跨 App、长期生活决策、情感陪伴看起来更像终局助理，但权限、隐私与责任链更长，公开落地更慢。

---

## 四、外部研判（观察，非排名）

以下为作者外部观察，置信度中等，**可被反证推翻**。

**对「第一梯队」的柔和表述**：若问题是「工程师能否把复杂工程任务交给 agent 并回收可审结果」，Codex 系与 Claude Code 系仍是公开证据最密的两档。若问题是「普通人生活杂事是否已有类 AGI」，答案是否定的——多数仍停在对话或轻任务。

**对「谁真的在用」**：

- **AI-native 小团队**：人负责方向、边界与发布；agent 负责高密度执行。OpenClaw 核心贡献者团队常被外界当成样本，但公开材料**不足以**证明「全球最会用 agent」；只适合说「工作方式样本」。
- **高级程序员 / vibe coder**：工具栈通常是 IDE agent + 仓库级 agent + CI / 脚本，而不是单一产品。
- **研究员与创作者**：Deep Research / 工作台式产品省体力，但成品感越强越要查来源。
- **企业业务团队**：客服、工单、合同、知识库——窄流程 + 权限，比「万能机器人」更常见。
- **超级个体**：把站点、调研、分发、小工具串成个人生产线；单模型分数只是其中一项。

旧稿中「截至某日最强通用工作型智能体是 Codex」「第一用户是 OpenClaw 三人团队」这类**绝对句**，在证据不足时应降级为个人偏好或样本假说。本版删除全球冠军句式。

---

## 五、信息来源与持续验证

资料复核截至 **2026-11-04（北京）**。

**官方 / 一手**

- [OpenAI：Introducing Codex](https://openai.com/index/introducing-codex/)
- [OpenAI Help：ChatGPT Work and Codex](https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex)
- [Anthropic：Claude Code](https://www.anthropic.com/claude-code)
- [Anthropic：Building effective agents](https://www.anthropic.com/research/building-effective-agents)
- [Google DeepMind：Project Astra](https://deepmind.google/models/project-astra/)
- [Microsoft Copilot Studio](https://www.microsoft.com/en-us/microsoft-365-copilot/microsoft-copilot-studio)

**站内交叉**

- [国内通用智能体对比](/articles/research/topics/china-general-agents)
- [OpenClaw 主流采用现实检验](/articles/research/topics/openclaw-mainstream-adoption-reality-check)
- [Vibe Coding 的判断结构](/articles/research/topics/vibe-coding-judgment-structure)

**持续验证**

- OpenAI / Anthropic 若发布可复现的同一任务集人机对照生产力数据，第二节梯队表述可升级或改写。
- 若出现非编码域（客服 / 办公）可公开审计的大规模闭环指标，并稳定超过编码域，「体验先出现在可验证域」需重写。
- OpenClaw 若公布可定义的安装 / 活跃口径（而非未定义的「new claws」），用户样本段可补定量。

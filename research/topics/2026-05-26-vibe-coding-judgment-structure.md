---
title: Vibe Coding 的判断结构：产能放大之后，系统责任仍在人这边
category: topics
topic_type: thesis
subjects: [ai_dev]
date: 2026-05-26
updated: 2026-11-04
tags: [Vibe Coding, AI 编程, 架构师, 判断力, 技术管理, 安全设计, Agent]
summary: Vibe coding 提高了执行产能，但幻觉漂移、上下文坍塌与越权扩张会把效率红利一次性吐回。把判断力拆成可委托层与不可委托层，并落到授权、可逆、验证与知识轨迹四条硬闸。
tldr: 执行正在被 token 平权，判断正在被事故定价。AI 能放大产能，却无法替代系统级责任。
assistance: cursor
model: grok
show_assistance: false
review_ready: false
ad_eligible: false
---

## 结论

1. Vibe coding 的产能红利是真实的；一次权限、支付一致性或契约误判，也可能把前期收益全部吃掉。
2. 工具形态已从补全、对话进入代理：失误对象从一行代码升级为整条变更与整条任务。
3. 高频失控向量有三类：幻觉漂移、上下文坍塌、越权扩张。拦截层必须分别设计，不能只靠“提醒模型小心”。
4. 判断力可按三层管理：L1 基础实现可让 agent 跑并验证；L2 治理半委托但必须留闸；L3 责任层（问题定义、TCO、组织 ADR、法律伦理、是否做）由人拍板。
5. Agent 时代要显式管理四把尺：授权边界、可逆性预算、验证回路、知识轨迹。
6. DORA 2025 把 AI 描述为放大器——放大高绩效组织的优势，也放大低绩效组织的功能障碍；安全扫描报告与 LLM 应用风险清单提供了可核验的外部证据，但无法替代组织自己的事故账本。

## 事实层

### 工具形态变化（可观察）

过去一年，AI 编程常见形态从补全（Copilot 一类）、对话（Cursor / ChatGPT 一类）推进到代理（Claude Code / Codex 等）。协作单位从接受一行 / 一段 diff，扩展到 agent 自己读文件、改文件、跑命令、提 PR。失误也从拼写错误，扩展到“看起来正确的整条变更”。

### 外部证据（公开报告）

- **DORA 2025 State of AI-assisted Software Development**：基于近 5,000 名技术从业者问卷与超过 100 小时定性材料，核心判断是 AI 主要扮演放大器角色。[报告页](https://research.google/pubs/dora-2025-state-of-ai-assisted-software-development-report/)、[Google 介绍](https://blog.google/innovation-and-ai/technology/developers-tools/dora-report-2025/)
- **Veracode 2025 GenAI Code Security Report**：在多语言安全编码任务上测试大量 LLM；公开摘要称约 45% 的生成代码引入已知漏洞，且安全表现并不随模型规模或发布日期单调改善。[报告入口](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/)、[PDF](https://www.veracode.com/wp-content/uploads/2025_GenAI_Code_Security_Report_Final.pdf)
- **OWASP Top 10 for LLM Applications 2025**：给出 LLM 应用常见风险分类，可作为威胁建模清单，不能直接当作某一团队的事故率。[PDF](https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf)
- **Claude Code 文档**：代理式编码客户端具备读写工作区与执行命令等能力；权限与工作区边界需由产品与流程约束。[文档](https://docs.anthropic.com/en/docs/claude-code/overview)

上述数字来自第三方公开材料，不是本站实测。不同评测集与任务定义会导致比例变化；引用它们是为了说明“生成看起来能跑的代码”与“安全/契约正确”不是同一件事。

### 三个失控向量

| 向量 | 典型表现 | 相对难拦点 |
|---|---|---|
| 幻觉漂移 | 调不存在的 API、错权限语义、错 join / 计费公式 | 编译与类型能挡住一部分；业务规则幻觉更危险 |
| 上下文坍塌 | 只见局部片段，却以全局正确口吻改接口、默认值或并发假设 | 常在生产才暴露 |
| 越权扩张 | 未授权 push、改 schema、装依赖、调真实外部 API | agentic 工作流的新坑 |

## 结构：三层金字塔与四把尺

```
                L3 责任层（不可委托）
                问题定义 / 成本 TCO / 组织 ADR /
                法律伦理 / AI 元判断（该不该做）

          L2 治理层（可半委托，必须留检查点）
          数据建模 / 可靠性 / 可观测 / API 契约 /
          测试策略 / 依赖供应链 / 灾备与知识传承

    L1 基础层（AI 能写得很好，但必须验证）
    技术骨架 / 安全默认 / UI·UE 主路径
```

读法：

- L1 最显眼，也最容易让人放松——“看起来都对”。
- L2 是多数生产事故来源；agent 可以起草，人必须留闸。
- L3 需要承担后果的资格；模型没有合同与组织责任主体。

简化操作口令：**L1 让 agent 跑并验证；L2 让 agent 跑但留闸；L3 永远人来拍板。**

### 四把尺

1. **授权边界**：黄区（读文件、本地测试）默认可放行；橙区（新依赖、CI 配置）单次授权；红区（远端 push、schema、真实下单、密钥）必须人工确认。落地靠 permission profile / allowlist，而不是口头提醒。
2. **可逆性预算**：先问“错了多久能回滚、代价多大”。分钟级可逆与不可逆（已扣款、已删数据、已发正式通知）不能同一审批强度。
3. **验证回路**：意图 → 生成 → 自动验证（类型 / 测试 / lint / 扫描）→ 人工验证（语义 / 契约 / 边界）。自动测试不等于独立验证；为通过而写的测试需要另路合约或红队。
4. **知识轨迹**：agent 改动落库时带 ADR / 决策摘要 / 关键 prompt 摘要，避免三个月后无人能解释“为什么这样”。

### 五个高频翻车与防御（工程经验，非统计排名）

| 场景 | 失误形态 | 防御动作 |
|---|---|---|
| 支付 / 退款 | 状态机不闭环、缺幂等 | 状态机先于代码；强制幂等；对账作业 |
| 接口重构 | 字段重命名打挂下游 | additive-only；契约测试；兼容窗口 |
| 新依赖 | 陈旧或钓鱼包 | 私有镜像 + allowlist + SBOM |
| 权限模块 | 默认放宽、缺审计 | deny by default；权限矩阵评审 |
| Agent 自动命令 | 越权、不可逆 | 红区动作人工确认 |

### 给三类角色的分工

- **执行者**：把 agent 当高产但无责任主体的协作者；看不懂的改动不要批量接受。
- **评审者**：评审重心从风格转到边界、契约、不变量；把重复反馈固化成 lint / CI。
- **决策者**：把红区清单、供应商与数据出境边界、风险 KPI（回滚率、MTTR、安全事件）做成组织资产。

## 外部判断

Vibe coding 把“会写代码”变成更便宜的基础设施。它拿不走三件事：承担后果的资格、跨域权衡的资格、设定“什么不该做”的资格。架构师与技术决策者的含金量上升，是因为执行稀缺性下降后，避免不可逆损失变成更贵的能力。

监管语境（如中国《生成式人工智能服务管理暂行办法》、EU AI Act）提醒：对外服务与高风险用途另有合规义务；本文不做法条释义，只提示工程判断之外还有法律层。[暂行办法](http://www.cac.gov.cn/2023-07/13/c_1690898327029107.htm)、[EU AI Act](https://eur-lex.europa.eu/eli/reg/2024/1689/oj)

## 信息来源

- [DORA 2025 State of AI-assisted Software Development Report](https://research.google/pubs/dora-2025-state-of-ai-assisted-software-development-report/)
- [How are developers using AI? Inside Google's 2025 DORA report](https://blog.google/innovation-and-ai/technology/developers-tools/dora-report-2025/)
- [Veracode 2025 GenAI Code Security Report](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/)
- [Veracode PDF](https://www.veracode.com/wp-content/uploads/2025_GenAI_Code_Security_Report_Final.pdf)
- [OWASP Top 10 for LLM Applications 2025 (PDF)](https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf)
- [Anthropic — Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code/overview)
- [《生成式人工智能服务管理暂行办法》](http://www.cac.gov.cn/2023-07/13/c_1690898327029107.htm)
- [EU AI Act — Official text](https://eur-lex.europa.eu/eli/reg/2024/1689/oj)

## 持续验证

- DORA / Veracode 的具体百分比随报告版本与评测集变化；引用前应打开当期 PDF 核对表述。
- 各家 agent 产品的默认权限模型与审批 UI 仍在快速改版；落地前对照当前官方文档，而不是本文的黄橙红分区示意。
- 本站未提供统一事故账本；组织级结论应以自身回滚率、安全事件与变更失败率为准。

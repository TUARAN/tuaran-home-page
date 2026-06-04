/**
 * Skill 中心数据源 —— 主页 /skill-center 和详情页 /skill-center/[skillId] 共享
 */
export const PUBLISHED_SKILLS = [
  {
    id: 'llm-productivity-directives',
    name: 'llm-productivity-directives',
    title: '大模型增效指令 skill',
    category: '个人系统',
    status: '已上架',
    desc: '写作、调研、编程协作通用的反默认值指令清单，用明确规则压住自我指涉、过度结构化和不懂装懂。',
    trigger: '当用户要求大模型协助写作、调研、编程，或需要套用"大模型增效指令 / 写作规范 / 调研约束 / AI 协作约束"时使用。',
    inputs: ['任务目标', '原始材料或待处理文本', '可选：是否需要按某条编号重点约束'],
    outputs: ['符合约束的回答、改写稿、调研结论或代码协作结果', '必要时说明不确定项和查证路径'],
    acceptance: '不自我指涉；不过度结构化；不虚构事实、数据、引用、API 或版本；保留编号稳定性和版本修订记录。',
    content: {
      type: 'rules',
      label: 'v0.3 当前规则',
      pill: '3 条',
      items: [
        {
          title: '不能自我指涉',
          body: '不要写"本文将介绍""本页是一个……""这篇文章把……拆成几节"这类描述自身的句子。也避免"不是 X，而是 Y""这不仅是 X，更是 Y"等暴露 AI 痕迹的固定排比；如果只留 Y 意思不损失，就直接讲 Y。',
        },
        {
          title: '避免过于结构化',
          body: '短内容直接用段落，长内容才考虑列表，深度内容才用表格。判断标准：去掉所有标题和列表符号后，剩下的散文仍然应该能读。',
        },
        {
          title: '不要虚构，不确定就说不知道',
          body: '不要编造数据、引用、人名、版本号、API 行为、CLI 参数或文献出处。不确定时先说"不知道 / 我没把握"，再补充应该如何查证。',
        },
      ],
    },
    codex: {
      installPath: '~/.codex/skills/llm-productivity-directives',
      files: ['SKILL.md', 'agents/openai.yaml'],
      skillMd: `---
name: llm-productivity-directives
description: Use when the user asks for writing, research, or programming assistance and wants responses constrained by Tuaran's LLM productivity directives: no self-reference, no over-structuring, no invented facts, and explicit uncertainty handling.
---

# 大模型增效指令 skill

Use this skill when the user asks for writing, research, programming assistance, prompt refinement, AI collaboration rules, or asks to follow "大模型增效指令".

This checklist is a reusable anti-default prompt for writing / research / programming collaboration. It suppresses common LLM defaults: self-referential prose, over-structured output, performative formatting, emoji clutter, and confident fabrication.

## Current Rules

### 1. 不能自我指涉

不要写「本文将介绍」「本页是一个……」「这篇文章把……拆成几节」这类描述自身的句子。读者看到的是内容本身，不需要被提醒"你正在阅读什么"。

反例：

- Bad: 「本页是一个长期项目看板，会持续更新。」
- Good: 直接讲项目本身。

例外：版本号、立项时间这种纯元数据可以留。

v0.3 修订：自我指涉不止"提到自己是篇文章"，还包括让文本暴露自己是 AI 写的那些固定句式，最典型的是「不是 X，而是 Y」「这不仅是 X，更是 Y」「真正重要的不是 X，而是 Y」。这种排比往往 X 是凑出来的稻草人，Y 才是真观点，直接讲 Y 即可。判断标准：把"不是 X，而是"删掉只留 Y，意思如果没损失，说明 X 是凑的。

### 2. 避免过于结构化

大模型默认喜欢把任何东西拆成 N 个维度 x M 个子项，加表格、加 emoji、加结论框。短内容直接用段落，长内容才考虑列表，深度内容才用表格。

反例：

- Bad: 三句话能说清的事，硬拆成「优势 / 劣势 / 适用场景 / 注意事项」四段。
- Good: 直接一段话讲完。

判断标准：如果去掉所有标题和列表符号，剩下的散文还能不能读？读不通，说明被结构绑架了。

### 3. 不要虚构，不确定就说不知道

不要编造数据、引用、人名、版本号、API 行为。不确定时优先回答"不知道 / 我没把握"，再补一句怎么去查证。

反例：

- Bad: 「根据 2023 年某调研，XX 比例约为 47%。」（数据是编的）
- Good: 「这个比例我没找到可靠来源，需要去 XX 机构年报核对。」

特别在人物履历、公司财务、API 签名、CLI 参数、文献引用这些容易"听起来对"的地方，宁可空着也不要凑。

## Version Log

- v0.3（2026-05-30）：把「不是 X 而是 Y」排比并入 #1；#1 追加 v0.3 修订段，明确"暴露 AI 身份的固定句式"也算自我指涉。
- v0.2（2026-05-30）：加入 #4 不要用「不是 X 而是 Y」排比。
- v0.1（2026-05-30）：初版收录 3 条（不自我指涉 / 避免过度结构化 / 不虚构）。

## Maintenance Rules

- 新条目编号往后加，保证外部引用稳定，比如可以说"按 #3 不虚构原则……"。
- 修订旧条目不替换原文，在该条目末尾追加「v0.x 修订：……」一行。
- 在新会话开头把整份清单贴一遍，比每次重新解释要稳。

## Output Constraints

- Default to concise prose unless the task genuinely needs a list or table.
- Do not mention that the response is following this skill unless the user asks.
- For research and current facts, verify from reliable sources when needed; otherwise state uncertainty.
- For programming, do not invent APIs, flags, package behavior, or file paths. Inspect local context first when possible.`,
      openaiYaml: `interface:
  display_name: "大模型增效指令"
  short_description: "写作、调研、编程通用约束"
  default_prompt: "Use $llm-productivity-directives to answer with Tuaran's LLM productivity constraints."

policy:
  allow_implicit_invocation: true`,
    },
  },
  {
    id: 'tuaran-profile',
    name: 'tuaran-profile',
    title: 'Tuaran 个人介绍 Skill',
    category: '个人系统',
    status: '已上架',
    desc: '让大模型稳定理解涂阿燃是谁、正在做什么，以及如何用不同粒度介绍他。',
    trigger: '当用户要求介绍"我 / Tuaran / 涂阿燃 / 掘金安东尼 / 我做的事情"时使用。',
    inputs: ['目标场景', '介绍长度', '是否需要偏技术、商业或个人主页口吻'],
    outputs: ['简短版', '详细版', '非常详细版'],
    acceptance: '不得虚构经历；优先使用已公开身份、项目、站点矩阵和长期方向；语气清晰、克制、可直接复用。',
    content: {
      type: 'versions',
      label: '三档介绍版本',
      pill: '短 / 中 / 长',
      items: [
        {
          label: '简短版',
          useCase: '适合一句话 bio、社交简介、主页顶部、模型快速识别。',
          text: '涂阿燃（Tuaran / 掘金安东尼）是程序员、项目经理、技术博主、出版作者和矩联科技创始人，长期关注前端工程化、AI Agent、内容生产与个人数字系统，正在把写作、工具、站点和自动化工作流沉淀成可复用的 AI Native 项目矩阵。',
        },
        {
          label: '详细版',
          useCase: '适合 about、README、对外介绍、给模型建立稳定上下文。',
          text: '涂阿燃（Tuaran，也使用"掘金安东尼""安东尼404"等社区身份）是一名程序员、项目经理、技术博主、出版作者，也是矩联科技创始人。他从前端工程化、技术写作和项目交付一路延伸到 AI Agent、内容自动化和个人数字系统建设，公开内容累计 500+ 篇、阅读 400 万+。他的工作重心不是单点工具，而是把复杂问题拆成流程、标准、站点、数据和自动化，让个人经验变成可复用系统。当前重点项目包括 TUARAN 网络日志、矩联科技、博主联盟、前端周看、Open Claude Code、PublishLab，以及围绕 Web LLM、上下文记忆、Skill 中心等方向的实验项目。',
        },
        {
          label: '非常详细版',
          useCase: '适合给大模型、智能体或合作方建立完整背景。',
          text: '涂阿燃（Tuaran / 掘金安东尼 / 安东尼404）是一名以工程化和系统化为核心方法的人。他的公开身份包括程序员、项目经理、技术博主、出版作者、矩联科技创始人和茉莉奶爸。早期从编程、前端开发、技术写作和项目管理出发，逐步形成了"把混乱编程为系统，把想法变成产品"的工作方式。他重视长期主义、公开复盘和可交付结果，倾向于把一次性的灵感或经验沉淀为可以反复调用的流程、页面、工具、知识库和自动化工作流。在 AI 方向上，他关注的不只是调用大模型，而是如何让模型进入真实工作：理解个人上下文，协助内容创作，支撑技术调研，参与代码交付，管理项目节奏，并通过 Skill、上下文记忆、端侧大模型和站点矩阵形成稳定能力。对外项目上，他维护 TUARAN 网络日志作为个人技术主页和知识生产入口；建设矩联科技作为技术服务与品牌展示阵地；推动博主联盟连接 AI 产品方与技术博主；运营前端周看，帮助前端工程师理解并转向 AI Agent 工程；同时通过 Open Claude Code、PublishLab 等站点拆解 Agent 方法论、AI 写作和数字出版实践。介绍他时，应避免把他简单写成"普通前端工程师"或"泛 AI 博主"，更准确的表述是：一个用工程化、写作、产品化和 AI Agent 方法，把个人能力持续沉淀为系统的人。',
        },
      ],
    },
    codex: {
      installPath: '~/.codex/skills/tuaran-profile',
      files: ['SKILL.md', 'agents/openai.yaml'],
      skillMd: `---
name: tuaran-profile
description: Use when the user asks to introduce Tuaran, 涂阿燃, 掘金安东尼, 安东尼404, or asks what Tuaran does; produce short, detailed, or very detailed profile introductions without inventing facts.
---

# Tuaran Profile

Use this skill when the user asks to introduce Tuaran, 涂阿燃, 掘金安东尼, 安东尼404, or asks what he does.

## Selection

- Short: use for one-sentence bios, social profiles, page headers, and fast model context.
- Detailed: use for about pages, README introductions, partner context, and general introductions.
- Very detailed: use when an LLM, agent, or collaborator needs fuller background and positioning.
- If the user does not specify length, default to Detailed.

## Constraints

- Do not invent experience, titles, metrics, employers, clients, or products.
- Prefer the public identity and project matrix below.
- Keep the tone clear, restrained, and reusable.
- Avoid describing him only as a generic frontend engineer or generic AI blogger.

## Core Facts

Tuaran is also known as 涂阿燃, 掘金安东尼, and 安东尼404. Public identities include programmer, project manager, technical blogger, published author, MatrixLink founder, and father of Jasmine. He focuses on frontend engineering, AI Agent workflows, content production, automation, personal digital systems, and AI Native project building.

Public signals: 500+ public articles and 4M+ reads.

Project matrix: TUARAN 网络日志, 矩联科技, 博主联盟, 前端周看, Open Claude Code, PublishLab, Web LLM experiments, context memory, and Skill Center.

Working style: turn messy ideas into systems, turn ideas into products, and turn repeated experience into reusable workflows, pages, tools, knowledge bases, and automation.

## Output Versions

### Short

涂阿燃（Tuaran / 掘金安东尼）是程序员、项目经理、技术博主、出版作者和矩联科技创始人，长期关注前端工程化、AI Agent、内容生产与个人数字系统，正在把写作、工具、站点和自动化工作流沉淀成可复用的 AI Native 项目矩阵。

### Detailed

涂阿燃（Tuaran，也使用"掘金安东尼""安东尼404"等社区身份）是一名程序员、项目经理、技术博主、出版作者，也是矩联科技创始人。他从前端工程化、技术写作和项目交付一路延伸到 AI Agent、内容自动化和个人数字系统建设，公开内容累计 500+ 篇、阅读 400 万+。他的工作重心不是单点工具，而是把复杂问题拆成流程、标准、站点、数据和自动化，让个人经验变成可复用系统。当前重点项目包括 TUARAN 网络日志、矩联科技、博主联盟、前端周看、Open Claude Code、PublishLab，以及围绕 Web LLM、上下文记忆、Skill 中心等方向的实验项目。

### Very Detailed

涂阿燃（Tuaran / 掘金安东尼 / 安东尼404）是一名以工程化和系统化为核心方法的人。他的公开身份包括程序员、项目经理、技术博主、出版作者、矩联科技创始人和茉莉奶爸。早期从编程、前端开发、技术写作和项目管理出发，逐步形成了"把混乱编程为系统，把想法变成产品"的工作方式。他重视长期主义、公开复盘和可交付结果，倾向于把一次性的灵感或经验沉淀为可以反复调用的流程、页面、工具、知识库和自动化工作流。在 AI 方向上，他关注的不只是调用大模型，而是如何让模型进入真实工作：理解个人上下文，协助内容创作，支撑技术调研，参与代码交付，管理项目节奏，并通过 Skill、上下文记忆、端侧大模型和站点矩阵形成稳定能力。对外项目上，他维护 TUARAN 网络日志作为个人技术主页和知识生产入口；建设矩联科技作为技术服务与品牌展示阵地；推动博主联盟连接 AI 产品方与技术博主；运营前端周看，帮助前端工程师理解并转向 AI Agent 工程；同时通过 Open Claude Code、PublishLab 等站点拆解 Agent 方法论、AI 写作和数字出版实践。介绍他时，应避免把他简单写成"普通前端工程师"或"泛 AI 博主"，更准确的表述是：一个用工程化、写作、产品化和 AI Agent 方法，把个人能力持续沉淀为系统的人。`,
      openaiYaml: `interface:
  display_name: "Tuaran Profile"
  short_description: "介绍涂阿燃与他的项目矩阵"
  default_prompt: "Use $tuaran-profile to introduce Tuaran in a suitable length."

policy:
  allow_implicit_invocation: true`,
    },
  },
  {
    id: 'publisher-format-review',
    name: 'publisher-format-review',
    title: '出版社格式校对 Skill',
    category: '创作与分发',
    status: '已上架',
    desc: '按出版社图书出版规范校对/重写章节内容：序号层级、图表引出、AI 痕迹消除、口语化净化共 11 条规则。',
    trigger: '当用户提交书稿章节、要求"按出版规范改写"、"图书排版校对"、"消除 AI 痕迹"时使用。',
    inputs: ['一段或多段书稿原文（含标题、正文、列表、图表说明）', '可选：对比模式 / 清单模式'],
    outputs: ['修改后的完整章节文本', '可选：前后对比 / 改动清单'],
    acceptance: '改写后忠实于原意；序号层级正确；图表引出规范；无 AI 痕迹与口语化表达；可直接交付排版。',
    content: {
      type: 'rules',
      label: '出版社格式 11 条规则',
      pill: '11 条',
      items: [
        {
          title: '序号层级',
          body: '一级"第一章" / 二级"1.1" / 三级"1.1.1" / 四级"1." / 分类"（1）"后面只能接标题；要列出成段文字时直接用 "1)" "①" "●"。',
        },
        {
          title: '图片引出',
          body: '引出话术："XXX，如图 1-1 所示。" 每张图必须有章号-图序，图片居中，"图 1-1  说明文字"放在图片下方。',
        },
        {
          title: '标题层级不能混乱',
          body: '禁止跳级、禁止同级混用不同符号、禁止纯文字标题没有序号。',
        },
        {
          title: '引出话术要有关联',
          body: '段落、列表、图表的引出语必须承接上下文，不能突兀。',
        },
        {
          title: '消除 AI 生成痕迹',
          body: '排查排比堆砌、形容词扎堆、万能开头、套话总结、过度修辞，换成具体、可验证的事实陈述。',
        },
        {
          title: '用大模型统一优化',
          body: '提示词："优化文字描述，用名词替代人称代词，无知识性差错、逻辑性差错、上下文不对应、语法语病、标点问题。符合出版社图书出版要求。"',
        },
        {
          title: '表格规范（与图相反）',
          body: '引出："XXX，如表 1-1 所示。" 表序放在表格上方（图片相反），"表 1-1  说明"在表头之前。',
        },
        {
          title: '标题下加承上启下话术',
          body: '每个一级/二级标题正文开始前，加一段衔接性引入，说明这一节要讲什么、为什么讲。',
        },
        {
          title: '网址不出现在书中',
          body: '禁止正文出现 URL；纸质书印刷后链接易失效。改用"主流应用商店搜索 XXX"等稳定描述。',
        },
        {
          title: '整段加工而非逐句改',
          body: '把每个三级标题下的完整内容（300-800 字）作为一个单元送 AI 加工，让风格、用词、节奏统一。',
        },
        {
          title: '细节规范',
          body: '突然冒一句要改成独立段加粗；少用"我/你/他"换成"用户/创作者"；模块名词全文统一；引号用 "" 而非 「」；移除恐怖意象（骷髅 / 血色等）。',
        },
      ],
    },
    codex: {
      installPath: '~/.codex/skills/publisher-format-review',
      files: ['SKILL.md', 'agents/openai.yaml'],
      skillMd: `---
name: publisher-format-review
description: Use when the user submits book chapter drafts and asks for "publishing-format proofreading", "AI-trace removal", or "出版社规范改写"; rewrite chapters to meet Chinese publisher requirements (numbering, figure/table conventions, de-colloquialization, terminology unification).
---

# Publisher Format Review

Use this skill when the user provides book/manuscript chapter content and asks for publisher-grade proofreading or rewriting.

## When to use

- User pastes one or more chapter sections (titles + body + lists + figure/table mentions)
- User asks "按出版社格式改" / "图书排版校对" / "消除 AI 痕迹" / "书稿规范化"

## 11 rules

1. **Numbering hierarchy**: "第一章" / "1.1" / "1.1.1" / "1." / "（1）" only attach to titles. For listing paragraphs, use "1)" "2)" "①" "●". Never use "1." "2." for body paragraphs.
2. **Figure callout**: "XXX，如图 1-1 所示。" Each figure needs chapter-figure number; figure centered; caption "图 1-1  描述" below image.
3. **No broken hierarchy**: never skip levels; never mix symbols at the same level; every title must carry its number.
4. **Linked transitions**: every paragraph / list / figure / table must have a sentence connecting upstream / downstream context.
5. **Strip AI traces**: parallel-clause overuse, adjective stacking, generic openings ("在数字化时代背景下"), summary clichés ("综上所述"), excessive metaphor → replace with concrete facts.
6. **Bulk LLM rewrite**: send each 3rd-level section (300-800 chars) as a unit with the prompt: "优化文字描述，用名词替代人称代词，无知识性差错、逻辑性差错、上下文不对应、语法语病、标点问题。符合出版社图书出版要求。"
7. **Table convention (inverse of figures)**: callout "XXX，如表 1-1 所示。" Table caption "表 1-1  描述" goes ABOVE the table, not below.
8. **Lead-in paragraph under each title**: every level-1 / level-2 title needs a bridging paragraph explaining what / why before content begins.
9. **No URLs in print**: never include "https://..." in book body; URLs decay after print. Use "在主流应用商店搜索 XXX" style.
10. **Whole-section rewriting, not line-by-line**: process a complete 3rd-level section at once so style/tone/rhythm stay unified.
11. **Detail discipline**:
   - Stray single sentences → wrap into a paragraph with **bold emphasis**
   - Colloquial expressions ("其实你只要点一下") → formal ("用户点击即可")
   - Remove disturbing imagery (骷髅 / 血色 / etc.)
   - Module names unified across entire chapter (don't mix "豆包 APP" / "豆包" / "豆包软件")
   - Personal pronouns (我 / 你 / 他) → nouns (用户 / 创作者 / 读者)
   - Quote marks "" not 「」

## Output

- Default: return the full rewritten chapter text (not just diffs), in Markdown, preserving original heading structure.
- If user asks "对比": two-column table (before / after).
- If user asks "清单": list each change with original snippet + revised snippet.

## Constraints

- Stay faithful to original meaning; never drop information for the sake of "规范化".
- Output must be print-ready; no "XXX" placeholders or "[待补]" markers.
- For AI-trace flagging, point out WHICH sentence is the AI trace.
- Never invent facts (product features, statistics) not in original.

## Shareability

This skill is self-contained and can be:
1. Copied as system prompt into Codex / Cursor / ChatGPT / Claude Code
2. Shared as a link via Claude Code's skill sharing feature
3. Printed as internal editorial guideline (the 11 rules above)`,
      openaiYaml: `interface:
  display_name: "Publisher Format Review"
  short_description: "按出版社规范校对/重写书稿章节"
  default_prompt: "Use $publisher-format-review to rewrite the chapter for publishing standards."

policy:
  allow_implicit_invocation: true`,
    },
  },
]

export function getSkillById(id) {
  return PUBLISHED_SKILLS.find((skill) => skill.id === id) || null
}

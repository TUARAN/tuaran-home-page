/**
 * Skill 中心数据源 —— 主页 /skill-center 和详情页 /skill-center/[skillId] 共享
 */
export const PUBLISHED_SKILLS = [
  {
    id: 'ruanyifeng-weekly-style',
    name: 'ruanyifeng-weekly-style',
    title: '阮一峰周刊风格 Skill',
    category: '创作与分发',
    status: '已上架',
    desc: '把科技素材整理成接近《科技爱好者周刊》的中文写作风格：短句短段、编号观察、事实解释、克制判断和链接精选。',
    trigger: '当用户要求总结/仿写/改写阮一峰公众号、科技爱好者周刊、中文技术周刊、链接精选或解释性科技短文时使用。',
    inputs: ['主题或原始素材', '可选：完整周刊 / 单篇主文 / 链接精选', '可选：是否需要活动、工具、资源、文摘、言论等栏目'],
    outputs: ['阮一峰周刊风格的中文稿件', '可选：主文编号分节', '可选：文章、工具、AI 相关、资源、图片、文摘、言论等栏目'],
    acceptance: '短句短段；事实先行，判断克制；编号标题清楚；技术概念解释到位；不冒充阮一峰本人，不复制原文句子。',
    content: {
      type: 'rules',
      label: '写作风格规则',
      pill: '8 组',
      items: [
        {
          title: '核心语气',
          body: '现代书面中文，接近口头解释但不聊天化。语气冷静、直接、可读，少用口号、修辞和情绪化形容词。',
        },
        {
          title: '句子节奏',
          body: '短句、短段，一个句子通常只承载一个判断。段落一般 1-3 句，让读者可以快速扫读。',
        },
        {
          title: '主文结构',
          body: '从一个具体事件、报告、产品、访问或公共讨论切入，再拆成 5-12 个编号观察。每个观察用短标题，例如“1、算力的差距”。',
        },
        {
          title: '解释方式',
          body: '先讲事实，再讲原因，最后讲影响。常用“原因是”“但是”“结果就是”“这使得”“还有另一个因素”等连接。',
        },
        {
          title: '判断方式',
          body: '观点要克制、具体、可检验。可以写“我认为”“我的判断是”，但不要喧宾夺主，也不要写成激烈评论。',
        },
        {
          title: '精选条目',
          body: '推荐文章、工具、资源时，先一句话说明“这是什么”，再一两句话说明“为什么有用 / 有趣 / 值得注意”。',
        },
        {
          title: '完整周刊栏目',
          body: '需要完整周刊时，可按主题文章、活动、文章、工具、AI 相关、资源、图片、文摘、言论、往年回顾组织。',
        },
        {
          title: '边界',
          body: '这是风格参考，不是身份模仿。不得声称作者是阮一峰，不要复制原文句子，输出应是原创内容。',
        },
      ],
    },
    codex: {
      installPath: '~/.codex/skills/ruanyifeng-weekly-style',
      files: ['SKILL.md', 'agents/openai.yaml'],
      skillMd: `---
name: ruanyifeng-weekly-style
description: "Use this skill when writing, rewriting, editing, or evaluating Chinese technology newsletter prose in the style of Ruan Yifeng's 科技爱好者周刊: clear explanatory Mandarin, short paragraphs, numbered observations, curated links, restrained opinion, practical technology context, and weekly-column structure."
---

# Ruan Yifeng Weekly Style

## Purpose

Use this skill to draft or revise Chinese technology newsletter content with the recognizable feel of 阮一峰《科技爱好者周刊》: calm, direct, explanatory, curated, and practical.

Do not imitate personal identity, claim authorship by 阮一峰, or copy source sentences. Treat this as a style guide for original writing.

## Core Voice

- Write in modern written Chinese, close to spoken explanation but not colloquial chat.
- Prefer short declarative sentences. One sentence usually carries one idea.
- Keep the tone calm, factual, and lightly opinionated. Avoid hype, slogans, dense rhetoric, and emotional adjectives.
- Explain technical topics as if the reader is a curious programmer, not a specialist in that exact field.
- Use concrete facts, examples, dates, product names, company names, numbers, and simple comparisons.
- Make judgments in plain language: “这说明……”“原因是……”“结果就是……”“更好的做法是……”
- Keep the authorial presence modest. “我认为”“我发现”“我的看法是” can appear, but do not dominate.

## Structure Patterns

For a full weekly-style article, use this order when appropriate:

1. Opening line: “这里记录每周值得分享的科技内容，周五发布。”
2. Brief housekeeping: open source, submissions, hiring, contact, or sponsorship if relevant.
3. Cover image note: one short factual caption.
4. Main topic essay: a clear title, then 5-12 numbered sections.
5. Sponsored activity or announcement: practical, concrete, restrained.
6. Curated sections: “文章”“工具”“AI 相关”“资源”“图片”“文摘”“言论”“往年回顾”.
7. Closing marker: “（完）” when a complete issue is requested.

For a single essay, use:

1. Short title.
2. A setup paragraph that names the event, question, or observed phenomenon.
3. Numbered points, each with a compact subheading.
4. A final practical conclusion, not a grand ending.

## Main Essay Technique

- Start from a concrete event, report, visit, product, paper, or public discussion.
- State why it matters in simple terms before giving analysis.
- Break the topic into numbered observations.
- Give each numbered observation a short noun phrase title, such as “1、算力的差距” or “3、计算效率”.
- Within each point, use 2-5 short paragraphs.
- Move from facts to explanation to implication.
- Prefer causal connectors: “原因是”“但是”“结果就是”“这使得”“还有另一个因素”.
- Use contrast often: China vs. US, old vs. new, theory vs. reality, SaaS vs. cloud, training vs. inference.
- When summarizing outside sources, say that you selected and organized the material for readability.

## Curated Item Technique

For link recommendations, use a compact numbered format:

1、项目名或文章名

一句话说明它是什么。

再用一两句话解释它有什么用，或者为什么值得看。

Rules:

- The item title should be concrete, usually a tool, article, dataset, repository, or resource name.
- The first sentence answers “这是什么”.
- The second sentence answers “为什么有用 / 有趣 / 值得注意”.
- Mention language or platform only when useful: “英文”“Mac 系统”“命令行工具”“开源”.
- For reader submissions, append attribution only if supplied: “（@name 投稿）”.

## Sentence And Paragraph Habits

- Keep paragraphs short: usually 1-3 sentences.
- Use many standalone explanatory sentences.
- Use simple punctuation. Chinese comma and full stop are enough most of the time.
- Prefer Arabic numerals for data and numbered lists.
- Put parenthetical clarification after the term: “AGI（通用人工智能）”.
- Use “比如”“参见”“可以参考”“另可参考” for examples and related links.
- Avoid long metaphors, ornate transitions, and literary openings.
- Avoid marketing words unless the source is an ad section; even there, keep it practical.

## Opinion Style

- Make opinions concrete and testable.
- Avoid absolute claims unless the evidence is strong.
- Prefer phrases like:
  - “这种看法只适用于……”
  - “目前看来，趋势更像是……”
  - “这既是一种选择，也是一种无奈。”
  - “我的判断是……”
  - “这跟……形成鲜明对比。”
- End with a useful takeaway, not a flourish.

## Editing Checklist

Before finalizing:

- Is the topic explained from first principles enough for a general tech reader?
- Are paragraphs short and skimmable?
- Are claims backed by concrete details or framed as opinion?
- Is the structure visible through numbered sections and plain subheadings?
- Did you remove hype, dense jargon, and decorative prose?
- If imitating the weekly format, are curated sections concise and useful?
- Does the final text feel like an original article in this style, not a copied article?`,
      openaiYaml: `interface:
  display_name: "Ruan Yifeng Weekly Style"
  short_description: "Drafts in Ruan Yifeng weekly style"
  default_prompt: "Use $ruanyifeng-weekly-style to turn these notes into a Ruan Yifeng-style Chinese weekly column."

policy:
  allow_implicit_invocation: true`,
    },
  },
  {
    id: 'llm-productivity-directives',
    name: 'llm-productivity-directives',
    title: '大模型增效指令 Skill',
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

# 大模型增效指令 Skill

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
  {
    id: 'rich-data-research-page',
    name: 'rich-data-research-page',
    title: '富数据调研页 Skill',
    category: '研究与分析',
    status: '已上架',
    desc: '把多维度公开数据（10 余条实体 × N 维指标）做成一个可比较、可筛选、可分享、可对比的富页面调研，而不是一篇 Markdown。沉淀自 /cancers-overview 与 /ai-token-usage-research 的实际打法。',
    trigger: '当用户要求做一个"富页面 / 数据可视化 / 专题调研"，需要把多条同类实体（癌症 / 国家 / 行业 / 产品 / 公司）按多维指标对比、筛选和分享时使用。',
    inputs: [
      '一份实体清单（5–20 条，同一物种，如「10 种癌症」「10 国教育投入」「8 家云厂商」）',
      '每条实体的多维指标（至少 3 维：一个主量级 / 一个次量级 / 一个比率类指标）',
      '可选：可切换的数据口径（如全球 / 中国 / 不同年份）',
      '可选：每条实体的权重明细（如风险因子、收入构成）',
    ],
    outputs: [
      '一个独立 Next.js 路由（/<topic>-overview）',
      '一个数据 module（data.js / data.ts），实体数组 + 元数据常量 + region/version 切换 helper',
      '一个客户端富页面组件，包含：散点图 + 排行条 + 详情面板 + 对比表，所有筛选 URL 化',
      '强免责声明 + 一手数据来源链接（顶部 + 底部）',
    ],
    acceptance: '所有实体一屏可见可比较；散点图清晰分出 4 象限并自带 tooltip；排行条按任意维度排序；至少 ≥3 项可两两对比；筛选状态可通过 URL 完整分享；数据口径标注清楚、不虚构。',
    content: {
      type: 'rules',
      label: '16 条富数据页 pattern',
      pill: 'v0.3',
      items: [
        {
          title: '实体 schema：把每条实体压成一个对象，至少含 4 类字段',
          body: '元信息（id / nameZh / nameEn / color / category）+ 主量级指标（如发病率、营收）+ 次量级指标（如死亡率、利润）+ 比率类指标（如生存率、利润率）+ 多维分布数组（如年龄分布 10 档）+ 加权明细数组（如风险因子带 weight + category）+ 叙述字段（主因、预警、筛查建议）。一条实体一对象，所有视图共用同一份数据。',
        },
        {
          title: '口径切换：每条实体可挂多 region/version 子块',
          body: '在实体上加 cn: {} 或 v2024: {} 等子对象，存储该口径下需要替换的字段（通常是主/次量级和比率类，明细字段共用）。顶部一个 toggle + 一个 cancerView(c, region) helper 把视图层和数据层解耦。换 region 不动主结构。',
        },
        {
          title: '四象限散点图：一张图把所有实体定位完',
          body: 'X = 主量级（对数刻度 log10，跨数量级时必备）× Y = 比率类指标（0–100% 线性）。气泡半径 = 次量级。气泡颜色 = 类别 / 性别 / 阵营。背景画两条隐线分四象限，每个象限角落写一行小字（如「常见·难治」），让对比一秒成立。pure SVG + viewBox + preserveAspectRatio="xMidYMid meet"，不引图表库。',
        },
        {
          title: '气泡 tooltip：HTML overlay 用百分比定位匹配 SVG viewBox',
          body: '不要用 SVG <title> 或 foreignObject。chart container 用 relative，tooltip 用 absolute + left/top 百分比（来自 cx/W、cy/H）。这样 SVG 缩放时 tooltip 自动跟随。右半区翻到左侧弹出（leftPct > 65 时 flip）避免出屏。',
        },
        {
          title: '焦点模式：选中后其它实体自动灰化',
          body: '维护一个 focusIds 数组（单选模式 = [openId]，对比模式 = compareIds）。散点的非 focus 气泡 opacity → 0.18，排行条的非 focus 行 opacity → 0.45。视觉焦点立即出现，不需要额外组件。hover 状态优先级高于 dim。',
        },
        {
          title: '横向排行条：所有实体一屏，按选中维度叠色',
          body: '每行：序号 + 色块 + 名字 + 性别/类别 chip + 主条（按当前 sort 维度宽度）+ 主数值 + 次维度 chip。按 incidence 排序时，把 mortality 作为同一条上的深色叠加层（width = mortality/incidence × pct），一条条同时读出"多少人得 + 多少人死"。比卡片密度高一个数量级。',
        },
        {
          title: '对比模式：≤3 项 side-by-side 表格',
          body: '顶部一个「单选 / 对比」mode toggle。对比模式下点击 = 加入 compareIds（上限 3）。详情区换成横向表格：行 = 指标（年新发 / 年死亡 / 5y 生存 / 致死 / 性别 / 主因 / 筛查 / Top 4 风险因子）× 列 = 实体。每列带 × 按钮可移除。tone 着色（绿 / 红）让差异一眼看出。',
        },
        {
          title: '筛选条：搜索 + 类别 pills + 排序 pills',
          body: '搜索框（同时匹配中英名 + 主因）+ 类别多选 pills（点击切换 activeCategories 数组）+ 排序 pills（4 个，按主/次/比率/反向比率）+ 性别/阵营三档 pills。所有筛选用 useMemo 链式串起来，重置按钮一键归零。不用 <select>，全部用 pill button 视觉一致。',
        },
        {
          title: 'URL 状态：所有筛选可分享',
          body: 'mount 时 URL → state（一次性 reading），所有 state 变化时 state → URL（用 history.replaceState 不污染历史）。URL 参数：region / q / gender / sort / cats（逗号分隔）/ mode / compare（逗号分隔）/ open。分享一个具体对比直接复制地址栏即可。',
        },
        {
          title: '免责与数据口径：顶部 + 底部双重保险',
          body: '顶部 header 里一句话点出来源（带 inline 链接）+ 一句 strong 红字免责（如「不构成医学建议」）。底部 footer 用 disc 列表展开完整口径说明：每个数据字段的来源、年份、计算方式、与其它口径的差异、风险因子权重的局限（如不是 PAF）。一手链接（IARC / SEER / NCC）必须可点。涉及健康/金钱/政策的页面强制要有。',
        },
        {
          title: '复合实体：每条是 X × Y 配对而不是单一物种',
          body: '当实体是「平台 × 框架」「公司 × 产品」「国家 × 行业」这种二元配对时，schema 用 sideA / sideB 两个字段（如 platform / framework）而不是塞进一个 name。卡片头：色块 + sideA × sideB；散点上文字标 sideA × sideB 中间用 × 隔开。排序、筛选、搜索三处都要让两侧都能被命中。',
        },
        {
          title: '主观打分：必须暴露评分 rubric',
          body: '指标里有 lock_in / backlash / 整合度 / 影响力这种 0-100 主观分时，强制三件事：(1) 字段名旁边 chip 标「主观打分」与「实测」区分；(2) 顶部或 footer 写明评分 rubric（如「0=完全可移植；100=离不开该平台」）；(3) 数值取整到 5 或 10，不要 73.4% 这种假精确。compare table 里同样标。',
        },
        {
          title: 'Status 作为一级筛选 + 默认配色维度',
          body: '当实体处在不同生命周期阶段（active / historical / forming / neutral / deprecated）时，status 用三件事承载：(1) 顶部一级筛选 chip（和性别同等地位）；(2) 散点气泡的默认颜色编码（而不是次要 category）；(3) compare table 里有专门一行用 tone-colored 单元格高亮。color = category 和 color = status 二选一，不要叠。',
        },
        {
          title: '逐实体核实徽章：不确定的事实不要藏在 footer',
          body: '当某些实体的关键数据来自传闻 / 内部消息 / 估算（而非官方公布）时，schema 加 verified: boolean。verified=false 的实体卡片右上角显示「估算」「待核实」「rumor」徽章，detail panel 顶部也显示，compare table 的实体列头同样标。不要让读者读完整页才在 footer 发现「这些都是估算」—— 在每个数字旁边就要看到。',
        },
        {
          title: '最近信号 line：时间敏感话题的必备字段',
          body: '每条实体加一个 latest_signal 字段：一句话带年份的最新动向（如「2025-Q2 Fluid Compute 公布」「2024-09 VoidZero 成立」）。detail panel 在 title 下方显示；compare table 单独一行；事件类、行业演变类、新闻驱动类页面强制要有。让读者知道这页数据"截至什么时候"，单点比统一在 footer 写 update date 强。',
        },
        {
          title: '新事实重塑叙事支点时：从核心 thesis 往下重做，不要只加一条数据',
          body: '当新事件 / 新事实改变研报的核心叙事结构（不是细节修正，是判断框架被推翻），不能只在数据里 append 一条。判断标准：如果新事实让"先发者是谁 / 谁在防御谁 / 这是什么类型的博弈"任意一条命题反转，就是支点级。处理：① title + thesis + eventBadge 必须重写；② 时间线节点重排（不只是 append）；③ 关键章节（动机 / 影响 / AI 分析）需要重新论证因果链；④ 数据加一条同时要看是不是引入了新 entity type，如果是就加 pairType / category 字段并相应着色；⑤ 所有入口文案、SHARE_COPY、OG image 一次性同步。沉淀自 /platform-framework-pairs 从「双巨头」改写成「三极割据」的教训：漏报 Anthropic × Bun 这件事不是 +1，是把整个 thesis 推翻了。',
          accent: 'warning',
        },
      ],
    },
    codex: {
      installPath: '~/.codex/skills/rich-data-research-page',
      files: ['SKILL.md', 'agents/openai.yaml'],
      skillMd: `---
name: rich-data-research-page
description: Use when the user asks to build a rich data research page or topic dashboard — a single interactive page that compares 5–20 same-kind entities (cancers, countries, companies, products) across multiple metrics with scatter chart, ranking bars, filter, focus, compare, and shareable URL state. Distilled from /cancers-overview and /ai-token-usage-research on 2aran.com.
---

# Rich Data Research Page Skill

Use this skill when the user wants a topic-research deliverable that is **not a Markdown article** but a **single interactive page** showing multi-dimensional data for a set of comparable entities.

Wrong fit: a 5000-word write-up. Right fit: 10 cancers × 6 metrics, 8 cloud providers × pricing tiers, 12 countries × education spending, 15 LLMs × benchmark scores.

## When to use

Trigger when the user says any of:

- "做一个富页面 / 数据可视化 / 专题调研"
- "把这些 X 做成一个能筛选 / 对比 / 分享的页面"
- "我希望可视化做的美观，有各种数据支撑，关键成因分析…，最好还能筛选，可以分享"

Skip if: the user wants a single timeline, a long-form essay, a chat tool, or a personal log.

## Inputs you must collect

1. The entity list — 5 to 20 of the same kind (cancers, countries, companies, products, AI models, etc.).
2. At least three metrics per entity:
   - **Primary magnitude** (e.g., annual incidence, revenue, GDP) — used for X axis and main bar
   - **Secondary magnitude** (e.g., mortality, cost) — used for bubble radius and overlay bar
   - **Rate / share** (e.g., 5-year survival %, margin %) — used for Y axis and tone coloring
3. Optional but high-value:
   - Multi-region / multi-version variants (e.g., global vs China, 2022 vs 2023)
   - Multi-bucket distribution (e.g., 10 age buckets, 6 revenue source breakdowns)
   - Weighted breakdown items with category tags (e.g., risk factors with category: lifestyle/genetic/virus/…)
   - Narrative fields (warnings, screening guidance, primary cause)
4. Disclaimers and authoritative sources — at minimum 2 first-party data citations.

If the user provides incomplete data, ask precisely which metric is missing rather than guessing.

## File layout (Next.js App Router)

\`\`\`
app/(site)/<topic>-overview/
  page.jsx                  # static metadata + dynamic = 'force-static'
  data.js                   # entities array + helpers + sources
  <Topic>OverviewClient.jsx # 'use client' rich page
\`\`\`

Wire it into siteNav under "实验室" with a New tag.

## The 10 patterns

### 1. Entity schema

Every entity is one object with these field groups:

\`\`\`js
{
  id, nameZh, nameEn, color, category,            // meta
  incidence, mortality, survival5y,                // primary / secondary / rate
  genderRatio: { male, female },                   // share split
  ageDistribution: [10 numbers summing ≈ 100],     // multi-bucket
  riskFactors: [{ name, weight, category }],       // weighted breakdown
  warnings: [...], screening: '...',               // narrative
  cn: { incidence, mortality, survival5y },        // optional region variant
}
\`\`\`

One entity = one object. All views share the same data.

### 2. Region / version toggle

Put variant blocks (\`cn\`, \`v2024\`, …) on each entity. Add a top-level toggle and a view helper:

\`\`\`js
export function cancerView(c, region = 'global') {
  if (region === 'cn' && c.cn) return { ...c, ...c.cn }
  return c
}
\`\`\`

Switching region must not touch chart structure — only the swapped fields change.

### 3. Quadrant scatter (the money shot)

Pure SVG, no chart library. X = log10(primary), Y = rate (0–100% inverted), r = secondary scaled to 6–24px, fill = category color, stroke darker on focus.

Background: two faint rectangles split by the median Y, with corner labels like "常见·难治" / "常见·可控" / "少见·难治" / "少见·可控". This makes the four quadrants legible at a glance.

\`\`\`jsx
const xPos = (v) => padL + ((Math.log10(v) - xMin) / (xMax - xMin)) * innerW
const yPos = (v) => padT + (1 - v / 100) * innerH
\`\`\`

Use \`viewBox\` + \`preserveAspectRatio="xMidYMid meet"\` — never set width/height in px. Adjust xMin/xMax when region changes so all bubbles spread out.

### 4. Tooltip overlay

Don't use SVG \`<title>\` or \`<foreignObject>\`. Wrap the SVG in a \`relative\` container, render an absolutely-positioned HTML div whose \`left\` / \`top\` are computed from bubble coords as **percentages of the chart viewBox**. This survives SVG scaling.

Flip right-side tooltips to the left when \`leftPct > 65\` so they don't overflow.

### 5. Focus dimming

Maintain one \`focusIds\` array (= [openId] in single mode, = compareIds in compare mode). Non-focused bubbles → \`opacity 0.18\`. Non-focused ranking rows → \`opacity 0.45\`. Hover state always wins.

This removes the need for a separate "highlight" mechanism — the eye is led automatically.

### 6. Horizontal ranking bars

Below the scatter. All entities, one row each, in selected sort order.

Per row: index + color square + name + gender/category chip + main bar + optional darker overlay (secondary metric) + main number + 2 mini chips (rate + reverse rate).

When sort = incidence, overlay mortality on the same row at \`width = mortality/incidence × pct\`. The viewer reads both magnitudes simultaneously.

### 7. Compare mode

Top-level toggle: 单选详情 / 两两对比. In compare mode, clicking a row/bubble toggles inclusion in \`compareIds\` (cap 3).

Replace the single detail panel with a horizontal table:
- columns = entities
- rows = metric labels (年新发 / 年死亡 / 5y / 致死 / 性别 / 主因 / 筛查 / Top 4 风险因子)
- per cell tone color (good / bad) by threshold
- each column header has × to remove

This is the most-requested feature on data dashboards. Don't ship the page without it.

### 8. Filter strip

- Search input — match nameZh + nameEn + primary cause
- Category pills (multi-select, click to toggle)
- Sort pills (4 options: primary / secondary / rate / inverse rate)
- Gender / camp toggle (3 options: all / A-dominant / B-dominant)
- Reset button only appears when any filter is active

All pills, no \`<select>\` — consistent rhythm.

### 9. URL state

On mount: read URL → setState (one-shot). On state change: state → URL via \`history.replaceState\` (so back button isn't polluted).

Parameters: \`region\`, \`q\`, \`gender\`, \`sort\`, \`cats\` (comma), \`mode\`, \`compare\` (comma), \`open\`. Default values are omitted from URL to keep it short.

### 10. Disclaimers + sources, top and bottom

**Top**: one sentence in the header naming the data sources with inline links + one short strong-red disclaimer ("不构成医学建议" / "不构成投资建议" / "数据为公开估算").

**Bottom**: a disc list expanding every source, year, scope, methodology caveat, and the limits of each metric (e.g., risk factor weights are illustrative, not PAF). First-party links must be clickable.

For health / money / policy topics, this is non-negotiable.

## Reuse checklist for a new topic

When building \`/<topic>-overview\` for a new dataset:

1. Pick a topic with 5–20 same-kind entities and 3+ comparable metrics.
2. Source the data — at least 2 first-party links (org statistics, regulator reports, peer-reviewed papers, official company filings).
3. Build \`data.js\` with the entity schema above. Add a region/version variant if the data has multiple credible cuts.
4. Copy the structure of \`/cancers-overview/CancersOverviewClient.jsx\` and rename:
   - Replace metric field names in the accessor functions (incidence → revenue, survival5y → margin, …).
   - Adjust scatter X axis log range to fit the data spread.
   - Update tone thresholds (good / bad) per metric.
   - Rewrite the four-quadrant corner labels for the new domain.
   - Rewrite filter copy and source links.
5. Update siteNav with the new route under "实验室", \`tag: 'New'\`.
6. Verify URL state round-trips for every filter combination.
7. Verify mobile: SVG should scale; ranking bars should remain readable; compare table should horizontally scroll.

## Output constraints

- Never invent statistics. If a number is uncertain, use the most reputable source available and cite it inline.
- Never imply medical / financial / legal advice. Frame everything as data visualization of public sources.
- Do not introduce a chart library (recharts, nivo, chart.js). The cost in bundle size and styling rigidity is not worth it — pure SVG covers every pattern here.
- Do not split into multiple routes per entity. The strength is one-page comparison.
- Do not skip the compare mode or the share URL — they are the two highest-ROI features.

### 11. Compound entities — X × Y pairs, not single objects

When each row is a pairing — platform × framework, company × product, country × sector — split into \`sideA\` / \`sideB\` fields instead of a single \`name\`. Card header shows both with a × separator. Search must hit both sides. Sort options may target either side.

### 12. Subjective scoring — expose the rubric

When metrics include 0–100 subjective scores (lock-in, backlash, integration quality), three rules:

1. Label the field with a "subjective" chip distinct from measured metrics.
2. State the rubric somewhere visible: "0 = fully portable; 100 = cannot leave platform".
3. Round to nearest 5 or 10 — never show 73.4%. Fake precision is worse than honest estimate.

### 13. Status as first-class filter + default color

When entities sit in different lifecycle states (active / historical / forming / neutral / deprecated), status takes over:

- Top-level filter chip, on par with the gender / camp toggle.
- Default color encoding for bubbles in the scatter (instead of category).
- Its own row in the compare table with tone-colored cells.

Don't stack \`color = category\` and \`color = status\` — pick one.

### 14. Per-entity verification badge

When some entity facts come from rumors, leaks, or estimates (vs. confirmed sources), add \`verified: boolean\`. For \`verified=false\`:

- Show a "estimate" / "unverified" / "rumor" badge top-right of the card.
- Show the same badge at the top of the detail panel.
- Surface in the compare table column header.

Don't bury this in the footer. The reader needs to know which numbers are solid before they read the numbers.

### 15. Latest-signal line

Every entity carries a \`latest_signal\`: one sentence with a year/quarter naming the most recent state change ("2025-Q2 Fluid Compute announced", "2024-09 VoidZero founded").

- Detail panel: under the title.
- Compare table: dedicated row.
- Required for event-driven or rapidly evolving topics.

A single global "last updated" date in the footer is not enough when entities evolve at different rates.

### 16. New facts that reshape the thesis: rewrite top-down, don't just append a row

When a new event or fact changes the **core narrative spine** of the research (not a detail correction — a verdict shift), do NOT just append one more entity to the data array.

Test for thesis-level disruption: if the new fact flips ANY of these claims, you're at a thesis-level change, not an entity-level one:
- who moved first
- who is defending against whom
- what type of game this even is

When the test fires:

1. **Rewrite** title + thesis + eventBadge. The old framing was wrong; band-aiding it confuses readers.
2. **Rebuild** the signal timeline. Don't append the new event at the end — re-order so the new pivot reads correctly.
3. **Re-argue** the load-bearing sections (motivation / impact / AI analysis). The causal chain you wrote before assumed the old framing; check each step.
4. **Check if a new entity type appeared.** A new "kind" of entity (e.g. AI-company × runtime is not the same as deployment-platform × framework) means a new \`pairType\` / \`category\` field is needed, with its own color and filter chip.
5. **Sync every surface** in one commit: SHARE_COPY (title / lead / full), OG image, page header eyebrow, hero strip, siteNav label, works summary. Mixed-framing pages — half old narrative, half new — are worse than either consistent version.

Distilled from /platform-framework-pairs rewriting from "双巨头割据" to "三极割据" after surfacing Anthropic × Bun (2025-12-02). Adding Bun wasn't +1; it inverted the question from "which deployment platform owns which framework" to "AI companies are bypassing the deployment-platform layer entirely". The old framing positioned Cloudflare as "对冲 Vercel"; the new one positions it as "回应 Anthropic". Every load-bearing sentence had to be checked.

## Version Log

- v0.3（2026-06-05）：加入 #16 新事实重塑叙事支点时要从核心 thesis 往下重做。沉淀自 /platform-framework-pairs 从「双巨头」改写成「三极割据」的实战教训。
- v0.2（2026-06-04）：加入 5 条新 pattern（11–15），覆盖复合实体、主观打分透明、Status 一级筛选、逐实体核实徽章、最近信号 line。沉淀自 /platform-framework-pairs 的建设过程。
- v0.1（2026-06-04）：初版，从 /cancers-overview 提炼 10 条 pattern 与完整施工清单。`,
      openaiYaml: `interface:
  display_name: "Rich Data Research Page"
  short_description: "把多维度数据做成可比较 / 筛选 / 对比 / 分享的富页面"
  default_prompt: "Use $rich-data-research-page to build an interactive research dashboard for the given entities."

policy:
  allow_implicit_invocation: true`,
    },
  },
]

export function getSkillById(id) {
  return PUBLISHED_SKILLS.find((skill) => skill.id === id) || null
}

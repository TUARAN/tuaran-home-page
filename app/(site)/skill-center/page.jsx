import Link from 'next/link'

import SharePageButton from '../components/SharePageButton'

export const dynamic = 'force-static'

export const metadata = {
  title: 'Skill 中心',
  description: '面向大模型与智能体的 Skill 能力中心：沉淀可复用的任务能力、工作流模板与工具使用规范。',
  keywords: ['涂阿燃', 'tuaran', 'Skill', 'AI Agent', '智能体', '大模型', '工作流'],
  alternates: {
    canonical: '/skill-center',
  },
}

const SKILL_CATEGORIES = [
  {
    title: '创作与分发',
    desc: '把选题、素材、写作、改写、发布拆成可复用流程，适合内容生产和多平台运营。',
    examples: ['选题扩写', '长文结构化', '小红书改写', '分发检查'],
  },
  {
    title: '研发与交付',
    desc: '把工程任务固化成检查清单、代码路径、验证动作和交付格式，适合开发智能体协作。',
    examples: ['代码审查', '页面实现', '测试修复', '发布前检查'],
  },
  {
    title: '研究与分析',
    desc: '把资料搜集、信息抽取、对比分析、结论生成沉淀成稳定方法，适合专题调研。',
    examples: ['公司研究', '竞品拆解', '政策梳理', '资料综述'],
  },
  {
    title: '个人系统',
    desc: '面向长期知识库、记忆、日程、复盘和个人工作方式，沉淀可迁移的执行习惯。',
    examples: ['周复盘', '记忆整理', '任务拆解', '知识归档'],
  },
]

const PUBLISHING_RULES = [
  '每个 Skill 必须说明适用场景、输入要求、执行步骤、产出格式和验收标准。',
  '优先沉淀高频、可复用、有明确边界的任务能力。',
  '避免把泛泛提示词包装成 Skill；真正有价值的是流程、判断标准和工具协同方式。',
  '适合智能体执行的 Skill，应包含失败回退、风险提示和最小验证动作。',
]

const PUBLISHED_SKILLS = [
  {
    id: 'tuaran-profile',
    name: 'tuaran-profile',
    title: 'Tuaran 个人介绍',
    category: '个人系统',
    status: '已上架',
    desc: '让大模型稳定理解涂阿燃是谁、正在做什么，以及如何用不同粒度介绍他。',
    trigger: '当用户要求介绍“我 / Tuaran / 涂阿燃 / 掘金安东尼 / 我做的事情”时使用。',
    inputs: ['目标场景', '介绍长度', '是否需要偏技术、商业或个人主页口吻'],
    outputs: ['简短版', '详细版', '非常详细版'],
    acceptance: '不得虚构经历；优先使用已公开身份、项目、站点矩阵和长期方向；语气清晰、克制、可直接复用。',
    codexReady: true,
  },
]

const TUARAN_PROFILE_CODEX = {
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

涂阿燃（Tuaran，也使用“掘金安东尼”“安东尼404”等社区身份）是一名程序员、项目经理、技术博主、出版作者，也是矩联科技创始人。他从前端工程化、技术写作和项目交付一路延伸到 AI Agent、内容自动化和个人数字系统建设，公开内容累计 500+ 篇、阅读 400 万+。他的工作重心不是单点工具，而是把复杂问题拆成流程、标准、站点、数据和自动化，让个人经验变成可复用系统。当前重点项目包括 TUARAN 网络日志、矩联科技、博主联盟、前端周看、Open Claude Code、PublishLab，以及围绕 Web LLM、上下文记忆、Skill 中心等方向的实验项目。

### Very Detailed

涂阿燃（Tuaran / 掘金安东尼 / 安东尼404）是一名以工程化和系统化为核心方法的人。他的公开身份包括程序员、项目经理、技术博主、出版作者、矩联科技创始人和茉莉奶爸。早期从编程、前端开发、技术写作和项目管理出发，逐步形成了“把混乱编程为系统，把想法变成产品”的工作方式。他重视长期主义、公开复盘和可交付结果，倾向于把一次性的灵感或经验沉淀为可以反复调用的流程、页面、工具、知识库和自动化工作流。在 AI 方向上，他关注的不只是调用大模型，而是如何让模型进入真实工作：理解个人上下文，协助内容创作，支撑技术调研，参与代码交付，管理项目节奏，并通过 Skill、上下文记忆、端侧大模型和站点矩阵形成稳定能力。对外项目上，他维护 TUARAN 网络日志作为个人技术主页和知识生产入口；建设矩联科技作为技术服务与品牌展示阵地；推动博主联盟连接 AI 产品方与技术博主；运营前端周看，帮助前端工程师理解并转向 AI Agent 工程；同时通过 Open Claude Code、PublishLab 等站点拆解 Agent 方法论、AI 写作和数字出版实践。介绍他时，应避免把他简单写成“普通前端工程师”或“泛 AI 博主”，更准确的表述是：一个用工程化、写作、产品化和 AI Agent 方法，把个人能力持续沉淀为系统的人。`,
  openaiYaml: `interface:
  display_name: "Tuaran Profile"
  short_description: "介绍涂阿燃与他的项目矩阵"
  default_prompt: "Use $tuaran-profile to introduce Tuaran in a suitable length."

policy:
  allow_implicit_invocation: true`,
}

const TUARAN_PROFILE_VERSIONS = [
  {
    label: '简短版',
    useCase: '适合一句话 bio、社交简介、主页顶部、模型快速识别。',
    text: '涂阿燃（Tuaran / 掘金安东尼）是程序员、项目经理、技术博主、出版作者和矩联科技创始人，长期关注前端工程化、AI Agent、内容生产与个人数字系统，正在把写作、工具、站点和自动化工作流沉淀成可复用的 AI Native 项目矩阵。',
  },
  {
    label: '详细版',
    useCase: '适合 about、README、对外介绍、给模型建立稳定上下文。',
    text: '涂阿燃（Tuaran，也使用“掘金安东尼”“安东尼404”等社区身份）是一名程序员、项目经理、技术博主、出版作者，也是矩联科技创始人。他从前端工程化、技术写作和项目交付一路延伸到 AI Agent、内容自动化和个人数字系统建设，公开内容累计 500+ 篇、阅读 400 万+。他的工作重心不是单点工具，而是把复杂问题拆成流程、标准、站点、数据和自动化，让个人经验变成可复用系统。当前重点项目包括 TUARAN 网络日志、矩联科技、博主联盟、前端周看、Open Claude Code、PublishLab，以及围绕 Web LLM、上下文记忆、Skill 中心等方向的实验项目。',
  },
  {
    label: '非常详细版',
    useCase: '适合给大模型、智能体或合作方建立完整背景。',
    text: '涂阿燃（Tuaran / 掘金安东尼 / 安东尼404）是一名以工程化和系统化为核心方法的人。他的公开身份包括程序员、项目经理、技术博主、出版作者、矩联科技创始人和茉莉奶爸。早期从编程、前端开发、技术写作和项目管理出发，逐步形成了“把混乱编程为系统，把想法变成产品”的工作方式。他重视长期主义、公开复盘和可交付结果，倾向于把一次性的灵感或经验沉淀为可以反复调用的流程、页面、工具、知识库和自动化工作流。在 AI 方向上，他关注的不只是调用大模型，而是如何让模型进入真实工作：理解个人上下文，协助内容创作，支撑技术调研，参与代码交付，管理项目节奏，并通过 Skill、上下文记忆、端侧大模型和站点矩阵形成稳定能力。对外项目上，他维护 TUARAN 网络日志作为个人技术主页和知识生产入口；建设矩联科技作为技术服务与品牌展示阵地；推动博主联盟连接 AI 产品方与技术博主；运营前端周看，帮助前端工程师理解并转向 AI Agent 工程；同时通过 Open Claude Code、PublishLab 等站点拆解 Agent 方法论、AI 写作和数字出版实践。介绍他时，应避免把他简单写成“普通前端工程师”或“泛 AI 博主”，更准确的表述是：一个用工程化、写作、产品化和 AI Agent 方法，把个人能力持续沉淀为系统的人。',
  },
]

function StatusPill({ children }) {
  return (
    <span className="inline-flex rounded-full border border-[#dfd3c2] bg-[#f7efe3] px-2.5 py-1 text-xs text-[#7b6240] dark:border-[#334052] dark:bg-[#131d29] dark:text-[#c9d6e5]">
      {children}
    </span>
  )
}

export default function SkillCenterPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8 border-b border-[#e8dfd0] pb-6 dark:border-[#202938]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#766958] dark:text-gray-400">
              <Link href="/ai-projects" className="underline-offset-4 hover:underline">
                AI 项目
              </Link>
              <span>/</span>
              <span>Skill 中心</span>
            </div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-[#8b5a1f] dark:text-[#f0c776]">
              Skill Hub
            </p>
            <h1 className="mb-4 font-serif text-3xl font-semibold tracking-normal text-[#201b15] dark:text-gray-100 md:text-5xl">
              面向大模型与智能体的能力货架
            </h1>
            <p className="mb-0 max-w-3xl text-base leading-8 text-[#51483b] dark:text-gray-300">
              Skill 是一组可复用的任务能力：它把经验、流程、工具调用、产出格式和验收标准封装起来，让模型不只是回答问题，而是稳定完成一类工作。
            </p>
          </div>
          <SharePageButton
            title="Skill 中心"
            text="面向大模型与智能体的 Skill 能力中心。"
            url="/skill-center"
          />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {SKILL_CATEGORIES.map((category) => (
          <article
            key={category.title}
            className="rounded-lg border border-[#e4d9c8] bg-white p-4 dark:border-[#283443] dark:bg-[#101820]"
          >
            <h2 className="mb-2 border-b-0 pb-0 font-serif text-xl font-semibold text-[#231f18] dark:text-gray-100">
              {category.title}
            </h2>
            <p className="mb-4 text-sm leading-6 text-[#5c5144] dark:text-gray-300">{category.desc}</p>
            <div className="flex flex-wrap gap-1.5">
              {category.examples.map((item) => (
                <StatusPill key={item}>{item}</StatusPill>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-[#e4d9c8] bg-white p-5 dark:border-[#283443] dark:bg-[#101820]">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-xs text-[#827664] dark:text-gray-400">Catalog</p>
              <h2 className="mb-0 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#231f18] dark:text-gray-100">
                已上架 Skill
              </h2>
            </div>
            <StatusPill>{PUBLISHED_SKILLS.length} 个 Skill</StatusPill>
          </div>

          <div className="grid gap-3">
            {PUBLISHED_SKILLS.map((skill) => (
              <article key={skill.name} className="rounded-md border border-[#eee4d5] p-4 dark:border-[#263241]">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="mb-1 font-mono text-xs text-[#8b5a1f] dark:text-[#f0c776]">{skill.name}</p>
                    <h3 className="mb-1 border-b-0 pb-0 text-lg font-semibold text-[#231f18] dark:text-gray-100">
                      {skill.title}
                    </h3>
                  </div>
                  <StatusPill>{skill.status}</StatusPill>
                </div>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <StatusPill>{skill.category}</StatusPill>
                  {skill.codexReady ? <StatusPill>Codex 可配置</StatusPill> : null}
                </div>
                <p className="mb-4 text-sm leading-7 text-[#5c5144] dark:text-gray-300">{skill.desc}</p>
                <dl className="grid gap-3 text-sm leading-6 text-[#51483b] dark:text-gray-300">
                  <div>
                    <dt className="mb-1 font-semibold text-[#231f18] dark:text-gray-100">触发场景</dt>
                    <dd>{skill.trigger}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 font-semibold text-[#231f18] dark:text-gray-100">输入要求</dt>
                    <dd>{skill.inputs.join(' / ')}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 font-semibold text-[#231f18] dark:text-gray-100">产出格式</dt>
                    <dd>{skill.outputs.join(' / ')}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 font-semibold text-[#231f18] dark:text-gray-100">验收标准</dt>
                    <dd>{skill.acceptance}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-[#e4d9c8] bg-white p-5 dark:border-[#283443] dark:bg-[#101820]">
          <p className="mb-1 text-xs text-[#827664] dark:text-gray-400">Publishing Standard</p>
          <h2 className="mb-4 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#231f18] dark:text-gray-100">
            上架标准
          </h2>
          <ol className="space-y-3">
            {PUBLISHING_RULES.map((rule, index) => (
              <li key={rule} className="flex gap-3 text-sm leading-7 text-[#51483b] dark:text-gray-300">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1e7d8] font-mono text-xs text-[#6f5e45] dark:bg-[#17212d] dark:text-gray-300">
                  {index + 1}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section className="mt-8 rounded-lg border border-[#e4d9c8] bg-white p-5 dark:border-[#283443] dark:bg-[#101820]">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs text-[#827664] dark:text-gray-400">Local Codex</p>
            <h2 className="mb-0 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#231f18] dark:text-gray-100">
              配置到本地 Codex
            </h2>
          </div>
          <StatusPill>{TUARAN_PROFILE_CODEX.installPath}</StatusPill>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-md border border-[#eee4d5] bg-[#fdfaf5] p-4 dark:border-[#263241] dark:bg-[#121a24]">
            <h3 className="mb-3 border-b-0 pb-0 text-lg font-semibold text-[#231f18] dark:text-gray-100">
              文件结构
            </h3>
            <ol className="space-y-2 text-sm leading-6 text-[#51483b] dark:text-gray-300">
              <li>
                <span className="font-mono text-xs text-[#8b5a1f] dark:text-[#f0c776]">
                  {TUARAN_PROFILE_CODEX.installPath}
                </span>
              </li>
              {TUARAN_PROFILE_CODEX.files.map((file) => (
                <li key={file} className="pl-3 font-mono text-xs text-[#6b5f4d] dark:text-gray-300">
                  {file}
                </li>
              ))}
            </ol>
            <p className="mt-4 mb-0 text-sm leading-7 text-[#665b4d] dark:text-gray-300">
              新建同名目录后，把右侧两个文件内容分别保存进去，即可作为本地 Codex skill 使用。
            </p>
          </aside>

          <div className="grid min-w-0 gap-4">
            <article className="min-w-0 rounded-md border border-[#eee4d5] dark:border-[#263241]">
              <div className="border-b border-[#eee4d5] px-4 py-3 dark:border-[#263241]">
                <h3 className="mb-0 border-b-0 pb-0 font-mono text-sm font-semibold text-[#231f18] dark:text-gray-100">
                  SKILL.md
                </h3>
              </div>
              <pre className="m-0 max-h-[420px] overflow-auto bg-[#f7f2e9] p-4 text-xs leading-6 text-[#3d352b] dark:bg-[#0b1118] dark:text-gray-200">
                <code>{TUARAN_PROFILE_CODEX.skillMd}</code>
              </pre>
            </article>

            <article className="min-w-0 rounded-md border border-[#eee4d5] dark:border-[#263241]">
              <div className="border-b border-[#eee4d5] px-4 py-3 dark:border-[#263241]">
                <h3 className="mb-0 border-b-0 pb-0 font-mono text-sm font-semibold text-[#231f18] dark:text-gray-100">
                  agents/openai.yaml
                </h3>
              </div>
              <pre className="m-0 max-h-[220px] overflow-auto bg-[#f7f2e9] p-4 text-xs leading-6 text-[#3d352b] dark:bg-[#0b1118] dark:text-gray-200">
                <code>{TUARAN_PROFILE_CODEX.openaiYaml}</code>
              </pre>
            </article>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-[#e4d9c8] bg-white p-5 dark:border-[#283443] dark:bg-[#101820]">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs text-[#827664] dark:text-gray-400">tuaran-profile</p>
            <h2 className="mb-0 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#231f18] dark:text-gray-100">
              三档介绍版本
            </h2>
          </div>
          <StatusPill>短 / 中 / 长</StatusPill>
        </div>
        <div className="grid gap-4">
          {TUARAN_PROFILE_VERSIONS.map((version) => (
            <article
              key={version.label}
              className="rounded-md border border-[#eee4d5] bg-[#fdfaf5] p-4 dark:border-[#263241] dark:bg-[#121a24]"
            >
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="mb-0 border-b-0 pb-0 text-lg font-semibold text-[#231f18] dark:text-gray-100">
                  {version.label}
                </h3>
                <p className="mb-0 text-xs text-[#827664] dark:text-gray-400">{version.useCase}</p>
              </div>
              <p className="mb-0 text-sm leading-7 text-[#51483b] dark:text-gray-300">{version.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

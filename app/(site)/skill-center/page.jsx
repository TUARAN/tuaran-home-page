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

const EMPTY_SKILLS = []

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
            <StatusPill>{EMPTY_SKILLS.length} 个 Skill</StatusPill>
          </div>

          {EMPTY_SKILLS.length ? (
            <div className="grid gap-3">
              {EMPTY_SKILLS.map((skill) => (
                <article key={skill.name} className="rounded-md border border-[#eee4d5] p-4 dark:border-[#263241]">
                  <h3 className="mb-1 border-b-0 pb-0 text-lg font-semibold">{skill.name}</h3>
                  <p className="mb-0 text-sm text-[#5c5144] dark:text-gray-300">{skill.desc}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-[#d8cbb8] bg-[#fbf6ee] p-8 text-center dark:border-[#334052] dark:bg-[#121a24]">
              <h3 className="mb-2 border-b-0 pb-0 font-serif text-xl font-semibold text-[#231f18] dark:text-gray-100">
                Skill 货架正在整理
              </h3>
              <p className="mx-auto mb-0 max-w-xl text-sm leading-7 text-[#665b4d] dark:text-gray-300">
                这里会放置适合模型和智能体直接调用的能力卡片。每张卡片都应能说明：什么时候用、怎么执行、产出什么、如何判断完成。
              </p>
            </div>
          )}
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
    </main>
  )
}

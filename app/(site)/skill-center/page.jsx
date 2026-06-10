import Link from 'next/link'

import SharePageButton from '../components/SharePageButton'
import { SkillBundleButton, SkillFileButton } from './SkillFileActions'
import { PUBLISHED_SKILLS } from './skills'

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

function StatusPill({ children }) {
  return (
    <span className="inline-flex rounded-full border border-[#cccdc2] bg-[#eaebe3] px-2.5 py-1 text-xs text-[#555640] dark:border-[#334052] dark:bg-[#131d29] dark:text-[#c9d6e5]">
      {children}
    </span>
  )
}

function SkillCard({ skill }) {
  const detailHref = `/skill-center/${skill.id}`
  return (
    <article
      id={skill.id}
      className="rounded-lg border border-[#d2d3c8] bg-white dark:border-[#283443] dark:bg-[#101820]"
    >
      {/* Header — title + share button */}
      <header className="border-b border-[#dedfd5] p-5 dark:border-[#263241]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 font-mono text-xs text-[#8b5a1f] dark:text-[#a1ab76]">{skill.name}</p>
            <h2 className="mb-2 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#1c1d18] dark:text-gray-100">
              <Link href={detailHref} className="text-[#1c1d18] no-underline hover:!no-underline hover:text-[#8b5a1f] dark:text-gray-100 dark:hover:text-[#a1ab76]">
                {skill.title}
              </Link>
            </h2>
            <div className="flex flex-wrap gap-1.5">
              <StatusPill>{skill.status}</StatusPill>
              <StatusPill>{skill.category}</StatusPill>
              {skill.codex ? <StatusPill>Codex 可配置</StatusPill> : null}
            </div>
          </div>
          <SharePageButton
            title={`${skill.title} · Skill 中心`}
            text={skill.desc}
            url={detailHref}
            size="sm"
            exactUrl
          />
        </div>
        <p className="mb-0 mt-4 text-sm leading-7 text-[#4c4c44] dark:text-gray-300">{skill.desc}</p>
      </header>

      {/* Codex install / download / copy / share — the focus */}
      {skill.codex ? (
        <section className="p-5">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.12em] text-[#6e7064] dark:text-gray-400">
                配置到本地 Codex / 给智能体阅读 / 分享给同事
              </p>
              <h3 className="mb-0 border-b-0 pb-0 font-serif text-xl font-semibold text-[#1c1d18] dark:text-gray-100">
                下载 / 复制 Skill 文件
              </h3>
            </div>
            <StatusPill>{skill.codex.installPath}</StatusPill>
          </div>

          <div className="mb-4">
            <SkillBundleButton skill={skill} />
          </div>

          <div className="space-y-2">
            <p className="mb-1 text-xs uppercase tracking-[0.12em] text-[#6e7064] dark:text-gray-400">
              单独下载
            </p>
            <SkillFileButton filename="SKILL.md" content={skill.codex.skillMd} />
            <SkillFileButton filename="agents/openai.yaml" content={skill.codex.openaiYaml} />
            <p className="mt-2 text-xs leading-6 text-[#56564d] dark:text-gray-300">
              下载后放到 <code className="font-mono text-[11px] text-[#8b5a1f] dark:text-[#a1ab76]">{skill.codex.installPath}</code> 即可作为本地 Codex Skill 使用。也可直接复制 SKILL.md 粘贴到 Claude Code / Cursor / ChatGPT 当 system prompt。
            </p>
          </div>
        </section>
      ) : null}

      {/* Detail link */}
      <footer className="border-t border-[#dedfd5] px-5 py-3 dark:border-[#263241]">
        <Link
          href={detailHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#8b5a1f] no-underline transition-colors hover:!no-underline hover:text-[#724817] dark:text-[#a1ab76] dark:hover:text-[#9ba475]"
        >
          查看完整介绍（含基础信息 + 内容） →
        </Link>
      </footer>
    </article>
  )
}

export default function SkillCenterPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8 border-b border-[#dee0db] pb-6 dark:border-[#202938]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#626358] dark:text-gray-400">
              <Link href="/ai-projects" className="underline-offset-4 hover:underline">
                AI 项目
              </Link>
              <span>/</span>
              <span>Skill 中心</span>
            </div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-[#8b5a1f] dark:text-[#a1ab76]">
              Skill Hub
            </p>
            <h1 className="mb-4 font-serif text-3xl font-semibold tracking-normal text-[#191915] dark:text-gray-100 md:text-5xl">
              面向大模型与智能体的能力货架
            </h1>
            <p className="mb-0 max-w-3xl text-base leading-8 text-[#43433b] dark:text-gray-300">
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

      {/* Categories */}
      <section className="grid gap-4 md:grid-cols-4">
        {SKILL_CATEGORIES.map((category) => (
          <article
            key={category.title}
            className="rounded-lg border border-[#d2d3c8] bg-white p-4 dark:border-[#283443] dark:bg-[#101820]"
          >
            <h2 className="mb-2 border-b-0 pb-0 font-serif text-xl font-semibold text-[#1c1d18] dark:text-gray-100">
              {category.title}
            </h2>
            <p className="mb-4 text-sm leading-6 text-[#4c4c44] dark:text-gray-300">{category.desc}</p>
            <div className="flex flex-wrap gap-1.5">
              {category.examples.map((item) => (
                <StatusPill key={item}>{item}</StatusPill>
              ))}
            </div>
          </article>
        ))}
      </section>

      {/* Quick catalog index */}
      <section className="mt-8 rounded-lg border border-[#d2d3c8] bg-white p-5 dark:border-[#283443] dark:bg-[#101820]">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs text-[#6e7064] dark:text-gray-400">Catalog</p>
            <h2 className="mb-0 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#1c1d18] dark:text-gray-100">
              已上架 Skill
            </h2>
          </div>
          <StatusPill>{PUBLISHED_SKILLS.length} 个 Skill</StatusPill>
        </div>
        <ul className="grid gap-2 md:grid-cols-2">
          {PUBLISHED_SKILLS.map((skill) => (
            <li key={skill.id}>
              <Link
                href={`/skill-center/${skill.id}`}
                className="group flex items-center justify-between gap-3 rounded-md border border-[#dedfd5] bg-[#f8f8f5] px-4 py-3 no-underline transition-colors hover:!no-underline hover:border-[#b9bda8] hover:bg-[#e7eade] dark:border-[#263241] dark:bg-[#121a24] dark:hover:border-[#3a4a5d]"
              >
                <span>
                  <span className="block font-mono text-xs text-[#8b5a1f] dark:text-[#a1ab76]">
                    {skill.name}
                  </span>
                  <span className="mt-0.5 block text-sm font-semibold text-[#1c1d18] dark:text-gray-100">
                    {skill.title}
                  </span>
                </span>
                <span className="text-[#8b5a1f] transition-transform group-hover:translate-x-0.5 dark:text-[#a1ab76]">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Per-skill cards focused on download/share */}
      <section className="mt-8 grid gap-6">
        {PUBLISHED_SKILLS.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </section>

      {/* Publishing standards */}
      <section className="mt-8 rounded-lg border border-[#d2d3c8] bg-white p-5 dark:border-[#283443] dark:bg-[#101820]">
        <p className="mb-1 text-xs text-[#6e7064] dark:text-gray-400">Publishing Standard</p>
        <h2 className="mb-4 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#1c1d18] dark:text-gray-100">
          上架标准
        </h2>
        <ol className="grid gap-3 md:grid-cols-2">
          {PUBLISHING_RULES.map((rule, index) => (
            <li
              key={rule}
              className="flex gap-3 rounded-md border border-[#dedfd5] bg-[#f8f8f5] p-4 text-sm leading-7 text-[#43433b] dark:border-[#263241] dark:bg-[#121a24] dark:text-gray-300"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e1e2d8] font-mono text-xs text-[#545545] dark:bg-[#17212d] dark:text-gray-300">
                {index + 1}
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}

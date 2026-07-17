import Link from 'next/link'

import PageContainer from '../components/PageContainer'
import AgentCenterHero from '../components/AgentCenterHero'
import SharePageButton from '../components/SharePageButton'
import { SkillInstallPanel } from './SkillFileActions'
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
    <span className="inline-flex rounded-sm bg-[#eceae2] px-2 py-0.5 font-mono text-[10px] leading-5 text-[#666653] dark:bg-[#17212d] dark:text-[#c9d6e5]">
      {children}
    </span>
  )
}

function SkillCard({ skill }) {
  const detailHref = `/skill-center/${skill.id}`
  return (
    <article
      id={skill.id}
      className="flex min-w-0 flex-col py-6"
    >
      <header>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 truncate font-mono text-[11px] text-[#8b5a1f] dark:text-[#a1ab76]">{skill.name}</p>
            <h2 className="mb-1.5 border-b-0 pb-0 font-serif text-xl font-semibold leading-tight text-[#1c1d18] dark:text-gray-100">
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
        <p className="mb-0 mt-3 text-sm leading-6 text-[#4c4c44] dark:text-gray-300">{skill.desc}</p>
      </header>

      {skill.codex ? (
        <section className="mt-4">
          <SkillInstallPanel skill={skill} />
        </section>
      ) : null}

      <footer className="mt-auto pt-3">
        <Link
          href={detailHref}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#8b5a1f] no-underline transition-colors hover:!no-underline hover:text-[#724817] dark:text-[#a1ab76] dark:hover:text-[#9ba475]"
        >
          查看完整内容 →
        </Link>
      </footer>
    </article>
  )
}

export default function SkillCenterPage() {
  return (
    <PageContainer className="py-6 md:py-8">
      <AgentCenterHero
        current="/skill-center"
        eyebrow="Skill 中心"
        title="面向大模型与智能体的能力货架"
        description="Skill 是一组可复用的任务能力：它把经验、流程、工具调用、产出格式和验收标准封装起来，让模型不只是回答问题，而是稳定完成一类工作。"
        shareText="面向大模型与智能体的 Skill 能力中心。"
      />

      <section className="grid grid-cols-2 gap-x-5 gap-y-7 lg:grid-cols-4">
        {SKILL_CATEGORIES.map((category, index) => (
          <article
            key={category.title}
            className="min-w-0"
          >
            <span className="mb-3 block font-mono text-[10px] tracking-[0.16em] text-[#a06d2d] dark:text-[#a1ab76]">0{index + 1}</span>
            <h2 className="mb-1 border-b-0 pb-0 text-sm font-semibold text-[#1c1d18] dark:text-gray-100">
              {category.title}
            </h2>
            <p className="mb-2 text-xs leading-5 text-[#4c4c44] dark:text-gray-300">{category.desc}</p>
            <div className="flex flex-wrap gap-1">
              {category.examples.map((item) => (
                <StatusPill key={item}>{item}</StatusPill>
              ))}
            </div>
          </article>
        ))}
      </section>

      <div className="mb-3 mt-6 flex items-center justify-between gap-3">
        <h2 className="mb-0 border-b-0 pb-0 font-serif text-2xl font-semibold text-[#1c1d18] dark:text-gray-100">已上架 Skill</h2>
        <StatusPill>{PUBLISHED_SKILLS.length} 个</StatusPill>
      </div>
      <section className="divide-y divide-[#d8d7cf] border-y border-[#d8d7cf] dark:divide-[#283443] dark:border-[#283443]">
        {PUBLISHED_SKILLS.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </section>

      {/* Publishing standards */}
      <section className="mt-8 bg-[#efede5] px-5 py-6 dark:bg-[#111a24] md:px-6">
        <h2 className="mb-3 border-b-0 pb-0 font-serif text-xl font-semibold text-[#1c1d18] dark:text-gray-100">
          上架标准
        </h2>
        <ol className="grid gap-x-5 gap-y-2 md:grid-cols-2">
          {PUBLISHING_RULES.map((rule, index) => (
            <li
              key={rule}
              className="flex gap-2 text-xs leading-5 text-[#43433b] dark:text-gray-300"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e1e2d8] font-mono text-[10px] text-[#545545] dark:bg-[#17212d] dark:text-gray-300">
                {index + 1}
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
      </section>
    </PageContainer>
  )
}

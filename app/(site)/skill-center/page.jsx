import Link from 'next/link'
import { IconArrowUpRight, IconBolt, IconDownload } from '@tabler/icons-react'

import PageContainer from '../components/PageContainer'
import AgentCenterHero from '../components/AgentCenterHero'
import { PUBLISHED_SKILLS } from './skills'

export const dynamic = 'force-static'

export const metadata = {
  title: 'Skill 中心',
  description: '浏览可复用的智能体任务能力、工作流与安装说明。',
  keywords: ['涂阿燃', 'tuaran', 'Skill', 'AI Agent', '智能体', '工作流'],
  alternates: { canonical: '/skill-center' },
}

export default function SkillCenterPage() {
  return (
    <PageContainer className="py-6 md:py-10">
      <AgentCenterHero
        current="/skill-center"
        eyebrow="Skill · 怎么做"
        title="让好方法，成为可复用的能力"
        description="从写作、研究到研发交付，选择一项 Skill，查看完整做法和安装方式，让智能体按清晰的步骤完成任务。"
        shareText="可复用的智能体 Skill 与安装说明。"
        count={PUBLISHED_SKILLS.length}
        countLabel="项已发布 Skill"
        actionLabel="挑选 Skill"
      />

      <section id="items" className="scroll-mt-28">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a6b2f] dark:text-[#d1aa6c]">Explore skills</p>
            <h2 className="mb-0 border-b-0 pb-0 text-2xl font-black tracking-tight text-[var(--site-ink)] sm:text-3xl">找到适合当前任务的 Skill</h2>
          </div>
          <span className="text-sm text-[var(--site-muted)]">查看详情后可复制或安装</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PUBLISHED_SKILLS.map((skill) => (
            <article key={skill.id} id={skill.id} className="group flex scroll-mt-28 flex-col rounded-2xl border border-[#d8d9d5] bg-white/80 p-5 transition duration-200 hover:-translate-y-1 hover:border-[#aeb1aa] hover:shadow-[0_14px_34px_rgba(34,31,25,0.10)] dark:border-[#2b333e] dark:bg-[#111821]/80 dark:hover:border-[#4d5967] sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#efe9de] text-[#8b5a1f] dark:bg-[#2a291f] dark:text-[#e0bc7f]"><IconBolt size={23} stroke={1.7} /></span>
                <span className="rounded-full border border-[#dfded7] px-2.5 py-1 text-[11px] text-[var(--site-muted)] dark:border-[#35404a]">{skill.category}</span>
              </div>
              <p className="mb-1 truncate font-mono text-[11px] text-[var(--site-faint)]">{skill.name}</p>
              <h3 className="mb-2 border-b-0 pb-0 text-xl font-bold leading-snug text-[var(--site-ink)]">{skill.title}</h3>
              <p className="mb-5 line-clamp-3 text-sm leading-6 text-[var(--site-muted)]">{skill.desc}</p>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#e8e6e0] pt-4 dark:border-[#2a333d]">
                <span className="flex items-center gap-1.5 text-xs text-[var(--site-faint)]">{skill.codex ? <><IconDownload size={15} /> 可安装</> : '查看使用说明'}</span>
                <Link href={`/skill-center/${skill.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#795321] no-underline hover:!no-underline dark:text-[#d8b879]">查看详情 <IconArrowUpRight size={17} /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageContainer>
  )
}

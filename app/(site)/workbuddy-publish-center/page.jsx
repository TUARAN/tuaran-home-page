import Link from 'next/link'
import { IconArrowUpRight, IconDownload, IconPackage } from '@tabler/icons-react'

import AgentCenterHero from '../components/AgentCenterHero'
import PageContainer from '../components/PageContainer'
import { WORKBUDDY_MARKETPLACE_ARTIFACTS } from '../../../lib/workbuddyMarketplaceArtifacts'

export const dynamic = 'force-static'

export const metadata = {
  title: 'WorkBuddy 能力包',
  description: '下载适用于 WorkBuddy 的 Skill 与 MCP 能力包，并查看各包的用途、来源和适用状态。',
  keywords: ['WorkBuddy', 'Skill', 'MCP', '能力包', '下载'],
  alternates: { canonical: '/workbuddy-publish-center' },
}

const PACKAGES = [
  { kind: 'Skill', title: 'Skill 能力包', description: '将一套任务方法安装到 WorkBuddy，供智能体按需调用。' },
  { kind: 'MCP', title: 'MCP 连接包', description: '把数据或工具服务接入 WorkBuddy，扩展智能体能访问的能力。' },
]

function formatBytes(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}

function PackageCard({ artifact }) {
  const ready = artifact.readiness === 'ready'
  return (
    <article className="group flex flex-col rounded-2xl border border-[#d8d9d5] bg-white/80 p-5 transition duration-200 hover:-translate-y-1 hover:border-[#aeb1aa] hover:shadow-[0_14px_34px_rgba(34,31,25,0.10)] dark:border-[#2b333e] dark:bg-[#111821]/80 dark:hover:border-[#4d5967] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#e4eee8] text-[#356451] dark:bg-[#1e352e] dark:text-[#b7d9c5]"><IconPackage size={23} stroke={1.7} /></span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${ready ? 'bg-[#e3efe5] text-[#376344] dark:bg-[#1e3627] dark:text-[#b9d8bd]' : 'bg-[#f5ead5] text-[#825f27] dark:bg-[#3b2e19] dark:text-[#e5ca94]'}`}>{artifact.readinessLabel}</span>
      </div>
      <p className="mb-1 truncate font-mono text-[11px] text-[var(--site-faint)]">{artifact.kind} · {artifact.id}</p>
      <h3 className="mb-2 border-b-0 pb-0 text-xl font-bold leading-snug text-[var(--site-ink)]">{artifact.title}</h3>
      <p className="mb-5 text-sm leading-6 text-[var(--site-muted)]">{artifact.note}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#e8e6e0] pt-4 dark:border-[#2a333d]">
        <Link href={artifact.sourceUrl} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--site-muted)] no-underline hover:text-[var(--site-ink)] hover:!no-underline">了解来源 <IconArrowUpRight size={15} /></Link>
        <a href={artifact.downloadUrl} download className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#171b21] px-3.5 text-xs font-semibold text-white no-underline hover:bg-[#42464b] hover:!no-underline dark:bg-[#d9deca] dark:text-[#151713] dark:hover:bg-white"><IconDownload size={15} /> 下载 ZIP · {formatBytes(artifact.bytes)}</a>
      </div>
    </article>
  )
}

export default function WorkBuddyPublishCenterPage() {
  return (
    <PageContainer className="py-6 md:py-10">
      <AgentCenterHero
        current="/workbuddy-publish-center"
        eyebrow="WorkBuddy · 能力包"
        title="把需要的能力，装进 WorkBuddy"
        description="浏览可下载的 Skill 与 MCP 能力包。先看用途和适用状态，再进入来源页面了解详情或下载 ZIP。"
        shareText="WorkBuddy Skill 与 MCP 能力包。"
        count={WORKBUDDY_MARKETPLACE_ARTIFACTS.length}
        countLabel="个能力包"
        actionLabel="浏览能力包"
      />

      <div id="release-overview" className="scroll-mt-28" />
      <section id="items" className="scroll-mt-28">
        {PACKAGES.map((group) => {
          const artifacts = WORKBUDDY_MARKETPLACE_ARTIFACTS.filter((artifact) => artifact.kind === group.kind)
          if (!artifacts.length) return null
          return (
            <div key={group.kind} className="mb-10">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a6b2f] dark:text-[#d1aa6c]">{group.kind} packages</p>
                  <h2 className="mb-1 border-b-0 pb-0 text-2xl font-black tracking-tight text-[var(--site-ink)] sm:text-3xl">{group.title}</h2>
                  <p className="mb-0 text-sm text-[var(--site-muted)]">{group.description}</p>
                </div>
                <span className="text-sm text-[var(--site-faint)]">{artifacts.length} 个</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {artifacts.map((artifact) => <PackageCard key={artifact.id} artifact={artifact} />)}
              </div>
            </div>
          )
        })}
      </section>

      <p className="mb-0 rounded-xl bg-[#f2f1ec] px-5 py-4 text-xs leading-6 text-[var(--site-muted)] dark:bg-[#1b2530]">“需复核”或“测试”状态的包仍可下载，但不代表已通过市场审核。安装或提交前，请在来源页面核对适用范围、授权和配置要求。</p>
    </PageContainer>
  )
}

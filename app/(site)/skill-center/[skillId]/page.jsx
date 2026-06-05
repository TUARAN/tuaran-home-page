import Link from 'next/link'
import { notFound } from 'next/navigation'

import SharePageButton from '../../components/SharePageButton'
import { SkillBundleButton, SkillFileButton } from '../SkillFileActions'
import { PUBLISHED_SKILLS, getSkillById } from '../skills'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return PUBLISHED_SKILLS.map((skill) => ({ skillId: skill.id }))
}

export async function generateMetadata({ params }) {
  const { skillId } = await params
  const skill = getSkillById(skillId)
  if (!skill) {
    return { title: 'Skill 未找到 · Skill 中心' }
  }
  return {
    title: `${skill.title} · Skill 中心`,
    description: skill.desc,
    keywords: ['Skill', skill.name, skill.title, skill.category, '智能体', 'AI Agent'],
    alternates: {
      canonical: `/skill-center/${skill.id}`,
    },
  }
}

function StatusPill({ children }) {
  return (
    <span className="inline-flex rounded-full border border-[#dfd3c2] bg-[#f7efe3] px-2.5 py-1 text-xs text-[#7b6240] dark:border-[#334052] dark:bg-[#131d29] dark:text-[#c9d6e5]">
      {children}
    </span>
  )
}

export default async function SkillDetailPage({ params }) {
  const { skillId } = await params
  const skill = getSkillById(skillId)
  if (!skill) notFound()

  const content = skill.content
  const hasCodex = !!skill.codex

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <header className="mb-6 border-b border-[#e8dfd0] pb-6 dark:border-[#202938]">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[#766958] dark:text-gray-400">
          <Link href="/ai-projects" className="underline-offset-4 hover:underline">
            AI 项目
          </Link>
          <span>/</span>
          <Link href="/skill-center" className="underline-offset-4 hover:underline">
            Skill 中心
          </Link>
          <span>/</span>
          <span>{skill.title}</span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mb-1 font-mono text-xs text-[#8b5a1f] dark:text-[#f0c776]">{skill.name}</p>
            <h1 className="mb-3 border-b-0 pb-0 font-serif text-3xl font-semibold text-[#201b15] dark:text-gray-100 md:text-4xl">
              {skill.title}
            </h1>
            <div className="flex flex-wrap gap-1.5">
              <StatusPill>{skill.status}</StatusPill>
              <StatusPill>{skill.category}</StatusPill>
              {hasCodex ? <StatusPill>Codex 可配置</StatusPill> : null}
            </div>
          </div>
          <SharePageButton
            title={`${skill.title} · Skill 中心`}
            text={skill.desc}
            url={`/skill-center/${skill.id}`}
            size="md"
            exactUrl
          />
        </div>
        <p className="mb-0 mt-4 text-base leading-8 text-[#51483b] dark:text-gray-300">{skill.desc}</p>
      </header>

      {/* 基础信息 */}
      <section className="mb-6 rounded-lg border border-[#e4d9c8] bg-white p-5 dark:border-[#283443] dark:bg-[#101820]">
        <p className="mb-3 text-xs uppercase tracking-[0.12em] text-[#827664] dark:text-gray-400">
          基础信息
        </p>
        <dl className="grid gap-4 text-sm leading-7 text-[#51483b] dark:text-gray-300 md:grid-cols-2">
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
      </section>

      {/* 内容（rules / versions） */}
      {content ? (
        <section className="mb-6 rounded-lg border border-[#e4d9c8] bg-white p-5 dark:border-[#283443] dark:bg-[#101820]">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.12em] text-[#827664] dark:text-gray-400">
                内容
              </p>
              <h2 className="mb-0 border-b-0 pb-0 font-serif text-xl font-semibold text-[#231f18] dark:text-gray-100">
                {content.label}
              </h2>
            </div>
            {content.pill ? <StatusPill>{content.pill}</StatusPill> : null}
          </div>

          {content.type === 'versions' ? (
            <div className="grid gap-3">
              {content.items.map((version) => (
                <article
                  key={version.label}
                  className="rounded-md border border-[#eee4d5] bg-[#fdfaf5] p-4 dark:border-[#263241] dark:bg-[#121a24]"
                >
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="mb-0 border-b-0 pb-0 text-base font-semibold text-[#231f18] dark:text-gray-100">
                      {version.label}
                    </h3>
                    <p className="mb-0 text-xs text-[#827664] dark:text-gray-400">{version.useCase}</p>
                  </div>
                  <p className="mb-0 text-sm leading-7 text-[#51483b] dark:text-gray-300">{version.text}</p>
                </article>
              ))}
            </div>
          ) : null}

          {content.type === 'rules' ? (
            <ol className="grid gap-3 md:grid-cols-2">
              {content.items.map((rule, index) => (
                <li
                  key={rule.title}
                  className="rounded-md border border-[#eee4d5] bg-[#fdfaf5] p-4 dark:border-[#263241] dark:bg-[#121a24]"
                >
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="font-mono text-xs text-[#8b5a1f] dark:text-[#f0c776]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mb-0 border-b-0 pb-0 text-base font-semibold text-[#231f18] dark:text-gray-100">
                      {rule.title}
                    </h3>
                  </div>
                  <p className="mb-0 text-sm leading-7 text-[#51483b] dark:text-gray-300">{rule.body}</p>
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      ) : null}

      {/* Codex 下载/复制 */}
      {hasCodex ? (
        <section className="rounded-lg border border-[#e4d9c8] bg-white p-5 dark:border-[#283443] dark:bg-[#101820]">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.12em] text-[#827664] dark:text-gray-400">
                配置到本地 Codex / 给智能体阅读 / 分享给同事
              </p>
              <h2 className="mb-0 border-b-0 pb-0 font-serif text-xl font-semibold text-[#231f18] dark:text-gray-100">
                下载 / 复制 Skill 文件
              </h2>
            </div>
            <StatusPill>{skill.codex.installPath}</StatusPill>
          </div>

          <div className="mb-4">
            <SkillBundleButton skill={skill} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="space-y-2">
              <p className="mb-1 text-xs uppercase tracking-[0.12em] text-[#827664] dark:text-gray-400">
                单独下载
              </p>
              <SkillFileButton filename="SKILL.md" content={skill.codex.skillMd} />
              <SkillFileButton filename="agents/openai.yaml" content={skill.codex.openaiYaml} />
              <p className="mt-2 text-xs leading-6 text-[#665b4d] dark:text-gray-300">
                下载后放到 <code className="font-mono text-[11px] text-[#8b5a1f] dark:text-[#f0c776]">{skill.codex.installPath}</code> 即可作为本地 Codex Skill 使用。也可直接复制 SKILL.md 粘贴到 Claude Code / Cursor / ChatGPT 当 system prompt。
              </p>
            </aside>

            <div className="grid min-w-0 gap-4">
              <article className="min-w-0 rounded-md border border-[#eee4d5] dark:border-[#263241]">
                <div className="border-b border-[#eee4d5] px-4 py-3 dark:border-[#263241]">
                  <h3 className="mb-0 border-b-0 pb-0 font-mono text-sm font-semibold text-[#231f18] dark:text-gray-100">
                    SKILL.md
                  </h3>
                </div>
                <pre className="m-0 max-h-[360px] overflow-auto bg-[#f7f2e9] p-4 text-xs leading-6 text-[#3d352b] dark:bg-[#0b1118] dark:text-gray-200">
                  <code>{skill.codex.skillMd}</code>
                </pre>
              </article>

              <article className="min-w-0 rounded-md border border-[#eee4d5] dark:border-[#263241]">
                <div className="border-b border-[#eee4d5] px-4 py-3 dark:border-[#263241]">
                  <h3 className="mb-0 border-b-0 pb-0 font-mono text-sm font-semibold text-[#231f18] dark:text-gray-100">
                    agents/openai.yaml
                  </h3>
                </div>
                <pre className="m-0 max-h-[180px] overflow-auto bg-[#f7f2e9] p-4 text-xs leading-6 text-[#3d352b] dark:bg-[#0b1118] dark:text-gray-200">
                  <code>{skill.codex.openaiYaml}</code>
                </pre>
              </article>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-8 text-center">
        <Link
          href="/skill-center"
          className="inline-flex items-center gap-1 text-sm text-[#7b6240] no-underline transition-colors hover:!no-underline hover:text-[#231f18] dark:text-gray-400 dark:hover:text-gray-100"
        >
          ← 返回 Skill 中心
        </Link>
      </div>
    </main>
  )
}

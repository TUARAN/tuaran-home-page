'use client'

import AgentAccessGate from '../components/AgentAccessGate'
import { agentSkillResourceKey } from '../../../lib/agentCenters/accessKeys.mjs'
import { SkillBundleButton, SkillFileButton } from './SkillFileActions'

function StatusPill({ children }) {
  return (
    <span className="inline-flex rounded-full border border-[#cccdc2] bg-[#eaebe3] px-2.5 py-1 text-xs text-[#555640] dark:border-[#334052] dark:bg-[#131d29] dark:text-[#c9d6e5]">
      {children}
    </span>
  )
}

export default function SkillCodexAccessSection({ skill, skillFiles }) {
  const resourceKey = agentSkillResourceKey(skill.id)

  return (
    <section className="rounded-lg border border-[#d2d3c8] bg-white p-5 dark:border-[#283443] dark:bg-[#101820]">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.12em] text-[#6e7064] dark:text-gray-400">
            配置到本地 Codex / 给智能体阅读 / 分享给同事
          </p>
          <h2 className="mb-0 border-b-0 pb-0 font-serif text-xl font-semibold text-[#1c1d18] dark:text-gray-100">
            下载 / 复制 Skill 文件
          </h2>
        </div>
        <StatusPill>{skill.codex.installPath}</StatusPill>
      </div>

      <AgentAccessGate resourceKey={resourceKey} unitLabel="Skill 安装包">
        <div className="mb-4">
          <SkillBundleButton skill={skill} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-2">
            <p className="mb-1 text-xs uppercase tracking-[0.12em] text-[#6e7064] dark:text-gray-400">单独下载</p>
            {skillFiles.map((file) => (
              <SkillFileButton key={file.filename} filename={file.filename} content={file.content} />
            ))}
            <p className="mt-2 text-xs leading-6 text-[#56564d] dark:text-gray-300">
              下载后放到 <code className="font-mono text-[11px] text-[#8b5a1f] dark:text-[#a1ab76]">{skill.codex.installPath}</code> 即可作为本地 Codex Skill 使用。
            </p>
          </aside>

          <div className="grid min-w-0 gap-4">
            {skillFiles.map((file) => (
              <article key={file.filename} className="min-w-0 rounded-md border border-[#dedfd5] dark:border-[#263241]">
                <div className="border-b border-[#dedfd5] px-4 py-3 dark:border-[#263241]">
                  <h3 className="mb-0 border-b-0 pb-0 font-mono text-sm font-semibold text-[#1c1d18] dark:text-gray-100">{file.filename}</h3>
                </div>
                <pre className="m-0 max-h-[360px] overflow-auto bg-[#eeefe9] p-4 text-xs leading-6 text-[#31322b] dark:bg-[#0b1118] dark:text-gray-200">
                  <code>{file.content}</code>
                </pre>
              </article>
            ))}
          </div>
        </div>
      </AgentAccessGate>
    </section>
  )
}
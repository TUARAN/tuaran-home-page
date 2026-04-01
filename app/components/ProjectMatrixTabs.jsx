'use client'

import { useMemo, useState } from 'react'

function getStatusClassName(status) {
  const base = 'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium'
  switch (status) {
    case '持续更新':
      return `${base} border-blue-200/70 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200`
    case '打磨中':
      return `${base} border-amber-200/70 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200`
    default:
      return `${base} border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200`
  }
}

export default function ProjectMatrixTabs({ launchedProjects, devProjects, domainStrategyParagraphs }) {
  const tabs = useMemo(
    () => [
      {
        id: 'launched',
        label: '已上线',
        hint: `${launchedProjects.length} 个对外项目`,
      },
      {
        id: 'dev',
        label: '实验中',
        hint: `${devProjects.length} 个验证方向`,
      },
    ],
    [launchedProjects.length, devProjects.length]
  )

  const [activeTab, setActiveTab] = useState('launched')
  const panelCopy =
    activeTab === 'launched'
      ? {
          eyebrow: '对外可访问、持续运转的正式项目',
          paragraphs: [
            '这一栏放的是已经对外上线、具备明确入口和持续维护节奏的项目。它们承接内容、品牌、社区或工具能力，是当前对外可见的产品矩阵。',
            '这里不只是域名清单，更是已经开始承载访问、认知与实际使用行为的线上资产。',
          ],
        }
      : {
          eyebrow: '一个人公司 Vibe Coding 的产品实验场',
          paragraphs: [
            '这里收纳的是正在推进中的工具、实验项目和产品方向，重点在验证交互、场景与可用性。',
            '它们代表我当前对 AI、内容、开发工具和轻量产品的持续探索，也会逐步沉淀成下一阶段的正式项目。',
          ],
        }

  return (
    <section id="project-matrix" className="max-w-5xl mx-auto scroll-mt-24 text-left mb-8">
      <div className="rounded-[28px] border border-[#e9edf2] bg-[linear-gradient(180deg,#ffffff_0%,#fafbfd_100%)] p-4 shadow-sm dark:border-gray-800 dark:bg-[linear-gradient(180deg,#0f1115_0%,#11151c_100%)] sm:p-5">
        <div className="flex flex-col gap-4 border-b border-[#eef1f4] pb-4 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-sm font-semibold text-[#333] dark:text-gray-200">🗂 项目矩阵</h3>
              <span className="text-xs text-[#888] dark:text-gray-400">{panelCopy.eyebrow}</span>
            </div>
            <div className="mt-3 max-w-2xl space-y-2 text-[13px] leading-6 text-[#666] dark:text-gray-300">
              {(activeTab === 'launched' ? domainStrategyParagraphs : panelCopy.paragraphs).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="inline-flex rounded-2xl border border-[#e8ebef] bg-white/90 p-1 dark:border-gray-700 dark:bg-gray-900/80">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl px-3 py-2 text-left transition ${
                    isActive
                      ? 'bg-[#111827] text-white dark:bg-white dark:text-gray-900'
                      : 'text-[#667085] hover:bg-[#f4f6f8] dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="text-xs font-semibold">{tab.label}</div>
                  <div className={`mt-0.5 text-[11px] ${isActive ? 'text-white/75 dark:text-gray-600' : 'text-[#98a2b3] dark:text-gray-500'}`}>
                    {tab.hint}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {activeTab === 'launched' ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {launchedProjects.map((item) => (
              <article
                key={item.href}
                className="rounded-2xl border border-[#e8ebef] bg-white/90 p-4 transition hover:border-[#d8dfe7] dark:border-gray-800 dark:bg-gray-900/80 dark:hover:border-gray-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex rounded-full border border-black/5 bg-[#fafafa] px-2.5 py-1 text-[11px] font-medium text-[#666] dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                    {item.category}
                  </span>
                  <span className={getStatusClassName(item.status)}>{item.status}</span>
                </div>

                <div className="mt-4">
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="no-external-arrow inline-flex items-center text-[15px] font-semibold tracking-tight text-[#1f2937] transition hover:text-black dark:text-gray-100 dark:hover:text-white"
                  >
                    {item.name}
                  </a>
                  <p className="mt-2 text-[13px] leading-6 text-[#667085] dark:text-gray-400">
                    {item.focus}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {item.domains.map((domain) => (
                    <a
                      key={domain}
                      href={`https://${domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[#e8e8e8] bg-white px-2.5 py-1 text-[11px] font-medium text-[#555] transition hover:border-[#d5d5d5] hover:text-[#111] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                    >
                      {domain}
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-2xl border border-[#d8e3ee] bg-[linear-gradient(180deg,#f8fbfe_0%,#eef5fb_100%)] dark:border-slate-800 dark:bg-[linear-gradient(180deg,#101826_0%,#0d1420_100%)]">
            <table className="min-w-full border-collapse text-left text-[12px] text-[#58687a] dark:text-slate-300">
              <thead className="bg-white/70 text-[11px] uppercase tracking-[0.12em] text-[#6b7a90] dark:bg-slate-900/40 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2.5 font-medium">项目</th>
                  <th className="px-3 py-2.5 font-medium">类型</th>
                  <th className="px-3 py-2.5 font-medium">方向</th>
                  <th className="px-3 py-2.5 font-medium">访问</th>
                </tr>
              </thead>
              <tbody>
                {devProjects.map((project) => (
                  <tr
                    key={project.href}
                    className="border-t border-[#d8e3ee] align-top dark:border-slate-800"
                  >
                    <td className="px-3 py-3">
                      <div className="font-semibold tracking-tight text-[#17324d] dark:text-slate-100">
                        {project.name}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#6b7a90] dark:text-slate-400">
                        {project.stack}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-full border border-sky-200/80 bg-white/80 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:border-sky-900/60 dark:bg-slate-900/70 dark:text-sky-200">
                        {project.category}
                      </span>
                    </td>
                    <td className="px-3 py-3 leading-5">
                      {project.focus}
                    </td>
                    <td className="px-3 py-3">
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full border border-[#bfd3e5] bg-white/90 px-2.5 py-1 text-[10px] font-medium text-[#17324d] transition hover:border-[#9fc0de] hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-slate-600"
                      >
                        打开实验
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

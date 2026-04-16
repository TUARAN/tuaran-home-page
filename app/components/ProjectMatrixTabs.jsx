'use client'

function getProjectByKeyword(projects, keyword) {
  return projects.find((item) => item.name.includes(keyword))
}

const laneConfigs = [
  {
    id: 'brand',
    title: '① 入口与品牌层',
    description: '承载身份展示、能力说明、对外合作与总入口导航。',
    accent: 'blue',
    keywords: ['WebHP', 'MatrixLink'],
  },
  {
    id: 'community',
    title: '② 内容与社区层',
    description: '承担流量获取、内容分发、协作网络与社区影响力扩散。',
    accent: 'purple',
    keywords: ['Blogger Alliance', 'Frontend Weekly'],
  },
  {
    id: 'tech',
    title: '③ 技术能力层',
    description: '沉淀方法论、实验能力、技术研究与职业升级路径，是体系的核心护城河。',
    accent: 'orange',
    keywords: ['I Am Vibe Coder', 'Open Claude Code'],
  },
  {
    id: 'transformation',
    title: '④ 创作与转型层',
    description: '面向未来产品化与职业转型，承接创作工具、出版能力与成长路径设计。',
    accent: 'emerald',
    keywords: ['PublishLab', 'Frontend 2 AI Agent'],
  },
]

const accentClass = {
  blue: {
    dot: 'bg-blue-600',
    lane: 'border-blue-100/80 dark:border-blue-900/60',
    cardBar: 'before:bg-blue-600',
    status: 'text-blue-700 bg-blue-100 dark:text-blue-200 dark:bg-blue-950/50',
  },
  purple: {
    dot: 'bg-violet-600',
    lane: 'border-violet-100/80 dark:border-violet-900/60',
    cardBar: 'before:bg-violet-600',
    status: 'text-violet-700 bg-violet-100 dark:text-violet-200 dark:bg-violet-950/50',
  },
  orange: {
    dot: 'bg-orange-600',
    lane: 'border-orange-100/80 dark:border-orange-900/60',
    cardBar: 'before:bg-orange-600',
    status: 'text-orange-700 bg-orange-100 dark:text-orange-200 dark:bg-orange-950/50',
  },
  emerald: {
    dot: 'bg-emerald-600',
    lane: 'border-emerald-100/80 dark:border-emerald-900/60',
    cardBar: 'before:bg-emerald-600',
    status: 'text-emerald-700 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-950/50',
  },
}

function ProjectCard({ project, accent }) {
  if (!project) return null
  return (
    <article
      className={`relative border-l-2 bg-transparent py-3 pl-4 ${accent.cardBar.replace('before:bg-', 'border-')} dark:border-slate-700`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={project.href}
          target="_blank"
          rel="noreferrer"
          className="no-external-arrow text-base font-semibold text-slate-900 hover:opacity-80 dark:text-white"
        >
          {project.name}
        </a>
        <span className={`inline-flex px-2 py-0.5 text-xs font-medium ${accent.status}`}>
          {project.status}
        </span>
      </div>
      <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{project.focus}</p>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {project.domains.map((domain) => (
          <a
            key={domain}
            href={`https://${domain}`}
            target="_blank"
            rel="noreferrer"
            className="no-external-arrow !text-slate-500 underline underline-offset-4 hover:opacity-80 dark:!text-slate-400"
          >
            {domain}
          </a>
        ))}
      </div>
    </article>
  )
}

export default function ProjectMatrixTabs({ launchedProjects, devProjects, domainStrategyParagraphs }) {
  const laneData = laneConfigs.map((lane) => ({
    ...lane,
    projects: lane.keywords.map((keyword) => getProjectByKeyword(launchedProjects, keyword)).filter(Boolean),
  }))

  return (
    <section id="project-matrix" className="scroll-mt-24 text-left mb-8">
      <div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          AI Native 项目图谱
        </h2>
        <p className="mx-auto mt-2 max-w-3xl text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
          {domainStrategyParagraphs[0] || '围绕个人品牌、内容分发、技术沉淀与工具产品化形成站点矩阵。'}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {laneData.map((lane) => (
            <span
              key={lane.id}
              className="inline-flex items-center gap-2 px-1.5 py-1 text-xs text-slate-700 dark:text-slate-200"
            >
              <i className={`h-2.5 w-2.5 rounded-full ${accentClass[lane.accent].dot}`} />
              {lane.title.replace(/^.\s*/, '')}
            </span>
          ))}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          {laneData.map((lane) => (
            <section
              key={lane.id}
              className={`border-t-2 pt-4 ${accentClass[lane.accent].lane}`}
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{lane.title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{lane.description}</p>
              <div className="mt-3 divide-y divide-slate-200/70 dark:divide-slate-800">
                {lane.projects.map((project) => (
                  <ProjectCard key={project.href} project={project} accent={accentClass[lane.accent]} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 border-t border-slate-300/70 pt-5 text-slate-700 dark:border-slate-800 dark:text-slate-300">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">整体闭环</h3>
          <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
            从品牌入口、内容传播、技术沉淀到工具产品化与职业转型的连续链路：用内容吸引人，用研究建立专业度，用实验站验证能力，再用品牌站完成对外表达与商业承接。
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <div className="border-t border-slate-300/70 pt-2 text-center text-xs leading-5 dark:border-slate-800">
              <strong className="block text-sm text-slate-900 dark:text-white">入口</strong>
              WebHP / MatrixLink
            </div>
            <div className="border-t border-slate-300/70 pt-2 text-center text-xs leading-5 dark:border-slate-800">
              <strong className="block text-sm text-slate-900 dark:text-white">流量</strong>
              Weekly / Alliance
            </div>
            <div className="border-t border-slate-300/70 pt-2 text-center text-xs leading-5 dark:border-slate-800">
              <strong className="block text-sm text-slate-900 dark:text-white">能力</strong>
              Vibe Coder / Open Claude Code
            </div>
            <div className="border-t border-slate-300/70 pt-2 text-center text-xs leading-5 dark:border-slate-800">
              <strong className="block text-sm text-slate-900 dark:text-white">产品</strong>
              PublishLab
            </div>
            <div className="border-t border-slate-300/70 pt-2 text-center text-xs leading-5 dark:border-slate-800">
              <strong className="block text-sm text-slate-900 dark:text-white">升级</strong>
              Frontend 2 AI Agent
            </div>
          </div>
          {devProjects?.length ? (
            <div className="mt-5 border-t border-slate-300/70 pt-3 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">并行实验项目：{devProjects.length} 个。</p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {devProjects.map((project) => (
                  <a
                    key={project.href}
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    className="whitespace-nowrap border-b border-slate-300 px-1 py-1 text-xs !text-slate-700 visited:!text-slate-700 hover:opacity-80 dark:border-slate-700 dark:!text-slate-200 dark:visited:!text-slate-200"
                  >
                    {project.name}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  )
}

'use client'

function getProjectByKeyword(projects, keyword) {
  return projects.find((item) => item.name.includes(keyword))
}

function getDomainHref(domainLabel) {
  const sourceDomain = domainLabel.includes('→') ? domainLabel.split('→')[0].trim() : domainLabel.trim()
  return `https://${sourceDomain}`
}

function getSourceDomain(domainLabel) {
  return domainLabel.includes('→') ? domainLabel.split('→')[0].trim() : domainLabel.trim()
}

function isFrontendNextPrimaryDomain(projectName, domainLabel) {
  if (!projectName.includes('Frontend Next')) return false
  const sourceDomain = getSourceDomain(domainLabel)
  return sourceDomain === 'frontendnext.com'
}

const laneConfigs = [
  {
    id: 'brand',
    title: '入口与品牌',
    description: '身份展示与对外合作入口。',
    accent: 'blue',
    keywords: ['WebHP', 'MatrixLink'],
  },
  {
    id: 'community',
    title: '内容与社区',
    description: '流量获取、分发与协作网络。',
    accent: 'purple',
    keywords: ['Blogger Alliance', 'Frontend Next'],
  },
  {
    id: 'tech',
    title: '技术能力',
    description: '方法论与实验，是体系护城河。',
    accent: 'orange',
    keywords: ['Open Claude Code'],
  },
  {
    id: 'transformation',
    title: '创作与转型',
    description: '产品化路径与职业升级。',
    accent: 'emerald',
    keywords: ['内容同步智能体'],
  },
]

const accentBorder = {
  blue: 'border-blue-500',
  purple: 'border-violet-500',
  orange: 'border-orange-500',
  emerald: 'border-emerald-500',
}

function ProjectCard({ project, accent }) {
  if (!project) return null
  return (
    <article className={`border-l-2 ${accentBorder[accent]} py-2 pl-4`}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <a
          href={project.href}
          target="_blank"
          rel="noreferrer"
          className="no-external-arrow text-sm font-semibold text-slate-900 hover:opacity-80 dark:text-white"
        >
          {project.name}
        </a>
        {project.status ? (
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{project.status}</span>
        ) : null}
      </div>
      {project.focus ? (
        <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{project.focus}</p>
      ) : null}
      <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-slate-500 dark:text-slate-500">
        {project.domains.map((domain) => {
          const isPrimaryDomain = isFrontendNextPrimaryDomain(project.name, domain)
          return (
            <a
              key={domain}
              href={getDomainHref(domain)}
              target="_blank"
              rel="noreferrer"
              className={`no-external-arrow hover:opacity-80 ${
                isPrimaryDomain
                  ? '!text-slate-700 font-semibold dark:!text-slate-300'
                  : '!text-slate-500 dark:!text-slate-500'
              }`}
            >
              {isPrimaryDomain ? `主域名 · ${domain}` : domain}
            </a>
          )
        })}
      </div>
    </article>
  )
}

function DomainAssetList({ domainAssets }) {
  if (!domainAssets?.length) return null
  return (
    <section className="mt-10 border-t border-slate-200 pt-5 dark:border-slate-800">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">域名资产</h3>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{domainAssets.length} 个</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        备用、跳转与实验域名，归入主站或产品主域，不单独算作运营项目。
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {domainAssets.map((asset) => (
          <div
            key={asset.domain}
            className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
          >
            <a
              href={asset.href}
              target="_blank"
              rel="noreferrer"
              className="no-external-arrow text-xs font-semibold text-slate-800 hover:opacity-80 dark:text-slate-200"
            >
              {asset.domain}
            </a>
            <p className="mt-0.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{asset.role}</p>
            {asset.related ? (
              <p className="mt-0.5 font-mono text-[10px] text-slate-400 dark:text-slate-500">→ {asset.related}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}

export default function ProjectMatrixTabs({ launchedProjects, domainAssets, devProjects }) {
  const laneData = laneConfigs.map((lane, idx) => ({
    ...lane,
    index: idx + 1,
    projects: lane.keywords.map((keyword) => getProjectByKeyword(launchedProjects, keyword)).filter(Boolean),
  }))

  return (
    <section id="project-matrix" className="scroll-mt-24">
      <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
        {laneData.map((lane) => (
          <section key={lane.id}>
            <div className="flex items-baseline gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
              <span className="font-serif text-sm text-slate-400 dark:text-slate-500">
                {String(lane.index).padStart(2, '0')}
              </span>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{lane.title}</h3>
              <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400">{lane.description}</span>
            </div>
            <div className="mt-3 space-y-3">
              {lane.projects.map((project) => (
                <ProjectCard key={project.href} project={project} accent={lane.accent} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <DomainAssetList domainAssets={domainAssets} />

      {devProjects?.length ? (
        <section className="mt-10 border-t border-slate-200 pt-5 dark:border-slate-800">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">并行实验项目</h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{devProjects.length} 个</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {devProjects.map((project) => (
              <a
                key={project.href}
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className="no-external-arrow text-xs !text-slate-600 underline underline-offset-4 hover:opacity-80 dark:!text-slate-300"
              >
                {project.name}
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  )
}

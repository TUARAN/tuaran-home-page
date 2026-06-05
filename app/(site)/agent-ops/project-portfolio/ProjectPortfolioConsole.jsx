'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

const pillars = [
  {
    id: 'site',
    title: '个人站点与个人资产',
    subtitle: '门面 / 知识库 / 项目索引',
    color: 'border-teal-600',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
  },
  {
    id: 'content',
    title: '内容生产与分发',
    subtitle: 'ToB 博主联盟 / ToC 前端周刊',
    color: 'border-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    id: 'agent',
    title: 'AI Agent 与自动化',
    subtitle: '执行层 / 调度 / 工具链',
    color: 'border-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
  },
]

const projects = [
  { name: 'tuaran-home-page', pillar: 'site', status: '核心', role: '个人主页、调研知识库、项目展示入口', next: '继续作为所有公开项目和私域入口的总索引。' },
  { name: 'TUARAN', pillar: 'site', status: '保留', role: 'GitHub profile / 个人身份入口', next: '和个人站点互链，不承载复杂业务。' },
  { name: 'claude/homepage', pillar: 'site', status: '归档', role: '历史主页静态实验', next: '迁入设计原型 archive，避免留在工具目录根。' },
  { name: 'claude/surveys', pillar: 'site', status: '迁移', role: 'Claude / 代理调研材料', next: '整理成 tuaran-home-page 的 research/topics。' },

  { name: 'blogger-alliance', pillar: 'content', status: 'ToB 核心', role: '博主联盟、品牌合作、创作者增长', next: '吸收增长、账号、分发和线索工具。' },
  { name: 'frontend-weekly-digest-cn', pillar: 'content', status: 'ToC 核心', role: '前端周刊、技术内容、AI 专题', next: '吸收 WebLLM、SaaS、AI 学习资源和案例库。' },
  { name: 'md', pillar: 'content', status: '基础设施', role: 'Markdown 编辑、渲染、多平台分发', next: '作为内容生产与分发共享底座。' },
  { name: 'matrix-alliance', pillar: 'content', status: '整合', role: '创作者矩阵方法论和平台原型', next: '概念和内容优先并入博主联盟。' },
  { name: 'MatrixLinkTech', pillar: 'content', status: '整合', role: '品牌 / 业务展示站', next: '并入博主联盟服务品牌或公司介绍页。' },
  { name: 'fans-tracker', pillar: 'content', status: '整合', role: '粉丝和账号数据追踪', next: '并入博主联盟数据分析模块。' },
  { name: 'github-follow', pillar: 'content', status: '整合', role: '技术创作者发现工具', next: '作为博主联盟创作者线索来源。' },
  { name: 'auto-sync-blog', pillar: 'content', status: '整合', role: '博客自动同步工具', next: '和 md 打通，服务内容分发。' },
  { name: 'muti-ip', pillar: 'content', status: '改名', role: 'blogger-eye-platform 运行/采集工具', next: '本地名和远端名对齐后归入博主联盟。' },
  { name: 'xhs-auto-poster', pillar: 'content', status: '整合', role: '小红书自动发布脚本', next: '保护 .env 后并入内容分发工具链。' },
  { name: 'csdn', pillar: 'content', status: '迁移', role: 'CSDN 草稿和分发素材', next: '审未跟踪草稿，迁入 md 或博主联盟。' },
  { name: 'AI-Learning-Library', pillar: 'content', status: '专题', role: 'AI 学习资源库', next: '抽取为前端周刊 AI 学习专题。' },
  { name: 'webllm', pillar: 'content', status: '专题', role: 'WebLLM / WebGPU LLM 参考', next: '沉淀为前端周刊 Web AI 案例。' },
  { name: 'edge-llm-workbench', pillar: 'content', status: '专题', role: '边缘 LLM 工程实践', next: '内容进入前端周刊专题，代码保留独立。' },
  { name: 'pubishlab', pillar: 'content', status: '实验', role: '出版 / 内容实验室 Next.js 项目', next: '靠近前端周刊或 md，先清 node_modules/.next。' },
  { name: 'ccunpacked-zh', pillar: 'content', status: '专题', role: 'Claude Code 中文资料 / 教育站', next: '归入前端周刊 AI 开发工具专题。' },
  { name: 'SaaS-skills', pillar: 'content', status: '专题', role: 'SaaS 技术教育站', next: '作为前端周刊课程/专题素材。' },

  { name: 'accomplish', pillar: 'agent', status: '核心', role: '桌面 AI coworker', next: '独立主线，服务内容运营和项目治理自动化。' },
  { name: 'moltbot', pillar: 'agent', status: '核心', role: 'AI gateway / OpenClaw runtime', next: '作为多渠道 agent runtime 实验线。' },
  { name: 'agent-ops', pillar: 'agent', status: '控制面', role: '本地 Agent 自动化控制面', next: '调度内容同步、线索扫描、项目健康检查。' },
  { name: 'openclaw-issue-pr-tool', pillar: 'agent', status: '工具', role: 'OpenClaw issue / PR 自动化', next: '作为 agent-ops 的任务插件。' },
  { name: 'codex-local', pillar: 'agent', status: '研究', role: 'Codex 本地定制研究工作区', next: '保留为 AI Agent 研发参考。' },
  { name: 'hello-edge-agent', pillar: 'agent', status: '归档', role: 'Cloudflare edge agent 实验', next: '沉淀文章后归档，清理依赖缓存。' },
]

const decisions = [
  ['身份管控', '本页面与自动化控制台共用 tuaran_session；生产环境 cookie domain 使用 .2aran.com。'],
  ['长期罗盘', '继续保持独立端到端加密：登录只控制密文访问，解密仍需要本地口令。'],
  ['内容业务', 'ToB 博主联盟和 ToC 前端周刊同属内容生产与分发，不再拆成两个顶级板块。'],
  ['Agent 定位', 'AI Agent 是执行层，服务个人站点和内容业务，不混入内容仓库。'],
  ['文档资产', 'localdocx、claude/docx、seedance-book 应迁到长期文档资产区。'],
]

const graphLinks = {
  'tuaran-home-page': ['blogger-alliance', 'frontend-weekly-digest-cn', 'md'],
  'blogger-alliance': ['md'],
  'frontend-weekly-digest-cn': ['md'],
  md: ['tuaran-home-page', 'blogger-alliance', 'frontend-weekly-digest-cn'],
  accomplish: ['moltbot', 'agent-ops', 'tuaran-home-page'],
  moltbot: ['openclaw-issue-pr-tool', 'agent-ops'],
  'agent-ops': ['accomplish', 'moltbot', 'md', 'blogger-alliance'],
  'openclaw-issue-pr-tool': ['moltbot', 'agent-ops'],
}

const graphPositions = {
  'tuaran-home-page': [400, 50],
  'blogger-alliance': [130, 235],
  'frontend-weekly-digest-cn': [650, 235],
  md: [400, 250],
  accomplish: [400, 470],
  moltbot: [590, 495],
  'agent-ops': [220, 575],
  'openclaw-issue-pr-tool': [590, 575],
}

const pillarMap = Object.fromEntries(pillars.map((pillar) => [pillar.id, pillar]))

function relationTargets(project) {
  return graphLinks[project.name] || []
}

function relationText(project) {
  const targets = relationTargets(project).slice(0, 4).join(' -> ')
  return targets ? `${project.role}；关联 ${targets}。${project.next}` : project.next
}

export default function ProjectPortfolioConsole({ user }) {
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState('blogger-alliance')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((project) => {
      const pillarOk = active === 'all' || project.pillar === active
      const queryOk = !q || [project.name, project.status, project.role, project.next].join(' ').toLowerCase().includes(q)
      return pillarOk && queryOk
    })
  }, [active, query])

  const visibleNames = useMemo(() => new Set(filtered.map((project) => project.name)), [filtered])
  const graphProjects = filtered.filter((project) => graphPositions[project.name])
  const graphEdges = graphProjects
    .flatMap((project) => relationTargets(project).map((target) => [project.name, target]))
    .filter(([, target]) => visibleNames.has(target) || !query.trim())
  const selectedProject = projects.find((project) => project.name === selected) || projects[0]
  const selectedPillar = pillarMap[selectedProject.pillar]

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col px-4 py-8">
      <header className="rounded-2xl border border-[#e8dfd0] bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
              Agent Ops · Project Portfolio
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-[#221f19] dark:text-gray-100">
              项目组合看板
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#625a4d] dark:text-gray-300">
              三块管理：个人站点与个人资产、内容生产与分发、AI Agent 与自动化。此页面和自动化控制台共享身份管控；长期罗盘另走端到端加密。
            </p>
          </div>
          <div className="rounded-xl border border-[#e8dfd0] px-3 py-2 text-right text-xs text-[#6b5f4d] dark:border-gray-700 dark:text-gray-300">
            <p>已授权</p>
            <p className="mt-1 font-medium">{user?.name || user?.login || 'owner'}</p>
          </div>
        </div>
      </header>

      <section className="mt-5 grid gap-3 md:grid-cols-3">
        {pillars.map((pillar) => (
          <button
            key={pillar.id}
            type="button"
            onClick={() => setActive(active === pillar.id ? 'all' : pillar.id)}
            className={[
              'rounded-2xl border-l-4 border-y border-r p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md',
              pillar.color,
              pillar.bg,
              active === pillar.id ? 'ring-2 ring-[#221f19]/10 dark:ring-white/20' : '',
            ].join(' ')}
          >
            <h2 className="text-base font-semibold text-[#221f19] dark:text-gray-100">{pillar.title}</h2>
            <p className="mt-1 text-xs text-[#71685a] dark:text-gray-400">{pillar.subtitle}</p>
            <p className="mt-3 font-mono text-xs text-[#8f8069] dark:text-[#8e9ab0]">
              {projects.filter((project) => project.pillar === pillar.id).length} items
            </p>
          </button>
        ))}
      </section>

      <section className="mt-5 border border-[#d9dee7] bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActive('all')}
              className={`border px-3 py-1.5 text-xs ${active === 'all' ? 'border-[#111827] bg-[#111827] text-white dark:border-gray-200 dark:bg-gray-200 dark:text-[#111]' : 'border-[#d9dee7] text-[#555] dark:border-gray-700 dark:text-gray-300'}`}
            >
              全部
            </button>
            {pillars.map((pillar) => (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setActive(pillar.id)}
                className={`border px-3 py-1.5 text-xs ${active === pillar.id ? 'border-[#111827] bg-[#111827] text-white dark:border-gray-200 dark:bg-gray-200 dark:text-[#111]' : 'border-[#d9dee7] text-[#555] dark:border-gray-700 dark:text-gray-300'}`}
              >
                {pillar.title}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索项目、状态、下一步"
            className="w-full border border-[#d9dee7] bg-white px-3 py-2 text-sm outline-none focus:border-[#111827] dark:border-gray-700 dark:bg-gray-950 md:w-80"
          />
        </div>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="border border-[#d9dee7] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-3 border-b border-[#d9dee7] px-4 py-3 dark:border-gray-800">
            <h2 className="text-base font-semibold text-[#221f19] dark:text-gray-100">三大板块 + AI Agent 关系图</h2>
            <span className="text-xs text-[#667085] dark:text-gray-400">箭头表示吸收、服务、迁移或归档关系</span>
          </div>
          <div className="overflow-x-auto p-3">
            <svg className="block min-h-[640px] min-w-[920px]" viewBox="0 0 920 680" role="img" aria-label="TUARAN 项目关系图">
              <defs>
                <marker id="portfolio-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#aab3c2" />
                </marker>
              </defs>
              {graphEdges.map(([fromName, toName]) => {
                const from = graphPositions[fromName]
                const to = graphPositions[toName]
                if (!from || !to) return null
                const fromProject = projects.find((project) => project.name === fromName)
                const strong = ['核心', 'ToB 核心', 'ToC 核心', '基础设施', '控制面', '工具'].includes(fromProject?.status)
                const midX = (from[0] + to[0]) / 2 + 70
                return <path key={`${fromName}-${toName}`} d={`M ${from[0] + 70} ${from[1] + 22} C ${midX} ${from[1] + 22}, ${midX} ${to[1] + 22}, ${to[0] + 70} ${to[1] + 22}`} markerEnd="url(#portfolio-arrow)" fill="none" stroke="#aab3c2" strokeWidth={strong ? 2.8 : 1.5} />
              })}
              {graphProjects.map((project) => {
                const [x, y] = graphPositions[project.name]
                const pillar = pillarMap[project.pillar]
                const isSelected = selected === project.name
                return (
                  <g key={project.name} transform={`translate(${x}, ${y})`} className="cursor-pointer" onClick={() => setSelected(project.name)}>
                    <rect width="150" height="58" rx="8" fill="#fff" stroke={isSelected ? '#111827' : pillar.color.replace('border-', '#')} strokeWidth={isSelected ? 2.4 : 1.4} />
                    <circle cx="16" cy="18" r="5" fill={pillar.color.replace('border-', '#')} />
                    <text x="28" y="22" fill="#17202a" fontSize="13" fontWeight="650">{project.name.length > 18 ? `${project.name.slice(0, 17)}...` : project.name}</text>
                    <text x="14" y="43" fill="#667085" fontSize="11">{project.status} · {pillar.title}</text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        <aside className="border border-[#d9dee7] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-[#d9dee7] px-4 py-3 dark:border-gray-800">
            <h2 className="text-base font-semibold text-[#221f19] dark:text-gray-100">项目详情</h2>
            <p className="mt-1 text-xs text-[#667085] dark:text-gray-400">{selectedPillar?.title} · {selectedProject.status}</p>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-[#221f19] dark:text-gray-100">{selectedProject.name}</h3>
            <dl className="mt-4 grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
              <dt className="text-[#667085]">归属</dt><dd>{selectedPillar?.title}</dd>
              <dt className="text-[#667085]">角色</dt><dd>{selectedProject.role}</dd>
              <dt className="text-[#667085]">动作</dt><dd>{selectedProject.status}</dd>
              <dt className="text-[#667085]">下一步</dt><dd>{selectedProject.next}</dd>
              <dt className="text-[#667085]">连接</dt><dd>{relationTargets(selectedProject).length ? relationTargets(selectedProject).join('、') : '无强依赖'}</dd>
            </dl>
          </div>
        </aside>
      </section>

      <section className="mt-5 border border-[#d9dee7] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-3 border-b border-[#d9dee7] px-4 py-3 dark:border-gray-800">
          <h2 className="text-base font-semibold text-[#221f19] dark:text-gray-100">关系阵列</h2>
          <span className="text-xs text-[#667085] dark:text-gray-400">按最终归属管理，不按历史目录名或工具来源管理</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#f8fafc] text-left text-xs text-[#475467] dark:bg-gray-950 dark:text-gray-300">
                <th className="border-b border-r border-[#d9dee7] px-3 py-2 dark:border-gray-800">项目 / 工作区</th>
                <th className="border-b border-r border-[#d9dee7] px-3 py-2 dark:border-gray-800">个人站点</th>
                <th className="border-b border-r border-[#d9dee7] px-3 py-2 dark:border-gray-800">内容生产</th>
                <th className="border-b border-r border-[#d9dee7] px-3 py-2 dark:border-gray-800">AI Agent</th>
                <th className="border-b border-r border-[#d9dee7] px-3 py-2 dark:border-gray-800">基础设施</th>
                <th className="border-b border-r border-[#d9dee7] px-3 py-2 dark:border-gray-800">动作</th>
                <th className="border-b border-[#d9dee7] px-3 py-2 dark:border-gray-800">关系说明</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => {
                const infra = ['基础设施', '控制面', '工具'].includes(project.status) || project.name === 'md'
                return (
                  <tr key={project.name} onClick={() => setSelected(project.name)} className={`cursor-pointer hover:bg-[#fbfcff] dark:hover:bg-gray-950 ${selected === project.name ? 'bg-[#fff7ed] dark:bg-[#2a2113]' : ''}`}>
                    <td className="min-w-[220px] border-b border-r border-[#d9dee7] px-3 py-2 dark:border-gray-800"><b>{project.name}</b><span className="mt-1 block text-[11px] text-[#667085]">{project.role}</span></td>
                    {['site', 'content', 'agent'].map((pillarId) => <td key={pillarId} className="border-b border-r border-[#d9dee7] px-3 py-2 text-center font-bold dark:border-gray-800">{project.pillar === pillarId ? '●' : '·'}</td>)}
                    <td className="border-b border-r border-[#d9dee7] px-3 py-2 text-center font-bold dark:border-gray-800">{infra ? '●' : '·'}</td>
                    <td className="border-b border-r border-[#d9dee7] px-3 py-2 dark:border-gray-800"><span className="bg-[#eef1f6] px-2 py-1 text-xs text-[#475467] dark:bg-gray-800 dark:text-gray-300">{project.status}</span></td>
                    <td className="min-w-[260px] border-b border-[#d9dee7] px-3 py-2 leading-6 text-[#344054] dark:border-gray-800 dark:text-gray-300">{relationText(project)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-2xl border border-[#e8dfd0] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-[#221f19] dark:text-gray-100">整合路线</h2>
          <div className="mt-4 grid gap-3">
            {decisions.map(([title, body]) => (
              <div key={title} className="rounded-xl border border-[#eee] p-3 dark:border-gray-800">
                <p className="text-sm font-medium text-[#2a241b] dark:text-gray-100">{title}</p>
                <p className="mt-1 text-xs leading-5 text-[#6c6255] dark:text-gray-400">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e8dfd0] bg-[#fbf7ee] p-4 dark:border-gray-800 dark:bg-[#15110b]">
          <h2 className="text-base font-semibold text-[#221f19] dark:text-gray-100">控制台链接</h2>
          <p className="mt-2 text-xs leading-5 text-[#6c6255] dark:text-gray-400">
            这个页面是主站内的项目治理视图；任务执行、日志和调度仍在 Agent Ops 自动化控制台。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="https://ops.2aran.com/" target="_blank" rel="noreferrer" className="rounded-full bg-[#221f19] px-4 py-2 text-xs text-white no-underline dark:bg-gray-100 dark:text-[#111]">
              打开自动化控制台
            </a>
            <Link href="/long-compass" className="rounded-full border border-[#d8cdbb] px-4 py-2 text-xs text-[#5f574d] no-underline dark:border-gray-700 dark:text-gray-300">
              长期罗盘 · 端到端加密
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

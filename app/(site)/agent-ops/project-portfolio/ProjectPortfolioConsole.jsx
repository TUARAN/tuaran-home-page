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

export default function ProjectPortfolioConsole({ user }) {
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((project) => {
      const pillarOk = active === 'all' || project.pillar === active
      const queryOk = !q || [project.name, project.status, project.role, project.next].join(' ').toLowerCase().includes(q)
      return pillarOk && queryOk
    })
  }, [active, query])

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

      <section className="mt-5 rounded-2xl border border-[#e8dfd0] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActive('all')}
              className={`rounded-full border px-3 py-1.5 text-xs ${active === 'all' ? 'border-[#221f19] bg-[#221f19] text-white dark:border-gray-200 dark:bg-gray-200 dark:text-[#111]' : 'border-[#ddd] text-[#555] dark:border-gray-700 dark:text-gray-300'}`}
            >
              全部
            </button>
            {pillars.map((pillar) => (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setActive(pillar.id)}
                className={`rounded-full border px-3 py-1.5 text-xs ${active === pillar.id ? 'border-[#221f19] bg-[#221f19] text-white dark:border-gray-200 dark:bg-gray-200 dark:text-[#111]' : 'border-[#ddd] text-[#555] dark:border-gray-700 dark:text-gray-300'}`}
              >
                {pillar.title}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索项目、状态、下一步"
            className="w-full rounded-lg border border-[#ddd] bg-white px-3 py-2 text-sm outline-none focus:border-[#8b5a1f] dark:border-gray-700 dark:bg-gray-950 md:w-72"
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <article key={project.name} className="rounded-xl border border-[#eee] bg-[#fffdf8] p-4 dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 text-sm font-semibold text-[#221f19] dark:text-gray-100">{project.name}</h3>
                <span className="shrink-0 rounded-full bg-[#f2eadc] px-2 py-0.5 text-[11px] text-[#7a5523] dark:bg-[#2a2113] dark:text-[#d9b66e]">
                  {project.status}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#5f574d] dark:text-gray-300">{project.role}</p>
              <p className="mt-3 border-t border-[#eee] pt-3 text-xs leading-5 text-[#80776a] dark:border-gray-800 dark:text-gray-400">
                {project.next}
              </p>
            </article>
          ))}
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

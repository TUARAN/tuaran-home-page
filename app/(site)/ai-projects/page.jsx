import Link from 'next/link'

import SiteToolsPanel from '../components/SiteToolsPanel'
import {
  AI_EXPERIMENT_WORK_ITEMS,
  DOMAIN_ASSETS,
  PRODUCT_WORK_ITEMS,
  WORK_STRATEGY_PARAGRAPHS,
  getWorkStatusLabel,
} from '../../../lib/workItems'

export const dynamic = 'force-static'

const STRATEGY_HIGHLIGHTS = ['Prompt Cache 优化', 'Coordinator 与 Fork', 'YOLO Classifier', '文件流集成']
const OPERATING_AI_IDS = ['blogger-alliance', 'frontend-next', 'publishlab', 'open-claude-code']

export const metadata = {
  title: 'AI 项目图谱',
  description: '涂阿燃作品体系中的 AI Native 项目视角：产品主线、AI 工程实验、创作系统与工具原型。',
  alternates: {
    canonical: '/ai-projects',
  },
}

function renderStrategyText(text) {
  const pattern = new RegExp(`(${STRATEGY_HIGHLIGHTS.join('|')})`, 'g')
  return text.split(pattern).map((part, index) => {
    if (!STRATEGY_HIGHLIGHTS.includes(part)) return part
    return (
      <span
        key={`${part}-${index}`}
        className="font-serif text-[1.08em] font-bold text-[#a16207] dark:text-amber-300"
      >
        {part}
      </span>
    )
  })
}

function isExternalHref(href) {
  return /^https?:\/\//.test(href)
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="M5 11L11 5M6.5 5H11V9.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ProjectLink({ item, children, className }) {
  if (isExternalHref(item.href)) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className={`no-external-arrow ${className || ''}`}>
        {children}
      </a>
    )
  }

  return (
    <Link href={item.href} className={className}>
      {children}
    </Link>
  )
}

function ProjectCard({ item }) {
  return (
    <article className="flex min-h-[210px] flex-col border border-slate-200 bg-white/55 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800 dark:bg-[#101720] dark:hover:border-slate-700">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="border border-slate-200 bg-white/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
          {getWorkStatusLabel(item.status)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          {item.type}
        </span>
      </div>
      <h2 className="mb-0 border-0 p-0 text-[19px] font-semibold leading-snug text-slate-950 dark:text-slate-100">
        <ProjectLink
          item={item}
          className="text-slate-950 no-underline visited:text-slate-950 hover:text-[#8b5a1f] dark:text-slate-100 dark:visited:text-slate-100 dark:hover:text-[#d4bd87]"
        >
          {item.title}
        </ProjectLink>
      </h2>
      <p className="mb-0 mt-1 text-[12px] leading-5 text-slate-500 dark:text-slate-500">{item.role}</p>
      <p className="mb-0 mt-3 line-clamp-3 text-[13px] leading-6 text-slate-600 dark:text-slate-400">
        {item.summary}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags?.slice(0, 3).map((tag) => (
          <span key={tag} className="border border-slate-200 px-2 py-1 text-[11px] leading-none text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {tag}
          </span>
        ))}
      </div>
      <ProjectLink
        item={item}
        className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[12px] font-semibold text-[#8b5a1f] no-underline visited:text-[#8b5a1f] dark:text-[#d4bd87] dark:visited:text-[#d4bd87]"
      >
        {isExternalHref(item.href) ? '访问项目' : '打开页面'}
        <ArrowIcon />
      </ProjectLink>
    </article>
  )
}

function DomainAssetList() {
  return (
    <section className="border-t border-slate-200 pt-6 dark:border-slate-800">
      <div className="flex items-baseline justify-between">
        <h2 className="mb-0 border-0 p-0 text-lg font-semibold text-slate-900 dark:text-slate-100">域名资产</h2>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{DOMAIN_ASSETS.length} 个</span>
      </div>
      <p className="mb-0 mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        备用、跳转与实验域名，归入主站或产品主域，不单独算作运营项目。
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {DOMAIN_ASSETS.map((asset) => (
          <div
            key={asset.domain}
            className="border border-slate-200 bg-white/45 px-3 py-2 dark:border-slate-800 dark:bg-[#101720]"
          >
            <a
              href={asset.href}
              target="_blank"
              rel="noreferrer"
              className="no-external-arrow text-xs font-semibold text-slate-800 hover:opacity-80 dark:text-slate-200"
            >
              {asset.domain}
            </a>
            <p className="mb-0 mt-0.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{asset.role}</p>
            {asset.related ? (
              <p className="mb-0 mt-0.5 font-mono text-[10px] text-slate-400 dark:text-slate-500">{'->'} {asset.related}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}

export default function AiProjectsPage() {
  const operatingProjects = OPERATING_AI_IDS.map((id) => PRODUCT_WORK_ITEMS.find((item) => item.id === id)).filter(Boolean)

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-10 border-b border-[#eee] pb-6 dark:border-gray-800">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-500">
          AI View / merged into Works
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">
          AI Native 项目图谱
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#666] dark:text-gray-300">
          {renderStrategyText(WORK_STRATEGY_PARAGRAPHS[0])}
        </p>
        <p className="mb-0 mt-3 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
          这个页面现在是 <Link href="/works" className="text-[#8b5a1f] underline underline-offset-4 visited:text-[#8b5a1f] dark:text-[#d4bd87] dark:visited:text-[#d4bd87]">/works</Link> 的 AI 视角：主项目、工程实验和工具原型来自同一份作品数据。
        </p>
      </header>

      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
              Operating Projects
            </p>
            <h2 className="mb-0 border-0 p-0 text-xl font-semibold text-slate-950 dark:text-slate-100">
              和 AI 相关的产品主线
            </h2>
          </div>
          <Link
            href="/works#product"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#8b5a1f] no-underline visited:text-[#8b5a1f] dark:text-[#d4bd87] dark:visited:text-[#d4bd87]"
          >
            回到作品展厅
            <ArrowIcon />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {operatingProjects.map((item) => (
            <ProjectCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="mb-10 border-t border-slate-200 pt-6 dark:border-slate-800">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
              Experiments
            </p>
            <h2 className="mb-0 border-0 p-0 text-xl font-semibold text-slate-950 dark:text-slate-100">
              AI 工程与工具实验
            </h2>
          </div>
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-500">
            {AI_EXPERIMENT_WORK_ITEMS.length} items
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AI_EXPERIMENT_WORK_ITEMS.map((item) => (
            <ProjectCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <DomainAssetList />

      <section className="mt-10">
        <SiteToolsPanel />
      </section>
    </main>
  )
}

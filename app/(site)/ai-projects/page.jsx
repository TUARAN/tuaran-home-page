import Link from 'next/link'

import ProjectMatrixTabs from '../components/ProjectMatrixTabs'
import SiteToolsPanel from '../components/SiteToolsPanel'
import { domainStrategyParagraphs, maintainedDomains, opcVibeProjects } from './projectData'

export const dynamic = 'force-static'

const STRATEGY_HIGHLIGHTS = ['Prompt Cache 优化', 'Coordinator 与 Fork', 'YOLO Classifier', '文件流集成']

export const metadata = {
  title: 'AI 项目',
  description: '涂阿燃的 AI Native 项目图谱，整理个人入口、内容分发、AI 编程、创作工具与职业转型项目。',
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

export default function AiProjectsPage() {
  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-10">
      <header className="mb-10 border-b border-[#eee] dark:border-gray-800 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">AI Native 项目图谱</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2 max-w-3xl">
              {renderStrategyText(domainStrategyParagraphs[0])}
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex shrink-0 items-center gap-2 self-start border border-[#cfd0c5] px-3 py-1.5 text-[12px] font-medium text-[#565749] no-underline transition-colors hover:border-[#888b6d] hover:text-[#8b5a1f] dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-gray-100"
          >
            <span>后台管理</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#9a6a2a] dark:text-[#a1ab76]">
              Private
            </span>
          </Link>
        </div>
      </header>

      <ProjectMatrixTabs
        launchedProjects={maintainedDomains}
        devProjects={opcVibeProjects}
      />

      <SiteToolsPanel />
    </main>
  )
}

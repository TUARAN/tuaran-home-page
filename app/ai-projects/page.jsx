import ProjectMatrixTabs from '../components/ProjectMatrixTabs'
import SiteToolsPanel from '../components/SiteToolsPanel'
import { domainStrategyParagraphs, maintainedDomains, opcVibeProjects } from './projectData'

export const dynamic = 'force-static'

export const metadata = {
  title: 'AI 项目',
  description: '涂阿燃的 AI Native 项目图谱，整理个人入口、内容分发、AI 编程、创作工具与职业转型项目。',
  alternates: {
    canonical: '/ai-projects',
  },
}

export default function AiProjectsPage() {
  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-10">
      <header className="mb-10 border-b border-[#eee] dark:border-gray-800 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-[#222] dark:text-gray-100">AI Native 项目图谱</h1>
            <p className="text-sm text-[#666] dark:text-gray-300 mt-2 max-w-3xl">
              {domainStrategyParagraphs[0]}
            </p>
          </div>
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

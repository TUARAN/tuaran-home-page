import ProjectMatrixTabs from '../components/ProjectMatrixTabs'
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
    <main className="max-w-5xl mx-auto px-4 py-12 md:py-14">
      <ProjectMatrixTabs
        launchedProjects={maintainedDomains}
        devProjects={opcVibeProjects}
        domainStrategyParagraphs={domainStrategyParagraphs}
      />
    </main>
  )
}

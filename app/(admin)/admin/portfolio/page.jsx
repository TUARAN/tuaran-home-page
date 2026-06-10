import AdminPageGate from '../../components/AdminPageGate'
import ProjectPortfolioConsole from '../../../(site)/agent-ops/project-portfolio/ProjectPortfolioConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'AI 项目管理台',
  description: '项目治理 / 整合路线图。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminPortfolioPage() {
  return (
    <AdminPageGate
      label="AI 项目管理台"
      returnTo="/admin/portfolio"
      description="Codex 工作区与 AI 项目组合治理看板，仅站长本人可见。"
    >
      <ProjectPortfolioConsole />
    </AdminPageGate>
  )
}

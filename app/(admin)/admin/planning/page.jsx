import AdminPageGate from '../../components/AdminPageGate'
import PlanningCenter from './PlanningCenter'

export const runtime = 'edge'

export const metadata = {
  title: '项目管理',
  description: '在同一处管理项目组合、规划待办、路线图与执行历史。',
  robots: { index: false, follow: false },
}

export default async function AdminPlanningPage({ searchParams }) {
  const params = await searchParams
  const allowedTabs = new Set(['portfolio', 'todo', 'overview', 'roadmap', 'tree', 'history', 'dispatch'])
  const initialTab = allowedTabs.has(params?.tab) ? params.tab : 'todo'
  return (
    <AdminPageGate
      label="项目管理"
      returnTo="/admin/planning"
      description="统一管理项目组合、规划待办和执行记录，仅站长本人可见。"
    >
      <PlanningCenter initialTab={initialTab} />
    </AdminPageGate>
  )
}

import AdminPageGate from '../../components/AdminPageGate'
import PlanningCenter from './PlanningCenter'

export const runtime = 'edge'

export const metadata = {
  title: '规划与待办',
  description: '在同一处管理待办、里程碑、项目方向与执行历史。',
  robots: { index: false, follow: false },
}

export default async function AdminPlanningPage({ searchParams }) {
  const params = await searchParams
  const allowedTabs = new Set(['todo', 'overview', 'roadmap', 'tree', 'history', 'dispatch'])
  const initialTab = allowedTabs.has(params?.tab) ? params.tab : 'todo'
  return (
    <AdminPageGate
      label="规划与待办"
      returnTo="/admin/planning"
      description="统一管理待办、项目规划和执行记录，仅站长本人可见。"
    >
      <PlanningCenter initialTab={initialTab} />
    </AdminPageGate>
  )
}

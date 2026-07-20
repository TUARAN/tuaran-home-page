import AdminPageGate from '../../components/AdminPageGate'
import PlanningCenter from './PlanningCenter'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '规划中心',
  description: '统一记录全部项目的过去、当前焦点、未来里程碑与执行任务。',
  robots: { index: false, follow: false },
}

export default function AdminPlanningPage() {
  return (
    <AdminPageGate
      label="规划中心"
      returnTo="/admin/planning"
      description="统一记录全部项目的过去、当前焦点、未来里程碑与执行任务，仅站长本人可见。"
    >
      <PlanningCenter />
    </AdminPageGate>
  )
}

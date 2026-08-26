import AdminPageGate from '../../components/AdminPageGate'
import PlanningCenter from './PlanningCenter'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '规划中心',
  description: '统筹全部项目的过去、当前焦点与未来，并让 AI 参与大小任务的规划、拆解与分派。',
  robots: { index: false, follow: false },
}

export default async function AdminPlanningPage({ searchParams }) {
  const params = await searchParams
  const initialTab = params?.tab === 'dispatch' ? 'dispatch' : 'overview'
  return (
    <AdminPageGate
      label="规划中心"
      returnTo="/admin/planning"
      description="统筹全部项目并让 AI 参与大小任务的规划、拆解与分派，仅站长本人可见。"
    >
      <PlanningCenter initialTab={initialTab} />
    </AdminPageGate>
  )
}

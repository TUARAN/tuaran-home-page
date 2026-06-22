import AdminPageGate from '../../components/AdminPageGate'
import ModelDispatchConsole from './ModelDispatchConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Agent 协同测试',
  description: 'Admin 专属多代码大模型智能 Agent 协同测试、审计与策略迭代控制台。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminModelDispatchPage() {
  return (
    <AdminPageGate
      label="Agent 协同测试"
      returnTo="/admin/model-dispatch"
      description="Admin 专属 Agent 协同测试、执行审计与策略迭代闭环，仅站长本人可见。"
    >
      <ModelDispatchConsole />
    </AdminPageGate>
  )
}

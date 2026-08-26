import { redirect } from 'next/navigation'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '规划分派',
  description: '规划中心内的 AI 任务拆解、模型选型与 Agent 分派工具。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminModelDispatchPage() {
  redirect('/admin/planning?tab=dispatch')
}

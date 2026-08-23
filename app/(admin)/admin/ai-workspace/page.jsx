import { redirect } from 'next/navigation'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'AI 执行工作台',
  description: '自动化运行、Agent 执行与调用审计。',
  robots: { index: false, follow: false },
}

export default function AdminAiWorkspacePage() {
  redirect('/admin/automation')
}

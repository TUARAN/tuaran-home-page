import { redirect } from 'next/navigation'

export const metadata = {
  title: 'X 回复任务',
  description: '创建、复核并发布符合 X 自动化规则的回复任务。',
  robots: { index: false, follow: false },
}

export default function XReplyTasksPage() {
  redirect('/admin/community-actions?tab=x-reply')
}

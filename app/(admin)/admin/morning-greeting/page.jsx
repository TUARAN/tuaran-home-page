import { redirect } from 'next/navigation'

export const metadata = {
  title: 'X 发布任务',
  description: '管理每日 5 条早午安和互关交友帖。',
  robots: { index: false, follow: false },
}

export default function AdminMorningGreetingPage() {
  redirect('/admin/community-actions?tab=x-publish')
}

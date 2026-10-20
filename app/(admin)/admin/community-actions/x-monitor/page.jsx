import { redirect } from 'next/navigation'

export const metadata = { title: '插件监控', robots: { index: false, follow: false } }

export default function XMonitorPage() {
  redirect('/admin/community-actions/monitor?platform=x')
}

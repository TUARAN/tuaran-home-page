import { redirect } from 'next/navigation'

export const metadata = { title: '插件监控', robots: { index: false, follow: false } }

// X 监控已并入 X 站后台的「插件与排班」，旧入口直接送到那边。
export default function XMonitorPage() {
  redirect('https://x.2aran.com/x-workbench/ops#plugin-console')
}

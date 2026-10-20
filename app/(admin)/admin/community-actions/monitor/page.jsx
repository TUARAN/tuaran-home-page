import { Suspense } from 'react'
import AdminPageGate from '../../../components/AdminPageGate'
import PluginMonitorClient from './PluginMonitorClient'

export const metadata = { title: '插件监控', robots: { index: false, follow: false } }

export default function PluginMonitorPage() {
  return <AdminPageGate label="插件监控" returnTo="/admin/community-actions/monitor">
    <Suspense fallback={<p className="px-4 py-8 text-sm text-[#7a8479]">正在打开插件监控</p>}>
      <PluginMonitorClient />
    </Suspense>
  </AdminPageGate>
}

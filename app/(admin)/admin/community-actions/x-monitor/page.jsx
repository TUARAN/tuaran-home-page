import AdminPageGate from '../../../components/AdminPageGate'
import XMonitorClient from './XMonitorClient'

export const metadata = { title: 'X 插件监控', robots: { index: false, follow: false } }

export default function XMonitorPage() {
  return <AdminPageGate label="X 插件监控" returnTo="/admin/community-actions/x-monitor"><XMonitorClient /></AdminPageGate>
}

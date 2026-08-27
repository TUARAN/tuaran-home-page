import AdminPageGate from '../../components/AdminPageGate'
import SettingsConsole from './SettingsConsole'

export const metadata = {
  title: '站点设置',
  description: '管理站点级功能开关与第三方脚本。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminSettingsPage() {
  return (
    <AdminPageGate
      label="站点设置"
      returnTo="/admin/settings"
      description="后台管理控制台，仅站长本人可见，用来调整站点级功能开关。"
    >
      <SettingsConsole />
    </AdminPageGate>
  )
}

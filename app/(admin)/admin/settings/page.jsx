import AdminPageGate from '../../components/AdminPageGate'
import AdminSubnav from '../../components/AdminSubnav'
import { AdminPage } from '../../components/ui'
import SettingsConsole from './SettingsConsole'
import IntegrationsClient from '../integrations/IntegrationsClient'

export const metadata = {
  title: '配置中心',
  description: '管理站点功能开关、第三方服务、凭证与 Webhook。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

const TABS = [
  { id: 'site', label: '站点配置', href: '/admin/settings' },
  { id: 'integrations', label: '集成与密钥', href: '/admin/settings?tab=integrations' },
]

export default async function AdminSettingsPage({ searchParams }) {
  const params = await searchParams
  const activeTab = params?.tab === 'integrations' ? 'integrations' : 'site'
  return (
    <AdminPageGate
      label="配置中心"
      returnTo="/admin/settings"
      description="站点功能开关、外部服务、凭证与 Webhook 的统一入口，仅站长本人可见。"
    >
      <AdminPage title="配置中心" description="集中管理影响全站运行的功能开关和外部服务配置。">
        <AdminSubnav label="配置中心视图" items={TABS} activeId={activeTab} />
        {activeTab === 'site' ? <SettingsConsole embedded /> : <IntegrationsClient embedded />}
      </AdminPage>
    </AdminPageGate>
  )
}

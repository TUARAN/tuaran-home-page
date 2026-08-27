import AdminPageGate from '../../components/AdminPageGate'
import SeoManagementConsole from './SeoManagementConsole'

export const metadata = {
  title: 'SEO 管理',
  description: '站点 SEO 策略、页面覆盖、Sitemap 与演进治理控制台。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function AdminSeoPage() {
  return (
    <AdminPageGate
      label="SEO 管理"
      returnTo="/admin/seo"
      description="站点 SEO 策略、页面覆盖与演进治理控制台，仅站长本人可见。"
    >
      <SeoManagementConsole />
    </AdminPageGate>
  )
}

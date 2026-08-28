import AdminPageGate from '../../components/AdminPageGate'
import SubsiteManager from './SubsiteManager'

export const metadata = {
  title: '二级站管理',
  description: '管理二级站点资料、部署项目与站点间关系。',
  robots: { index: false, follow: false },
}

export default function SubsitesPage() {
  return (
    <AdminPageGate label="二级站管理" returnTo="/admin/subsites">
      <SubsiteManager />
    </AdminPageGate>
  )
}

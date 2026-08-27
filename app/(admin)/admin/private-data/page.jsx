import AdminPageGate from '../../components/AdminPageGate'
import PrivateDataWorkspace from './PrivateDataWorkspace'

export const metadata = {
  title: '私密数据',
  description: '个人密文、私密分析、密码保护分享与私有媒体资产。',
  robots: { index: false, follow: false },
}

export default function AdminPrivateDataPage() {
  return (
    <AdminPageGate label="私密数据" returnTo="/admin/private-data" description="个人密文、私密分析、受控分享与私有资产，仅站长本人可见。">
      <PrivateDataWorkspace />
    </AdminPageGate>
  )
}

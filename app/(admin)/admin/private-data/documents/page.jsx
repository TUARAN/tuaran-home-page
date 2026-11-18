import AdminPageGate from '../../../components/AdminPageGate'
import PrivateDocumentsConsole from './PrivateDocumentsConsole'

export const metadata = {
  title: '私密文档与分享',
  description: '统一管理私密 PDF、文字记录与密码分享。',
  robots: { index: false, follow: false },
}

export default function PrivateDocumentsPage() {
  return (
    <AdminPageGate label="私密文档与分享" returnTo="/admin/private-data/documents">
      <PrivateDocumentsConsole />
    </AdminPageGate>
  )
}

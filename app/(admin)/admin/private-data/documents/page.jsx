import AdminPageGate from '../../../components/AdminPageGate'
import PrivateDocumentsConsole from './PrivateDocumentsConsole'

export const metadata = {
  title: '私密文档',
  description: '仅站长可访问的 PDF 附件目录。',
  robots: { index: false, follow: false },
}

export default function PrivateDocumentsPage() {
  return (
    <AdminPageGate label="私密文档" returnTo="/admin/private-data/documents">
      <PrivateDocumentsConsole />
    </AdminPageGate>
  )
}

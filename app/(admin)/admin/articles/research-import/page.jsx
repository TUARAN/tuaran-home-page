import AdminPageGate from '../../../components/AdminPageGate'
import ResearchImportConsole from './ResearchImportConsole'

export const metadata = { title: '导入调研', robots: { index: false, follow: false } }

export default function ResearchImportPage() {
  return <AdminPageGate label="导入调研" returnTo="/admin/articles/research-import"><ResearchImportConsole /></AdminPageGate>
}

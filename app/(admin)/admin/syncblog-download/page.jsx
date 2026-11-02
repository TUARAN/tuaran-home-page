import AdminPageGate from '../../components/AdminPageGate'
import DownloadConsole from './DownloadConsole'
export const metadata = { title: 'AI 分发大师 · VIP 下载管理', robots: { index: false, follow: false } }
export default function Page() {
  return <AdminPageGate label="AI 分发大师下载管理" returnTo="/admin/syncblog-download" description="上传私有安装包、生成和更新 VIP 下载密码。"><DownloadConsole /></AdminPageGate>
}

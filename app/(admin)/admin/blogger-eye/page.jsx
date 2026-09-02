import AdminPageGate from '../../components/AdminPageGate'
import BloggerEyeConsole from './BloggerEyeConsole'

export const metadata = {
  title: '小眼睛',
  description: '通过受控的云端节点检测出口 IP，并访问已授权的目标网站。',
  robots: { index: false, follow: false },
}

export default function AdminBloggerEyePage() {
  return (
    <AdminPageGate
      label="小眼睛"
      returnTo="/admin/blogger-eye"
      description="云端网站可用性与多地区测试工具，仅站长本人可见。"
    >
      <BloggerEyeConsole />
    </AdminPageGate>
  )
}

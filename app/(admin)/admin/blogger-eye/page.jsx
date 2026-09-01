import AdminPageGate from '../../components/AdminPageGate'
import BloggerEyeConsole from './BloggerEyeConsole'

export const metadata = {
  title: '小眼睛',
  description: '通过本机代理服务检测出口 IP、提取 91HTTP 代理并轮换访问目标链接。',
  robots: { index: false, follow: false },
}

export default function AdminBloggerEyePage() {
  return (
    <AdminPageGate
      label="小眼睛"
      returnTo="/admin/blogger-eye"
      description="本机代理与轮换访问工具，仅站长本人可见。"
    >
      <BloggerEyeConsole />
    </AdminPageGate>
  )
}

import AdminPageGate from '../../components/AdminPageGate'
import BookmarkNavigationClient from './BookmarkNavigationClient'

export const metadata = {
  title: '书签导航',
  description: '站长私有的 Chrome 书签导航、分类检索与导入审计。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function AdminBookmarkNavigationPage() {
  return (
    <AdminPageGate
      label="书签导航"
      returnTo="/admin/bookmark-nav"
      description="Chrome 书签中包含私人工作入口和管理控制台，因此仅站长本人可见。"
    >
      <BookmarkNavigationClient />
    </AdminPageGate>
  )
}

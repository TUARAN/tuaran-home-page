import AdminPageGate from '../../components/AdminPageGate'
import WallpaperConsole from './WallpaperConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '壁纸资源管理台',
  description: '上传 / 删除壁纸资源（Cloudflare R2），维护公开画廊。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminWallpapersPage() {
  return (
    <AdminPageGate
      label="壁纸资源管理台"
      returnTo="/admin/wallpapers"
      description="上传壁纸到 R2 并维护公开画廊，仅站长本人可见。"
    >
      <WallpaperConsole />
    </AdminPageGate>
  )
}

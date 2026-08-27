import AdminPageGate from '../../components/AdminPageGate'
import LongCompassAdminTabs from './LongCompassAdminTabs'

export const metadata = {
  title: '长期罗盘',
  description: '浏览器本地解密的强私密个人内容库。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminLongCompassPage() {
  return (
    <AdminPageGate
      label="长期罗盘"
      returnTo="/admin/long-compass"
      description="数据库仅存密文，输入口令后只在浏览器本地解密，仅站长本人可见。"
    >
      <LongCompassAdminTabs />
    </AdminPageGate>
  )
}

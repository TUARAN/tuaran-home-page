import AdminPageGate from '../../components/AdminPageGate'
import InformationConsole from './InformationConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '信息金库',
  description: '端到端加密保存账号、密保与其他敏感信息。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function AdminInformationPage() {
  return (
    <AdminPageGate
      label="信息金库"
      returnTo="/admin/information"
      description="仅站长本人可访问；所有敏感字段在浏览器本地加密和解密。"
    >
      <InformationConsole />
    </AdminPageGate>
  )
}

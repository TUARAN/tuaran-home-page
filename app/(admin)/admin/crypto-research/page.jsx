import AdminPageGate from '../../components/AdminPageGate'
import CryptoResearchClient from './CryptoResearchClient'

export const metadata = {
  title: '加密调研自动化',
  description: '按市值每日一个加密资产：选题、联网草稿、复核与发布。',
  robots: { index: false, follow: false },
}

export default function AdminCryptoResearchPage() {
  return <AdminPageGate label="加密调研自动化" returnTo="/admin/crypto-research" description="按市值每日一个加密资产，仅站长本人可见。"><CryptoResearchClient /></AdminPageGate>
}

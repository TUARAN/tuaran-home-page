import AdminPageGate from '../../components/AdminPageGate'
import ContractRenewalClient from './ContractRenewalClient'

export const metadata = {
  title: '续签述职',
  description: '劳动合同续签 8 分钟对稿：PPT 原页、口播稿、计时和答问。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function AdminContractRenewalPage() {
  return (
    <AdminPageGate
      label="续签述职"
      returnTo="/admin/contract-renewal"
      description="合同续签答辩对稿仅站长本人可见。"
    >
      <ContractRenewalClient />
    </AdminPageGate>
  )
}

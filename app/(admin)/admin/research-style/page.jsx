import AdminPageGate from '../../components/AdminPageGate'
import ResearchStyleClient from './ResearchStyleClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '调研风格模版',
  description: '站长调研类内容在分寸、措辞、版式上的演进版本快照。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function ResearchStyleTemplatesPage() {
  return (
    <AdminPageGate
      label="调研风格模版"
      returnTo="/admin/research-style"
      description="调研类内容（research/companies, research/topics）在分寸感、措辞、版式约束上的历代快照。保留全部历史版本，便于回看每条规则的来由。"
    >
      <ResearchStyleClient />
    </AdminPageGate>
  )
}

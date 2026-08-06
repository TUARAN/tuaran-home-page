import AdminPageGate from '../../components/AdminPageGate'
import AShareResearchClient from './AShareResearchClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'A 股研究自动化',
  description: '线上每日 A 股公司观察：选题、DeepSeek 草稿与运行日志。',
  robots: { index: false, follow: false },
}

export default function AdminAShareResearchPage() {
  return (
    <AdminPageGate
      label="A 股研究自动化"
      returnTo="/admin/a-share-research"
      description="线上每日 A 股公司观察自动化，仅站长本人可见。"
    >
      <AShareResearchClient />
    </AdminPageGate>
  )
}

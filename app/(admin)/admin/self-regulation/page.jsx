import AdminPageGate from '../../components/AdminPageGate'
import SelfRegulationReview from './SelfRegulationReview'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '锻炼与自控',
  description: '仅站长可见的欲望、压力、锻炼与行为边界复盘。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function SelfRegulationPage() {
  return (
    <AdminPageGate
      label="锻炼与自控"
      returnTo="/admin/self-regulation"
      description="整理欲望、压力与锻炼记录，仅站长本人可访问。"
    >
      <SelfRegulationReview />
    </AdminPageGate>
  )
}

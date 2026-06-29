import AdminPageGate from '../../components/AdminPageGate'
import ResearchStyleClient from './ResearchStyleClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '调研风格库',
  description: '站长调研类内容的可选风格配置：默认调研、人味调研、周刊解释、投研备忘、资料档案。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function ResearchStyleTemplatesPage() {
  return (
    <AdminPageGate
      label="调研风格库"
      returnTo="/admin/research-style"
      description="调研类内容（research/companies, research/topics, research/people）的风格配置库。写作前先选风格。"
    >
      <ResearchStyleClient />
    </AdminPageGate>
  )
}

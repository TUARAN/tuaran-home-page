import AdminPageGate from '../../components/AdminPageGate'
import ResearchStyleClient from './ResearchStyleClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '内容风格库',
  description: '站内长文的可选风格配置：默认分析、人味分析、周刊解释、投研备忘、资料档案。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function ResearchStyleTemplatesPage() {
  return (
    <AdminPageGate
      label="内容风格库"
      returnTo="/admin/research-style"
      description="长文内容（research/companies, research/topics, research/people）的风格配置库。写作前先选风格。"
    >
      <ResearchStyleClient />
    </AdminPageGate>
  )
}

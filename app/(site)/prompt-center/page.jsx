import RedirectToAgentHub from '../components/RedirectToAgentHub'

export const dynamic = 'force-static'

export const metadata = {
  title: 'Prompt 中心',
  description: '已并入智能体应用中心 Prompt 分区。',
  alternates: { canonical: '/skill-center#prompt' },
}

export default function PromptCenterPage() {
  return <RedirectToAgentHub fallbackHash="#prompt" />
}
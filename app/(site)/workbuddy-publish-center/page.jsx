import RedirectToAgentHub from '../components/RedirectToAgentHub'

export const dynamic = 'force-static'

export const metadata = {
  title: 'WorkBuddy 能力包',
  description: '已并入智能体应用中心 WorkBuddy 分区。',
  alternates: { canonical: '/skill-center#workbuddy' },
}

export default function WorkBuddyPublishCenterPage() {
  return <RedirectToAgentHub fallbackHash="#workbuddy" />
}
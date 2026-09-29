import PageContainer from '../components/PageContainer'
import CheckinRewardsClient from './CheckinRewardsClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '签到有礼 · 领取燃币兑换礼物',
  description: '每天签到领取燃币，连续签到还有额外奖励；燃币可兑换站长准备的礼物。',
  alternates: { canonical: '/checkin' },
  openGraph: {
    title: '签到有礼 · 领取燃币兑换礼物',
    description: '每天签到领取燃币，连续签到还有额外奖励；燃币可兑换站长准备的礼物。',
    url: '/checkin',
    type: 'website',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: '签到有礼',
  description: '每天签到领取燃币，连续签到还有额外奖励；燃币可兑换站长准备的礼物。',
  url: 'https://2aran.com/checkin',
  inLanguage: 'zh-CN',
}

export default function CheckinPage() {
  return (
    <PageContainer className="py-5 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <CheckinRewardsClient />
    </PageContainer>
  )
}

import DonateContent from './DonateContent'

export const dynamic = 'force-static'

export const metadata = {
  title: '支持本站',
  description: '通过自愿捐助或赞助支持 2aran.com 的内容创作与网站维护。燃币不支持充值，免费领取与补充无需捐助或赞助。',
  alternates: {
    canonical: '/donate',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function DonatePage() {
  return <DonateContent />
}

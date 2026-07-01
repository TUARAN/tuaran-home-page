import DonateContent from './DonateContent'

export const dynamic = 'force-static'

export const metadata = {
  title: '支持本站',
  description: '支持 2aran.com 的内容创作、图床、视频、模型请求、存储和带宽成本；也可以在支持后私聊站长补充燃币。',
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

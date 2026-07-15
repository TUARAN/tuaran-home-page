import NetworkAccessGuideClient from './NetworkAccessGuideClient'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/network-access-guide'

export const metadata = {
  title: '5 个网络加速服务公开信息核验',
  description: '红海 Pro、平行网、脉动云、火烧云、鱼云的当前状态、套餐、协议、节点、公开来源与购买风险横向研究。',
  keywords: ['红海 Pro', '平行网', '脉动云', '火烧云', '鱼云', 'SakanaCloud', '网络加速服务', '公开信息核验'],
  alternates: { canonical: '/network-access-guide' },
  openGraph: {
    type: 'article',
    siteName: '2aran.com',
    title: '5 个网络加速服务：先看证据，再看价格',
    description: '红海 Pro、平行网、脉动云、火烧云、鱼云公开信息横向核验。',
    url: PAGE_URL,
    locale: 'zh_CN',
    images: [{ url: '/images/network-access-guide/og.png', width: 1731, height: 909, alt: '5 个网络加速服务：先看证据，再看价格' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '5 个网络加速服务公开信息核验',
    description: '不做虚构测速，先分清当前状态、信息来源和购买风险。',
    images: ['/images/network-access-guide/og.png'],
  },
}

export default function NetworkAccessGuidePage() {
  return <NetworkAccessGuideClient />
}

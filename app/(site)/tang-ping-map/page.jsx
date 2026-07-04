import TangPingMapClient from './TangPingMapClient'

export const dynamic = 'force-static'

export const metadata = {
  title: '躺平地图 · 低总价房源多维观察',
  description:
    '基于 Tang Ping Map 公开点位整理的低总价房源多维页面：按城市、省份、总价、面积、租金、租售比和地理分布筛选观察。',
  alternates: {
    canonical: '/tang-ping-map',
  },
  openGraph: {
    title: '躺平地图 · 低总价房源多维观察',
    description:
      '121 个低总价房源点位的地图、筛选、排行和回本周期观察。数据源自 Tang Ping Map 公开页面。',
    url: 'https://2aran.com/tang-ping-map',
    type: 'article',
  },
}

export default function TangPingMapPage() {
  return <TangPingMapClient />
}

import ContentPvBeacon from '../components/ContentPvBeacon'
import TapeoutXiangqiClient from './TapeoutXiangqiClient'

export const dynamic = 'force-static'

const title = 'TapeOut 中国象棋上链计划｜公开执行驾驶舱'
const description = '可试玩的中国象棋原型，以及 TapeOut 上链的计划时间、实际时间、过程快照与人机授权边界。'

export const metadata = {
  title,
  description,
  keywords: ['中国象棋', 'TapeOut', 'TapeKit', '链上游戏', 'BNB Chain', '开发日志'],
  alternates: { canonical: '/tapeout-xiangqi' },
  openGraph: {
    type: 'website',
    title,
    description,
    url: 'https://2aran.com/tapeout-xiangqi',
    locale: 'zh_CN',
  },
}

export default function TapeoutXiangqiPage() {
  return (
    <>
      <ContentPvBeacon category="resource" slug="tapeout-xiangqi" />
      <TapeoutXiangqiClient />
    </>
  )
}

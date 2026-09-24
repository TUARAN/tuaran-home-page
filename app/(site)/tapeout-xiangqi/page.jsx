import ContentPvBeacon from '../components/ContentPvBeacon'
import TapeoutXiangqiClient from './TapeoutXiangqiClient'

export const dynamic = 'force-static'

const title = '链上中国象棋｜TapeOut 主网发布记录'
const description = '已运行在 BNB Chain 的中国象棋：公开 TapeID、容器、版本哈希、发布交易、实际支出、过程快照与升级记录。'

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

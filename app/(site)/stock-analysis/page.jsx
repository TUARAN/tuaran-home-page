import Link from 'next/link'
import SnapshotIndexClient from './SnapshotIndexClient'
import { getAllSnapshotsSummary } from './data'

export const dynamic = 'force-static'

export const metadata = {
  title: '交易分析快照库 · 多标的 · 分钟级',
  description:
    '永续合约多维度交易分析快照库（精确到分钟）：每条记录含资金费率、量价背离、均线乖离、关键价格点位、风险信号矩阵与综合风险指数。支持按标的、风险等级、采集时间筛选浏览。',
  keywords: [
    '交易分析',
    '永续合约',
    'Binance',
    '资金费率',
    '量价背离',
    '均线乖离',
    '风险信号',
    '快照库',
    '分钟级',
  ],
  alternates: {
    canonical: '/stock-analysis',
  },
}

export default function StockAnalysisIndexPage() {
  const summaries = getAllSnapshotsSummary()
  return <SnapshotIndexClient summaries={summaries} />
}

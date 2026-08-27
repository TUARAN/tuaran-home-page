import AdminPageGate from '../../components/AdminPageGate'
import SnapshotIndexClient from './SnapshotIndexClient'
import { getAllSnapshotsSummary, getAllWeeklyAdvice } from './data'

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
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function StockAnalysisIndexPage() {
  const summaries = getAllSnapshotsSummary()
  const weeklyAdvices = getAllWeeklyAdvice()
  return (
    <AdminPageGate
      label="交易分析"
      returnTo="/admin/stock-analysis"
      description="交易快照、横向分析与风险信号仅站长本人可见。"
    >
      <SnapshotIndexClient summaries={summaries} weeklyAdvices={weeklyAdvices} />
    </AdminPageGate>
  )
}

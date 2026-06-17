import StockAnalysisClient from './StockAnalysisClient'

export const dynamic = 'force-static'

export const metadata = {
  title: 'LOBSTERUSDT 多维度交易分析',
  description:
    'LOBSTERUSDT 永续合约多维度交易分析：资金费率、量价背离、均线乖离、关键价格点位与风险信号矩阵。',
  keywords: [
    'LOBSTERUSDT',
    '交易分析',
    '永续合约',
    'Binance',
    '资金费率',
    '量价背离',
    '均线乖离',
    '风险信号',
  ],
  alternates: {
    canonical: '/stock-analysis',
  },
}

export default function StockAnalysisPage() {
  return <StockAnalysisClient />
}
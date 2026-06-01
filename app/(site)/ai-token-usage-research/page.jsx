import AiTokenUsageResearchClient from './AiTokenUsageResearchClient'

export const dynamic = 'force-static'

export const metadata = {
  title: 'AI Token 用量与花费强度调研',
  description:
    '日耗 1 亿 / 4.5 亿 tokens（账单口径，含 prompt cache 命中）样本对照：强度尺、账单 vs 净处理双账户、场景画像、cache-aware 定价折算月费、订阅与按量口径对比、效率信号与优化抓手。',
  alternates: {
    canonical: '/ai-token-usage-research',
  },
}

export default function AiTokenUsageResearchPage() {
  return <AiTokenUsageResearchClient />
}

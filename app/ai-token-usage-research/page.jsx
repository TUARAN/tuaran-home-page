import AiTokenUsageResearchClient from './AiTokenUsageResearchClient'

export const dynamic = 'force-static'

export const metadata = {
  title: 'AI Token 用量与花费强度调研',
  description:
    '日耗 1000 万 / 4.5 亿 tokens 两个样本对照：强度尺、文本吞吐换算、场景画像、按真实公开 API 价折算的月度花费、效率信号与优化抓手。',
  alternates: {
    canonical: '/ai-token-usage-research',
  },
}

export default function AiTokenUsageResearchPage() {
  return <AiTokenUsageResearchClient />
}

import AiTokenUsageResearchClient from './AiTokenUsageResearchClient'

export const dynamic = 'force-static'

export const metadata = {
  title: 'AI Token 用量与花费强度调研',
  description:
    '围绕 10B-20B tokens/day 的极端自报样本，拆解可信度校验、行为画像、OpenClaw 公开对照、账单 vs 净处理、vibe coding 能力信号与浪费信号。',
  alternates: {
    canonical: '/ai-token-usage-research',
  },
}

export default function AiTokenUsageResearchPage() {
  return <AiTokenUsageResearchClient />
}

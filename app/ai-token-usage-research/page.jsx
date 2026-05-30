import AiTokenUsageResearchClient from './AiTokenUsageResearchClient'

export const dynamic = 'force-static'

export const metadata = {
  title: 'AI Token 用量与花费强度调研',
  description:
    '基于日耗 1000 万与 4.5 亿 tokens 的样本，给出强度分级、效率评估、预估花费与未来趋势，适用于个人与团队的 AI 使用治理。',
  alternates: {
    canonical: '/ai-token-usage-research',
  },
}

export default function AiTokenUsageResearchPage() {
  return <AiTokenUsageResearchClient />
}

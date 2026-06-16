import AiTokenUsageResearchClient from './AiTokenUsageResearchClient'

export const dynamic = 'force-static'

export const metadata = {
  title: 'AI Token 用量与花费强度调研',
  description:
    '用 0.1B、0.45B、10B、20B tokens/day 四个锚点，对照个人重度使用、极重度自报与 OpenClaw agent-heavy 工作流，拆解成本、可信度和 vibe coding 能力信号。',
  alternates: {
    canonical: '/ai-token-usage-research',
  },
}

export default function AiTokenUsageResearchPage() {
  return <AiTokenUsageResearchClient />
}

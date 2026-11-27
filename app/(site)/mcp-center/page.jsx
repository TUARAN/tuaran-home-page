import RedirectToAgentHub from '../components/RedirectToAgentHub'

export const dynamic = 'force-static'

export const metadata = {
  title: 'MCP 中心',
  description: '已并入智能体应用中心 MCP 分区。',
  alternates: { canonical: '/mcp-center' },
}

export default function McpCenterPage() {
  return <RedirectToAgentHub fallbackHash="#mcp" />
}
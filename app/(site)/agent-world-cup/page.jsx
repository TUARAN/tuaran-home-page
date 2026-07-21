import { permanentRedirect } from 'next/navigation'

// 客户端组件:用 fetch('/api/wc/data') 拉数据,本身不需要 Edge runtime。
// 但 Cloudflare Pages 强制所有非静态路由声明 edge runtime。
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export default function AgentWorldCupPage() {
  permanentRedirect('/archives/agent-world-cup')
}

import WorkbuddyWhitepaperPage from '../WorkbuddyWhitepaperPage'
import { loadWorkbuddyWhitepaper } from '../../../../lib/workbuddyWhitepapers'

export const dynamic = 'force-static'

const slug = 'workbuddy-smart-hardware-whitepaper'
const title = '智能硬件接入 WorkBuddy 白皮书'
const description = '在线阅读 WorkBuddy 智能硬件接入白皮书：涵盖硬件接入价值、六类硬件触点、合作模式、产品能力、OAuth 2.0 授权、API 调用、端到端示例和联合运营。'
const whitepaper = loadWorkbuddyWhitepaper(slug)

export const metadata = {
  title: '智能硬件接入 WorkBuddy 白皮书全文｜合作模式、OAuth 2.0 与 API 接入指南',
  description,
  keywords: ['WorkBuddy 智能硬件接入', '智能硬件接入白皮书', 'WorkBuddy API', 'OAuth 2.0', 'AI Agent 硬件', 'OpenAPI', '硬件合作模式'],
  alternates: { canonical: `/resources/${slug}` },
  openGraph: { type: 'article', title, description, url: `https://2aran.com/resources/${slug}`, locale: 'zh_CN' },
  twitter: { card: 'summary', title, description },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: metadata.title,
  description,
  url: `https://2aran.com/resources/${slug}`,
  inLanguage: 'zh-CN',
  isBasedOn: 'https://www.workbuddy.link/p/JVM0gKdRyl8k9EgElw5TxA',
  mainEntity: {
    '@type': 'CreativeWork',
    name: 'WorkBuddy 智能硬件接入白皮书',
    author: { '@type': 'Organization', name: 'WorkBuddy 开放平台' },
  },
}

export default function WorkBuddySmartHardwareWhitepaperPage() {
  return <WorkbuddyWhitepaperPage slug={slug} title={title} subtitle="合作模式、开放能力与技术接入" description={description} category="AI 与智能硬件" html={whitepaper.html} toc={whitepaper.toc} jsonLd={jsonLd} />
}

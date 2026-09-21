import WorkbuddyWhitepaperPage from '../WorkbuddyWhitepaperPage'
import { loadWorkbuddyWhitepaper } from '../../../../lib/workbuddyWhitepapers'

export const dynamic = 'force-static'

const slug = 'workbuddy-opc-whitepaper'
const title = 'WorkBuddy OPC 白皮书'
const description = '在线阅读 WorkBuddy OPC 白皮书：梳理 AI 时代一人公司（One Person Company）的商业模式、超级个体、国内扶持政策、AI 工作台与实际案例。'
const whitepaper = loadWorkbuddyWhitepaper(slug)

export const metadata = {
  title: 'WorkBuddy OPC 白皮书全文｜AI 一人公司商业模式、政策与实战案例',
  description,
  keywords: ['WorkBuddy OPC 白皮书', 'OPC 一人公司', 'AI 一人公司', '超级个体', '一人公司商业模式', 'WorkBuddy'],
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
  isBasedOn: 'https://www.workbuddy.link/p/FVCdAodl3HBHMMPypCogBi',
  mainEntity: {
    '@type': 'CreativeWork',
    name: 'WorkBuddy OPC 白皮书：AI 时代一人公司的商业与技术重构',
    author: { '@type': 'Organization', name: 'WorkBuddy' },
  },
}

export default function WorkBuddyOpcWhitepaperPage() {
  return <WorkbuddyWhitepaperPage slug={slug} title={title} subtitle="AI 时代一人公司的商业与技术重构" description={description} category="AI 与商业" html={whitepaper.html} toc={whitepaper.toc} jsonLd={jsonLd} />
}

import GlobalAiGovernanceClient from './GlobalAiGovernanceClient'

export const dynamic = 'force-static'

const PAGE_URL = 'https://2aran.com/global-ai-governance'
const TITLE = '全球 AI 治理平台与机制全景图'
const DESCRIPTION = '从西方先发平台、联合国体系、全球南方到区域协作，横向比较 14 个 AI 治理组织、进程、战略与研究网络。'

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/global-ai-governance' },
  openGraph: {
    type: 'article',
    siteName: '2aran.com',
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    publishedTime: '2026-07-17T00:00:00.000+08:00',
    modifiedTime: '2026-07-17T00:00:00.000+08:00',
    authors: ['涂阿燃 / Tuaran'],
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    creator: '@Anthony404',
    site: '@Anthony404',
  },
}

export default function GlobalAiGovernancePage() {
  return <GlobalAiGovernanceClient />
}

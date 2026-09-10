import CryptoResearchClient from './CryptoResearchClient'
import { CRYPTO_RESEARCH_TEMPLATE_VERSION } from '../../../lib/cryptoResearchCore'
import { listRuntimeResearchByCategory } from '../../../lib/researchRuntime'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { isCryptoAssetObservation } from '../../../lib/research/shareTitle'
import { RESEARCH_STYLE_TEMPLATES } from '../../../lib/researchStyleTemplates'

export const metadata = {
  title: '加密调研 · 每天一个加密资产',
  description: '按市值依次观察加密资产，梳理背景、发展、技术、用途、代币经济、治理、安全与风险。',
  alternates: { canonical: '/crypto-research' },
}

function identityOf(entry) {
  const match = entry.title.match(/——\s*([^（(]+)[（(]([^）)]+)[）)]/)
  return { name: match?.[1]?.trim() || entry.title, symbol: match?.[2]?.trim() || '' }
}

export default async function CryptoResearchPage() {
  const activeStyle = RESEARCH_STYLE_TEMPLATES.find((template) => template.status === 'active')
    || RESEARCH_STYLE_TEMPLATES[0]
  const items = (await listRuntimeResearchByCategory('topics')).filter(isCryptoAssetObservation).map((entry) => {
    const identity = identityOf(entry)
    return {
      id: entry.slug, ...identity, symbol: entry.symbol || identity.symbol, rank: entry.marketCapRank,
      date: entry.date, dateLabel: entry.dateLabel || entry.date, summary: entry.tldr || entry.summary,
      tags: entry.tags.filter((tag) => tag !== '加密资产' && tag !== identity.name && tag !== identity.symbol).slice(0, 3),
      readingMinutes: entry.readingMinutes, href: `/articles/research/topics/${entry.slug}`,
    }
  })
  return (
    <CryptoResearchClient
      items={items}
      researchMethod={{
        templateVersion: CRYPTO_RESEARCH_TEMPLATE_VERSION,
        styleLabel: activeStyle.label,
        styleSummary: activeStyle.summary,
        principles: activeStyle.principles.slice(0, 3),
      }}
    />
  )
}

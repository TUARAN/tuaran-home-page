import AShareResearchClient from './AShareResearchClient'
import { listResearch } from '../../../lib/research/loader'

export const metadata = {
  title: 'A股调研 · 每天一家上市公司',
  description: '每天观察一家 A 股上市公司，梳理业务、财务、治理、估值与主要风险。',
  alternates: { canonical: '/a-share-research' },
}

function stockCodeOf(entry) {
  return entry.slug.match(/(?:^|-)a-share-(\d{6})(?:$|-)/)?.[1]
    || entry.title.match(/[（(](\d{6})[）)]/)?.[1]
    || ''
}

function companyNameOf(entry, stockCode) {
  const match = entry.title.match(/——\s*([^（(]+)[（(]\d{6}[）)]/)
  if (match?.[1]) return match[1].trim()
  return entry.title
    .replace(/^阿燃调研[：:]\s*/, '')
    .replace(/^每天一家\s*A\s*股上市公司\s*——\s*/i, '')
    .replace(new RegExp(`[（(]${stockCode}[）)].*$`), '')
    .trim()
}

function exchangeOf(code) {
  if (/^(4|8|92)/.test(code)) return '北交所'
  if (/^(5|6|9)/.test(code)) return '上交所'
  if (/^(0|1|2|3)/.test(code)) return '深交所'
  return 'A股'
}

export default function AShareResearchPage() {
  const items = listResearch()
    .filter((entry) => entry.category === 'companies' && (entry.companyType === 'a_share' || entry.slug.includes('a-share-')))
    .map((entry) => {
      const stockCode = stockCodeOf(entry)
      return {
        id: entry.slug,
        company: companyNameOf(entry, stockCode),
        stockCode,
        exchange: exchangeOf(stockCode),
        date: entry.date,
        dateLabel: entry.dateLabel || entry.date,
        summary: entry.tldr || entry.summary,
        tags: entry.tags.filter((tag) => tag !== 'A股').slice(0, 3),
        readingMinutes: entry.readingMinutes,
        href: `/articles/research/companies/${entry.slug}`,
      }
    })

  return <AShareResearchClient items={items} />
}

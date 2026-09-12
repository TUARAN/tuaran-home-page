import { CATEGORY_META, COMPANY_TYPE_META, TOPIC_TYPE_META, PEOPLE_TYPE_META, TECH_TYPE_META } from './research/categories'
import { taxonomyForResearch } from './contentTaxonomy'
import { researchPublicSummary } from './researchPublicSummary'

export function researchKnowledgeItem(entry) {
    const baseLabel = entry.contentTypeLabel || CATEGORY_META[entry.category]?.label || entry.category
    const companyLabel = entry.companyType && COMPANY_TYPE_META[entry.companyType]?.label
    const topicLabel = entry.topicType && TOPIC_TYPE_META[entry.topicType]?.label
    const peopleLabel = entry.peopleType && PEOPLE_TYPE_META[entry.peopleType]?.label
    const techLabel = entry.techType && TECH_TYPE_META[entry.techType]?.label
    const subLabel = [companyLabel, techLabel, topicLabel, peopleLabel].find((label) => label && label !== baseLabel)
    return {
      id: `research:${entry.category}:${entry.slug}`,
      kind: entry.category, // 'companies' | 'topics' | 'people'
      tagLabel: subLabel ? `${baseLabel} · ${subLabel}` : baseLabel,
      companyType: entry.companyType || '',
      topicType: entry.topicType || '',
      peopleType: entry.peopleType || '',
      techType: entry.techType || '',
      contentType: entry.contentType || 'analysis',
      ...taxonomyForResearch(entry),
      reviewReady: entry.reviewReady || false,
      version: entry.version || '',
      title: entry.title,
      summary: researchPublicSummary(entry),
      date: entry.date,
      dateLabel: entry.dateLabel || entry.date,
      sortKey: entry.sortKey,
      readingMinutes: entry.readingMinutes,
      pv: entry.pv || 0,
      pvKey: `${entry.category}/${entry.slug}`,
      hasAssessment: entry.hasAssessment || false,
      encrypted: entry.encrypted,
      image: entry.images?.[0] || null,
      href: `/articles/research/${entry.category}/${entry.slug}`,
    }
}
